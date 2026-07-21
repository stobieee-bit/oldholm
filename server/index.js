// OLDHOLM server — hiscores (REST) + presence/chat (WebSocket).
// Deliberately tiny: one dependency (ws), in-memory state with a best-effort
// JSON snapshot. Render's free tier has an ephemeral disk, so clients re-submit
// their own hiscore on every visit and the board self-heals after a restart.

import http from 'node:http';
import fs from 'node:fs';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8439;
const FILE = './hiscores.json';
const MAX_BOARD = 200;

// ---- hiscores -----------------------------------------------------------------
// name -> { name, total, combat, when }
let board = new Map();
try { board = new Map(JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (_) {}
let dirty = false;
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  try { fs.writeFileSync(FILE, JSON.stringify([...board.entries()])); } catch (_) {}
}, 30_000);

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
    const total = clampInt(d.total, 16, 99 * 16); // 16 skills, level 1-99 each
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
  req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
  req.on('end', () => {
    const path = (req.url ?? '/').split('?')[0];
    if (path === '/hiscores') return handleHiscores(req, res, body);
    if (path === '/health') { res.end(JSON.stringify({ ok: true, online: wss.clients.size })); return; }
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
