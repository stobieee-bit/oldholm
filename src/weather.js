// OLDHOLM — weather.js
// Weather and the night shift, with real gameplay teeth:
//   rain  — a particle downpour; new fires won't light, lit fires die twice
//           as fast, and crops drink it up (grow ~1.5x while it pours).
//   night — night-only creatures (spawn entries with night: true) walk the
//           roads from 20:00 to 05:00 and vanish with the dawn.
// Weather rolls on a tick cadence so it survives save/load implicitly
// (re-rolls after load; only the current sky changes, nothing persistent).

import * as THREE from 'three';

const RAIN_CHECK_EVERY = 200;   // ticks between weather rolls (~2 min)
const RAIN_CHANCE = 0.25;       // chance a roll starts rain
const RAIN_TICKS = [250, 700];  // rain duration range
const DROPS = 900;

export class Weather {
  constructor(scene, camera, world, npcs, farming, ui, audio, clock) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.npcs = npcs;
    this.farming = farming;
    this.ui = ui;
    this.audio = audio;
    this.clock = clock;
    this.raining = false;
    this._rainUntil = 0;
    this._night = null; // unknown until the first tick
    this._buildRain();
  }

  _buildRain() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(DROPS * 3);
    for (let i = 0; i < DROPS; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = Math.random() * 26;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0xaac4e0, size: 0.14, transparent: true, opacity: 0.55,
      depthWrite: false, sizeAttenuation: true,
    }));
    this.rain.visible = false;
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
  }

  isNight() {
    const m = this.clock.gameMinutes;
    return m >= 20 * 60 || m < 5 * 60;
  }

  /** Game-tick cadence: weather rolls, fire dampening, crop watering, night shift. */
  tick(tickNo) {
    // weather state machine
    if (this.raining && tickNo >= this._rainUntil) {
      this.raining = false;
      this.rain.visible = false;
      this.audio?.setRain(false);
      this.ui.chat.add('The rain eases off. The realm drips quietly.', 'system');
    } else if (!this.raining && tickNo % RAIN_CHECK_EVERY === 0 && Math.random() < RAIN_CHANCE) {
      this.raining = true;
      this._rainUntil = tickNo + RAIN_TICKS[0] + Math.floor(Math.random() * (RAIN_TICKS[1] - RAIN_TICKS[0]));
      this.rain.visible = true;
      this.audio?.setRain(true);
      this.ui.chat.add('Rain sweeps in across the realm. Fires will not thank you for it.', 'system');
    }

    if (this.raining) {
      // fires gutter: age them one extra tick, so they burn out ~2x faster
      for (const f of this.world._fires ?? []) f.expireAt--;
      // crops drink: pull the planting tick back every other tick (~1.5x growth)
      if (tickNo % 2 === 0 && this.farming) {
        for (const st of Object.values(this.farming.state)) st.plantedTick--;
      }
    }

    // the night shift walks
    const night = this.isNight();
    if (night !== this._night) {
      this._night = night;
      let stirred = 0;
      for (const m of this.npcs.mobs) {
        if (!m.nightOnly) continue;
        if (night) { if (!m.dead) { m.hiddenNpc = false; m.mesh.visible = true; m.entry.hidden = false; stirred++; } }
        else { m.hiddenNpc = true; m.mesh.visible = false; m.entry.hidden = true; m.target = null; }
      }
      if (night && stirred) this.ui.chat.add('Night falls. Something pale keeps pace along the roads…', 'system');
      if (!night) this.ui.chat.add('Dawn. Whatever walked the night roads is gone.', 'system');
    }
    // a freshly-respawned night mob during daylight goes straight back to bed
    if (!night) {
      for (const m of this.npcs.mobs)
        if (m.nightOnly && !m.dead && !m.hiddenNpc) { m.hiddenNpc = true; m.mesh.visible = false; m.entry.hidden = true; }
    }
  }

  /** Per-frame: drops fall and the curtain follows the camera. */
  update(dt) {
    if (!this.rain.visible) return;
    this.rain.position.copy(this.camera.position);
    const pos = this.rain.geometry.getAttribute('position');
    for (let i = 0; i < DROPS; i++) {
      let y = pos.getY(i) - 26 * dt;
      if (y < -2) y += 26;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }
}
