// OLDHOLM — pets.js
// The active pet: a tiny baked-geometry follower that trails the player,
// hops planes with them, and does absolutely nothing else. Summon/Stow from
// the pack menu; the active pet id persists via save.js.

import * as THREE from 'three';
import { PETS } from '../data/pets.js';
import { bakeMobGeometry } from './npc.js';

const FOLLOW_AT = 1.15;   // resting distance behind the player
const SPEED = 3.4;        // tiles/s — keeps up with a walker, jogs after a runner
const SNAP_AT = 14;       // too far behind -> loyal teleport

export class Pets {
  constructor(player, world) {
    this.player = player;
    this.world = world;
    this.activePet = null; // pet item id
    this.mesh = null;
    this._bob = 0;
  }

  toggle(petId, ui) {
    if (this.activePet === petId) { this.stow(ui); return; }
    this.summon(petId, ui);
  }

  summon(petId, ui) {
    const def = PETS[petId];
    if (!def) return;
    this.stow(null);
    this.activePet = petId;
    const geo = bakeMobGeometry('pet:' + petId, { model: def.model });
    this.mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.mesh.rotation.order = 'YXZ';
    const p = this.player.pos;
    this.mesh.position.set(p.x - 0.8, this.world.getGroundHeight(p.x - 0.8, p.z, this.player.plane), p.z);
    this.world.group.add(this.mesh);
    ui?.chat.add(`${def.name} scampers to your heel.`, 'system');
  }

  stow(ui) {
    if (!this.activePet) return;
    const name = PETS[this.activePet]?.name ?? 'Your pet';
    this.activePet = null;
    if (this.mesh) { this.mesh.parent?.remove(this.mesh); this.mesh = null; }
    ui?.chat.add(`${name} curls up in your pack.`);
  }

  /** Per-frame follow. */
  update(dt) {
    if (!this.mesh) return;
    const p = this.player.pos, m = this.mesh.position;
    const dx = p.x - m.x, dz = p.z - m.z;
    const dist = Math.hypot(dx, dz);
    if (dist > SNAP_AT) { m.x = p.x - 0.8; m.z = p.z; } // teleport back to heel
    else if (dist > FOLLOW_AT) {
      const step = Math.min(dist - FOLLOW_AT, SPEED * dt * (dist > 4 ? 1.6 : 1));
      m.x += (dx / dist) * step;
      m.z += (dz / dist) * step;
      this.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI; // face travel (-z fronts)
      this._bob += dt * 9;
    }
    m.y = this.world.getGroundHeight(m.x, m.z, this.player.plane)
      + Math.abs(Math.sin(this._bob)) * 0.06; // a happy little gait-hop
    // and gentle breathing at heel — a statue-still pet reads as a toy
    this._breathe = (this._breathe ?? Math.random() * Math.PI * 2) + dt * 2.4;
    this.mesh.scale.y = 1 + Math.sin(this._breathe) * 0.025;
  }

  snapshot() { return { activePet: this.activePet }; }
  restore(d, ui) {
    if (d?.activePet && PETS[d.activePet]) this.summon(d.activePet, null);
    else this.stow(null);
  }
}
