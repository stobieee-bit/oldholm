// OLDHOLM — viewmodel.js
// First-person hands. The equipped weapon rides the bottom-right of the view
// (shield bottom-left), with walk bob, look sway, and swing animations fed by
// the combat engine. While a gathering action runs, the working tool takes
// over and keeps its own steady rhythm. Models reuse world._buildItemModel.

import * as THREE from 'three';
import { ITEMS } from '../data/items.js';

const TOOL_OF = { chop: 'axe', mine: 'pickaxe', smith: 'hammer' };

// Per model-kind held pose: rotation, offset, scale — tuned by eye against
// screenshots. Ground-item models are authored LYING DOWN for display, so
// each pose mostly exists to stand its piece back up in the hand.
const POSES = {
  blade: { rot: [0.3, 0.2, -1.3], pos: [0, 0.05, 0], s: 0.75 },
  rod: { rot: [0.2, 0, -0.85], pos: [-0.13, -0.06, 0], s: 0.95 },
  axe: { rot: [0.25, 0.25, -1.05], pos: [-0.08, -0.04, 0], s: 0.85 },
  pick: { rot: [0.25, 0.25, -1.05], pos: [-0.08, -0.04, 0], s: 0.85 },
  default: { rot: [0.1, 0.5, 0], pos: [0, 0.02, 0], s: 0.7 },
};
const SHIELD_POSE = { rot: [1.45, -0.35, 0.05], pos: [0.05, 0, 0], s: 0.45 };

const RIGHT_AT = [0.3, -0.26, -0.55];
const LEFT_AT = [-0.3, -0.32, -0.58];

export class Viewmodel {
  constructor(camera, player, world, actions) {
    this.player = player;
    this.world = world;
    this.actions = actions; // the skills engine: current action + findTool
    this.right = new THREE.Group();
    this.left = new THREE.Group();
    camera.add(this.right, this.left);
    this.right.position.set(...RIGHT_AT);
    this.left.position.set(...LEFT_AT);
    this._id = undefined;
    this._sid = undefined;
    this._swing = 0;
    this._dur = 0.22;
    this._mode = 'melee';
    this._bobT = 0;
    this._sway = 0;
  }

  /** Combat tells us a blow just left the player's hands. */
  swing(mode) {
    this._mode = mode;
    this._swing = 1;
    this._dur = mode === 'melee' ? 0.24 : 0.32;
  }

  _toolAction() {
    const a = this.actions?.current;
    return a && TOOL_OF[a.kind] ? TOOL_OF[a.kind] : null;
  }

  /** What the right hand should hold right now. */
  _display() {
    const kind = this._toolAction();
    if (kind) {
      const t = this.actions.findTool(kind);
      if (t) return { id: 'tool:' + t.name, def: t };
    }
    const wid = this.player.equipment.weapon;
    if (wid) return { id: wid, def: ITEMS[wid] };
    return { id: 'fist', def: null };
  }

  _dispose(group) {
    for (const c of [...group.children]) {
      group.remove(c);
      c.traverse?.((n) => { n.geometry?.dispose?.(); n.material?.dispose?.(); });
    }
  }

  _rebuild(group, def, poseOverride) {
    this._dispose(group);
    let mesh;
    if (def?.model) {
      mesh = this.world._buildItemModel(def).root;
      const pose = poseOverride ?? POSES[def.model.kind] ?? POSES.default;
      mesh.rotation.set(...pose.rot);
      mesh.position.set(...pose.pos);
      mesh.scale.setScalar(pose.s);
    } else {
      // bare knuckles: a modest fist
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.13),
        new THREE.MeshLambertMaterial({ color: 0xc9a27a, flatShading: true }));
      mesh.rotation.set(0.2, 0.3, 0);
    }
    group.add(mesh);
  }

  update(dt) {
    if (!dt) return;
    const p = this.player;
    // hand contents follow equipment + the active tool
    const disp = this._display();
    if (disp.id !== this._id) { this._id = disp.id; this._rebuild(this.right, disp.def); }
    const sid = p.equipment.shield ?? null;
    if (sid !== this._sid) {
      this._sid = sid;
      this._dispose(this.left);
      if (sid) this._rebuild(this.left, ITEMS[sid], SHIELD_POSE);
    }
    // walk bob: scaled by real ground speed so wading and running read right
    const moved = Math.hypot(p.pos.x - (this._lx ?? p.pos.x), p.pos.z - (this._lz ?? p.pos.z));
    this._lx = p.pos.x; this._lz = p.pos.z;
    const speedK = Math.min(1, moved / dt / 4.6);
    this._bobT += dt * (4 + 6 * speedK);
    const bobY = Math.sin(this._bobT * 2) * 0.014 * speedK + Math.sin(this._bobT * 0.6) * 0.004;
    const bobX = Math.cos(this._bobT) * 0.009 * speedK;
    // look sway: hands trail the eyes a touch
    const yd = p.yaw - (this._lyaw ?? p.yaw);
    this._lyaw = p.yaw;
    this._sway = THREE.MathUtils.clamp(this._sway * Math.pow(0.02, dt) + yd * 0.5, -0.07, 0.07);
    // swings
    let ax = 0, ay = 0, az = 0, rx = 0;
    if (this._swing > 0) {
      this._swing = Math.max(0, this._swing - dt / this._dur);
      const k = Math.sin((1 - this._swing) * Math.PI);
      if (this._mode === 'melee') { rx = -k * 1.15; az = -k * 0.17; ay = k * 0.05; }
      else if (this._mode === 'ranged') { az = k * 0.12; rx = -k * 0.15; } // draw and loose
      else { rx = -k * 0.25; az = -k * 0.24; ay = k * 0.1; }               // magic push
    } else if (this._toolAction()) {
      rx = -Math.abs(Math.sin(this._bobT * 1.6)) * 0.85; // steady labor at the face
    }
    this.right.position.set(RIGHT_AT[0] + bobX + this._sway + ax, RIGHT_AT[1] + bobY + ay, RIGHT_AT[2] + az);
    this.right.rotation.x = rx;
    this.left.position.set(LEFT_AT[0] - bobX * 0.6 + this._sway, LEFT_AT[1] + bobY * 0.8, LEFT_AT[2]);
  }
}
