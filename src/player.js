// OLDHOLM — player.js
// First-person controller: pointer-lock mouse look, WASD movement,
// Shift-toggled run with an energy meter, circle-vs-blocked-tile collision.
// The player moves freely; the world stops them at tile-truth blockers.

import * as THREE from 'three';

const WALK_SPEED = 2.3;   // units (tiles) per second
const RUN_SPEED = 4.6;
const RADIUS = 0.32;      // collision circle
const EYE_HEIGHT = 1.55;
const RUN_DRAIN = 5;      // energy per second while running
const RUN_REGEN = 1.6;    // energy per second while walking/idle
const MOUSE_SENS = 0.0023;
const PITCH_LIMIT = 1.45;

export class Player {
  constructor(camera, world, spawn) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.yaw = spawn.yaw ?? 0;
    this.pitch = 0;
    this.runOn = false;
    this.energy = 100;
    this.keys = { forward: false, back: false, left: false, right: false };
    this.pointerLocked = false;
    this._dragging = false;
    this._eyeY = world.getGroundHeight(spawn.x, spawn.z) + EYE_HEIGHT;
    camera.rotation.order = 'YXZ';
  }

  /** Wire input. `lockTarget` is the element pointer lock attaches to. */
  attach(lockTarget) {
    this.lockTarget = lockTarget;

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.preventDefault(); // no jumping — this is a civilized game
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.back = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.runOn = !this.runOn; break;
      }
    });
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.back = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.lockTarget;
    });
    document.addEventListener('mousemove', (e) => {
      if (this.pointerLocked || this._dragging) this._look(e.movementX, e.movementY);
    });
    // drag-look fallback for environments where pointer lock is unavailable
    lockTarget.addEventListener('mousedown', () => { if (!this.pointerLocked) this._dragging = true; });
    window.addEventListener('mouseup', () => { this._dragging = false; });
  }

  requestLock() {
    try {
      const p = this.lockTarget.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) { /* fall back to drag-look */ }
  }

  _look(dx, dy) {
    this.yaw -= dx * MOUSE_SENS;
    this.pitch -= dy * MOUSE_SENS;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  }

  get running() {
    return this.runOn && this.energy > 0;
  }

  update(dt) {
    const k = this.keys;
    let mx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    let mz = (k.forward ? 1 : 0) - (k.back ? 1 : 0);
    const moving = mx !== 0 || mz !== 0;

    if (moving) {
      const inv = 1 / Math.hypot(mx, mz);
      mx *= inv; mz *= inv;
      const speed = this.running ? RUN_SPEED : WALK_SPEED;
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      // forward = (-sin(yaw), -cos(yaw)), right = (cos(yaw), -sin(yaw))
      const dx = (-sin * mz + cos * mx) * speed * dt;
      const dz = (-cos * mz - sin * mx) * speed * dt;
      // axis-separated moves give free wall sliding
      if (!this._collides(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
      if (!this._collides(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
    }

    if (this.running && moving) {
      this.energy = Math.max(0, this.energy - RUN_DRAIN * dt);
      if (this.energy === 0) this.runOn = false;
    } else {
      this.energy = Math.min(100, this.energy + RUN_REGEN * dt);
    }

    // follow the ground, smoothed so steps and bridge lips don't jolt the camera
    const targetY = this.world.getGroundHeight(this.pos.x, this.pos.z) + EYE_HEIGHT;
    this._eyeY += (targetY - this._eyeY) * Math.min(1, dt * 12);

    this.camera.position.set(this.pos.x, this._eyeY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  _collides(x, z) {
    const r = RADIUS;
    const tx0 = Math.floor(x - r), tx1 = Math.floor(x + r);
    const tz0 = Math.floor(z - r), tz1 = Math.floor(z + r);
    for (let tz = tz0; tz <= tz1; tz++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!this.world.isBlocked(tx, tz)) continue;
        // circle vs tile AABB
        const cx = Math.max(tx, Math.min(x, tx + 1));
        const cz = Math.max(tz, Math.min(z, tz + 1));
        const ddx = x - cx, ddz = z - cz;
        if (ddx * ddx + ddz * ddz < r * r) return true;
      }
    }
    return false;
  }

  /** Teleport (debug/respawn plumbing for later phases). */
  setPosition(x, z, yaw) {
    this.pos.set(x, 0, z);
    if (yaw !== undefined) this.yaw = yaw;
    this._eyeY = this.world.getGroundHeight(x, z) + EYE_HEIGHT;
  }
}
