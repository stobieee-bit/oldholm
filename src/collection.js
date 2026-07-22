// OLDHOLM — collection.js
// The collection log: pages of chase-worthy acquisitions with completion
// ticks. Finishing a page grants a title, worn in chat and over your ghost.
// Kills and Delve floors are read live from their systems; items and casket
// pulls are recorded at the moment of first acquisition and persisted.

import { SKILL_NAMES } from './player.js';
import { PETS } from '../data/pets.js';
import { CASKET_LOOT } from '../data/clues.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS } from '../data/items.js';

const BOSS_KILLS = ['ravenmoor', 'zarkhul', 'cindermaw', 'malgrim',
  'green_dragon', 'blue_dragon', 'red_dragon', 'black_dragon'];
const FLOORS = [5, 10, 15, 20, 30, 44];

export class Collection {
  constructor(game) {
    this.g = game; // { combat, delve, ui, online }
    this.obtained = {}; // itemId -> true, first time it enters the pack
    this.casket = {};   // itemId -> true, pulled from a clue casket
    this.title = '';    // the chosen title (must stay earned to be worn)
    this._done = {};    // pageId -> already announced
    this.pages = [
      { id: 'bosses', name: 'Lords of the Realm', title: 'the Lordslayer',
        entries: BOSS_KILLS.map((id) => ({ kind: 'kill', id, label: MOBS[id].name })) },
      { id: 'pets', name: 'The Menagerie', title: 'the Beastfriend',
        entries: Object.keys(PETS).map((id) => ({ kind: 'item', id, label: ITEMS[id].name })) },
      { id: 'clues', name: 'Treasure Trails', title: 'the Seeker',
        entries: CASKET_LOOT.map((l) => ({ kind: 'casket', id: l.item, label: ITEMS[l.item].name })) },
      { id: 'depths', name: 'The Delve', title: 'Delver of the Forty-Fourth Floor',
        entries: FLOORS.map((n) => ({ kind: 'floor', id: n, label: `Reach floor ${n}` })) },
      { id: 'mastery', name: 'Mastery', title: 'the Completionist',
        entries: SKILL_NAMES.map((s) => ({ kind: 'item', id: s.toLowerCase() + '_cape', label: `${s} cape` })) },
    ];
    this._itemIds = new Set(this.pages.flatMap((p) =>
      p.entries.filter((e) => e.kind === 'item').map((e) => e.id)));
  }

  /** Inventory hook: any tracked item entering the pack ticks its entry. */
  onItem(id) {
    if (!this._itemIds.has(id) || this.obtained[id]) return;
    this.obtained[id] = true;
    this.check();
  }

  /** Casket hook: clue loot only counts when it came out of a casket. */
  onCasket(id) {
    if (this.casket[id]) return;
    this.casket[id] = true;
    this.check();
  }

  has(e) {
    if (e.kind === 'kill') return (this.g.combat?.kills?.[e.id] ?? 0) > 0;
    if (e.kind === 'item') return !!this.obtained[e.id];
    if (e.kind === 'casket') return !!this.casket[e.id];
    if (e.kind === 'floor') return (this.g.delve?.bestFloor ?? 0) >= e.id;
    return false;
  }

  pageDone(p) { return p.entries.every((e) => this.has(e)); }
  titles() { return this.pages.filter((p) => this.pageDone(p)).map((p) => p.title); }
  current() { return this.titles().includes(this.title) ? this.title : ''; }

  setTitle(t) {
    this.title = this.titles().includes(t) ? t : '';
    this.g.online?.announceTitle?.();
  }

  /** Announce freshly completed pages. Ticked every game tick — kills and
   *  floors change outside the item hooks, so the sweep catches them. */
  check() {
    for (const p of this.pages) {
      if (this._done[p.id] || !this.pageDone(p)) continue;
      this._done[p.id] = true;
      this.g.ui.chat.add(`Collection complete: ${p.name}! You may now bear the title "${p.title}" (Log tab).`, 'system');
      this.g.ui.audio?.sfx('quest');
    }
  }

  snapshot() {
    return { obtained: this.obtained, casket: this.casket, title: this.title, done: this._done };
  }

  restore(d) {
    this.obtained = d?.obtained ?? {};
    this.casket = d?.casket ?? {};
    this.title = d?.title ?? '';
    this._done = d?.done ?? {};
  }
}
