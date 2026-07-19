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
import { TREES, ROCKS, FISHING, FIREMAKING } from '../data/resources.js';

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
    this._timedItems = [];      // ground items with a despawn tick
    this._respawnQueue = [];    // ground items that re-seed after being taken
    this._fires = [];           // live player-lit fires
    this._rocks = [];           // mining rocks with deplete state
    this._tick = 0;             // latest tick seen (for take-time scheduling)
    this._projectiles = [];     // arrows/spell bolts in flight (cosmetic)
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
    this._buildPasture();
    this._buildGoblinCamp();
    this._buildMine();
    this._buildFishingSpots();
    this._buildSmithy();
    this._buildTanningRack();
    this._buildChurch();
    this._buildStore();
    this._buildBankChest();
    this._spawnGroundItems();
    this._rebuildPickPool();
  }

  _rebuildPickPool() {
    this.pickPool = [...new Set([...this.raycastTargets, ...this.occluders])];
  }

  onTick(tick) {
    this._tick = tick;
    // ground piles (death drops, mob drops) age out
    if (this._timedItems.length) {
      const due = this._timedItems.filter((t) => tick >= t.at);
      if (due.length) {
        this._timedItems = this._timedItems.filter((t) => tick < t.at);
        for (const t of due) this.removeInteractable(t.entry);
      }
    }
    // taken tool spawns re-seed
    if (this._respawnQueue.length) {
      const due = this._respawnQueue.filter((r) => tick >= r.at);
      if (due.length) {
        this._respawnQueue = this._respawnQueue.filter((r) => tick < r.at);
        for (const r of due) this.addGroundItem(r.id, r.count, r.x, r.z, r.plane, r.dy, r.opts);
      }
    }
    // resources respawn
    for (const t of this.trees ?? []) if (t.depleted && tick >= t.respawnAt) this.respawnTree(t);
    for (const r of this._rocks) if (r.depleted && tick >= r.respawnAt) this.respawnRock(r);
    // fires age out into ashes
    for (const f of this._fires.filter((f) => tick >= f.expireAt)) {
      f.entry.expired = true;
      this.removeInteractable(f.entry);
      this.addGroundItem('ashes', 1, f.x, f.z, 0, 0, { despawnAtTick: tick + 200 });
    }
    this._fires = this._fires.filter((f) => tick < f.expireAt);
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
    this.occluders = this.occluders.filter((m) => m.userData.interactable !== entry);
    for (const m of entry.meshes) {
      delete m.userData.interactable;
      if (m.parent) m.parent.remove(m); // item meshes hang off the entry's root group
      if (m.geometry) m.geometry.dispose();
      if (entry.kind === 'ground-item' || entry.kind === 'fire') {
        // item/fire models own their materials; scenery shares them — leave those
        for (const mat of Array.isArray(m.material) ? m.material : [m.material]) mat.dispose();
      }
    }
    if (entry.root && entry.root.parent) entry.root.parent.remove(entry.root);
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
      this.occluders.push(cap);
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
    this.occluders.push(merlons);

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
    this.occluders.push(merlons);
    // banner of Aurel, now flown from the roof terrace
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 5), darkStone);
    pole.position.set(kx, roofY + 1.5, kz - 2);
    this.group.add(pole);
    this.occluders.push(pole);
    const flag = this._addBox(0.8, 0.5, 0.06, kx + 0.45, roofY + 2.6, kz - 2, gold);
    this.addInteractable({
      kind: 'scenery', name: 'Banner', meshes: [pole, flag],
      examine: 'The banner of Aurel. Gold, as is traditional.',
      actions: [], // thin decor deliberately doesn't block walking
    });
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
          if (door.open) {
            // refuse to close onto an occupant — a blocked tile you stand in is a soft-lock
            const p = ctx.player.pos;
            if (ctx.player.plane === 0 &&
                p.x > doorTile.x - 0.35 && p.x < doorTile.x + 1.35 &&
                p.z > doorTile.z - 0.35 && p.z < doorTile.z + 1.35) {
              ctx.ui.chat.add("You can't close the door while standing in it.");
              return;
            }
          }
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
    // the stairwell opening seen from the upper floor — spans exactly the
    // four blocked hole tiles (x k.x0+1 .. k.x0+4)
    const stairWell = this._addBox(4.0, 0.06, 1.0, k.x0 + 3, floorY + 0.03, k.z0 + 1.5, dark);
    const banister = this._addBox(4.0, 0.75, 0.09, k.x0 + 3, floorY + 0.4, k.z0 + 1.96, wood);
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
    // rails stop just under the roof slab (roofY - 0.3): no poking through,
    // no coincidence with the roof-side stubs
    const railLen = (roofY - 0.3) - floorY - 0.05;
    const railGeo = new THREE.CylinderGeometry(0.05, 0.05, railLen, 5);
    for (const dx of [-0.25, 0.25]) {
      const rail = new THREE.Mesh(railGeo, wood);
      rail.position.set(ladderX + dx, floorY + railLen / 2, ladderZ);
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

    // ---- spinning wheel (upper floor, per the atlas) ----
    const wheelX = k.x0 + 8.5, wheelZ = k.z0 + 2.2;
    const wheelMeshes = [
      this._addBox(0.8, 0.1, 0.5, wheelX, floorY + 0.32, wheelZ, wood),
      this._addBox(0.1, 0.32, 0.1, wheelX - 0.25, floorY + 0.16, wheelZ, wood),
      this._addBox(0.1, 0.32, 0.1, wheelX + 0.25, floorY + 0.16, wheelZ, wood),
    ];
    const wheelDisc = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.05, 5, 10),
      new THREE.MeshLambertMaterial({ color: 0x8a6a42, flatShading: true }));
    wheelDisc.position.set(wheelX + 0.1, floorY + 0.75, wheelZ);
    this.group.add(wheelDisc);
    wheelMeshes.push(wheelDisc);
    this.setPlaneTile(pFloor, Math.floor(wheelX), Math.floor(wheelZ), floorY, true);
    this.addInteractable({
      kind: 'scenery', name: 'Spinning wheel', meshes: wheelMeshes,
      examine: 'Turns fluff into thread and patience into progress.',
      actions: [{ label: 'Spin', fn: (ctx) => ctx.actions.startSpin() }],
    });

    // ---- the castle range (ground floor, against the south wall) ----
    const rangeStone = new THREE.MeshLambertMaterial({ color: 0x6f6a62, flatShading: true });
    const ember = new THREE.MeshLambertMaterial({ color: 0xd86a2a, emissive: 0x7a2e08 });
    const rgx = k.x0 + 9, rgz = k.z1 - 1.45;
    const rangeMeshes = [
      this._addBox(1.5, 1.45, 0.85, rgx, base + 0.72, rgz, rangeStone),
      this._addBox(1.1, 0.62, 0.1, rgx, base + 0.45, rgz - 0.44, ember),
      this._addBox(1.6, 0.14, 0.95, rgx, base + 1.5, rgz, darkStone),
    ];
    this.markBlockedRect(k.x0 + 8, k.z1 - 2, k.x0 + 9, k.z1 - 2);
    let rangeEntry;
    rangeEntry = this.addInteractable({
      kind: 'fire', isRange: true, name: 'Range', meshes: rangeMeshes,
      examine: 'The castle range. It judges amateur cooks silently.',
      actions: [{ label: 'Cook', fn: (ctx) => ctx.ui.openCookMenu(rangeEntry) }],
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
        this.occluders.push(pier);
      }
    }
    this.addInteractable({
      kind: 'scenery', name: 'Bridge', meshes: bridgeMeshes,
      examine: 'Aldern stonework. Older than everyone you know.',
      actions: [],
    });
  }

  // ---- trees ----------------------------------------------------------------

  /**
   * Typed, stateful trees on shared InstancedMeshes. Raycast instanceId
   * resolves which tree was clicked; depleted trees collapse to a stump
   * instance and respawn on ticks.
   */
  _plantTrees() {
    const d = this.def, size = this.size, rng = this._rng;
    const c = d.castle;
    const taken = new Set();

    const bad = (tx, tz) => {
      if (tx < 3 || tz < 3 || tx >= size - 3 || tz >= size - 3) return true;
      if (this.flags[tz * size + tx] & FLAG_BLOCKED) return true;
      if (this.overrides.has(tx + ',' + tz)) return true;
      if (tx >= c.x0 - 3 && tx < c.x1 + 3 && tz >= c.z0 - 3 && tz < c.z1 + 3) return true;
      if (this._roadDist(tx + 0.5, tz + 0.5) < 3) return true;
      if (tx >= this.bridgeX0 - 3 && tx <= this.bridgeX1 + 3 &&
          Math.abs(tz + 0.5 - this.bridgeZC) < (this.bridgeZ1 - this.bridgeZ0) / 2 + 3) return true;
      const pa = d.pasture;
      if (pa && tx >= pa.x0 - 2 && tx < pa.x1 + 2 && tz >= pa.z0 - 2 && tz < pa.z1 + 2) return true;
      const gc = d.goblinCamp;
      if (gc && Math.hypot(tx + 0.5 - gc.x, tz + 0.5 - gc.z) < 9) return true;
      const ch = d.church;
      if (ch && tx >= ch.x0 - 2 && tx < ch.x1 + 2 && tz >= ch.z0 - 2 && tz < ch.z1 + 2) return true;
      const st = d.store;
      if (st && tx >= st.x0 - 2 && tx < st.x1 + 2 && tz >= st.z0 - 2 && tz < st.z1 + 2) return true;
      const s = d.trees.minSpacing;
      for (let dz = -s; dz <= s; dz++)
        for (let dx = -s; dx <= s; dx++)
          if (taken.has((tx + dx) + ',' + (tz + dz))) return true;
      return false;
    };
    const riverDist = (tx, tz) =>
      Math.abs(tx + 0.5 - this.riverCenter(tz + 0.5)) - (d.river.width / 2 + d.river.falloff);

    // per-type silhouettes and foliage palettes
    const SHAPES = {
      tree: {
        trunk: [0.13, 0.2, 1.7], canA: { cone: [1.2, 2.3], y: 2.5 }, canB: { cone: [0.85, 1.7], y: 3.6 },
        leaf: (t) => [0.24 + t * 0.12, 0.42 + t * 0.14, 0.20 + t * 0.08],
      },
      oak: {
        trunk: [0.2, 0.3, 1.5], canA: { cone: [1.8, 2.2], y: 2.4 }, canB: { ball: 1.0, y: 3.5 },
        leaf: (t) => [0.20 + t * 0.08, 0.36 + t * 0.10, 0.16 + t * 0.06],
      },
      willow: {
        trunk: [0.11, 0.16, 2.2], canA: { cone: [1.8, 1.3], y: 2.9 }, canB: { cone: [1.25, 1.0], y: 3.6 },
        leaf: (t) => [0.42 + t * 0.10, 0.52 + t * 0.08, 0.22 + t * 0.05],
      },
    };

    // placement
    const placements = { tree: [], oak: [], willow: [] };
    const plans = [
      ['tree', d.trees.count],
      ['oak', d.trees.oaks ?? 0],
      ['willow', d.trees.willows ?? 0],
    ];
    for (const [type, count] of plans) {
      let attempts = count * 16, placed = 0;
      while (placed < count && attempts-- > 0) {
        let tx, tz;
        if (type === 'willow') {
          // willows crowd the banks
          tz = 55 + Math.floor(rng() * 85);
          const side = rng() < 0.5 ? -1 : 1;
          tx = Math.floor(this.riverCenter(tz + 0.5) +
            side * (d.river.width / 2 + d.river.falloff * 0.8 + rng() * 2.5));
          if (bad(tx, tz)) continue;
        } else {
          tx = 3 + Math.floor(rng() * (size - 6));
          tz = 3 + Math.floor(rng() * (size - 6));
          if (bad(tx, tz) || riverDist(tx, tz) < 1) continue;
        }
        taken.add(tx + ',' + tz);
        this.flags[tz * size + tx] |= FLAG_BLOCKED;
        const x = tx + 0.5 + (rng() - 0.5) * 0.4;
        const z = tz + 0.5 + (rng() - 0.5) * 0.4;
        placements[type].push({
          x, z, tile: { x: tx, z: tz }, y: this.getGroundHeight(x, z),
          scale: 0.85 + rng() * 0.45, rot: rng() * Math.PI * 2, tone: rng(),
        });
        placed++;
      }
    }

    // shared stump pool
    this.trees = [];
    this.treeSets = {};
    const total = placements.tree.length + placements.oak.length + placements.willow.length;
    if (total === 0) return;
    const stumpGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.42, 6);
    stumpGeo.translate(0, 0.21, 0);
    const white = () => new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    const stumps = new THREE.InstancedMesh(stumpGeo, white(), total);
    this._zeroM4 = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);
    for (let i = 0; i < total; i++) stumps.setMatrixAt(i, this._zeroM4);
    const stumpCol = new THREE.Color().setRGB(0.35, 0.27, 0.18, THREE.SRGBColorSpace);
    for (let i = 0; i < total; i++) stumps.setColorAt(i, stumpCol);
    stumps.frustumCulled = false;
    this.group.add(stumps);
    this.stumps = stumps;

    const m4 = new THREE.Matrix4();
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
    const axisY = new THREE.Vector3(0, 1, 0);
    const trunkCol = new THREE.Color(), leafCol = new THREE.Color();
    let stumpIdx = 0;

    for (const type of ['tree', 'oak', 'willow']) {
      const list = placements[type];
      if (!list.length) continue;
      const shape = SHAPES[type];
      const trunkGeo = new THREE.CylinderGeometry(shape.trunk[0], shape.trunk[1], shape.trunk[2], 6);
      trunkGeo.translate(0, shape.trunk[2] / 2, 0);
      const mkCan = (cdef) => {
        const g = cdef.cone
          ? new THREE.ConeGeometry(cdef.cone[0], cdef.cone[1], 7)
          : new THREE.IcosahedronGeometry(cdef.ball, 0);
        g.translate(0, cdef.y, 0);
        return g;
      };
      const trunks = new THREE.InstancedMesh(trunkGeo, white(), list.length);
      const canA = new THREE.InstancedMesh(mkCan(shape.canA), white(), list.length);
      const canB = new THREE.InstancedMesh(mkCan(shape.canB), white(), list.length);
      const records = [];
      list.forEach((t, i) => {
        p.set(t.x, t.y - 0.15, t.z);
        q.setFromAxisAngle(axisY, t.rot);
        sv.setScalar(t.scale);
        m4.compose(p, q, sv);
        trunks.setMatrixAt(i, m4); canA.setMatrixAt(i, m4); canB.setMatrixAt(i, m4);
        trunkCol.setRGB(0.33 + t.tone * 0.06, 0.25 + t.tone * 0.05, 0.17 + t.tone * 0.04, THREE.SRGBColorSpace);
        const [lr, lg, lb] = shape.leaf(t.tone);
        leafCol.setRGB(lr, lg, lb, THREE.SRGBColorSpace);
        trunks.setColorAt(i, trunkCol);
        canA.setColorAt(i, leafCol);
        canB.setColorAt(i, leafCol.multiplyScalar(1.08));
        const rec = {
          type, idx: i, stumpIdx: stumpIdx++, x: t.x, z: t.z, y: t.y, tile: t.tile,
          depleted: false, respawnAt: 0, matrix: m4.clone(),
        };
        records.push(rec);
        this.trees.push(rec);
      });
      const meshes = [trunks, canA, canB];
      for (const mesh of meshes) {
        mesh.frustumCulled = false;
        this.group.add(mesh);
      }
      this.treeSets[type] = { meshes, list: records };
      const tdef = TREES[type];
      this.addInteractable({
        kind: 'tree', treeType: type, name: tdef.label, meshes,
        examine: tdef.examine,
        actions: [{
          label: 'Chop-down',
          fn: (ctx, hit) => ctx.actions.startChop(this.treeFromHit(type, hit)),
        }],
      });
    }
    this.addInteractable({
      kind: 'scenery', name: 'Tree stump', meshes: [stumps],
      examine: 'Somebody was here with an axe.',
      actions: [],
    });
  }

  treeFromHit(type, hit) {
    if (!hit || hit.instanceId === undefined || hit.instanceId === null) return null;
    return this.treeSets[type]?.list[hit.instanceId] ?? null;
  }

  depleteTree(rec, tickNo) {
    rec.depleted = true;
    rec.respawnAt = tickNo + TREES[rec.type].respawnTicks;
    const set = this.treeSets[rec.type];
    for (const mesh of set.meshes) {
      mesh.setMatrixAt(rec.idx, this._zeroM4);
      mesh.instanceMatrix.needsUpdate = true;
    }
    const m = new THREE.Matrix4().makeTranslation(rec.x, rec.y - 0.05, rec.z);
    this.stumps.setMatrixAt(rec.stumpIdx, m);
    this.stumps.instanceMatrix.needsUpdate = true;
  }

  respawnTree(rec) {
    rec.depleted = false;
    const set = this.treeSets[rec.type];
    for (const mesh of set.meshes) {
      mesh.setMatrixAt(rec.idx, rec.matrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
    this.stumps.setMatrixAt(rec.stumpIdx, this._zeroM4);
    this.stumps.instanceMatrix.needsUpdate = true;
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
        for (let tz = Math.floor(f.z - 0.45); tz <= Math.floor(f.z + 0.45); tz++) {
          if (f.plane === 0) this.setTileBlocked(tx, tz, true);
          else {
            const t = this.planes[f.plane]?.tiles.get(tx + ',' + tz);
            if (t) t.blocked = true; // block the floor tile, never the terrain below
          }
        }
      this.addInteractable({
        kind: 'scenery', name: 'Table', meshes,
        examine: 'Four legs and ambitions of stability.',
        actions: [],
      });
    }
  }

  // ---- pasture, coop, goblin camp ---------------------------------------------

  _buildPasture() {
    const p = this.def.pasture;
    if (!p) return;
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e5638, flatShading: true });
    const isGap = (tx, tz) => p.gaps.some(([gx, gz]) => gx === tx && gz === tz);

    // perimeter tiles (rows z0/z1-1, cols x0/x1-1), skipping the gate gap
    const perim = [];
    for (let tx = p.x0; tx < p.x1; tx++) perim.push([tx, p.z0], [tx, p.z1 - 1]);
    for (let tz = p.z0 + 1; tz < p.z1 - 1; tz++) perim.push([p.x0, tz], [p.x1 - 1, tz]);
    const fenceTiles = perim.filter(([tx, tz]) => !isGap(tx, tz));

    // rails: one instanced box per tile per height, oriented per side
    const railGeo = new THREE.BoxGeometry(1.02, 0.07, 0.07);
    const rails = new THREE.InstancedMesh(railGeo, wood, fenceTiles.length * 2);
    const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 5);
    const posts = new THREE.InstancedMesh(postGeo, wood, fenceTiles.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(1, 1, 1);
    let ri = 0;
    fenceTiles.forEach(([tx, tz], i) => {
      const vertical = tx === p.x0 || tx === p.x1 - 1; // side columns run along z
      const cx = tx + 0.5, cz = tz + 0.5;
      const y = this.getGroundHeight(cx, cz);
      q.setFromAxisAngle(up, vertical ? Math.PI / 2 : 0);
      for (const h of [0.38, 0.72]) {
        m4.compose(new THREE.Vector3(cx, y + h, cz), q, sc);
        rails.setMatrixAt(ri++, m4);
      }
      m4.compose(new THREE.Vector3(cx, y + 0.45, cz), new THREE.Quaternion(), sc);
      posts.setMatrixAt(i, m4);
      this.setTileBlocked(tx, tz, true);
    });
    for (const mesh of [rails, posts]) {
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.occluders.push(mesh);
    }
    this.addInteractable({
      kind: 'scenery', name: 'Fence', meshes: [rails, posts],
      examine: 'Keeps the cows in. Mostly keeps the cows in.',
      actions: [],
    });

    // the chicken coop
    const c = this.def.coop;
    if (!c) return;
    const y = this.getGroundHeight(c.x, c.z);
    const dark = new THREE.MeshLambertMaterial({ color: 0x2e2a24 });
    const roof = new THREE.MeshLambertMaterial({ color: 0x8a5a3a, flatShading: true });
    const coopMeshes = [
      this._addBox(2.2, 1.6, 1.8, c.x, y + 0.8, c.z, wood),
      this._addBox(0.7, 0.9, 0.1, c.x - 0.3, y + 0.45, c.z + 0.86, dark),
    ];
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.0, 4), roof);
    cone.position.set(c.x, y + 2.1, c.z);
    cone.rotation.y = Math.PI / 4;
    this.group.add(cone);
    this.occluders.push(cone);
    coopMeshes.push(cone);
    this.markBlockedRect(Math.floor(c.x - 1), Math.floor(c.z - 0.9), Math.floor(c.x + 1), Math.floor(c.z + 0.9));
    this.addInteractable({
      kind: 'scenery', name: 'Chicken coop', meshes: coopMeshes,
      examine: 'Home to chickens. Smells honest.',
      actions: [],
    });
  }

  _buildGoblinCamp() {
    const g = this.def.goblinCamp;
    if (!g) return;
    const cloth = new THREE.MeshLambertMaterial({ color: 0x6b5744, flatShading: true });
    const stone = new THREE.MeshLambertMaterial({ color: 0x77716a, flatShading: true });
    const ember = new THREE.MeshLambertMaterial({ color: 0xd86a2a, emissive: 0x7a2e08 });
    for (const [tx, tz] of g.tents) {
      const y = this.getGroundHeight(tx, tz);
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 4), cloth);
      tent.position.set(tx, y + 0.8, tz);
      tent.rotation.y = Math.PI / 4;
      this.group.add(tent);
      this.occluders.push(tent);
      this.markBlockedCircle(tx, tz, 1.3);
      this.addInteractable({
        kind: 'scenery', name: 'Tent', meshes: [tent],
        examine: 'Goblin craftsmanship: holes included at no extra cost.',
        actions: [],
      });
    }
    const [fx, fz] = g.fire;
    const fy = this.getGroundHeight(fx, fz);
    const fireMeshes = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), stone);
      rock.position.set(fx + Math.cos(a) * 0.5, fy + 0.08, fz + Math.sin(a) * 0.5);
      this.group.add(rock);
      fireMeshes.push(rock);
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 5), ember);
    flame.position.set(fx, fy + 0.3, fz);
    this.group.add(flame);
    fireMeshes.push(flame);
    this.setTileBlocked(Math.floor(fx), Math.floor(fz), true);
    this.addInteractable({
      kind: 'scenery', name: 'Campfire', meshes: fireMeshes,
      examine: 'Around this fire, the great debate rages: red armor or green?',
      actions: [],
    });
  }

  // ---- mining rocks -----------------------------------------------------------

  _buildMine() {
    const m = this.def.mine;
    if (!m) return;
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x847e76, flatShading: true });
    for (const [ore, dx, dz] of m.rocks) {
      const def = ROCKS[ore];
      const tx = m.x + dx, tz = m.z + dz;
      const cx = tx + 0.5, cz = tz + 0.5;
      const y = this.getGroundHeight(cx, cz);
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 0), bodyMat);
      body.position.set(cx, y + 0.3, cz);
      body.scale.y = 0.72;
      body.rotation.y = hash2(this.def.seed ^ 0x517, tx, tz) * Math.PI;
      this.group.add(body);
      const veinMat = new THREE.MeshLambertMaterial({ color: def.vein, flatShading: true });
      const veins = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + tx;
        const v = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), veinMat);
        v.position.set(cx + Math.cos(a) * 0.3, y + 0.42 + (i % 2) * 0.12, cz + Math.sin(a) * 0.3);
        this.group.add(v);
        veins.push(v);
      }
      this.setTileBlocked(tx, tz, true);
      const rock = { ore, tile: { x: tx, z: tz }, depleted: false, respawnAt: 0, veins };
      this._rocks.push(rock);
      this.addInteractable({
        kind: 'rock', name: def.label, meshes: [body, ...veins],
        examine: def.examine,
        actions: [{ label: 'Mine', fn: (ctx) => ctx.actions.startMine(rock) }],
      });
    }
  }

  depleteRock(rock, tickNo) {
    rock.depleted = true;
    rock.respawnAt = tickNo + ROCKS[rock.ore].respawnTicks;
    for (const v of rock.veins) v.visible = false;
  }

  respawnRock(rock) {
    rock.depleted = false;
    for (const v of rock.veins) v.visible = true;
  }

  // ---- fishing spots ------------------------------------------------------------

  _buildFishingSpots() {
    for (const s of this.def.fishingSpots ?? []) {
      const def = FISHING[s.type];
      const x = this.riverCenter(s.z + 0.5) - (this.def.river.width / 2 + 1.2); // west channel edge
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.055, 6, 14),
        new THREE.MeshLambertMaterial({ color: 0xbfd8cf, transparent: true, opacity: 0.75 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, this.def.waterLevel + 0.04, s.z + 0.5);
      this.group.add(ring);
      this.addInteractable({
        kind: 'fishspot', name: def.label, meshes: [ring],
        examine: def.examine,
        actions: [{ label: def.verb, fn: (ctx) => ctx.actions.startFish({ type: s.type }) }],
      });
    }
  }

  // ---- smithy & tanning rack -----------------------------------------------------

  _buildSmithy() {
    const s = this.def.smithy;
    if (!s) return;
    const stone = new THREE.MeshLambertMaterial({ color: 0x77716a, flatShading: true });
    const dark = new THREE.MeshLambertMaterial({ color: 0x2e2a24 });
    const ember = new THREE.MeshLambertMaterial({ color: 0xd86a2a, emissive: 0x7a2e08 });
    const iron = new THREE.MeshLambertMaterial({ color: 0x5a5a60, flatShading: true });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });

    // furnace: squat stone stack with a glowing mouth
    const f = s.furnace;
    const fy = this.getGroundHeight(f.x, f.z);
    const furnaceMeshes = [
      this._addBox(1.5, 1.7, 1.5, f.x, fy + 0.85, f.z, stone),
      this._addBox(1.0, 0.9, 1.0, f.x, fy + 2.1, f.z, stone),
      this._addBox(0.8, 0.65, 0.12, f.x, fy + 0.5, f.z + 0.72, dark),
      this._addBox(0.6, 0.45, 0.1, f.x, fy + 0.45, f.z + 0.74, ember),
    ];
    this.setTileBlocked(Math.floor(f.x), Math.floor(f.z), true);
    let furnaceEntry;
    furnaceEntry = this.addInteractable({
      kind: 'furnace', name: 'Furnace', meshes: furnaceMeshes,
      examine: 'Hot enough to convince most rocks.',
      actions: [
        { label: 'Smelt', fn: (ctx) => ctx.ui.openSmeltMenu(furnaceEntry) },
        { label: 'Craft-jewellery', fn: (ctx) => ctx.ui.openJewelryMenu(furnaceEntry) },
      ],
    });

    // anvil on a stump
    const a = s.anvil;
    const ay = this.getGroundHeight(a.x, a.z);
    const anvilMeshes = [
      this._addBox(0.55, 0.4, 0.55, a.x, ay + 0.2, a.z, wood),
      this._addBox(0.85, 0.3, 0.4, a.x, ay + 0.55, a.z, iron),
      this._addBox(0.3, 0.16, 0.24, a.x - 0.5, ay + 0.62, a.z, iron),
    ];
    this.setTileBlocked(Math.floor(a.x), Math.floor(a.z), true);
    this.addInteractable({
      kind: 'anvil', name: 'Anvil', meshes: anvilMeshes,
      examine: 'It has heard every swear word the realm knows.',
      actions: [{ label: 'Smith', fn: (ctx) => ctx.ui.openAnvil() }],
    });
  }

  _buildTanningRack() {
    const t = this.def.tanningRack;
    if (!t) return;
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e5638, flatShading: true });
    const hide = new THREE.MeshLambertMaterial({ color: 0xc9a877, flatShading: true });
    const y = this.getGroundHeight(t.x, t.z);
    const meshes = [
      this._addBox(0.1, 1.5, 0.1, t.x - 0.6, y + 0.75, t.z, wood),
      this._addBox(0.1, 1.5, 0.1, t.x + 0.6, y + 0.75, t.z, wood),
      this._addBox(1.3, 0.08, 0.08, t.x, y + 1.42, t.z, wood),
      this._addBox(1.0, 1.0, 0.05, t.x, y + 0.85, t.z, hide),
    ];
    this.setTileBlocked(Math.floor(t.x), Math.floor(t.z), true);
    this.addInteractable({
      kind: 'scenery', name: 'Tanning rack', meshes,
      examine: 'Where hides go to become useful.',
      actions: [{ label: 'Tan-hides', fn: (ctx) => ctx.actions.startTan() }],
    });
  }

  // ---- the general store + bank chest ------------------------------------------------

  _buildStore() {
    const c = this.def.store;
    if (!c) return;
    const stone = new THREE.MeshLambertMaterial({ color: 0x99998f, flatShading: true });
    const darkStone = new THREE.MeshLambertMaterial({ color: 0x7c7c74, flatShading: true });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    const { x0, x1, z0, z1 } = c;
    const y = this.getGroundHeight((x0 + x1) / 2, (z0 + z1) / 2);
    const w = x1 - x0, d = z1 - z0;
    const midX = (x0 + x1) / 2, midZ = (z0 + z1) / 2;
    const wallH = 3.2, sink = 0.4;
    const wy = y - sink + (wallH + sink) / 2;
    // door on the EAST wall (facing the road)
    const doorZ = Math.floor(midZ);
    this._addBox(w, wallH + sink, 0.8, midX, wy, z0 + 0.5, stone);
    this._addBox(w, wallH + sink, 0.8, midX, wy, z1 - 0.5, stone);
    this._addBox(0.8, wallH + sink, d - 2, x0 + 0.5, wy, midZ, stone);
    const aLen = doorZ - (z0 + 1), bLen = (z1 - 1) - (doorZ + 1);
    this._addBox(0.8, wallH + sink, aLen, x1 - 0.5, wy, z0 + 1 + aLen / 2, stone);
    this._addBox(0.8, wallH + sink, bLen, x1 - 0.5, wy, doorZ + 1 + bLen / 2, stone);
    this._addBox(0.8, wallH - 2.3, 1, x1 - 0.5, y + 2.3 + (wallH - 2.3) / 2, doorZ + 0.5, stone);
    this._addBox(w + 0.4, 0.14, d + 0.4, midX, y + wallH + 0.05, midZ, wood);   // ceiling
    this._addBox(w + 0.7, 0.22, d + 0.7, midX, y + wallH + 0.35, midZ, darkStone); // flat cap
    this.markBlockedRect(x0, z0, x1 - 1, z0);
    this.markBlockedRect(x0, z1 - 1, x1 - 1, z1 - 1);
    this.markBlockedRect(x0, z0 + 1, x0, z1 - 2);
    this.markBlockedRect(x1 - 1, z0 + 1, x1 - 1, doorZ - 1);
    this.markBlockedRect(x1 - 1, doorZ + 1, x1 - 1, z1 - 2);
    // counter + shelves
    const counter = [this._addBox(0.7, 1.0, d - 3.4, x0 + 2.2, y + 0.5, midZ, wood)];
    for (let tz = Math.floor(midZ - (d - 3.4) / 2); tz <= Math.floor(midZ + (d - 3.4) / 2 - 0.01); tz++)
      this.setTileBlocked(x0 + 2, tz, true);
    const shelves = [];
    for (const sz of [z0 + 1.6, z1 - 1.6]) {
      shelves.push(this._addBox(2.6, 0.1, 0.5, midX + 1, y + 1.1, sz, wood));
      shelves.push(this._addBox(2.6, 0.1, 0.5, midX + 1, y + 1.8, sz, wood));
    }
    this.addInteractable({
      kind: 'scenery', name: 'Counter', meshes: counter,
      examine: 'Polished by ten thousand small transactions.', actions: [],
    });
    this.addInteractable({
      kind: 'scenery', name: 'Shelves', meshes: shelves,
      examine: 'Mostly buckets, structurally.', actions: [],
    });
  }

  _buildBankChest() {
    const c = this.def.bankChest;
    if (!c) return;
    const wood = new THREE.MeshLambertMaterial({ color: 0x5a4128, flatShading: true });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd8b13a });
    const plane = this.keepPlanes?.floor ?? 0;
    const y = this.getGroundHeight(c.x, c.z, plane);
    const meshes = [
      this._addBox(0.9, 0.5, 0.6, c.x, y + 0.25, c.z, wood),
      this._addBox(0.94, 0.18, 0.64, c.x, y + 0.56, c.z, wood),
      this._addBox(0.96, 0.08, 0.12, c.x, y + 0.36, c.z, gold),
    ];
    this.setPlaneTile(plane, Math.floor(c.x), Math.floor(c.z),
      this.planes[plane].fallbackH, true);
    this.addInteractable({
      kind: 'bank', name: 'Bank chest', meshes,
      examine: 'Your gold is safe with the Bank of Aldera. Probably.',
      actions: [{ label: 'Bank', fn: (ctx) => ctx.ui.openBank() }],
    });
  }

  // ---- the church of Aurel ---------------------------------------------------------

  _buildChurch() {
    const c = this.def.church;
    if (!c) return;
    const stone = new THREE.MeshLambertMaterial({ color: 0x99998f, flatShading: true });
    const darkStone = new THREE.MeshLambertMaterial({ color: 0x7c7c74, flatShading: true });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    const gold = new THREE.MeshLambertMaterial({ color: 0xd8b13a });
    const cloth = new THREE.MeshLambertMaterial({ color: 0xe8e2d0, flatShading: true });

    // shell: x0..x1 / z0..z1 tile bounds, door gap on the south wall
    const { x0, x1, z0, z1 } = c;
    const y = this.getGroundHeight((x0 + x1) / 2, (z0 + z1) / 2);
    const w = x1 - x0, d = z1 - z0;
    const midX = (x0 + x1) / 2, midZ = (z0 + z1) / 2;
    const wallH = 3.6, sink = 0.4;
    const wy = y - sink + (wallH + sink) / 2;
    this._addBox(w, wallH + sink, 0.8, midX, wy, z0 + 0.5, stone);        // north
    const doorX = Math.floor(midX);                                       // south door tile
    const aLen = doorX - x0, bLen = x1 - doorX - 1;
    this._addBox(aLen, wallH + sink, 0.8, x0 + aLen / 2, wy, z1 - 0.5, stone);
    this._addBox(bLen, wallH + sink, 0.8, doorX + 1 + bLen / 2, wy, z1 - 0.5, stone);
    this._addBox(1, wallH - 2.4, 0.8, doorX + 0.5, y + 2.4 + (wallH - 2.4) / 2, z1 - 0.5, stone);
    this._addBox(0.8, wallH + sink, d - 2, x0 + 0.5, wy, midZ, stone);    // west
    this._addBox(0.8, wallH + sink, d - 2, x1 - 0.5, wy, midZ, stone);    // east
    // ceiling seals the eaves; the gable sits above it
    this._addBox(w + 0.4, 0.14, d + 0.4, midX, y + wallH + 0.05, midZ, wood);
    // roof: a shallow gable of two slabs
    const roofA = this._addBox(w + 0.8, 0.18, d / 2 + 0.7, midX, y + wallH + 0.55, midZ - d / 4 + 0.1, darkStone);
    roofA.rotation.x = 0.22; roofA.updateMatrix();
    const roofB = this._addBox(w + 0.8, 0.18, d / 2 + 0.7, midX, y + wallH + 0.55, midZ + d / 4 - 0.1, darkStone);
    roofB.rotation.x = -0.22; roofB.updateMatrix();
    // the sun-disc of Aurel above the door
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5), wood);
    pole.position.set(doorX + 0.5, y + wallH + 1.0, z1 - 0.5);
    this.group.add(pole);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 10), gold);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(doorX + 0.5, y + wallH + 1.7, z1 - 0.45);
    this.group.add(disc);
    this.occluders.push(pole, disc);

    // collision: perimeter minus the door tile
    this.markBlockedRect(x0, z0, x1 - 1, z0);
    this.markBlockedRect(x0, z1 - 1, doorX - 1, z1 - 1);
    this.markBlockedRect(doorX + 1, z1 - 1, x1 - 1, z1 - 1);
    this.markBlockedRect(x0, z0 + 1, x0, z1 - 2);
    this.markBlockedRect(x1 - 1, z0 + 1, x1 - 1, z1 - 2);

    // pews: two rows of benches
    const pews = [];
    for (const pz of [midZ + 0.6, midZ + 2.1]) {
      for (const px of [midX - 1.8, midX + 1.8]) {
        pews.push(this._addBox(2.2, 0.45, 0.5, px, y + 0.32, pz, wood));
        this.setTileBlocked(Math.floor(px - 0.9), Math.floor(pz), true);
        this.setTileBlocked(Math.floor(px + 0.9), Math.floor(pz), true);
      }
    }
    this.addInteractable({
      kind: 'scenery', name: 'Pew', meshes: pews,
      examine: 'Hard wood, long sermons. Character-building.',
      actions: [],
    });

    // the altar of Aurel, at the north end
    const altarMeshes = [
      this._addBox(2.2, 1.0, 0.9, midX, y + 0.5, z0 + 1.6, darkStone),
      this._addBox(2.4, 0.12, 1.1, midX, y + 1.06, z0 + 1.6, stone),
      this._addBox(1.6, 0.06, 0.7, midX, y + 1.15, z0 + 1.6, cloth),
    ];
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 5), cloth);
    candle.position.set(midX + 0.7, y + 1.3, z0 + 1.6);
    this.group.add(candle);
    altarMeshes.push(candle);
    this.markBlockedRect(Math.floor(midX - 1), Math.floor(z0 + 1.2), Math.floor(midX + 1), Math.floor(z0 + 2));
    let altarEntry;
    altarEntry = this.addInteractable({
      kind: 'altar', name: 'Altar', meshes: altarMeshes,
      examine: 'An altar of Aurel. Gold-loving, order-keeping, generally punctual.',
      actions: [{
        label: 'Pray-at',
        fn: (ctx) => {
          if (!ctx.prayers) return;
          if (ctx.prayers.points >= ctx.prayers.maxPoints()) {
            ctx.ui.chat.add('Your spirit is already at ease.');
            return;
          }
          ctx.prayers.restore();
          ctx.ui.chat.add('A calm settles over you. Your prayer points are restored.');
        },
      }],
    });
    this.addInteractable({
      kind: 'scenery', name: 'Church', meshes: [roofA, roofB],
      examine: 'The church of Aurel. Small, sturdy, and sure of itself.',
      actions: [],
    });
  }

  // ---- fires ----------------------------------------------------------------------

  fireAt(tx, tz) {
    return this._fires.some((f) => f.tile.x === tx && f.tile.z === tz);
  }

  /** Spawn a lit fire at a tile; it ages out into ashes on ticks. */
  addFire(tx, tz, tickNo) {
    const x = tx + 0.5, z = tz + 0.5;
    const y = this.getGroundHeight(x, z);
    const root = new THREE.Group();
    root.position.set(x, y, z);
    const wood = new THREE.MeshLambertMaterial({ color: 0x4a3826, flatShading: true });
    const outer = new THREE.MeshLambertMaterial({ color: 0xd86a2a, emissive: 0x7a2e08 });
    const inner = new THREE.MeshLambertMaterial({ color: 0xf0a83a, emissive: 0xa85a10 });
    const meshes = [];
    const add = (mesh) => { root.add(mesh); meshes.push(mesh); return mesh; };
    const log1 = add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.12), wood));
    log1.position.y = 0.06; log1.rotation.y = 0.5;
    const log2 = add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.12), wood));
    log2.position.y = 0.1; log2.rotation.y = -0.7;
    const flameA = add(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 5), outer));
    flameA.position.y = 0.38;
    const flameB = add(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 5), inner));
    flameB.position.y = 0.32;
    this.group.add(root);
    const [lo, hi] = FIREMAKING.fireLifeTicks;
    let entry;
    entry = this.addInteractable({
      kind: 'fire', name: 'Fire', meshes, root,
      examine: 'Warm, crackling, and hungry for fish.',
      actions: [{ label: 'Cook', fn: (ctx) => ctx.ui.openCookMenu(entry) }],
    });
    this._fires.push({
      entry, x, z, tile: { x: tx, z: tz },
      expireAt: tickNo + lo + Math.floor(Math.random() * (hi - lo)),
    });
    return entry;
  }

  // ---- ground items ----------------------------------------------------------

  _spawnGroundItems() {
    for (const g of this.def.groundItems ?? [])
      this.addGroundItem(g.item, g.count ?? 1, g.x, g.z, g.plane ?? 0, g.dy ?? 0,
        g.respawn ? { respawnTicks: g.respawn } : {});
  }

  /** Cosmetic projectile: a small bolt gliding from A to B. */
  spawnProjectile(from, to, color, size = 0.03) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size * 6),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.35 }));
    mesh.position.copy(from);
    mesh.lookAt(to);
    this.group.add(mesh);
    this._projectiles.push({ mesh, from: from.clone(), to: to.clone(), t: 0, dur: 0.28 });
  }

  updateProjectiles(dt) {
    for (const p of this._projectiles) {
      p.t += dt / p.dur;
      if (p.t >= 1) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        p.done = true;
        continue;
      }
      p.mesh.position.lerpVectors(p.from, p.to, p.t);
    }
    this._projectiles = this._projectiles.filter((p) => !p.done);
  }

  /** Drop an item into the world; it becomes a takeable interactable. */
  addGroundItem(id, count, x, z, plane = 0, dy = 0, opts = {}) {
    const def = ITEMS[id];
    if (opts.merge && def.stackable) {
      // arrows raining on one tile pile up in a single entry
      const tx = Math.floor(x), tz = Math.floor(z);
      const existing = this.interactables.find((e) =>
        e.kind === 'ground-item' && e.itemId === id && e.plane === plane &&
        Math.floor(e.root.position.x) === tx && Math.floor(e.root.position.z) === tz);
      if (existing) { existing.count += count; return existing; }
    }
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
          if (!ctx.player.inventory.add(id, entry.count)) { // live count — piles can grow
            ctx.ui.chat.add("You can't carry any more.");
            return;
          }
          this.removeInteractable(entry); // also detaches root + disposes the model
          if (opts.respawnTicks) // tool spawns re-seed so death can never strand you
            this._respawnQueue.push({ id, count, x, z, plane, dy, opts, at: this._tick + opts.respawnTicks });
          ctx.ui.chat.add('You take the ' + def.name.toLowerCase() + '.');
          ctx.ui.refreshInventory();
        },
      }],
    });
    if (opts.despawnAtTick) this._timedItems.push({ entry, at: opts.despawnAtTick });
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
      case 'axe': {
        const handleMat = new THREE.MeshLambertMaterial({ color: m.handle, flatShading: true });
        const shaft = add(new THREE.BoxGeometry(0.06, 0.6, 0.06), 0, 0.06, 0, handleMat);
        shaft.rotation.z = Math.PI / 2 - 0.35;
        add(new THREE.BoxGeometry(0.2, 0.15, 0.05), -0.24, 0.16, 0);
        break;
      }
      case 'pick': {
        const handleMat = new THREE.MeshLambertMaterial({ color: m.handle, flatShading: true });
        const shaft = add(new THREE.BoxGeometry(0.06, 0.6, 0.06), 0, 0.06, 0, handleMat);
        shaft.rotation.z = Math.PI / 2 - 0.35;
        add(new THREE.BoxGeometry(0.36, 0.06, 0.06), -0.24, 0.16, 0);
        break;
      }
      case 'rod': {
        const rod = add(new THREE.CylinderGeometry(0.015, 0.028, 0.95, 5), 0, 0.12, 0);
        rod.rotation.z = 1.1;
        break;
      }
    }
    return { root, meshes };
  }
}
