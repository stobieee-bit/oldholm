// OLDHOLM — npc.js
// Mob spawning, per-tick AI (wander / aggro / BFS chase / leash-reset),
// tile-truth movement with smooth visual glide, drop tables, respawns.
// Each mob type bakes its low-poly recipe into ONE merged vertex-colored
// geometry, so a mob costs a single draw call.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { combatLevel } from './combat.js';
import { PET_DROPS } from '../data/pets.js';

const CHASE_LIMIT = 12;   // BFS search window half-size, tiles
const LEASH_RADIUS = 10;  // beyond this from spawn, a mob gives up and resets
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

// ---- geometry baking --------------------------------------------------------

const geoCache = new Map();

export function bakeMobGeometry(defId, def) {
  if (geoCache.has(defId)) return geoCache.get(defId);
  const parts = [];
  const color = new THREE.Color();
  for (const p of def.model.parts) {
    let g;
    if (p.kind === 'box') g = new THREE.BoxGeometry(...p.size);
    else if (p.kind === 'cone') g = new THREE.ConeGeometry(p.r, p.h, p.seg ?? 6);
    else if (p.kind === 'cyl') g = new THREE.CylinderGeometry(p.rt ?? p.r, p.rb ?? p.r, p.h, p.seg ?? 8);
    else if (p.kind === 'sphere') g = new THREE.IcosahedronGeometry(p.r, p.detail ?? 1);
    else g = new THREE.IcosahedronGeometry(p.r, 0);
    if (p.scale) g.scale(...p.scale);
    if (p.rotX) g.rotateX(p.rotX);
    if (p.rotY) g.rotateY(p.rotY);
    if (p.rotZ) g.rotateZ(p.rotZ);
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
  // The engine points model FRONTS toward -z (facing math adds PI). Models
  // authored face-forward at +z (the figure() humanoids and their kin) declare
  // front: 'z' and get turned around here, once, at bake time.
  if (def.model.front === 'z') merged.rotateY(Math.PI);
  merged.computeVertexNormals();
  for (const p of parts) p.dispose();
  geoCache.set(defId, merged);
  return merged;
}

const mobMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

// ---- a single mob -----------------------------------------------------------

class Mob {
  constructor(defId, def, spawnTile, world, plane = 0) {
    this.defId = defId;
    this.def = def;
    this.name = def.name;
    this.world = world;
    this.plane = plane;
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

    this.mesh = new THREE.Mesh(bakeMobGeometry(defId, def), mobMaterial.clone()); // own material → can flash on hit
    // yaw outermost: rotation.x becomes a facing-relative pitch, so the attack
    // lunge and death topple tip FORWARD on every heading (default XYZ order
    // pitched about the world X axis — mobs facing east toppled sideways)
    this.mesh.rotation.order = 'YXZ';
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
    if (dmg > 0) { this._hitFlash = 1; this._flinch = 1; } // white flash + recoil squash
    if (this.hp <= 0) {
      // some foes cannot die without a specific item in hand (spec §7: Ravenmoor + stake)
      const need = this.def.needsItemToKill;
      if (need && !combat.player.inventory.slots.some((s) => s && s.id === need)) {
        this.hp = 1;
        if (tickNo > (this._nagAt ?? 0)) {
          this._nagAt = tickNo + 4;
          combat.ui.chat.add('Your blows pass through him. He cannot be slain without the stake.', 'system');
        }
      } else { this.die(tickNo, combat); return; }
    }
    if (!this.target) { this.target = 'player'; this.returning = false; } // auto-retaliate
  }

  die(tickNo, combat) {
    this.dead = true;
    this.target = null;
    this.entry.hidden = true;             // no longer targetable
    this._deathT = 0;                     // topple animation (updateVisual runs it)
    this._deathBaseY = this.world.getGroundHeight(this.mesh.position.x, this.mesh.position.z, this.plane);
    this._deathDir = Math.random() < 0.5 ? 1 : -1;
    this.respawnAt = this.temporary ? Infinity : tickNo + this.def.respawnTicks;
    if (combat.player.target === this) combat.player.target = null;
    if (combat.kills) combat.kills[this.defId] = (combat.kills[this.defId] ?? 0) + 1;
    this.rollDrops(tickNo);
    // pets roll independently of the drop table (data/pets.js)
    const pd = PET_DROPS[this.defId];
    if (pd && Math.random() < pd.chance && combat.player.inventory.add(pd.pet, 1)) {
      combat.ui.chat.add('Something crawls from the remains and adopts you — a pet! (Summon it from your pack.)', 'system');
      combat.audio?.sfx('quest');
      combat.ui.refreshInventory();
    }
    const oq = this.def.onDeathQuest; // [questId, fromStage, toStage]
    if (oq && combat.quests && combat.quests.stage(oq[0]) >= oq[1])
      combat.quests.setStage(oq[0], oq[2]);
  }

  rollDrops(tickNo) {
    const table = this.def.drops;
    const opts = { despawnAtTick: tickNo + 300 }; // mob drops linger ~3 minutes
    const dropAt = (id, count) => this.world.addGroundItem(
      id, count, this.tile.x + 0.3 + Math.random() * 0.4,
      this.tile.z + 0.3 + Math.random() * 0.4, this.plane, 0, opts);
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
    this.mesh.position.set(this._from.x,
      this.world.getGroundHeight(this._from.x, this._from.z, this.plane), this._from.z);
    this.mesh.rotation.set(0, this._faceY ?? 0, 0); // undo the death topple
    this.mesh.scale.setScalar(1);
    this.mesh.visible = true;
    this.entry.hidden = false;
  }

  /** Imp trick: hop to a random nearby walkable tile. */
  blink() {
    for (let tries = 0; tries < 8; tries++) {
      const nx = this.tile.x + randInt(-4, 4), nz = this.tile.z + randInt(-4, 4);
      if (this.world.isBlocked(nx, nz, this.plane)) continue;
      if (Math.abs(nx - this.spawnTile.x) > this.def.wanderRadius + 4 ||
          Math.abs(nz - this.spawnTile.z) > this.def.wanderRadius + 4) continue;
      this.tile = { x: nx, z: nz };
      this._from = { x: nx + 0.5, z: nz + 0.5 };
      this._to = { ...this._from };
      this._t = 1;
      this.mesh.position.set(nx + 0.5, this.world.getGroundHeight(nx + 0.5, nz + 0.5, this.plane), nz + 0.5);
      return;
    }
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
        if (this.world.isBlocked(nx, nz, this.plane)) continue;
        const first = cur.first ?? { x: nx, z: nz };
        if (nx === goal.x && nz === goal.z) return first;
        queue.push({ x: nx, z: nz, first });
      }
    }
    return null;
  }

  tick(tickNo, combat) {
    if (this.hiddenNpc) return; // asleep in a tent, awaiting the plot
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
    if (!this.target && this.def.aggroRadius > 0 && player.plane === this.plane &&
        combat.playerCombatLevel() <= 2 * this.cl) {
      const d = Math.max(Math.abs(pTile.x - this.tile.x), Math.abs(pTile.z - this.tile.z));
      if (d <= this.def.aggroRadius) this.target = 'player';
    }

    if (this.target === 'player') {
      if (player.plane !== this.plane) { this.giveUp(); return; }
      // imps blink away mid-fight (spec §7: teleports short hops)
      if (this.def.blinky && Math.random() < 0.12) this.blink();
      const cheb = Math.max(Math.abs(pTile.x - this.tile.x), Math.abs(pTile.z - this.tile.z));
      const range = this.def.attackRange ?? 1;
      if (cheb <= range) {
        if (this.cooldown === 0) {
          if (range > 1) { // a caster: send a bolt
            const from = this.splatAnchor();
            const to = new (from.constructor)(player.pos.x,
              this.world.getGroundHeight(player.pos.x, player.pos.z, player.plane) + 1.2, player.pos.z);
            this.world.spawnProjectile(from, to, this.def.projectileColor ?? 0xffffff, 0.03);
          }
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

    // idle chatter for townsfolk
    if (this.def.chatter && player.plane === this.plane) {
      const d = Math.hypot(player.pos.x - this.mesh.position.x, player.pos.z - this.mesh.position.z);
      if (d < 7 && tickNo > (this._chatterAt ?? 0) && Math.random() < 0.02) {
        this._chatterAt = tickNo + 40;
        const line = this.def.chatter[randInt(0, this.def.chatter.length - 1)];
        combat.ui.fx.say(() => this.splatAnchor(), line);
      }
    }

    // idle wander
    if (this.def.wanderRadius === 0) return;
    if (--this.wanderWait <= 0) {
      this.wanderWait = randInt(5, 14);
      const dx = randInt(-1, 1), dz = randInt(-1, 1);
      if (dx === 0 && dz === 0) return;
      const nx = this.tile.x + dx, nz = this.tile.z + dz;
      if (this.world.isBlocked(nx, nz, this.plane)) return;
      if (Math.abs(nx - this.spawnTile.x) > this.def.wanderRadius ||
          Math.abs(nz - this.spawnTile.z) > this.def.wanderRadius) return;
      this.stepTo(nx, nz);
    }
  }

  updateVisual(dt, playerPos) {
    if (this.dead) { this._deathAnim(dt); return; }
    // model fronts are built toward -z, so face = atan2(dx, dz) + PI
    let gy;
    if (this._t < 1) {
      this._t = Math.min(1, this._t + dt / 0.6); // glide one tile per tick
      const x = this._from.x + (this._to.x - this._from.x) * this._t;
      const z = this._from.z + (this._to.z - this._from.z) * this._t;
      gy = this.world.getGroundHeight(x, z, this.plane);
      this.mesh.position.set(x, gy, z);
      this._faceY = Math.atan2(this._to.x - this._from.x, this._to.z - this._from.z) + Math.PI;
    } else {
      const p = this.mesh.position;
      gy = this.world.getGroundHeight(p.x, p.z, this.plane);
      this.mesh.position.y = gy;
      if (this.target === 'player' && playerPos)
        this._faceY = Math.atan2(playerPos.x - p.x, playerPos.z - p.z) + Math.PI;
    }
    this._animate(dt, gy);
  }

  /** Procedural life on the single merged mesh — a bobbing/swaying gait while
   *  moving, gentle breathing at rest, and a forward lunge when it strikes.
   *  Visual only: never touches tile/collision, so combat is unaffected. */
  _animate(dt, gy) {
    const moving = this._t < 1;
    this._amt = (this._amt ?? 0) + ((moving ? 1 : 0) - (this._amt ?? 0)) * Math.min(1, dt * 9);
    this._phase = (this._phase ?? 0) + (moving ? dt * 12 : 0);
    this._lunge = Math.max(0, (this._lunge ?? 0) - dt * 3.2);
    const amt = this._amt, ph = this._phase;
    const h = this.def.model.height || 1.4;
    const hop = 0.055 * (1.4 / Math.max(0.55, h));   // smaller creatures bounce more
    this.mesh.position.y = gy + Math.abs(Math.sin(ph)) * hop * amt;
    const lunge = Math.sin(this._lunge * Math.PI);   // 0..1..0 as it decays from 1
    this.mesh.rotation.set(-lunge * 0.38, this._faceY, Math.sin(ph) * 0.07 * amt);
    this._breathe = (this._breathe ?? 0) + dt * 2.2;
    // hit reaction: a white flash + a quick vertical squash that recovers
    this._hitFlash = Math.max(0, (this._hitFlash ?? 0) - dt * 6.5);
    this._flinch = Math.max(0, (this._flinch ?? 0) - dt * 5);
    const squash = Math.sin(this._flinch * Math.PI) * 0.13;
    this.mesh.scale.set(1 + squash * 0.5, 1 - squash + (1 - amt) * Math.sin(this._breathe) * 0.02, 1 + squash * 0.5);
    this.mesh.material.emissive.setScalar(this._hitFlash * 0.42);
  }

  /** Kick a quick forward lunge (called when the mob lands a hit). */
  lungeAttack() { this._lunge = 1; }

  /** Death: topple over, sink, and shrink out over ~0.55s, then hide. */
  _deathAnim(dt) {
    if (!this.mesh.visible) return;
    this._deathT = (this._deathT ?? 0) + dt;
    const t = this._deathT / 0.55;
    if (t >= 1) { this.mesh.visible = false; return; }
    const e = t * t * (3 - 2 * t); // smoothstep
    this.mesh.rotation.set(-e * 1.45, this._faceY ?? 0, (this._deathDir ?? 1) * e * 0.5);
    this.mesh.position.y = (this._deathBaseY ?? this.mesh.position.y) - e * 0.12;
    this.mesh.scale.setScalar(1 - e * 0.12);
  }
}

// ---- the manager --------------------------------------------------------------

export class NPCManager {
  constructor(world) {
    this.world = world;
    this.mobs = [];
  }

  _resolvePlane(p) {
    if (p === 'towerBasement') return this.world.towerBasementPlane ?? 0;
    if (p === 'corvathSewers') return this.world.sewersPlane ?? 0;
    if (p === 'guild') return this.world.guildPlane ?? 0;
    if (p === 'iceCave') return this.world.iceCavePlane ?? 0;
    if (p === 'corvathTomb') return this.world.tombPlane ?? 0;
    if (p === 'manorCrypt') return this.world.manorCryptPlane ?? 0;
    if (p === 'ashkaraCaldera') return this.world.calderaPlane ?? 0;
    if (p === 'undervault') return this.world.undervaultPlane ?? 0;
    if (p === 'sanctum') return this.world.sanctumPlane ?? 0;
    return p ?? 0;
  }

  /** Spawn one mob/NPC and register its interactable. Also used dynamically
   *  (siege waves): pass opts.temporary to skip respawn and allow removal. */
  spawnOne(defId, def, x, z, plane, opts = {}) {
      const mob = new Mob(defId, def, { x: Math.floor(x), z: Math.floor(z) }, this.world, plane);
      const actions = [];
      if (def.talk) actions.push({
        label: 'Talk-to',
        fn: (ctx) => {
          if (def.needsCharm && !ctx.player.inventory.slots.some((s) => s && s.id === 'spectral_charm')) {
            ctx.ui.chat.add('A sorrowful presence stirs the air — but you hear only wind.');
            return;
          }
          ctx.dialogue.start(def.talk, mob);
        },
      });
      if (def.shop) actions.push({
        label: 'Trade',
        fn: (ctx) => ctx.ui.openShop(def.shop),
      });
      if (def.bank) actions.push({
        label: 'Bank',
        fn: (ctx) => ctx.ui.openBank(),
      });
      if (def.market) actions.push({
        label: 'Exchange',
        fn: (ctx) => ctx.ui.openMarket(),
      });
      if (def.shear) actions.push({
        label: 'Shear',
        fn: (ctx) => ctx.actions.shearSheep(mob),
      });
      if (def.milkable) actions.push({
        label: 'Milk',
        fn: (ctx) => ctx.actions.milkCow(mob),
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
      if (def.hidden || opts.hidden) { // quest characters awaiting their cue
        mob.hiddenNpc = true;
        mob.startsHidden = true; // save.js persists reveal/dead state for these
        mob.mesh.visible = false;
        mob.entry.hidden = true;
      }
      if (opts.temporary) mob.temporary = true; // no respawn; culled after death
      this.mobs.push(mob);
      return mob;
  }

  spawnAll() {
    // a spawn entry's own hidden flag counts too (quest bosses set it there);
    // night: true creatures start hidden and the weather system wakes them
    for (const s of this.world.def.spawns ?? []) {
      const m = this.spawnOne(s.mob, MOBS[s.mob], s.x, s.z, this._resolvePlane(s.plane), { hidden: s.hidden || s.night });
      if (s.night) m.nightOnly = true;
    }
    for (const s of this.world.def.npcs ?? [])
      this.spawnOne(s.npc, NPCS[s.npc], s.x, s.z, this._resolvePlane(s.plane), { hidden: s.hidden });
  }

  /** Remove a (temporary) mob entirely: scene, interactables, list. */
  remove(mob) {
    this.world.removeInteractable?.(mob.entry);
    mob.mesh.parent?.remove(mob.mesh);
    const i = this.mobs.indexOf(mob);
    if (i !== -1) this.mobs.splice(i, 1);
  }

  /** Reveal hidden quest NPCs (dialogue action 'unhide:<defId>'). Reveals
   *  every hidden mob of that id — shrine groups appear as one event. */
  unhide(defId) {
    for (const mob of this.mobs) {
      if (mob.defId !== defId || !mob.hiddenNpc) continue;
      mob.hiddenNpc = false;
      mob.mesh.visible = true;
      mob.entry.hidden = false;
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
