// OLDHOLM — quests.js
// The quest state machine: stage ints per quest (0 = not started,
// 100 = complete), journal queries, rewards, and the completion fanfare.

import { QUESTS, QUEST_ORDER } from '../data/quests.js';

export class Quests {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;
    this.stages = {};
    for (const id of QUEST_ORDER) this.stages[id] = 0;
  }

  stage(id) { return this.stages[id] ?? 0; }
  started(id) { return this.stage(id) > 0; }
  complete(id) { return this.stage(id) === 100; }

  questPoints() {
    return QUEST_ORDER.reduce((a, id) => a + (this.complete(id) ? QUESTS[id].qp : 0), 0);
  }

  totalQp() {
    return QUEST_ORDER.reduce((a, id) => a + QUESTS[id].qp, 0);
  }

  /** Advance to a stage (never backwards). */
  setStage(id, stage) {
    if (stage <= this.stage(id)) return;
    this.stages[id] = stage;
    if (stage === 100) this._finish(id);
    else this.ui.chat.add('Your quest journal has been updated.', 'system');
    this.ui.refreshJournal();
  }

  _finish(id) {
    const q = QUESTS[id];
    for (const r of q.rewardFn ?? []) {
      if (r[0] === 'xp') this.player.addXp(r[1], r[2], this.ui);
      else if (r[0] === 'item') {
        if (!this.player.inventory.add(r[1], r[2]))
          this.ui.chat.add('Your reward waits — your pack was too full for part of it.');
        this.ui.refreshInventory();
      }
    }
    this.ui.chat.add(`Congratulations! You have completed ${q.name}!`, 'system');
    this.ui.chat.add(`Quest points: +${q.qp} (total ${this.questPoints()})`, 'system');
    this.ui.questFanfare(q, this.questPoints(), this.totalQp());
  }

  /** Journal color per spec §11: red / yellow / green. */
  status(id) {
    return this.complete(id) ? 'done' : this.started(id) ? 'active' : 'locked';
  }

  journalLine(id) {
    const q = QUESTS[id];
    if (!this.started(id)) return q.start;
    if (this.complete(id)) return 'Quest complete.';
    return q.journal[this.stage(id)] ?? q.start;
  }

  // gates other systems ask about
  rangeUnlocked() { return this.complete('cooks_calamity'); }
  glyphcraftUnlocked() { return this.complete('severed_circle'); }
}
