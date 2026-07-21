// OLDHOLM — ui.js
// Phase 2 UI shell: chatbox (the narrator), context menu, right-side tab
// panel (Skills F2 / Inventory F4), hover action text, HUD orbs, banner.
// More tabs slot into TABS as later phases add their systems.

import { ITEMS, METAL_SMITHING } from '../data/items.js';
import { FIREMAKING, COOKING } from '../data/resources.js';
import { SMELTING, SMITHABLES, JEWELRY, LEATHER_RECIPES, FLETCHING, GEMS, STRINGING, BAKING, HERBLORE } from '../data/crafting.js';
import { SPELLS } from '../data/spells.js';
import { PRAYERS } from '../data/prayers.js';
import { BONES } from '../data/prayers.js';
import { QUESTS, QUEST_ORDER } from '../data/quests.js';
import { MOBS } from '../data/mobs.js';
import { BINDS, BIND_LABELS, rebind, keyLabel, bindsSnapshot } from './keybinds.js';
import { PETS } from '../data/pets.js';

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

// Item icons: the shared #itemFx filter (index.html) gives every flat SVG a
// glossy top-light + a drop shadow so items read as 3D objects in the slot.
function itemIconSVG(def) {
  return `<svg viewBox="0 0 24 24"><g filter="url(#itemFx)">${def.icon}</g></svg>`;
}
// Compact big stack counts, RS-style: 842, 15K, 3.2M.
function fmtCount(n) {
  if (n < 100000) return String(n);
  if (n < 10000000) return Math.floor(n / 1000) + 'K';
  return Math.floor(n / 1000000) + 'M';
}

export class FX {
  constructor() {
    this.layer = document.getElementById('fx-layer');
    this.splats = [];
    this.drops = [];
    this.bars = new Map(); // mob -> {el, fill, until}
  }

