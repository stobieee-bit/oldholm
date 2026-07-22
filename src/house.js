// OLDHOLM — house.js
// The Hearthstead's brain: hotspot pedestals become working furniture. Build
// consumes wood + coins and pays Construction xp; renovating a built piece is
// the repeatable training. Built state persists and re-furnishes on load.

import * as THREE from 'three';
import { HOTSPOTS, RENOVATE_DIVISOR, NEXUS_DESTS } from '../data/house.js';
import { ITEMS } from '../data/items.js';

export class House {
  constructor(game) {
    this.g = game; // { player, world, ui, bank, slayer, delve, combat }
    this.built = {}; // hotspotId -> true
    this.entries = {}; // hotspotId -> interactable entry
    this.meshes = {}; // hotspotId -> current mesh
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

  /** Called by world._buildHouse for each hotspot pedestal it places. */
  registerSpot(id, entry, mesh) {
    this.entries[id] = entry;
    this.meshes[id] = mesh;
    this._applyState(id);
  }

  build(id, ctx) {
    const h = HOTSPOTS[id];
    if (!h || this.built[id]) return;
    const lvl = ctx.player.skillByName('Construction').level;
    if (lvl < h.req) { ctx.ui.chat.add(`You need a Construction level of ${h.req} for the ${h.name.toLowerCase()}.`); return; }
    const [wood, n] = h.wood;
    if (this._count(wood) < n) { ctx.ui.chat.add(`You need ${n} ${ITEMS[wood].name.toLowerCase()} for that.`); return; }
    if (this._count('coins') < h.coins) { ctx.ui.chat.add(`You need ${h.coins} coins for the fittings.`); return; }
    this._take(wood, n);
    this._take('coins', h.coins);
    this.built[id] = true;
    ctx.player.addXp('Construction', h.xp, ctx.ui);
    ctx.ui.fx?.xpDrop?.([['Construction', h.xp]]);
    ctx.ui.audio?.sfx('chop');
    ctx.ui.chat.add(`You raise the ${h.name.toLowerCase()}. ${h.unlocks}.`, 'system');
    ctx.ui.refreshInventory();
    this._applyState(id);
  }

  renovate(id, ctx) {
    const h = HOTSPOTS[id];
    if (!h || !this.built[id]) return;
    // same cadence as the anvil and stove — polish takes time, not clicks
    const t = this.g.clock?.tick ?? 0;
    if (t < (this._nextAt ?? 0)) return;
    this._nextAt = t + 3;
    const [wood] = h.wood;
    if (this._count(wood) < 2) { ctx.ui.chat.add(`Renovating takes 2 ${ITEMS[wood].name.toLowerCase()}.`); return; }
    this._take(wood, 2);
    const xp = Math.round(h.xp / RENOVATE_DIVISOR);
    ctx.player.addXp('Construction', xp, ctx.ui);
    ctx.ui.fx?.xpDrop?.([['Construction', xp]]);
    ctx.ui.audio?.sfx('chop');
    ctx.ui.chat.add(`You fuss over the ${h.name.toLowerCase()} until it gleams.`);
    ctx.ui.refreshInventory();
  }

  /** Swap a hotspot between pedestal and furniture (mesh + actions). */
  _applyState(id) {
    const entry = this.entries[id], h = HOTSPOTS[id];
    if (!entry || !h) return;
    const isBuilt = !!this.built[id];
    entry.name = isBuilt ? h.name : `${h.name} spot`;
    entry.examine = isBuilt ? h.examine : h.spot;
    entry.actions = isBuilt ? this._builtActions(id, h) : [
      { label: `Build (${h.wood[1]} ${ITEMS[h.wood[0]].name.toLowerCase()}, ${h.coins}c, lvl ${h.req})`, fn: (ctx) => this.build(id, ctx) },
    ];
    // grow the pedestal into furniture
    const m = this.meshes[id];
    if (m) {
      m.scale.set(1, isBuilt ? 2.2 : 1, 1);
      m.position.y = m.userData.baseY + (isBuilt ? 0.35 : 0);
      m.material = isBuilt ? this._furnMat(id) : m.userData.spotMat;
      m.updateMatrix?.();
    }
  }

  _furnMat(id) {
    this._mats ??= {
      hearth: new THREE.MeshLambertMaterial({ color: 0xd86a2a, emissive: 0x6a2a08, flatShading: true }),
      bench: new THREE.MeshLambertMaterial({ color: 0x8a6a42, flatShading: true }),
      chest: new THREE.MeshLambertMaterial({ color: 0xa8894e, flatShading: true }),
      trophy: new THREE.MeshLambertMaterial({ color: 0xc9a232, flatShading: true }),
      nexus: new THREE.MeshLambertMaterial({ color: 0x9a6ad8, emissive: 0x2a1a48, flatShading: true }),
    };
    return this._mats[id];
  }

  _builtActions(id, h) {
    if (id === 'hearth') return [
      { label: 'Cook', fn: (ctx) => ctx.ui.openCookMenu(this.entries.hearth) },
      { label: 'Renovate', fn: (ctx) => this.renovate(id, ctx) },
    ];
    if (id === 'bench') return [
      { label: 'Smith', fn: (ctx) => ctx.ui.openAnvil() },
      { label: 'Renovate', fn: (ctx) => this.renovate(id, ctx) },
    ];
    if (id === 'chest') return [
      { label: 'Bank', fn: (ctx) => ctx.ui.openBank() },
      { label: 'Renovate', fn: (ctx) => this.renovate(id, ctx) },
    ];
    if (id === 'trophy') return [
      { label: 'Admire', fn: (ctx) => this._admire(ctx) },
      { label: 'Renovate', fn: (ctx) => this.renovate(id, ctx) },
    ];
    if (id === 'nexus') return [
      ...NEXUS_DESTS.map((d) => ({
        label: 'Teleport-' + d.label,
        fn: (ctx) => {
          ctx.player.setPosition(d.x, d.z, undefined, 0);
          ctx.player.attackCooldown = Math.max(ctx.player.attackCooldown, 5);
          ctx.ui.audio?.sfx('teleport');
          ctx.ui.chat.add(`The nexus folds the road away. ${d.label}.`);
        },
      })),
      { label: 'Renovate', fn: (ctx) => this.renovate(id, ctx) },
    ];
    return [];
  }

  _admire(ctx) {
    const g = this.g;
    const kills = g.combat?.kills ?? {};
    const species = Object.values(kills).filter((n) => n > 0).length;
    const total = Object.values(kills).reduce((a, n) => a + n, 0);
    ctx.ui.chat.add(`The wall tells it plainly: ${total} foes felled across ${species} species. ` +
      `Delve floor ${g.delve?.bestFloor ?? 0}. ${g.slayer?.streak ?? 0} slayer tasks. ` +
      `${g.quests?.questPoints() ?? 0} quest points. Visitors would be impressed, if you had any.`, 'system');
  }

  snapshot() { return { built: this.built }; }
  restore(d) {
    this.built = d?.built ?? {};
    for (const id of Object.keys(HOTSPOTS)) this._applyState(id);
  }
}
