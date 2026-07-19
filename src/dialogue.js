// OLDHOLM — dialogue.js
// Branching, data-driven dialogue (spec §12): big-name header, typewriter
// text, numbered options, "Click here to continue". Modal while open.

import { TREES } from '../data/dialogue/holmbridge.js';

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
    const start = Array.isArray(tree.start)
      ? tree.start[Math.floor(Math.random() * tree.start.length)]
      : tree.start;
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
    this.nameEl.textContent = node.speaker === 'player' ? 'You' : this.npc?.name ?? '???';
    this.optsEl.innerHTML = '';
    this._typing = true;
    this.textEl.textContent = '';
    let i = 0;
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      i += 2;
      this.textEl.textContent = node.text.slice(0, i);
      if (i >= node.text.length) this._finishTyping();
    }, 2000 / CHARS_PER_SEC);
  }

  _finishTyping() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._typing = false;
    this.textEl.textContent = this.node.text;
    this.optsEl.innerHTML = '';
    if (this.node.options) {
      this.node.options.forEach((opt, i) => {
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
    const opt = this.node.options?.[i];
    if (!opt) return;
    if (opt.action === 'end') { this.close(); return; }
    if (opt.action === 'openShop') {
      this.close();
      this.ui.openShop(this.npc?.def?.shop);
      return;
    }
    if (opt.action === 'openBank') {
      this.close();
      this.ui.openBank();
      return;
    }
    if (opt.next) this._show(opt.next);
    else this.close();
  }
}
