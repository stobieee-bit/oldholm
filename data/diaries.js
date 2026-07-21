// OLDHOLM — achievement diaries. Per-region task lists rendered in the Quest
// panel. Every task is a pure predicate over PERSISTED state (kills, skill
// levels, quest stages, bank, slayer streak), so progress is derivable on any
// load — only the claimed flag is saved (src/diaries.js).
//
// ctx: skill(name) -> level, killed(defId) -> lifetime kills, quest(id) ->
// stage (100 = done), qp -> quest points, banked(itemId) -> count in vault,
// slayerStreak -> tasks completed.

export const DIARIES = {
  holmbridge: {
    name: 'Holmbridge Diary',
    tasks: [
      { text: 'Slay 10 goblins at the camp', done: (c) => c.killed('goblin') + c.killed('goblin_strong') >= 10 },
      { text: 'Reach level 15 Cooking', done: (c) => c.skill('Cooking') >= 15 },
      { text: 'Reach level 15 Fishing', done: (c) => c.skill('Fishing') >= 15 },
      { text: 'Reach level 15 Mining', done: (c) => c.skill('Mining') >= 15 },
      { text: "Complete The Cook's Calamity", done: (c) => c.quest('cooks_calamity') === 100 },
      { text: 'Keep 500 coins in the bank', done: (c) => c.banked('coins') >= 500 },
    ],
    rewards: ['750 coins', '500 Hitpoints xp'],
    rewardFn: [['item', 'coins', 750], ['xp', 'Hitpoints', 500]],
  },
  corvath: {
    name: 'Corvath Diary',
    tasks: [
      { text: 'Slay 15 guards or skeletons', done: (c) => c.killed('guard') + c.killed('skeleton') >= 15 },
      { text: 'Slay the Rat king beneath the city', done: (c) => c.killed('rat_king') >= 1 },
      { text: 'Reach level 30 Magic', done: (c) => c.skill('Magic') >= 30 },
      { text: 'Reach level 30 Smithing', done: (c) => c.skill('Smithing') >= 30 },
      { text: 'Complete 3 Slayer tasks', done: (c) => c.slayerStreak >= 3 },
      { text: 'Complete Shadow Over Corvath', done: (c) => c.quest('shadow_over_corvath') === 100 },
    ],
    rewards: ['2,000 coins', 'A combat xp lamp'],
    rewardFn: [['item', 'coins', 2000], ['item', 'combat_lamp', 1]],
  },
  frontier: {
    name: 'Frontier Diary',
    tasks: [
      { text: 'Slay 5 bogwyrms in the Blight shallows', done: (c) => c.killed('bogwyrm') >= 5 },
      { text: 'Slay 3 echoes and 3 ashfiends', done: (c) => c.killed('echo') >= 3 && c.killed('ashfiend') >= 3 },
      { text: 'Reach level 40 Woodcutting', done: (c) => c.skill('Woodcutting') >= 40 },
      { text: 'Reach level 40 Prayer', done: (c) => c.skill('Prayer') >= 40 },
      { text: 'Complete The Lord of Murkwell Manor', done: (c) => c.quest('lord_of_murkwell') === 100 },
      { text: 'Complete The Blight Cull', done: (c) => c.quest('blight_cull') === 100 },
    ],
    rewards: ['4,000 coins', 'A combat xp lamp'],
    rewardFn: [['item', 'coins', 4000], ['item', 'combat_lamp', 1]],
  },
  southern: {
    name: 'Southern Diary',
    tasks: [
      { text: 'Slay the desert Broodmother', done: (c) => c.killed('sunmarch_broodmother') >= 1 },
      { text: 'Slay 10 giant spiders around Sunmarch', done: (c) => c.killed('giant_spider') >= 10 },
      { text: 'Reach level 50 Fishing', done: (c) => c.skill('Fishing') >= 50 },
      { text: 'Reach level 45 Cooking', done: (c) => c.skill('Cooking') >= 45 },
      { text: 'Reach level 20 Herblore', done: (c) => c.skill('Herblore') >= 20 },
      { text: 'Complete The Wyrm of Ashkara', done: (c) => c.quest('wyrm_of_ashkara') === 100 },
    ],
    rewards: ['8,000 coins', '2 combat xp lamps'],
    rewardFn: [['item', 'coins', 8000], ['item', 'combat_lamp', 2]],
  },
};

export const DIARY_ORDER = ['holmbridge', 'corvath', 'frontier', 'southern'];
