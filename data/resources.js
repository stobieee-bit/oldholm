// OLDHOLM — gathering resource tables. Per spec §4: gathering xp per action is
// data, and the per-tick success chance is min(0.95, 0.30 + (level-req)*0.02).

// Woodcutting. depleteChance: odds a successful chop fells the tree to a stump.
export const TREES = {
  tree: { label: 'Tree', req: 1, xp: 25, logs: 'logs', depleteChance: 1, respawnTicks: 30,
    examine: 'A tree. Notably wooden.' },
  oak: { label: 'Oak', req: 15, xp: 37.5, logs: 'oak_logs', depleteChance: 0.125, respawnTicks: 45,
    examine: 'A sturdy oak. It has seen some winters.' },
  willow: { label: 'Willow', req: 30, xp: 67.5, logs: 'willow_logs', depleteChance: 0.125, respawnTicks: 45,
    examine: 'A weeping willow. It knows something you don’t.' },
  yew: { label: 'Yew', req: 60, xp: 175, logs: 'yew_logs', depleteChance: 0.125, respawnTicks: 90,
    examine: 'Ancient, dense, and disdainful of your axe.' },
};

// Mining. Rocks always deplete on a successful mine.
export const ROCKS = {
  copper: { label: 'Copper rocks', req: 1, xp: 17.5, ore: 'copper_ore', respawnTicks: 8, vein: 0xb5703a,
    examine: 'A rock seamed with copper.' },
  tin: { label: 'Tin rocks', req: 1, xp: 17.5, ore: 'tin_ore', respawnTicks: 8, vein: 0xb8bcc0,
    examine: 'A rock seamed with tin.' },
  iron: { label: 'Iron rocks', req: 15, xp: 35, ore: 'iron_ore', respawnTicks: 15, vein: 0x8a5a44,
    examine: 'A rock seamed with iron.' },
  coal: { label: 'Coal rocks', req: 30, xp: 50, ore: 'coal', respawnTicks: 60, vein: 0x2a2624,
    examine: 'A rock veined with coal.' },
  gold: { label: 'Gold rocks', req: 40, xp: 65, ore: 'gold_ore', respawnTicks: 90, vein: 0xe0b83a,
    examine: 'A rock with expensive opinions.' },
  slate: { label: 'Pale vein', req: 1, xp: 5, ore: 'blank_slate', respawnTicks: 10, vein: 0xb8b8c2,
    examine: 'A pale seam of listening stone.' },
  coldiron: { label: 'Coldiron vein', req: 45, xp: 80, ore: 'coldiron_ore', respawnTicks: 40, vein: 0x9ad0e0,
    examine: 'Iron that never learned to be warm.' },
};

// Fishing. Each spot type: required tool, optional consumable per catch, and
// the weighted table of what can bite (filtered by level).
export const FISHING = {
  net: {
    label: 'Fishing spot', verb: 'Net', tool: 'small_net',
    options: [
      { item: 'raw_shrimp', req: 1, xp: 10, weight: 1 },
    ],
    examine: 'Something small ripples beneath the surface.',
  },
  lure: {
    label: 'Fishing spot', verb: 'Lure', tool: 'fly_rod', consumes: 'feather',
    options: [
      { item: 'raw_trout', req: 20, xp: 50, weight: 3 },
      { item: 'raw_salmon', req: 30, xp: 70, weight: 2 },
    ],
    examine: 'Quick shapes flicker against the current.',
  },
  bait: {
    label: 'Fishing spot', verb: 'Bait', tool: 'fishing_rod', consumes: 'fishing_bait',
    options: [
      { item: 'raw_sardine', req: 5, xp: 20, weight: 3 },
      { item: 'raw_herring', req: 10, xp: 30, weight: 2 },
      { item: 'raw_pike', req: 25, xp: 60, weight: 1 },
    ],
    examine: 'Something down there is hungry.',
  },
};

// Firemaking: lighting logs. Fires burn for lifeTicks (+ random extra).
export const FIREMAKING = {
  logs: { req: 1, xp: 40 },
  oak_logs: { req: 15, xp: 60 },
  willow_logs: { req: 30, xp: 90 },
  yew_logs: { req: 60, xp: 202.5 },
  fireLifeTicks: [90, 150], // min, max
};

// Cooking. Burn chance is 50% at the required level, falling linearly to 0%
// at burnStop (the castle range effectively lowers burnStop by 4).
export const COOKING = {
  raw_shrimp: { cooked: 'shrimp', burnt: 'burnt_fish', req: 1, xp: 30, burnStop: 34 },
  raw_sardine: { cooked: 'sardine', burnt: 'burnt_fish', req: 5, xp: 40, burnStop: 38 },
  raw_herring: { cooked: 'herring', burnt: 'burnt_fish', req: 10, xp: 50, burnStop: 41 },
  raw_trout: { cooked: 'trout', burnt: 'burnt_fish', req: 20, xp: 70, burnStop: 49 },
  raw_pike: { cooked: 'pike', burnt: 'burnt_fish', req: 25, xp: 80, burnStop: 53 },
  raw_salmon: { cooked: 'salmon', burnt: 'burnt_fish', req: 30, xp: 90, burnStop: 58 },
  raw_tuna: { cooked: 'tuna', burnt: 'burnt_fish', req: 35, xp: 100, burnStop: 63 },
  raw_lobster: { cooked: 'lobster', burnt: 'burnt_fish', req: 40, xp: 120, burnStop: 68 },
  raw_swordfish: { cooked: 'swordfish', burnt: 'burnt_fish', req: 45, xp: 140, burnStop: 86 },
  raw_beef: { cooked: 'cooked_beef', burnt: 'burnt_meat', req: 1, xp: 30, burnStop: 31 },
  raw_chicken: { cooked: 'cooked_chicken', burnt: 'burnt_meat', req: 1, xp: 30, burnStop: 31 },
  RANGE_BONUS: 4,           // the range stops burning 4 levels earlier
  TICKS_PER_ITEM: 3,
};

export function burnChance(level, def, onRange) {
  const stop = def.burnStop - (onRange ? COOKING.RANGE_BONUS : 0);
  if (level >= stop) return 0;
  return Math.min(0.5, 0.5 * (stop - level) / Math.max(1, stop - def.req));
}
