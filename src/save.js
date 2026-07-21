// OLDHOLM — save.js
// Persistence (spec §14): the whole game state to localStorage — autosave
// every 30s + on tab close, three manual slots, export/import JSON, reset.
// Serialization is centralized here; on load, world.reconcile() restores the
// quest-gated NPC/door state from quest progress.

import { levelForXp } from './skills.js';
import { ITEMS } from '../data/items.js';

const AUTO_KEY = 'oldholm_auto';
const SLOT_KEY = (n) => 'oldholm_slot_' + n;
const SETTINGS_KEY = 'oldholm_settings';
export const SAVE_VERSION = 2;

export class SaveManager {
  constructor(game) { this.g = game; }

  // ---- serialize ------------------------------------------------------------

  snapshot() {
    const g = this.g;
    const p = g.player;
    return {
      v: SAVE_VERSION,
      when: g.clock.tick, gameMinutes: g.clock.gameMinutes,
      player: {
        skills: p.skills.map((s) => ({ name: s.name, xp: s.xp })),
        hp: p.hp, maxHp: p.maxHp,
        slots: p.inventory.slots,
        equipment: p.equipment, ammoCount: p.ammoCount,
        pos: { x: p.pos.x, z: p.pos.z }, plane: p.plane, yaw: p.yaw,
        styleIndex: p.styleIndex, energy: p.energy,
        autoRetaliate: p.autoRetaliate, boosts: p.boosts,
      },
      bank: [...g.bank.vault.entries()],
      quests: g.quests.stages,
      prayers: { points: g.prayers.points, active: [...g.prayers.active] },
      magic: { autocast: g.magic.autocast },
      market: {
        offers: g.market.offers, collection: [...g.market.collection.entries()],
        drift: [...g.market._drift.entries()], nextId: g.market._nextId,
      },
      gates: {
        toll: g.world.tollGate ? g.world.tollGate.open : false,
        champions: g.world.championsGate ? g.world.championsGate.open : false,
      },
      // the actual revealed/dead state of every quest-hidden NPC + boss, so a
      // reload restores exactly what the player earned (no re-derivation from
      // quest stages, which can strand you between "revealed" and "complete").
      hidden: g.npcs.mobs.filter((m) => m.startsHidden)
        .map((m) => ({ id: m.defId, hid: !!m.hiddenNpc, dead: !!m.dead })),
      manor: g.world.manorPuzzle ? { ...g.world.manorPuzzle, levers: [...g.world.manorPuzzle.levers] } : null,
      kills: g.combat.kills ?? {},
      killBase: g.combat.killBase ?? {},
      slayer: g.slayer?.snapshot() ?? null,
      diaries: g.diaries?.snapshot() ?? null,
      clues: g.clues?.snapshot() ?? null,
      farming: g.farming?.snapshot() ?? null,
      siege: g.siege?.snapshot() ?? null,
      delve: g.delve?.snapshot() ?? null,
      pets: g.pets?.snapshot() ?? null,
      house: g.house?.snapshot() ?? null,
    };
  }

  // ---- deserialize ----------------------------------------------------------

  /** Validate a payload's shape BEFORE mutating anything, so a corrupt or
   *  hand-edited import can't half-apply and leave the world inconsistent. */
  static valid(data) {
    if (!data || data.v !== SAVE_VERSION) return false;
    const pl = data.player;
    if (!pl || !Array.isArray(pl.skills) || !pl.skills.every((s) => s && typeof s.name === 'string' && Number.isFinite(s.xp))) return false;
    if (!Number.isFinite(pl.hp) || !Array.isArray(pl.slots)) return false;
    if (!pl.pos || !Number.isFinite(pl.pos.x) || !Number.isFinite(pl.pos.z)) return false;
    if (!pl.equipment || typeof pl.equipment !== 'object') return false;
    if (!Array.isArray(data.bank) || typeof data.quests !== 'object' || !data.quests) return false;
    if (!data.prayers || typeof data.prayers !== 'object' || !data.market || typeof data.market !== 'object') return false;
    return true;
  }

