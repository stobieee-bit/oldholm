// OLDHOLM — combat.js
// The tick combat engine: spec §5 formulas (exact), the engagement loop,
// auto-retaliate, xp grants, HP regen, and death/respawn (§3.4).
//
// Entities are adapters over the player and mobs:
//   { att, str, def, attBonus, strBonus, defBonus } via stats.

import * as THREE from 'three';
import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { styleXp } from '../data/styles.js';
import { CAST_TICKS, MAGIC_RANGE } from '../data/spells.js';
import { XP_PER_DAMAGE_HP } from './skills.js';

// ---- spec §5 formulas (use exactly these) ----------------------------------

export function maxHit(str, strBonus, prayerMult = 1) {
  const effStr = Math.floor((str + 8) * prayerMult);
  return Math.floor(0.5 + (effStr * (strBonus + 64)) / 640);
}

export function hitChance(att, attBonus, def, defBonus, atkPrayerMult = 1, defPrayerMult = 1) {
  const effAtt = Math.floor((att + 8) * atkPrayerMult);
  const effDef = Math.floor((def + 8) * defPrayerMult);
  const attRoll = effAtt * (attBonus + 64);
  const defRoll = effDef * (defBonus + 64);
  return attRoll > defRoll
    ? 1 - (defRoll + 2) / (2 * (attRoll + 1))
    : attRoll / (2 * (defRoll + 1));
}

/** Spec §5.2 combat level. */
export function combatLevel({ att, str, def, hp, ranged = 1, magic = 1, prayer = 1 }) {
  const base = 0.25 * (def + hp + Math.floor(prayer / 2));
  const melee = 0.325 * (att + str);
  const range = 0.325 * Math.floor((3 * ranged) / 2);
  const mage = 0.325 * Math.floor((3 * magic) / 2);
  return Math.floor(base + Math.max(melee, range, mage));
}

const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)); // inclusive

/** One swing: returns damage dealt (0 = blue splat). */
export function rollDamage(atk, dfn) {
  const chance = hitChance(atk.att, atk.attBonus, dfn.def, dfn.defBonus,
    atk.attMult ?? 1, dfn.defMult ?? 1);
  if (Math.random() >= chance) return 0;
  return randInt(0, maxHit(atk.str, atk.strBonus, atk.strMult ?? 1));
}

// ---- the engine -------------------------------------------------------------

const MELEE_REACH = 1.8; // player center to mob center, world units

const DEATH_LINES = [
  'Oh dear, you are dead.',
  'You have died. The realm barely noticed.',
  'Death comes for us all. It came for you slightly early.',
];

export class Combat {
  constructor(player, world, npcs, ui) {
    this.player = player;
    this.world = world;
    this.npcs = npcs;
    this.ui = ui;
    this.prayers = null; // wired by main.js
    this.magic = null;
    this.quests = null;  // wired by main.js (boss deaths advance quests)
    this.audio = null;
    this.kills = {};     // defId -> count (saved)
    this._regen = 0;
    this._ray = new THREE.Raycaster();
  }

  /** Bonus vs demons/weak-to targets from the wielded weapon (spec §11). */
  smiteMultiplier(mob) {
    const wid = this.player.equipment.weapon;
    if (!wid) return 1;
    const w = ITEMS[wid];
    let m = 1;
    if (mob.def.weakTo === wid) m *= 2;          // Dawnbrand vs Zarkhul
    else if (w.smiteDemons && mob.def.demon) m *= 1.5; // blessed steel vs demon-class
    return m;
  }

  /** Line of sight for projectiles/spells: solid occluders block, trees don't. */
  hasLOS(mob) {
    const from = new THREE.Vector3(this.player.pos.x, this.camera_yApprox(), this.player.pos.z);
    const to = mob.splatAnchor();
    if (!to) return false;
    const dir = to.clone().sub(from);
    const dist = dir.length();
    this._ray.set(from, dir.normalize());
    this._ray.far = dist - 0.4;
    return this._ray.intersectObjects(this.world.occluders, false).length === 0;
  }

