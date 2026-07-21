// OLDHOLM — diaries.js
// Achievement diaries: task completion is DERIVED from persisted state each
// time it's asked for (no per-task saving); only the claimed flags persist.

import { DIARIES, DIARY_ORDER } from '../data/diaries.js';

export class Diaries {
  constructor(game) {
    this.g = game; // { player, combat, quests, bank, slayer, ui }
    this.claimed = {}; // diaryId -> true
  }

  _ctx() {
    const g = this.g;
    return {
      skill: (n) => g.player.skillByName(n)?.level ?? 1,
      killed: (id) => g.combat.kills[id] ?? 0,
      quest: (id) => g.quests.stage(id),
      qp: g.quests.questPoints(),
      banked: (id) => g.bank.vault.get(id) ?? 0,
      slayerStreak: g.slayer?.streak ?? 0,
    };
  }

  /** [doneCount, total] for a diary. */
  progress(id) {
    const d = DIARIES[id];
    const ctx = this._ctx();
    let done = 0;
    for (const t of d.tasks) { try { if (t.done(ctx)) done++; } catch (_) {} }
    return [done, d.tasks.length];
  }

  /** Per-task checklist [{text, done}] for the detail view. */
  checklist(id) {
    const ctx = this._ctx();
    return DIARIES[id].tasks.map((t) => {
      let ok = false; try { ok = !!t.done(ctx); } catch (_) {}
      return { text: t.text, done: ok };
    });
  }

  complete(id) { const [a, b] = this.progress(id); return a >= b; }
  claimable(id) { return this.complete(id) && !this.claimed[id]; }

  claim(id) {
    if (!this.claimable(id)) return false;
    const g = this.g, d = DIARIES[id];
    this.claimed[id] = true;
    for (const r of d.rewardFn ?? []) {
      if (r[0] === 'xp') g.player.addXp(r[1], r[2], g.ui);
      else if (r[0] === 'item' && !g.player.inventory.add(r[1], r[2]))
        g.ui.chat.add('Part of the reward waits — your pack was too full.');
    }
    g.ui.chat.add(`${d.name} complete! The realm takes note.`, 'system');
    g.ui.audio?.sfx('quest');
    g.ui.refreshInventory();
    return true;
  }

  order() { return DIARY_ORDER; }
  def(id) { return DIARIES[id]; }

  snapshot() { return { claimed: this.claimed }; }
  restore(d) { this.claimed = d?.claimed ?? {}; }
}
