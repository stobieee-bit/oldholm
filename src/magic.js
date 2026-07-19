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
    const spell = spellById(id);
    if (spell.type === 'teleport') { this.castTeleport(spell); return; }
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
}
