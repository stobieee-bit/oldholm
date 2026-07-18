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
      // only when locked (no cursor) or actually over the menu — scrolling the
      // chat log must not change the pending selection
      if (this.isOpen && (this.player.pointerLocked || this.el.contains(e.target)))
        this._move(Math.sign(e.deltaY));
    });
    window.addEventListener('mousedown', (e) => {
      if (!this.isOpen) return;
      if (e === this._openEvent) return; // the mousedown that opened us is not a dismissal
      if (this.el.contains(e.target)) return; // row handlers take it
      if (e.button === 0 && this.player.pointerLocked) this._pick(this.highlight);
      else this.close();
    });
  }

  /** openEvent: the mousedown that spawned this menu, so its own bubble
   *  to window doesn't immediately dismiss it. */
  open(entries, at = null, openEvent = null) {
    if (!entries.length) return;
    this.entries = entries;
    this.highlight = 0;
    this.isOpen = true;
    this._openEvent = openEvent;
    this.player.menuOpen = true; // freezes look + movement; keyups still clear keys
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
    this._openEvent = null;
    this.player.menuOpen = false; // keyups are ungated and the closing keydown was captured
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
    if (!entry) return; // out-of-range digit: ignore, keep the menu open
    this.close();
    entry.run();
  }
}

// ---------------------------------------------------------------------------
// Combat feedback: hitsplats pinned to their victims, xp drops rising by the
// crosshair, mob hp bars while a fight is live. All DOM, projected per frame.

const _proj = { x: 0, y: 0, behind: false };

function project(v3, camera, out) {
  const v = v3.clone().project(camera);
  out.behind = v.z > 1;
  out.x = (v.x * 0.5 + 0.5) * window.innerWidth;
  out.y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  return out;
}

export class FX {
  constructor() {
    this.layer = document.getElementById('fx-layer');
    this.splats = [];
    this.drops = [];
    this.bars = new Map(); // mob -> {el, fill, until}
  }

  hitsplat(anchorFn, amount) {
    const el = document.createElement('div');
    el.className = 'hitsplat ' + (amount > 0 ? 'hs-dmg' : 'hs-zero');
    el.textContent = amount;
    this.layer.appendChild(el);
    this.splats.push({ el, anchorFn, until: performance.now() + 850 });
  }

  xpDrop(gains) {
    const el = document.createElement('div');
    el.className = 'xp-drop';
    el.innerHTML = gains
      .map(([name, xp]) => `+${Math.round(xp * 10) / 10} ${name}`)
      .join('<br>');
    this.layer.appendChild(el);
    this.drops.push({ el, born: performance.now() });
  }

  /** Show/refresh a mob's overhead hp bar for a few seconds. */
  bar(mob) {
    let b = this.bars.get(mob);
    if (!b) {
      const el = document.createElement('div');
      el.className = 'mob-hpbar';
      const fill = document.createElement('div');
      el.appendChild(fill);
      this.layer.appendChild(el);
      b = { el, fill };
      this.bars.set(mob, b);
    }
    b.until = performance.now() + 3000;
  }

  update(camera) {
    const now = performance.now();
    this.splats = this.splats.filter((s) => {
      if (now > s.until) { s.el.remove(); return false; }
      const a = s.anchorFn();
      if (!a) { s.el.remove(); return false; }
      if (a.screen) { // the player: pinned under the crosshair
        s.el.style.transform =
          `translate(${window.innerWidth / 2 - 14}px, ${window.innerHeight / 2 + 46}px)`;
        return true;
      }
      project(a, camera, _proj);
      if (_proj.behind) { s.el.style.opacity = '0'; return true; }
      s.el.style.opacity = '1';
      s.el.style.transform = `translate(${_proj.x - 14}px, ${_proj.y - 14}px)`;
      return true;
    });
    this.drops = this.drops.filter((d) => {
      const age = now - d.born;
      if (age > 1100) { d.el.remove(); return false; }
      const rise = age * 0.045;
      d.el.style.transform =
        `translate(${window.innerWidth / 2 + 26}px, ${window.innerHeight / 2 - 30 - rise}px)`;
      d.el.style.opacity = String(1 - age / 1100);
      return true;
    });
    for (const [mob, b] of this.bars) {
      if (now > b.until || mob.dead) { b.el.remove(); this.bars.delete(mob); continue; }
      const a = mob.splatAnchor();
      if (!a) { b.el.style.opacity = '0'; continue; }
      project(a, camera, _proj);
      b.el.style.opacity = _proj.behind ? '0' : '1';
      b.el.style.transform = `translate(${_proj.x - 22}px, ${_proj.y - 30}px)`;
      b.fill.style.width = Math.round((mob.hp / mob.maxHp) * 100) + '%';
    }
  }
}

// ---------------------------------------------------------------------------

const TABS = [
  { id: 'combat', label: 'Fight', key: 'F1' },
  { id: 'skills', label: 'Skills', key: 'F2' },
  { id: 'inventory', label: 'Pack', key: 'F4' },
];

