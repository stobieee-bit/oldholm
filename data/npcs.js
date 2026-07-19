// OLDHOLM — human NPCs. They reuse the mob chassis (wander, tile movement,
// merged low-poly models) but talk instead of fight. Fields beyond mobs.js:
//   talk: dialogue tree id      shop: shop id (adds Trade)
//   bank: true (adds Bank)      chatter: overhead one-liners near the player
//   plane: building floor

const human = (skin, shirt, pants, hair) => ({
  height: 1.55,
  parts: [
    { kind: 'box', size: [0.42, 0.52, 0.26], at: [0, 0.82, 0], color: shirt },
    { kind: 'box', size: [0.3, 0.3, 0.28], at: [0, 1.28, 0], color: skin },
    { kind: 'box', size: [0.32, 0.1, 0.3], at: [0, 1.46, -0.01], color: hair },
    { kind: 'box', size: [0.11, 0.48, 0.13], at: [-0.27, 0.8, 0], color: shirt },
    { kind: 'box', size: [0.11, 0.48, 0.13], at: [0.27, 0.8, 0], color: skin },
    { kind: 'box', size: [0.14, 0.56, 0.15], at: [-0.11, 0.28, 0], color: pants },
    { kind: 'box', size: [0.14, 0.56, 0.15], at: [0.11, 0.28, 0], color: pants },
  ],
});

const base = {
  attackable: false,
  stats: { att: 1, str: 1, def: 1, hp: 7 },
  bonuses: { att: 0, str: 0, def: 0 },
  attackType: 'crush',
  speed: 4, aggroRadius: 0, respawnTicks: 50,
  drops: [], alwaysDrops: 0,
};

export const NPCS = {
  shopkeeper: {
    ...base, name: 'Shopkeeper',
    examine: 'Sells everything, judges nothing.',
    talk: 'shopkeeper', shop: 'general_store', wanderRadius: 0,
    model: human(0xd8b090, 0x6a7a4a, 0x5a4a33, 0x6e4f33),
  },
  banker: {
    ...base, name: 'Banker',
    examine: 'Guardian of other people’s money.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xc9a27a, 0x2e3a55, 0x2a2a30, 0x3a3632),
  },
  wizard_fenwick: {
    ...base, name: 'Wizard Fenwick',
    examine: 'Smells faintly of ozone and overconfidence.',
    talk: 'wizard', shop: 'staff_shop', wanderRadius: 0,
    model: human(0xd8b090, 0x3a4a8f, 0x2e3a72, 0x8a8078),
  },
  smith_hilda: {
    ...base, name: 'Smith Hilda',
    examine: 'Arms like anvils. Sells arms, also.',
    talk: 'smith', shop: 'sword_shop', wanderRadius: 1,
    model: human(0xc9a27a, 0x6a4a3a, 0x3a3632, 0xb5542a),
  },
  cook: {
    ...base, name: 'Cook Bramble',
    examine: 'Flour-dusted and quietly panicking.',
    talk: 'cook', wanderRadius: 1,
    model: human(0xd8b090, 0xe8e4da, 0x8a8078, 0x5a4a33),
    chatter: ['The duke eats like a horse with opinions.', 'Where did I put the sugar…'],
  },
  priest: {
    ...base, name: 'Father Merrit',
    examine: 'At peace with everything except the church roof.',
    talk: 'priest', wanderRadius: 1,
    model: human(0xc9a27a, 0xe8e2d0, 0xe8e2d0, 0x8a8078),
    chatter: ['Aurel keeps the ledger of every soul.', 'Mind the pews. They bite splinters.'],
  },
  villager_man: {
    ...base, name: 'Villager',
    examine: 'A man with somewhere vaguely to be.',
    talk: 'villager', wanderRadius: 6,
    model: human(0xd8b090, 0x8a6a42, 0x5a4a33, 0x3a3632),
    chatter: [
      'Lovely day, if you like fog.',
      'The goblins argue about armor colors. All night. ALL night.',
      'They say the bank is upstairs in the keep. Fancy that.',
    ],
  },
  villager_woman: {
    ...base, name: 'Villager',
    examine: 'A woman who has seen your type before.',
    talk: 'villager', wanderRadius: 6,
    model: human(0xc9a27a, 0x7a4a5a, 0x4a3a45, 0x6e4f33),
    chatter: [
      'Cows again. It is always cows with you adventurers.',
      'Father Merrit blesses the nets on fish-days.',
      'Keep off the wheat. We do not have wheat yet, but keep off it.',
    ],
  },
};