  camera_yApprox() {
    return this.world.getGroundHeight(this.player.pos.x, this.player.pos.z, this.player.plane) + 1.4;
  }

  /** Offensive stats for the player's current style (typed attack bonus). */
  playerStats() {
    const p = this.player;
    const s = (n) => p.skillByName(n).level;
    const style = p.currentStyle();
    const pr = this.prayers;
    return {
      att: s('Attack'), str: s('Strength'), def: s('Defence'),
      attBonus: p.attackBonus(style.type),
      strBonus: p.strengthBonus(),
      defBonus: p.defenceBonus('crush'), // generic; typed per-attacker in mobAttack
      attMult: pr ? pr.attMult() : 1,
      strMult: pr ? pr.strMult() : 1,
    };
  }

  /** Defensive stats against a specific incoming attack type. */
  playerDefence(vsType) {
    return {
      def: this.player.skillByName('Defence').level,
      defBonus: this.player.defenceBonus(vsType),
      defMult: this.prayers ? this.prayers.defMult() : 1,
    };
  }

  /** melee | ranged | magic, from autocast and the wielded weapon. */
  attackMode() {
    if (this.magic?.activeSpell()) return 'magic';
    const w = this.player.equipment.weapon;
    if (w && ITEMS[w].styleSet === 'bow') return 'ranged';
    return 'melee';
  }

  attackReach() {
    const mode = this.attackMode();
    if (mode === 'magic') return MAGIC_RANGE;
    if (mode === 'ranged') {
      const w = ITEMS[this.player.equipment.weapon];
      return (w.bowRange ?? 7) + (this.player.currentStyle().rangeDelta ?? 0);
    }
    return MELEE_REACH;
  }

  attackCadence() {
    const mode = this.attackMode();
    if (mode === 'magic') return CAST_TICKS;
    if (mode === 'ranged')
      return this.player.attackSpeed + (this.player.currentStyle().speedDelta ?? 0);
    return this.player.attackSpeed;
  }

  playerCombatLevel() {
    const s = (n) => this.player.skillByName(n).level;
    return combatLevel({
      att: s('Attack'), str: s('Strength'), def: s('Defence'),
      hp: s('Hitpoints'), ranged: s('Ranged'), magic: s('Magic'), prayer: s('Prayer'),
    });
  }

  playerEngage(mob) {
    if (mob.dead) return;
    this.player.target = mob;
  }

  inReach(mob) {
    if (this.player.plane !== (mob.plane ?? 0)) return false;
    const v = mob.visualPos();
    return Math.hypot(v.x - this.player.pos.x, v.z - this.player.pos.z) <= this.attackReach();
  }

  tick(tickNo) {
    const p = this.player;
    if (p.attackCooldown > 0) p.attackCooldown--;

    const t = p.target;
    if (t) {
      const mode = this.attackMode();
      if (t.dead) p.target = null;
      else if (this.inReach(t) && p.attackCooldown === 0 &&
               (mode === 'melee' || this.hasLOS(t))) {
        if (mode === 'magic') this.magicAttack(t, tickNo);
        else if (mode === 'ranged') this.rangedAttack(t, tickNo);
        else this.playerAttack(t, tickNo);
        p.attackCooldown = this.attackCadence();
      }
    }

    // HP regen: 1 per 100 ticks (spec §5)
    if (++this._regen >= 100) {
      this._regen = 0;
      if (p.hp < p.maxHp) { p.hp++; }
      this.npcs.regenAll();
    }
  }

