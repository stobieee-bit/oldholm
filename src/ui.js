// OLDHOLM — ui.js
// Phase 2 UI shell: chatbox (the narrator), context menu, right-side tab
// panel (Skills F2 / Inventory F4), hover action text, HUD orbs, banner.
// More tabs slot into TABS as later phases add their systems.

import { ITEMS } from '../data/items.js';

// ---------------------------------------------------------------------------

export class Chat {
  constructor() {
    this.log = document.getElementById('chat-log');
    this.cap = 150;
  }

  add(text, cls = 'game') {
    const div = document.createElement('div');
    div.className = 'chat-line chat-' + cls;
    div.textContent = text;
    this.log.appendChild(div);
    while (this.log.childElementCount > this.cap) this.log.firstChild.remove();
    this.log.scrollTop = this.log.scrollHeight;
  }
}

// ---------------------------------------------------------------------------

export class Menu {
  constructor(player) {
    this.player = player;
    this.el = document.getElementById('ctx-menu');
    this.listEl = document.getElementById('ctx-menu-list');
    this.isOpen = false;
    this.entries = [];
    this.highlight = 0;

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      e.stopImmediatePropagation?.();
      if (e.code === 'Escape' || e.code === 'KeyE') { this.close(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this._move(1);
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') this._move(-1);
      else if (e.code === 'Enter') this._pick(this.highlight);
      else if (/^Digit[1-9]$/.test(e.code)) this._pick(Number(e.code.slice(5)) - 1);
      e.preventDefault();
    }, true); // capture: the menu owns keys while open
    window.addEventListener('wheel', (e) => {
      if (this.isOpen) this._move(Math.sign(e.deltaY));
    });
    window.addEventListener('mousedown', (e) => {
      if (!this.isOpen) return;
      if (this.el.contains(e.target)) return; // row handlers take it
      if (e.button === 0 && this.player.pointerLocked) this._pick(this.highlight);
      else this.close();
    });
  }

  open(entries, at = null) {
    if (!entries.length) return;
    this.entries = entries;
    this.highlight = 0;
    this.isOpen = true;
    this.player.menuOpen = true;
    this.player.clearKeys();
    this.listEl.innerHTML = '';
    entries.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = 'ctx-row';
      row.textContent = (i + 1) + '  ' + entry.label;
      row.addEventListener('mouseenter', () => { this.highlight = i; this._paint(); });
      row.addEventListener('mouseup', (e) => { if (e.button === 0) this._pick(i); });
      this.listEl.appendChild(row);
    });
    this.el.classList.remove('hidden');
    if (at) {
      const r = this.el.getBoundingClientRect();
      this.el.style.left = Math.min(at.x, window.innerWidth - r.width - 8) + 'px';
      this.el.style.top = Math.min(at.y, window.innerHeight - r.height - 8) + 'px';
      this.el.classList.remove('centered');
    } else {
      this.el.style.left = '';
      this.el.style.top = '';
      this.el.classList.add('centered');
    }
    this._paint();
  }

  close() {
    this.isOpen = false;
    this.el.classList.add('hidden');
    // release the keyboard next tick so the closing keyup doesn't move the player
    setTimeout(() => { this.player.menuOpen = false; }, 0);
  }

  _move(dir) {
    this.highlight = (this.highlight + dir + this.entries.length) % this.entries.length;
    this._paint();
  }

  _paint() {
    [...this.listEl.children].forEach((row, i) =>
      row.classList.toggle('hl', i === this.highlight));
  }

  _pick(i) {
    const entry = this.entries[i];
    this.close();
    if (entry) entry.run();
  }
}

// ---------------------------------------------------------------------------

const TABS = [
  { id: 'skills', label: 'Skills', key: 'F2' },
  { id: 'inventory', label: 'Pack', key: 'F4' },
];

