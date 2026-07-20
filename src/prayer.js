// OLDHOLM — prayer.js
// Prayer points equal the Prayer level (spec §10); active prayers drain points
// per tick; altars restore. Multipliers feed the §5.1 effective-level math.

import { PRAYERS, prayerById } from '../data/prayers.js';

export class Prayers {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.points = player.skillByName('Prayer').level;
    this.active = new Set(); // prayer ids
  }

  maxPoints() {
    return this.player.skillByName('Prayer').level;
  }

  toggle(id) {
    const p = prayerById(id);
    if (!p) return;
    if (this.active.has(id)) {
      this.active.delete(id);
      this.ui.refreshPrayers();
      return;
    }
    if (this.player.skillByName('Prayer').level < p.req) {
      this.ui.chat.add(`You need a Prayer level of ${p.req} to use ${p.name}.`);
      return;
    }
    if (this.points <= 0) {
      this.ui.chat.add('You have no prayer points. Find an altar.');
      return;
    }
    // prayers in the same group replace each other
    for (const otherId of [...this.active])
      if (prayerById(otherId).group === p.group) this.active.delete(otherId);
    this.active.add(id);
    this.ui.refreshPrayers();
  }

  tick() {
    if (!this.active.size) return;
    let drain = 0;
    for (const id of this.active) drain += prayerById(id).drain;
    this.points = Math.max(0, this.points - drain);
    if (this.points === 0) {
      this.active.clear();
      this.ui.chat.add('You have run out of prayer points.');
      this.ui.refreshPrayers();
    }
  }

  restore() {
    this.points = this.maxPoints();
    this.ui.refreshPrayers();
  }

  _mult(field) {
    let m = 1;
    for (const id of this.active) {
      const p = prayerById(id);
      if (p[field]) m = Math.max(m, p[field]);
    }
    return m;
  }

  attMult() { return this._mult('attMult'); }
  strMult() { return this._mult('strMult'); }
  defMult() { return this._mult('defMult'); }
  magicMult() { return this._mult('magicMult'); }
  rangedAttMult() { return this._mult('rangedAttMult'); }
  rangedStrMult() { return this._mult('rangedStrMult'); }

  blockChance() {
    let c = 0;
    for (const id of this.active) c = Math.max(c, prayerById(id).blockChance ?? 0);
    return c;
  }

  /** Incoming-damage multiplier for an attack type, from overhead protection
   *  prayers. stab/slash/crush count as melee; 1 = no protection. */
  protection(vsType) {
    const cat = vsType === 'magic' ? 'magic' : vsType === 'ranged' ? 'ranged' : 'melee';
    let f = 1;
    for (const id of this.active) {
      const p = prayerById(id);
      if (p.protect === cat) f = Math.min(f, p.factor ?? 0.5);
    }
    return f;
  }
}
