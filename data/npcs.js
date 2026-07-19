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
  magus_orin: {
    ...base, name: 'Magus Orin',
    examine: 'A wizard of the old school, and the old school’s old school.',
    talk: 'magus_orin', wanderRadius: 1,
    model: human(0xc9a27a, 0x5a3a72, 0x45305a, 0xe8e4da),
    chatter: ['The tower hums on Tuesdays. Nobody knows why.', 'Beads do not simply walk off. Imps, however…'],
  },
  maud: {
    ...base, name: 'Old Maud',
    examine: 'Hands stained forty colors, none of them regret.',
    talk: 'maud', wanderRadius: 0,
    model: human(0xc9a27a, 0x8f3f5a, 0x4a3a45, 0xd8d0c2),
    chatter: ['Reds from the bush, greens from the marsh.', 'Everything stains, love. Choose what.'],
  },
  ghost: {
    ...base, name: 'Ghost',
    examine: 'A shimmer of grief in the shape of a man.',
    talk: 'ghost', wanderRadius: 1, needsCharm: true,
    model: {
      height: 1.5,
      parts: [
        { kind: 'box', size: [0.42, 0.68, 0.26], at: [0, 0.75, 0], color: 0xbfd8cf },
        { kind: 'box', size: [0.3, 0.3, 0.28], at: [0, 1.28, 0], color: 0xd8e8e0 },
        { kind: 'box', size: [0.11, 0.44, 0.13], at: [-0.27, 0.78, 0], color: 0xbfd8cf },
        { kind: 'box', size: [0.11, 0.44, 0.13], at: [0.27, 0.78, 0], color: 0xbfd8cf },
      ],
    },
  },
  wartfang: {
    ...base, name: 'Chief Wartfang',
    examine: 'Red of banner, red of face.',
    talk: 'wartfang', wanderRadius: 1,
    model: {
      height: 1.25,
      parts: [
        { kind: 'box', size: [0.5, 0.5, 0.32], at: [0, 0.64, 0], color: 0x8f3f34 },
        { kind: 'box', size: [0.46, 0.42, 0.42], at: [0, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [-0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [-0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [-0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'cone', r: 0.1, h: 0.3, at: [0, 1.4, 0], color: 0xc23a3a },
      ],
    },
    chatter: ['RED!', 'Wartfang sharpens. Just in case.'],
  },
  grubnose: {
    ...base, name: 'Chief Grubnose',
    examine: 'Green of banner, green of everything, honestly.',
    talk: 'grubnose', wanderRadius: 1,
    model: {
      height: 1.25,
      parts: [
        { kind: 'box', size: [0.5, 0.5, 0.32], at: [0, 0.64, 0], color: 0x3f6f34 },
        { kind: 'box', size: [0.46, 0.42, 0.42], at: [0, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [-0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [-0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [-0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'cone', r: 0.1, h: 0.3, at: [0, 1.4, 0], color: 0x4a8f3a },
      ],
    },
    chatter: ['GREEN!', 'Green is forever, human.'],
  },
  grubfoot: {
    ...base, name: 'Grubfoot the Uniter',
    examine: 'Two hundred seasons old and every one of them earned.',
    talk: 'grubfoot', wanderRadius: 0, hidden: true,
    model: {
      height: 1.15,
      parts: [
        { kind: 'box', size: [0.54, 0.46, 0.36], at: [0, 0.6, 0], color: 0x6a5a3a },
        { kind: 'box', size: [0.48, 0.44, 0.44], at: [0, 1.02, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.13, 0.1, 0.05], at: [-0.3, 1.06, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.13, 0.1, 0.05], at: [0.3, 1.06, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.4, 0.08, 0.42], at: [0, 1.28, 0], color: 0xd8d0c2 },
        { kind: 'box', size: [0.12, 0.36, 0.12], at: [-0.34, 0.56, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.12, 0.36, 0.12], at: [0.34, 0.56, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.15, 0.36, 0.15], at: [-0.14, 0.18, 0], color: 0x4a3a28 },
        { kind: 'box', size: [0.15, 0.36, 0.15], at: [0.14, 0.18, 0], color: 0x4a3a28 },
      ],
    },
  },
  dairy_cow: {
    ...base, name: 'Dairy cow',
    examine: 'The realm’s most patient beverage dispenser.',
    milkable: true, wanderRadius: 1,
    model: {
      height: 1.15,
      parts: [
        { kind: 'box', size: [0.62, 0.62, 1.15], at: [0, 0.72, 0], color: 0xe6e2d8 },
        { kind: 'box', size: [0.34, 0.3, 0.5], at: [0.16, 0.6, 0.3], color: 0x8a6a5a },
        { kind: 'box', size: [0.3, 0.3, 0.34], at: [0, 0.92, -0.72], color: 0xe6e2d8 },
        { kind: 'box', size: [0.1, 0.1, 0.14], at: [0, 0.84, -0.9], color: 0xd8b5a0 },
        { kind: 'box', size: [0.26, 0.05, 0.05], at: [0, 1.1, -0.72], color: 0xcfc8b8 },
        { kind: 'box', size: [0.24, 0.18, 0.3], at: [0, 0.32, 0.18], color: 0xd8b5a0 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, -0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, -0.42], color: 0xe6e2d8 },
      ],
    },
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