const STYLES = [
  ['accurate', 'Accurate', 'trains Attack'],
  ['aggressive', 'Aggressive', 'trains Strength'],
  ['defensive', 'Defensive', 'trains Defence'],
];

export class TabPanel {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.active = 'inventory';
    this.strip = document.getElementById('tab-strip');
    this.pages = {
      combat: document.getElementById('tab-combat'),
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
    this.renderCombat();
    this.show(this.active);
  }

  renderCombat() {
    const el = this.pages.combat;
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'combat-head';
    head.innerHTML = `<div class="weapon-name">Fists</div>` +
      `<div class="combat-lvl">Combat level: <span>${this.ui.combatLevel()}</span></div>`;
    el.appendChild(head);
    for (const [id, label, hint] of STYLES) {
      const b = document.createElement('button');
      b.className = 'style-btn' + (this.player.style === id ? ' active' : '');
      b.innerHTML = `${label}<small>${hint}</small>`;
      b.addEventListener('click', () => {
        this.player.style = id;
        this.renderCombat();
      });
      el.appendChild(b);
    }
    const auto = document.createElement('button');
    auto.className = 'style-btn retaliate' + (this.player.autoRetaliate ? ' active' : '');
    auto.innerHTML = `Auto-retaliate<small>${this.player.autoRetaliate ? 'on' : 'off'}</small>`;
    auto.addEventListener('click', () => {
      this.player.autoRetaliate = !this.player.autoRetaliate;
      this.renderCombat();
    });
    el.appendChild(auto);
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
      row.title = Math.floor(s.xp) + ' xp';
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
    this.fx = new FX();
    this._combatLevelFn = () => 3;
    this.panel = new TabPanel(player, this);

    this.runOrb = document.getElementById('run-orb');
    this.runFill = document.getElementById('run-fill');
    this.runText = document.getElementById('run-text');
    this.hpOrb = document.getElementById('hp-orb');
    this.hpFill = document.getElementById('hp-fill');
    this.hpText = document.getElementById('hp-text');
    this.fpsEl = document.getElementById('fps');
    this.banner = document.getElementById('region-banner');
    this.actionEl = document.getElementById('action-text');
    this.cursorHint = document.getElementById('cursor-hint');
    this.levelFlash = document.getElementById('level-flash');
    this.levelBanner = document.getElementById('level-banner');
    this.deathFade = document.getElementById('death-fade');
  }

  /** Late-bound refs the item menus / combat displays need. */
  bind({ world, combatLevelFn }) {
    this.world = world;
    if (combatLevelFn) this._combatLevelFn = combatLevelFn;
  }

  combatLevel() { return this._combatLevelFn(); }

  setHp(hp, maxHp) {
    const pct = Math.round((hp / maxHp) * 100);
    this.hpFill.style.height = pct + '%';
    this.hpText.textContent = hp;
    this.hpOrb.classList.toggle('hurt', pct <= 50 && pct > 25);
    this.hpOrb.classList.toggle('dying', pct <= 25);
  }

  levelUp(name, level) {
    const an = /^[AEIOU]/.test(name) ? 'an' : 'a';
    this.chat.add(
      `Congratulations, you've advanced ${an} ${name} level! ` +
      `Your ${name} level is now ${level}.`, 'system');
    this.levelBanner.textContent = `${name.toUpperCase()} — LEVEL ${level}`;
    for (const el of [this.levelFlash, this.levelBanner]) {
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
    }
    this.panel.renderCombat();
  }

  deathFlash() {
    this.deathFade.classList.remove('show');
    void this.deathFade.offsetWidth;
    this.deathFade.classList.add('show');
    this.setHp(this.player.hp, this.player.maxHp);
  }

  refreshSkills() { this.panel.renderSkills(); }

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

  /** Hover text top-center, classic style: "Attack Goblin (level 5) / 1 more". */
  setActionText(desc) {
    if (!desc) { this.actionEl.classList.add('hidden'); return; }
    this.actionEl.classList.remove('hidden');
    this.actionEl.classList.toggle('far', !desc.inReach);
    const lvl = desc.level !== undefined
      ? ` <span class="${desc.levelClass}">(level ${desc.level})</span>` : '';
    this.actionEl.innerHTML =
      `<span class="verb">${desc.verb}</span> <span class="tname">${desc.name}</span>${lvl}` +
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
    const entries = [];
    if (def.heals) entries.push({
      label: 'Eat ' + def.name,
      run: () => this.player.eat(slotIndex, this),
    });
    this.menu.open([
      ...entries,
      {
        label: 'Drop ' + def.name,
        run: () => {
          // revalidate: the slot may have changed since the menu opened
          const cur = this.player.inventory.slots[slotIndex];
          if (!cur || cur.id !== slot.id) return;
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
    ], { x: e.clientX, y: e.clientY }, e);
  }
}