  playerAttack(mob, tickNo) {
    let dmg = rollDamage(this.playerStats(), mob.stats());
    if (dmg > 0) dmg = Math.round(dmg * this.smiteMultiplier(mob));
    const dealt = Math.min(dmg, mob.hp); // xp only for damage that lands on real hp
    mob.takeDamage(dmg, tickNo, this);
    this.audio?.sfx(dmg > 0 ? 'thud' : 'whiff');
    this._deathSfx(mob);
    this.ui.fx.hitsplat(() => mob.splatAnchor(), dmg);
    if (dealt > 0) {
      const gains = styleXp(this.player.currentStyle().kind, dealt);
      gains.push(['Hitpoints', XP_PER_DAMAGE_HP * dealt]);
      for (const [name, xp] of gains) this.player.addXp(name, xp, this.ui);
      this.ui.fx.xpDrop(gains);
    }
  }

  /** A tiny flourish when a mob falls — chickens get the last cluck. */
  _deathSfx(mob) {
    if (!mob.dead) return;
    this.audio?.sfx(/chicken/i.test(mob.defId) ? 'chicken' : 'thud');
  }

  /** Ranged: needs a bow and arrows; ~80% of spent arrows land by the target. */
  rangedAttack(mob, tickNo) {
    const p = this.player;
    if (!p.equipment.ammo || p.ammoCount <= 0) {
      this.ui.chat.add('You have no arrows left.');
      p.target = null;
      return;
    }
    const arrow = ITEMS[p.equipment.ammo];
    const arrowId = p.equipment.ammo;
    p.ammoCount--;
    if (p.ammoCount <= 0) { p.equipment.ammo = null; this.ui.chat.add('That was your last arrow.'); }
    this.ui.refreshEquipment();

    const s = (n) => p.skillByName(n).level;
    const atk = {
      att: s('Ranged'), attBonus: p.attackBonus('ranged'),
      str: s('Ranged'), strBonus: arrow.rangedStr ?? 0,
    };
    const dmg = rollDamage(atk, mob.stats());
    const anchor = mob.splatAnchor();
    this.world.spawnProjectile(
      new THREE.Vector3(p.pos.x, this.camera_yApprox(), p.pos.z), anchor, 0x8a6a42, 0.03);
    const dealt = Math.min(dmg, mob.hp);
    mob.takeDamage(dmg, tickNo, this);
    this.audio?.sfx('bow');
    this._deathSfx(mob);
    this.ui.fx.hitsplat(() => mob.splatAnchor() ?? anchor, dmg);
    if (dealt > 0) {
      const gains = [['Ranged', 4 * dealt], ['Hitpoints', XP_PER_DAMAGE_HP * dealt]];
      for (const [name, xp] of gains) p.addXp(name, xp, this.ui);
      this.ui.fx.xpDrop(gains);
    }
    if (Math.random() < 0.8) // most arrows survive to be picked back up
      this.world.addGroundItem(arrowId, 1, mob.tile.x + 0.5, mob.tile.z + 0.5, 0, 0,
        { despawnAtTick: tickNo + 500, merge: true });
  }

  /** Magic: fixed max hit per spell, stones consumed (staff substitutes). */
  magicAttack(mob, tickNo) {
    const p = this.player;
    const spell = this.magic.activeSpell();
    if (!spell) return;
    if (!this.magic.canAfford(spell)) {
      this.ui.chat.add('You do not have enough glyph stones.');
      this.magic.setAutocast(spell.id); // toggles it off
      p.target = null;
      return;
    }
    this.magic.consume(spell);
    const s = (n) => p.skillByName(n).level;
    const chance = hitChance(
      s('Magic'), p.attackBonus('magic'), mob.stats().def, mob.stats().defBonus,
      this.prayers ? this.prayers.magicMult() : 1, 1);
    const dmg = Math.random() < chance ? randInt(0, spell.maxHit) : 0;
    const anchor = mob.splatAnchor();
    this.world.spawnProjectile(
      new THREE.Vector3(p.pos.x, this.camera_yApprox(), p.pos.z), anchor, spell.color, 0.028);
    const dealt = Math.min(dmg, mob.hp);
    mob.takeDamage(dmg, tickNo, this);
    this.audio?.sfx('spell');
    this._deathSfx(mob);
    this.ui.fx.hitsplat(() => mob.splatAnchor() ?? anchor, dmg);
    const gains = [['Magic', spell.baseXp + 4 * dealt]];
    if (dealt > 0) gains.push(['Hitpoints', XP_PER_DAMAGE_HP * dealt]);
    for (const [name, xp] of gains) p.addXp(name, xp, this.ui);
    this.ui.fx.xpDrop(gains);
  }

