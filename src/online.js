// OLDHOLM — online.js
// Optional online services: hiscores (REST) + player presence & chat (WS).
// Fully graceful when the server is missing — every path times out quietly
// and the game stays single-player. Server URL: localStorage 'oldholm_server'
// override, else localhost:8439 in dev, else the Render default.

import * as THREE from 'three';

const DEFAULT_SERVER = 'https://oldholm-server.onrender.com';

export class Online {
  constructor(player, ui, world) {
    this.player = player;
    this.ui = ui;
    this.world = world;
    this.sock = null;
    this.connected = false;
    this.ghosts = new Map(); // id -> { group, tx, tz, plane }
    this._posAcc = 0;
  }

  base() {
    try {
      const o = localStorage.getItem('oldholm_server');
      if (o) return o.replace(/\/$/, '');
    } catch (_) {}
    if (/^(localhost|127\.)/.test(location.hostname)) return 'http://localhost:8439';
    return DEFAULT_SERVER;
  }

  name() {
    try { return localStorage.getItem('oldholm_name') ?? ''; } catch (_) { return ''; }
  }
  setName(n) {
    try { localStorage.setItem('oldholm_name', String(n).slice(0, 16)); } catch (_) {}
  }

  // ---- hiscores -----------------------------------------------------------------

  totals() {
    const total = this.player.skills.reduce((a, s) => a + s.level, 0);
    const s = (n) => this.player.skillByName(n).level;
    const combat = Math.floor(0.25 * (s('Defence') + s('Hitpoints') + Math.floor(s('Prayer') / 2))
      + Math.max(0.325 * (s('Attack') + s('Strength')),
        0.325 * Math.floor(1.5 * s('Ranged')), 0.325 * Math.floor(1.5 * s('Magic'))));
    return { total, combat };
  }

