// OLDHOLM — combat.js
// The tick combat engine: spec §5 formulas (exact), the engagement loop,
// auto-retaliate, xp grants, HP regen, and death/respawn (§3.4).
//
// Entities are adapters over the player and mobs:
//   { att, str, def, attBonus, strBonus, defBonus } via stats.

import { ITEMS } from '../data/items.js';
import { XP_PER_DAMAGE_STYLE, XP_PER_DAMAGE_HP } from './skills.js';

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
  const chance = hitChance(atk.att, atk.attBonus, dfn.def, dfn.defBonus);
  if (Math.random() >= chance) return 0;
  return randInt(0, maxHit(atk.str, atk.strBonus));
}

// ---- the engine -------------------------------------------------------------

const STYLE_SKILL = { accurate: 'Attack', aggressive: 'Strength', defensive: 'Defence' };
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
    this._regen = 0;
  }

  playerStats() {
    const s = (n) => this.player.skillByName(n).level;
    const eq = this.player.equipBonuses();
    return {
      att: s('Attack'), str: s('Strength'), def: s('Defence'),
      attBonus: eq.att, strBonus: eq.str, defBonus: eq.def,
    };
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
    if (this.player.plane !== 0) return false;
    const v = mob.visualPos();
    return Math.hypot(v.x - this.player.pos.x, v.z - this.player.pos.z) <= MELEE_REACH;
  }

  tick(tickNo) {
    const p = this.player;
    if (p.attackCooldown > 0) p.attackCooldown--;

    const t = p.target;
    if (t) {
      if (t.dead) p.target = null;
      else if (this.inReach(t) && p.attackCooldown === 0) {
        this.playerAttack(t, tickNo);
        p.attackCooldown = p.attackSpeed;
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
    const dmg = rollDamage(this.playerStats(), mob.stats());
    const dealt = Math.min(dmg, mob.hp); // xp only for damage that lands on real hp
    mob.takeDamage(dmg, tickNo, this);
    this.ui.fx.hitsplat(() => mob.splatAnchor(), dmg);
    if (dealt > 0) {
      const skill = STYLE_SKILL[this.player.style] ?? 'Attack';
      const gains = [
        [skill, XP_PER_DAMAGE_STYLE * dealt],
        ['Hitpoints', XP_PER_DAMAGE_HP * dealt],
      ];
      for (const [name, xp] of gains) this.player.addXp(name, xp, this.ui);
      this.ui.fx.xpDrop(gains);
    }
  }

  mobAttack(mob, tickNo) {
    const p = this.player;
    const dmg = rollDamage(mob.stats(), this.playerStats());
    p.hp = Math.max(0, p.hp - dmg);
    this.ui.fx.hitsplat(() => ({ screen: true }), dmg);
    if (p.hp <= 0) { this.playerDie(tickNo); return; }
    if (p.autoRetaliate && !p.target) p.target = mob;
  }

  /** Spec §3.4: keep the 3 most valuable stacks, drop the rest where you fell. */
  playerDie(tickNo) {
    const p = this.player;
    const deathX = p.pos.x, deathZ = p.pos.z, deathPlane = p.plane;

    const slots = p.inventory.slots;
    const keep = slots
      .map((s, i) => s && { i, v: (this._value(s.id) || 0) * s.count })
      .filter(Boolean)
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map((e) => e.i);
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