  hitsplat(anchorFn, amount) {
    const el = document.createElement('div'); // anchor: JS translates this
    el.className = 'hitsplat-anchor';
    const body = document.createElement('div'); // the splat: CSS pops this
    body.className = 'hitsplat ' + (amount > 0 ? 'hs-dmg' : 'hs-zero') + (this.colorblind ? ' cb' : '');
    body.textContent = amount;
    el.appendChild(body);
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

  /** Overhead speech: idle chatter and future quest barks. */
  say(anchorFn, text) {
    const el = document.createElement('div');
    el.className = 'overhead-say';
    el.textContent = text;
    this.layer.appendChild(el);
    (this.sayings ??= []).push({ el, anchorFn, until: performance.now() + 3800 });
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
    if (this.sayings) this.sayings = this.sayings.filter((s) => {
      if (now > s.until) { s.el.remove(); return false; }
      const a = s.anchorFn();
      if (!a) { s.el.remove(); return false; }
      project(a, camera, _proj);
      s.el.style.opacity = _proj.behind ? '0' : '1';
      s.el.style.transform = `translate(calc(${_proj.x}px - 50%), ${_proj.y - 34}px)`;
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
  { id: 'quests', label: 'Quests', key: 'F3' },
  { id: 'inventory', label: 'Pack', key: 'F4' },
  { id: 'equipment', label: 'Gear', key: 'F5' },
  { id: 'prayer', label: 'Pray', key: 'F6' },
  { id: 'spellbook', label: 'Magic', key: 'F7' },
  { id: 'bestiary', label: 'Log', key: 'F9' },
  { id: 'settings', label: 'System', key: 'F8' },
];

const EQUIP_SLOTS = [
  ['head', 'Head'], ['cape', 'Cape'], ['neck', 'Neck'], ['ammo', 'Ammo'],
  ['weapon', 'Weapon'], ['body', 'Body'], ['shield', 'Shield'], ['legs', 'Legs'],
  ['gloves', 'Gloves'], ['boots', 'Boots'], ['ring', 'Ring'],
];

const KIND_HINT = {
  accurate: 'trains Attack',
  aggressive: 'trains Strength',
  defensive: 'trains Defence',
  controlled: 'trains Att/Str/Def',
  ranged: 'trains Ranged',
};

export class TabPanel {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.active = 'inventory';
    this.strip = document.getElementById('tab-strip');
    this.pages = {
      combat: document.getElementById('tab-combat'),
      skills: document.getElementById('tab-skills'),
      quests: document.getElementById('tab-quests'),
      inventory: document.getElementById('tab-inventory'),
      equipment: document.getElementById('tab-equipment'),
      prayer: document.getElementById('tab-prayer'),
      spellbook: document.getElementById('tab-spellbook'),
      bestiary: document.getElementById('tab-bestiary'),
      settings: document.getElementById('tab-settings'),
    };
    this.selectedQuest = QUEST_ORDER[0];
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
    this.renderEquipment();
    this.renderPrayers();
    this.renderSpellbook();
    this.renderJournal();
    this.renderSettings();
    this.show(this.active);
  }

  /** The System tab: audio controls + the save/load hub (spec §14). */
  renderSettings() {
    const el = this.pages.settings;
    if (!el) return;
    el.innerHTML = '';
    const audio = this.ui.audio, save = this.ui.save;

    const head = document.createElement('div');
    head.className = 'combat-head';
    head.innerHTML = '<div class="combat-lvl">SYSTEM</div>';
    el.appendChild(head);

    const persist = () => save && audio && save.saveSettings({
      volume: audio.volume, music: audio.musicEnabled, sound: audio.enabled,
      quality: this.ui.graphicsQuality ?? 'high', colorblind: !!this.ui.fx?.colorblind,
      binds: bindsSnapshot(),
    });

    // sound on/off
    const soundRow = document.createElement('button');
    soundRow.className = 'sys-toggle';
    const drawSound = () => { soundRow.textContent = 'Sound: ' + (audio?.enabled ? 'On' : 'Off');
      soundRow.classList.toggle('off', !audio?.enabled); };
    drawSound();
    soundRow.addEventListener('click', () => { audio?.toggle(!audio.enabled); drawSound(); persist(); });
    el.appendChild(soundRow);

    // music on/off
    const musicRow = document.createElement('button');
    musicRow.className = 'sys-toggle';
    const drawMusic = () => { musicRow.textContent = 'Music: ' + (audio?.musicEnabled ? 'On' : 'Off');
      musicRow.classList.toggle('off', !audio?.musicEnabled); };
    drawMusic();
    musicRow.addEventListener('click', () => { audio?.toggleMusic(!audio.musicEnabled); drawMusic(); persist(); });
    el.appendChild(musicRow);

    // volume slider
    const volWrap = document.createElement('div');
    volWrap.className = 'sys-slider';
    volWrap.innerHTML = '<span>Volume</span>';
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '100';
    slider.value = String(Math.round((audio?.volume ?? 0.6) * 100));
    slider.addEventListener('input', () => audio?.setVolume(slider.value / 100));
    slider.addEventListener('change', persist);
    volWrap.appendChild(slider);
    el.appendChild(volWrap);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'sys-btn';
    saveBtn.textContent = 'Save & Load…';
    saveBtn.addEventListener('click', () => this.ui.openSavePanel());
    el.appendChild(saveBtn);

    const note = document.createElement('div');
    note.className = 'sys-note';
    note.textContent = 'The realm autosaves every half-minute and when you leave.';
    el.appendChild(note);

    // ---- graphics + accessibility -------------------------------------------
    const persistAll = () => save && save.saveSettings({
      volume: audio?.volume ?? 0.6, music: audio?.musicEnabled ?? true, sound: audio?.enabled ?? true,
      quality: this.ui.graphicsQuality ?? 'high', colorblind: !!this.ui.fx?.colorblind,
      binds: bindsSnapshot(),
    });

    const gfxRow = document.createElement('button');
    gfxRow.className = 'sys-toggle';
    const drawGfx = () => { gfxRow.textContent = 'Graphics: ' + ((this.ui.graphicsQuality ?? 'high') === 'high' ? 'High' : 'Low (fast)'); };
    drawGfx();
    gfxRow.addEventListener('click', () => {
      const q = (this.ui.graphicsQuality ?? 'high') === 'high' ? 'low' : 'high';
      this.ui.graphics?.set(q);
      drawGfx(); persistAll();
    });
    el.appendChild(gfxRow);

    const cbRow = document.createElement('button');
    cbRow.className = 'sys-toggle';
    const drawCb = () => { cbRow.textContent = 'Colorblind hitsplats: ' + (this.ui.fx?.colorblind ? 'On' : 'Off');
      cbRow.classList.toggle('off', !this.ui.fx?.colorblind); };
    drawCb();
    cbRow.addEventListener('click', () => {
      if (this.ui.fx) this.ui.fx.colorblind = !this.ui.fx.colorblind;
      drawCb(); persistAll();
    });
    el.appendChild(cbRow);

    // ---- keybinds: click a row, press the new key ----------------------------
    const kbHead = document.createElement('div');
    kbHead.className = 'combat-head';
    kbHead.innerHTML = '<div class="combat-lvl">KEYS</div>';
    el.appendChild(kbHead);
    for (const action of Object.keys(BINDS)) {
      const row = document.createElement('button');
      row.className = 'sys-toggle';
      const draw = (listening) => {
        row.textContent = `${BIND_LABELS[action]}: ${listening ? 'press a key…' : keyLabel(BINDS[action][0])}`;
      };
      draw(false);
      row.addEventListener('click', () => {
        draw(true);
        const capture = (e) => {
          e.preventDefault(); e.stopPropagation();
          window.removeEventListener('keydown', capture, true);
          if (e.code !== 'Escape') rebind(action, e.code);
          this.renderSettings(); // repaint every row (a key may have moved)
          persistAll();
        };
        window.addEventListener('keydown', capture, true);
      });
      el.appendChild(row);
    }

    // ---- online: wanderer name + hiscores (quiet when the server is away) ----
    const online = this.ui.online;
    if (online) {
      const oHead = document.createElement('div');
      oHead.className = 'combat-head';
      oHead.innerHTML = '<div class="combat-lvl">ONLINE</div>';
      el.appendChild(oHead);

      const nameWrap = document.createElement('div');
      nameWrap.className = 'sys-slider';
      nameWrap.innerHTML = '<span>Name</span>';
      const nameIn = document.createElement('input');
      nameIn.type = 'text'; nameIn.maxLength = 16; nameIn.value = online.name();
      nameIn.placeholder = 'wanderer name';
      nameIn.addEventListener('change', () => {
        online.setName(nameIn.value.trim());
        if (online.name()) { online.connect(); online.submitHiscore(); }
      });
      nameWrap.appendChild(nameIn);
      el.appendChild(nameWrap);

      // cloud saves: name + PIN key a backup slot on the server
      const pinWrap = document.createElement('div');
      pinWrap.className = 'sys-slider';
      pinWrap.innerHTML = '<span>PIN</span>';
      const pinIn = document.createElement('input');
      pinIn.type = 'password'; pinIn.maxLength = 8; pinIn.inputMode = 'numeric';
      pinIn.placeholder = '4–8 digits'; pinIn.value = online.pin();
      pinIn.addEventListener('change', () => { online.setPin(pinIn.value); pinIn.value = online.pin(); });
      pinWrap.appendChild(pinIn);
      el.appendChild(pinWrap);

      const cloudRow = document.createElement('div');
      cloudRow.style.cssText = 'display:flex;gap:6px';
      const upBtn = document.createElement('button');
      upBtn.className = 'sys-btn'; upBtn.style.flex = '1';
      upBtn.textContent = 'Save to cloud';
      upBtn.addEventListener('click', async () => {
        upBtn.textContent = 'Saving…';
        const r = await online.saveToCloud();
        upBtn.textContent = 'Save to cloud';
        this.ui.chat.add(r.msg, r.ok ? 'system' : undefined);
      });
      const downBtn = document.createElement('button');
      downBtn.className = 'sys-btn'; downBtn.style.flex = '1';
      downBtn.textContent = 'Load from cloud';
      downBtn.addEventListener('click', async () => {
        downBtn.textContent = 'Loading…';
        const r = await online.loadFromCloud();
        downBtn.textContent = 'Load from cloud';
        this.ui.chat.add(r.msg, r.ok ? 'system' : undefined);
      });
      cloudRow.appendChild(upBtn); cloudRow.appendChild(downBtn);
      el.appendChild(cloudRow);
      const cloudNote = document.createElement('div');
      cloudNote.className = 'sys-note';
      cloudNote.textContent = 'Cloud backup lets you move between devices. Your browser save stays the main copy.';
      el.appendChild(cloudNote);

      const board = document.createElement('div');
      board.className = 'sys-note';
      board.textContent = 'Hiscores: fetching…';
      const drawBoard = async () => {
        const data = await online.fetchHiscores();
        if (!data) { board.textContent = 'Hiscores: the realm link is quiet (server offline).'; return; }
        const lines = data.top.slice(0, 10)
          .map((r, i) => `${i + 1}. ${r.name} — total ${r.total} (cb ${r.combat})`);
        board.textContent = lines.length ? lines.join('\n') : 'Hiscores: no wanderers recorded yet.';
        board.style.whiteSpace = 'pre-line';
      };
      drawBoard();
      const refresh = document.createElement('button');
      refresh.className = 'sys-btn';
      refresh.textContent = 'Refresh hiscores';
      refresh.addEventListener('click', () => { online.submitHiscore(); drawBoard(); });
      el.appendChild(refresh);
      el.appendChild(board);
    }
  }

  renderJournal() {
    const el = this.pages.quests;
    el.innerHTML = '';
    const quests = this.ui.quests;
    for (const id of QUEST_ORDER) {
      const row = document.createElement('div');
      const st = quests ? quests.status(id) : 'locked';
      row.className = 'quest-row quest-' + st + (this.selectedQuest === id && !this.selectedDiary ? ' selected' : '');
      row.textContent = QUESTS[id].name;
      row.addEventListener('click', () => { this.selectedQuest = id; this.selectedDiary = null; this.renderJournal(); });
      el.appendChild(row);
    }
    // ---- achievement diaries (progress derived live; claim when complete) ----
    const diaries = this.ui.diaries;
    if (diaries) {
      const head = document.createElement('div');
      head.className = 'skill-total';
      head.textContent = 'Achievement diaries';
      el.appendChild(head);
      for (const id of diaries.order()) {
        const [done, total] = diaries.progress(id);
        const st = diaries.claimed[id] ? 'done' : diaries.claimable(id) ? 'active' : 'locked';
        const row = document.createElement('div');
        row.className = 'quest-row quest-' + st + (this.selectedDiary === id ? ' selected' : '');
        row.textContent = `${diaries.def(id).name}  ${done}/${total}` + (diaries.claimable(id) ? '  — claim!' : '');
        row.addEventListener('click', () => { this.selectedDiary = id; this.renderJournal(); });
        el.appendChild(row);
      }
    }
    const detail = document.createElement('div');
    detail.className = 'quest-detail';
    if (this.selectedDiary && diaries) {
      const id = this.selectedDiary;
      for (const t of diaries.checklist(id)) {
        const line = document.createElement('div');
        line.className = t.done ? 'quest-done' : 'quest-locked';
        line.textContent = (t.done ? '✓ ' : '· ') + t.text;
        detail.appendChild(line);
      }
      if (diaries.claimable(id)) {
        const btn = document.createElement('div');
        btn.className = 'dlg-opt';
        btn.textContent = `Claim reward: ${diaries.def(id).rewards.join(', ')}`;
        btn.addEventListener('click', () => { diaries.claim(id); this.renderJournal(); });
        detail.appendChild(btn);
      } else if (diaries.claimed[id]) {
        const doneLine = document.createElement('div');
        doneLine.textContent = 'Reward claimed. The realm remembers.';
        detail.appendChild(doneLine);
      }
    } else {
      detail.textContent = quests ? quests.journalLine(this.selectedQuest) : '';
    }
    el.appendChild(detail);
    const foot = document.createElement('div');
    foot.className = 'skill-total';
    foot.textContent = quests ? `Quest points: ${quests.questPoints()} / ${quests.totalQp()}` : '';
    el.appendChild(foot);
  }

  renderPrayers() {
    const el = this.pages.prayer;
    el.innerHTML = '';
    const prayers = this.ui.prayers;
    const lvl = this.player.skillByName('Prayer').level;
    const head = document.createElement('div');
    head.className = 'combat-head';
    head.innerHTML = `<div class="combat-lvl">Prayer points: <span>${prayers ? Math.ceil(prayers.points) : lvl} / ${lvl}</span></div>`;
    el.appendChild(head);
    for (const p of PRAYERS) {
      const b = document.createElement('button');
      const active = prayers?.active.has(p.id);
      const locked = lvl < p.req;
      b.className = 'style-btn prayer-btn' + (active ? ' active' : '') + (locked ? ' locked' : '');
      b.innerHTML = `${p.name}<small>lvl ${p.req} · ${p.examine}</small>`;
      b.addEventListener('click', () => prayers?.toggle(p.id));
      el.appendChild(b);
    }
  }

  renderSpellbook() {
    const el = this.pages.spellbook;
    el.innerHTML = '';
    const magic = this.ui.magic;
    const lvl = this.player.skillByName('Magic').level;
    const head = document.createElement('div');
    head.className = 'combat-head';
    head.innerHTML = `<div class="combat-lvl">Magic level: <span>${lvl}</span></div>` +
      `<div class="combat-lvl" style="margin-top:2px">${magic?.autocast ? 'Auto-casting' : 'Click a spell to auto-cast'}</div>`;
    el.appendChild(head);
    for (const s of SPELLS) {
      const b = document.createElement('button');
      const active = magic?.autocast === s.id || magic?.pendingUtility?.id === s.id;
      const locked = lvl < s.req;
      const css = '#' + s.color.toString(16).padStart(6, '0');
      const cost = Object.entries(s.cost)
        .map(([id, n]) => `${n} ${ITEMS[id].name.toLowerCase().replace(' glyph', '')}`).join(', ');
      const kind = s.type === 'teleport' ? 'teleport · click to cast'
        : s.type === 'utility' ? 'cast on an item' : `max ${s.maxHit}`;
      b.className = 'style-btn spell-btn' + (active ? ' active' : '') + (locked ? ' locked' : '');
      b.innerHTML = `<span class="spell-dot" style="background:${css}"></span>${s.name}` +
        `<small>lvl ${s.req} · ${kind} · ${cost}</small>`;
      b.addEventListener('click', () => magic?.setAutocast(s.id));
      el.appendChild(b);
    }
  }

  renderEquipment() {
    const el = this.pages.equipment;
    el.innerHTML = '';
    for (const [slotName, label] of EQUIP_SLOTS) {
      const id = this.player.equipment[slotName];
      const row = document.createElement('div');
      row.className = 'equip-row' + (id ? ' filled' : '');
      const countTag = slotName === 'ammo' && id && this.player.ammoCount > 0
        ? ` ×${this.player.ammoCount}` : '';
      row.innerHTML = `<span class="equip-slot">${label}</span>` +
        `<span class="equip-item">${id ? ITEMS[id].name + countTag : '—'}</span>`;
      if (id) row.addEventListener('mousedown', (e) => {
        if (e.button !== 0 && e.button !== 2) return;
        this.ui.menu.open([
          { label: 'Remove ' + ITEMS[id].name, run: () => this.player.unequip(slotName, this.ui) },
          { label: 'Examine ' + ITEMS[id].name, run: () => this.ui.chat.add(ITEMS[id].examine, 'examine') },
        ], { x: e.clientX, y: e.clientY }, e);
      });
      el.appendChild(row);
    }
    // classic-style typed bonus readout
    const p = this.player;
    const foot = document.createElement('div');
    foot.className = 'equip-bonuses';
    const atk = ['stab', 'slash', 'crush'].map((t) => `${t} +${p.attackBonus(t)}`).join('  ');
    const dfn = ['stab', 'slash', 'crush'].map((t) => `${t} +${p.defenceBonus(t)}`).join('  ');
    foot.innerHTML =
      `<div><span>Attack</span>${atk}</div>` +
      `<div><span>Defence</span>${dfn}</div>` +
      `<div><span>Other</span>str +${p.strengthBonus()}</div>`;
    el.appendChild(foot);
  }

  renderCombat() {
    const el = this.pages.combat;
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'combat-head';
    const wid = this.player.equipment.weapon;
    head.innerHTML = `<div class="weapon-name">${wid ? ITEMS[wid].name : 'Fists'}</div>` +
      `<div class="combat-lvl">Combat level: <span>${this.ui.combatLevel()}</span></div>`;
    el.appendChild(head);
    this.player.currentStyles().forEach((st, i) => {
      const b = document.createElement('button');
      b.className = 'style-btn' + (this.player.styleIndex === i ? ' active' : '');
      b.innerHTML = `${st.name}<small>${st.kind} · ${st.type} · ${KIND_HINT[st.kind]}</small>`;
      b.addEventListener('click', () => {
        this.player.styleIndex = i;
        this.renderCombat();
        this.renderEquipment(); // the atk bonus readout follows the style's type
      });
      el.appendChild(b);
    });
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
    if (id === 'bestiary') this.renderBestiary(); // kills move; render fresh
  }

  /** The collection log: every attackable species, its level, and your tally. */
  renderBestiary() {
    const el = this.pages.bestiary;
    if (!el) return;
    el.innerHTML = '';
    const kills = this.ui.combatRef?.kills ?? {};
    const cl = (s) => Math.floor(0.25 * (s.def + s.hp) + 0.325 * (s.att + s.str));
    const rows = Object.entries(MOBS)
      .filter(([, d]) => d.attackable !== false)
      .map(([id, d]) => ({ id, name: d.name, lv: cl(d.stats), boss: !!d.boss, n: kills[id] ?? 0 }))
      .sort((a, b) => a.lv - b.lv || a.name.localeCompare(b.name));
    const slain = rows.filter((r) => r.n > 0).length;
    const head = document.createElement('div');
    head.className = 'combat-head';
    head.innerHTML = `<div class="combat-lvl">BESTIARY — ${slain} / ${rows.length} slain</div>`;
    el.appendChild(head);
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'quest-row ' + (r.n > 0 ? 'quest-done' : 'quest-locked');
      row.textContent = `${r.n > 0 ? r.name : '???'}${r.boss ? ' ♛' : ''}  (lv ${r.lv})`;
      const tally = document.createElement('span');
      tally.style.cssText = 'float:right;opacity:0.8';
      tally.textContent = r.n > 0 ? `× ${r.n}` : 'unseen';
      row.appendChild(tally);
      el.appendChild(row);
    }
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
        cell.innerHTML = itemIconSVG(def) +
          (def.stackable ? `<span class="inv-count">${fmtCount(slot.count)}</span>` : '');
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
    this.prayerFill = document.getElementById('prayer-fill');
    this.prayerText = document.getElementById('prayer-text');
    this.fpsEl = document.getElementById('fps');
    this.banner = document.getElementById('region-banner');
    this.actionEl = document.getElementById('action-text');
    this.cursorHint = document.getElementById('cursor-hint');
    this.levelFlash = document.getElementById('level-flash');
    this.levelBanner = document.getElementById('level-banner');
    this.deathFade = document.getElementById('death-fade');
    this.hurtFade = document.getElementById('hurt-fade');
    document.getElementById('anvil-close').addEventListener('click', () => this.closeAnvil());
    document.getElementById('shop-close').addEventListener('click', () => this.closeShop());
    document.getElementById('bank-close').addEventListener('click', () => this.closeBank());
    document.getElementById('bank-search').addEventListener('input', () => this.refreshBank());
  }

  /** Late-bound refs the item menus / combat displays need. */
  bind({ world, combatLevelFn, actions, prayers, magic, shops, bank, dialogue, quests }) {
    this.world = world;
    if (combatLevelFn) this._combatLevelFn = combatLevelFn;
    if (actions) this.actions = actions;
    if (prayers) this.prayers = prayers;
    if (magic) this.magic = magic;
    if (shops) this.shops = shops;
    if (bank) this.bank = bank;
    if (dialogue) this.dialogue = dialogue;
    if (quests) this.quests = quests;
  }

  bindMarket(market) {
    this.market = market;
    document.getElementById('market-close').addEventListener('click', () => this.closeMarket());
    document.getElementById('market-search').addEventListener('input', () => this.refreshMarket());
  }

  /** Wire the save system + audio into the System tab (spec §14). */
  bindSaveSystem(save, audio) {
    this.save = save;
    this.audio = audio;
    this.panel.renderSettings();
    document.getElementById('save-close').addEventListener('click', () => this.closeSavePanel());
    // a reusable hidden file input for import
    this._importInput = document.createElement('input');
    this._importInput.type = 'file';
    this._importInput.accept = 'application/json,.json';
    this._importInput.style.display = 'none';
    this._importInput.addEventListener('change', () => {
      const file = this._importInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.save.importJson(reader.result)) {
          this.chat.add('A saved journey is restored from file.', 'system');
          this.closeSavePanel();
        } else this.chat.add('That file could not be read as an Oldholm save.', 'system');
      };
      reader.readAsText(file);
      this._importInput.value = '';
    });
    document.body.appendChild(this._importInput);
  }

