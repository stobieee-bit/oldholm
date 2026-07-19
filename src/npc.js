// OLDHOLM — npc.js
// Mob spawning, per-tick AI (wander / aggro / BFS chase / leash-reset),
// tile-truth movement with smooth visual glide, drop tables, respawns.
// Each mob type bakes its low-poly recipe into ONE merged vertex-colored
// geometry, so a mob costs a single draw call.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOBS } from '../data/mobs.js';
import { combatLevel } from './combat.js';

const CHASE_LIMIT = 12;   // BFS search window half-size, tiles
const LEASH_RADIUS = 10;  // beyond this from spawn, a mob gives up and resets
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// ---- geometry baking --------------------------------------------------------

const geoCache = new Map();

function bakeMobGeometry(defId, def) {
  if (geoCache.has(defId)) return geoCache.get(defId);
  const parts = [];
  const color = new THREE.Color();
  for (const p of def.model.parts) {
    let g;
    if (p.kind === 'box') g = new THREE.BoxGeometry(...p.size);
    else if (p.kind === 'cone') g = new THREE.ConeGeometry(p.r, p.h, 6);
    else g = new THREE.IcosahedronGeometry(p.r, 0);
    if (p.rotX) g.rotateX(p.rotX);
    if (p.rotY) g.rotateY(p.rotY);
    g.translate(...p.at);
    color.setHex(p.color); // hex setters convert sRGB -> linear working space
    const n = g.getAttribute('position').count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    parts.push(g.toNonIndexed());
  }
  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  for (const p of parts) p.dispose();
  geoCache.set(defId, merged);
  return merged;
}

const mobMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

// ---- a single mob -----------------------------------------------------------

class Mob {
  constructor(defId, def, spawnTile, world) {
    this.defId = defId;
    this.def = def;
    this.name = def.name;
    this.world = world;
    this.cl = combatLevel({ ...def.stats, prayer: 1 });
    this.maxHp = def.stats.hp;
    this.hp = this.maxHp;
    this.spawnTile = { ...spawnTile };
    this.tile = { ...spawnTile };
    this.dead = false;
    this.respawnAt = 0;
    this.target = null;        // 'player' | null
    this.returning = false;
    this.cooldown = 0;
    this.wanderWait = randInt(3, 12);
    this.lastCombatTick = -999;

    this.mesh = new THREE.Mesh(bakeMobGeometry(defId, def), mobMaterial);
    this.mesh.position.set(this.tile.x + 0.5, 0, this.tile.z + 0.5);
    world.group.add(this.mesh);
    this._from = { x: this.tile.x + 0.5, z: this.tile.z + 0.5 };
    this._to = { ...this._from };
    this._t = 1;
    this._faceY = 0;
  }

  stats() {
    const s = this.def.stats, b = this.def.bonuses;
    return { att: s.att, str: s.str, def: s.def, attBonus: b.att, strBonus: b.str, defBonus: b.def };
  }

  visualPos() {
    return this.mesh.position;
  }

  splatAnchor() {
    if (this.dead) return null;
    const p = this.mesh.position;
    return new THREE.Vector3(p.x, p.y + this.def.model.height * 0.7, p.z);
  }

