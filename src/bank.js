// OLDHOLM — bank.js
// The Bank of Aldera: everything stacks, one shared vault across all future
// branches (spec §9). Deposit/withdraw 1/5/10/All/X; search in the UI.

import { ITEMS } from '../data/items.js';

const CAPACITY = 240; // distinct item kinds; generous beyond the spec's 200+

export class Bank {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.vault = new Map(); // itemId -> count
    this.loadouts = [null, null, null]; // gear+pack presets (saved with the vault)
  }

  count(id) { return this.vault.get(id) ?? 0; }

  deposit(slotIndex, n) {
    const slots = this.player.inventory.slots;
    const slot = slots[slotIndex];
    if (!slot) return;
    const id = slot.id;
    if (!this.vault.has(id) && this.vault.size >= CAPACITY) {
      this.ui.chat.add('The vault shelf for new goods is full.');
      return;
    }
    let moved = 0;
    if (ITEMS[id].stackable) {
      moved = Math.min(n, slot.count);
      slot.count -= moved;
      if (slot.count <= 0) slots[slotIndex] = null;
    } else {
      for (let i = 0; i < slots.length && moved < n; i++) {
        if (slots[i] && slots[i].id === id) { slots[i] = null; moved++; }
      }
    }
    if (!moved) return;
    this.vault.set(id, this.count(id) + moved);
    this.ui.refreshInventory();
    this.ui.refreshBank();
  }

  /** Sweep the whole pack into the vault (skips nothing — tools included). */
  depositAll() {
    const slots = this.player.inventory.slots;
    let moved = 0;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s) continue;
      if (!this.vault.has(s.id) && this.vault.size >= CAPACITY) continue;
      this.vault.set(s.id, this.count(s.id) + (s.count ?? 1));
      slots[i] = null;
      moved++;
    }
    if (moved) { this.ui.refreshInventory(); this.ui.refreshBank(); }
    this.ui.chat.add(moved ? 'The pack empties into the vault.' : 'Your pack has nothing to give.');
  }

  /** Deposit everything except the toolkit — axes, rods, hammers and their
   *  kin stay in the pack, so a skilling trip can bank loot and keep going. */
  depositAllButTools() {
    const slots = this.player.inventory.slots;
    let moved = 0;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      if (!s || ITEMS[s.id].tool) continue;
      if (!this.vault.has(s.id) && this.vault.size >= CAPACITY) continue;
      this.vault.set(s.id, this.count(s.id) + (s.count ?? 1));
      slots[i] = null;
      moved++;
    }
    if (moved) { this.ui.refreshInventory(); this.ui.refreshBank(); }
    this.ui.chat.add(moved ? 'Everything but the toolkit goes into the vault.'
      : 'Nothing to deposit that is not a tool.');
  }

  withdraw(id, n) {
    const have = this.count(id);
    if (have <= 0) return;
    n = Math.min(n, have);
    const inv = this.player.inventory;
    let moved = 0;
    if (ITEMS[id].stackable) {
      if (inv.add(id, n)) moved = n;
      else this.ui.chat.add('Your pack is full.');
    } else {
      for (let i = 0; i < n; i++) {
        if (!inv.add(id, 1)) { this.ui.chat.add(moved ? 'Your pack fills up.' : 'Your pack is full.'); break; }
        moved++;
      }
    }
    if (!moved) return;
    const left = have - moved;
    if (left > 0) this.vault.set(id, left);
    else this.vault.delete(id);
    this.ui.refreshInventory();
    this.ui.refreshBank();
  }

  /** [ [id, count], ... ] filtered by a search string, insertion-ordered. */
  entries(filter = '') {
    const f = filter.trim().toLowerCase();
    return [...this.vault.entries()].filter(([id]) =>
      !f || ITEMS[id].name.toLowerCase().includes(f));
  }

  // ---- loadouts: one-click gear + pack presets, restored from the vault ----

  /** Snapshot what's worn and carried right now into preset slot i. */
  saveLoadout(i) {
    const p = this.player;
    const pack = new Map();
    for (const s of p.inventory.slots) {
      if (s) pack.set(s.id, (pack.get(s.id) ?? 0) + (s.count ?? 1));
    }
    this.loadouts ??= [null, null, null];
    this.loadouts[i] = {
      equip: { ...p.equipment },
      pack: [...pack.entries()].map(([id, count]) => ({ id, count })),
    };
    this.ui.chat.add(`Loadout ${i + 1} saved: what you wear and carry, as it stands.`, 'system');
    this.ui.refreshBank();
  }

  /** Strip everything into the vault, then dress from the preset. Nothing is
   *  ever conjured: pieces the vault can't supply are reported, not created.
   *  Equipping runs through player.equip, so every level/quest gate holds. */
  applyLoadout(i) {
    const lo = this.loadouts?.[i];
    if (!lo) { this.ui.chat.add(`Loadout ${i + 1} is empty — Save one first.`); return; }
    const p = this.player, inv = p.inventory;
    // 1. everything into the vault (worn gear included)
    for (const [slot, id] of Object.entries(p.equipment)) {
      if (!id) continue;
      if (!this.vault.has(id) && this.vault.size >= CAPACITY) continue;
      this.vault.set(id, this.count(id) + 1);
      p.equipment[slot] = null;
    }
    for (let s = 0; s < inv.slots.length; s++) {
      const it = inv.slots[s];
      if (!it) continue;
      if (!this.vault.has(it.id) && this.vault.size >= CAPACITY) continue;
      this.vault.set(it.id, this.count(it.id) + (it.count ?? 1));
      inv.slots[s] = null;
    }
    const missing = [];
    // 2. gear: withdraw one of each piece and equip it through the real gates
    for (const id of Object.values(lo.equip)) {
      if (!id) continue;
      if (this.count(id) <= 0) { missing.push(id); continue; }
      if (!inv.add(id, 1)) { missing.push(id); continue; }
      const slotIndex = inv.slots.findIndex((s) => s && s.id === id);
      this.vault.set(id, this.count(id) - 1);
      if (this.count(id) <= 0) this.vault.delete(id);
      p.equip(slotIndex, this.ui); // refusals simply leave it in the pack
    }
    // 3. pack: withdraw the saved counts (as far as the vault can supply)
    for (const it of lo.pack) {
      const want = it.count, have = Math.min(want, this.count(it.id));
      if (have < want) missing.push(it.id);
      if (have <= 0) continue;
      let moved = 0;
      if (ITEMS[it.id].stackable) { if (inv.add(it.id, have)) moved = have; }
      else for (let k = 0; k < have; k++) { if (!inv.add(it.id, 1)) break; moved++; }
      if (moved > 0) {
        const left = this.count(it.id) - moved;
        if (left > 0) this.vault.set(it.id, left); else this.vault.delete(it.id);
      }
    }
    const short = [...new Set(missing)].map((id) => ITEMS[id].name.toLowerCase());
    this.ui.chat.add(`Loadout ${i + 1} donned.` + (short.length
      ? ` The vault came up short on: ${short.join(', ')}.` : ''), 'system');
    this.ui.refreshInventory();
    this.ui.refreshEquipment?.();
    this.ui.panel.renderEquipment();
    this.ui.refreshBank();
  }

  clearLoadout(i) {
    if (this.loadouts?.[i]) {
      this.loadouts[i] = null;
      this.ui.chat.add(`Loadout ${i + 1} forgotten.`);
      this.ui.refreshBank();
    }
  }

  /** A short label for the preset button: the saved weapon, or first item. */
  loadoutLabel(i) {
    const lo = this.loadouts?.[i];
    if (!lo) return `Loadout ${i + 1} (empty)`;
    const key = lo.equip.weapon ?? Object.values(lo.equip).find(Boolean) ?? lo.pack[0]?.id;
    return `Loadout ${i + 1}` + (key ? ` (${ITEMS[key].name})` : '');
  }
}
