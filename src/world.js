// OLDHOLM — world.js
// Chunked heightfield terrain on a 1-unit tile grid, tile collision flags,
// and the built environment (castle, bridge, trees) for a region definition.
//
// Planes: plane 0 is the terrain. Higher planes are building floors — sparse
// per-tile maps of {h, blocked}; a tile absent from a plane's map is air
// (blocked). Stairs and ladders are interactables that teleport between
// planes, per the spec.

import * as THREE from 'three';
import { ITEMS } from '../data/items.js';

export const FLAG_BLOCKED = 1;
export const FLAG_WATER = 2;

const CHUNK = 16;
// One shoreline for both collision and color: tiles whose center sits below
// waterLevel + WATER_EPS are water-flagged AND bed-colored, so the visual
// boundary and the collision boundary always coincide.
const WATER_EPS = 0.12;

// ---------------------------------------------------------------------------
// deterministic helpers

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(seed, x, z) {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function makeValueNoise(seed) {
  const smooth = (t) => t * t * (3 - 2 * t);
  return function (x, z) {
    const x0 = Math.floor(x), z0 = Math.floor(z);
    const fx = smooth(x - x0), fz = smooth(z - z0);
    const a = hash2(seed, x0, z0), b = hash2(seed, x0 + 1, z0);
    const c = hash2(seed, x0, z0 + 1), d = hash2(seed, x0 + 1, z0 + 1);
    return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

function distToSegment(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const len2 = dx * dx + dz * dz;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = clamp(t, 0, 1);
  const cx = x1 + dx * t, cz = z1 + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

// ---------------------------------------------------------------------------

export class World {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.size = def.size;
    this.heights = new Float32Array((this.size + 1) * (this.size + 1));
    this.flags = new Uint8Array(this.size * this.size);
    this.overrides = new Map(); // "tx,tz" -> { h, blocked } (bridge deck, etc.)
    this.planes = [null];       // planes[1..] = { tiles: Map("tx,tz"->{h,blocked}), fallbackH }
    this.interactables = [];    // registry read by interact.js
    this.raycastTargets = [];   // meshes with userData.interactable
    this.occluders = [];        // solid meshes that block targeting rays (walls, terrain)
    this.pickPool = [];         // raycastTargets ∪ occluders, kept deduplicated
    this.group = new THREE.Group();
    this.group.name = 'world:' + def.id;
    scene.add(this.group);

    this._noise = makeValueNoise(def.seed);
    this._rng = mulberry32(def.seed ^ 0x9e3779b9);

    this._buildHeights();
    this._computeBridgeSpan();
    this._flattenBridgeApproaches();
    this._computeFlags();
    this._applyBridgeOverrides();
    this._buildCastle();      // marks its own blocked tiles; builds keep planes
    this._buildChunks();
    this._buildWater();
    this._buildBridgeMeshes();
    this._plantTrees();
    this._buildFurniture();
    this._spawnGroundItems();
    this._rebuildPickPool();
  }

  _rebuildPickPool() {
    this.pickPool = [...new Set([...this.raycastTargets, ...this.occluders])];
  }

  onTick(tick) {
    // Nothing in the Holmbridge environment reacts to ticks yet; resource
    // respawns and mob movement hook in here in later phases.
  }

  // ---- queries ------------------------------------------------------------

  riverCenter(z) {
    const r = this.def.river;
    let c = r.centerX;
    for (const [amp, freq, phase] of r.meander) c += amp * Math.sin(z * freq + phase);
    return c;
  }

  cornerHeight(cx, cz) {
    cx = clamp(cx, 0, this.size); cz = clamp(cz, 0, this.size);
    return this.heights[cz * (this.size + 1) + cx];
  }

  /** Register a building floor; returns its plane index. */
  addPlane(fallbackH) {
    this.planes.push({ tiles: new Map(), fallbackH });
    return this.planes.length - 1;
  }

  setPlaneTile(plane, tx, tz, h, blocked = false) {
    this.planes[plane].tiles.set(tx + ',' + tz, { h, blocked });
  }

  /** Ground height at a world position (decks/floors override the terrain). */
  getGroundHeight(x, z, plane = 0) {
    const tx = Math.floor(x), tz = Math.floor(z);
    if (plane > 0) {
      const p = this.planes[plane];
      const t = p.tiles.get(tx + ',' + tz);
      return t ? t.h : p.fallbackH;
    }
    const ov = this.overrides.get(tx + ',' + tz);
    if (ov) return ov.h;
    const x0 = clamp(Math.floor(x), 0, this.size - 1);
    const z0 = clamp(Math.floor(z), 0, this.size - 1);
    const fx = clamp(x - x0, 0, 1), fz = clamp(z - z0, 0, 1);
    const h00 = this.cornerHeight(x0, z0), h10 = this.cornerHeight(x0 + 1, z0);
    const h01 = this.cornerHeight(x0, z0 + 1), h11 = this.cornerHeight(x0 + 1, z0 + 1);
    return (h00 + (h10 - h00) * fx) * (1 - fz) + (h01 + (h11 - h01) * fx) * fz;
  }

  /** Tile-truth collision: is this tile a blocker? Out of bounds (or off a floor) is a wall. */
  isBlocked(tx, tz, plane = 0) {
    if (tx < 0 || tz < 0 || tx >= this.size || tz >= this.size) return true;
    if (plane > 0) {
      const t = this.planes[plane].tiles.get(tx + ',' + tz);
      return !t || t.blocked;
    }
    const ov = this.overrides.get(tx + ',' + tz);
    if (ov) return ov.blocked;
    return (this.flags[tz * this.size + tx] & FLAG_BLOCKED) !== 0;
  }

  setTileBlocked(tx, tz, blocked) { // dynamic blockers (doors)
    if (tx < 0 || tz < 0 || tx >= this.size || tz >= this.size) return;
    const i = tz * this.size + tx;
    if (blocked) this.flags[i] |= FLAG_BLOCKED;
    else this.flags[i] &= ~FLAG_BLOCKED;
  }

  /** Register something the crosshair can target. Every entry has an examine line. */
  addInteractable(entry) {
    this.interactables.push(entry);
    for (const m of entry.meshes) {
      m.userData.interactable = entry;
      this.raycastTargets.push(m);
    }
    this._rebuildPickPool();
    return entry;
  }

  removeInteractable(entry) {
    this.interactables = this.interactables.filter((e) => e !== entry);
    this.raycastTargets = this.raycastTargets.filter((m) => m.userData.interactable !== entry);
    for (const m of entry.meshes) {
      this.group.remove(m);
      if (m.geometry) m.geometry.dispose();
    }
    this._rebuildPickPool();
  }

  isWater(tx, tz) {
    if (tx < 0 || tz < 0 || tx >= this.size || tz >= this.size) return false;
    return (this.flags[tz * this.size + tx] & FLAG_WATER) !== 0;
  }

  markBlockedRect(tx0, tz0, tx1, tz1) {
    for (let tz = tz0; tz <= tz1; tz++)
      for (let tx = tx0; tx <= tx1; tx++)
        if (tx >= 0 && tz >= 0 && tx < this.size && tz < this.size)
          this.flags[tz * this.size + tx] |= FLAG_BLOCKED;
  }

  markBlockedCircle(x, z, r) {
    for (let tz = Math.floor(z - r); tz <= Math.floor(z + r); tz++)
      for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) {
        if (tx < 0 || tz < 0 || tx >= this.size || tz >= this.size) continue;
        if (Math.hypot(tx + 0.5 - x, tz + 0.5 - z) < r)
          this.flags[tz * this.size + tx] |= FLAG_BLOCKED;
      }
  }

  // ---- terrain ------------------------------------------------------------

  _buildHeights() {
    const d = this.def, size = this.size, n = this._noise;
    const r = d.river, c = d.castle;
    for (let cz = 0; cz <= size; cz++) {
      for (let cx = 0; cx <= size; cx++) {
        let h = d.baseHeight;
        for (const [freq, amp] of d.noise.octaves)
          h += (n(cx * freq + 31.7, cz * freq + 17.3) - 0.5) * 2 * amp;

        // rim hills so the region reads as a valley, not a table edge
        const edge = Math.min(cx, cz, size - cx, size - cz);
        if (edge < d.rim.width) {
          const t = 1 - edge / d.rim.width;
          h += t * t * d.rim.height;
        }

        // swamp sinks toward (and below) the water line in the south
        if (d.swamp) {
          const t = smoothstep((cz - d.swamp.zStart) / d.swamp.fade);
          h -= t * (d.swamp.sink + n(cx * 0.07 + 53.1, cz * 0.07 + 91.7) * d.swamp.sinkVar);
        }

        // carve the river channel — fading the carve out near the border so the
        // river springs from a cleft in the rim hills instead of cutting a
        // window through them to the raw world edge
        const dist = Math.abs(cx - this.riverCenter(cz));
        const half = r.width / 2;
        if (dist < half + r.falloff) {
          const bed = d.waterLevel - r.depth + n(cx * 0.2 + 5.5, cz * 0.2 + 5.5) * 0.35;
          const carved = lerp(bed, h, smoothstep((dist - half) / r.falloff));
          h = lerp(h, carved, smoothstep(edge / (d.rim.width + 4)));
        }

        // castle plateau
        const dx = Math.max(c.x0 - cx, cx - c.x1, 0);
        const dz = Math.max(c.z0 - cz, cz - c.z1, 0);
        const dd = Math.max(dx, dz);
        if (dd < c.flattenMargin)
          h = lerp(c.plateauH, h, smoothstep(dd / c.flattenMargin));

        this.heights[cz * (size + 1) + cx] = h;
      }
    }
  }

  _computeBridgeSpan() {
    const b = this.def.bridge, r = this.def.river;
    // The deck's z-extent is derived entirely from walkRows/railRows —
    // the rows drive collision, meshes, and terrain shaping alike.
    const rows = [...b.walkRows, ...b.railRows];
    this.bridgeZ0 = Math.min(...rows);        // first deck tile row
    this.bridgeZ1 = Math.max(...rows) + 1;    // corner bound past the last row
    this.bridgeZC = (this.bridgeZ0 + this.bridgeZ1) / 2;
    let cMin = Infinity, cMax = -Infinity;
    for (let z = this.bridgeZ0 - 0.5; z <= this.bridgeZ1 + 0.5; z += 0.5) {
      const cc = this.riverCenter(z);
      cMin = Math.min(cMin, cc); cMax = Math.max(cMax, cc);
    }
    const half = r.width / 2 + r.falloff * 0.5; // reach past the channel onto the low banks
    this.bridgeX0 = Math.floor(cMin - half - b.margin);
    this.bridgeX1 = Math.ceil(cMax + half + b.margin);
  }

  _flattenBridgeApproaches() {
    const d = this.def, b = d.bridge, size = this.size;
    const target = b.deckH - 0.08;
    const halfDepth = (this.bridgeZ1 - this.bridgeZ0) / 2;
    for (let cz = this.bridgeZ0 - 1; cz <= this.bridgeZ1 + 1; cz++) {
      const zw = 1 - clamp((Math.abs(cz - this.bridgeZC) - halfDepth) / 2, 0, 1);
      if (zw <= 0) continue;
      for (let cx = this.bridgeX0 - b.approach; cx <= this.bridgeX1 + b.approach; cx++) {
        if (cx < 0 || cx > size || cz < 0 || cz > size) continue;
        let w = 0;
        if (cx <= this.bridgeX0) w = 1 - clamp((this.bridgeX0 - cx) / b.approach, 0, 1);
        else if (cx >= this.bridgeX1) w = 1 - clamp((cx - this.bridgeX1) / b.approach, 0, 1);
        else continue; // under the deck itself the river stays carved
        const i = cz * (size + 1) + cx;
        this.heights[i] = lerp(this.heights[i], target, w * zw);
      }
    }
  }

  _computeFlags() {
    const d = this.def, size = this.size;
    for (let tz = 0; tz < size; tz++) {
      for (let tx = 0; tx < size; tx++) {
        const h00 = this.cornerHeight(tx, tz), h10 = this.cornerHeight(tx + 1, tz);
        const h01 = this.cornerHeight(tx, tz + 1), h11 = this.cornerHeight(tx + 1, tz + 1);
        const center = (h00 + h10 + h01 + h11) / 4;
        let f = 0;
        if (center < d.waterLevel + WATER_EPS) f |= FLAG_WATER | FLAG_BLOCKED;
        const hi = Math.max(h00, h10, h01, h11), lo = Math.min(h00, h10, h01, h11);
        if (hi - lo > 1.35) f |= FLAG_BLOCKED; // cliff
        // the outermost two rings are the region boundary
        if (tx < 2 || tz < 2 || tx >= size - 2 || tz >= size - 2) f |= FLAG_BLOCKED;
        this.flags[tz * size + tx] = f;
      }
    }
  }

  _applyBridgeOverrides() {
    const b = this.def.bridge;
    for (let tx = this.bridgeX0; tx < this.bridgeX1; tx++) {
      for (const tz of b.walkRows) this.overrides.set(tx + ',' + tz, { h: b.deckH, blocked: false });
      for (const tz of b.railRows) this.overrides.set(tx + ',' + tz, { h: b.deckH, blocked: true });
    }
  }

  // ---- visuals: terrain chunks + water ------------------------------------

  _tileColor(tx, tz, centerH, out) {
    const d = this.def, c = d.castle;
    const v = (hash2(d.seed ^ 0x51ab, tx, tz) - 0.5) * 0.06;

    // castle bailey floor (flagstones), including under the walls
    if (tx >= c.x0 && tx < c.x1 && tz >= c.z0 && tz < c.z1) {
      out[0] = 0.46 + v; out[1] = 0.48 + v; out[2] = 0.45 + v;
      return;
    }
    if (centerH < d.waterLevel + WATER_EPS) { // river/pool bed — matches the blocked threshold
      out[0] = 0.27 + v; out[1] = 0.30 + v; out[2] = 0.22 + v;
      return;
    }
    if (centerH < d.waterLevel + 0.5) { // wet bank
      out[0] = 0.52 + v; out[1] = 0.50 + v; out[2] = 0.36 + v;
      return;
    }
    if (this._roadDist(tx + 0.5, tz + 0.5) < 1.4) { // worn dirt road
      out[0] = 0.50 + v; out[1] = 0.43 + v; out[2] = 0.30 + v;
      return;
    }
    // grass, with large dry patches and the swamp darkening southward
    const patch = this._noise(tx * 0.03 + 71.3, tz * 0.03 + 44.9);
    let rr = lerp(0.38, 0.50, patch * 0.6) + v;
    let gg = lerp(0.50, 0.53, patch * 0.6) + v;
    let bb = lerp(0.28, 0.33, patch * 0.6) + v;
    if (d.swamp) {
      const t = smoothstep((tz - d.swamp.zStart) / d.swamp.fade) * 0.8;
      rr = lerp(rr, 0.30, t); gg = lerp(gg, 0.36, t); bb = lerp(bb, 0.26, t);
    }
    out[0] = rr; out[1] = gg; out[2] = bb;
  }

  _roadDist(px, pz) {
    let best = Infinity;
    for (const [x1, z1, x2, z2] of this.def.roads)
      best = Math.min(best, distToSegment(px, pz, x1, z1, x2, z2));
    return best;
  }

  _buildChunks() {
    const size = this.size, chunks = size / CHUNK;
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const tileCol = [0, 0, 0];
    // The palette in _tileColor is authored in sRGB; convert once into the
    // renderer's linear working space so vertex colors match hex-authored
    // material/fog colors instead of rendering ~1.5 stops washed out.
    const srgb = new THREE.Color();
    for (let ccz = 0; ccz < chunks; ccz++) {
      for (let ccx = 0; ccx < chunks; ccx++) {
        const pos = new Float32Array(CHUNK * CHUNK * 6 * 3);
        const col = new Float32Array(CHUNK * CHUNK * 6 * 3);
        let i = 0;
        for (let tz = ccz * CHUNK; tz < (ccz + 1) * CHUNK; tz++) {
          for (let tx = ccx * CHUNK; tx < (ccx + 1) * CHUNK; tx++) {
            const h00 = this.cornerHeight(tx, tz), h10 = this.cornerHeight(tx + 1, tz);
            const h01 = this.cornerHeight(tx, tz + 1), h11 = this.cornerHeight(tx + 1, tz + 1);
            this._tileColor(tx, tz, (h00 + h10 + h01 + h11) / 4, tileCol);
            srgb.setRGB(tileCol[0], tileCol[1], tileCol[2], THREE.SRGBColorSpace);
            // two upward-facing triangles per tile: (A,C,B) and (B,C,D)
            const verts = [
              tx, h00, tz,       tx, h01, tz + 1,   tx + 1, h10, tz,
              tx + 1, h10, tz,   tx, h01, tz + 1,   tx + 1, h11, tz + 1,
            ];
            for (let k = 0; k < 18; k += 3) {
              pos[i] = verts[k]; pos[i + 1] = verts[k + 1]; pos[i + 2] = verts[k + 2];
              col[i] = srgb.r; col[i + 1] = srgb.g; col[i + 2] = srgb.b;
              i += 3;
            }
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.computeVertexNormals(); // non-indexed => true per-face normals
        const mesh = new THREE.Mesh(geo, mat);
        mesh.matrixAutoUpdate = false;
        this.group.add(mesh);
        this.occluders.push(mesh); // terrain blocks targeting rays
      }
    }
  }

  _buildWater() {
    const d = this.def, size = this.size;
    const geo = new THREE.PlaneGeometry(size, size);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshLambertMaterial({
      color: 0x35594e, transparent: true, opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(size / 2, d.waterLevel, size / 2);
    this.group.add(mesh);
    this.water = mesh;
  }

  // ---- castle ---------------------------------------------------------------

  _addBox(w, h, dpt, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, dpt), mat);
    mesh.position.set(x, y, z);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    this.group.add(mesh);
    this.occluders.push(mesh);
    return mesh;
  }

  _buildCastle() {
    const c = this.def.castle;
    const base = c.plateauH;
    const stone = new THREE.MeshLambertMaterial({ color: 0x99998f, flatShading: true });
    const darkStone = new THREE.MeshLambertMaterial({ color: 0x7c7c74, flatShading: true });

    const wallH = c.wallH, sink = 0.5;
    const wallY = base - sink + (wallH + sink) / 2;
    const midX = (c.x0 + c.x1) / 2, midZ = (c.z0 + c.z1) / 2;
    const spanX = c.x1 - c.x0, spanZ = c.z1 - c.z0;

    // north & south walls (full width)
    this._addBox(spanX, wallH + sink, 1, midX, wallY, c.z0 + 0.5, stone);
    this._addBox(spanX, wallH + sink, 1, midX, wallY, c.z1 - 0.5, stone);
    this.markBlockedRect(c.x0, c.z0, c.x1 - 1, c.z0);
    this.markBlockedRect(c.x0, c.z1 - 1, c.x1 - 1, c.z1 - 1);

    // west wall (between the corner rows)
    this._addBox(1, wallH + sink, spanZ - 2, c.x0 + 0.5, wallY, midZ, stone);
    this.markBlockedRect(c.x0, c.z0 + 1, c.x0, c.z1 - 2);

    // east wall with the gate gap
    const g = c.gate;
    const aLen = g.z0 - (c.z0 + 1);                    // rows z0+1 .. g.z0-1
    const bLen = (c.z1 - 1) - (g.z1 + 1);              // rows g.z1+1 .. z1-2
    this._addBox(1, wallH + sink, aLen, c.x1 - 0.5, wallY, c.z0 + 1 + aLen / 2, stone);
    this._addBox(1, wallH + sink, bLen, c.x1 - 0.5, wallY, g.z1 + 1 + bLen / 2, stone);
    this.markBlockedRect(c.x1 - 1, c.z0 + 1, c.x1 - 1, g.z0 - 1);
    this.markBlockedRect(c.x1 - 1, g.z1 + 1, c.x1 - 1, c.z1 - 2);
    // lintel above the gate — walk beneath it
    const gateLen = g.z1 - g.z0 + 1;
    this._addBox(1, wallH - 3, gateLen, c.x1 - 0.5, base + 3 + (wallH - 3) / 2, g.z0 + gateLen / 2, stone);

    // corner towers
    for (const [txx, tzz] of [[c.x0 + 0.5, c.z0 + 0.5], [c.x1 - 0.5, c.z0 + 0.5],
                              [c.x0 + 0.5, c.z1 - 0.5], [c.x1 - 0.5, c.z1 - 0.5]]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 7.5, 9), darkStone);
      tower.position.set(txx, base - sink + 3.75, tzz);
      tower.matrixAutoUpdate = false; tower.updateMatrix();
      this.group.add(tower);
      this.occluders.push(tower);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.8, 9), stone);
      cap.position.set(txx, base + 7.2, tzz);
      cap.matrixAutoUpdate = false; cap.updateMatrix();
      this.group.add(cap);
      this.markBlockedCircle(txx, tzz, 2.4);
    }

    // merlons along the wall tops (one instanced mesh)
    const merlonPts = [];
    for (let x = c.x0 + 1.2; x <= c.x1 - 1.2; x += 1.5) {
      merlonPts.push([x, c.z0 + 0.5], [x, c.z1 - 0.5]);
    }
    for (let z = c.z0 + 3; z <= c.z1 - 3; z += 1.5) {
      merlonPts.push([c.x0 + 0.5, z]);
      if (z < g.z0 - 0.5 || z > g.z1 + 1.5) merlonPts.push([c.x1 - 0.5, z]);
    }
    const merlons = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.5, 0.55, 0.5), stone, merlonPts.length);
    const m4 = new THREE.Matrix4();
    merlonPts.forEach(([mx, mz], idx) => {
      m4.makeTranslation(mx, base + wallH + 0.27, mz);
      merlons.setMatrixAt(idx, m4);
    });
    merlons.frustumCulled = false;
    this.group.add(merlons);

    // the keep — hollow, three levels (built by its own method)
    this._buildKeep(c);
  }

  /**
   * The keep: ground floor (plane 0), upper floor (plane 1), roof terrace
   * (plane 2). Conventions: door in the middle of the east wall, staircase
   * along the north interior wall (NW), roof ladder in the NE corner.
   */
  _buildKeep(c) {
    const k = c.keep, base = c.plateauH;
    const stone = new THREE.MeshLambertMaterial({ color: 0x99998f, flatShading: true });
    const darkStone = new THREE.MeshLambertMaterial({ color: 0x7c7c74, flatShading: true });
    const dark = new THREE.MeshLambertMaterial({ color: 0x2e2a24 });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd8b13a });

    const kw = k.x1 - k.x0, kd = k.z1 - k.z0;
    const kx = (k.x0 + k.x1) / 2, kz = (k.z0 + k.z1) / 2;
    const wallH = k.wallH, sink = 0.3;
    const wy = base - sink + (wallH + sink) / 2;
    const doorRow = Math.floor(kz); // east-wall door tile row (center of the wall)

    // shell walls (0.9 thick, on the perimeter ring tiles)
    this._addBox(kw, wallH + sink, 0.9, kx, wy, k.z0 + 0.5, stone);           // north
    this._addBox(kw, wallH + sink, 0.9, kx, wy, k.z1 - 0.5, stone);           // south
    this._addBox(0.9, wallH + sink, kd - 2, k.x0 + 0.5, wy, kz, stone);       // west
    const eA = doorRow - (k.z0 + 1);                                           // east, north of door
    const eB = (k.z1 - 1) - (doorRow + 1);                                     // east, south of door
    this._addBox(0.9, wallH + sink, eA, k.x1 - 0.5, wy, k.z0 + 1 + eA / 2, stone);
    this._addBox(0.9, wallH + sink, eB, k.x1 - 0.5, wy, doorRow + 1 + eB / 2, stone);
    this._addBox(0.9, wallH - 2.6, 1, k.x1 - 0.5, base + 2.6 + (wallH - 2.6) / 2, doorRow + 0.5, stone);
    // perimeter collision (door tile stays dynamic)
    this.markBlockedRect(k.x0, k.z0, k.x1 - 1, k.z0);
    this.markBlockedRect(k.x0, k.z1 - 1, k.x1 - 1, k.z1 - 1);
    this.markBlockedRect(k.x0, k.z0 + 1, k.x0, k.z1 - 2);
    this.markBlockedRect(k.x1 - 1, k.z0 + 1, k.x1 - 1, doorRow - 1);
    this.markBlockedRect(k.x1 - 1, doorRow + 1, k.x1 - 1, k.z1 - 2);

    // upper-floor slab (= ground-floor ceiling) and roof slab
    const floorY = base + k.floorH;
    this._addBox(kw - 1.1, 0.22, kd - 1.1, kx, floorY - 0.11, kz, wood);
    const roofY = base + wallH + 0.3;
    this._addBox(kw + 0.6, 0.3, kd + 0.6, kx, roofY - 0.15, kz, darkStone);
    // roof parapet fills the ring tiles (collision face == visible face)
    this._addBox(kw, 0.85, 1.0, kx, roofY + 0.425, k.z0 + 0.5, stone);
    this._addBox(kw, 0.85, 1.0, kx, roofY + 0.425, k.z1 - 0.5, stone);
    this._addBox(1.0, 0.85, kd - 2, k.x0 + 0.5, roofY + 0.425, kz, stone);
    this._addBox(1.0, 0.85, kd - 2, k.x1 - 0.5, roofY + 0.425, kz, stone);
    // roof merlons
    const pts = [];
    for (let x = k.x0 + 1; x <= k.x1 - 1; x += 1.4) pts.push([x, k.z0 + 0.5], [x, k.z1 - 0.5]);
    for (let z = k.z0 + 2; z <= k.z1 - 2; z += 1.4) pts.push([k.x0 + 0.5, z], [k.x1 - 0.5, z]);
    const merlons = new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 0.5, 0.45), stone, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(([mx, mz], i) => { m4.makeTranslation(mx, roofY + 0.85 + 0.25, mz); merlons.setMatrixAt(i, m4); });
    merlons.frustumCulled = false;
    this.group.add(merlons);
    // banner of Aurel, now flown from the roof terrace
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 5), darkStone);
    pole.position.set(kx, roofY + 1.5, kz - 2);
    this.group.add(pole);
    this._addBox(0.8, 0.5, 0.06, kx + 0.45, roofY + 2.6, kz - 2, gold);
    // upper-floor windows (dark insets) on the east, south, and west faces
    for (const wz of [doorRow - 1.5, doorRow + 2.5])
      this._addBox(0.2, 1.0, 0.7, k.x1 - 0.03, base + 4.5, wz, dark);
    for (const wx of [kx - 3, kx + 3]) {
      this._addBox(0.7, 1.0, 0.2, wx, base + 4.5, k.z1 - 0.03, dark);
      this._addBox(0.7, 1.0, 0.2, wx, base + 4.5, k.z0 + 0.03, dark);
    }
    this._addBox(0.2, 1.0, 0.7, k.x0 + 0.03, base + 4.5, kz, dark);

    // walkable plane maps: interior 12x8 on both upper levels
    const pFloor = this.addPlane(floorY);
    const pRoof = this.addPlane(roofY);
    this.keepPlanes = { floor: pFloor, roof: pRoof };
    for (let tz = k.z0 + 1; tz <= k.z1 - 2; tz++)
      for (let tx = k.x0 + 1; tx <= k.x1 - 2; tx++) {
        this.setPlaneTile(pFloor, tx, tz, floorY);
        this.setPlaneTile(pRoof, tx, tz, roofY);
      }
    // the stairwell opening is a hole in the upper floor — blocked, banister on its edge
    for (let tx = k.x0 + 1; tx <= k.x0 + 4; tx++)
      this.setPlaneTile(pFloor, tx, k.z0 + 1, floorY, true);

    // ---- the door (hinged, opens inward) ----
    const doorTile = { x: k.x1 - 1, z: doorRow };
    this.setTileBlocked(doorTile.x, doorTile.z, true); // starts closed
    const hinge = new THREE.Group();
    hinge.position.set(k.x1 - 0.5, base, doorRow + 0.02);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.98), wood);
    panel.position.set(0, 1.25, 0.49);
    hinge.add(panel);
    this.group.add(hinge);
    const door = { open: false };
    this.addInteractable({
      kind: 'door', name: 'Door', meshes: [panel],
      examine: 'Solid oak. It judges visitors silently.',
      actions: [{
        label: () => (door.open ? 'Close' : 'Open'),
        fn: (ctx) => {
          door.open = !door.open;
          hinge.rotation.y = door.open ? -Math.PI / 2 : 0;
          this.setTileBlocked(doorTile.x, doorTile.z, !door.open);
          ctx.ui.chat.add(door.open ? 'The door creaks open.' : 'You close the door.');
        },
      }],
    });

    // ---- staircase: ground floor <-> upper floor (teleporting, per spec) ----
    const stepMeshes = [];
    for (let i = 0; i < 6; i++) {
      const h = 0.45 * (i + 1);
      stepMeshes.push(this._addBox(0.55, h, 1.0, k.x0 + 1.6 + i * 0.55, base + h / 2, k.z0 + 1.5, darkStone));
    }
    this.markBlockedRect(k.x0 + 1, k.z0 + 1, k.x0 + 4, k.z0 + 1); // tiles under the steps
    const stairTop = { x: k.x0 + 3.2, z: k.z0 + 2.7 };            // arrival spot on both levels
    this.addInteractable({
      kind: 'stairs', name: 'Staircase', meshes: stepMeshes,
      examine: 'Stairs. They go up. Also down.',
      actions: [{
        label: 'Climb-up',
        fn: (ctx) => {
          ctx.player.setPosition(stairTop.x, stairTop.z, undefined, pFloor);
          ctx.ui.chat.add('You climb up the stairs.');
        },
      }],
    });
    // the stairwell opening seen from the upper floor
    const stairWell = this._addBox(3.3, 0.06, 1.0, k.x0 + 2.9, floorY + 0.03, k.z0 + 1.5, dark);
    const banister = this._addBox(3.3, 0.75, 0.09, k.x0 + 2.9, floorY + 0.4, k.z0 + 1.96, wood);
    this.addInteractable({
      kind: 'stairs', name: 'Staircase', meshes: [stairWell, banister],
      examine: 'Stairs. They go down. Also up.',
      actions: [{
        label: 'Climb-down',
        fn: (ctx) => {
          ctx.player.setPosition(stairTop.x, stairTop.z, undefined, 0);
          ctx.ui.chat.add('You climb down the stairs.');
        },
      }],
    });

    // ---- ladder: upper floor <-> roof terrace ----
    const ladderX = k.x1 - 2.5, ladderZ = k.z0 + 1.3;
    const ladderMeshes = [];
    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, wallH - k.floorH + 0.6, 5);
    for (const dx of [-0.25, 0.25]) {
      const rail = new THREE.Mesh(railGeo, wood);
      rail.position.set(ladderX + dx, floorY + (wallH - k.floorH + 0.6) / 2, ladderZ);
      this.group.add(rail);
      ladderMeshes.push(rail);
    }
    for (let i = 0; i < 6; i++)
      ladderMeshes.push(this._addBox(0.5, 0.07, 0.06, ladderX, floorY + 0.5 + i * 0.5, ladderZ, wood));
    const ladderSpot = { x: ladderX, z: k.z0 + 3.0 };
    this.addInteractable({
      kind: 'ladder', name: 'Ladder', meshes: ladderMeshes,
      examine: 'Leads to fresh air and pigeons.',
      actions: [{
        label: 'Climb-up',
        fn: (ctx) => {
          ctx.player.setPosition(ladderSpot.x, ladderSpot.z, undefined, pRoof);
          ctx.ui.chat.add('You climb the ladder to the roof.');
        },
      }],
    });
    // hatch + ladder stub on the roof
    const hatch = this._addBox(0.95, 0.09, 0.95, ladderX, roofY + 0.045, ladderZ + 0.4, dark);
    const stubs = [];
    for (const dx of [-0.25, 0.25]) {
      const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 5), wood);
      stub.position.set(ladderX + dx, roofY + 0.4, ladderZ);
      this.group.add(stub);
      stubs.push(stub);
    }
    this.addInteractable({
      kind: 'ladder', name: 'Ladder', meshes: [hatch, ...stubs],
      examine: 'Back down to carpets and candles.',
      actions: [{
        label: 'Climb-down',
        fn: (ctx) => {
          ctx.player.setPosition(ladderSpot.x, ladderSpot.z, undefined, pFloor);
          ctx.ui.chat.add('You climb down the ladder.');
        },
      }],
    });
  }

  // ---- bridge ---------------------------------------------------------------

  _buildBridgeMeshes() {
    const b = this.def.bridge;
    const stone = new THREE.MeshLambertMaterial({ color: 0x8f8a80, flatShading: true });
    const darker = new THREE.MeshLambertMaterial({ color: 0x777168, flatShading: true });
    const len = this.bridgeX1 - this.bridgeX0;
    const cx = (this.bridgeX0 + this.bridgeX1) / 2;
    // deck covers exactly the walk + rail rows
    const depth = this.bridgeZ1 - this.bridgeZ0;
    const bridgeMeshes = [this._addBox(len, 0.4, depth, cx, b.deckH - 0.2, this.bridgeZC, stone)];
    // parapets fill their blocked rail tiles so the collision face is the visible face
    for (const rz of b.railRows) {
      bridgeMeshes.push(this._addBox(len, 0.9, 0.95, cx, b.deckH + 0.45, rz + 0.5, darker));
      // support piers down into the river, under the parapet lines
      for (let x = this.bridgeX0 + 2.5; x < this.bridgeX1 - 1; x += 4) {
        const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 5.5, 7), darker);
        pier.position.set(x, b.deckH - 2.9, rz + 0.5);
        pier.matrixAutoUpdate = false; pier.updateMatrix();
        this.group.add(pier);
      }
    }
    this.addInteractable({
      kind: 'scenery', name: 'Bridge', meshes: bridgeMeshes,
      examine: 'Aldern stonework. Older than everyone you know.',
      actions: [],
    });
  }

  // ---- trees ----------------------------------------------------------------

  _plantTrees() {
    const d = this.def, size = this.size, rng = this._rng;
    const c = d.castle;
    const taken = new Set();
    const spots = [];
    let attempts = d.trees.count * 12;

    while (spots.length < d.trees.count && attempts-- > 0) {
      const tx = 3 + Math.floor(rng() * (size - 6));
      const tz = 3 + Math.floor(rng() * (size - 6));
      if (this.flags[tz * size + tx] & FLAG_BLOCKED) continue;
      if (this.overrides.has(tx + ',' + tz)) continue;
      if (tx >= c.x0 - 3 && tx < c.x1 + 3 && tz >= c.z0 - 3 && tz < c.z1 + 3) continue;
      if (this._roadDist(tx + 0.5, tz + 0.5) < 3) continue;
      if (tx >= this.bridgeX0 - 3 && tx <= this.bridgeX1 + 3 &&
          Math.abs(tz + 0.5 - this.bridgeZC) < (this.bridgeZ1 - this.bridgeZ0) / 2 + 3) continue;
      if (Math.abs(tx + 0.5 - this.riverCenter(tz + 0.5)) < d.river.width / 2 + d.river.falloff + 1) continue;
      let crowded = false;
      const s = d.trees.minSpacing;
      for (let dz = -s; dz <= s && !crowded; dz++)
        for (let dx = -s; dx <= s && !crowded; dx++)
          if (taken.has((tx + dx) + ',' + (tz + dz))) crowded = true;
      if (crowded) continue;

      taken.add(tx + ',' + tz);
      this.flags[tz * size + tx] |= FLAG_BLOCKED;
      const x = tx + 0.5 + (rng() - 0.5) * 0.4;
      const z = tz + 0.5 + (rng() - 0.5) * 0.4;
      spots.push({
        x, z, y: this.getGroundHeight(x, z),
        scale: 0.85 + rng() * 0.45,
        rot: rng() * Math.PI * 2,
        tone: rng(),
      });
    }

    const n = spots.length;
    if (n === 0) return;
    const trunkGeo = new THREE.CylinderGeometry(0.13, 0.2, 1.7, 6);
    trunkGeo.translate(0, 0.85, 0);
    const lowGeo = new THREE.ConeGeometry(1.2, 2.3, 7);
    lowGeo.translate(0, 2.5, 0);
    const highGeo = new THREE.ConeGeometry(0.85, 1.7, 7);
    highGeo.translate(0, 3.6, 0);
    const white = () => new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const trunks = new THREE.InstancedMesh(trunkGeo, white(), n);
    const lows = new THREE.InstancedMesh(lowGeo, white(), n);
    const highs = new THREE.InstancedMesh(highGeo, white(), n);

    const m4 = new THREE.Matrix4();
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
    const axisY = new THREE.Vector3(0, 1, 0);
    const trunkCol = new THREE.Color(), leafCol = new THREE.Color();
    spots.forEach((t, i) => {
      p.set(t.x, t.y - 0.15, t.z);
      q.setFromAxisAngle(axisY, t.rot);
      sv.setScalar(t.scale);
      m4.compose(p, q, sv);
      trunks.setMatrixAt(i, m4); lows.setMatrixAt(i, m4); highs.setMatrixAt(i, m4);
      // authored in sRGB, converted to the linear working space (same as chunk colors)
      trunkCol.setRGB(0.33 + t.tone * 0.06, 0.25 + t.tone * 0.05, 0.17 + t.tone * 0.04, THREE.SRGBColorSpace);
      leafCol.setRGB(0.24 + t.tone * 0.12, 0.42 + t.tone * 0.14, 0.20 + t.tone * 0.08, THREE.SRGBColorSpace);
      trunks.setColorAt(i, trunkCol);
      lows.setColorAt(i, leafCol);
      highs.setColorAt(i, leafCol.multiplyScalar(1.08));
    });
    for (const mesh of [trunks, lows, highs]) {
      mesh.frustumCulled = false; // instanced bounds don't cover instances
      this.group.add(mesh);
    }
    this.addInteractable({
      kind: 'scenery', name: 'Tree', meshes: [trunks, lows, highs],
      examine: 'A tree. Notably wooden.',
      actions: [], // Chop-down arrives with Woodcutting in Phase 4
    });
  }

  // ---- furniture -------------------------------------------------------------

  _buildFurniture() {
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    for (const f of this.def.furniture ?? []) {
      if (f.kind !== 'table') continue;
      const y = this.getGroundHeight(f.x, f.z, f.plane);
      const meshes = [this._addBox(1.6, 0.12, 0.9, f.x, y + 0.78, f.z, wood)];
      for (const [lx, lz] of [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]])
        meshes.push(this._addBox(0.12, 0.72, 0.12, f.x + lx, y + 0.36, f.z + lz, wood));
      for (let tx = Math.floor(f.x - 0.8); tx <= Math.floor(f.x + 0.8); tx++)
        for (let tz = Math.floor(f.z - 0.45); tz <= Math.floor(f.z + 0.45); tz++)
          if (f.plane === 0) this.setTileBlocked(tx, tz, true);
      this.addInteractable({
        kind: 'scenery', name: 'Table', meshes,
        examine: 'Four legs and ambitions of stability.',
        actions: [],
      });
    }
  }

  // ---- ground items ----------------------------------------------------------

  _spawnGroundItems() {
    for (const g of this.def.groundItems ?? [])
      this.addGroundItem(g.item, g.count ?? 1, g.x, g.z, g.plane ?? 0, g.dy ?? 0);
  }

  /** Drop an item into the world; it becomes a takeable interactable. */
  addGroundItem(id, count, x, z, plane = 0, dy = 0) {
    const def = ITEMS[id];
    const { root, meshes } = this._buildItemModel(def);
    root.position.set(x, this.getGroundHeight(x, z, plane) + dy + 0.01, z);
    root.rotation.y = hash2(this.def.seed, Math.round(x * 7), Math.round(z * 7)) * Math.PI * 2;
    this.group.add(root);
    let entry;
    entry = this.addInteractable({
      kind: 'ground-item', name: def.name, itemId: id, count,
      meshes, examine: def.examine, plane, root,
      actions: [{
        label: 'Take',
        fn: (ctx) => {
          if (!ctx.player.inventory.add(id, count)) {
            ctx.ui.chat.add("You can't carry any more.");
            return;
          }
          this.group.remove(root);
          this.removeInteractable(entry);
          ctx.ui.chat.add('You take the ' + def.name.toLowerCase() + '.');
          ctx.ui.refreshInventory();
        },
      }],
    });
    return entry;
  }

  /** Build a small low-poly mesh for an item def; origin at its base. */
  _buildItemModel(def) {
    const m = def.model;
    const mat = new THREE.MeshLambertMaterial({ color: m.color, flatShading: true });
    const root = new THREE.Group();
    const meshes = [];
    const add = (geo, x, y, z, material = mat) => {
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(x, y, z);
      root.add(mesh);
      meshes.push(mesh);
      return mesh;
    };
    switch (m.kind) {
      case 'cylinder': add(new THREE.CylinderGeometry(m.rTop, m.rBot, m.h, 8), 0, m.h / 2, 0); break;
      case 'sphere': add(new THREE.IcosahedronGeometry(m.r, 0), 0, m.r, 0); break;
      case 'box': add(new THREE.BoxGeometry(m.w, m.h, m.d), 0, m.h / 2, 0); break;
      case 'log': {
        const mesh = add(new THREE.CylinderGeometry(m.r, m.r, m.len, 7), 0, m.r, 0);
        mesh.rotation.z = Math.PI / 2;
        break;
      }
      case 'bones': {
        add(new THREE.BoxGeometry(0.5, 0.05, 0.08), 0, 0.04, 0).rotation.y = 0.5;
        add(new THREE.BoxGeometry(0.42, 0.05, 0.08), 0.05, 0.09, 0.03).rotation.y = -0.7;
        break;
      }
      case 'blade': {
        const handleMat = new THREE.MeshLambertMaterial({ color: m.handle, flatShading: true });
        add(new THREE.BoxGeometry(0.42, 0.03, 0.1), -0.08, 0.03, 0);
        add(new THREE.BoxGeometry(0.05, 0.05, 0.2), 0.16, 0.03, 0, handleMat);
        add(new THREE.BoxGeometry(0.16, 0.045, 0.06), 0.26, 0.03, 0, handleMat);
        break;
      }
    }
    return { root, meshes };
  }
}