  openSavePanel() {
    document.getElementById('save-panel').classList.remove('hidden');
    this.renderSavePanel();
  }
  closeSavePanel() { document.getElementById('save-panel').classList.add('hidden'); }

  renderSavePanel() {
    const body = document.getElementById('save-body');
    body.innerHTML = '';
    const save = this.save;
    const row = (title, meta, actions) => {
      const r = document.createElement('div');
      r.className = 'save-row';
      const info = document.createElement('div');
      info.className = 'save-info';
      info.innerHTML = `<div class="save-title">${title}</div><div class="save-meta">${meta}</div>`;
      r.appendChild(info);
      const btns = document.createElement('div');
      btns.className = 'save-actions';
      for (const [label, fn, cls] of actions) {
        const b = document.createElement('button');
        b.className = 'save-btn' + (cls ? ' ' + cls : '');
        b.textContent = label;
        b.addEventListener('click', fn);
        btns.appendChild(b);
      }
      r.appendChild(btns);
      body.appendChild(r);
    };

    const metaText = (m) => m ? `Total level ${m.totalLevel} · ${m.quests} quests done` : 'empty';
    for (let n = 0; n < 3; n++) {
      const m = save.slotMeta(n);
      row(`Slot ${n + 1}`, metaText(m), [
        ['Save', () => { save.saveSlot(n); this.chat.add(`Saved to slot ${n + 1}.`, 'system'); this.renderSavePanel(); }],
        ...(m ? [['Load', () => { if (save.loadSlot(n)) { this.chat.add(`Slot ${n + 1} restored.`, 'system'); this.closeSavePanel(); } }]] : []),
      ]);
    }
    const auto = save.hasAuto() ? save.meta('oldholm_auto') : null;
    row('Autosave', auto ? metaText(auto) : 'none yet', auto ? [
      ['Load', () => { if (save.loadAuto()) { this.chat.add('Autosave restored.', 'system'); this.closeSavePanel(); } }],
    ] : []);

    // export / import / wipe. The wipe needs two consecutive clicks; `armed`
    // is local to this render, and any other action disarms it, so the guard
    // can never carry a stale confirm across panels or intervening clicks.
    let armed = false;
    const tools = document.createElement('div');
    tools.className = 'save-tools';
    const wipeBtn = document.createElement('button');
    const disarm = () => { if (armed) { armed = false; wipeBtn.textContent = 'Wipe all saves'; wipeBtn.classList.remove('armed'); } };
    const mk = (label, fn, cls) => {
      const b = document.createElement('button');
      b.className = 'save-btn' + (cls ? ' ' + cls : '');
      b.textContent = label; b.addEventListener('click', () => { disarm(); fn(); });
      return b;
    };
    tools.appendChild(mk('Export to file', () => save.exportJson()));
    tools.appendChild(mk('Import from file', () => this._importInput.click()));
    wipeBtn.className = 'save-btn danger';
    wipeBtn.textContent = 'Wipe all saves';
    wipeBtn.addEventListener('click', () => {
      if (armed) { save.clearAll(); this.chat.add('All saves wiped.', 'system'); this.renderSavePanel(); }
      else { armed = true; wipeBtn.textContent = 'Really wipe? Click again'; wipeBtn.classList.add('armed'); this.chat.add('Click "Really wipe?" again to confirm — this deletes every save.', 'system'); }
    });
    tools.appendChild(wipeBtn);
    body.appendChild(tools);
  }

