// OLDHOLM — player.js
// First-person controller: pointer-lock mouse look, WASD movement,
// Shift-toggled run with an energy meter, circle-vs-blocked-tile collision.
// The player moves freely; the world stops them at tile-truth blockers.

import * as THREE from 'three';
import { ITEMS } from '../data/items.js';
import { STYLE_SETS, typeIndex } from '../data/styles.js';
import { XP_TABLE, levelForXp } from './skills.js';
import { isBound } from './keybinds.js';

export const SKILL_NAMES = [
  'Attack', 'Strength', 'Defence', 'Hitpoints', 'Ranged', 'Magic', 'Prayer',
  'Cooking', 'Fishing', 'Mining', 'Smithing', 'Woodcutting', 'Firemaking',
  'Crafting', 'Glyphcraft',
  // append-only (save order is positional)
  'Herblore', 'Farming', 'Agility', 'Construction', 'Thieving', // append-only: save order is positional
];

/** 28 slots; stackables share a slot. */
export class Inventory {
  constructor(size = 28) {
    this.slots = new Array(size).fill(null); // {id, count} | null
  }

  add(id, count = 1) {
    if (!ITEMS[id]) return false; // a missing item def must never crash the pack
    if (ITEMS[id].stackable) {
      const slot = this.slots.find((s) => s && s.id === id);
      if (slot) { slot.count += count; this.onAdd?.(id); return true; }
    }
    const free = this.slots.indexOf(null);
    if (free === -1) return false;
    this.slots[free] = { id, count };
    this.onAdd?.(id); // the collection log watches first acquisitions
    return true;
  }

  removeSlot(i) {
    const s = this.slots[i];
    this.slots[i] = null;
    return s;
  }
}

const WALK_SPEED = 2.3;   // units (tiles) per second
const RUN_SPEED = 4.6;
const RADIUS = 0.32;      // collision circle
const EYE_HEIGHT = 1.55;
const RUN_DRAIN = 5;      // energy per second while running
const RUN_REGEN = 1.6;    // energy per second while walking/idle
const MOUSE_SENS = 0.0023;
const PITCH_LIMIT = 1.45;

