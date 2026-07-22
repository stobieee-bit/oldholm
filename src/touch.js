// OLDHOLM — touch.js
// Mobile / touch controls, active only on touch devices. Left 40% of the
// canvas: a floating joystick that drives player.keys. Elsewhere: drag to
// look (player._look), a short still tap acts (default action), a long still
// press opens the context menu. Handlers live on the CANVAS only, so the DOM
// HUD keeps the browser's native tap behaviour; preventDefault suppresses the
// synthesized mouse events that would double-fire the desktop click path.

const DEAD = 12;        // px before the stick registers
const LOOK_SENS = 2.4;  // touch-pixels -> look units (mouse movement scale)
const TAP_MS = 300, TAP_SLOP = 12, HOLD_MS = 450;

export class TouchControls {
  constructor(canvas, player, interactions, ui) {
    this.canvas = canvas;
    this.player = player;
    this.interactions = interactions;
    this.ui = ui;
    this.stick = null;  // active joystick touch {id, ox, oy}
    this.look = null;   // active look touch {id, x, y, sx, sy, t, held}
    this._buildDom();
    canvas.addEventListener('touchstart', (e) => this._start(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this._move(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this._end(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this._end(e), { passive: false });
  }

  static isTouchDevice() {
    return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  }

  _buildDom() {
    this.base = document.createElement('div');
    this.base.id = 'joy-base';
    this.nub = document.createElement('div');
    this.nub.id = 'joy-nub';
    this.base.appendChild(this.nub);
    this.base.classList.add('hidden');
    document.body.appendChild(this.base);
  }

  _start(e) {
    if (!this.player.inputEnabled) return;
    e.preventDefault();
    // a canvas tap while the context menu is open dismisses it (there is no
    // Esc key on a phone; without this the player stands rooted in the menu)
    if (this.ui.menu.isOpen) { this.ui.menu.close(); return; }
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.4 && !this.stick) {
        this.stick = { id: t.identifier, ox: t.clientX, oy: t.clientY };
        this.base.style.left = (t.clientX - 55) + 'px';
        this.base.style.top = (t.clientY - 55) + 'px';
        this.nub.style.transform = 'translate(0px, 0px)';
        this.base.classList.remove('hidden');
      } else if (!this.look) {
        this.look = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now(), held: false };
        // long still press -> context menu
        this._holdTimer = setTimeout(() => {
          if (!this.look) return;
          const moved = Math.hypot(this.look.x - this.look.sx, this.look.y - this.look.sy);
          if (moved < TAP_SLOP && !this.ui.menu.isOpen) {
            this.look.held = true;
            this.interactions._mouse.x = this.look.x; this.interactions._mouse.y = this.look.y;
            this.interactions.openMenuFor(this.interactions.pickAtPointer());
          }
        }, HOLD_MS);
      }
    }
  }

  _move(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.stick && t.identifier === this.stick.id) {
        const dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
        const len = Math.hypot(dx, dy), max = 46;
        const cx = len > max ? dx * max / len : dx, cy = len > max ? dy * max / len : dy;
        this.nub.style.transform = `translate(${cx}px, ${cy}px)`;
        const k = this.player.keys;
        k.forward = dy < -DEAD; k.back = dy > DEAD;
        k.left = dx < -DEAD; k.right = dx > DEAD;
      } else if (this.look && t.identifier === this.look.id) {
        const dx = t.clientX - this.look.x, dy = t.clientY - this.look.y;
        this.look.x = t.clientX; this.look.y = t.clientY;
        if (!this.player.menuOpen) this.player._look(dx * LOOK_SENS, dy * LOOK_SENS);
      }
    }
  }

  _end(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.stick && t.identifier === this.stick.id) {
        this.stick = null;
        this.base.classList.add('hidden');
        const k = this.player.keys;
        k.forward = k.back = k.left = k.right = false;
      } else if (this.look && t.identifier === this.look.id) {
        clearTimeout(this._holdTimer);
        const moved = Math.hypot(t.clientX - this.look.sx, t.clientY - this.look.sy);
        const dur = performance.now() - this.look.t;
        const wasHeld = this.look.held;
        this.look = null;
        // a short, still tap acts on what's under the finger
        if (!wasHeld && dur < TAP_MS && moved < TAP_SLOP
          && this.player.inputEnabled && !this.ui.menu.isOpen) {
          this.interactions._mouse.x = t.clientX; this.interactions._mouse.y = t.clientY;
          this.interactions.defaultAction(this.interactions.pickAtPointer());
        }
      }
    }
  }
}
