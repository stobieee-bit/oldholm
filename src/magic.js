// OLDHOLM — magic.js
// Glyph-stone accounting and cast execution for the combat spellbook.
// An elemental staff supplies its own element's stones for free (spec §10).

import { ITEMS } from '../data/items.js';
import { SPELLS, spellById, STAFF_ELEMENTS, CAST_TICKS, MAGIC_RANGE } from '../data/spells.js';

export { SPELLS, spellById, CAST_TICKS, MAGIC_RANGE };

export class Magic {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.autocast = null; // spell id, or null for weapon combat
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
    if (this.autocast === id) { this.autocast = null; this.ui.refreshSpellbook(); return; }
    const spell = spellById(id);
    if (this.player.skillByName('Magic').level < spell.req) {
      this.ui.chat.add(`You need a Magic level of ${spell.req} to cast ${spell.name}.`);
      return;
    }
    this.autocast = id;
    this.ui.chat.add(`You ready ${spell.name}.`);
    this.ui.refreshSpellbook();
  }

  activeSpell() {
    return this.autocast ? spellById(this.autocast) : null;
  }
}
