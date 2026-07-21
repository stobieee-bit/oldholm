// OLDHOLM — interact.js
// Crosshair (or cursor) raycast targeting against the world's interactables.
// Left click = default action. Right click or E = context menu of all actions.
// Every interactable gets an implicit Examine entry. Reach is ~4 tiles.

import * as THREE from 'three';

const REACH = 4.2; // world units from the eye to the intersection point

export const resolveLabel = (l) => (typeof l === 'function' ? l() : l);

export class Interactions {
  /** ctx is handed to every action: { player, world, ui } */
  constructor(camera, world, player, ui) {
    this.camera = camera;
    this.world = world;
    this.player = player;
    this.ui = ui;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 40; // scenery is examinable from afar; reach still gates actions
    this.hover = null;
    this._mouse = { x: 0, y: 0 }; // last cursor position (cursor mode)
    this._ndc = new THREE.Vector2();
  }

  get ctx() {
    // combat/actions/prayers/dialogue are wired in by main.js after construction
    return {
      player: this.player, world: this.world, ui: this.ui,
      combat: this.combat, actions: this.actions, prayers: this.prayers,
      dialogue: this.dialogue, quests: this.quests, npcs: this.npcs, magic: this.magic,
    };
  }

  attach(canvas) {
    this.canvas = canvas;
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      this._mouse.x = e.clientX; this._mouse.y = e.clientY;
      this._overUI = e.target !== canvas; // cursor over chat/panel/menu, not the world
    });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.player.inputEnabled || this.ui.menu.isOpen) return;
      if (e.button === 2) { this.openMenuFor(this.pickAtPointer(), e); return; }
      if (e.button !== 0) return;
      if (this.player.pointerLocked) this.defaultAction(this.pickAtPointer());
      else this._downAt = { x: e.clientX, y: e.clientY }; // maybe a click, maybe a drag-look
    });
    canvas.addEventListener('mouseup', (e) => {
      if (e.button !== 0 || !this._downAt) return;
      const moved = Math.hypot(e.clientX - this._downAt.x, e.clientY - this._downAt.y);
      this._downAt = null;
      // a still click acts; a drag was just the player looking around
      if (moved < 5 && this.player.inputEnabled && !this.ui.menu.isOpen && !this.player.pointerLocked)
        this.defaultAction(this.pickAtPointer());
    });
    window.addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '')) return; // typing, not playing
      if (!this.player.inputEnabled || this.ui.menu.isOpen || e.repeat) return;
      if (e.code === 'KeyE') this.openMenuFor(this.pickAtPointer());
    });
  }

  /** Raycast from the crosshair (locked) or the cursor (cursor mode). */
  pickAtPointer() {
    if (this.player.pointerLocked) return this.pick(0, 0);
    return this.pick(
      (this._mouse.x / window.innerWidth) * 2 - 1,
      -(this._mouse.y / window.innerHeight) * 2 + 1
    );
  }

  pick(nx, ny) {
    this._ndc.set(nx, ny);
    this.raycaster.setFromCamera(this._ndc, this.camera);
    // The pool includes plain occluders (walls, terrain): if the nearest hit
    // isn't interactable, the target is behind something — no cheating
    // through walls.
    const hits = this.raycaster.intersectObjects(this.world.pickPool, false);
    for (const h of hits) {
      const it = h.object.userData.interactable;
      if (it && it.hidden) continue; // dead mobs are transparent to rays
      if (!it) return null;          // a solid occluder blocks the target
      const dx = h.point.x - this.player.pos.x;
      const dy = h.point.y - this.camera.position.y;
      const dz = h.point.z - this.player.pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return {
        it, point: h.point.clone(), dist, inReach: dist <= REACH,
        instanceId: h.instanceId, // which instance, for instanced resources (trees)
      };
    }
    return null;
  }

  /** Called every frame: refresh the hover action text. */
  updateHover() {
    if (this.ui.menu.isOpen) return;
    if (!this.player.pointerLocked && this._overUI) {
      // the cursor is on the UI layer — don't advertise world targets beneath it
      this.hover = null;
      this.ui.setActionText(null);
      return;
    }
    this.hover = this.pickAtPointer();
    this.ui.setActionText(this.hover ? this._describe(this.hover) : null);
  }

  _describe(hit) {
    const { it, inReach } = hit;
    const first = it.actions[0];
    const verb = first ? resolveLabel(first.label) : 'Examine';
    const desc = { verb, name: it.name, more: it.actions.length, inReach };
    if (it.kind === 'mob' && this.combat && it.mob.def.attackable !== false) {
      // spec §3.3: level color-coded vs yours — green weaker, yellow even, red stronger
      desc.level = it.mob.cl;
      const diff = it.mob.cl - this.combat.playerCombatLevel();
      desc.levelClass = diff < 0 ? 'lvl-green' : diff === 0 ? 'lvl-yellow' : 'lvl-red';
    }
    return desc;
  }

  examineAction(it) {
    return {
      label: 'Examine',
      fn: (ctx) => ctx.ui.chat.add(it.examine, 'examine'),
    };
  }

  defaultAction(hit) {
    if (!hit) return;
    const action = hit.it.actions[0] ?? this.examineAction(hit.it);
    if (!hit.inReach && hit.it.actions.length > 0) {
      this.ui.chat.add("You can't reach that from here.");
      return;
    }
    action.fn(this.ctx, hit);
  }

  openMenuFor(hit, openEvent = null) {
    if (!hit) return;
    const { it } = hit;
    const entries = it.actions.map((a) => ({
      label: resolveLabel(a.label) + ' ' + it.name,
      run: () => {
        if (!hit.inReach) { this.ui.chat.add("You can't reach that from here."); return; }
        a.fn(this.ctx, hit);
      },
    }));
    entries.push({
      label: 'Examine ' + it.name,
      run: () => this.ui.chat.add(it.examine, 'examine'),
    });
    const at = this.player.pointerLocked
      ? null // centered
      : { x: this._mouse.x, y: this._mouse.y };
    this.ui.menu.open(entries, at, openEvent);
  }
}
