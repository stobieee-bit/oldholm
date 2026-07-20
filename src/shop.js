// OLDHOLM — shop.js
// Shop state + trade math (spec §9). Stock steps toward its maximum on
// restock ticks; general stores buy anything and accumulate what you sell.

import { ITEMS } from '../data/items.js';
import { SHOPS } from '../data/shops.js';

const SOLD_STOCK_CAP = 50;

export class Shops {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.shops = {};
    for (const [id, def] of Object.entries(SHOPS)) {
      this.shops[id] = {
        id, def,
        stock: def.stock.map(([item, max]) => ({ item, qty: max, max })),
        _restock: 0,
      };
    }
  }

  get(id) { return this.shops[id]; }

  tick() {
    for (const shop of Object.values(this.shops)) {
      if (++shop._restock < shop.def.restockTicks) continue;
      shop._restock = 0;
      for (const s of shop.stock) {
        if (s.qty < s.max) s.qty++;
        else if (s.qty > s.max) s.qty--; // player-sold surplus drains back out
      }
      shop.stock = shop.stock.filter((s) => !(s.transient && s.qty <= 0));
    }
  }

  buyPrice(shop, itemId) {
    return Math.max(1, Math.ceil(ITEMS[itemId].value * shop.def.buyMult));
  }

  sellPrice(shop, itemId) {
    const it = ITEMS[itemId];
    // vendorValue (if set, e.g. smithable metal gear) caps the sell price low
    // in every shop, so smith-and-vendor can't out-earn combat income.
    return Math.floor((it.vendorValue ?? it.value) * shop.def.sellMult);
  }

  shopBuys(shop, itemId) {
    if (itemId === 'coins') return false;
    if (shop.def.buysAnything) return true;
    if (shop.def.buysMatcher) return shop.def.buysMatcher(itemId);
    return (shop.def.buysOnly ?? []).includes(itemId);
  }

  _coins() {
    return this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === 'coins' ? s.count : 0), 0);
  }

  _takeCoins(n) {
    const slots = this.player.inventory.slots;
    for (let i = 0; i < slots.length && n > 0; i++) {
      const s = slots[i];
      if (!s || s.id !== 'coins') continue;
      const take = Math.min(n, s.count);
      s.count -= take;
      if (s.count <= 0) slots[i] = null;
      n -= take;
    }
  }

  buy(shopId, itemId, n) {
    const shop = this.get(shopId);
    const entry = shop.stock.find((s) => s.item === itemId);
    if (!entry || entry.qty <= 0) { this.ui.chat.add('That is out of stock.'); return; }
    n = Math.min(n, entry.qty);
    let bought = 0;
    for (let i = 0; i < n; i++) {
      const price = this.buyPrice(shop, itemId);
      if (this._coins() < price) {
        this.ui.chat.add(bought ? 'You run out of coins.' : 'You do not have enough coins.');
        break;
      }
      // reserve pack room: non-stackables need a free slot
      if (!ITEMS[itemId].stackable && !this.player.inventory.slots.some((s) => !s)) {
        this.ui.chat.add('Your pack is full.');
        break;
      }
      this._takeCoins(price);
      this.player.inventory.add(itemId, 1);
      entry.qty--;
      bought++;
    }
    if (bought > 0) {
      this.audio?.sfx('coins');
      this.ui.chat.add(`You buy ${bought > 1 ? bought + ' ' : ''}${ITEMS[itemId].name.toLowerCase()}${bought > 1 ? 's' : ''}.`);
      this.ui.refreshInventory();
      this.ui.refreshShop();
    }
  }

  sell(shopId, slotIndex, n) {
    const shop = this.get(shopId);
    const slots = this.player.inventory.slots;
    const slot = slots[slotIndex];
    if (!slot) return;
    const itemId = slot.id;
    if (!this.shopBuys(shop, itemId)) {
      this.ui.chat.add('"I have no use for that," the merchant says.');
      return;
    }
    const price = this.sellPrice(shop, itemId);
    let sold = 0;
    if (ITEMS[itemId].stackable) {
      sold = Math.min(n, slot.count);
      slot.count -= sold;
      if (slot.count <= 0) slots[slotIndex] = null;
    } else {
      for (let i = 0; i < slots.length && sold < n; i++) {
        if (slots[i] && slots[i].id === itemId) { slots[i] = null; sold++; }
      }
    }
    if (!sold) return;
    if (price > 0) this.player.inventory.add('coins', price * sold);
    let entry = shop.stock.find((s) => s.item === itemId);
    if (!entry) {
      entry = { item: itemId, qty: 0, max: 0, transient: true }; // drains away over restocks
      shop.stock.push(entry);
    }
    entry.qty = Math.min(SOLD_STOCK_CAP, entry.qty + sold);
    if (price > 0) this.audio?.sfx('coins');
    this.ui.chat.add(`You sell ${sold > 1 ? sold + ' ' : ''}${ITEMS[itemId].name.toLowerCase()}${sold > 1 ? 's' : ''} for ${price * sold} coins.`);
    this.ui.refreshInventory();
    this.ui.refreshShop();
  }
}
