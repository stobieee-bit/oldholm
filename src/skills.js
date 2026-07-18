// OLDHOLM — skills.js
// The xp curve (spec §4.1, exact), level lookup, and the gathering action
// engine (chop / mine / fish / light / cook). Per spec §4, gathering success
// is rolled PER TICK while working: min(0.95, 0.30 + (level - req) * 0.02).

import { ITEMS } from '../data/items.js';
import { TREES, ROCKS, FISHING, FIREMAKING, COOKING, burnChance } from '../data/resources.js';

const MAX_LEVEL = 99;

/** Total xp required to BE level l. Level 2 = 83 xp; level 99 = 13,034,431. */
export function xpForLevel(l) {
  let p = 0;
  for (let i = 1; i < l; i++) p += Math.floor(i + 300 * Math.pow(2, i / 7));
  return Math.floor(p / 4);
}

// precomputed thresholds: XP_TABLE[l] = xp to be level l (index 1..99)
export const XP_TABLE = (() => {
  const t = [0, 0];
  for (let l = 2; l <= MAX_LEVEL; l++) t[l] = xpForLevel(l);
  return t;
})();

export function levelForXp(xp) {
  let l = 1;
  while (l < MAX_LEVEL && XP_TABLE[l + 1] <= xp) l++;
  return l;
}

/** Combat xp rates (spec §4.1): per point of damage dealt. */
export const XP_PER_DAMAGE_STYLE = 4;
export const XP_PER_DAMAGE_HP = 1.33;

/** Spec §4.1 gathering success chance, evaluated per tick while working. */
export function gatherChance(level, reqLevel) {
  return Math.min(0.95, 0.30 + (level - reqLevel) * 0.02);
}

// ---------------------------------------------------------------------------
// The action engine. One action at a time; movement, combat, or taking a hit
// interrupts it. Actions roll per tick on the game clock.

const TOOL_SKILL = { axe: 'Woodcutting', pickaxe: 'Mining' };

export class Actions {
  constructor(player, world, ui) {
    this.player = player;
    this.world = world;
    this.ui = ui;
    this.current = null;
    this._lastHp = player.hp;
  }

  cancel() { this.current = null; }

  _start(action) {
    this.current = action;
    this._startX = this.player.pos.x;
    this._startZ = this.player.pos.z;
    this._lastHp = this.player.hp;
    if (action.startMsg) this.ui.chat.add(action.startMsg);
  }

  /** Best usable tool of a kind in the pack (tier-gated by the related skill). */
  findTool(kind) {
    let best = null;
    for (const s of this.player.inventory.slots) {
      if (!s) continue;
      const def = ITEMS[s.id];
      if (def.tool !== kind) continue;
      const skill = TOOL_SKILL[kind];
      const level = skill ? this.player.skillByName(skill).level : 99;
      if (def.toolReq > level) continue;
      if (!best || def.toolReq > best.toolReq) best = def;
    }
    return best;
  }

  _grant(skillName, xp) {
    this.player.addXp(skillName, xp, this.ui);
    this.ui.fx.xpDrop([[skillName, xp]]);
  }

  _give(itemId, msg) {
    if (!this.player.inventory.add(itemId, 1)) {
      this.ui.chat.add('Your pack is too full to carry any more.');
      this.cancel();
      return false;
    }
    if (msg) this.ui.chat.add(msg);
    this.ui.refreshInventory();
    return true;
  }

  tick(tickNo) {
    const a = this.current;
    if (!a) { this._lastHp = this.player.hp; return; }
    const p = this.player;
    const moved = Math.hypot(p.pos.x - this._startX, p.pos.z - this._startZ) > 0.15;
    const disturbed = p.hp < this._lastHp;
    this._lastHp = p.hp;
    if (moved || p.target) { this.cancel(); return; }
    if (disturbed) {
      this.ui.chat.add('Disturbed, you stop what you were doing.');
      this.cancel(); return;
    }
    if (a.validate && !a.validate()) { this.cancel(); return; }
    a.onTick(tickNo);
  }

