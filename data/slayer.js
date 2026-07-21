// OLDHOLM — Slayer tasks & point rewards. A Slayer master assigns "kill N of
// X" (filtered to the player's combat level); finishing one awards points to
// spend at the master. Progress reads combat.kills (see src/slayer.js).

// minCl = the lowest combat level the task is offered at. count = [min, max].
export const SLAYER_TASKS = [
  { mob: 'chicken', count: [15, 25], minCl: 1 },
  { mob: 'cow', count: [15, 25], minCl: 1 },
  { mob: 'goblin', count: [15, 30], minCl: 2 },
  { mob: 'giant_rat', count: [15, 30], minCl: 3 },
  { mob: 'giant_frog', count: [20, 35], minCl: 5 },
  { mob: 'mugger', count: [20, 35], minCl: 6 },
  { mob: 'barbarian', count: [20, 40], minCl: 8 },
  { mob: 'hobgoblin', count: [25, 45], minCl: 12 },
  { mob: 'wild_dog', count: [25, 45], minCl: 12 },
  { mob: 'bear', count: [25, 50], minCl: 16 },
  { mob: 'skeleton', count: [30, 55], minCl: 18 },
  { mob: 'guard', count: [30, 55], minCl: 18 },
  { mob: 'zombie', count: [30, 60], minCl: 20 },
  { mob: 'hill_giant', count: [35, 65], minCl: 24 },
  { mob: 'dire_bear', count: [30, 55], minCl: 26 },
  { mob: 'giant_spider', count: [35, 65], minCl: 28 },
  { mob: 'ogre', count: [35, 60], minCl: 32 },
  { mob: 'ghoul', count: [40, 70], minCl: 34 },
  { mob: 'ice_fiend', count: [40, 70], minCl: 36 },
  { mob: 'moss_giant', count: [40, 75], minCl: 38 },
  { mob: 'troll', count: [40, 70], minCl: 40 },
  { mob: 'lesser_demon', count: [40, 70], minCl: 44 },
  { mob: 'bogwyrm', count: [45, 80], minCl: 48 },
  { mob: 'echo', count: [50, 90], minCl: 55 },
  { mob: 'ashfiend', count: [50, 90], minCl: 58 },
  { mob: 'green_dragon', count: [40, 70], minCl: 60 },
  { mob: 'blue_dragon', count: [40, 70], minCl: 66 },
  { mob: 'red_dragon', count: [40, 70], minCl: 72 },
  { mob: 'black_dragon', count: [35, 60], minCl: 80 },
];

// Spend Slayer points here (keyed by id for buy lookup).
export const SLAYER_REWARDS = {
  coins:   { name: '2,000 coins', cost: 3, item: 'coins', count: 2000 },
  potions: { name: '5 prayer potions', cost: 5, item: 'prayer_potion', count: 5 },
  ore:     { name: '3 runite ore', cost: 6, item: 'runite_ore', count: 3 },
  lamp:    { name: 'a combat xp lamp', cost: 9, item: 'combat_lamp', count: 1 },
};
