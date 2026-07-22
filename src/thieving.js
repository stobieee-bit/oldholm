// OLDHOLM — thieving.js
// The light-fingered arts: pickpocketing, stall theft, safecracking.
// Success pays coins and goods into existing economies; failure stuns
// (movement locked a few ticks), hurts, and sometimes summons a guard.

import { PICKPOCKETS, TIERS, STALLS, SAFE } from '../data/thieving.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';

export class Thieving {
  constructor(player, ui, npcs, combat, clock) {
    this.player = player;
    this.ui = ui;
    this.npcs = npcs;
    this.combat = combat;
    this.clock = clock;
    this.cooldowns = new Map(); // stall/safe key -> tick it restocks
    this._nextAt = 0;           // global attempt gate (no click-spam)
  }

  _lvl() { return this.player.skillByName('Thieving').level; }
  // gentler curve than gathering: hands improve faster than hatchets
  _chance(req) { return Math.min(0.95, 0.55 + (this._lvl() - req) * 0.012); }
  _gate() {
    if ((this.player.stunTicks ?? 0) > 0) return false; // still seeing stars
    if (this.clock.tick < this._nextAt) return false;
    this._nextAt = this.clock.tick + 2;
    return true;
  }
  _rollCount([lo, hi]) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  pickpocket(mob, ctx) {
    const tier = TIERS[PICKPOCKETS[mob.defId]];
    if (!tier || mob.dead || mob.hiddenNpc) return;
    if (this._lvl() < tier.req) {
      ctx.ui.chat.add(`You need a Thieving level of ${tier.req} to pick a ${tier.label}'s pocket.`);
      return;
    }
    if (!this._gate()) return;
    if (Math.random() >= this._chance(tier.req)) { this._caught(tier, ctx); return; }
    const n = this._rollCount(tier.coins);
    if (!this.player.inventory.add('coins', n)) {
      ctx.ui.chat.add('Your pack is too full to pocket anything.');
      return;
    }
    for (const ex of tier.extra) {
      if (Math.random() < ex.chance) { this.player.inventory.add(ex.item, 1); break; }
    }
    this._pay(tier.xp, `You slip ${n} coins from the ${tier.label}'s pocket.`, ctx);
  }

  stealStall(s, ctx) {
    if (this._lvl() < s.req) {
      ctx.ui.chat.add(`You need a Thieving level of ${s.req} to rob the ${s.name.toLowerCase()}.`);
      return;
    }
    if ((this.cooldowns.get(s.key) ?? 0) > this.clock.tick) {
      ctx.ui.chat.add('The stall is picked clean. Give it a moment.');
      return;
    }
    if (!this._gate()) return;
    const ok = Math.random() < this._chance(s.req);
    if (ok) {
      this.cooldowns.set(s.key, this.clock.tick + s.cooldown);
      const item = s.loot[Math.floor(Math.random() * s.loot.length)];
      if (!this.player.inventory.add(item, 1)) { ctx.ui.chat.add('Your pack is too full to steal anything.'); return; }
      this._pay(s.xp, `You swipe ${ITEMS[item].name.toLowerCase()} from the ${s.name.toLowerCase()}.`, ctx);
    } else {
      this._caught(TIERS.trader, ctx);
    }
    if (Math.random() < s.guardChance * (ok ? 0.5 : 1)) this._summonGuard(s.x, s.z, ctx);
  }

  crackSafe(key, x, z, plane, ctx) {
    if (this._lvl() < SAFE.req) {
      ctx.ui.chat.add(`You need a Thieving level of ${SAFE.req} to crack a safe.`);
      return;
    }
    if ((this.cooldowns.get(key) ?? 0) > this.clock.tick) {
      ctx.ui.chat.add('The safe hangs open and empty. It refills — they always do.');
      return;
    }
    if (!this._gate()) return;
    if (Math.random() >= this._chance(SAFE.req)) {
      ctx.ui.chat.add('A needle-trap nicks your knuckles. The lock laughs at you.');
      this.player.stunTicks = 4;
      this._damage(this._rollCount(SAFE.failDmg), ctx);
      return;
    }
    this.cooldowns.set(key, this.clock.tick + SAFE.cooldown);
    const n = this._rollCount(SAFE.coins);
    if (!this.player.inventory.add('coins', n)) { ctx.ui.chat.add('Your pack is too full for the haul.'); return; }
    for (const g of SAFE.gems) {
      if (Math.random() < g.chance) { this.player.inventory.add(g.item, 1); break; }
    }
    this._pay(SAFE.xp, `The tumblers surrender ${n} coins.`, ctx);
  }

  _pay(xp, msg, ctx) {
    this.player.addXp('Thieving', xp, ctx.ui);
    ctx.ui.fx.xpDrop([['Thieving', xp]]);
    ctx.ui.chat.add(msg);
    ctx.ui.audio?.sfx('coins');
  }

  _caught(tier, ctx) {
    ctx.ui.chat.add('"Oi! Hands off!" You are stunned.');
    this.player.stunTicks = tier.stun;
    this._damage(tier.dmg, ctx);
    ctx.ui.audio?.sfx('hit');
  }

  _damage(dmg, ctx) {
    const p = this.player;
    p.hp = Math.max(0, p.hp - dmg);
    ctx.ui.hurtFlash(dmg);
    ctx.ui.setHp(p.hp, p.maxHp);
    if (p.hp <= 0) this.combat.playerDie();
  }

  _summonGuard(x, z, ctx) {
    const g = this.npcs.spawnOne('guard', MOBS.guard, x + 1, z + 1, 0, { temporary: true });
    g.target = 'player';
    ctx.ui.chat.add('A guard storms over — "THIEF!"', 'system');
  }

  tick() {
    if ((this.player.stunTicks ?? 0) > 0) this.player.stunTicks--;
  }
}
