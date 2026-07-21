// OLDHOLM — slayer.js
// A task-and-points meta loop. A Slayer master assigns "kill N of X" (scaled to
// the player's combat level); finishing one awards points to spend at the
// master. Progress reads combat.kills. State persists via save.js.

import { SLAYER_TASKS, SLAYER_REWARDS } from '../data/slayer.js';
import { MOBS } from '../data/mobs.js';

export class Slayer {
  constructor(player, ui, combat) {
    this.player = player;
    this.ui = ui;
    this.combat = combat;
    this.task = null; // { mob, count, base }
    this.points = 0;
    this.streak = 0;
  }

  // combatLevel() inlined so this module stays free of the three.js import chain
  _playerCl() {
    const s = (n) => this.player.skillByName(n).level;
    const base = 0.25 * (s('Defence') + s('Hitpoints') + Math.floor(s('Prayer') / 2));
    const melee = 0.325 * (s('Attack') + s('Strength'));
    const range = 0.325 * Math.floor((3 * s('Ranged')) / 2);
    const magic = 0.325 * Math.floor((3 * s('Magic')) / 2);
    return Math.floor(base + Math.max(melee, range, magic));
  }

  killed() { return this.task ? Math.max(0, (this.combat.kills[this.task.mob] ?? 0) - this.task.base) : 0; }
  hasTask() { return !!this.task; }
  complete() { return !!this.task && this.killed() >= this.task.count; }

  /** "8 goblins" — the assignment. */
  taskLabel() {
    if (!this.task) return 'no task';
    const nm = (MOBS[this.task.mob]?.name ?? this.task.mob).toLowerCase();
    return `${this.task.count} ${nm}${this.task.count > 1 ? 's' : ''}`;
  }

  /** "3/8" — progress toward the current task. */
  progressLabel() { return this.task ? `${Math.min(this.killed(), this.task.count)}/${this.task.count}` : '0/0'; }

  assign() {
    if (this.task) return false;
    const cl = this._playerCl();
    const pool = SLAYER_TASKS.filter((t) => cl >= t.minCl);
    const list = pool.length ? pool : [SLAYER_TASKS[0]];
    const t = list[Math.floor(Math.random() * list.length)];
    const count = t.count[0] + Math.floor(Math.random() * (t.count[1] - t.count[0] + 1));
    this.task = { mob: t.mob, count, base: this.combat.kills[t.mob] ?? 0 };
    this.ui.chat.add(`New Slayer task: slay ${this.taskLabel()}.`, 'system');
    return true;
  }

  turnIn() {
    if (!this.complete()) return 0;
    const reward = 2 + Math.floor(this.task.count / 12); // ~2-9 points by task size
    this.points += reward;
    this.streak++;
    this.task = null;
    this.ui.chat.add(`Task complete! +${reward} Slayer points (${this.points} total).`, 'system');
    return reward;
  }

  buy(rewardId) {
    const r = SLAYER_REWARDS[rewardId];
    if (!r) return false;
    if (this.points < r.cost) { this.ui.chat.add(`You need ${r.cost} Slayer points for that.`); return false; }
    if (!this.player.inventory.add(r.item, r.count)) { this.ui.chat.add('Your pack is too full for that.'); return false; }
    this.points -= r.cost;
    this.ui.chat.add(`You redeem ${r.name} for ${r.cost} points (${this.points} left).`, 'system');
    this.ui.refreshInventory();
    return true;
  }

  snapshot() { return { task: this.task, points: this.points, streak: this.streak }; }
  restore(d) { if (!d) return; this.task = d.task ?? null; this.points = d.points ?? 0; this.streak = d.streak ?? 0; }
}
