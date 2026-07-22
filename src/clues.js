// OLDHOLM — clues.js
// Treasure trails: a clue scroll holds a 2-3 step trail of dig spots. Reading
// shows the current hint; digging with a spade within DIG_RADIUS advances it;
// the final dig swaps the scroll for a casket. Trail state persists.

import { CLUE_SPOTS, CASKET_LOOT, DIG_RADIUS } from '../data/clues.js';
import { ITEMS } from '../data/items.js';

export class Clues {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.trail = null; // { steps: [spotIndex...], at: 0 }
  }

  _count(id) {
    return this.player.inventory.slots.reduce((a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
  }

  /** Read a clue scroll: start a trail if none, then show the current hint. */
  read() {
    if (this._count('clue_scroll') < 1) return;
    if (!this.trail) {
      const len = 2 + Math.floor(Math.random() * 2); // 2-3 steps
      const picks = [];
      while (picks.length < len) {
        const i = Math.floor(Math.random() * CLUE_SPOTS.length);
        if (!picks.includes(i)) picks.push(i);
      }
      this.trail = { steps: picks, at: 0 };
      this.ui.chat.add('The scroll unfurls — a treasure trail begins.', 'system');
    }
    this.ui.chat.add('Clue: ' + CLUE_SPOTS[this.trail.steps[this.trail.at]].hint);
  }

  /** Dig at the player's feet (needs a spade + an active trail). */
  dig() {
    if (this._count('spade') < 1) { this.ui.chat.add('You need a spade to dig.'); return; }
    if (this._count('clue_scroll') < 1 || !this.trail) { this.ui.chat.add('You dig a modest hole. It offers nothing back.'); return; }
    const spot = CLUE_SPOTS[this.trail.steps[this.trail.at]];
    const d = Math.hypot(this.player.pos.x - spot.x, this.player.pos.z - spot.z);
    if (d > DIG_RADIUS) { this.ui.chat.add('You dig… nothing. This is not the place the scroll means.'); return; }
    this.trail.at++;
    this.ui.audio?.sfx('mine');
    if (this.trail.at < this.trail.steps.length) {
      this.ui.chat.add('Buried beneath: another slip of parchment! The trail continues.', 'system');
      this.ui.chat.add('Clue: ' + CLUE_SPOTS[this.trail.steps[this.trail.at]].hint);
      return;
    }
    // trail complete: scroll -> casket
    this._take('clue_scroll', 1);
    this.trail = null;
    if (this.player.inventory.add('casket', 1)) {
      this.ui.chat.add('Your spade strikes wood — a CASKET! Open it when ready.', 'system');
      this.ui.audio?.sfx('quest');
    } else {
      this.ui.chat.add('A casket! …which your full pack cannot hold. It is lost to the soil. Tragic.');
    }
    this.ui.refreshInventory();
  }

  /** Open a casket: one weighted loot roll. */
  openCasket(slotIndex) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot || slot.id !== 'casket') return;
    const total = CASKET_LOOT.reduce((a, l) => a + l.weight, 0);
    let pick = Math.random() * total;
    const loot = CASKET_LOOT.find((l) => (pick -= l.weight) <= 0) ?? CASKET_LOOT[0];
    const n = Array.isArray(loot.count) ? loot.count[0] + Math.floor(Math.random() * (loot.count[1] - loot.count[0] + 1)) : loot.count;
    this.ui.collection?.onCasket(loot.item); // treasure-trails log page
    this.player.inventory.removeSlot(slotIndex);
    this.player.inventory.add(loot.item, n);
    this.ui.chat.add(`The casket creaks open: ${n > 1 ? n + ' × ' : ''}${ITEMS[loot.item].name.toLowerCase()}!`, 'system');
    this.ui.audio?.sfx('coins');
    this.ui.refreshInventory();
  }

  _take(id, n) {
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

  snapshot() { return { trail: this.trail }; }
  restore(d) { this.trail = d?.trail ?? null; }
}
