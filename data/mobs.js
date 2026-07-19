// OLDHOLM — mob definitions. Adding a mob means adding one object here.
// Combat level is DERIVED from stats via the spec formula (single source of
// truth) — the stats below are tuned to land on the classic levels:
//   chicken 1, spider 1, giant rat 3, goblin 2, goblin (strong) 5, cow 2.
// Fields:
//   name/examine   display + examine line (both goblins display as "Goblin")
//   stats          {att, str, def, hp}
//   bonuses        {att, str, def} flat equipment-style bonuses (0 for beasts)
//   speed          attack cadence in ticks
//   aggroRadius    tiles; 0 = passive. Aggressive mobs only attack players
//                  of combat level <= 2x their own (spec §7).
//   wanderRadius   tiles from spawn for idle wandering
//   respawnTicks   ticks from death to respawn
//   drops          weighted table; entries {item, count|[min,max], weight},
//                  or {weight} alone for "nothing"
//   model          low-poly recipe interpreted by npc.js: parts of
//                  {kind:'box'|'cone'|'ball', size/r, at:[x,y,z], color, rotY?}

export const MOBS = {
  chicken: {
    name: 'Chicken',
    examine: 'Yep, definitely a chicken.',
    stats: { att: 1, str: 1, def: 1, hp: 3 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'stab', // the peck
    speed: 4, aggroRadius: 0, wanderRadius: 3, respawnTicks: 40,
    drops: [
      { item: 'bones', count: 1, weight: 1 },       // always
      { item: 'feather', count: [1, 4], weight: 1 }, // always
      { item: 'raw_chicken', count: 1, weight: 1 },  // always
    ],
    alwaysDrops: 3, // first N entries always drop; the rest roll by weight
    model: {
      height: 0.62,
      parts: [
        { kind: 'box', size: [0.34, 0.3, 0.42], at: [0, 0.3, 0], color: 0xe8e4da },
        { kind: 'box', size: [0.18, 0.18, 0.18], at: [0, 0.56, -0.22], color: 0xe8e4da },
        { kind: 'cone', r: 0.05, h: 0.12, at: [0, 0.56, -0.34], rotX: -1.57, color: 0xd8a03a },
        { kind: 'box', size: [0.05, 0.08, 0.05], at: [0, 0.6, -0.16], color: 0xc84b38 },
        { kind: 'box', size: [0.04, 0.16, 0.04], at: [-0.08, 0.08, 0], color: 0xd8a03a },
        { kind: 'box', size: [0.04, 0.16, 0.04], at: [0.08, 0.08, 0], color: 0xd8a03a },
      ],
    },
  },

  cow: {
    name: 'Cow',
    examine: 'Converts grass into beef.',
    stats: { att: 1, str: 1, def: 1, hp: 8 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'crush', // the headbutt
    speed: 4, aggroRadius: 0, wanderRadius: 4, respawnTicks: 42,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'cowhide', count: 1, weight: 1 },
      { item: 'raw_beef', count: 1, weight: 1 },
    ],
    alwaysDrops: 3,
    model: {
      height: 1.15,
      parts: [
        { kind: 'box', size: [0.62, 0.62, 1.15], at: [0, 0.72, 0], color: 0xe6e2d8 },
        { kind: 'box', size: [0.3, 0.26, 0.42], at: [0.18, 0.95, 0.28], color: 0x39332c },
        { kind: 'box', size: [0.34, 0.3, 0.5], at: [-0.16, 0.6, -0.3], color: 0x39332c },
        { kind: 'box', size: [0.3, 0.3, 0.34], at: [0, 0.92, -0.72], color: 0xe6e2d8 },
        { kind: 'box', size: [0.1, 0.1, 0.14], at: [0, 0.84, -0.9], color: 0xd8b5a0 },
        { kind: 'box', size: [0.26, 0.05, 0.05], at: [0, 1.1, -0.72], color: 0xcfc8b8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, -0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, -0.42], color: 0xe6e2d8 },
      ],
    },
  },

  giant_rat: {
    name: 'Giant rat',
    examine: 'Overgrown vermin. The giant part is not a compliment.',
    stats: { att: 2, str: 3, def: 2, hp: 5 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'stab', // the bite
    speed: 4, aggroRadius: 4, wanderRadius: 4, respawnTicks: 35,
    drops: [{ item: 'bones', count: 1, weight: 1 }],
    alwaysDrops: 1,
    model: {
      height: 0.5,
      parts: [
        { kind: 'box', size: [0.36, 0.32, 0.7], at: [0, 0.22, 0], color: 0x6e6258 },
        { kind: 'box', size: [0.22, 0.2, 0.3], at: [0, 0.3, -0.46], color: 0x6e6258 },
        { kind: 'cone', r: 0.05, h: 0.4, at: [0, 0.2, 0.52], rotX: 1.57, color: 0x9a8577 },
        { kind: 'box', size: [0.08, 0.1, 0.03], at: [-0.09, 0.44, -0.5], color: 0x9a8577 },
        { kind: 'box', size: [0.08, 0.1, 0.03], at: [0.09, 0.44, -0.5], color: 0x9a8577 },
      ],
    },
  },

  goblin: {
    name: 'Goblin',
    examine: 'Ugly, loud, and oddly opinionated about armor colors.',
    stats: { att: 1, str: 1, def: 1, hp: 5 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'crush', // crude fists
    speed: 4, aggroRadius: 0, wanderRadius: 3, respawnTicks: 42,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'coins', count: [1, 5], weight: 5 },
      { item: 'gale_glyph', count: [2, 6], weight: 2 },
      { item: 'spirit_glyph', count: [1, 4], weight: 2 },
      { weight: 4 }, // nothing extra
    ],
    alwaysDrops: 1,
    model: {
      height: 1.05,
      parts: [
        { kind: 'box', size: [0.4, 0.42, 0.26], at: [0, 0.55, 0], color: 0x7a4f3a },
        { kind: 'box', size: [0.4, 0.36, 0.36], at: [0, 0.92, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.1, 0.08, 0.04], at: [-0.24, 0.96, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.1, 0.08, 0.04], at: [0.24, 0.96, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.1, 0.34, 0.1], at: [-0.27, 0.52, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.1, 0.34, 0.1], at: [0.27, 0.52, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.34, 0.12], at: [-0.11, 0.17, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.12, 0.34, 0.12], at: [0.11, 0.17, 0], color: 0x5e4a33 },
      ],
    },
  },

  goblin_strong: {
    name: 'Goblin',
    examine: 'A goblin of consequence. The red armor is non-negotiable, apparently.',
    stats: { att: 2, str: 4, def: 3, hp: 12 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'slash', // a rusty blade, argued over at length
    speed: 4, aggroRadius: 5, wanderRadius: 3, respawnTicks: 42,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'coins', count: [3, 12], weight: 5 },
      { item: 'cabbage', count: 1, weight: 1 },
      { item: 'sigil_glyph', count: [1, 3], weight: 2 },
      { weight: 3 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.2,
      parts: [
        { kind: 'box', size: [0.46, 0.48, 0.3], at: [0, 0.62, 0], color: 0x8f3f34 },
        { kind: 'box', size: [0.44, 0.4, 0.4], at: [0, 1.02, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.11, 0.09, 0.04], at: [-0.27, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.11, 0.09, 0.04], at: [0.27, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.11, 0.38, 0.11], at: [-0.31, 0.58, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.11, 0.38, 0.11], at: [0.31, 0.58, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.13, 0.38, 0.13], at: [-0.12, 0.19, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.13, 0.38, 0.13], at: [0.12, 0.19, 0], color: 0x5e4a33 },
      ],
    },
  },

  sheep: {
    name: 'Sheep',
    examine: 'A walking jumper.',
    attackable: false, // civilized realms do not battle sheep
    shear: true,       // Shear with shears -> wool (see crafting SHEARING)
    stats: { att: 1, str: 1, def: 1, hp: 5 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'crush', // hypothetical; sheep do not attack
    speed: 4, aggroRadius: 0, wanderRadius: 4, respawnTicks: 40,
    drops: [],
    alwaysDrops: 0,
    model: {
      height: 0.75,
      parts: [
        { kind: 'box', size: [0.52, 0.46, 0.72], at: [0, 0.5, 0], color: 0xece8de },
        { kind: 'ball', r: 0.2, at: [0.2, 0.72, 0.2], color: 0xf2efe6 },
        { kind: 'ball', r: 0.2, at: [-0.2, 0.7, -0.15], color: 0xe4e0d4 },
        { kind: 'box', size: [0.2, 0.2, 0.26], at: [0, 0.62, -0.48], color: 0x3a3632 },
        { kind: 'box', size: [0.07, 0.28, 0.07], at: [-0.16, 0.14, 0.24], color: 0x3a3632 },
        { kind: 'box', size: [0.07, 0.28, 0.07], at: [0.16, 0.14, 0.24], color: 0x3a3632 },
        { kind: 'box', size: [0.07, 0.28, 0.07], at: [-0.16, 0.14, -0.28], color: 0x3a3632 },
        { kind: 'box', size: [0.07, 0.28, 0.07], at: [0.16, 0.14, -0.28], color: 0x3a3632 },
      ],
    },
  },

  imp: {
    name: 'Imp',
    examine: 'A small red menace with pockets full of other people’s things.',
    stats: { att: 1, str: 2, def: 1, hp: 4 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'stab',
    speed: 4, aggroRadius: 0, wanderRadius: 6, respawnTicks: 25,
    blinky: true, // teleports short hops when harassed (spec §7)
    drops: [
      { item: 'red_bead', count: 1, weight: 3 },
      { item: 'yellow_bead', count: 1, weight: 3 },
      { item: 'black_bead', count: 1, weight: 3 },
      { item: 'white_bead', count: 1, weight: 3 },
      { weight: 4 },
    ],
    alwaysDrops: 0,
    model: {
      height: 0.85,
      parts: [
        { kind: 'box', size: [0.3, 0.34, 0.2], at: [0, 0.42, 0], color: 0xb03030 },
        { kind: 'box', size: [0.3, 0.28, 0.28], at: [0, 0.72, 0], color: 0xc23a3a },
        { kind: 'cone', r: 0.05, h: 0.16, at: [-0.1, 0.92, 0], color: 0xb03030 },
        { kind: 'cone', r: 0.05, h: 0.16, at: [0.1, 0.92, 0], color: 0xb03030 },
        { kind: 'box', size: [0.08, 0.26, 0.08], at: [-0.19, 0.4, 0], color: 0xc23a3a },
        { kind: 'box', size: [0.08, 0.26, 0.08], at: [0.19, 0.4, 0], color: 0xc23a3a },
        { kind: 'box', size: [0.09, 0.26, 0.09], at: [-0.08, 0.13, 0], color: 0xb03030 },
        { kind: 'box', size: [0.09, 0.26, 0.09], at: [0.08, 0.13, 0], color: 0xb03030 },
        { kind: 'cone', r: 0.04, h: 0.3, at: [0, 0.35, 0.22], rotX: 1.2, color: 0xb03030 },
      ],
    },
  },

  vex_cultist: {
    name: 'Vex cultist',
    examine: 'Robes, chanting, and a deeply punchable aura.',
    stats: { att: 12, str: 14, def: 16, hp: 32 }, // combat level 20 per the formula
    bonuses: { att: 6, str: 4, def: 8 },
    attackType: 'magic',
    attackRange: 6, projectileColor: 0x8f3fbf, // casts weak bolts (spec §7)
    speed: 5, aggroRadius: 6, wanderRadius: 2, respawnTicks: 80,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'sigil_glyph', count: [1, 4], weight: 3 },
      { item: 'void_glyph', count: 1, weight: 1 },
      { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.6,
      parts: [
        { kind: 'box', size: [0.46, 0.85, 0.3], at: [0, 0.85, 0], color: 0x3a2a4a },
        { kind: 'cone', r: 0.24, h: 0.4, at: [0, 1.5, 0], color: 0x2a1f38 },
        { kind: 'box', size: [0.26, 0.2, 0.24], at: [0, 1.28, 0.02], color: 0x1a1422 },
        { kind: 'box', size: [0.1, 0.5, 0.12], at: [-0.29, 0.85, 0], color: 0x3a2a4a },
        { kind: 'box', size: [0.1, 0.5, 0.12], at: [0.29, 0.85, 0], color: 0x3a2a4a },
      ],
    },
  },

  spider: {
    name: 'Spider',
    examine: 'Eight legs, zero manners.',
    stats: { att: 1, str: 1, def: 1, hp: 2 },
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'stab', // fangs
    speed: 5, aggroRadius: 0, wanderRadius: 3, respawnTicks: 30,
    drops: [], // spiders drop nothing; the realm is fair like that
    alwaysDrops: 0,
    model: {
      height: 0.34,
      parts: [
        { kind: 'ball', r: 0.18, at: [0, 0.2, 0.04], color: 0x2e2a26 },
        { kind: 'ball', r: 0.11, at: [0, 0.18, -0.2], color: 0x2e2a26 },
        { kind: 'box', size: [0.5, 0.03, 0.03], at: [0, 0.16, 0.12], rotY: 0.5, color: 0x1e1b18 },
        { kind: 'box', size: [0.5, 0.03, 0.03], at: [0, 0.16, 0.02], rotY: -0.5, color: 0x1e1b18 },
        { kind: 'box', size: [0.5, 0.03, 0.03], at: [0, 0.16, -0.06], rotY: 0.4, color: 0x1e1b18 },
        { kind: 'box', size: [0.5, 0.03, 0.03], at: [0, 0.16, -0.14], rotY: -0.4, color: 0x1e1b18 },
      ],
    },
  },
};
