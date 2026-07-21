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
}
