// OLDHOLM — dialogue.js
// Branching, data-driven dialogue (spec §12): big-name header, typewriter
// text, numbered options, "Click here to continue". Modal while open.
// Phase 9: stage-conditional starts/options and quest action strings —
//   'quest:id:stage'  'complete:id'  'give:item:n'  'take:item:n'
//   'unhide:npcId'    'mark:defId'   'openShop'     'openBank'     'end'
// Conditions: { quest, is|gte|lt }, { hasAll }, { hasCount }, { lacks },
//   { qp }, and { killed: { defId: n } } (kills since the bounty's 'mark').
// Node text may embed live {kills:defId} tokens for bounty progress.

import { TREES } from '../data/dialogue/holmbridge.js';
import { ITEMS } from '../data/items.js';

const CHARS_PER_SEC = 45;

export class Dialogue {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.box = document.getElementById('dialogue-box');
    this.nameEl = document.getElementById('dlg-name');
    this.textEl = document.getElementById('dlg-text');
    this.optsEl = document.getElementById('dlg-options');
    this.open = false;
    this._timer = null;

    this.box.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._advanceOrSkip();
    });
    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      e.stopImmediatePropagation?.();
      if (e.code === 'Escape') this.close();
      else if (e.code === 'Space' || e.code === 'Enter') this._advanceOrSkip();
      else if (/^Digit[1-9]$/.test(e.code)) this._pick(Number(e.code.slice(5)) - 1);
      e.preventDefault();
    }, true);
  }

  _count(id) {
    return this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
  }

  _cond(c) {
    if (!c) return true;
    if (c.quest) {
      const s = this.quests?.stage(c.quest) ?? 0;
      if (c.is !== undefined && s !== c.is) return false;
      if (c.gte !== undefined && s < c.gte) return false;
      if (c.lt !== undefined && s >= c.lt) return false;
    }
    if (c.qp !== undefined && (this.quests?.questPoints() ?? 0) < c.qp) return false;
    if (c.hasAll) {
      for (const id of c.hasAll) if (this._count(id) < 1) return false;
    }
    if (c.hasCount) {
      for (const [id, n] of Object.entries(c.hasCount)) if (this._count(id) < n) return false;
    }
    if (c.lacks) {
      for (const id of c.lacks) if (this._count(id) >= 1) return false;
    }
    if (c.killed) { // { defId: n } — kills since the bounty's 'mark' snapshot
      const base = this.combat?.killBase ?? {};
      const tally = this.combat?.kills ?? {};
      for (const [id, n] of Object.entries(c.killed))
        if ((tally[id] ?? 0) - (base[id] ?? 0) < n) return false;
    }
    if (c.slayer) { // 'none' | 'active' | 'done'
      const s = this.slayerRef;
      const state = !s?.hasTask() ? 'none' : s.complete() ? 'done' : 'active';
      if (c.slayer !== state) return false;
    }
    if (c.pointsGte !== undefined && (this.slayerRef?.points ?? 0) < c.pointsGte) return false;
    return true;
  }

  /** kills of defId credited toward the current bounty (since its 'mark'). */
  _killed(id) {
    return (this.combat?.kills?.[id] ?? 0) - (this.combat?.killBase?.[id] ?? 0);
  }

  /** Substitute live {kills:defId} and {slayer:...} tokens in node text. */
  _resolveText(t) {
    if (!t.includes('{')) return t;
    t = t.replace(/\{kills:(\w+)\}/g, (_, d) => String(Math.max(0, this._killed(d))));
    if (this.slayerRef) t = t.replace(/\{slayer:(\w+)\}/g, (_, k) =>
      k === 'task' ? this.slayerRef.taskLabel()
        : k === 'progress' ? this.slayerRef.progressLabel()
          : k === 'points' ? String(this.slayerRef.points) : '');
    return t;
  }

  _exec(act) {
    const [verb, a, b] = act.split(':');
    if (verb === 'openShop') this._deferred = () => this.ui.openShop(this.npc?.def?.shop);
    else if (verb === 'openBank') this._deferred = () => this.ui.openBank();
    else if (verb === 'openMarket') this._deferred = () => this.ui.openMarket();
    else if (verb === 'tan') this._deferred = () => this.actions?.startTan();
    else if (verb === 'quest') this.quests?.setStage(a, Number(b));
    else if (verb === 'complete') this.quests?.setStage(a, 100);
    else if (verb === 'give') {
      const n = Number(b ?? 1);
      if (this.player.inventory.add(a, n)) {
        this.ui.chat.add('You receive ' + (n > 1 ? n + ' × ' : '') + ITEMS[a].name.toLowerCase() + '.');
        this.ui.refreshInventory();
      } else this.ui.chat.add('Your pack is too full to accept it. It will be offered again.');
    } else if (verb === 'take') {
      let left = Number(b ?? 1);
      const slots = this.player.inventory.slots;
      for (let i = 0; i < slots.length && left > 0; i++) {
        const s = slots[i];
        if (!s || s.id !== a) continue;
        const take = Math.min(left, s.count ?? 1);
        if ((s.count ?? 1) > take) s.count -= take;
        else slots[i] = null;
        left -= take;
      }
      this.ui.refreshInventory();
    } else if (verb === 'unhide') this.npcsRef?.unhide(a);
    else if (verb === 'mark') { // snapshot kills so a bounty counts from here
      if (this.combat) this.combat.killBase[a] = this.combat.kills[a] ?? 0;
    } else if (verb === 'slayer') {
      if (a === 'assign') this.slayerRef?.assign();
      else if (a === 'turnin') this.slayerRef?.turnIn();
      else if (a === 'buy') this.slayerRef?.buy(b);
    } else if (verb === 'siege') this._deferred = () => this.siegeRef?.start();
  }

  /** Begin a tree with an NPC (its name is the header for npc lines). */
  start(treeId, npc) {
    const tree = TREES[treeId];
    if (!tree) return;
    this.tree = tree;
    this.npc = npc;
    this.open = true;
    this.player.menuOpen = true; // freeze look/movement; we own the keyboard
    this.player.clearKeys();
    this.box.classList.remove('hidden');
    let start = tree.start;
    if (Array.isArray(start)) {
      if (typeof start[0] === 'string') {
        start = start[Math.floor(Math.random() * start.length)];
      } else {
        start = (start.find((s) => this._cond(s.if)) ?? start[start.length - 1]).node;
      }
    }
    this._show(start);
  }

  close() {
    this.open = false;
    this.box.classList.add('hidden');
    this.player.menuOpen = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  _show(nodeId) {
    const node = this.tree.nodes[nodeId];
    if (!node) { this.close(); return; }
    this.node = node;
    this._text = this._resolveText(node.text);
    this.nameEl.textContent = node.speaker === 'player' ? 'You' : this.npc?.name ?? '???';
    this.optsEl.innerHTML = '';
    this._typing = true;
    this.textEl.textContent = '';
    let i = 0;
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      i += 2;
      this.textEl.textContent = this._text.slice(0, i);
      if (i >= this._text.length) this._finishTyping();
    }, 2000 / CHARS_PER_SEC);
  }

  _finishTyping() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._typing = false;
    this.textEl.textContent = this._text;
    this.optsEl.innerHTML = '';
    this._visibleOptions = (this.node.options ?? []).filter((o) => this._cond(o.if));
    if (this.node.options) {
      this._visibleOptions.forEach((opt, i) => {
        const row = document.createElement('div');
        row.className = 'dlg-opt';
        row.textContent = `${i + 1}. ${opt.label}`;
        row.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          if (e.button === 0) this._pick(i);
        });
        this.optsEl.appendChild(row);
      });
    } else {
      const row = document.createElement('div');
      row.className = 'dlg-continue';
      row.textContent = 'Click here to continue';
      this.optsEl.appendChild(row);
    }
  }

  _advanceOrSkip() {
    if (this._typing) { this._finishTyping(); return; }
    if (!this.node.options) {
      if (this.node.next) this._show(this.node.next);
      else this.close();
    }
  }

  _pick(i) {
    if (this._typing) { this._finishTyping(); return; }
    const opt = this._visibleOptions?.[i];
    if (!opt) return;
    this._deferred = null;
    const acts = opt.actions ?? (opt.action ? [opt.action] : []);
    let ended = false;
    for (const act of acts) {
      if (act === 'end') { ended = true; continue; }
      this._exec(act);
    }
    if (this._deferred) { // shop/bank open after the box closes
      const fn = this._deferred;
      this._deferred = null;
      this.close();
      fn();
      return;
    }
    if (ended) { this.close(); return; }
    if (opt.next) this._show(opt.next);
    else this.close();
  }
}
