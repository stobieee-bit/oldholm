// OLDHOLM — Thieving (the 20th skill). Pickpocket the realm's townsfolk by
// tier, rob market stalls (guards may object, physically), and crack the
// wall safes hiding in the Corvath sewers. Failure stings: a stun, a slap,
// and public embarrassment.

// npc/mob defId -> tier key. Quest-critical folk and bankers are exempt —
// the bank insures nothing and forgives less.
export const PICKPOCKETS = {
  villager_man: 'villager', villager_woman: 'villager', maud: 'villager', hermit: 'villager',
  shopkeeper: 'trader', brinkton_keeper: 'trader', murkwell_keeper: 'trader',
  meat_vendor: 'trader', fishmonger: 'trader', banana_seller: 'trader',
  scimitar_seller: 'trader', sunmarch_tanner: 'trader', gullwick_barkeep: 'trader',
  market_clerk: 'trader', pirate: 'trader',
  guard: 'guard', toll_guard: 'guard', squire: 'guard', crossroads_sergeant: 'guard',
  corvath_swordsmith: 'elite', corvath_staffseller: 'elite', gem_seller: 'elite',
  guildmaster: 'elite', skalvik_jarl: 'elite', collector: 'elite',
};

// Coin ranges are deliberately modest: the balance audit showed the original
// ranges printed 530k/hr at cap — ~12x the deepest-risk earner in the game.
// Thieving stays the best pure-coin skill, but by a lead, not a landslide.
export const TIERS = {
  villager: {
    req: 1, xp: 8, stun: 3, dmg: 1, coins: [2, 6], label: 'villager',
    extra: [{ item: 'wheat_seed', chance: 0.08 }],
  },
  trader: {
    req: 20, xp: 28, stun: 4, dmg: 2, coins: [4, 14], label: 'trader',
    extra: [{ item: 'guam_seed', chance: 0.08 }, { item: 'tarromin_seed', chance: 0.05 },
      { item: 'bread', chance: 0.06 }],
  },
  guard: {
    req: 40, xp: 50, stun: 5, dmg: 3, coins: [8, 26], label: 'guard',
    extra: [{ item: 'harralander_seed', chance: 0.06 }, { item: 'iron_bar', chance: 0.04 }],
  },
  elite: {
    req: 60, xp: 90, stun: 6, dmg: 4, coins: [12, 40], label: 'noble',
    extra: [{ item: 'uncut_sapphire', chance: 0.03 }, { item: 'ranarr_seed', chance: 0.02 },
      { item: 'uncut_emerald', chance: 0.02 }, { item: 'uncut_ruby', chance: 0.01 }],
  },
};

// Market stalls: placed beside their rightful owners. Stealing rolls loot,
// then rolls whether a guard storms over (always likelier when you fumble).
export const STALLS = [
  { key: 'bake', name: 'Bake stall', x: 291.5, z: 122.5, req: 5, xp: 16,
    cooldown: 10, guardChance: 0.2, color: 0xc9a26a, loot: ['bread'] },
  { key: 'fish', name: 'Fish stall', x: 163.5, z: 310.5, req: 30, xp: 42,
    cooldown: 14, guardChance: 0.3, color: 0x7a9ab0, loot: ['raw_tuna', 'raw_lobster'] },
  { key: 'gem', name: 'Gem stall', x: 294.5, z: 262.5, req: 65, xp: 160,
    cooldown: 30, guardChance: 0.4, color: 0x8f5fbf, loot: ['uncut_sapphire', 'uncut_emerald', 'uncut_ruby'] },
];

// Wall safes in the Corvath sewers ring (positions relative to its rect).
export const SAFE = {
  req: 50, xp: 70, cooldown: 35, coins: [30, 90], failDmg: [2, 4],
  gems: [{ item: 'uncut_sapphire', chance: 0.2 }, { item: 'uncut_emerald', chance: 0.08 }],
};