  // ---- woodcutting ---------------------------------------------------------

  startChop(tree) {
    if (!tree || tree.depleted) return;
    const def = TREES[tree.type];
    const level = this.player.skillByName('Woodcutting').level;
    if (!this.findTool('axe')) { this.ui.chat.add('You need an axe to chop this tree.'); return; }
    if (level < def.req) {
      this.ui.chat.add(`You need a Woodcutting level of ${def.req} to chop this ${def.label.toLowerCase()}.`);
      return;
    }
    this._start({
      kind: 'chop',
      startMsg: 'You swing your axe at the ' + def.label.toLowerCase() + '.',
      validate: () => !tree.depleted,
      onTick: (tickNo) => {
        if (Math.random() >= gatherChance(this.player.skillByName('Woodcutting').level, def.req)) return;
        if (!this._give(def.logs, 'You get some ' + ITEMS[def.logs].name.toLowerCase() + '.')) return;
        this._grant('Woodcutting', def.xp);
        if (Math.random() < def.depleteChance) {
          this.world.depleteTree(tree, tickNo);
          this.cancel();
        }
      },
    });
  }

  // ---- mining ----------------------------------------------------------------

  startMine(rock) {
    if (!rock) return;
    const def = ROCKS[rock.ore];
    if (rock.depleted) { this.ui.chat.add('There is no ore in this rock right now.'); return; }
    const level = this.player.skillByName('Mining').level;
    if (!this.findTool('pickaxe')) { this.ui.chat.add('You need a pickaxe to mine this rock.'); return; }
    if (level < def.req) {
      this.ui.chat.add(`You need a Mining level of ${def.req} to mine ${def.label.toLowerCase()}.`);
      return;
    }
    this._start({
      kind: 'mine',
      startMsg: 'You swing your pickaxe at the rock.',
      validate: () => !rock.depleted,
      onTick: (tickNo) => {
        if (Math.random() >= gatherChance(this.player.skillByName('Mining').level, def.req)) return;
        if (!this._give(def.ore, 'You manage to mine some ' + ITEMS[def.ore].name.toLowerCase() + '.')) return;
        this._grant('Mining', def.xp);
        this.world.depleteRock(rock, tickNo);
        this.cancel();
      },
    });
  }

  // ---- fishing ----------------------------------------------------------------

  startFish(spot) {
    const def = FISHING[spot.type];
    const level = this.player.skillByName('Fishing').level;
    if (!this.findTool(ITEMS[def.tool].tool)) {
      this.ui.chat.add('You need a ' + ITEMS[def.tool].name.toLowerCase() + ' to fish here.');
      return;
    }
    const usable = def.options.filter((o) => level >= o.req);
    if (!usable.length) {
      this.ui.chat.add(`You need a Fishing level of ${Math.min(...def.options.map(o => o.req))} to fish here.`);
      return;
    }
    const hasConsumable = () =>
      !def.consumes || this.player.inventory.slots.some((s) => s && s.id === def.consumes);
    if (!hasConsumable()) {
      this.ui.chat.add('You need some ' + ITEMS[def.consumes].name.toLowerCase() + ' to fish here.');
      return;
    }
    this._start({
      kind: 'fish',
      startMsg: def.verb === 'Net' ? 'You cast your net into the water.' : 'You cast your line into the water.',
      validate: hasConsumable,
      onTick: () => {
        const lvl = this.player.skillByName('Fishing').level;
        const opts = def.options.filter((o) => lvl >= o.req);
        const easiest = Math.min(...opts.map((o) => o.req));
        if (Math.random() >= gatherChance(lvl, easiest)) return;
        const total = opts.reduce((a, o) => a + o.weight, 0);
        let pick = Math.random() * total;
        const caught = opts.find((o) => (pick -= o.weight) <= 0) ?? opts[0];
        if (def.consumes) this._consume(def.consumes);
        const nm = ITEMS[caught.item].name.toLowerCase().replace('raw ', '');
        if (!this._give(caught.item, 'You catch a ' + nm + '.')) return;
        this._grant('Fishing', caught.xp);
      },
    });
  }