  takeDamage(dmg, tickNo, combat) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.lastCombatTick = tickNo;
    if (this.hp <= 0) { this.die(tickNo, combat); return; }
    if (!this.target) { this.target = 'player'; this.returning = false; } // auto-retaliate
  }

  die(tickNo, combat) {
    this.dead = true;
    this.target = null;
    this.mesh.visible = false;
    this.entry.hidden = true;
    this.respawnAt = tickNo + this.def.respawnTicks;
    if (combat.player.target === this) combat.player.target = null;
    this.rollDrops(tickNo);
  }

  rollDrops(tickNo) {
    const table = this.def.drops;
    const opts = { despawnAtTick: tickNo + 300 }; // mob drops linger ~3 minutes
    const dropAt = (id, count) => this.world.addGroundItem(
      id, count, this.tile.x + 0.3 + Math.random() * 0.4,
      this.tile.z + 0.3 + Math.random() * 0.4, 0, 0, opts);
    const roll = (e) => dropAt(e.item, Array.isArray(e.count) ? randInt(e.count[0], e.count[1]) : e.count);
    table.slice(0, this.def.alwaysDrops).forEach(roll);
    const rest = table.slice(this.def.alwaysDrops);
    if (!rest.length) return;
    const total = rest.reduce((a, e) => a + e.weight, 0);
    let pick = Math.random() * total;
    for (const e of rest) {
      pick -= e.weight;
      if (pick <= 0) { if (e.item) roll(e); break; }
    }
  }

  respawn() {
    this.dead = false;
    this.hp = this.maxHp;
    this.tile = { ...this.spawnTile };
    this.returning = false;
    this._from = { x: this.tile.x + 0.5, z: this.tile.z + 0.5 };
    this._to = { ...this._from };
    this._t = 1;
    this.mesh.position.set(this._from.x, this.world.getGroundHeight(this._from.x, this._from.z), this._from.z);
    this.mesh.visible = true;
    this.entry.hidden = false;
  }

  /** Abandon the chase for any reason: walk home and shrug off all damage. */
  giveUp() {
    this.target = null;
    this.returning = true;
    this.hp = this.maxHp;
  }

  stepTo(tx, tz) {
    this.tile = { x: tx, z: tz };
    this._from = { x: this.mesh.position.x, z: this.mesh.position.z };
    this._to = { x: tx + 0.5, z: tz + 0.5 };
    this._t = 0;
  }

  /** BFS on tiles toward the target tile; returns the first step or null. */
  pathStep(goal) {
    const w = this.world, sx = this.tile.x, sz = this.tile.z;
    if (sx === goal.x && sz === goal.z) return null;
    const key = (x, z) => x + ',' + z;
    const seen = new Set([key(sx, sz)]);
    const queue = [{ x: sx, z: sz, first: null }];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let qi = 0;
    while (qi < queue.length && queue.length < 320) {
      const cur = queue[qi++];
      for (const [dx, dz] of dirs) {
        const nx = cur.x + dx, nz = cur.z + dz;
        if (Math.abs(nx - sx) > CHASE_LIMIT || Math.abs(nz - sz) > CHASE_LIMIT) continue;
        if (seen.has(key(nx, nz))) continue;
        seen.add(key(nx, nz));
        if (this.world.isBlocked(nx, nz, 0)) continue;
        const first = cur.first ?? { x: nx, z: nz };
        if (nx === goal.x && nz === goal.z) return first;
        queue.push({ x: nx, z: nz, first });
      }
    }
    return null;
  }

  tick(tickNo, combat) {
    if (this.dead) {
      if (tickNo >= this.respawnAt) this.respawn();
      return;
    }
    if (this.shearedUntil && tickNo >= this.shearedUntil) {
      this.shearedUntil = 0;
      this.mesh.scale.setScalar(1); // the wool grows back
    }
    if (this.cooldown > 0) this.cooldown--;

    const player = combat.player;
    const pTile = { x: Math.floor(player.pos.x), z: Math.floor(player.pos.z) };
    const distFromHome = Math.max(
      Math.abs(this.tile.x - this.spawnTile.x), Math.abs(this.tile.z - this.spawnTile.z));

    // leash: too far from home — give up, walk back, shrug off all damage
    if (this.target && distFromHome > LEASH_RADIUS) this.giveUp();

    if (this.returning) {
      const step = this.pathStep(this.spawnTile);
      if (step) this.stepTo(step.x, step.z);
      if (this.tile.x === this.spawnTile.x && this.tile.z === this.spawnTile.z) this.returning = false;
      return;
    }

    // aggression (spec §7): only onto players of <= 2x our combat level
    if (!this.target && this.def.aggroRadius > 0 && player.plane === 0 &&
        combat.playerCombatLevel() <= 2 * this.cl) {
      const d = Math.max(Math.abs(pTile.x - this.tile.x), Math.abs(pTile.z - this.tile.z));
      if (d <= this.def.aggroRadius) this.target = 'player';
    }

    if (this.target === 'player') {
      if (player.plane !== 0) { this.giveUp(); return; }
      const cheb = Math.max(Math.abs(pTile.x - this.tile.x), Math.abs(pTile.z - this.tile.z));
      if (cheb <= 1) {
        if (this.cooldown === 0) {
          combat.mobAttack(this, tickNo);
          this.lastCombatTick = tickNo;
          this.cooldown = this.def.speed;
        }
      } else {
        const step = this.pathStep(pTile);
        if (step) this.stepTo(step.x, step.z);
        else if (cheb > CHASE_LIMIT) this.giveUp();
      }
      return;
    }

    // idle wander
    if (--this.wanderWait <= 0) {
      this.wanderWait = randInt(5, 14);
      const dx = randInt(-1, 1), dz = randInt(-1, 1);
      if (dx === 0 && dz === 0) return;
      const nx = this.tile.x + dx, nz = this.tile.z + dz;
      if (this.world.isBlocked(nx, nz, 0)) return;
      if (Math.abs(nx - this.spawnTile.x) > this.def.wanderRadius ||
          Math.abs(nz - this.spawnTile.z) > this.def.wanderRadius) return;
      this.stepTo(nx, nz);
    }
  }

  updateVisual(dt, playerPos) {
    if (this.dead) return;
    // model fronts are built toward -z, so face = atan2(dx, dz) + PI
    if (this._t < 1) {
      this._t = Math.min(1, this._t + dt / 0.6); // glide one tile per tick
      const x = this._from.x + (this._to.x - this._from.x) * this._t;
      const z = this._from.z + (this._to.z - this._from.z) * this._t;
      this.mesh.position.set(x, this.world.getGroundHeight(x, z), z);
      this._faceY = Math.atan2(this._to.x - this._from.x, this._to.z - this._from.z) + Math.PI;
    } else {
      const p = this.mesh.position;
      this.mesh.position.y = this.world.getGroundHeight(p.x, p.z);
      if (this.target === 'player' && playerPos)
        this._faceY = Math.atan2(playerPos.x - p.x, playerPos.z - p.z) + Math.PI;
    }
    this.mesh.rotation.y = this._faceY;
  }
}