  refreshJournal() { this.panel.renderJournal(); }

  /** The completion fanfare screen (spec §11). */
  questFanfare(q, qp, totalQp) {
    const el = document.getElementById('quest-fanfare');
    document.getElementById('qf-name').textContent = q.name;
    const list = document.getElementById('qf-rewards');
    list.innerHTML = '';
    for (const r of q.rewards) {
      const li = document.createElement('div');
      li.textContent = '· ' + r;
      list.appendChild(li);
    }
    document.getElementById('qf-points').textContent = `Quest points: ${qp} / ${totalQp}`;
    this.audio?.sfx('quest');
    el.classList.remove('hidden');
    for (const f of [this.levelFlash]) { f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); }
    const dismiss = () => { el.classList.add('hidden'); el.removeEventListener('mousedown', dismiss); };
    el.addEventListener('mousedown', dismiss);
  }

  coins() {
    return this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === 'coins' ? s.count : 0), 0);
  }

  // ---- shop panel -----------------------------------------------------------

  openShop(shopId) {
    if (!shopId || !this.shops?.get(shopId)) return;
    this.closeBank(); this.closeAnvil();
    this.activeShop = shopId;
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('shop-panel').classList.remove('hidden');
    this.refreshShop();
    this._shopEsc = (e) => { if (e.code === 'Escape') this.closeShop(); };
    window.addEventListener('keydown', this._shopEsc);
  }

  closeShop() {
    this.activeShop = null;
    document.getElementById('shop-panel').classList.add('hidden');
    if (this._shopEsc) { window.removeEventListener('keydown', this._shopEsc); this._shopEsc = null; }
  }

  refreshShop() {
    if (!this.activeShop) return;
    const shop = this.shops.get(this.activeShop);
    document.getElementById('shop-name').textContent = shop.def.name.toUpperCase();
    document.getElementById('shop-coins').textContent = this.coins() + ' coins';
    const body = document.getElementById('shop-body');
    body.innerHTML = '';
    for (const s of shop.stock) {
      if (s.qty <= 0 && s.transient) continue;
      const row = document.createElement('div');
      row.className = 'anvil-row' + (s.qty <= 0 ? ' locked' : '');
      row.innerHTML = `<span>${ITEMS[s.item].name} <em class="shop-qty">×${s.qty}</em></span>` +
        `<span class="anvil-meta">${this.shops.buyPrice(shop, s.item)}c</span>`;
      row.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;
        this.menu.open([
          { label: 'Buy 1', run: () => this.shops.buy(shop.id, s.item, 1) },
          { label: 'Buy 5', run: () => this.shops.buy(shop.id, s.item, 5) },
          { label: 'Examine', run: () => this.chat.add(ITEMS[s.item].examine, 'examine') },
        ], { x: e.clientX, y: e.clientY }, e);
      });
      body.appendChild(row);
    }
  }

  // ---- bank panel -----------------------------------------------------------

  openBank() {
    this.closeShop(); this.closeAnvil();
    this.bankOpen = true;
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('bank-panel').classList.remove('hidden');
    this.refreshBank();
    this._bankEsc = (e) => { if (e.code === 'Escape') this.closeBank(); };
    window.addEventListener('keydown', this._bankEsc);
  }

  closeBank() {
    this.bankOpen = false;
    document.getElementById('bank-panel').classList.add('hidden');
    if (this._bankEsc) { window.removeEventListener('keydown', this._bankEsc); this._bankEsc = null; }
  }

  refreshBank() {
    if (!this.bankOpen) return;
    const filter = document.getElementById('bank-search').value ?? '';
    const body = document.getElementById('bank-body');
    body.innerHTML = '';
    const entries = this.bank.entries(filter);
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'anvil-metal';
      empty.textContent = filter ? 'Nothing matches.' : 'The vault awaits your fortune.';
      body.appendChild(empty);
      return;
    }
    for (const [id, n] of entries) {
      const row = document.createElement('div');
      row.className = 'anvil-row';
      row.innerHTML = `<span>${ITEMS[id].name}</span><span class="anvil-meta">×${n}</span>`;
      row.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;
        this.menu.open([
          { label: 'Withdraw 1', run: () => this.bank.withdraw(id, 1) },
          { label: 'Withdraw 5', run: () => this.bank.withdraw(id, 5) },
          { label: 'Withdraw 10', run: () => this.bank.withdraw(id, 10) },
          { label: 'Withdraw All', run: () => this.bank.withdraw(id, this.bank.count(id)) },
          { label: 'Withdraw X…', run: () => this.askAmount('Withdraw how many?', (x) => this.bank.withdraw(id, x)) },
        ], { x: e.clientX, y: e.clientY }, e);
      });
      body.appendChild(row);
    }
  }

  // ---- the Grand Market panel -------------------------------------------------

  openMarket() {
    if (!this.market) return;
    this.closeShop(); this.closeBank(); this.closeAnvil();
    this.marketOpen = true;
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('market-panel').classList.remove('hidden');
    this.refreshMarket();
    this._mktEsc = (e) => { if (e.code === 'Escape') this.closeMarket(); };
    window.addEventListener('keydown', this._mktEsc);
  }

  closeMarket() {
    this.marketOpen = false;
    document.getElementById('market-panel').classList.add('hidden');
    if (this._mktEsc) { window.removeEventListener('keydown', this._mktEsc); this._mktEsc = null; }
  }

  refreshMarket() {
    if (!this.marketOpen) return;
    const body = document.getElementById('market-offers');
    body.innerHTML = '';
    if (!this.market.offers.length) {
      const d = document.createElement('div');
      d.className = 'anvil-metal';
      d.textContent = 'No open offers. Click items in your pack to sell; search below to buy.';
      body.appendChild(d);
    }
    for (const o of this.market.offers) {
      const row = document.createElement('div');
      row.className = 'anvil-row';
      const fair = Math.round(this.market.fairPrice(o.itemId));
      row.innerHTML = `<span>${o.type === 'sell' ? 'SELL' : 'BUY'} ${ITEMS[o.itemId].name}` +
        ` <em class="shop-qty">${o.qty - o.remaining}/${o.qty} @ ${o.price}c</em></span>` +
        `<span class="anvil-meta">fair ~${fair}c · ✕</span>`;
      row.addEventListener('mouseup', (e) => { if (e.button === 0) this.market.cancel(o.id); });
      body.appendChild(row);
    }
    const coll = document.getElementById('market-collect');
    coll.innerHTML = '';
    const entries = [...this.market.collection.entries()];
    if (!entries.length) {
      const d = document.createElement('div');
      d.className = 'anvil-metal';
      d.textContent = 'Collection box: empty. For now.';
      coll.appendChild(d);
    }
    for (const [id, n] of entries) {
      const row = document.createElement('div');
      row.className = 'anvil-row';
      row.innerHTML = `<span>${ITEMS[id].name}</span><span class="anvil-meta">×${n} · collect</span>`;
      row.addEventListener('mouseup', (e) => { if (e.button === 0) this.market.collect(id); });
      coll.appendChild(row);
    }
    // buy search results
    const q = document.getElementById('market-search').value.trim().toLowerCase();
    const found = document.getElementById('market-found');
    found.innerHTML = '';
    if (q.length >= 2) {
      const matches = Object.entries(ITEMS)
        .filter(([, d]) => d.name.toLowerCase().includes(q)).slice(0, 6);
      for (const [id, d] of matches) {
        const row = document.createElement('div');
        row.className = 'anvil-row';
        row.innerHTML = `<span>${d.name}</span><span class="anvil-meta">post buy offer…</span>`;
        row.addEventListener('mouseup', (e) => {
          if (e.button !== 0) return;
          this.askAmount(`Buy how many ${d.name}?`, (qty) =>
            this.askAmount(`At what price each? (fair ~${Math.round(this.market.fairPrice(id))}c)`, (price) =>
              this.market.postBuy(id, qty, price)));
        });
        found.appendChild(row);
      }
    }
  }

  /** Small inline amount prompt (the X in 1/5/10/All/X). */
  askAmount(label, cb) {
    const wrap = document.getElementById('ask-x');
    const input = document.getElementById('ask-x-input');
    document.getElementById('ask-x-label').textContent = label;
    wrap.classList.remove('hidden');
    input.value = '';
    input.focus();
    const done = (commit) => {
      wrap.classList.add('hidden');
      input.removeEventListener('keydown', onKey);
      const n = parseInt(input.value, 10);
      if (commit && Number.isFinite(n) && n > 0) cb(n);
    };
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done(true);
      if (e.key === 'Escape') done(false);
    };
    input.addEventListener('keydown', onKey);
  }

  refreshPrayers() { this.panel.renderPrayers(); }
  refreshSpellbook() { this.panel.renderSpellbook(); }

  setPrayerOrb(points, max) {
    const pct = max > 0 ? Math.round((points / max) * 100) : 0;
    this.prayerFill.style.height = pct + '%';
    this.prayerText.textContent = Math.ceil(points);
  }

  combatLevel() { return this._combatLevelFn(); }

  /** The top-centre target frame: your current foe's name, level and health.
   *  Pass the engaged mob each frame (or null); a short linger keeps the bar
   *  up through the killing blow so the empty bar reads as the payoff. */
  updateTargetBar(mob) {
    if (!this._tb) {
      this._tb = {
        el: document.getElementById('target-bar'),
        name: document.getElementById('target-name'),
        lv: document.getElementById('target-lv'),
        fill: document.getElementById('target-fill'),
        hp: document.getElementById('target-hp'),
      };
    }
    const tb = this._tb;
    if (!tb.el) return;
    const now = performance.now();
    if (mob) {
      this._tbMob = mob;
      if (!mob.dead) this._tbUntil = now + 1600; // refresh the linger while it lives
    }
    const show = mob ?? (now < (this._tbUntil ?? 0) ? this._tbMob : null);
    if (!show) {
      if (!tb.el.classList.contains('hidden')) tb.el.classList.add('hidden');
      this._tbMob = null;
      return;
    }
    const hp = Math.max(0, show.hp), max = show.maxHp || 1;
    tb.el.classList.remove('hidden');
    tb.el.classList.toggle('boss', !!show.def?.boss);
    tb.name.childNodes[0].textContent = show.def?.name ?? '???';
    const diff = (show.cl ?? 1) - this.combatLevel();
    tb.lv.textContent = `(lv ${show.cl ?? '?'})`;
    tb.lv.style.color = diff >= 4 ? '#e05a4a' : diff <= -4 ? '#7fdf5f' : '#ffe17d';
    tb.fill.style.width = Math.round((hp / max) * 100) + '%';
    tb.hp.textContent = `${hp} / ${max}`;
  }

  setHp(hp, maxHp) {
    const pct = Math.round((hp / maxHp) * 100);
    this.hpFill.style.height = pct + '%';
    this.hpText.textContent = hp;
    this.hpOrb.classList.toggle('hurt', pct <= 50 && pct > 25);
    this.hpOrb.classList.toggle('dying', pct <= 25);
  }

  levelUp(name, level) {
    this.audio?.sfx('levelup');
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

  /** A brief red edge-pulse when the player is struck; stronger for big hits. */
  hurtFlash(dmg = 1) {
    if (!this.hurtFade) return;
    this.hurtFade.style.setProperty('--peak', String(Math.min(0.7, 0.2 + dmg * 0.025)));
    this.hurtFade.classList.remove('show');
    void this.hurtFade.offsetWidth;
    this.hurtFade.classList.add('show');
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

  refreshEquipment() {
    this.panel.renderEquipment();
    this.panel.renderCombat(); // the weapon name lives there
  }

  /** Redraw every panel after a bulk state change (e.g. save-load).
   *  The three orbs are driven every frame by the render loop, so they
   *  self-correct on the next tick — only the panels need a manual redraw. */
  refreshAll() {
    this.panel.renderInventory();
    this.panel.renderEquipment();
    this.panel.renderCombat();
    this.panel.renderSkills();
    this.panel.renderJournal();
    this.panel.renderPrayers();
    this.panel.renderSpellbook();
    this.setHp(this.player.hp, this.player.maxHp);
  }

  /** Furnace: choose a bar to smelt. */
  openSmeltMenu(furnaceEntry) {
    const count = (id) => this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
    const entries = Object.entries(SMELTING)
      .filter(([id]) => id !== 'TICKS_PER_BAR' && typeof SMELTING[id] === 'object')
      .map(([barId, def]) => ({
        label: `Smelt ${ITEMS[barId].name} (lvl ${def.req})`,
        run: () => this.actions.startSmelt(furnaceEntry, barId),
        dim: !Object.entries(def.inputs).every(([id, n]) => count(id) >= n),
      }));
    this.menu.open(entries, null);
  }

  /** Furnace: jewellery casting. */
  openJewelryMenu(furnaceEntry) {
    const entries = Object.entries(JEWELRY).map(([rid, def]) => ({
      label: `Craft ${ITEMS[rid].name} (lvl ${def.req})`,
      run: () => this.actions.startJewelry(rid),
    }));
    this.menu.open(entries, null);
  }

  /** The anvil interface: bar -> the full smithable list with level gates. */
  openAnvil() {
    const count = (id) => this.player.inventory.slots.reduce(
      (a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
    const metals = Object.entries(METAL_SMITHING).filter(([, p]) => count(p.bar) > 0);
    if (!metals.length) { this.chat.add('You have no bars to work.'); return; }
    if (document.pointerLockElement) document.exitPointerLock(); // the anvil wants a cursor
    const panel = document.getElementById('anvil-panel');
    const body = document.getElementById('anvil-body');
    const lvl = this.player.skillByName('Smithing').level;
    body.innerHTML = '';
    for (const [metal, params] of metals) {
      const head = document.createElement('div');
      head.className = 'anvil-metal';
      head.textContent = `${ITEMS[params.bar].name}s: ${count(params.bar)}`;
      body.appendChild(head);
      for (const [shapeId, shape] of Object.entries(SMITHABLES)) {
        const req = params.reqBase + shape.off;
        const itemId = `${metal}_${shapeId}`;
        const row = document.createElement('div');
        const can = lvl >= req && count(params.bar) >= shape.bars;
        row.className = 'anvil-row' + (can ? '' : ' locked');
        row.innerHTML = `<span>${ITEMS[itemId].name}</span>` +
          `<span class="anvil-meta">${shape.bars} bar${shape.bars > 1 ? 's' : ''} · lvl ${req}</span>`;
        row.addEventListener('mouseup', (e) => {
          if (e.button !== 0) return;
          this.closeAnvil();
          this.actions.startSmith(metal, shapeId);
        });
        body.appendChild(row);
      }
    }
    panel.classList.remove('hidden');
    this._anvilEsc = (e) => { if (e.code === 'Escape') this.closeAnvil(); };
    window.addEventListener('keydown', this._anvilEsc);
  }

  closeAnvil() {
    document.getElementById('anvil-panel').classList.add('hidden');
    if (this._anvilEsc) { window.removeEventListener('keydown', this._anvilEsc); this._anvilEsc = null; }
  }

  /** Pick a raw food from the pack to cook on this fire/range. */
  openCookMenu(fireEntry) {
    if (fireEntry.expired) { this.chat.add('The fire has burned out.'); return; }
    const raws = new Map();
    this.player.inventory.slots.forEach((s) => {
      if (s && COOKING[s.id]) raws.set(s.id, (raws.get(s.id) ?? 0) + (s.count ?? 1));
    });
    if (!raws.size) { this.chat.add('You have nothing you could cook.'); return; }
    const entries = [...raws].map(([id, n]) => ({
      label: `Cook ${ITEMS[id].name}` + (n > 1 ? ` (x${n})` : ''),
      run: () => this.actions.startCook(fireEntry, id),
    }));
    this.menu.open(entries, null);
  }

  openItemMenu(slotIndex, e) {
    const slot = this.player.inventory.slots[slotIndex];
    if (!slot) return;
    // an armed utility spell (alch/enchant/superheat) consumes the next item click
    if (this.magic?.pendingUtility) {
      this.magic.castUtility(this.magic.pendingUtility, slotIndex);
      return;
    }
    const def = ITEMS[slot.id];
    // trading contexts take over the pack's click meaning
    if (this.marketOpen) {
      const inPack = this.player.inventory.slots.reduce(
        (a, s) => a + (s && s.id === slot.id ? (s.count ?? 1) : 0), 0);
      const fair = Math.round(this.market.fairPrice(slot.id));
      this.menu.open([
        {
          label: `Offer to sell (fair ~${fair}c)`,
          run: () => this.askAmount(`Sell how many? (you have ${inPack})`, (qty) =>
            this.askAmount('At what price each?', (price) => this.market.postSell(slot.id, qty, price))),
        },
        { label: 'Examine ' + def.name, run: () => this.chat.add(def.examine, 'examine') },
      ], { x: e.clientX, y: e.clientY }, e);
      return;
    }
    if (this.activeShop) {
      const shop = this.shops.get(this.activeShop);
      const price = this.shops.sellPrice(shop, slot.id);
      const sells = this.shops.shopBuys(shop, slot.id);
      this.menu.open([
        ...(sells ? [
          { label: `Sell 1 (${price}c)`, run: () => this.shops.sell(shop.id, slotIndex, 1) },
          { label: `Sell 5`, run: () => this.shops.sell(shop.id, slotIndex, 5) },
          { label: `Sell All`, run: () => this.shops.sell(shop.id, slotIndex, 999) },
        ] : [{ label: 'Value: not wanted here', run: () => this.chat.add('"I have no use for that," the merchant says.') }]),
        { label: 'Examine ' + def.name, run: () => this.chat.add(def.examine, 'examine') },
      ], { x: e.clientX, y: e.clientY }, e);
      return;
    }
    if (this.bankOpen) {
      const inPack = this.player.inventory.slots.reduce(
        (a, s) => a + (s && s.id === slot.id ? (s.count ?? 1) : 0), 0);
      this.menu.open([
        { label: 'Deposit 1', run: () => this.bank.deposit(slotIndex, 1) },
        { label: 'Deposit 5', run: () => this.bank.deposit(slotIndex, 5) },
        { label: 'Deposit All (' + inPack + ')', run: () => this.bank.deposit(slotIndex, inPack) },
        { label: 'Deposit X…', run: () => this.askAmount('Deposit how many?', (x) => this.bank.deposit(slotIndex, x)) },
        { label: 'Examine ' + def.name, run: () => this.chat.add(def.examine, 'examine') },
      ], { x: e.clientX, y: e.clientY }, e);
      return;
    }
    const entries = [];
    if (def.slot) entries.push({
      label: (def.slot === 'weapon' ? 'Wield ' : 'Wear ') + def.name,
      run: () => this.player.equip(slotIndex, this),
    });
    if (def.heals) entries.push({
      label: 'Eat ' + def.name,
      run: () => this.player.eat(slotIndex, this),
    });
    if (def.boost || def.restore) entries.push({
      label: 'Drink ' + def.name,
      run: () => this.player.drink(slotIndex, this),
    });
    if (FIREMAKING[slot.id]) entries.push({
      label: 'Light fire',
      run: () => this.actions.startLight(slotIndex),
    });
    if (GEMS[slot.id]) entries.push({
      label: 'Cut ' + def.name,
      run: () => this.actions.cutGem(slotIndex),
    });
    if (slot.id === STRINGING.input) entries.push({
      label: 'String ' + def.name,
      run: () => this.actions.stringAmulet(slotIndex),
    });
    if (slot.id === 'ball_of_wool') entries.push({
      label: 'Sew wool cape',
      run: () => this.actions.startCraftCape(),
    });
    if (BONES[slot.id]) entries.push({
      label: 'Bury ' + def.name,
      run: () => this.actions.buryBones(slotIndex),
    });
    // baking combines: offer "Make X" on any ingredient when the full set is held
    const count = (id) => this.player.inventory.slots.reduce((a, s) => a + (s && s.id === id ? (s.count ?? 1) : 0), 0);
    for (const [recipeId, r] of Object.entries(BAKING)) {
      if (!(slot.id in r.inputs)) continue;
      if (!Object.entries(r.inputs).every(([id, n]) => count(id) >= n)) continue;
      entries.push({
        label: 'Make ' + ITEMS[recipeId].name.toLowerCase().replace('uncooked ', ''),
        run: () => this.actions.bakeCombine(recipeId),
      });
    }
    // Herblore: herb + vial -> unfinished; unfinished + secondary -> potion
    for (const h of Object.values(HERBLORE)) {
      if (slot.id === h.herb && count('vial_of_water') >= 1)
        entries.push({ label: 'Mix into unf. potion', run: () => this.actions.mixUnfinished(h.herb) });
      if (slot.id === `${h.herb}_unf` && count(h.secondary) >= 1)
        entries.push({ label: 'Add ' + ITEMS[h.secondary].name.toLowerCase(), run: () => this.actions.mixPotion(slot.id) });
    }
    // treasure trails
    if (this.clues) {
      if (slot.id === 'clue_scroll') entries.push({ label: 'Read clue', run: () => this.clues.read() });
      if (slot.id === 'spade') entries.push({ label: 'Dig here', run: () => this.clues.dig() });
      if (slot.id === 'casket') entries.push({ label: 'Open casket', run: () => this.clues.openCasket(slotIndex) });
    }
    if (['logs', 'willow_logs', 'yew_logs'].includes(slot.id)) {
      const bows = Object.entries(FLETCHING.bows).filter(([, r]) => (r.log ?? 'logs') === slot.id);
      if (bows.length) entries.push({
        label: 'Fletch',
        run: () => {
          this.menu.open(bows.map(([bowId, r]) => ({
            label: `${ITEMS[bowId].name} (lvl ${r.req}, ${r.logs} log${r.logs > 1 ? 's' : ''})`,
            run: () => this.actions.startFletchBow(slotIndex, bowId),
          })), null);
        },
      });
    }
    if (slot.id.endsWith('_arrowtips')) entries.push({
      label: 'Fletch arrows',
      run: () => this.actions.startFletchArrows(slot.id),
    });
    if (slot.id === 'poison' || slot.id === 'fish_food') entries.push({
      label: 'Poison fish food',
      run: () => this.actions.poisonFishFood(),
    });
    if (slot.id === 'combat_lamp') entries.push({
      label: 'Rub ' + def.name,
      run: () => {
        this.menu.open(['Attack', 'Strength', 'Defence', 'Hitpoints', 'Ranged', 'Magic'].map((sk) => ({
          label: sk,
          run: () => this.actions.rubLamp(slotIndex, sk),
        })), null);
      },
    });
    if (slot.id === 'leather' || slot.id === 'dragon_leather') {
      const mine = Object.entries(LEATHER_RECIPES).filter(([, r]) => (r.hide ?? 'leather') === slot.id);
      entries.push({
        label: 'Craft ' + def.name.toLowerCase(),
        run: () => {
          this.menu.open(mine.map(([rid, r]) => ({
            label: `${ITEMS[rid].name} (lvl ${r.req})`,
            run: () => this.actions.startCraftLeather(rid),
          })), null);
        },
      });
    }
    if (PETS[slot.id]) entries.push({
      label: this.pets?.activePet === slot.id ? 'Stow pet' : 'Summon pet',
      run: () => this.pets?.toggle(slot.id, this),
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
