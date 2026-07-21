// OLDHOLM — delve.js
// The Delve: an endless dungeon beneath the Undervault. Each floor spawns a
// harder pack; clear it and a spoils chest offers the run's defining choice —
// DESCEND (pot grows, danger grows) or LEAVE (bank the pot). Dying or walking
// out ends the run and forfeits the pot. Deepest floor is persisted.

import { MOBS } from '../data/mobs.js';

const BANDS = [
  { min: 1, defs: ['cave_crawler', 'hobgoblin', 'cave_crawler'] },
  { min: 3, defs: ['crystal_scuttler', 'ogre', 'cave_crawler'] },
  { min: 5, defs: ['troll', 'crystal_scuttler', 'deep_troll'] },
  { min: 7, defs: ['deep_troll', 'lesser_demon', 'echo'] },
  { min: 9, defs: ['gloom_stalker', 'ashfiend', 'lesser_demon'] },
  { min: 11, defs: ['green_dragon', 'gloom_stalker', 'ashfiend'] },
  { min: 13, defs: ['blue_dragon', 'abyssal_warden', 'gloom_stalker'] },
  { min: 15, defs: ['black_dragon', 'frost_monarch', 'abyssal_warden'] },
];
const BONUS = ['rune_bar', 'dragon_bones', 'clue_scroll', 'prayer_potion', 'runite_ore'];

export class Delve {
  constructor(player, ui, npcs, world) {
    this.player = player;
    this.ui = ui;
    this.npcs = npcs;
    this.world = world;
    this.active = false;
    this.floor = 0;
    this.mobs = [];
    this.bestFloor = 0; // persisted
    this._chest = null;
  }

  pot() { // banked on leave; quadratic so depth is worth the nerve
    return 60 * this.floor * this.floor;
  }

  enter(ctx) {
    if (this.active) { ctx.ui.chat.add('The Delve already holds you. Finish the floor.'); return; }
    this.active = true;
    this.floor = 0;
    const a = this.world.delveArena;
    ctx.player.setPosition(a.x + 0.5, a.z - a.r + 2.5, undefined, this.world.delvePlane);
    ctx.player.target = null;
    ctx.ui.chat.add('The Long Stair swallows the light. The Delve begins.', 'system');
    ctx.ui.audio?.sfx('quest');
    this._nextFloor();
  }

  _band(floor) {
    let b = BANDS[0];
    for (const cand of BANDS) if (floor >= cand.min) b = cand;
    return b;
  }

  _nextFloor() {
    this.floor++;
    this._removeChest();
    const a = this.world.delveArena;
    const defs = this._band(this.floor).defs;
    const hpMult = this.floor > 15 ? 1 + (this.floor - 15) * 0.15 : 1;
    this.mobs = [];
    for (let i = 0; i < defs.length; i++) {
      const ang = (i / defs.length) * Math.PI * 2 + Math.random();
      const r = 3.5 + Math.random() * (a.r - 6);
      const m = this.npcs.spawnOne(defs[i], MOBS[defs[i]],
        a.x + Math.cos(ang) * r, a.z + Math.sin(ang) * r, this.world.delvePlane, { temporary: true });
      if (hpMult > 1) { m.maxHp = Math.round(m.maxHp * hpMult); m.hp = m.maxHp; }
      m.target = 'player';
      this.mobs.push(m);
    }
    this.ui.chat.add(`Delve floor ${this.floor}: ${defs.length} shapes peel out of the dark. Pot if you leave after this floor: ${this.pot()} coins.`, 'system');
    this.ui.audio?.sfx('dragonfire');
  }

  _spawnChest() {
    const a = this.world.delveArena;
    const THREE = this.world.THREE ?? null;
    const chestMesh = this.world._addBox(0.8, 0.6, 0.6, a.x + 0.5, this.world.delveFloorY + 0.3, a.z + 0.5,
      this.world._delveChestMat);
    let entry;
    entry = this.world.addInteractable({
      kind: 'chest', name: `Spoils chest (floor ${this.floor})`, meshes: [chestMesh],
      examine: `The pot stands at ${this.pot()} coins. Down, or out?`,
      actions: [
        { label: 'Descend', fn: () => { if (this.active) this._nextFloor(); } },
        { label: 'Take-spoils-and-leave', fn: (ctx) => this._leave(ctx) },
      ],
    });
    this._chest = { entry, mesh: chestMesh };
    this.ui.chat.add(`Floor ${this.floor} cleared! A spoils chest rises: DESCEND, or take ${this.pot()} coins and leave.`, 'system');
    this.ui.audio?.sfx('coins');
  }

  _removeChest() {
    if (!this._chest) return;
    this.world.removeInteractable(this._chest.entry);
    this._chest.mesh.parent?.remove(this._chest.mesh);
    this._chest = null;
  }

  _leave(ctx) {
    const coins = this.pot();
    ctx.player.inventory.add('coins', coins);
    let bonusMsg = '';
    for (let i = 3; i <= this.floor; i += 3) { // a bonus roll per three floors
      const item = BONUS[Math.floor(Math.random() * BONUS.length)];
      if (ctx.player.inventory.add(item, 1)) bonusMsg += ' +' + item.replace(/_/g, ' ');
    }
    this._endRun();
    const u = this.world.def.undervault;
    ctx.player.setPosition(u.cx - u.r + 2.5, u.cz + u.r - 2.5, undefined, this.world.undervaultPlane);
    ctx.ui.chat.add(`You climb out of the Delve with ${coins} coins${bonusMsg ? ' and' + bonusMsg : ''}. Deepest floor: ${this.bestFloor}.`, 'system');
    ctx.ui.refreshInventory();
    ctx.ui.audio?.sfx('levelup');
  }

  _endRun() {
    this.bestFloor = Math.max(this.bestFloor, this.floor);
    for (const m of this.mobs) this.npcs.remove(m);
    this.mobs = [];
    this._removeChest();
    this.active = false;
  }

  tick() {
    if (!this.active) return;
    // leaving the plane (death teleport, mostly) forfeits the run
    if (this.player.plane !== this.world.delvePlane) {
      const lost = this.pot();
      this._endRun();
      if (lost > 0) this.ui.chat.add(`The Delve keeps its pot (${lost} coins unbanked). Deepest floor: ${this.bestFloor}.`, 'system');
      return;
    }
    if (this.mobs.length && this.mobs.every((m) => m.dead) && !this._chest) {
      for (const m of this.mobs) this.npcs.remove(m);
      this.mobs = [];
      this._spawnChest();
    }
  }

  snapshot() { return { bestFloor: this.bestFloor }; }
  restore(d) { this.bestFloor = d?.bestFloor ?? 0; }
}