// ---- the manager --------------------------------------------------------------

export class NPCManager {
  constructor(world) {
    this.world = world;
    this.mobs = [];
  }

  spawnAll(ui, getCombat) {
    for (const s of this.world.def.spawns ?? []) {
      const def = MOBS[s.mob];
      const mob = new Mob(s.mob, def, { x: Math.floor(s.x), z: Math.floor(s.z) }, this.world);
      const actions = [];
      if (def.shear) actions.push({
        label: 'Shear',
        fn: (ctx) => ctx.actions.shearSheep(mob),
      });
      if (def.attackable !== false) actions.push({
        label: 'Attack',
        fn: (ctx) => ctx.combat.playerEngage(mob),
      });
      mob.entry = this.world.addInteractable({
        kind: 'mob', name: def.name, mob,
        meshes: [mob.mesh], examine: def.examine,
        actions,
      });
      this.mobs.push(mob);
    }
  }

  tick(tickNo, combat) {
    for (const m of this.mobs) m.tick(tickNo, combat);
  }

  updateVisuals(dt, playerPos) {
    for (const m of this.mobs) m.updateVisual(dt, playerPos);
  }

  regenAll() {
    for (const m of this.mobs) {
      if (!m.dead && !m.target && m.hp < m.maxHp) m.hp++;
    }
  }

  dropAggroOnPlayer() {
    for (const m of this.mobs) {
      if (m.target === 'player') { m.target = null; m.returning = true; }
    }
  }
}
