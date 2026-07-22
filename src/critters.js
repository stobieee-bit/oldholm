// OLDHOLM — critters.js
// Ambient, non-interactive life: butterflies over the meadows by day,
// fireflies in the swamp after dusk, sparrows that scatter when you rush
// them, rats skittering the sewer ring. Pure decoration — no interactables,
// no collision, no save state. Updates are skipped beyond earshot.

import * as THREE from 'three';

const ACTIVE_RANGE = 50; // beyond this, a critter neither moves nor renders

export class Critters {
  constructor(world, weather) {
    this.world = world;
    this.weather = weather;
    this.list = [];
    this._build();
  }

  _rng(i, s) { return Math.abs(Math.sin(i * 127.1 + s * 311.7)) % 1; }

  _add(kind, mesh, anchor, plane, data) {
    mesh.matrixAutoUpdate = true;
    mesh.position.set(anchor.x, this.world.getGroundHeight(anchor.x, anchor.z, plane) + 0.05, anchor.z);
    this.world.group.add(mesh);
    this.list.push({ kind, mesh, ax: anchor.x, az: anchor.z, plane, t: Math.random() * 20, ...data });
  }

  _build() {
    const d = this.world.def;
    // ---- butterflies: meadows, gardens, and every farm patch --------------
    const meadow = [
      { x: 85, z: 100 }, { x: 100, z: 78 }, { x: 118, z: 96 }, { x: 150, z: 95 },
      { x: 226, z: 72 }, { x: 194, z: 44 }, { x: 292, z: 120 },
      ...(d.farmPatches ?? []).map((f) => ({ x: f.x, z: f.z })),
    ];
    const wingMat = [0xe8c85a, 0xe8e2d0, 0xc23a3a, 0x7ac8d8];
    meadow.forEach((a, i) => {
      for (let k = 0; k < 2; k++) {
        const mat = new THREE.MeshBasicMaterial({
          color: wingMat[(i + k) % wingMat.length], side: THREE.DoubleSide,
          transparent: true, opacity: 0.95, depthWrite: false,
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), mat);
        this._add('butterfly', mesh, a, 0, {
          pa: 0.5 + this._rng(i, k) * 0.5, pb: 0.7 + this._rng(k, i) * 0.5,
          r: 1.4 + this._rng(i * 3, k) * 1.2,
        });
      }
    });
    // ---- fireflies: the swamp road and Murkwell's fringes, night only -----
    const bogs = [{ x: 90, z: 190 }, { x: 100, z: 212 }, { x: 80, z: 172 }, { x: 96, z: 224 }];
    bogs.forEach((a, i) => {
      for (let k = 0; k < 5; k++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xd8e86a, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), mat);
        this._add('firefly', mesh, a, 0, {
          pa: 0.3 + this._rng(i, k), pb: 0.4 + this._rng(k, i * 2), r: 2.5 + this._rng(i + k, 7) * 2,
        });
      }
    });
    // ---- sparrows: town squares; they scatter when rushed -----------------
    const squares = [{ x: 80, z: 96 }, { x: 288, z: 50 }, { x: 194, z: 30 }, { x: 292, z: 126 }];
    const brown = new THREE.MeshLambertMaterial({ color: 0x6e4f33, flatShading: true });
    const dark = new THREE.MeshLambertMaterial({ color: 0x4a3520, flatShading: true });
    squares.forEach((a, i) => {
      for (let k = 0; k < 2; k++) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.13), brown);
        body.position.y = 0.05;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), dark);
        head.position.set(0, 0.1, -0.07);
        g.add(body, head);
        this._add('sparrow', g, { x: a.x + k * 1.5, z: a.z + k }, 0, {
          hx: a.x + k * 1.5, hz: a.z + k, state: 'idle', st: 0, fled: 0,
        });
      }
    });
    // ---- rats: the sewer ring, plane-gated ---------------------------------
    if (d.sewers && this.world.sewersPlane !== undefined) {
      const s = d.sewers;
      const spots = [
        { x: s.x0 + 3, z: s.z0 + 3 }, { x: s.x1 - 3, z: s.z0 + 3 },
        { x: s.x0 + 3, z: s.z1 - 3 }, { x: s.x1 - 3, z: s.z1 - 3 },
      ];
      const grey = new THREE.MeshLambertMaterial({ color: 0x3a3632, flatShading: true });
      spots.forEach((a, i) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), grey);
        this._add('rat', mesh, a, this.world.sewersPlane, {
          fx: a.x, fz: a.z, tx: a.x, tz: a.z, state: 'pause', st: this._rng(i, 3) * 2,
        });
      });
    }
  }

  update(dt, playerPos, playerPlane) {
    const night = this.weather?.isNight?.() ?? false;
    for (const c of this.list) {
      const far = Math.hypot(c.ax - playerPos.x, c.az - playerPos.z) > ACTIVE_RANGE
        || (c.plane ?? 0) !== (typeof playerPlane === 'number' ? playerPlane : 0);
      if (far) { c.mesh.visible = false; continue; }
      c.t += dt;
      if (c.kind === 'butterfly') {
        c.mesh.visible = !night;
        if (night) continue;
        const x = c.ax + Math.sin(c.t * c.pa) * c.r;
        const z = c.az + Math.sin(c.t * c.pb + 1.3) * c.r;
        const y = this.world.getGroundHeight(x, z, 0) + 0.7 + Math.sin(c.t * 2.1) * 0.25;
        c.mesh.position.set(x, y, z);
        c.mesh.rotation.set(0, Math.atan2(Math.cos(c.t * c.pa), Math.cos(c.t * c.pb + 1.3)), Math.sin(c.t * 16) * 0.9);
      } else if (c.kind === 'firefly') {
        c.mesh.visible = night;
        if (!night) continue;
        const x = c.ax + Math.sin(c.t * c.pa) * c.r;
        const z = c.az + Math.sin(c.t * c.pb + 2.1) * c.r;
        const y = this.world.getGroundHeight(x, z, 0) + 0.5 + Math.sin(c.t * 0.9) * 0.35;
        c.mesh.position.set(x, y, z);
        c.mesh.material.opacity = 0.35 + 0.65 * Math.abs(Math.sin(c.t * 1.7));
      } else if (c.kind === 'sparrow') {
        c.mesh.visible = !night && c.state !== 'gone';
        if (night) continue;
        const near = Math.hypot(c.mesh.position.x - playerPos.x, c.mesh.position.z - playerPos.z) < 2.6;
        if (c.state !== 'flee' && c.state !== 'gone' && near) { c.state = 'flee'; c.st = 0; }
        c.st += dt;
        if (c.state === 'idle') {
          c.mesh.position.y = this.world.getGroundHeight(c.mesh.position.x, c.mesh.position.z, 0)
            + Math.max(0, Math.sin(c.st * 9)) * 0.03; // pecking hop
          if (c.st > 2 + this._rng(c.ax, c.st | 0) * 3) {
            c.state = 'hop'; c.st = 0;
            const a = Math.random() * Math.PI * 2;
            c.tx = Math.min(Math.max(c.hx + Math.cos(a) * 1.2, c.hx - 3), c.hx + 3);
            c.tz = Math.min(Math.max(c.hz + Math.sin(a) * 1.2, c.hz - 3), c.hz + 3);
            c.fx = c.mesh.position.x; c.fz = c.mesh.position.z;
          }
        } else if (c.state === 'hop') {
          const k = Math.min(1, c.st / 0.5);
          const x = c.fx + (c.tx - c.fx) * k, z = c.fz + (c.tz - c.fz) * k;
          c.mesh.position.set(x, this.world.getGroundHeight(x, z, 0) + Math.sin(k * Math.PI) * 0.35, z);
          c.mesh.rotation.y = Math.atan2(c.tx - c.fx, c.tz - c.fz) + Math.PI;
          if (k >= 1) { c.state = 'idle'; c.st = 0; }
        } else if (c.state === 'flee') {
          c.mesh.position.y += dt * 5; // up and away
          c.mesh.position.x += Math.sin(c.t) * dt * 2;
          if (c.st > 1.2) { c.state = 'gone'; c.st = 0; }
        } else if (c.state === 'gone' && c.st > 12) {
          c.state = 'idle'; c.st = 0;
          c.mesh.position.set(c.hx, this.world.getGroundHeight(c.hx, c.hz, 0), c.hz);
        }
      } else if (c.kind === 'rat') {
        c.mesh.visible = true;
        c.st += dt;
        if (c.state === 'pause' && c.st > 1 + this._rng(c.ax, c.t | 0) * 2.5) {
          c.state = 'dash'; c.st = 0;
          c.fx = c.mesh.position.x || c.ax; c.fz = c.mesh.position.z || c.az;
          const a = Math.random() * Math.PI * 2;
          c.tx = c.ax + Math.cos(a) * 2.2;
          c.tz = c.az + Math.sin(a) * 2.2;
        } else if (c.state === 'dash') {
          const k = Math.min(1, c.st / 0.45);
          const x = c.fx + (c.tx - c.fx) * k, z = c.fz + (c.tz - c.fz) * k;
          c.mesh.position.set(x, this.world.getGroundHeight(x, z, c.plane) + 0.05, z);
          c.mesh.rotation.y = Math.atan2(c.tx - c.fx, c.tz - c.fz) + Math.PI;
          if (k >= 1) { c.state = 'pause'; c.st = 0; }
        } else if (!c.mesh.position.x) {
          c.mesh.position.set(c.ax, this.world.getGroundHeight(c.ax, c.az, c.plane) + 0.05, c.az);
        }
      }
    }
  }
}
