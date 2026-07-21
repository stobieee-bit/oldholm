// OLDHOLM — farming.js
// Soil patches: plant a seed, watch it grow (stage meshes scale up), harvest
// a small yield. Growth is measured in clock ticks so it survives save/load
// (clock.tick persists). Patch meshes are built by world._buildFarmPatches.

import { CROPS } from '../data/farming.js';
import { ITEMS } from '../data/items.js';

export class Farming {
  constructor(player, ui, world, clock) {
    this.player = player;
    this.ui = ui;
    this.world = world;
    this.clock = clock;
    this.state = {}; // patchId -> { seed, plantedTick }
  }

  _count(id) {
    return this.player.inventory.slots.reduce((a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
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

  /** 0 = freshly planted, 1 = sprouting, 2 = grown. -1 = empty patch. */
  stage(patchId) {
    const st = this.state[patchId];
    if (!st) return -1;
    const crop = CROPS[st.seed];
    if (!crop) return -1;
    const t = (this.clock.tick - st.plantedTick) / crop.growTicks;
    return t >= 1 ? 2 : t >= 0.5 ? 1 : 0;
  }

  plant(patchId) {
    if (this.state[patchId]) { this.ui.chat.add('Something already grows here. Patience is a crop too.'); return; }
    const seedId = Object.keys(CROPS).find((id) => this._count(id) >= 1);
    if (!seedId) { this.ui.chat.add('You have no seeds. Monsters hoard them; the store sells a few.'); return; }
    const crop = CROPS[seedId];
    const lvl = this.player.skillByName('Farming').level;
    if (lvl < crop.req) {
      this.ui.chat.add(`You need a Farming level of ${crop.req} to plant ${ITEMS[seedId].name.toLowerCase()}s.`);
      return;
    }
    this._take(seedId, 1);
    this.state[patchId] = { seed: seedId, plantedTick: this.clock.tick };
    this.player.addXp('Farming', crop.plantXp, this.ui);
    this.ui.fx?.xpDrop?.([['Farming', crop.plantXp]]);
    this.ui.audio?.sfx('herb');
    this.ui.chat.add(`You sow the ${ITEMS[seedId].name.toLowerCase()}. Now the soil does the working.`);
    this.ui.refreshInventory();
  }

  harvest(patchId) {
    const st = this.state[patchId];
    if (!st) { this.ui.chat.add('Bare soil. Plant a seed first.'); return; }
    const crop = CROPS[st.seed];
    if (this.stage(patchId) < 2) { this.ui.chat.add('Still growing. The realm hurries for no one.'); return; }
    const n = crop.count[0] + Math.floor(Math.random() * (crop.count[1] - crop.count[0] + 1));
    if (!this.player.inventory.add(crop.yields, n)) { this.ui.chat.add('Your pack is too full to harvest.'); return; }
    delete this.state[patchId];
    this.player.addXp('Farming', crop.harvestXp, this.ui);
    this.ui.fx?.xpDrop?.([['Farming', crop.harvestXp]]);
    this.ui.audio?.sfx('herb');
    this.ui.chat.add(`You harvest ${n} × ${ITEMS[crop.yields].name.toLowerCase()}. Honest work.`);
    this.ui.refreshInventory();
  }

  /** Called each game tick: size/colour the growth mesh per patch stage. */
  updateVisuals() {
    for (const p of this.world.farmPatches ?? []) {
      const s = this.stage(p.id);
      const g = p.growth;
      if (!g) continue;
      if (s < 0) { g.visible = false; continue; }
      g.visible = true;
      const k = s === 0 ? 0.35 : s === 1 ? 0.7 : 1.0;
      g.scale.setScalar(k);
      g.material.color.setHex(s === 2 ? 0x6fae4a : 0x557a3a);
      g.material.emissive?.setHex(s === 2 ? 0x1a3a10 : 0x000000);
    }
  }

  snapshot() { return { state: this.state }; }
  restore(d) { this.state = d?.state ?? {}; }
}
