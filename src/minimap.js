// OLDHOLM — minimap.js
// A top-down minimap (spec §12): a once-baked terrain image + live blips —
// yellow you, white NPCs, red mobs fighting you, gold $ banks — with a
// compass N. Rendered to a small 2D canvas each frame (cheap).

const VIEW_TILES = 68;  // tiles across the minimap window
const MAP_PX = 148;     // minimap size in CSS pixels

export class Minimap {
  constructor(world, player, npcs) {
    this.world = world;
    this.player = player;
    this.npcs = npcs;
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = MAP_PX; this.canvas.height = MAP_PX;
    this.compass = document.getElementById('minimap-n');
    this.label = document.getElementById('minimap-label');
    this._bake();
    // static blip anchors: banks (gold $) and altars
    this.banks = world.interactables.filter((e) => e.kind === 'bank')
      .map((e) => this._entTile(e)).filter(Boolean);
    this._lastRegion = null;
  }

  _entTile(e) {
    const m = e.meshes[0];
    if (!m) return null;
    const p = m.getWorldPosition ? m.getWorldPosition(new (this.player.pos.constructor)()) : m.position;
    return { x: p.x, z: p.z };
  }

  /** Bake the whole surface into a 1px/tile offscreen canvas, once. */
  _bake() {
    const w = this.world, size = w.size;
    const off = document.createElement('canvas');
    off.width = size; off.height = size;
    const octx = off.getContext('2d');
    const img = octx.createImageData(size, size);
    const col = [0, 0, 0];
    for (let tz = 0; tz < size; tz++) {
      for (let tx = 0; tx < size; tx++) {
        const h00 = w.cornerHeight(tx, tz), h10 = w.cornerHeight(tx + 1, tz);
        const h01 = w.cornerHeight(tx, tz + 1), h11 = w.cornerHeight(tx + 1, tz + 1);
        w._tileColor(tx, tz, (h00 + h10 + h01 + h11) / 4, col);
        const i = (tz * size + tx) * 4;
        img.data[i] = Math.min(255, col[0] * 255);
        img.data[i + 1] = Math.min(255, col[1] * 255);
        img.data[i + 2] = Math.min(255, col[2] * 255);
        img.data[i + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    this.baked = off;
  }

  update() {
    const ctx = this.ctx, p = this.player;
    const px = p.pos.x, pz = p.pos.z;
    ctx.clearRect(0, 0, MAP_PX, MAP_PX);
    const scale = MAP_PX / VIEW_TILES;
    const half = VIEW_TILES / 2;

    if (p.plane === 0) {
      // draw the baked surface window centred on the player
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.baked, px - half, pz - half, VIEW_TILES, VIEW_TILES, 0, 0, MAP_PX, MAP_PX);
    } else {
      ctx.fillStyle = '#1a1712';
      ctx.fillRect(0, 0, MAP_PX, MAP_PX);
    }

    const toMap = (x, z) => [(x - px + half) * scale, (z - pz + half) * scale];
    const dot = (x, z, color, r) => {
      const [mx, mz] = toMap(x, z);
      if (mx < 0 || mx > MAP_PX || mz < 0 || mz > MAP_PX) return;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(mx, mz, r, 0, Math.PI * 2); ctx.fill();
    };

    // banks ($ gold) — surface only
    if (p.plane === 0) for (const b of this.banks) { const [mx, mz] = toMap(b.x, b.z);
      if (mx >= 0 && mx <= MAP_PX && mz >= 0 && mz <= MAP_PX) { ctx.fillStyle = '#e0b83a'; ctx.font = 'bold 11px serif'; ctx.textAlign = 'center'; ctx.fillText('$', mx, mz + 4); } }

    // entities: NPCs white, mobs fighting red, other mobs faint
    for (const m of this.npcs.mobs) {
      if (m.dead || m.hiddenNpc || (m.plane ?? 0) !== p.plane) continue;
      const v = m.visualPos();
      if (m.def.talk || m.def.attackable === false) dot(v.x, v.z, '#e8e4da', 2);
      else if (m.target === 'player' || this.player.target === m) dot(v.x, v.z, '#e04030', 2.4);
      else dot(v.x, v.z, 'rgba(200,90,80,0.55)', 1.8);
    }

    // the player, always centred, with a facing wedge
    const cx = MAP_PX / 2, cz = MAP_PX / 2;
    ctx.save();
    ctx.translate(cx, cz);
    ctx.rotate(-p.yaw); // forward = (-sin yaw,-cos yaw); on the map that direction is exactly -yaw
    ctx.fillStyle = '#ffe15a';
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(3.5, 4); ctx.lineTo(-3.5, 4); ctx.closePath(); ctx.fill();
    ctx.restore();

    // region label on entry
    const region = this.world.regionAt(px, pz, p.plane);
    if (region.name && this.label.textContent !== region.name) this.label.textContent = region.name;
  }
}