  apply(data) {
    if (!SaveManager.valid(data)) return false;
    const g = this.g, p = g.player;
    // skills
    for (const s of data.player.skills) {
      const sk = p.skillByName(s.name);
      if (sk) { sk.xp = s.xp; sk.level = levelForXp(s.xp); }
    }
    p.maxHp = p.skillByName('Hitpoints').level;
    p.hp = Math.min(data.player.hp, p.maxHp);
    // inventory / equipment
    p.inventory.slots = data.player.slots.map((s) => (s ? { id: s.id, count: s.count } : null));
    while (p.inventory.slots.length < 28) p.inventory.slots.push(null);
    p.equipment = { ...p.equipment, ...data.player.equipment };
    p.ammoCount = data.player.ammoCount ?? 0;
    const w = p.equipment.weapon;
    p.attackSpeed = w ? (ITEMS[w]?.speed ?? 4) : 4;
    p.styleIndex = data.player.styleIndex ?? 0;
    p.autoRetaliate = data.player.autoRetaliate ?? true;
    p.energy = data.player.energy ?? 100;
    p.boosts = data.player.boosts ?? {};
    p.target = null;
    // bank
    g.bank.vault = new Map(data.bank);
    // quests
    for (const [id, st] of Object.entries(data.quests)) g.quests.stages[id] = st;
    // prayers / magic
    g.prayers.points = data.prayers.points;
    g.prayers.active = new Set(data.prayers.active);
    g.magic.autocast = data.magic.autocast ?? null;
    // market
    g.market.offers = data.market.offers ?? [];
    g.market.collection = new Map(data.market.collection ?? []);
    g.market._drift = new Map(data.market.drift ?? []);
    g.market._nextId = data.market.nextId ?? 1;
    // world gates + quest-npc reconciliation
    g.combat.kills = data.kills ?? {};
    g.combat.killBase = data.killBase ?? {};
    g.slayer?.restore(data.slayer);
    g.diaries?.restore(data.diaries);
    g.clues?.restore(data.clues);
    g.farming?.restore(data.farming);
    g.siege?.restore(data.siege);
    g.delve?.restore(data.delve);
    g.pets?.restore(data.pets);
    g.house?.restore(data.house);
    g.clock.tick = data.when ?? 0;
    g.clock.gameMinutes = data.gameMinutes ?? 600;
    g.world.reconcile(g.quests, g.npcs, {
      gates: data.gates ?? {}, hidden: data.hidden, manor: data.manor,
    });
    // teleport the player into place (setPosition recomputes the eye height)
    p.setPosition(data.player.pos.x, data.player.pos.z, data.player.yaw, data.player.plane ?? 0);
    // refresh every panel + orbs
    g.ui.refreshAll();
    return true;
  }

  // ---- slots / autosave -----------------------------------------------------

  save(key) {
    try { localStorage.setItem(key, JSON.stringify(this.snapshot())); return true; }
    catch (_) { return false; }
  }
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      return this.apply(JSON.parse(raw));
    } catch (_) { return false; }
  }
  has(key) { return !!localStorage.getItem(key); }
  meta(key) {
    try {
      const d = JSON.parse(localStorage.getItem(key));
      if (!d) return null;
      const total = d.player.skills.reduce((a, s) => a + levelForXp(s.xp), 0);
      const done = Object.values(d.quests).filter((v) => v === 100).length;
      return { totalLevel: total, quests: done };
    } catch (_) { return null; }
  }

  saveSlot(n) { return this.save(SLOT_KEY(n)); }
  loadSlot(n) { return this.load(SLOT_KEY(n)); }
  slotMeta(n) { return this.meta(SLOT_KEY(n)); }
  autosave() { return this.save(AUTO_KEY); }
  loadAuto() { return this.load(AUTO_KEY); }
  hasAuto() { return this.has(AUTO_KEY); }

  clearAll() {
    for (const k of [AUTO_KEY, SLOT_KEY(0), SLOT_KEY(1), SLOT_KEY(2)]) localStorage.removeItem(k);
  }

  // ---- export / import ------------------------------------------------------

  exportJson() {
    const blob = new Blob([JSON.stringify(this.snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'oldholm-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  importJson(text) {
    try { return this.apply(JSON.parse(text)); } catch (_) { return false; }
  }

  // ---- settings -------------------------------------------------------------

  saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (_) {} }
  loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; } catch (_) { return {}; } }
}
