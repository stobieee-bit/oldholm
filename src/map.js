// OLDHOLM — map.js
// The world map: a fullscreen overlay drawn from the minimap's baked terrain
// with town labels, bank marks and the player arrow. M (or clicking the
// minimap) opens it; M / Escape / ✕ closes. Movement freezes while it's open.

import { isBound } from './keybinds.js';
import { HOUSE_PLOT } from '../data/house.js';
import { STALLS } from '../data/thieving.js';

const LABELS = [
  { x: 56, z: 88, t: 'Holmbridge' },
  { x: 296, z: 127, t: 'Corvath' },
  { x: 288, z: 42, t: 'Whitehold' },
  { x: 56, z: 32, t: 'Skalvik' },
  { x: 194, z: 26, t: 'Brinkton' },
  { x: 102, z: 215, t: 'Murkwell' },
  { x: 288, z: 272, t: 'Sunmarch' },
  { x: 182, z: 315, t: 'Gullwick' },
  { x: 308, z: 351, t: 'Ashkara' },
  { x: 357, z: 132, t: 'THE BLIGHT', dim: true },
];

export class WorldMap {
  constructor(player, world, minimap, ui) {
    this.player = player;
    this.world = world;
    this.minimap = minimap;
    this.ui = ui;
    this.open = false;
    this.el = document.getElementById('worldmap');
    this.canvas = document.getElementById('worldmap-canvas');
    document.getElementById('worldmap-close')?.addEventListener('click', () => this.hide());
    this.el?.addEventListener('mousedown', (e) => { if (e.target === this.el) this.hide(); });
    window.addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '')) return;
      if (isBound('map', e.code) && this.player.inputEnabled && !this.ui.menu.isOpen) {
        e.preventDefault();
        this.open ? this.hide() : this.show();
      } else if (e.code === 'Escape' && this.open) this.hide();
    });
    document.getElementById('minimap')?.addEventListener('mousedown', () => {
      if (this.player.inputEnabled) this.show();
    });
    // click the map to plant (or clear) a personal flag marker
    this.canvas?.addEventListener('mousedown', (e) => {
      const r = this.canvas.getBoundingClientRect();
      const wx = ((e.clientX - r.left) / r.width) * this.world.size;
      const wz = ((e.clientY - r.top) / r.height) * this.world.size;
      const f = this.player.mapFlag;
      if (f && Math.hypot(f.x - wx, f.z - wz) < 8) this.player.mapFlag = null; // click it away
      else this.player.mapFlag = { x: wx, z: wz };
      this._draw();
    });
  }

  show() {
    if (this.open || !this.el) return;
    this.open = true;
    this.player.menuOpen = true; // freeze walk + look under the overlay
    this.player.clearKeys();
    if (document.pointerLockElement) document.exitPointerLock();
    this.el.classList.remove('hidden');
    this._draw();
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.player.menuOpen = false;
    this.el.classList.add('hidden');
  }

  _draw() {
    const baked = this.minimap.baked;
    if (!baked) return;
    const S = 768; // draw resolution; CSS scales it responsively
    this.canvas.width = S; this.canvas.height = S;
    const ctx = this.canvas.getContext('2d');
    const k = S / this.world.size; // tiles -> px
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(baked, 0, 0, S, S);
    // parchment vignette
    const grd = ctx.createRadialGradient(S / 2, S / 2, S * 0.4, S / 2, S / 2, S * 0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(12,10,6,0.55)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, S, S);

    // points of interest
    ctx.textAlign = 'center';
    const mark = (x, z, glyph, color, size = 12) => {
      ctx.font = `bold ${size}px serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(glyph, x * k + 1, z * k + 5);
      ctx.fillStyle = color;
      ctx.fillText(glyph, x * k, z * k + 4);
    };
    for (const b of this.minimap.banks) mark(b.x, b.z, '$', '#e0b83a', 13);
    const d = this.world.def;
    if (d.galeAltar) mark(d.galeAltar.x, d.galeAltar.z, '✦', '#bfe0ec');
    for (const a of d.glyphAltars ?? []) mark(a.x, a.z, '✦', '#bfe0ec');
    for (const f of d.farmPatches ?? []) mark(f.x, f.z, '❀', '#7fdf5f');
    for (const s of d.shortcuts ?? []) { mark(s.ax, s.az, '⇄', '#ffe17d', 11); mark(s.bx, s.bz, '⇄', '#ffe17d', 11); }
    if (d.undervault) mark(d.undervault.entrance.x, d.undervault.entrance.z, '▼', '#9a6ad8', 13);
    for (const n of d.npcs ?? []) if (n.npc === 'slayer_master') mark(n.x, n.z, '☠', '#e8e4da', 11);
    mark((HOUSE_PLOT.x0 + HOUSE_PLOT.x1) / 2, (HOUSE_PLOT.z0 + HOUSE_PLOT.z1) / 2, '⌂', '#e8c87a', 14);
    for (const s of STALLS) mark(s.x, s.z, '☘', '#d8b25f', 11);
    if (d.tanningRack) mark(d.tanningRack.x, d.tanningRack.z, '◫', '#c98f5f', 11);
    // fellow wanderers (white), your flag (gold), your grave (red skull)
    for (const g of this.ui.online?.ghosts?.values?.() ?? []) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(g.group.position.x * k, g.group.position.z * k, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (this.player.mapFlag) mark(this.player.mapFlag.x, this.player.mapFlag.z, '⚑', '#ffe15a', 16);
    if (this.player.deathSpot) mark(this.player.deathSpot.x, this.player.deathSpot.z, '☠', '#e05a4a', 15);
    // town labels with a soft shadow
    for (const l of LABELS) {
      ctx.font = l.dim ? 'bold 13px serif' : 'bold 15px serif';
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillText(l.t, l.x * k + 1, l.z * k + 1);
      ctx.fillStyle = l.dim ? '#b0705a' : '#ffe17d';
      ctx.fillText(l.t, l.x * k, l.z * k);
    }
    // the player arrow (surface position even when in a dungeon)
    const px = this.player.pos.x * k, pz = this.player.pos.z * k;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-this.player.yaw);
    ctx.fillStyle = '#ffe15a';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(-6, 7); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
  }
}
