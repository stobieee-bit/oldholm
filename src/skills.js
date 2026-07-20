// OLDHOLM — skills.js
// The xp curve (spec §4.1, exact), level lookup, and the gathering action
// engine (chop / mine / fish / light / cook). Per spec §4, gathering success
// is rolled PER TICK while working: min(0.95, 0.30 + (level - req) * 0.02).

import { ITEMS } from '../data/items.js';
import { TREES, ROCKS, FISHING, FIREMAKING, COOKING, burnChance } from '../data/resources.js';
import {
  SMELTING, SMITHABLES, SMITH_TICKS_PER_ITEM, TANNING, LEATHER_RECIPES,
  LEATHER_TICKS_PER_ITEM, SPINNING, WOOL_CAPE, FLETCHING, GEMS, GEM_CHANCE,
  GEM_WEIGHTS, JEWELRY, JEWELRY_TICKS, STRINGING, SHEARING, BAKING,
} from '../data/crafting.js';
import { BONES } from '../data/prayers.js';
import { GLYPHCRAFT } from '../data/quests.js';
import { METAL_SMITHING } from '../data/items.js';

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
// rhythmic work sounds, one per 600ms swing while an action runs
const SWING_SFX = { chop: 'chop', mine: 'mine', smith: 'mine', smelt: 'mine' };

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
    const swing = SWING_SFX[a.kind];
    if (swing) this.audio?.sfx(swing);
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
        if (Math.random() < 1 / GEM_CHANCE) { // a glitter in the rubble
          const total = GEM_WEIGHTS.reduce((a, [, w]) => a + w, 0);
          let pick = Math.random() * total;
          const gem = GEM_WEIGHTS.find(([, w]) => (pick -= w) <= 0)?.[0] ?? GEM_WEIGHTS[0][0];
          if (this.player.inventory.add(gem, 1)) {
            this.ui.chat.add('You strike something glittering in the rock.');
            this.ui.refreshInventory();
          }
        }
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

  // ---- smithing: smelting & the anvil -------------------------------------------

  _countItem(id) {
    return this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
  }

  _takeItems(id, n) {
    const inv = this.player.inventory;
    for (let i = 0; i < inv.slots.length && n > 0; i++) {
      const s = inv.slots[i];
      if (!s || s.id !== id) continue;
      const take = Math.min(n, s.count ?? 1);
      if ((s.count ?? 1) > take) s.count -= take;
      else inv.slots[i] = null;
      n -= take;
    }
    this.ui.refreshInventory();
  }

  startSmelt(furnaceEntry, barId) {
    const def = SMELTING[barId];
    const level = this.player.skillByName('Smithing').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Smithing level of ${def.req} to smelt this.`);
      return;
    }
    const haveInputs = () =>
      Object.entries(def.inputs).every(([id, n]) => this._countItem(id) >= n);
    if (!haveInputs()) { this.ui.chat.add('You lack the ores for that.'); return; }
    let cadence = 0;
    this._start({
      kind: 'smelt',
      startMsg: 'You feed the furnace.',
      validate: haveInputs,
      onTick: () => {
        if (++cadence % SMELTING.TICKS_PER_BAR !== 0) return;
        for (const [id, n] of Object.entries(def.inputs)) this._takeItems(id, n);
        if (Math.random() >= def.successChance) {
          this.ui.chat.add(def.failMsg);
        } else if (this._give(barId, 'You retrieve a ' + ITEMS[barId].name.toLowerCase() + ' from the furnace.')) {
          this._grant('Smithing', def.xp);
        } else return;
        if (!haveInputs()) { this.ui.chat.add('You are out of ores.'); this.cancel(); }
      },
    });
  }

  startSmith(metal, shapeId) {
    const shape = SMITHABLES[shapeId];
    const params = METAL_SMITHING[metal];
    const itemId = `${metal}_${shapeId}`;
    const req = params.reqBase + shape.off;
    const level = this.player.skillByName('Smithing').level;
    if (!this.findTool('hammer')) { this.ui.chat.add('You need a hammer to work the anvil.'); return; }
    if (level < req) {
      this.ui.chat.add(`You need a Smithing level of ${req} to make a ${ITEMS[itemId].name.toLowerCase()}.`);
      return;
    }
    const haveBars = () => this._countItem(params.bar) >= shape.bars;
    if (!haveBars()) {
      this.ui.chat.add(`You need ${shape.bars} ${ITEMS[params.bar].name.toLowerCase()}${shape.bars > 1 ? 's' : ''} for that.`);
      return;
    }
    let cadence = 0;
    this._start({
      kind: 'smith',
      startMsg: 'You set to work at the anvil.',
      validate: haveBars,
      onTick: () => {
        if (++cadence % SMITH_TICKS_PER_ITEM !== 0) return;
        this._takeItems(params.bar, shape.bars);
        const n = shape.count ?? 1;
        if (!this.player.inventory.add(itemId, n)) {
          this.ui.chat.add('Your pack is too full to carry any more.');
          this.cancel();
          return;
        }
        this.ui.chat.add('You hammer out ' + (n > 1 ? n + ' ' : 'a ') + ITEMS[itemId].name.toLowerCase() + '.');
        this.ui.refreshInventory();
        this._grant('Smithing', params.barXp * shape.bars);
        if (!haveBars()) { this.ui.chat.add('You are out of bars.'); this.cancel(); }
      },
    });
  }

  // ---- crafting: tanning, spinning, leather, gems, jewellery ---------------------

  startTan() {
    const haveHide = () => this._countItem(TANNING.input) >= 1 && this._countItem('coins') >= TANNING.coinCost;
    if (this._countItem(TANNING.input) < 1) { this.ui.chat.add('You have no cowhides to tan.'); return; }
    if (this._countItem('coins') < TANNING.coinCost) {
      this.ui.chat.add("The rack's absent owner expects a coin per hide. You are short.");
      return;
    }
    let cadence = 0;
    this._start({
      kind: 'tan',
      startMsg: 'You work a hide over the rack.',
      validate: haveHide,
      onTick: () => {
        if (++cadence % 2 !== 0) return;
        this._takeItems(TANNING.input, 1);
        this._takeItems('coins', TANNING.coinCost);
        if (!this._give(TANNING.output, 'You tan the hide into leather.')) return;
        if (!haveHide()) { this.cancel(); }
      },
    });
  }

  startSpin() {
    if (this._countItem(SPINNING.input) < 1) { this.ui.chat.add('You have no wool to spin.'); return; }
    let cadence = 0;
    this._start({
      kind: 'spin',
      startMsg: 'The wheel begins to turn.',
      validate: () => this._countItem(SPINNING.input) >= 1,
      onTick: () => {
        if (++cadence % SPINNING.ticksPer !== 0) return;
        this._takeItems(SPINNING.input, 1);
        if (!this._give(SPINNING.output, 'You spin the wool into a neat ball.')) return;
        this._grant('Crafting', SPINNING.xp);
        if (this._countItem(SPINNING.input) < 1) this.cancel();
      },
    });
  }

  startCraftLeather(recipeId) {
    const def = LEATHER_RECIPES[recipeId];
    const level = this.player.skillByName('Crafting').level;
    if (!this.findTool('needle')) { this.ui.chat.add('You need a needle for leatherwork.'); return; }
    if (level < def.req) {
      this.ui.chat.add(`You need a Crafting level of ${def.req} to make ${ITEMS[recipeId].name.toLowerCase()}.`);
      return;
    }
    const have = () => this._countItem('leather') >= 1 && this._countItem('thread') >= 1;
    if (!have()) { this.ui.chat.add('You need leather and thread for that.'); return; }
    let cadence = 0;
    this._start({
      kind: 'leather',
      startMsg: 'You begin stitching.',
      validate: have,
      onTick: () => {
        if (++cadence % LEATHER_TICKS_PER_ITEM !== 0) return;
        this._takeItems('leather', 1);
        this._takeItems('thread', 1);
        if (!this._give(recipeId, 'You make ' + ITEMS[recipeId].name.toLowerCase() + '.')) return;
        this._grant('Crafting', def.xp);
        if (!have()) this.cancel();
      },
    });
  }

  startCraftCape() {
    const def = WOOL_CAPE;
    const level = this.player.skillByName('Crafting').level;
    if (!this.findTool('needle')) { this.ui.chat.add('You need a needle to sew a cape.'); return; }
    if (level < def.req) {
      this.ui.chat.add(`You need a Crafting level of ${def.req} to sew a cape.`);
      return;
    }
    const have = () => this._countItem('ball_of_wool') >= def.balls && this._countItem('thread') >= 1;
    if (!have()) {
      this.ui.chat.add(`You need ${def.balls} balls of wool and some thread for a cape.`);
      return;
    }
    let cadence = 0;
    this._start({
      kind: 'cape',
      startMsg: 'You begin sewing a cape.',
      validate: have,
      onTick: () => {
        if (++cadence % def.ticks !== 0) return;
        this._takeItems('ball_of_wool', def.balls);
        this._takeItems('thread', 1);
        if (!this._give(def.output, 'You sew a wool cape. Dashing, arguably.')) return;
        this._grant('Crafting', def.xp);
        this.cancel();
      },
    });
  }

  startJewelry(recipeId) {
    const def = JEWELRY[recipeId];
    const level = this.player.skillByName('Crafting').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Crafting level of ${def.req} to craft that.`);
      return;
    }
    const have = () => this._countItem(def.bar) >= 1 && this._countItem(def.mould) >= 1 &&
      (!def.gem || this._countItem(def.gem) >= 1);
    if (!have()) { this.ui.chat.add('You lack the makings for that.'); return; }
    let cadence = 0;
    this._start({
      kind: 'jewelry',
      startMsg: 'You pour the gold into the mould.',
      validate: have,
      onTick: () => {
        if (++cadence % JEWELRY_TICKS !== 0) return;
        this._takeItems(def.bar, 1);
        if (def.gem) this._takeItems(def.gem, 1);
        if (!this._give(recipeId, 'You craft a ' + ITEMS[recipeId].name.toLowerCase() + '.')) return;
        this._grant('Crafting', def.xp);
        this.cancel(); // one casting at a time; the mould survives
      },
    });
  }

  /** Instant: cut a gem with a chisel. */
  cutGem(slotIndex) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || !GEMS[slot.id]) return;
    const def = GEMS[slot.id];
    if (!this.findTool('chisel')) { this.ui.chat.add('You need a chisel to cut gems.'); return; }
    const level = this.player.skillByName('Crafting').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Crafting level of ${def.req} to cut this.`);
      return;
    }
    this.player.inventory.slots[slotIndex] = { id: def.cut, count: 1 };
    this._grant('Crafting', def.xp);
    this.ui.chat.add('You cut the ' + ITEMS[def.cut].name.toLowerCase() + ' to a fine sparkle.');
    this.ui.refreshInventory();
  }

  /** Instant: mix a baking combine (flour + egg + milk -> uncooked cake, etc.).
   *  Consumes the inputs, hands back any container, yields the uncooked good. */
  bakeCombine(recipeId) {
    const def = BAKING[recipeId];
    if (!def) return;
    const level = this.player.skillByName('Cooking').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Cooking level of ${def.req} to prepare ${ITEMS[recipeId].name.toLowerCase()}.`);
      return;
    }
    for (const [id, n] of Object.entries(def.inputs)) {
      if (this._countItem(id) < n) { this.ui.chat.add(`You need ${n} ${ITEMS[id].name.toLowerCase()} for that.`); return; }
    }
    for (const [id, n] of Object.entries(def.inputs)) this._takeItems(id, n);
    for (const [id, n] of Object.entries(def.returns ?? {})) this.player.inventory.add(id, n);
    if (!this.player.inventory.add(recipeId, 1)) {
      this.ui.chat.add('Your pack is too full for that.');
      return;
    }
    this._grant('Cooking', def.xp);
    this.ui.chat.add(`You mix the makings of ${ITEMS[recipeId].name.toLowerCase().replace('uncooked ', '')}.`);
    this.ui.refreshInventory();
  }

  /** Instant: string an unstrung amulet with a ball of wool. */
  stringAmulet(slotIndex) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || slot.id !== STRINGING.input) return;
    if (this._countItem(STRINGING.wool) < 1) {
      this.ui.chat.add('You need a ball of wool to string it.');
      return;
    }
    this._takeItems(STRINGING.wool, 1);
    this.player.inventory.slots[slotIndex] = { id: STRINGING.output, count: 1 };
    this._grant('Crafting', STRINGING.xp);
    this.ui.chat.add('You string the amulet. Very dignified.');
    this.ui.refreshInventory();
  }

  /** Fletch a bow from logs (knife required). */
  startFletchBow(logSlotIndex, bowId) {
    const def = FLETCHING.bows[bowId];
    const slot = this.player.inventory.slots[logSlotIndex];
    if (!slot || slot.id !== 'logs') return;
    if (!this.findTool('knife')) { this.ui.chat.add('You need a knife to fletch.'); return; }
    const level = this.player.skillByName('Crafting').level;
    if (level < def.req) {
      this.ui.chat.add(`You need a Crafting level of ${def.req} to fletch a ${ITEMS[bowId].name.toLowerCase()}.`);
      return;
    }
    if (this._countItem('logs') < def.logs) {
      this.ui.chat.add(`You need ${def.logs} logs for that.`);
      return;
    }
    let cadence = 0;
    this._start({
      kind: 'fletch',
      startMsg: 'You begin whittling.',
      validate: () => this._countItem('logs') >= def.logs,
      onTick: () => {
        if (++cadence % 3 !== 0) return;
        this._takeItems('logs', def.logs);
        if (!this._give(bowId, 'You carve a ' + ITEMS[bowId].name.toLowerCase() + '.')) return;
        this._grant('Crafting', def.xp);
        this.cancel(); // one bow per sitting; wood deserves respect
      },
    });
  }

  /** Fletch arrows: feathers + arrowtips, in batches. */
  startFletchArrows(tipId) {
    const a = FLETCHING.arrows;
    const arrowId = tipId.replace('_arrowtips', '_arrow');
    if (!ITEMS[arrowId]) return;
    const have = () => this._countItem(tipId) >= 1 && this._countItem('feather') >= 1;
    if (!have()) { this.ui.chat.add('You need arrowtips and feathers for that.'); return; }
    let cadence = 0;
    this._start({
      kind: 'fletch',
      startMsg: 'You begin fitting feathers to tips.',
      validate: have,
      onTick: () => {
        if (++cadence % a.ticks !== 0) return;
        const n = Math.min(a.batch, this._countItem(tipId), this._countItem('feather'));
        this._takeItems(tipId, n);
        this._takeItems('feather', n);
        if (!this.player.inventory.add(arrowId, n)) {
          this.ui.chat.add('Your pack is too full to carry any more.');
          this.cancel();
          return;
        }
        this.ui.refreshInventory();
        this.ui.chat.add(`You fletch ${n} ${ITEMS[arrowId].name.toLowerCase()}${n > 1 ? 's' : ''}.`);
        this._grant('Crafting', a.xpEach * n);
        if (!have()) this.cancel();
      },
    });
  }

  /** Instant: bury bones for Prayer xp (spec §10). */
  buryBones(slotIndex) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || !BONES[slot.id]) return;
    const xp = BONES[slot.id];
    this.player.inventory.removeSlot(slotIndex);
    this._grant('Prayer', xp);
    this.ui.chat.add('You bury the bones. Somewhere, something rests easier.');
    this.ui.refreshInventory();
  }

  /** Instant: poison fish food (Phase 11 manor puzzle). */
  poisonFishFood() {
    if (this._countItem('poison') < 1 || this._countItem('fish_food') < 1) {
      this.ui.chat.add('You need both fish food and a vial of poison.');
      return;
    }
    this._takeItems('poison', 1);
    this._takeItems('fish_food', 1);
    if (!this.player.inventory.add('poisoned_food', 1)) { this.ui.chat.add('Your pack is full.'); return; }
    this.ui.chat.add('You lace the fish food with poison. The flakes glisten unwholesomely.');
    this.ui.refreshInventory();
  }

  /** Rub a combat xp lamp: choose a combat skill, gain a chunk of xp. */
  rubLamp(slotIndex, skillName) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || slot.id !== 'combat_lamp') return;
    const LAMP_XP = 4000;
    if (slot.count > 1) slot.count--;
    else this.player.inventory.slots[slotIndex] = null;
    this._grant(skillName, LAMP_XP);
    this.ui.chat.add(`You rub the lamp. ${LAMP_XP} ${skillName} xp flows into you.`, 'system');
    this.ui.refreshInventory();
  }

  /** Instant: milk the dairy cow into an empty bucket. */
  milkCow(mob) {
    if (mob.dead) return;
    const i = this.player.inventory.slots.findIndex((s) => s && s.id === 'bucket');
    if (i === -1) { this.ui.chat.add('You need an empty bucket to milk the cow.'); return; }
    this.player.inventory.slots[i] = { id: 'bucket_of_milk', count: 1 };
    this.ui.chat.add('You milk the cow. It tolerates you magnificently.');
    this.ui.refreshInventory();
  }

  /** Glyphcraft: imbue blank slates at an elemental altar (quest-gated). Each
   *  altar passes its own element; the gale altar omits it and defaults. */
  imbueSlates(altarEntry, element = GLYPHCRAFT.altarElement) {
    if (!this.quests?.glyphcraftUnlocked()) {
      this.ui.chat.add('The stones are silent. Their circle is severed — someone cut this knowledge, long ago.');
      return;
    }
    if (this._countItem('blank_slate') < 1) {
      this.ui.chat.add('You have no blank slates. A pale vein at the mine yields them.');
      return;
    }
    const glyphId = element + '_glyph';
    const glyphName = (ITEMS[glyphId]?.name ?? 'glyph').toLowerCase();
    let cadence = 0;
    this._start({
      kind: 'imbue',
      startMsg: 'You lay a slate on the altar. The bound element leans in.',
      validate: () => this._countItem('blank_slate') >= 1,
      onTick: () => {
        if (++cadence % 2 !== 0) return;
        const level = this.player.skillByName('Glyphcraft').level;
        const stones = GLYPHCRAFT.stonesPerSlate(level);
        this._takeItems('blank_slate', 1);
        if (!this.player.inventory.add(glyphId, stones)) {
          this.ui.chat.add('Your pack is too full for the glyphs.');
          this.cancel();
          return;
        }
        this.ui.refreshInventory();
        this.ui.chat.add(`The charge writes itself into the stone. ${stones} ${glyphName}${stones > 1 ? 's' : ''}.`);
        this._grant('Glyphcraft', GLYPHCRAFT.xpPerSlate);
        if (this._countItem('blank_slate') < 1) { this.ui.chat.add('Your slates are spent.'); this.cancel(); }
      },
    });
  }

  /** Instant: shear a sheep (shears required, dignity optional). */
  shearSheep(mob) {
    if (!this.findTool('shears')) { this.ui.chat.add('You need shears to shear a sheep.'); return; }
    if (mob.dead) return;
    if (mob.shearedUntil) {
      this.ui.chat.add('The sheep is still regrowing its dignity.');
      return;
    }
    if (!this.player.inventory.add(SHEARING.product, 1)) {
      this.ui.chat.add('Your pack is too full for wool.');
      return;
    }
    mob.shearedUntil = this.world._tick + SHEARING.regrowTicks;
    mob.mesh.scale.setScalar(0.86);
    this.ui.chat.add('You get some wool. The sheep looks relieved.');
    this.ui.refreshInventory();
  }

  // ---- cooking ----------------------------------------------------------------

  startCook(fireEntry, rawId) {
    const def = COOKING[rawId];
    if (!def) return;
    if (fireEntry.isRange && this.quests && !this.quests.rangeUnlocked()) {
      this.ui.chat.add('Cook Bramble bodily blocks the range. "Duke\'s oven! Help me with the cake first!"');
      return;
    }
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
