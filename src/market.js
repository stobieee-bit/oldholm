// OLDHOLM — market.js
// The Grand Market of Corvath (spec §9): a simplified order book. The player
// posts buy/sell offers; simulated traders fill them over real minutes at
// prices drifting around item value. Proceeds land in the collection box.

import { ITEMS } from '../data/items.js';

export class Market {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.offers = [];          // {id, type:'sell'|'buy', itemId, qty, remaining, price}
    this.collection = new Map(); // itemId -> count (coins included)
    this._drift = new Map();     // itemId -> price multiplier, random-walking
    this._nextId = 1;
  }

  fairPrice(itemId) {
    const d = this._drift.get(itemId) ?? 1;
    return Math.max(1, ITEMS[itemId].value * d);
  }

  _count(id) {
    return this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
  }

  _take(id, n) {
    const slots = this.player.inventory.slots;
    for (let i = 0; i < slots.length && n > 0; i++) {
      const s = slots[i];
      if (!s || s.id !== id) continue;
      const take = Math.min(n, s.count ?? 1);
      if ((s.count ?? 1) > take) s.count -= take;
      else slots[i] = null;
      n -= take;
    }
    this.ui.refreshInventory();
  }

  postSell(itemId, qty, price) {
    qty = Math.min(qty, this._count(itemId));
    if (qty <= 0 || price <= 0) return;
    this._take(itemId, qty);
    this.offers.push({ id: this._nextId++, type: 'sell', itemId, qty, remaining: qty, price });
    this.ui.chat.add(`Offer posted: sell ${qty} × ${ITEMS[itemId].name.toLowerCase()} at ${price}c each.`);
    this.ui.refreshMarket();
  }

  postBuy(itemId, qty, price) {
    if (qty <= 0 || price <= 0) return;
    const cost = qty * price;
    if (this._count('coins') < cost) { this.ui.chat.add('You cannot escrow coins you do not have.'); return; }
    this._take('coins', cost);
    this.offers.push({ id: this._nextId++, type: 'buy', itemId, qty, remaining: qty, price });
    this.ui.chat.add(`Offer posted: buy ${qty} × ${ITEMS[itemId].name.toLowerCase()} at ${price}c each.`);
    this.ui.refreshMarket();
  }

  cancel(offerId) {
    const i = this.offers.findIndex((o) => o.id === offerId);
    if (i === -1) return;
    const o = this.offers[i];
    this.offers.splice(i, 1);
    if (o.type === 'sell') this._collect(o.itemId, o.remaining);
    else this._collect('coins', o.remaining * o.price);
    this.ui.chat.add('Offer withdrawn. The clerk sighs and re-inks the book.');
    this.ui.refreshMarket();
  }

  _collect(id, n) {
    this.collection.set(id, (this.collection.get(id) ?? 0) + n);
  }

  collect(id) {
    const n = this.collection.get(id) ?? 0;
    if (n <= 0) return;
    if (!this.player.inventory.add(id, n)) { this.ui.chat.add('Your pack is too full to collect that.'); return; }
    this.collection.delete(id);
    this.ui.chat.add(`You collect ${n} × ${ITEMS[id].name.toLowerCase()}.`);
    this.ui.refreshInventory();
    this.ui.refreshMarket();
  }

  /** Once per game tick: drift prices, maybe fill a unit or two. */
  tick() {
    for (const [id, d] of this._drift)
      this._drift.set(id, Math.min(1.25, Math.max(0.85, d + (Math.random() - 0.5) * 0.008)));
    let changed = false;
    for (const o of [...this.offers]) {
      if (!this._drift.has(o.itemId))
        this._drift.set(o.itemId, 0.9 + Math.random() * 0.25);
      const fair = this.fairPrice(o.itemId);
      const ratio = o.type === 'sell' ? o.price / fair : fair / o.price;
      // generous under fair, sluggish above — fills arrive over real minutes
      const p = ratio <= 0.95 ? 0.09 : ratio <= 1.05 ? 0.045 : ratio <= 1.25 ? 0.012 : 0.002;
      if (Math.random() >= p) continue;
      const n = Math.min(o.remaining, 1 + Math.floor(Math.random() * 3));
      o.remaining -= n;
      if (o.type === 'sell') this._collect('coins', n * o.price);
      else this._collect(o.itemId, n);
      changed = true;
      if (o.remaining <= 0) {
        this.offers = this.offers.filter((x) => x !== o);
        this.ui.chat.add(`Your ${o.type} offer for ${ITEMS[o.itemId].name.toLowerCase()} has been filled.`, 'system');
      }
    }
    if (changed) this.ui.refreshMarket();
  }
}
