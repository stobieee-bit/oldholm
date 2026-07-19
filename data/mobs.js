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

import { figure } from './figure.js';

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
        { kind: 'cyl', rt: 0.35, rb: 0.35, h: 1.12, seg: 12, rotX: 1.5708, at: [0, 0.74, 0.02], color: 0xe6e2d8 }, // barrel body
        { kind: 'sphere', r: 0.19, scale: [1.2, 1, 1.3], at: [0.13, 0.86, 0.22], color: 0x4a4038 }, // brown patch
        { kind: 'sphere', r: 0.16, scale: [1.2, 1, 1.3], at: [-0.16, 0.66, -0.2], color: 0x4a4038 },
        { kind: 'sphere', r: 0.24, scale: [1, 0.95, 1.05], at: [0, 0.9, -0.62], color: 0x6b5744 }, // head
        { kind: 'box', size: [0.22, 0.18, 0.18], at: [0, 0.8, -0.86], color: 0xd8b5a0 }, // muzzle
        { kind: 'cone', r: 0.05, h: 0.16, rotZ: -0.7, at: [0.15, 1.06, -0.58], color: 0xcfc8b8 }, // horns
        { kind: 'cone', r: 0.05, h: 0.16, rotZ: 0.7, at: [-0.15, 1.06, -0.58], color: 0xcfc8b8 },
        { kind: 'box', size: [0.14, 0.06, 0.1], rotZ: 0.5, at: [0.24, 0.94, -0.6], color: 0x6b5744 }, // ears
        { kind: 'box', size: [0.14, 0.06, 0.1], rotZ: -0.5, at: [-0.24, 0.94, -0.6], color: 0x6b5744 },
        { kind: 'cyl', rt: 0.08, rb: 0.06, h: 0.46, at: [-0.22, 0.23, 0.42], color: 0xdad6cc },
        { kind: 'cyl', rt: 0.08, rb: 0.06, h: 0.46, at: [0.22, 0.23, 0.42], color: 0xdad6cc },
        { kind: 'cyl', rt: 0.08, rb: 0.06, h: 0.46, at: [-0.22, 0.23, -0.4], color: 0xdad6cc },
        { kind: 'cyl', rt: 0.08, rb: 0.06, h: 0.46, at: [0.22, 0.23, -0.4], color: 0xdad6cc },
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
        ...figure({ scale: 0.66, headScale: 1.55, build: 1.1, skin: 0x6f8f3f, shirt: 0x7a4f3a, sleeve: 0x6f8f3f, pants: 0x5e4a33, boot: 0x4a3a28, bald: true }),
        { kind: 'cone', r: 0.045, h: 0.17, seg: 5, rotZ: -1.5, at: [0.155, 0.9, -0.02], color: 0x6f8f3f }, // right ear
        { kind: 'cone', r: 0.045, h: 0.17, seg: 5, rotZ: 1.5, at: [-0.155, 0.9, -0.02], color: 0x6f8f3f },  // left ear
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
        ...figure({ scale: 0.76, headScale: 1.5, build: 1.2, skin: 0x6f8f3f, shirt: 0x8f3f34, sleeve: 0x6f8f3f, pants: 0x5e4a33, boot: 0x4a3a28, bald: true }),
        { kind: 'cone', r: 0.05, h: 0.19, seg: 5, rotZ: -1.5, at: [0.18, 1.04, -0.02], color: 0x6f8f3f },
        { kind: 'cone', r: 0.05, h: 0.19, seg: 5, rotZ: 1.5, at: [-0.18, 1.04, -0.02], color: 0x6f8f3f },
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
        // a cloud of faceted wool clumps
        { kind: 'sphere', r: 0.3, detail: 0, at: [0, 0.56, 0.06], color: 0xece8de },
        { kind: 'sphere', r: 0.25, detail: 0, at: [0.22, 0.62, 0.2], color: 0xf2efe6 },
        { kind: 'sphere', r: 0.24, detail: 0, at: [-0.22, 0.6, -0.02], color: 0xe4e0d4 },
        { kind: 'sphere', r: 0.22, detail: 0, at: [0.02, 0.6, -0.26], color: 0xf0ede2 },
        { kind: 'sphere', r: 0.2, detail: 0, at: [-0.16, 0.5, 0.24], color: 0xe8e4d8 },
        // black head + face + legs
        { kind: 'sphere', r: 0.16, at: [0, 0.56, -0.46], color: 0x322e2a },
        { kind: 'box', size: [0.16, 0.14, 0.16], at: [0, 0.5, -0.58], color: 0x282420 },
        { kind: 'box', size: [0.07, 0.06, 0.1], rotZ: 0.5, at: [0.14, 0.66, -0.42], color: 0x322e2a }, // ears
        { kind: 'box', size: [0.07, 0.06, 0.1], rotZ: -0.5, at: [-0.14, 0.66, -0.42], color: 0x322e2a },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [-0.16, 0.15, 0.22], color: 0x322e2a },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [0.16, 0.15, 0.22], color: 0x322e2a },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [-0.16, 0.15, -0.24], color: 0x322e2a },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [0.16, 0.15, -0.24], color: 0x322e2a },
      ],
    },
  },

  // ---- mid-tier (Phase 10). Stats tuned to the §5.2 formula levels. ----
  guard: {
    name: 'Guard',
    examine: 'Paid to stand there. Excellent at it.',
    stats: { att: 16, str: 16, def: 15, hp: 28 }, // level 21
    bonuses: { att: 8, str: 6, def: 10 },
    attackType: 'stab',
    speed: 5, aggroRadius: 0, wanderRadius: 4, respawnTicks: 60,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [4, 20], weight: 4 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.62,
      parts: [
        ...figure({ skin: 0xd8b090, shirt: 0x8a8a92, pants: 0x5a5a62, hair: 0x3a3632, boot: 0x4a4a52 }),
        { kind: 'sphere', r: 0.17, scale: [1.06, 0.74, 1.06], at: [0, 1.42, 0], color: 0x9a9aa2 }, // helm
        { kind: 'cyl', rt: 0.026, rb: 0.026, h: 0.98, rotX: 0.16, at: [0.31, 0.98, 0.03], color: 0x6e4f33 }, // spear shaft
        { kind: 'cone', r: 0.06, h: 0.19, seg: 6, rotX: 0.16, at: [0.324, 1.48, -0.04], color: 0xc4c4cc }, // spear tip
      ],
    },
  },
  skeleton: {
    name: 'Skeleton',
    examine: 'All the bones, none of the manners.',
    stats: { att: 17, str: 17, def: 15, hp: 27 }, // level 21
    bonuses: { att: 6, str: 6, def: 6 },
    attackType: 'slash',
    speed: 5, aggroRadius: 4, wanderRadius: 3, respawnTicks: 45,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [2, 14], weight: 3 }, { weight: 3 }],
    alwaysDrops: 1,
    model: {
      height: 1.58,
      parts: figure({ skin: 0xe8e2d0, shirt: 0xdcd4c0, sleeve: 0xd0c8b4, pants: 0xd0c8b4, boot: 0xc4bca8, bald: true, build: 0.82 }),
    },
  },
  zombie: {
    name: 'Zombie',
    examine: 'Deceased, and in deep denial about it.',
    stats: { att: 18, str: 19, def: 18, hp: 32 }, // level 24
    bonuses: { att: 4, str: 6, def: 4 },
    attackType: 'crush',
    speed: 6, aggroRadius: 4, wanderRadius: 3, respawnTicks: 50,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.55,
      parts: [
        ...figure({ skin: 0x7a8a62, shirt: 0x6a7a5a, sleeve: 0x64735a, pants: 0x4a4a3a, boot: 0x33342a, hair: 0x46523a }),
        { kind: 'box', size: [0.1, 0.06, 0.16], at: [-0.07, 1.3, 0.13], color: 0x3a4632 }, // sunken cheek shadow
      ],
    },
  },
  highwayman: {
    name: 'Highwayman',
    examine: 'Stand and deliver, budget edition.',
    stats: { att: 4, str: 4, def: 3, hp: 10 }, // level 5
    bonuses: { att: 2, str: 2, def: 0 },
    attackType: 'stab',
    speed: 4, aggroRadius: 4, wanderRadius: 5, respawnTicks: 45,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [2, 15], weight: 5 }, { item: 'wool_cape', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.6,
      parts: [
        ...figure({ skin: 0xd8b090, shirt: 0x3a3632, sleeve: 0x322e2a, pants: 0x2a2a30, boot: 0x1c1a18, hair: 0x241f1c }),
        { kind: 'box', size: [0.31, 0.09, 0.31], at: [0, 1.35, 0], color: 0x24201d }, // eye mask
        { kind: 'cone', r: 0.24, h: 0.22, seg: 12, scale: [1, 0.5, 1], at: [0, 1.5, 0], color: 0x24201d }, // tricorn-ish hat
      ],
    },
  },
  bear: {
    name: 'Bear',
    examine: 'A large opinion with fur.',
    stats: { att: 14, str: 16, def: 11, hp: 28 }, // level 19
    bonuses: { att: 4, str: 6, def: 4 },
    attackType: 'slash',
    speed: 5, aggroRadius: 3, wanderRadius: 5, respawnTicks: 60,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'raw_beef', count: 1, weight: 2 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.2,
      parts: [
        { kind: 'cyl', rt: 0.4, rb: 0.36, h: 1.15, seg: 12, rotX: 1.5708, at: [0, 0.78, 0.08], color: 0x5a4128 }, // barrel body
        { kind: 'sphere', r: 0.3, scale: [1, 0.95, 0.95], at: [0, 1.0, -0.66], color: 0x5a4128 }, // head
        { kind: 'box', size: [0.22, 0.16, 0.16], at: [0, 0.92, -0.9], color: 0x4a3520 }, // snout
        { kind: 'sphere', r: 0.08, at: [-0.15, 1.24, -0.66], color: 0x4a3520 }, // ears
        { kind: 'sphere', r: 0.08, at: [0.15, 1.24, -0.66], color: 0x4a3520 },
        { kind: 'cyl', rt: 0.13, rb: 0.11, h: 0.5, at: [-0.26, 0.26, 0.44], color: 0x4a3520 }, // legs
        { kind: 'cyl', rt: 0.13, rb: 0.11, h: 0.5, at: [0.26, 0.26, 0.44], color: 0x4a3520 },
        { kind: 'cyl', rt: 0.13, rb: 0.11, h: 0.5, at: [-0.26, 0.26, -0.4], color: 0x4a3520 },
        { kind: 'cyl', rt: 0.13, rb: 0.11, h: 0.5, at: [0.26, 0.26, -0.4], color: 0x4a3520 },
      ],
    },
  },
  hill_giant: {
    name: 'Hill giant',
    examine: 'The hill was here first. He disagrees.',
    stats: { att: 20, str: 22, def: 20, hp: 40 }, // level 28
    bonuses: { att: 10, str: 12, def: 8 },
    attackType: 'crush',
    speed: 6, aggroRadius: 4, wanderRadius: 4, respawnTicks: 70,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [10, 40], weight: 4 },
      { item: 'iron_ore', count: 1, weight: 2 }, { weight: 3 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.4,
      parts: [
        ...figure({ scale: 1.5, build: 1.3, skin: 0xc9a27a, shirt: 0xb08d6a, sleeve: 0xb08d6a, pants: 0x8a6a4a, hair: 0x6a5038, boot: 0x5a4530 }),
        { kind: 'cyl', rt: 0.17, rb: 0.09, h: 1.05, rotX: 0.5, rotZ: 0.28, at: [0.66, 1.5, 0.28], color: 0x6e4f33 }, // club
      ],
    },
  },
  moss_giant: {
    name: 'Moss giant',
    examine: 'Part hill, part hedge, all grudge.',
    stats: { att: 30, str: 32, def: 28, hp: 60 }, // level 42
    bonuses: { att: 12, str: 14, def: 12 },
    attackType: 'crush',
    speed: 6, aggroRadius: 4, wanderRadius: 4, respawnTicks: 90,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [15, 60], weight: 4 },
      { item: 'marsh_greens', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.6,
      parts: [
        ...figure({ scale: 1.62, build: 1.4, skin: 0x5a7a45, shirt: 0x4a6a3a, sleeve: 0x4a6a3a, pants: 0x3a5530, hair: 0x3a5028, boot: 0x2e4525 }),
        { kind: 'sphere', r: 0.2, scale: [1.2, 0.7, 1], at: [-0.5, 1.7, -0.05], color: 0x6a8a4a }, // moss clump
        { kind: 'sphere', r: 0.18, scale: [1.2, 0.7, 1], at: [0.52, 1.62, -0.05], color: 0x6a8a4a },
      ],
    },
  },
  ghoul: {
    name: 'Ghoul',
    examine: 'It remembers being hungry. Only that.',
    stats: { att: 28, str: 30, def: 27, hp: 58 }, // level 40
    bonuses: { att: 10, str: 10, def: 8 },
    attackType: 'slash',
    speed: 4, aggroRadius: 5, wanderRadius: 3, respawnTicks: 70,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [8, 30], weight: 3 }, { weight: 3 }],
    alwaysDrops: 1,
    model: {
      height: 1.6,
      parts: figure({ skin: 0x8a8a76, shirt: 0x7a7a6a, sleeve: 0x74746a, pants: 0x5a5a4e, boot: 0x46463c, hair: 0x66665a, build: 0.9, headScale: 0.96 }),
    },
  },
  barbarian: {
    name: 'Barbarian',
    examine: 'Beard first, questions never.',
    stats: { att: 7, str: 8, def: 6, hp: 16 }, // level 10
    bonuses: { att: 2, str: 4, def: 2 },
    attackType: 'slash',
    speed: 5, aggroRadius: 0, wanderRadius: 4, respawnTicks: 50,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [1, 8], weight: 3 }, { weight: 3 }],
    alwaysDrops: 1,
    model: {
      height: 1.62,
      parts: [
        ...figure({ skin: 0xd8b090, shirt: 0x8a6a42, sleeve: 0xd8b090, pants: 0x5a4a33, hair: 0xb5542a, boot: 0x4a3a28, build: 1.12 }),
        { kind: 'sphere', r: 0.15, scale: [1.05, 1.0, 0.75], at: [0, 1.2, 0.09], color: 0xb5542a }, // big beard
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
        ...figure({ scale: 0.52, headScale: 1.35, build: 1.1, skin: 0xc23a3a, shirt: 0xb03030, sleeve: 0xc23a3a, pants: 0xb03030, boot: 0x8a2020, bald: true }),
        { kind: 'cone', r: 0.028, h: 0.12, at: [0.07, 0.76, -0.02], color: 0x8a2020 }, // horns
        { kind: 'cone', r: 0.028, h: 0.12, at: [-0.07, 0.76, -0.02], color: 0x8a2020 },
        { kind: 'cone', r: 0.035, h: 0.3, rotX: 1.35, at: [0, 0.3, 0.16], color: 0xc23a3a }, // barbed tail
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
        { kind: 'cyl', rt: 0.15, rb: 0.34, h: 1.15, seg: 10, at: [0, 0.72, 0], color: 0x3a2a4a }, // robe
        { kind: 'sphere', r: 0.15, at: [0, 1.36, 0.02], color: 0x2a1f38 }, // hooded head
        { kind: 'cone', r: 0.21, h: 0.36, seg: 8, at: [0, 1.55, 0], color: 0x2a1f38 }, // hood peak
        { kind: 'box', size: [0.19, 0.12, 0.12], at: [0, 1.33, 0.13], color: 0x120c1a }, // shadowed face
        { kind: 'cyl', rt: 0.05, rb: 0.05, h: 0.52, rotZ: 0.18, at: [-0.24, 0.92, 0.04], color: 0x3a2a4a }, // sleeves
        { kind: 'cyl', rt: 0.05, rb: 0.05, h: 0.52, rotZ: -0.18, at: [0.24, 0.92, 0.04], color: 0x3a2a4a },
        { kind: 'sphere', r: 0.05, at: [-0.27, 0.66, 0.06], color: 0xc9a27a }, // hands
        { kind: 'sphere', r: 0.05, at: [0.27, 0.66, 0.06], color: 0xc9a27a },
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

  // ---- Phase 11: high-tier bestiary ----
  giant_spider: {
    name: 'Giant spider',
    examine: 'A nest’s worth of legs in one unfortunate package.',
    stats: { att: 26, str: 28, def: 24, hp: 34 }, // ~lv 32
    bonuses: { att: 4, str: 4, def: 4 },
    attackType: 'stab',
    speed: 4, aggroRadius: 5, wanderRadius: 5, respawnTicks: 45,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [5, 25], weight: 3 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 0.7,
      parts: [
        { kind: 'ball', r: 0.36, at: [0, 0.4, 0.08], color: 0x3a2a22 },
        { kind: 'ball', r: 0.22, at: [0, 0.36, -0.4], color: 0x4a3428 },
        { kind: 'box', size: [1.0, 0.06, 0.06], at: [0, 0.32, 0.22], rotY: 0.5, color: 0x2a1e18 },
        { kind: 'box', size: [1.0, 0.06, 0.06], at: [0, 0.32, 0.05], rotY: -0.5, color: 0x2a1e18 },
        { kind: 'box', size: [1.0, 0.06, 0.06], at: [0, 0.32, -0.1], rotY: 0.4, color: 0x2a1e18 },
        { kind: 'box', size: [1.0, 0.06, 0.06], at: [0, 0.32, -0.26], rotY: -0.4, color: 0x2a1e18 },
      ],
    },
  },
  ice_fiend: {
    name: 'Ice fiend',
    examine: 'A grudge with icicles.',
    stats: { att: 32, str: 34, def: 30, hp: 48 }, // ~lv 40
    bonuses: { att: 8, str: 8, def: 8 },
    attackType: 'crush',
    speed: 5, aggroRadius: 5, wanderRadius: 3, respawnTicks: 55,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [10, 40], weight: 3 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.7,
      parts: [
        { kind: 'box', size: [0.5, 0.9, 0.34], at: [0, 0.9, 0], color: 0x9ad0e0 },
        { kind: 'box', size: [0.34, 0.34, 0.32], at: [0, 1.5, 0], color: 0xc8e8f0 },
        { kind: 'cone', r: 0.08, h: 0.3, at: [-0.12, 1.8, 0], color: 0xe8f8ff },
        { kind: 'cone', r: 0.08, h: 0.3, at: [0.12, 1.8, 0], color: 0xe8f8ff },
        { kind: 'box', size: [0.14, 0.7, 0.16], at: [-0.34, 0.85, 0], color: 0x9ad0e0 },
        { kind: 'box', size: [0.14, 0.7, 0.16], at: [0.34, 0.85, 0], color: 0x9ad0e0 },
      ],
    },
  },
  bogwyrm: {
    name: 'Bogwyrm',
    examine: 'The Blight’s idea of a lizard. It went too far.',
    stats: { att: 42, str: 44, def: 40, hp: 60 }, // lv 52
    bonuses: { att: 12, str: 12, def: 12 },
    attackType: 'stab',
    speed: 5, aggroRadius: 6, wanderRadius: 5, respawnTicks: 70,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [30, 90], weight: 3 },
      { item: 'coldiron_ore', count: 1, weight: 1 },
      { item: 'uncut_ruby', count: 1, weight: 1 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.2,
      parts: [
        { kind: 'box', size: [0.7, 0.6, 1.5], at: [0, 0.6, 0], color: 0x4a5a3a },
        { kind: 'box', size: [0.4, 0.4, 0.6], at: [0, 0.7, -0.9], color: 0x5a6a45 },
        { kind: 'cone', r: 0.1, h: 0.4, at: [0, 0.6, -1.3], rotX: -1.57, color: 0x3a4a2a },
        { kind: 'box', size: [0.16, 0.4, 0.16], at: [-0.3, 0.25, 0.5], color: 0x3a4a2a },
        { kind: 'box', size: [0.16, 0.4, 0.16], at: [0.3, 0.25, 0.5], color: 0x3a4a2a },
        { kind: 'box', size: [0.16, 0.4, 0.16], at: [-0.3, 0.25, -0.5], color: 0x3a4a2a },
        { kind: 'box', size: [0.16, 0.4, 0.16], at: [0.3, 0.25, -0.5], color: 0x3a4a2a },
        { kind: 'cone', r: 0.14, h: 0.9, at: [0, 0.6, 0.95], rotX: 1.57, color: 0x3a4a2a },
      ],
    },
  },
  echo: {
    name: 'Echo',
    examine: 'A death that keeps happening. To you, ideally.',
    stats: { att: 48, str: 50, def: 46, hp: 70 }, // lv 60
    bonuses: { att: 14, str: 14, def: 12 },
    attackType: 'slash',
    speed: 4, aggroRadius: 7, wanderRadius: 6, respawnTicks: 80,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [50, 150], weight: 3 },
      { item: 'uncut_emerald', count: 1, weight: 1 },
      { item: 'coldiron_ore', count: [1, 2], weight: 1 }, { weight: 1 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.7,
      parts: [
        { kind: 'box', size: [0.44, 0.9, 0.28], at: [0, 0.9, 0], color: 0x2a2a3a },
        { kind: 'box', size: [0.3, 0.32, 0.3], at: [0, 1.5, 0], color: 0x3a3a52 },
        { kind: 'box', size: [0.08, 0.09, 0.04], at: [-0.08, 1.52, 0.14], color: 0xc23a5a },
        { kind: 'box', size: [0.08, 0.09, 0.04], at: [0.08, 1.52, 0.14], color: 0xc23a5a },
        { kind: 'box', size: [0.12, 0.7, 0.14], at: [-0.3, 0.9, 0], color: 0x2a2a3a },
        { kind: 'box', size: [0.12, 0.7, 0.14], at: [0.3, 0.9, 0], color: 0x2a2a3a },
      ],
    },
  },
  ashfiend: {
    name: 'Ashfiend',
    examine: 'Demon-class. Allergic to blessed steel, if you have any.',
    stats: { att: 50, str: 52, def: 46, hp: 72 }, // lv 62
    bonuses: { att: 16, str: 16, def: 14 },
    attackType: 'crush', demon: true,
    speed: 5, aggroRadius: 6, wanderRadius: 4, respawnTicks: 85,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [60, 180], weight: 3 },
      { item: 'ashes', count: [1, 3], weight: 2 },
      { item: 'uncut_ruby', count: 1, weight: 1 }, { weight: 1 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.0,
      parts: [
        { kind: 'box', size: [0.6, 1.0, 0.4], at: [0, 1.1, 0], color: 0x5a2a2a },
        { kind: 'box', size: [0.4, 0.4, 0.4], at: [0, 1.8, 0], color: 0x7a3020 },
        { kind: 'cone', r: 0.1, h: 0.34, at: [-0.16, 2.15, 0], color: 0x2a1414 },
        { kind: 'cone', r: 0.1, h: 0.34, at: [0.16, 2.15, 0], color: 0x2a1414 },
        { kind: 'box', size: [0.18, 0.9, 0.2], at: [-0.42, 1.05, 0], color: 0x5a2a2a },
        { kind: 'box', size: [0.18, 0.9, 0.2], at: [0.42, 1.05, 0], color: 0x5a2a2a },
        { kind: 'box', size: [0.24, 0.7, 0.26], at: [-0.18, 0.35, 0], color: 0x3a1818 },
        { kind: 'box', size: [0.24, 0.7, 0.26], at: [0.18, 0.35, 0], color: 0x3a1818 },
      ],
    },
  },

  // ---- Phase 11: quest bosses ----
  ravenmoor: {
    name: 'Lord Ravenmoor',
    examine: 'An undead nobleman. Will not die without a stake in hand.',
    stats: { att: 44, str: 48, def: 42, hp: 120 },
    bonuses: { att: 14, str: 14, def: 14 },
    attackType: 'slash', boss: true, needsItemToKill: 'stake',
    onDeathQuest: ['lord_of_murkwell', 2, 100],
    speed: 4, aggroRadius: 8, wanderRadius: 3, respawnTicks: 200,
    drops: [],
    alwaysDrops: 0,
    model: {
      height: 1.85,
      parts: [
        { kind: 'box', size: [0.5, 1.0, 0.3], at: [0, 1.0, 0], color: 0x2a2430 },
        { kind: 'box', size: [0.3, 0.32, 0.3], at: [0, 1.6, 0], color: 0xc8c0d0 },
        { kind: 'box', size: [0.5, 0.5, 0.06], at: [0, 1.05, -0.2], color: 0x8a1a2a }, // cape
        { kind: 'box', size: [0.12, 0.8, 0.14], at: [-0.32, 1.0, 0], color: 0x2a2430 },
        { kind: 'box', size: [0.12, 0.8, 0.14], at: [0.32, 1.0, 0], color: 0x2a2430 },
        { kind: 'box', size: [0.15, 0.65, 0.16], at: [-0.13, 0.32, 0], color: 0x1a1620 },
        { kind: 'box', size: [0.15, 0.65, 0.16], at: [0.13, 0.32, 0], color: 0x1a1620 },
      ],
    },
  },
  zarkhul: {
    name: 'Zarkhul',
    examine: 'The ash demon. Dawnbrand was forged for exactly this.',
    stats: { att: 55, str: 60, def: 55, hp: 180 },
    bonuses: { att: 20, str: 20, def: 18 },
    attackType: 'crush', boss: true, demon: true, weakTo: 'dawnbrand',
    onDeathQuest: ['shadow_over_corvath', 3, 100],
    speed: 5, aggroRadius: 8, wanderRadius: 2, respawnTicks: 200,
    drops: [],
    alwaysDrops: 0,
    model: {
      height: 2.6,
      parts: [
        { kind: 'box', size: [0.8, 1.3, 0.5], at: [0, 1.4, 0], color: 0x6a1a1a },
        { kind: 'box', size: [0.5, 0.5, 0.5], at: [0, 2.3, 0], color: 0x8a2010 },
        { kind: 'cone', r: 0.14, h: 0.5, at: [-0.22, 2.75, 0], color: 0x1a0a0a },
        { kind: 'cone', r: 0.14, h: 0.5, at: [0.22, 2.75, 0], color: 0x1a0a0a },
        { kind: 'box', size: [0.12, 0.1, 0.06], at: [-0.12, 2.35, 0.24], color: 0xe0a83a },
        { kind: 'box', size: [0.12, 0.1, 0.06], at: [0.12, 2.35, 0.24], color: 0xe0a83a },
        { kind: 'box', size: [0.24, 1.1, 0.26], at: [-0.56, 1.35, 0], color: 0x6a1a1a },
        { kind: 'box', size: [0.24, 1.1, 0.26], at: [0.56, 1.35, 0], color: 0x6a1a1a },
        { kind: 'box', size: [0.3, 0.8, 0.32], at: [-0.24, 0.4, 0], color: 0x4a1010 },
        { kind: 'box', size: [0.3, 0.8, 0.32], at: [0.24, 0.4, 0], color: 0x4a1010 },
      ],
    },
  },
  cindermaw: {
    name: 'Cindermaw',
    examine: 'The wyrm of Ashkara. Without an anti-flame shield, its breath is 40 regrets.',
    stats: { att: 58, str: 66, def: 55, hp: 200 },
    bonuses: { att: 22, str: 24, def: 20 },
    attackType: 'stab', boss: true, dragonfire: true,
    onDeathQuest: ['wyrm_of_ashkara', 3, 100],
    speed: 5, aggroRadius: 10, wanderRadius: 2, respawnTicks: 240,
    drops: [],
    alwaysDrops: 0,
    model: {
      height: 2.2,
      parts: [
        { kind: 'box', size: [1.1, 1.0, 2.4], at: [0, 1.0, 0], color: 0x6a2a1a },
        { kind: 'box', size: [0.7, 0.7, 0.9], at: [0, 1.2, -1.5], color: 0x8a3a20 },
        { kind: 'cone', r: 0.16, h: 0.5, at: [-0.24, 1.7, -1.6], color: 0x2a1410 },
        { kind: 'cone', r: 0.16, h: 0.5, at: [0.24, 1.7, -1.6], color: 0x2a1410 },
        { kind: 'box', size: [0.16, 0.14, 0.08], at: [-0.2, 1.25, -1.95], color: 0xe0a83a },
        { kind: 'box', size: [0.16, 0.14, 0.08], at: [0.2, 1.25, -1.95], color: 0xe0a83a },
        { kind: 'box', size: [1.9, 0.1, 1.0], at: [-1.1, 1.3, 0.2], rotZ: 0.5, color: 0x4a1810 },
        { kind: 'box', size: [1.9, 0.1, 1.0], at: [1.1, 1.3, 0.2], rotZ: -0.5, color: 0x4a1810 },
        { kind: 'box', size: [0.26, 0.7, 0.28], at: [-0.5, 0.4, 0.7], color: 0x4a1810 },
        { kind: 'box', size: [0.26, 0.7, 0.28], at: [0.5, 0.4, 0.7], color: 0x4a1810 },
        { kind: 'box', size: [0.26, 0.7, 0.28], at: [-0.5, 0.4, -0.7], color: 0x4a1810 },
        { kind: 'box', size: [0.26, 0.7, 0.28], at: [0.5, 0.4, -0.7], color: 0x4a1810 },
        { kind: 'cone', r: 0.2, h: 1.4, at: [0, 1.0, 1.5], rotX: 1.57, color: 0x4a1810 },
      ],
    },
  },
};
