// OLDHOLM — siege.js
// The Gate of Brinkton: an opt-in wave-defense minigame (Warden Ashe, after
// The Blight Cull). Escalating waves of Blight creatures spawn on the ash
// road; each wave held pays coins, outlasting them all pays a lamp and a
// bonus. Walking far from the gate (or dying) ends the attempt. Wave mobs are
// temporary: they never respawn and are culled once the fight moves on.

import { MOBS } from '../data/mobs.js';

const ANCHOR = { x: 214.5, z: 32.5 };  // the road east of Brinkton
const LEASH = 45;                       // tiles from the gate before the horn falls silent
const PAUSE_TICKS = 12;                 // breather between waves
const WAVES = [
  ['wild_dog', 'wild_dog', 'hobgoblin'],
  ['hobgoblin', 'hobgoblin', 'ogre'],
  ['ogre', 'troll', 'troll'],
  ['lesser_demon', 'lesser_demon', 'troll'],
  ['echo', 'echo', 'lesser_demon'],
  ['ashfiend', 'ashfiend', 'echo', 'echo'],
];
const WAVE_COINS = 150;                 // per wave, scaled by wave number

export class Siege {
  constructor(player, ui, npcs) {
    this.player = player;
    this.ui = ui;
    this.npcs = npcs;
    this.active = false;
    this.wave = 0;         // 1-based during a run
    this.mobs = [];
    this.bestWave = 0;     // persisted bragging right
    this._pause = 0;
  }

  start() {
    if (this.active) { this.ui.chat.add('The horn already sounds — hold the road!', 'system'); return; }
    this.active = true;
    this.wave = 0;
    this._pause = 4; // a short breath, then wave 1
    this.ui.chat.add('The Warden sounds the horn. The ash east of Brinkton begins to move…', 'system');
    this.ui.audio?.sfx('quest');
  }

  _spawnWave() {
    this.wave++;
    const defs = WAVES[this.wave - 1];
    this.mobs = [];
    for (let i = 0; i < defs.length; i++) {
      const a = (i / defs.length) * Math.PI * 2 + Math.random() * 0.6;
      const r = 6 + Math.random() * 3;
      const x = ANCHOR.x + Math.cos(a) * r, z = ANCHOR.z + Math.sin(a) * r;
      const m = this.npcs.spawnOne(defs[i], MOBS[defs[i]], x, z, 0, { temporary: true });
      m.target = 'player'; // the horn is personal
      this.mobs.push(m);
    }
    this.ui.chat.add(`Wave ${this.wave} of ${WAVES.length}: ${defs.length} shapes come up the ash road!`, 'system');
    this.ui.audio?.sfx('dragonfire');
  }

  _cull() {
    for (const m of this.mobs) if (m.dead) this.npcs.remove(m);
    this.mobs = [];
  }

  _end(msg) {
    this.bestWave = Math.max(this.bestWave, this.active ? Math.max(0, this.wave - (this.mobs.some((m) => !m.dead) ? 1 : 0)) : this.bestWave);
    for (const m of this.mobs) if (!m.dead) { m.hp = 0; this.npcs.remove(m); } else this.npcs.remove(m);
    this.mobs = [];
    this.active = false;
    if (msg) this.ui.chat.add(msg, 'system');
  }

  tick() {
    if (!this.active) return;
    const p = this.player;
    // abandoning the gate (or death teleport) ends the horn
    if (p.hp <= 0 || Math.hypot(p.pos.x - ANCHOR.x, p.pos.z - ANCHOR.z) > LEASH || p.plane !== 0) {
      this._end('The horn falls silent. The gate held as far as it held.');
      return;
    }
    if (this._pause > 0) {
      if (--this._pause === 0) this._spawnWave();
      return;
    }
    if (!this.mobs.length) return;
    if (this.mobs.every((m) => m.dead)) {
      const pay = WAVE_COINS * this.wave;
      this.player.inventory.add('coins', pay);
      this.ui.chat.add(`Wave ${this.wave} held! The Warden tosses you ${pay} coins.`, 'system');
      this.ui.audio?.sfx('coins');
      this.ui.refreshInventory();
      this._cull();
      this.bestWave = Math.max(this.bestWave, this.wave);
      if (this.wave >= WAVES.length) {
        this.active = false;
        this.player.inventory.add('combat_lamp', 1);
        this.player.inventory.add('coins', 1500);
        this.ui.chat.add('The ash goes still. EVERY wave held — the Warden hands you a combat lamp and 1,500 coins. Brinkton will drink to this.', 'system');
        this.ui.audio?.sfx('levelup');
        this.ui.refreshInventory();
        return;
      }
      this._pause = PAUSE_TICKS;
    }
  }

  snapshot() { return { bestWave: this.bestWave }; }
  restore(d) { this.bestWave = d?.bestWave ?? 0; }
}