  async submitHiscore() {
    const name = this.name();
    if (!name) return false;
    try {
      const { total, combat } = this.totals();
      await fetch(this.base() + '/hiscores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, total, combat }),
        signal: AbortSignal.timeout(4000),
      });
      return true;
    } catch (_) { return false; }
  }

  async fetchHiscores() {
    try {
      const r = await fetch(this.base() + '/hiscores', { signal: AbortSignal.timeout(4000) });
      return await r.json(); // { top: [...], count }
    } catch (_) { return null; }
  }

  // ---- cloud saves (backup/transfer; localStorage stays the primary copy) ---------

  pin() { try { return localStorage.getItem('oldholm_pin') ?? ''; } catch (_) { return ''; } }
  setPin(p) { try { localStorage.setItem('oldholm_pin', String(p).replace(/\D/g, '').slice(0, 8)); } catch (_) {} }

  async saveToCloud() {
    const save = this.ui.save;
    if (!save) return { ok: false, msg: 'Saving is not ready yet.' };
    if (!this.name()) return { ok: false, msg: 'Set your wanderer name first.' };
    if (!/^\d{4,8}$/.test(this.pin())) return { ok: false, msg: 'Set a 4–8 digit PIN first.' };
    try {
      const blob = JSON.stringify(save.snapshot());
      const r = await fetch(this.base() + '/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.name(), pin: this.pin(), blob }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.status === 403) return { ok: false, msg: 'Wrong PIN for that name.' };
      if (!r.ok) return { ok: false, msg: 'The cloud declined the save.' };
      return { ok: true, msg: 'Progress backed up to the cloud.' };
    } catch (_) { return { ok: false, msg: 'The realm link is quiet (server offline).' }; }
  }

  async loadFromCloud() {
    const save = this.ui.save;
    if (!save) return { ok: false, msg: 'Saving is not ready yet.' };
    if (!this.name() || !this.pin()) return { ok: false, msg: 'Set your name and PIN first.' };
    try {
      const r = await fetch(this.base() + `/save?name=${encodeURIComponent(this.name())}&pin=${encodeURIComponent(this.pin())}`,
        { signal: AbortSignal.timeout(8000) });
      if (r.status === 404) return { ok: false, msg: 'No cloud save under that name.' };
      if (r.status === 403) return { ok: false, msg: 'Wrong PIN for that name.' };
      if (!r.ok) return { ok: false, msg: 'The cloud declined.' };
      const { blob } = await r.json();
      const data = JSON.parse(blob);
      if (!save.apply(data)) return { ok: false, msg: 'That cloud save failed validation.' };
      return { ok: true, msg: 'Cloud save restored. Welcome back.' };
    } catch (_) { return { ok: false, msg: 'The realm link is quiet (server offline).' }; }
  }

  // ---- presence + chat ------------------------------------------------------------

  connect() {
    if (this.sock || !this.name()) return;
    let url;
    try { url = this.base().replace(/^http/, 'ws') + '/ws'; } catch (_) { return; }
    try { this.sock = new WebSocket(url); } catch (_) { this.sock = null; return; }
    this.sock.onopen = () => {
      this.connected = true;
      this.sock.send(JSON.stringify({ t: 'join', name: this.name() }));
      this.ui.chat.add('You feel the presence of other wanderers.', 'system');
    };
    this.sock.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch (_) { return; }
      if (m.t === 'players') this._sync(m.list);
      else if (m.t === 'chat') this.ui.chat.add(m.name ? `[${m.name}] ${m.msg}` : m.msg, m.name ? undefined : 'system');
    };
    const drop = () => { this.connected = false; this.sock = null; this._sync([]); };
    this.sock.onclose = drop;
    this.sock.onerror = drop;
  }

  sendChat(msg) {
    if (this.sock && this.connected) this.sock.send(JSON.stringify({ t: 'chat', msg }));
    else this.ui.chat.add('No other wanderers can hear you — the realm link is quiet.', 'system');
  }

  /** Called each game tick: throttled position beacon (~every 0.6s is fine). */
  tick() {
    if (!this.sock || !this.connected) return;
    const p = this.player;
    this.sock.send(JSON.stringify({ t: 'pos', x: +p.pos.x.toFixed(1), z: +p.pos.z.toFixed(1), plane: typeof p.plane === 'number' ? p.plane : 1 }));
  }

  /** Per-frame ghost easing toward their latest reported spot. */
  update(dt) {
    for (const g of this.ghosts.values()) {
      const pos = g.group.position;
      const k = Math.min(1, dt * 6);
      pos.x += (g.tx - pos.x) * k;
      pos.z += (g.tz - pos.z) * k;
      pos.y = this.world.getGroundHeight(pos.x, pos.z, g.plane ?? 0);
      g.group.visible = g.plane === (typeof this.player.plane === 'number' ? this.player.plane : 1);
    }
  }

  _sync(list) {
    const seen = new Set();
    for (const p of list) {
      seen.add(p.id);
      let g = this.ghosts.get(p.id);
      if (!g) {
        g = { group: this._makeGhost(p.name), tx: p.x, tz: p.z, plane: p.plane };
        g.group.position.set(p.x, this.world.getGroundHeight(p.x, p.z, p.plane ?? 0), p.z);
        this.world.group.add(g.group);
        this.ghosts.set(p.id, g);
      }
      g.tx = p.x; g.tz = p.z; g.plane = p.plane;
    }
    for (const [id, g] of this.ghosts) {
      if (!seen.has(id)) { this.world.group.remove(g.group); this.ghosts.delete(id); }
    }
  }

  _makeGhost(name) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xc9a232, transparent: true, opacity: 0.5, flatShading: true });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 0.26), mat);
    body.position.y = 0.85;
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), mat);
    head.position.y = 1.44;
    group.add(body, head);
    if (name) { // a floating name label so wanderers are people, not furniture
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g2 = c.getContext('2d');
      g2.font = 'bold 30px serif';
      g2.textAlign = 'center';
      g2.fillStyle = 'rgba(0,0,0,0.75)';
      g2.fillText(name, 129, 41);
      g2.fillStyle = '#ffe17d';
      g2.fillText(name, 128, 40);
      const tex = new THREE.CanvasTexture(c);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      label.scale.set(1.9, 0.48, 1);
      label.position.y = 1.95;
      group.add(label);
    }
    return group;
  }
}
