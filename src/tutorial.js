// OLDHOLM — tutorial.js
// A lightweight, skippable onboarding for brand-new players. It polls game
// state each tick and advances when a step's condition is met — no event bus
// needed. Only shown on a fresh start (no autosave).

const STEPS = [
  { text: 'Welcome to OLDHOLM! Click the screen to look around with the mouse, then walk with W · A · S · D.',
    done: (c) => c.dist(c.player.pos, c.spawn) > 4 },
  { text: 'Good. Press F4 to open your Pack — everything you carry lives there.',
    done: (c, s) => s.inv },
  { text: 'Left-click a person or object to interact. Try talking to a villager here in the castle courtyard.',
    done: (c, s) => s.talked },
  { text: 'Now a fight: head east over the bridge to the pasture and left-click a chicken or cow. Combat trains Attack, Strength, Defence and Hitpoints.',
    done: (c, s) => s.killed },
  { text: 'Well fought. Press F2 to open Skills — almost everything you do trains one of your 16 skills.',
    done: (c, s) => s.skills },
  { text: 'You’re ready! Explore the realm, level up, and press F3 for your Quest journal to find adventures. Good luck out there.',
    last: true },
];

export class Tutorial {
  constructor({ player, ui, combat, dialogue }) {
    this.player = player;
    this.ui = ui;
    this.combat = combat;
    this.dialogue = dialogue;
    this.active = false;
    this.step = 0;
    this.seen = {};
    this.el = document.getElementById('tutorial');
    this.textEl = document.getElementById('tutorial-text');
    this.stepEl = document.getElementById('tutorial-step');
    document.getElementById('tutorial-skip')?.addEventListener('click', () => this.finish(true));
  }

  dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

  /** Start only for a genuinely new player. */
  maybeStart(isNewPlayer) {
    if (!isNewPlayer || !this.el) return;
    this.active = true;
    this.spawn = { x: this.player.pos.x, z: this.player.pos.z };
    this.el.classList.remove('hidden');
    this._render();
  }

  tick() {
    if (!this.active) return;
    // fold momentary state into sticky flags
    const active = this.ui.panel?.active;
    if (active === 'inventory') this.seen.inv = true;
    if (active === 'skills') this.seen.skills = true;
    if (this.dialogue?.open) this.seen.talked = true;
    if (this.combat?.kills && Object.values(this.combat.kills).some((n) => n > 0)) this.seen.killed = true;

    const step = STEPS[this.step];
    if (step && !step.last && step.done({ player: this.player, spawn: this.spawn, dist: this.dist }, this.seen)) {
      this.step++;
      this.ui.audio?.sfx('levelup'); // a small ping on progress
      this._render();
    }
  }

  _render() {
    const step = STEPS[this.step];
    if (!step) { this.finish(); return; }
    this.stepEl.textContent = step.last ? 'Done' : `Step ${this.step + 1} of ${STEPS.length - 1}`;
    this.textEl.textContent = step.text;
    if (step.last) {
      clearTimeout(this._t);
      this._t = setTimeout(() => this.finish(), 15000); // fade the last card out on its own
    }
  }

  finish(skipped) {
    if (!this.active) return;
    this.active = false;
    this.el?.classList.add('hidden');
    clearTimeout(this._t);
    if (skipped) this.ui.chat.add('Tutorial dismissed — explore at your own pace.', 'system');
  }
}