  _consume(itemId) {
    const i = this.player.inventory.slots.findIndex((s) => s && s.id === itemId);
    if (i === -1) return;
    const s = this.player.inventory.slots[i];
    if (s.count > 1) s.count--;
    else this.player.inventory.slots[i] = null;
    this.ui.refreshInventory();
  }

  // ---- firemaking ----------------------------------------------------------------

  startLight(slotIndex) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || !FIREMAKING[slot.id]) return;
    const def = FIREMAKING[slot.id];
    const level = this.player.skillByName('Firemaking').level;
    if (!this.findTool('tinderbox')) { this.ui.chat.add('You need a tinderbox to light a fire.'); return; }
    if (level < def.req) {
      this.ui.chat.add(`You need a Firemaking level of ${def.req} to light these logs.`);
      return;
    }
    const tx = Math.floor(this.player.pos.x), tz = Math.floor(this.player.pos.z);
    if (this.player.plane !== 0) { this.ui.chat.add('Lighting a fire indoors seems unwise.'); return; }
    if (this.world.fireAt(tx, tz)) { this.ui.chat.add('There is already a fire here.'); return; }
    const logId = slot.id;
    this._start({
      kind: 'light',
      startMsg: 'You attempt to light the logs.',
      validate: () => {
        const s = this.player.inventory.slots[slotIndex];
        return s && s.id === logId && !this.world.fireAt(tx, tz);
      },
      onTick: (tickNo) => {
        if (Math.random() >= gatherChance(this.player.skillByName('Firemaking').level, def.req)) return;
        this.player.inventory.removeSlot(slotIndex);
        this.ui.refreshInventory();
        this.world.addFire(tx, tz, tickNo);
        this._grant('Firemaking', def.xp);
        this.ui.chat.add('The fire catches and the logs begin to burn.');
        this.cancel();
      },
    });
  }

  // ---- cooking ----------------------------------------------------------------

  startCook(fireEntry, rawId) {
    const def = COOKING[rawId];
    if (!def) return;
    const level = this.player.skillByName('Cooking').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Cooking level of ${def.req} to cook this.`);
      return;
    }
    let cadence = 0;
    this._start({
      kind: 'cook',
      startMsg: 'You begin cooking over the ' + (fireEntry.isRange ? 'range' : 'fire') + '.',
      validate: () => !fireEntry.expired &&
        this.player.inventory.slots.some((s) => s && s.id === rawId),
      onTick: () => {
        if (++cadence % COOKING.TICKS_PER_ITEM !== 0) return;
        const i = this.player.inventory.slots.findIndex((s) => s && s.id === rawId);
        if (i === -1) { this.cancel(); return; }
        this.player.inventory.slots[i] = null;
        const lvl = this.player.skillByName('Cooking').level;
        if (Math.random() < burnChance(lvl, def, !!fireEntry.isRange)) {
          this.player.inventory.add(def.burnt, 1);
          this.ui.chat.add(def.burnt === 'burnt_meat'
            ? 'You accidentally incinerate the meat.'
            : 'You accidentally incinerate the fish.');
        } else {
          this.player.inventory.add(def.cooked, 1);
          this.ui.chat.add('You cook the ' + ITEMS[def.cooked].name.toLowerCase() + '.');
          this._grant('Cooking', def.xp);
        }
        this.ui.refreshInventory();
        if (!this.player.inventory.slots.some((s) => s && s.id === rawId)) {
          this.ui.chat.add('You have finished cooking.');
          this.cancel();
        }
      },
    });
  }
}