export class TabPanel {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.active = 'inventory';
    this.strip = document.getElementById('tab-strip');
    this.pages = {
      skills: document.getElementById('tab-skills'),
      inventory: document.getElementById('tab-inventory'),
    };
    for (const t of TABS) {
      const b = document.createElement('button');
      b.className = 'tab-btn';
      b.dataset.tab = t.id;
      b.textContent = t.label;
      b.title = t.key;
      b.addEventListener('click', () => this.show(t.id));
      this.strip.appendChild(b);
    }
    window.addEventListener('keydown', (e) => {
      const tab = TABS.find((t) => t.key === e.code);
      if (tab) { e.preventDefault(); this.show(tab.id); }
    });
    this.renderSkills();
    this.renderInventory();
    this.show(this.active);
  }

  show(id) {
    this.active = id;
    for (const [pid, el] of Object.entries(this.pages))
      el.classList.toggle('hidden', pid !== id);
    [...this.strip.children].forEach((b) =>
      b.classList.toggle('active', b.dataset.tab === id));
  }

  renderSkills() {
    const el = this.pages.skills;
    el.innerHTML = '';
    let total = 0;
    for (const s of this.player.skills) {
      total += s.level;
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.innerHTML = `<span class="skill-name">${s.name}</span><span class="skill-lvl">${s.level}</span>`;
      el.appendChild(row);
    }
    const tot = document.createElement('div');
    tot.className = 'skill-total';
    tot.textContent = 'Total level: ' + total;
    el.appendChild(tot);
  }

  renderInventory() {
    const el = this.pages.inventory;
    el.innerHTML = '';
    this.player.inventory.slots.forEach((slot, i) => {
      const cell = document.createElement('div');
      cell.className = 'inv-slot';
      if (slot) {
        const def = ITEMS[slot.id];
        cell.title = def.name;
        cell.innerHTML = `<svg viewBox="0 0 24 24">${def.icon}</svg>` +
          (def.stackable ? `<span class="inv-count">${slot.count}</span>` : '');
        cell.addEventListener('mousedown', (e) => {
          if (e.button === 0 || e.button === 2) this.ui.openItemMenu(i, e);
        });
      }
      el.appendChild(cell);
    });
  }
}

// ---------------------------------------------------------------------------

export class UI {
  constructor(player) {
    this.player = player;
    this.chat = new Chat();
    this.menu = new Menu(player);
    this.panel = new TabPanel(player, this);

    this.runOrb = document.getElementById('run-orb');
    this.runFill = document.getElementById('run-fill');
    this.runText = document.getElementById('run-text');
    this.fpsEl = document.getElementById('fps');
    this.banner = document.getElementById('region-banner');
    this.actionEl = document.getElementById('action-text');
    this.cursorHint = document.getElementById('cursor-hint');
  }

  /** Late-bound refs the item menus need. */
  bind({ world }) {
    this.world = world;
  }

  setRun(energy, on) {
    const pct = Math.round(energy);
    this.runFill.style.height = pct + '%';
    this.runText.textContent = pct;
    this.runOrb.classList.toggle('active', on);
  }

  setFps(fps) { this.fpsEl.textContent = fps + ' fps'; }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.remove('show');
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
  }

  /** Hover text near the top-left, classic style: "Take Bucket / 2 more options". */
  setActionText(desc) {
    if (!desc) { this.actionEl.classList.add('hidden'); return; }
    this.actionEl.classList.remove('hidden');
    this.actionEl.classList.toggle('far', !desc.inReach);
    this.actionEl.innerHTML =
      `<span class="verb">${desc.verb}</span> <span class="tname">${desc.name}</span>` +
      (desc.more ? ` <span class="more">/ ${desc.more} more</span>` : '');
  }

  setCursorMode(on) {
    this.cursorHint.classList.toggle('hidden', !on);
  }

  refreshInventory() { this.panel.renderInventory(); }

  openItemMenu(slotIndex, e) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot) return;
    const def = ITEMS[slot.id];
    this.menu.open([
      {
        label: 'Drop ' + def.name,
        run: () => {
          const removed = this.player.inventory.removeSlot(slotIndex);
          const p = this.player;
          this.world.addGroundItem(removed.id, removed.count, p.pos.x, p.pos.z, p.plane);
          this.chat.add('You drop the ' + def.name.toLowerCase() + '.');
          this.refreshInventory();
        },
      },
      {
        label: 'Examine ' + def.name,
        run: () => this.chat.add(def.examine, 'examine'),
      },
    ], { x: e.clientX, y: e.clientY });
  }
}