export class Player {
  constructor(camera, world, spawn) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.yaw = spawn.yaw ?? 0;
    this.pitch = 0;
    this.runOn = false;
    this.energy = 100;
    this.plane = 0;            // 0 = terrain; higher = building floors
    this.inventory = new Inventory();
    this.skills = SKILL_NAMES.map((name) => {
      const level = name === 'Hitpoints' ? 10 : 1;
      return { name, level, xp: XP_TABLE[level] };
    });
    this.boosts = {}; // skill -> { amount, ticksLeft } temporary potion boosts
    this.wading = false;     // standing in water (crawl speed, no running)
    this.walkedMeters = 0;   // distance since the last Agility xp grant
    // combat state
    this.hp = 10;
    this.maxHp = 10;
    this.target = null;        // a mob, or null
    this.attackCooldown = 0;   // ticks until the next swing
    this.kickPitch = 0;        // camera jolt from taking a hit (decays fast)
    this.kickRoll = 0;
    this.attackSpeed = 4;      // unarmed; wielding sets the weapon's speed
    this.styleIndex = 0;       // index into the wielded weapon's style set
    this.autoRetaliate = true;
    // all 11 equipment slots (spec §8)
    this.equipment = {
      head: null, cape: null, neck: null, ammo: null, weapon: null,
      body: null, shield: null, legs: null, gloves: null, boots: null, ring: null,
    };
    this.ammoCount = 0; // arrows are a stack; the slot id + this count
    this.keys = { forward: false, back: false, left: false, right: false };
    this.pointerLocked = false;
    this.inputEnabled = false; // off while the title/pause overlay is up
    this.menuOpen = false;     // a context menu owns input while open
    this._dragging = false;
    this._eyeY = world.getGroundHeight(spawn.x, spawn.z) + EYE_HEIGHT;
    camera.rotation.order = 'YXZ';
  }

  /** Wire input. `lockTarget` is the element pointer lock attaches to. */
  attach(lockTarget) {
    this.lockTarget = lockTarget;

    const typing = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '');
    window.addEventListener('keydown', (e) => {
      if (typing()) return; // the chat box (or a form field) owns the keys
      if (e.target instanceof HTMLInputElement) return; // typing in a search box, not walking
      if (!this.inputEnabled || this.menuOpen) return; // overlay/menu owns the keyboard
      if (e.code === 'Space') e.preventDefault(); // no jumping — this is a civilized game
      if (e.repeat) return;
      if (isBound('forward', e.code)) this.keys.forward = true;
      else if (isBound('back', e.code)) this.keys.back = true;
      else if (isBound('left', e.code)) this.keys.left = true;
      else if (isBound('right', e.code)) this.keys.right = true;
      else if (isBound('run', e.code)) this.runOn = !this.runOn;
    });
    window.addEventListener('keyup', (e) => { // always processed: releasing is always safe
      if (isBound('forward', e.code)) this.keys.forward = false;
      else if (isBound('back', e.code)) this.keys.back = false;
      else if (isBound('left', e.code)) this.keys.left = false;
      else if (isBound('right', e.code)) this.keys.right = false;
    });
    // keyups are lost when focus leaves (Alt-Tab, pointer-lock exit, tab switch)
    window.addEventListener('blur', () => this.clearKeys());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clearKeys();
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.lockTarget;
      if (!this.pointerLocked) this.clearKeys();
    });
    document.addEventListener('mousemove', (e) => {
      if (this.menuOpen) return; // freeze the view while choosing an option
      if (this.pointerLocked || this._dragging) this._look(e.movementX, e.movementY);
    });
    // drag-look fallback for environments where pointer lock is unavailable
    // (left button only — right button belongs to the context menu)
    lockTarget.addEventListener('mousedown', (e) => {
      if (!this.pointerLocked && e.button === 0) this._dragging = true;
    });
    window.addEventListener('mouseup', () => { this._dragging = false; });
  }

  clearKeys() {
    this.keys.forward = this.keys.back = this.keys.left = this.keys.right = false;
    this._dragging = false;
  }

  requestLock() {
    try {
      const p = this.lockTarget.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) { /* fall back to drag-look */ }
  }

  _look(dx, dy) {
    const s = MOUSE_SENS * (this.lookSens ?? 1);
    this.yaw -= dx * s;
    this.pitch -= dy * s;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  }

  get running() {
    return this.runOn && this.energy > 0;
  }

  update(dt) {
    const k = this.keys;
    let mx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    let mz = (k.forward ? 1 : 0) - (k.back ? 1 : 0);
    if (this.menuOpen || (this.stunTicks ?? 0) > 0) { mx = 0; mz = 0; } // menus and stuns root the feet
    const moving = mx !== 0 || mz !== 0;

    // wading: water is passable on the surface, but at a crawl and never at a
    // run. You only wade when the ground under you actually sits at the
    // waterline — the bridge deck crosses water-flagged tiles at height 2.05
    // and must stay dry, full-speed footing.
    this.wading = this.plane === 0
      && this.world.isWater(Math.floor(this.pos.x), Math.floor(this.pos.z))
      && this.world.getGroundHeight(this.pos.x, this.pos.z, 0) < this.world.def.waterLevel + 0.05;

    if (moving) {
      const inv = 1 / Math.hypot(mx, mz);
      mx *= inv; mz *= inv;
      const speed = (this.running && !this.wading ? RUN_SPEED : WALK_SPEED)
        * (this.wading ? 0.28 : 1);
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      // forward = (-sin(yaw), -cos(yaw)), right = (cos(yaw), -sin(yaw))
      const dx = (-sin * mz + cos * mx) * speed * dt;
      const dz = (-cos * mz - sin * mx) * speed * dt;
      // axis-separated moves give free wall sliding
      const px = this.pos.x, pz = this.pos.z;
      if (!this._collides(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
      if (!this._collides(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
      this.walkedMeters += Math.hypot(this.pos.x - px, this.pos.z - pz); // Agility trains by travel
    }

    if (this.running && moving && !this.wading) {
      this.energy = Math.max(0, this.energy - RUN_DRAIN * dt);
      if (this.energy === 0) this.runOn = false;
    } else {
      // Agility quickens the second wind (up to ~+70% regen at level 99)
      const agi = this.skillByName('Agility')?.level ?? 1;
      this.energy = Math.min(100, this.energy + RUN_REGEN * (1 + agi / 140) * dt);
    }

    // follow the ground, smoothed so steps and bridge lips don't jolt the camera;
    // in water, wade chest-deep at most instead of sinking to the river bed
    let groundY = this.world.getGroundHeight(this.pos.x, this.pos.z, this.plane);
    if (this.wading) groundY = Math.max(groundY, this.world.def.waterLevel - 0.85);
    const targetY = groundY + EYE_HEIGHT;
    this._eyeY += (targetY - this._eyeY) * Math.min(1, dt * 12);

    this.camera.position.set(this.pos.x, this._eyeY, this.pos.z);
    // taking a hit jolts the view; the jolt springs back on its own
    this.kickPitch = (this.kickPitch ?? 0) * Math.pow(0.002, dt);
    this.kickRoll = (this.kickRoll ?? 0) * Math.pow(0.002, dt);
    this.camera.rotation.set(this.pitch + this.kickPitch, this.yaw, this.kickRoll);
  }

  _collides(x, z) {
    const r = RADIUS;
    const tx0 = Math.floor(x - r), tx1 = Math.floor(x + r);
    const tz0 = Math.floor(z - r), tz1 = Math.floor(z + r);
    for (let tz = tz0; tz <= tz1; tz++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!this.world.isBlocked(tx, tz, this.plane)) continue;
        // water tiles are blocked for mobs but wadeable for the player — only
        // where the ground truly sits at the waterline. The bridge parapet
        // rails are water-flagged tiles at deck height and must stay solid.
        if (this.plane === 0 && this.world.isWater(tx, tz)
          && this.world.getGroundHeight(tx + 0.5, tz + 0.5, 0) < this.world.def.waterLevel + 0.05) continue;
        // circle vs tile AABB
        const cx = Math.max(tx, Math.min(x, tx + 1));
        const cz = Math.max(tz, Math.min(z, tz + 1));
        const ddx = x - cx, ddz = z - cz;
        if (ddx * ddx + ddz * ddz < r * r) return true;
      }
    }
    return false;
  }

  skillByName(name) {
    return this.skills.find((s) => s.name === name);
  }

  /**
   * Grant xp (floats allowed). Handles level-ups: fanfare via ui, Hitpoints
   * raises max hp. Returns levels gained.
   */
  addXp(name, amount, ui) {
    const s = this.skillByName(name);
    this.sessionXp = (this.sessionXp ?? 0) + amount; // xp/h tracker (not saved)
    if (s.level >= 99) { s.xp += amount; this._awardCape(name, ui); return 0; }
    s.xp += amount;
    const newLevel = levelForXp(s.xp);
    const gained = newLevel - s.level;
    if (gained > 0) {
      s.level = newLevel;
      if (name === 'Hitpoints') this.maxHp = newLevel;
      if (newLevel === 99) this._awardCape(name, ui);
      ui.levelUp(name, newLevel);
    }
    ui.refreshSkills();
    return gained;
  }

  /** A camera jolt scaled to the blow — pitch up, a random lean, quick recovery. */
  viewKick(dmg = 1) {
    const s = Math.min(0.085, 0.028 + dmg * 0.006);
    this.kickPitch += s;
    this.kickRoll += (Math.random() < 0.5 ? -1 : 1) * s * 0.7;
  }

  /** Grant the level-99 skill cape once. Idempotent (checks pack + cape slot),
   *  and retried on later xp ticks if the pack was full — so it can't be lost,
   *  and existing 99s pick theirs up on their next xp gain. */
  _awardCape(name, ui) {
    const capeId = name.toLowerCase() + '_cape';
    const owned = this.equipment.cape === capeId
      || this.inventory.slots.some((sl) => sl && sl.id === capeId);
    if (owned) return;
    if (this.inventory.add(capeId, 1)) {
      ui.chat.add(`Mastery! Level 99 ${name} — you are handed a ${name} cape.`, 'system');
      ui.refreshInventory?.();
    }
  }

  /**
   * Equip a wearable from an inventory slot. Enforces skill requirements
   * (rudely), swaps with whatever occupied the slot, and handles the
   * two-hander/shield standoff.
   */
  equip(slotIndex, ui) {
    const inv = this.inventory.slots;
    const slot = inv[slotIndex];
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (!def.slot) return;
    if (def.equipQuest && ui.quests && !ui.quests.complete(def.equipQuest)) {
      ui.chat.add('You have not earned the right to wear this. The wyrm must fall first.');
      return;
    }
    for (const [skill, lvl] of Object.entries(def.reqs ?? {})) {
      if (this.skillByName(skill).level < lvl) {
        const verb = def.slot === 'weapon' ? 'wield' : 'wear';
        ui.chat.add(`You need ${skill === 'Attack' ? 'an' : 'a'} ${skill} level of ${lvl} to ${verb} this. ` +
          `You do not have ${skill === 'Attack' ? 'an' : 'a'} ${skill} level of ${lvl}.`);
        return;
      }
    }
    // two-handed weapons and shields refuse to share
    const displaced = [];
    if (def.slot === 'weapon' && def.twoHanded && this.equipment.shield) displaced.push('shield');
    if (def.slot === 'shield' && this.equipment.weapon && ITEMS[this.equipment.weapon].twoHanded)
      displaced.push('weapon');
    const freeSlots = inv.filter((s) => !s).length;
    // the equipped item's own slot frees up unless a swapped-out piece reclaims it
    const available = freeSlots + (this.equipment[def.slot] ? 0 : 1);
    if (displaced.length > available) {
      ui.chat.add('Your pack is too full to juggle that much gear.');
      return;
    }
    inv[slotIndex] = null;
    for (const dSlot of displaced) {
      this.inventory.add(this.equipment[dSlot], 1);
      this.equipment[dSlot] = null;
    }
    const prev = this.equipment[def.slot];
    if (def.slot === 'ammo') {
      // arrows equip as a whole stack; a different type swaps the old stack out
      if (prev && prev !== slot.id) inv[slotIndex] = { id: prev, count: this.ammoCount };
      else if (prev === slot.id) { this.ammoCount += slot.count; this.equipment.ammo = prev; ui.chat.add('You add the arrows to your quiver.'); ui.refreshInventory(); ui.refreshEquipment(); return; }
      this.equipment.ammo = slot.id;
      this.ammoCount = slot.count;
    } else {
      this.equipment[def.slot] = slot.id;
      if (prev) inv[slotIndex] = { id: prev, count: 1 };
    }
    if (def.slot === 'weapon' || displaced.includes('weapon')) {
      const w = this.equipment.weapon ? ITEMS[this.equipment.weapon] : null;
      this.attackSpeed = w?.speed ?? 4;
      this.styleIndex = 0; // a new weapon means a new stance
    }
    ui.chat.add(`You ${def.slot === 'weapon' ? 'wield' : 'wear'} the ${def.name.toLowerCase()}.`);
    ui.refreshInventory();
    ui.refreshEquipment();
  }

  unequip(slotName, ui) {
    const id = this.equipment[slotName];
    if (!id) return;
    const count = slotName === 'ammo' ? this.ammoCount : 1;
    if (!this.inventory.add(id, count)) {
      ui.chat.add('Your pack is too full to remove that.');
      return;
    }
    this.equipment[slotName] = null;
    if (slotName === 'ammo') this.ammoCount = 0;
    if (slotName === 'weapon') { this.attackSpeed = 4; this.styleIndex = 0; }
    ui.chat.add('You remove the ' + ITEMS[id].name.toLowerCase() + '.');
    ui.refreshInventory();
    ui.refreshEquipment();
  }

  /** The wielded weapon's style set (unarmed when bare-fisted). */
  currentStyles() {
    const w = this.equipment.weapon ? ITEMS[this.equipment.weapon] : null;
    return STYLE_SETS[w?.styleSet ?? 'unarmed'];
  }

  currentStyle() {
    const styles = this.currentStyles();
    return styles[Math.min(this.styleIndex, styles.length - 1)];
  }

  /** Attack bonus for a given attack type name, summed across all gear. */
  attackBonus(type) {
    const i = typeIndex(type);
    let v = 0;
    for (const id of Object.values(this.equipment))
      if (id && ITEMS[id].atk) v += ITEMS[id].atk[i] ?? 0;
    return v;
  }

  /** Defence bonus against an incoming attack type, summed across all gear. */
  defenceBonus(type) {
    const i = typeIndex(type);
    let v = 0;
    for (const id of Object.values(this.equipment))
      if (id && ITEMS[id].def) v += ITEMS[id].def[i] ?? 0;
    return v;
  }

  strengthBonus() {
    let v = 0;
    for (const id of Object.values(this.equipment))
      if (id) v += ITEMS[id].str ?? 0;
    return v;
  }

  /** Summary used by the Gear tab footer. */
  equipBonuses() {
    return {
      att: this.attackBonus(this.currentStyle().type),
      str: this.strengthBonus(),
      def: this.defenceBonus('crush'),
    };
  }

  /** Eat food from an inventory slot: instant heal, 3-tick attack delay (§5). */
  eat(slotIndex, ui) {
    const slot = this.inventory.slots[slotIndex];
    if (!slot || !ITEMS[slot.id].heals) return;
    const def = ITEMS[slot.id];
    this.inventory.removeSlot(slotIndex);
    this.hp = Math.min(this.maxHp, this.hp + def.heals);
    this.attackCooldown = Math.max(this.attackCooldown, 3); // eating delays your next swing
    ui.audio?.sfx('eat');
    ui.chat.add('You eat the ' + def.name.toLowerCase() + '. It heals a little.');
    ui.refreshInventory();
  }

  /** Effective (temporarily boosted) skill level, used by the combat math. */
  effLevel(name) {
    const b = this.boosts[name];
    return this.skillByName(name).level + (b ? b.amount : 0);
  }

  /** Count down active potion boosts each tick; expire and notify. */
  tickBoosts(ui) {
    for (const name of Object.keys(this.boosts)) {
      if (--this.boosts[name].ticksLeft <= 0) {
        delete this.boosts[name];
        ui?.chat.add(`Your ${name} boost wears off.`);
        ui?.refreshSkills?.();
      }
    }
  }

  /** Drink a potion: apply a temporary skill boost or restore prayer. */
  drink(slotIndex, ui) {
    const slot = this.inventory.slots[slotIndex];
    const def = slot && ITEMS[slot.id];
    if (!def || (!def.boost && !def.restore)) return;
    this.inventory.removeSlot(slotIndex);
    this.attackCooldown = Math.max(this.attackCooldown, 3);
    ui.audio?.sfx('potion');
    if (def.boost) {
      const { skill, amount, ticks } = def.boost;
      this.boosts[skill] = { amount, ticksLeft: ticks }; // re-drinking refreshes, not stacks
      ui.chat.add(`You drink the ${def.name.toLowerCase()}. Your ${skill} surges by ${amount}.`);
      ui.refreshSkills?.();
    }
    if (def.restore === 'prayer') {
      ui.prayers?.restoreSome(def.restoreAmount ?? 25);
      ui.chat.add(`You drink the ${def.name.toLowerCase()}. Your faith rekindles.`);
    }
    ui.refreshInventory();
  }

  /** Teleport, optionally onto another plane (stairs/ladders/respawn/debug). */
  setPosition(x, z, yaw, plane) {
    this.pos.set(x, 0, z);
    if (yaw !== undefined && yaw !== null) this.yaw = yaw;
    if (plane !== undefined) this.plane = plane;
    this._eyeY = this.world.getGroundHeight(x, z, this.plane) + EYE_HEIGHT;
  }
}