  mobAttack(mob, tickNo) {
    const p = this.player;
    const def = MOBS[mob.defId];
    const vsType = def.attackType ?? 'crush';
    mob.lungeAttack?.(); // a visible forward strike

    // Cindermaw's dragonfire: lethal (40) unless an anti-flame shield is worn.
    if (def.dragonfire && Math.random() < 0.28) {
      const shieldId = p.equipment.shield;
      const guarded = shieldId && ITEMS[shieldId].dragonfireGuard;
      const dmg = guarded ? 4 + Math.floor(Math.random() * 5) : 40;
      p.hp = Math.max(0, p.hp - dmg);
      this.ui.fx.hitsplat(() => ({ screen: true }), dmg);
      this.ui.chat.add(guarded
        ? 'Dragonfire washes over your shield and mostly gives up.'
        : 'DRAGONFIRE! You are engulfed. A shield would have helped.', 'system');
      if (p.hp <= 0) { this.playerDie(tickNo); return; }
      if (p.autoRetaliate && !p.target) p.target = mob;
      return;
    }

    if (this.prayers && Math.random() < this.prayers.blockChance()) {
      this.ui.fx.hitsplat(() => ({ screen: true }), 0); // Swiftguard turns it aside
      if (p.autoRetaliate && !p.target) p.target = mob;
      return;
    }
    const dmg = rollDamage(mob.stats(), this.playerDefence(vsType));
    p.hp = Math.max(0, p.hp - dmg);
    this.ui.fx.hitsplat(() => ({ screen: true }), dmg);
    if (p.hp <= 0) { this.playerDie(tickNo); return; }
    if (p.autoRetaliate && !p.target) p.target = mob;
  }

  /** Is this world position inside the Blight (death drops everything)? */
  inBlight(x, z) {
    const b = this.world.def.blight;
    return b && x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1;
  }

  /** Spec §3.4: keep the 3 most valuable stacks, drop the rest where you fell. */
  playerDie(tickNo) {
    const p = this.player;
    const deathX = p.pos.x, deathZ = p.pos.z, deathPlane = p.plane;

    const slots = p.inventory.slots;
    // The Blight keeps nothing (spec §6): death there drops EVERYTHING.
    const keepCount = this.inBlight(deathX, deathZ) ? 0 : 3;
    const keep = slots
      .map((s, i) => s && { i, v: (this._value(s.id) || 0) * s.count })
      .filter(Boolean)
      .sort((a, b) => b.v - a.v)
      .slice(0, keepCount)
      .map((e) => e.i);
    if (keepCount === 0) this.ui.chat.add('The Blight is not a bank. You dropped everything.', 'system');
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i] || keep.includes(i)) continue;
      const s = slots[i];
      slots[i] = null;
      this.world.addGroundItem(s.id, s.count,
        deathX + (Math.random() - 0.5) * 0.8,
        deathZ + (Math.random() - 0.5) * 0.8,
        deathPlane, 0, { despawnAtTick: tickNo + 500 }); // 5 minutes of real time
    }

    p.target = null;
    p.hp = p.maxHp;
    p.runOn = false;
    this.npcs.dropAggroOnPlayer();
    const sp = this.world.def.spawn;
    p.setPosition(sp.x, sp.z, sp.yaw, 0);
    this.ui.chat.add(DEATH_LINES[randInt(0, DEATH_LINES.length - 1)], 'system');
    this.ui.deathFlash();
    this.ui.refreshInventory();
  }

  _value(id) {
    return ITEMS[id]?.value ?? 0;
  }
}
