// OLDHOLM — brinkton.js
// The Rebuild Brinkton project. A notice board drives four Construction
// stages; each consumes wood, bars and coins, pays Construction xp, raises
// real buildings, and brings people back. Progress persists; the town is
// re-raised from the saved stage on load.

import * as THREE from 'three';
import { BRINKTON_STAGES, BOARD } from '../data/brinkton.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';

export class Brinkton {
  constructor(game) {
    this.g = game; // { world, npcs, player, quests, ui }
    this.stage = 0;    // stages completed (0..4)
    this._applied = 0; // stages whose buildings/people exist in the scene
  }

  /** Place the rebuilding board (once, at world init). */
  init() {
    const w = this.g.world;
    const y = w.getGroundHeight(BOARD.x, BOARD.z);
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    const paper = new THREE.MeshLambertMaterial({ color: 0xd8cba8, flatShading: true });
    const post = w._addBox(0.12, 1.3, 0.12, BOARD.x, y + 0.65, BOARD.z, wood);
    const face = w._addBox(0.95, 0.6, 0.08, BOARD.x, y + 1.3, BOARD.z, paper);
    w.addInteractable({
      kind: 'board', name: 'Rebuilding board', meshes: [post, face],
      examine: 'Plans, costs, and one stubborn survivor’s hope.',
      actions: [
        { label: 'Survey', fn: (ctx) => this.survey(ctx) },
        { label: 'Build', fn: (ctx) => this.buildNext(ctx) },
      ],
    });
  }

  _count(id) {
    return this.g.player.inventory.slots.reduce((a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
  }
  _take(id, n) {
    let left = n;
    const slots = this.g.player.inventory.slots;
    for (let i = 0; i < slots.length && left > 0; i++) {
      const s = slots[i];
      if (!s || s.id !== id) continue;
      const t = Math.min(left, s.count ?? 1);
      if ((s.count ?? 1) > t) s.count -= t; else slots[i] = null;
      left -= t;
    }
  }
  _needs(s) {
    const bits = Object.entries(s.mats).map(([id, n]) => `${n} ${ITEMS[id].name.toLowerCase()}`);
    bits.push(`${s.coins} coins`);
    return bits.join(', ') + ` (Construction ${s.req})`;
  }

  survey(ctx) {
    const s = BRINKTON_STAGES[this.stage];
    if (!s) { ctx.ui.chat.add('Brinkton stands rebuilt. The board holds only thank-you notes.'); return; }
    if (this.g.quests.stage('rebuild_brinkton') < 1) {
      ctx.ui.chat.add('Half-finished plans. The survivor by the signpost holds the rest.');
      return;
    }
    ctx.ui.chat.add(`Next: ${s.name} — ${this._needs(s)}.`, 'system');
  }

  buildNext(ctx) {
    if (this.g.quests.stage('rebuild_brinkton') < 1) {
      ctx.ui.chat.add('The plans aren’t yours to build yet — speak with the survivor.');
      return;
    }
    const s = BRINKTON_STAGES[this.stage];
    if (!s) { ctx.ui.chat.add('There is nothing left to raise. Brinkton is whole.'); return; }
    const lvl = ctx.player.skillByName('Construction').level;
    if (lvl < s.req) { ctx.ui.chat.add(`You need a Construction level of ${s.req} for ${s.name.toLowerCase()}.`); return; }
    for (const [id, n] of Object.entries(s.mats)) {
      if (this._count(id) < n) { ctx.ui.chat.add(`${s.name} needs ${this._needs(s)}.`); return; }
    }
    if (this._count('coins') < s.coins) { ctx.ui.chat.add(`${s.name} needs ${this._needs(s)}.`); return; }
    for (const [id, n] of Object.entries(s.mats)) this._take(id, n);
    this._take('coins', s.coins);
    this.stage++;
    this._apply();
    ctx.player.addXp('Construction', s.xp, ctx.ui);
    ctx.ui.fx.xpDrop([['Construction', s.xp]]);
    ctx.ui.audio?.sfx('quest');
    ctx.ui.chat.add(s.done, 'system');
    ctx.ui.refreshInventory();
    this.g.quests.setStage('rebuild_brinkton', this.stage >= BRINKTON_STAGES.length ? 100 : this.stage + 1);
  }

  /** Raise everything owed up to the current stage (idempotent, load-safe). */
  _apply() {
    const w = this.g.world, npcs = this.g.npcs;
    while (this._applied < this.stage) {
      const s = BRINKTON_STAGES[this._applied];
      if (s.key === 'well') {
        const y = w.getGroundHeight(193.5, 29.5);
        const stone = new THREE.MeshLambertMaterial({ color: 0x8a8a82, flatShading: true });
        const ring = w._addBox(1.0, 0.5, 1.0, 193.5, y + 0.25, 29.5, stone);
        const roof = w._addBox(1.2, 0.1, 1.2, 193.5, y + 1.5, 29.5,
          new THREE.MeshLambertMaterial({ color: 0x7a4a30, flatShading: true }));
        w._addBox(0.09, 1.0, 0.09, 193.0, y + 1.0, 29.0, stone);
        w._addBox(0.09, 1.0, 0.09, 194.0, y + 1.0, 30.0, stone);
        w.addInteractable({
          kind: 'scenery', name: 'Brinkton well', meshes: [ring, roof],
          examine: 'Cold, clear, and defiantly unashen.', actions: [],
        });
      }
      for (const b of s.buildings ?? []) w._buildSimpleBuilding(b);
      for (const sp of s.spawns ?? []) npcs.spawnOne(sp.npc, NPCS[sp.npc] ?? MOBS[sp.npc], sp.x, sp.z, 0, {});
      this._applied++;
    }
  }

  snapshot() { return { stage: this.stage }; }
  restore(d) {
    this.stage = d?.stage ?? 0;
    this._apply();
  }
}
