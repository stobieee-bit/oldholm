// OLDHOLM server — hiscores (REST) + presence/chat (WebSocket).
// Deliberately tiny: one dependency (ws), in-memory state with a best-effort
// JSON snapshot. Render's free tier has an ephemeral disk, so clients re-submit
// their own hiscore on every visit and the board self-heals after a restart.

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8439;
const FILE = './hiscores.json';
const SAVE_FILE = './saves.json';
const MAX_BOARD = 200;
const MAX_SAVES = 500;
const MAX_BLOB = 200_000; // a full snapshot is ~30-60KB

// ---- hiscores -----------------------------------------------------------------
// name -> { name, total, combat, when }
let board = new Map();
try { board = new Map(JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (_) {}
// ---- cloud saves ----------------------------------------------------------------
// nameKey -> { name, pinHash, blob, when }. Best-effort disk snapshot; the
// client always keeps its localStorage copy too — this is backup/transfer.
let saves = new Map();
try { saves = new Map(JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'))); } catch (_) {}
let dirty = false, savesDirty = false;
setInterval(() => {
  if (dirty) {
    dirty = false;
    try { fs.writeFileSync(FILE, JSON.stringify([...board.entries()])); } catch (_) {}
  }
  if (savesDirty) {
    savesDirty = false;
    try { fs.writeFileSync(SAVE_FILE, JSON.stringify([...saves.entries()])); } catch (_) {}
  }
}, 30_000);

const pinHash = (pin) => crypto.createHash('sha256').update('oldholm:' + pin).digest('hex');

function handleSave(req, res, body, url) {
  if (req.method === 'GET') {
    const name = cleanName(url.searchParams.get('name'));
    const pin = String(url.searchParams.get('pin') ?? '');
    const rec = saves.get(name.toLowerCase());
    if (!rec) { res.statusCode = 404; res.end('{"error":"no save"}'); return; }
    if (rec.pinHash !== pinHash(pin)) { res.statusCode = 403; res.end('{"error":"wrong pin"}'); return; }
    res.end(JSON.stringify({ blob: rec.blob, when: rec.when }));
    return;
  }
  if (req.method === 'POST') {
    let d;
    try { d = JSON.parse(body); } catch (_) { res.statusCode = 400; res.end('{}'); return; }
    const name = cleanName(d.name);
    const pin = String(d.pin ?? '');
    if (!name || !/^\d{4,8}$/.test(pin)) { res.statusCode = 400; res.end('{"error":"name + 4-8 digit pin required"}'); return; }
    if (typeof d.blob !== 'string' || d.blob.length > MAX_BLOB) { res.statusCode = 400; res.end('{"error":"blob too large"}'); return; }
    const key = name.toLowerCase();
    const prev = saves.get(key);
    if (prev && prev.pinHash !== pinHash(pin)) { res.statusCode = 403; res.end('{"error":"wrong pin"}'); return; }
    saves.set(key, { name, pinHash: pinHash(pin), blob: d.blob, when: Date.now() });
    if (saves.size > MAX_SAVES) { // evict the stalest
      const oldest = [...saves.entries()].sort((a, b) => a[1].when - b[1].when)[0];
      saves.delete(oldest[0]);
    }
    savesDirty = true;
    res.end(JSON.stringify({ ok: true, when: Date.now() }));
  }
}

const cleanName = (s) => String(s ?? '').replace(/[^\w \-']/g, '').trim().slice(0, 16);
const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(n) || 0)));

function topList() {
  return [...board.values()]
    .sort((a, b) => b.total - a.total || b.combat - a.combat)
    .slice(0, 50);
}

function handleHiscores(req, res, body) {
  if (req.method === 'GET') {
    res.end(JSON.stringify({ top: topList(), count: board.size }));
    return;
  }
  if (req.method === 'POST') {
    let d;
    try { d = JSON.parse(body); } catch (_) { res.statusCode = 400; res.end('{}'); return; }
    const name = cleanName(d.name);
    if (!name) { res.statusCode = 400; res.end('{}'); return; }
    const total = clampInt(d.total, 16, 99 * 24); // headroom above the current skill count
    const combat = clampInt(d.combat, 1, 126);
    const prev = board.get(name.toLowerCase());
    if (!prev || total >= prev.total) {
      board.set(name.toLowerCase(), { name, total, combat, when: Date.now() });
      // keep the board bounded: drop the weakest entries past the cap
      if (board.size > MAX_BOARD) {
        const sorted = [...board.entries()].sort((a, b) => b[1].total - a[1].total);
        board = new Map(sorted.slice(0, MAX_BOARD));
      }
      dirty = true;
    }
    res.end(JSON.stringify({ ok: true, count: board.size }));
  }
}

// ---- HTTP ----------------------------------------------------------------------
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // the game is a static site elsewhere
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end(); return; }
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > MAX_BLOB + 4096) req.destroy(); });
  req.on('end', () => {
    const url = new URL(req.url ?? '/', 'http://x');
    const path = url.pathname;
    if (path === '/hiscores') return handleHiscores(req, res, body);
    if (path === '/save') return handleSave(req, res, body, url);
    if (path === '/health') { res.end(JSON.stringify({ ok: true, online: wss.clients.size, saves: saves.size })); return; }
    res.statusCode = 404;
    res.end('{}');
  });
});

// ---- presence + chat (WebSocket) ------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });
let nextId = 1;

wss.on('connection', (sock) => {
  sock.id = nextId++;
  sock.player = null; // { name, x, z, plane }
  sock.lastChat = 0;

  sock.on('message', (raw) => {
    if (raw.length > 512) return;
    let m;
    try { m = JSON.parse(raw); } catch (_) { return; }
    if (m.t === 'join') {
      sock.player = { name: cleanName(m.name) || 'Wanderer', x: 0, z: 0, plane: 0 };
      broadcast({ t: 'chat', name: '', msg: `${sock.player.name} wanders in. (${countPlayers()} online)` });
    } else if (m.t === 'pos' && sock.player) {
      sock.player.x = clampInt(m.x * 10, 0, 3840) / 10; // one decimal, in-bounds
      sock.player.z = clampInt(m.z * 10, 0, 3840) / 10;
      sock.player.plane = typeof m.plane === 'number' ? m.plane : m.plane ? 1 : 0;
    } else if (m.t === 'chat' && sock.player) {
      const now = Date.now();
      if (now - sock.lastChat < 1500) return; // rate limit
      sock.lastChat = now;
      const msg = String(m.msg ?? '').slice(0, 120).trim();
      if (msg) broadcast({ t: 'chat', name: sock.player.name, msg });
    }
  });

  sock.on('close', () => {
    if (sock.player) broadcast({ t: 'chat', name: '', msg: `${sock.player.name} fades away.` });
  });
});

function countPlayers() { return [...wss.clients].filter((c) => c.player).length; }

function broadcast(obj) {
  const s = JSON.stringify(obj);
  for (const c of wss.clients) if (c.readyState === 1) c.send(s);
}

// position snapshots ~3x/sec: each client gets everyone EXCEPT themselves
setInterval(() => {
  for (const c of wss.clients) {
    if (c.readyState !== 1) continue;
    const others = [];
    for (const o of wss.clients)
      if (o !== c && o.player) others.push({ id: o.id, ...o.player });
    c.send(JSON.stringify({ t: 'players', list: others }));
  }
}, 350);

server.listen(PORT, () => console.log(`OLDHOLM server on :${PORT}`));
