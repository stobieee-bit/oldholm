// OLDHOLM — magic.js
// Glyph-stone accounting and cast execution for the combat spellbook.
// An elemental staff supplies its own element's stones for free (spec §10).

import { ITEMS } from '../data/items.js';
import { SPELLS, spellById, STAFF_ELEMENTS, CAST_TICKS, MAGIC_RANGE } from '../data/spells.js';
import { SMELTING } from '../data/crafting.js';

export { SPELLS, spellById, CAST_TICKS, MAGIC_RANGE };

export class Magic {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.autocast = null;        // spell id, or null for weapon combat
    this.pendingUtility = null;  // an armed utility spell awaiting an item click
  }

  staffElement() {
    const w = this.player.equipment.weapon;
    return w ? STAFF_ELEMENTS[w] ?? null : null;
  }

  /** Stones a cast actually consumes, after staff substitution. */
  effectiveCost(spell) {
    const freeElem = this.staffElement();
    const cost = {};
    for (const [glyph, n] of Object.entries(spell.cost)) {
      if (freeElem && glyph === freeElem + '_glyph') continue;
      cost[glyph] = n;
    }
    return cost;
  }

  canAfford(spell) {
    const count = (id) => this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
    return Object.entries(this.effectiveCost(spell)).every(([id, n]) => count(id) >= n);
  }

  consume(spell) {
    for (const [id, n] of Object.entries(this.effectiveCost(spell))) {
      let left = n;
      const slots = this.player.inventory.slots;
      for (let i = 0; i < slots.length && left > 0; i++) {
        const s = slots[i];
        if (!s || s.id !== id) continue;
        const take = Math.min(left, s.count ?? 1);
        if ((s.count ?? 1) > take) s.count -= take;
        else slots[i] = null;
        left -= take;
      }
    }
    this.ui.refreshInventory();
  }

  setAutocast(id) {
    const spell = spellById(id);
    if (spell.type === 'teleport') { this.castTeleport(spell); return; }
    if (spell.type === 'utility') { this.armUtility(spell); return; }
    if (this.autocast === id) { this.autocast = null; this.ui.refreshSpellbook(); return; }
    if (this.player.skillByName('Magic').level < spell.req) {
      this.ui.chat.add(`You need a Magic level of ${spell.req} to cast ${spell.name}.`);
      return;
    }
    this.autocast = id;
    this.ui.chat.add(`You ready ${spell.name}.`);
    this.ui.refreshSpellbook();
  }

  /** Teleports cast immediately from the spellbook (spec §10). */
  castTeleport(spell) {
    const p = this.player;
    if (p.skillByName('Magic').level < spell.req) {
      this.ui.chat.add(`You need a Magic level of ${spell.req} to cast ${spell.name}.`);
      return;
    }
    if (!this.canAfford(spell)) {
      this.ui.chat.add('You do not have enough glyph stones.');
      return;
    }
    this.consume(spell);
    this.audio?.sfx('teleport');
    p.target = null;
    p.setPosition(spell.dest.x, spell.dest.z, undefined, 0);
    p.attackCooldown = Math.max(p.attackCooldown, 5); // arrival daze
    p.addXp('Magic', spell.baseXp, this.ui);
    this.ui.fx.xpDrop([['Magic', spell.baseXp]]);
    this.ui.chat.add(`The world folds. ${spell.name} lands you with your boots still on.`);
  }

  activeSpell() {
    return this.autocast ? spellById(this.autocast) : null;
  }

  // ---- utility spells: arm from the spellbook, then click a pack item -----------

  armUtility(spell) {
    if (this.pendingUtility?.id === spell.id) { this.cancelUtility(); return; } // toggle off
    if (this.player.skillByName('Magic').level < spell.req) {
      this.ui.chat.add(`You need a Magic level of ${spell.req} to cast ${spell.name}.`);
      return;
    }
    if (!this.canAfford(spell)) { this.ui.chat.add('You do not have enough glyph stones.'); return; }
    this.autocast = null;
    this.pendingUtility = spell;
    this.ui.refreshSpellbook();
    this.ui.chat.add(`${spell.name} readied — click a pack item to cast it (or the spell again to cancel).`);
  }

  cancelUtility() {
    if (!this.pendingUtility) return;
    this.pendingUtility = null;
    this.ui.refreshSpellbook();
  }

  /** Cast the armed utility spell on inventory slot i. Called by ui.openItemMenu. */
  castUtility(spell, slotIndex) {
    const slots = this.player.inventory.slots;
    const slot = slots[slotIndex];
    if (!slot) { this.cancelUtility(); return; }
    const item = ITEMS[slot.id];
    if (!this.canAfford(spell)) { this.ui.chat.add('You are out of glyph stones.'); this.cancelUtility(); return; }

    const finish = (msg) => {
      this.consume(spell);
      this.player.addXp('Magic', spell.baseXp, this.ui);
      this.ui.fx?.xpDrop?.([['Magic', spell.baseXp]]);
      this.audio?.sfx('teleport');
      this.ui.chat.add(msg);
      this.pendingUtility = null;
      this.ui.refreshInventory();
      this.ui.refreshSpellbook();
    };

    if (spell.util === 'alch') {
      if (slot.id === 'coins') { this.ui.chat.add('You cannot alchemise coins. That way lies madness.'); return; }
      // alch on the low vendorValue where set, so it can't out-earn the sell price
      const coins = Math.max(1, Math.floor((item.vendorValue ?? item.value) * spell.ratio));
      if ((slot.count ?? 1) > 1) slot.count--; else slots[slotIndex] = null;
      this.player.inventory.add('coins', coins);
      finish(`${spell.name}: the ${item.name.toLowerCase()} becomes ${coins} coins.`);
      return;
    }
    if (spell.util === 'enchant') {
      if (slot.id !== spell.from) { this.ui.chat.add(`${spell.name} needs a ${ITEMS[spell.from].name.toLowerCase()}.`); return; }
      slots[slotIndex] = { id: spell.to, count: 1 };
      finish(`${spell.name}: the ring wakes as a ${ITEMS[spell.to].name.toLowerCase()}.`);
      return;
    }
    if (spell.util === 'superheat') {
      const found = Object.entries(SMELTING).find(([, r]) => r.inputs && slot.id in r.inputs);
      if (!found) { this.ui.chat.add('Superheat Item needs an ore to smelt.'); return; }
      const [barId, recipe] = found;
      const count = (id) => slots.reduce((a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
      for (const [inp, n] of Object.entries(recipe.inputs))
        if (count(inp) < n) { this.ui.chat.add(`You need ${n} ${ITEMS[inp].name.toLowerCase()} for that bar.`); return; }
      for (const [inp, n] of Object.entries(recipe.inputs)) this._takeInv(inp, n);
      this.player.inventory.add(barId, 1);
      this.player.addXp('Smithing', recipe.xp, this.ui);
      this.ui.fx?.xpDrop?.([['Smithing', recipe.xp]]);
      finish(`${spell.name}: raw ore runs to a ${ITEMS[barId].name.toLowerCase()}.`);
      return;
    }
    this.cancelUtility();
  }

  _takeInv(id, n) {
    let left = n;
    const slots = this.player.inventory.slots;
    for (let i = 0; i < slots.length && left > 0; i++) {
      const s = slots[i];
      if (!s || s.id !== id) continue;
      const t = Math.min(left, s.count ?? 1);
      if ((s.count ?? 1) > t) s.count -= t; else slots[i] = null;
      left -= t;
    }
  }
}
