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

// A compact chromatic dragon (Wave 8): barrel body, serpentine neck + head,
// membranous wings, spiked tail, four legs. Faces -z like all mob models.
const dragon = (body, belly, wing) => ({
  height: 1.95,
  parts: [
    { kind: 'cyl', rt: 0.4, rb: 0.26, h: 1.3, seg: 10, rotX: 1.5708, at: [0, 0.85, 0.1], color: body },
    { kind: 'cyl', rt: 0.3, rb: 0.18, h: 1.15, seg: 8, scale: [1, 0.5, 1], rotX: 1.5708, at: [0, 0.62, 0.1], color: belly },
    { kind: 'cyl', rt: 0.22, rb: 0.17, h: 0.75, seg: 8, rotX: 0.85, at: [0, 1.32, -0.62], color: body }, // neck
    { kind: 'sphere', r: 0.26, scale: [1, 0.9, 1.35], at: [0, 1.72, -1.02], color: body }, // head
    { kind: 'box', size: [0.22, 0.13, 0.32], at: [0, 1.64, -1.32], color: belly }, // snout
    { kind: 'box', size: [0.16, 0.09, 0.22], at: [0, 1.62, -1.3], color: 0xffa32a }, // glowing maw
    { kind: 'cone', r: 0.07, h: 0.4, seg: 5, rotX: -1.1, at: [-0.13, 1.92, -0.9], color: 0x241a12 }, // horns
    { kind: 'cone', r: 0.07, h: 0.4, seg: 5, rotX: -1.1, at: [0.13, 1.92, -0.9], color: 0x241a12 },
    { kind: 'sphere', r: 0.04, detail: 0, at: [-0.12, 1.74, -1.18], color: 0xffd23a }, // eyes
    { kind: 'sphere', r: 0.04, detail: 0, at: [0.12, 1.74, -1.18], color: 0xffd23a },
    { kind: 'cyl', rt: 0.04, rb: 0.02, h: 1.4, seg: 5, rotZ: -0.8, at: [-0.5, 1.4, 0.2], color: 0x241a12 }, // wing spars
    { kind: 'cone', r: 0.8, h: 1.5, seg: 3, scale: [1, 1, 0.06], rotZ: 0.72, rotY: 0.3, at: [-0.78, 1.35, 0.22], color: wing },
    { kind: 'cyl', rt: 0.04, rb: 0.02, h: 1.4, seg: 5, rotZ: 0.8, at: [0.5, 1.4, 0.2], color: 0x241a12 },
    { kind: 'cone', r: 0.8, h: 1.5, seg: 3, scale: [1, 1, 0.06], rotZ: -0.72, rotY: -0.3, at: [0.78, 1.35, 0.22], color: wing },
    { kind: 'cone', r: 0.22, h: 1.5, seg: 8, rotX: -1.5708, at: [0, 0.72, 1.15], color: body }, // tail
    { kind: 'cone', r: 0.1, h: 0.3, seg: 5, rotX: 1.4, at: [0, 0.78, 1.95], color: 0x241a12 }, // tail spade
    { kind: 'cyl', rt: 0.12, rb: 0.09, h: 0.5, at: [-0.3, 0.25, -0.35], color: body },
    { kind: 'cyl', rt: 0.12, rb: 0.09, h: 0.5, at: [0.3, 0.25, -0.35], color: body },
    { kind: 'cyl', rt: 0.13, rb: 0.1, h: 0.5, at: [-0.32, 0.25, 0.5], color: body },
    { kind: 'cyl', rt: 0.13, rb: 0.1, h: 0.5, at: [0.32, 0.25, 0.5], color: body },
    { kind: 'cone', r: 0.08, h: 0.24, at: [0, 1.3, 0.2], color: 0x241a12 }, // back ridge
    { kind: 'cone', r: 0.07, h: 0.2, at: [0, 1.2, 0.62], color: 0x241a12 },
  ],
});

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
      { item: 'mithril_ore', count: [1, 2], weight: 2 },
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
      { item: 'coldiron_ore', count: [1, 2], weight: 1 },
      { item: 'adamantite_ore', count: [1, 2], weight: 2 },
      { item: 'ash_glass', count: 1, weight: 2 }, { weight: 1 },
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
      { item: 'adamantite_ore', count: [1, 2], weight: 2 },
      { item: 'runite_ore', count: 1, weight: 1 },
      { item: 'ash_glass', count: [1, 3], weight: 3 },
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

  // ---- Wave 2: difficulty-curve fillers (combat levels 7-50). Stats tuned to
  // cl = floor(0.25*(def+hp) + 0.325*(att+str)); models reuse figure()/parts. ----
  giant_frog: {
    name: 'Giant frog',
    examine: 'All mouth, and a startling amount of it.',
    stats: { att: 5, str: 5, def: 5, hp: 10 }, // lv 7
    bonuses: { att: 0, str: 0, def: 0 },
    attackType: 'crush', // a full-body flop
    speed: 5, aggroRadius: 4, wanderRadius: 4, respawnTicks: 32,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'raw_beef', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 0.72,
      parts: [
        { kind: 'sphere', r: 0.34, scale: [1.25, 0.85, 1], at: [0, 0.34, 0], color: 0x5a8a3a },
        { kind: 'box', size: [0.52, 0.14, 0.28], at: [0, 0.2, -0.3], color: 0x6a9a4a }, // wide mouth
        { kind: 'sphere', r: 0.11, at: [-0.17, 0.54, -0.26], color: 0xe8e4c0 }, // eyes
        { kind: 'sphere', r: 0.11, at: [0.17, 0.54, -0.26], color: 0xe8e4c0 },
        { kind: 'sphere', r: 0.05, detail: 0, at: [-0.17, 0.56, -0.34], color: 0x1a1a1a },
        { kind: 'sphere', r: 0.05, detail: 0, at: [0.17, 0.56, -0.34], color: 0x1a1a1a },
        { kind: 'box', size: [0.13, 0.13, 0.34], rotX: 0.45, at: [-0.3, 0.13, 0.3], color: 0x4a7a2a }, // hind legs
        { kind: 'box', size: [0.13, 0.13, 0.34], rotX: 0.45, at: [0.3, 0.13, 0.3], color: 0x4a7a2a },
      ],
    },
  },
  mugger: {
    name: 'Mugger',
    examine: 'Wants your coins and your patience.',
    stats: { att: 6, str: 6, def: 5, hp: 12 }, // lv 8
    bonuses: { att: 2, str: 2, def: 0 },
    attackType: 'crush', // a cosh
    speed: 4, aggroRadius: 5, wanderRadius: 5, respawnTicks: 40,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [3, 18], weight: 5 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.55,
      parts: [
        ...figure({ scale: 0.96, skin: 0xc9a27a, shirt: 0x5a5040, sleeve: 0x4a4636, pants: 0x3a352c, boot: 0x2a2620, hair: 0x2a221c }),
        { kind: 'cone', r: 0.2, h: 0.32, seg: 8, at: [0, 1.46, 0], color: 0x3a352c }, // grubby hood
      ],
    },
  },
  rat_king: {
    name: 'Rat king',
    examine: 'Rules the sewers by sheer, whiskered persistence.',
    stats: { att: 10, str: 9, def: 8, hp: 18 }, // lv 12
    bonuses: { att: 2, str: 2, def: 2 },
    attackType: 'stab', // the royal bite
    speed: 4, aggroRadius: 5, wanderRadius: 4, respawnTicks: 55,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [4, 16], weight: 4 }, { item: 'cheese', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 0.72,
      parts: [
        { kind: 'box', size: [0.5, 0.44, 0.96], at: [0, 0.3, 0], color: 0x5a4e44 },
        { kind: 'box', size: [0.3, 0.28, 0.42], at: [0, 0.42, -0.62], color: 0x5a4e44 },
        { kind: 'cone', r: 0.06, h: 0.56, at: [0, 0.28, 0.72], rotX: 1.57, color: 0x9a8577 }, // tail
        { kind: 'box', size: [0.1, 0.13, 0.04], at: [-0.12, 0.6, -0.66], color: 0x9a8577 }, // ears
        { kind: 'box', size: [0.1, 0.13, 0.04], at: [0.12, 0.6, -0.66], color: 0x9a8577 },
        { kind: 'cone', r: 0.11, h: 0.2, seg: 4, at: [0, 0.74, -0.6], color: 0xd8b13a }, // crown
      ],
    },
  },
  hobgoblin: {
    name: 'Hobgoblin',
    examine: 'A goblin that went to finishing school for hitting.',
    stats: { att: 10, str: 11, def: 10, hp: 20 }, // lv 14
    bonuses: { att: 4, str: 4, def: 4 },
    attackType: 'crush',
    speed: 4, aggroRadius: 5, wanderRadius: 3, respawnTicks: 45,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [5, 22], weight: 4 }, { item: 'iron_ore', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.42,
      parts: [
        ...figure({ scale: 0.88, headScale: 1.3, build: 1.22, skin: 0x5f7f3a, shirt: 0x6a4a5a, sleeve: 0x5f7f3a, pants: 0x4a3a2a, boot: 0x3a2e22, bald: true }),
        { kind: 'cone', r: 0.05, h: 0.2, seg: 5, rotZ: -1.5, at: [0.2, 1.18, -0.02], color: 0x5f7f3a },
        { kind: 'cone', r: 0.05, h: 0.2, seg: 5, rotZ: 1.5, at: [-0.2, 1.18, -0.02], color: 0x5f7f3a },
      ],
    },
  },
  wild_dog: {
    name: 'Wild dog',
    examine: 'Not looking for a home. Looking for a leg.',
    stats: { att: 12, str: 12, def: 11, hp: 20 }, // lv 15
    bonuses: { att: 2, str: 3, def: 2 },
    attackType: 'stab', // fangs
    speed: 3, aggroRadius: 6, wanderRadius: 6, respawnTicks: 40,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'raw_beef', count: 1, weight: 2 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 0.9,
      parts: [
        { kind: 'cyl', rt: 0.22, rb: 0.2, h: 0.8, seg: 10, rotX: 1.5708, at: [0, 0.52, 0.06], color: 0x6a5a48 },
        { kind: 'box', size: [0.24, 0.24, 0.3], at: [0, 0.6, -0.5], color: 0x6a5a48 }, // head
        { kind: 'box', size: [0.16, 0.12, 0.18], at: [0, 0.52, -0.68], color: 0x554636 }, // snout
        { kind: 'cone', r: 0.06, h: 0.14, seg: 4, at: [-0.1, 0.76, -0.48], color: 0x554636 }, // ears
        { kind: 'cone', r: 0.06, h: 0.14, seg: 4, at: [0.1, 0.76, -0.48], color: 0x554636 },
        { kind: 'cone', r: 0.05, h: 0.34, rotX: -1.2, at: [0, 0.56, 0.5], color: 0x554636 }, // tail
        { kind: 'cyl', rt: 0.06, rb: 0.05, h: 0.34, at: [-0.15, 0.17, 0.32], color: 0x554636 },
        { kind: 'cyl', rt: 0.06, rb: 0.05, h: 0.34, at: [0.15, 0.17, 0.32], color: 0x554636 },
        { kind: 'cyl', rt: 0.06, rb: 0.05, h: 0.34, at: [-0.15, 0.17, -0.32], color: 0x554636 },
        { kind: 'cyl', rt: 0.06, rb: 0.05, h: 0.34, at: [0.15, 0.17, -0.32], color: 0x554636 },
      ],
    },
  },
  goblin_champion: {
    name: 'Goblin champion',
    examine: 'Won the camp’s tournament. The prize was the helmet. And the grudges.',
    stats: { att: 13, str: 14, def: 13, hp: 26 }, // lv 18
    bonuses: { att: 6, str: 6, def: 6 },
    attackType: 'slash',
    speed: 4, aggroRadius: 5, wanderRadius: 3, respawnTicks: 55,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [8, 30], weight: 4 }, { item: 'steel_bar', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.5,
      parts: [
        ...figure({ scale: 0.94, headScale: 1.35, build: 1.28, skin: 0x5f7f3a, shirt: 0x8f3f34, sleeve: 0x6a6a72, pants: 0x4a3a2a, boot: 0x3a2e22, bald: true }),
        { kind: 'cone', r: 0.05, h: 0.2, seg: 5, rotZ: -1.5, at: [0.21, 1.24, -0.02], color: 0x5f7f3a },
        { kind: 'cone', r: 0.05, h: 0.2, seg: 5, rotZ: 1.5, at: [-0.21, 1.24, -0.02], color: 0x5f7f3a },
        { kind: 'sphere', r: 0.19, scale: [1.05, 0.78, 1.05], at: [0, 1.32, 0], color: 0x8a8a92 }, // helm
        { kind: 'box', size: [0.05, 0.18, 0.04], at: [0, 1.5, -0.02], color: 0xc23a3a }, // plume
      ],
    },
  },
  dire_bear: {
    name: 'Dire bear',
    examine: 'A bear with a personal vendetta and the mass to pursue it.',
    stats: { att: 22, str: 24, def: 22, hp: 42 }, // lv 30
    bonuses: { att: 6, str: 8, def: 6 },
    attackType: 'slash',
    speed: 5, aggroRadius: 5, wanderRadius: 5, respawnTicks: 70,
    drops: [{ item: 'big_bones', count: 1, weight: 1 }, { item: 'raw_beef', count: [1, 2], weight: 2 }, { item: 'coins', count: [6, 24], weight: 2 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.5,
      parts: [
        { kind: 'cyl', rt: 0.48, rb: 0.44, h: 1.35, seg: 12, rotX: 1.5708, at: [0, 0.92, 0.08], color: 0x3a2a1e },
        { kind: 'sphere', r: 0.34, scale: [1, 0.95, 0.95], at: [0, 1.2, -0.78], color: 0x3a2a1e },
        { kind: 'box', size: [0.26, 0.18, 0.18], at: [0, 1.1, -1.06], color: 0x2a1e14 },
        { kind: 'sphere', r: 0.09, at: [-0.18, 1.48, -0.78], color: 0x2a1e14 },
        { kind: 'sphere', r: 0.09, at: [0.18, 1.48, -0.78], color: 0x2a1e14 },
        { kind: 'cone', r: 0.06, h: 0.2, at: [-0.24, 1.3, -0.7], color: 0xcfc8b8 }, // scar tusks
        { kind: 'cyl', rt: 0.16, rb: 0.13, h: 0.6, at: [-0.3, 0.3, 0.5], color: 0x2a1e14 },
        { kind: 'cyl', rt: 0.16, rb: 0.13, h: 0.6, at: [0.3, 0.3, 0.5], color: 0x2a1e14 },
        { kind: 'cyl', rt: 0.16, rb: 0.13, h: 0.6, at: [-0.3, 0.3, -0.46], color: 0x2a1e14 },
        { kind: 'cyl', rt: 0.16, rb: 0.13, h: 0.6, at: [0.3, 0.3, -0.46], color: 0x2a1e14 },
      ],
    },
  },
  frost_skeleton: {
    name: 'Frost skeleton',
    examine: 'Died cold. Stayed cold. Holds a grudge, cold.',
    stats: { att: 27, str: 27, def: 25, hp: 42 }, // lv 34
    bonuses: { att: 8, str: 8, def: 8 },
    attackType: 'slash',
    speed: 5, aggroRadius: 5, wanderRadius: 3, respawnTicks: 50,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [8, 30], weight: 3 }, { item: 'coldiron_ore', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 1.58,
      parts: [
        ...figure({ skin: 0xcfe4ec, shirt: 0xbcd4dc, sleeve: 0xb0c8d4, pants: 0xb0c8d4, boot: 0xa4bcc8, bald: true, build: 0.82 }),
        { kind: 'cone', r: 0.06, h: 0.22, at: [-0.14, 1.5, -0.02], color: 0xe8f8ff }, // frost horns
        { kind: 'cone', r: 0.06, h: 0.22, at: [0.14, 1.5, -0.02], color: 0xe8f8ff },
      ],
    },
  },
  ogre: {
    name: 'Ogre',
    examine: 'Two moods: hungry, and hungrier.',
    stats: { att: 28, str: 30, def: 26, hp: 46 }, // lv 36
    bonuses: { att: 8, str: 10, def: 6 },
    attackType: 'crush',
    speed: 6, aggroRadius: 5, wanderRadius: 4, respawnTicks: 70,
    drops: [{ item: 'big_bones', count: 1, weight: 1 }, { item: 'coins', count: [12, 40], weight: 3 }, { item: 'iron_ore', count: [1, 2], weight: 2 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 2.1,
      parts: [
        ...figure({ scale: 1.3, build: 1.4, headScale: 1.1, skin: 0xa8955a, shirt: 0x7a6a4a, sleeve: 0x7a6a4a, pants: 0x5a4a33, hair: 0x4a3a28, boot: 0x3a2e20, bald: true }),
        { kind: 'box', size: [0.4, 0.14, 0.18], at: [0, 1.62, 0.1], color: 0x8a7a4a }, // heavy brow
        { kind: 'cone', r: 0.05, h: 0.14, rotX: 3.14, at: [-0.1, 1.5, 0.14], color: 0xe8e0d0 }, // tusks
        { kind: 'cone', r: 0.05, h: 0.14, rotX: 3.14, at: [0.1, 1.5, 0.14], color: 0xe8e0d0 },
        { kind: 'cyl', rt: 0.16, rb: 0.1, h: 0.95, rotX: 0.5, rotZ: 0.3, at: [0.6, 1.3, 0.26], color: 0x6e4f33 }, // club
      ],
    },
  },
  troll: {
    name: 'Mountain troll',
    examine: 'Slow, stony, and profoundly disappointed in you.',
    stats: { att: 35, str: 37, def: 33, hp: 56 }, // lv 45
    bonuses: { att: 10, str: 12, def: 10 },
    attackType: 'crush',
    speed: 6, aggroRadius: 5, wanderRadius: 4, respawnTicks: 85,
    drops: [{ item: 'big_bones', count: 1, weight: 1 }, { item: 'coins', count: [16, 50], weight: 3 }, { item: 'coal', count: [1, 3], weight: 2 }, { item: 'uncut_sapphire', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 2.3,
      parts: [
        ...figure({ scale: 1.42, build: 1.5, headScale: 1.15, skin: 0x8a8a86, shirt: 0x6a6a64, sleeve: 0x6a6a64, pants: 0x55554e, hair: 0x4a4a44, boot: 0x3a3a34, bald: true }),
        { kind: 'sphere', r: 0.16, scale: [1, 0.7, 1], at: [-0.34, 1.9, -0.05], color: 0x9a9a92 }, // stony shoulder lumps
        { kind: 'sphere', r: 0.16, scale: [1, 0.7, 1], at: [0.36, 1.86, -0.05], color: 0x9a9a92 },
        { kind: 'cone', r: 0.06, h: 0.18, rotX: 3.14, at: [-0.11, 1.62, 0.16], color: 0xe8e0d0 }, // underbite
        { kind: 'cyl', rt: 0.2, rb: 0.12, h: 1.1, rotX: 0.4, rotZ: 0.32, at: [0.68, 1.4, 0.3], color: 0x5a4a3a }, // tree-trunk club
      ],
    },
  },
  elder_moss_giant: {
    name: 'Elder moss giant',
    examine: 'Old enough to be a landmark. Cross enough to move.',
    stats: { att: 36, str: 37, def: 34, hp: 64 }, // lv 48
    bonuses: { att: 12, str: 14, def: 12 },
    attackType: 'crush',
    speed: 6, aggroRadius: 5, wanderRadius: 4, respawnTicks: 95,
    drops: [{ item: 'big_bones', count: 1, weight: 1 }, { item: 'coins', count: [20, 60], weight: 3 }, { item: 'marsh_greens', count: [1, 3], weight: 2 }, { item: 'mithril_ore', count: 1, weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 2.7,
      parts: [
        ...figure({ scale: 1.7, build: 1.5, skin: 0x4a6a38, shirt: 0x3a5a2e, sleeve: 0x3a5a2e, pants: 0x2e4525, hair: 0x2e4020, boot: 0x243818, bald: true }),
        { kind: 'sphere', r: 0.24, scale: [1.2, 0.7, 1], at: [-0.55, 1.82, -0.05], color: 0x6a8a4a }, // moss
        { kind: 'sphere', r: 0.22, scale: [1.2, 0.7, 1], at: [0.56, 1.74, -0.05], color: 0x6a8a4a },
        { kind: 'sphere', r: 0.16, scale: [1.1, 0.6, 1], at: [0, 2.42, 0], color: 0x7a9a52 }, // mossy crown
        { kind: 'sphere', r: 0.06, detail: 0, at: [-0.2, 1.8, 0.3], color: 0xd8b13a }, // flowers
        { kind: 'sphere', r: 0.06, detail: 0, at: [0.3, 1.5, 0.34], color: 0xc23a5a },
      ],
    },
  },
  lesser_demon: {
    name: 'Lesser demon',
    examine: 'Junior infernal. Blessed steel still ruins its day.',
    stats: { att: 40, str: 41, def: 37, hp: 60 }, // lv 50
    bonuses: { att: 14, str: 14, def: 12 },
    attackType: 'crush', demon: true,
    speed: 5, aggroRadius: 6, wanderRadius: 4, respawnTicks: 80,
    drops: [{ item: 'big_bones', count: 1, weight: 1 }, { item: 'coins', count: [24, 70], weight: 3 }, { item: 'ashes', count: [1, 2], weight: 2 }, { item: 'coldiron_ore', count: [1, 2], weight: 1 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 2.0,
      parts: [
        ...figure({ scale: 1.24, build: 1.34, headScale: 1.1, skin: 0xa83a2a, shirt: 0x8a2e1e, sleeve: 0x8a2e1e, pants: 0x6a2216, boot: 0x4a180f, bald: true }),
        { kind: 'cone', r: 0.09, h: 0.34, seg: 5, rotZ: 0.4, at: [-0.18, 2.02, -0.03], color: 0x2a1010 }, // horns
        { kind: 'cone', r: 0.09, h: 0.34, seg: 5, rotZ: -0.4, at: [0.18, 2.02, -0.03], color: 0x2a1010 },
        { kind: 'sphere', r: 0.05, detail: 0, at: [-0.1, 1.78, 0.16], color: 0xffd23a }, // eyes
        { kind: 'sphere', r: 0.05, detail: 0, at: [0.1, 1.78, 0.16], color: 0xffd23a },
        // small folded wings
        { kind: 'cone', r: 0.5, h: 0.9, seg: 3, scale: [1, 1, 0.08], rotZ: 0.7, rotY: 0.4, at: [-0.5, 1.3, -0.18], color: 0x5a1e14 },
        { kind: 'cone', r: 0.5, h: 0.9, seg: 3, scale: [1, 1, 0.08], rotZ: -0.7, rotY: -0.4, at: [0.5, 1.3, -0.18], color: 0x5a1e14 },
      ],
    },
  },

  // ---- Wave 8: farmable chromatic dragons (dragonfire => bring the anti-flame
  // kiteshield) and repeatable mini-bosses, filling combat levels 63-92. ----
  green_dragon: {
    name: 'Green dragon',
    examine: 'Bad breath, worse temper. The anti-flame kiteshield is not optional.',
    stats: { att: 49, str: 51, def: 46, hp: 76 }, // lv 63
    bonuses: { att: 14, str: 14, def: 12 },
    attackType: 'slash', dragonfire: true, dragonfireMax: 24,
    speed: 5, aggroRadius: 6, wanderRadius: 4, respawnTicks: 90,
    drops: [
      { item: 'dragon_bones', count: 1, weight: 1 },
      { item: 'coins', count: [80, 220], weight: 3 },
      { item: 'adamantite_ore', count: [1, 2], weight: 2 },
      { item: 'uncut_emerald', count: 1, weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: dragon(0x3a6a34, 0x5a8a44, 0x2e5228),
  },
  blue_dragon: {
    name: 'Blue dragon',
    examine: 'Colder fire, same result. Still 40 regrets without a shield.',
    stats: { att: 55, str: 57, def: 52, hp: 86 }, // lv 70
    bonuses: { att: 16, str: 16, def: 14 },
    attackType: 'slash', dragonfire: true, dragonfireMax: 32,
    speed: 5, aggroRadius: 6, wanderRadius: 4, respawnTicks: 100,
    drops: [
      { item: 'dragon_bones', count: 1, weight: 1 },
      { item: 'coins', count: [110, 300], weight: 3 },
      { item: 'runite_ore', count: 1, weight: 1 },
      { item: 'uncut_ruby', count: 1, weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: dragon(0x2a5a8a, 0x3a72a8, 0x224a72),
  },
  red_dragon: {
    name: 'Red dragon',
    examine: 'The classic. Hoards, scorches, and resents visitors.',
    stats: { att: 58, str: 62, def: 56, hp: 92 }, // lv 76
    bonuses: { att: 18, str: 18, def: 16 },
    attackType: 'slash', dragonfire: true, dragonfireMax: 40,
    speed: 5, aggroRadius: 7, wanderRadius: 4, respawnTicks: 110,
    drops: [
      { item: 'dragon_bones', count: 1, weight: 1 },
      { item: 'coins', count: [150, 400], weight: 3 },
      { item: 'runite_ore', count: [1, 2], weight: 1 },
      { item: 'rune_bar', count: 1, weight: 1 },
      { item: 'uncut_ruby', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: dragon(0x8a2a24, 0xb0402e, 0x5a1a16),
  },
  black_dragon: {
    name: 'Black dragon',
    examine: 'The apex wyrmling. Its fire is a rumour you survive once.',
    stats: { att: 64, str: 68, def: 62, hp: 104 }, // lv 84
    bonuses: { att: 20, str: 20, def: 18 },
    attackType: 'slash', dragonfire: true, dragonfireMax: 48,
    speed: 5, aggroRadius: 7, wanderRadius: 4, respawnTicks: 130,
    drops: [
      { item: 'dragon_bones', count: 1, weight: 1 },
      { item: 'coins', count: [220, 550], weight: 3 },
      { item: 'runite_ore', count: [1, 3], weight: 2 },
      { item: 'rune_bar', count: [1, 2], weight: 1 },
      { item: 'uncut_ruby', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: dragon(0x1e1a1e, 0x3a2e34, 0x120e12),
  },
  kalphar_bonelord: {
    name: 'Kalphar the Bonelord',
    examine: 'A skeleton with delusions of monarchy, and the reach to enforce them.',
    stats: { att: 60, str: 62, def: 58, hp: 96 }, // lv 78
    bonuses: { att: 18, str: 18, def: 16 },
    attackType: 'crush',
    speed: 5, aggroRadius: 7, wanderRadius: 3, respawnTicks: 150,
    drops: [
      { item: 'big_bones', count: [1, 3], weight: 1 },
      { item: 'coins', count: [150, 420], weight: 3 },
      { item: 'rune_bar', count: 1, weight: 1 },
      { item: 'runite_ore', count: [1, 2], weight: 1 },
      { item: 'uncut_ruby', count: 1, weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.2,
      parts: [
        ...figure({ scale: 1.32, build: 1.2, skin: 0xe8e2d0, shirt: 0xdcd4c0, sleeve: 0xd0c8b4, pants: 0xd0c8b4, boot: 0xc4bca8, bald: true }),
        { kind: 'cone', r: 0.24, h: 0.4, seg: 6, scale: [1, 1, 0.6], at: [0, 2.06, 0], color: 0x8a8272 }, // bone crown
        { kind: 'cone', r: 0.05, h: 0.18, at: [-0.16, 2.24, 0], color: 0x8a8272 },
        { kind: 'cone', r: 0.05, h: 0.18, at: [0.16, 2.24, 0], color: 0x8a8272 },
        { kind: 'sphere', r: 0.05, detail: 0, at: [-0.1, 1.86, 0.16], color: 0x8f3fbf }, // soul-lit eyes
        { kind: 'sphere', r: 0.05, detail: 0, at: [0.1, 1.86, 0.16], color: 0x8f3fbf },
      ],
    },
  },
  sunmarch_broodmother: {
    name: 'Broodmother',
    examine: 'The desert nests answer to her. Bring a big boot.',
    stats: { att: 62, str: 66, def: 60, hp: 104 }, // lv 82
    bonuses: { att: 18, str: 20, def: 16 },
    attackType: 'stab',
    speed: 4, aggroRadius: 7, wanderRadius: 5, respawnTicks: 150,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [160, 440], weight: 3 },
      { item: 'runite_ore', count: [1, 2], weight: 1 },
      { item: 'rune_bar', count: [1, 2], weight: 1 },
      { item: 'uncut_emerald', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.2,
      parts: [
        { kind: 'ball', r: 0.6, at: [0, 0.66, 0.16], color: 0x4a2a1a },
        { kind: 'ball', r: 0.34, at: [0, 0.6, -0.6], color: 0x5a3624 },
        { kind: 'sphere', r: 0.06, detail: 0, at: [-0.12, 0.72, -0.82], color: 0xc23a3a }, // eyes
        { kind: 'sphere', r: 0.06, detail: 0, at: [0.12, 0.72, -0.82], color: 0xc23a3a },
        { kind: 'box', size: [1.7, 0.08, 0.08], at: [0, 0.5, 0.3], rotY: 0.5, color: 0x2a180e },
        { kind: 'box', size: [1.7, 0.08, 0.08], at: [0, 0.5, 0.08], rotY: -0.5, color: 0x2a180e },
        { kind: 'box', size: [1.7, 0.08, 0.08], at: [0, 0.5, -0.14], rotY: 0.4, color: 0x2a180e },
        { kind: 'box', size: [1.7, 0.08, 0.08], at: [0, 0.5, -0.36], rotY: -0.4, color: 0x2a180e },
      ],
    },
  },
  abyssal_warden: {
    name: 'Abyssal warden',
    examine: 'It guards a door that should stay shut. Blessed steel still stings it.',
    stats: { att: 68, str: 70, def: 64, hp: 112 }, // lv 88
    bonuses: { att: 22, str: 22, def: 18 },
    attackType: 'crush', demon: true,
    speed: 5, aggroRadius: 7, wanderRadius: 3, respawnTicks: 170,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [220, 600], weight: 3 },
      { item: 'ashes', count: [2, 4], weight: 2 },
      { item: 'rune_bar', count: [1, 2], weight: 1 },
      { item: 'runite_ore', count: [2, 3], weight: 1 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.5,
      parts: [
        ...figure({ scale: 1.55, build: 1.44, headScale: 1.12, skin: 0x6a1a1a, shirt: 0x4a1010, sleeve: 0x4a1010, pants: 0x300a0a, boot: 0x1a0606, bald: true }),
        { kind: 'cone', r: 0.13, h: 0.6, seg: 5, rotZ: 0.5, rotX: -0.2, at: [-0.24, 2.4, -0.04], color: 0x160808 }, // great horns
        { kind: 'cone', r: 0.13, h: 0.6, seg: 5, rotZ: -0.5, rotX: -0.2, at: [0.24, 2.4, -0.04], color: 0x160808 },
        { kind: 'sphere', r: 0.06, detail: 0, at: [-0.12, 2.14, 0.2], color: 0xff7a2a }, // eyes
        { kind: 'sphere', r: 0.06, detail: 0, at: [0.12, 2.14, 0.2], color: 0xff7a2a },
        { kind: 'box', size: [0.1, 0.7, 0.05], at: [0, 1.4, 0.36], color: 0xff6a1a }, // ember chest crack
        { kind: 'cone', r: 0.6, h: 1.0, seg: 3, scale: [1, 1, 0.07], rotZ: 0.7, rotY: 0.4, at: [-0.6, 1.6, -0.2], color: 0x3a0e0e }, // wings
        { kind: 'cone', r: 0.6, h: 1.0, seg: 3, scale: [1, 1, 0.07], rotZ: -0.7, rotY: -0.4, at: [0.6, 1.6, -0.2], color: 0x3a0e0e },
      ],
    },
  },
  frost_monarch: {
    name: 'Frost monarch',
    examine: 'Rules the deep ice. The realm’s coldest, hardest kill.',
    stats: { att: 70, str: 72, def: 66, hp: 118 }, // lv 92
    bonuses: { att: 22, str: 24, def: 20 },
    attackType: 'crush',
    speed: 5, aggroRadius: 8, wanderRadius: 3, respawnTicks: 190,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [260, 700], weight: 3 },
      { item: 'coldiron_ore', count: [2, 4], weight: 2 },
      { item: 'rune_bar', count: [1, 2], weight: 1 },
      { item: 'runite_ore', count: [2, 3], weight: 1 },
      { item: 'uncut_ruby', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.4,
      parts: [
        ...figure({ scale: 1.48, build: 1.4, headScale: 1.1, skin: 0xbfe0ec, shirt: 0x9ac8dc, sleeve: 0x88b8d0, pants: 0x6ea0bc, boot: 0x5a8ca8, bald: true }),
        { kind: 'cone', r: 0.1, h: 0.5, at: [-0.18, 2.28, 0], color: 0xe8f8ff }, // ice crown
        { kind: 'cone', r: 0.12, h: 0.62, at: [0, 2.36, 0], color: 0xe8f8ff },
        { kind: 'cone', r: 0.1, h: 0.5, at: [0.18, 2.28, 0], color: 0xe8f8ff },
        { kind: 'sphere', r: 0.05, detail: 0, at: [-0.11, 2.02, 0.18], color: 0x3aa8e0 }, // eyes
        { kind: 'sphere', r: 0.05, detail: 0, at: [0.11, 2.02, 0.18], color: 0x3aa8e0 },
        { kind: 'cone', r: 0.14, h: 0.9, rotX: 0.4, rotZ: 0.3, at: [0.6, 1.5, 0.2], color: 0xcfeefb }, // ice staff
      ],
    },
  },

  // ---- The Undervault bestiary (crystal cavern, lv 22-73) ----
  cave_crawler: {
    name: 'Cave crawler',
    examine: 'Too many legs, all of them quiet.',
    stats: { att: 17, str: 18, def: 16, hp: 30 }, // lv 22
    bonuses: { att: 4, str: 4, def: 4 },
    attackType: 'stab',
    speed: 4, aggroRadius: 5, wanderRadius: 4, respawnTicks: 45,
    drops: [{ item: 'bones', count: 1, weight: 1 }, { item: 'coins', count: [4, 18], weight: 3 }, { item: 'guam_seed', count: 1, weight: 2 }, { weight: 2 }],
    alwaysDrops: 1,
    model: {
      height: 0.6,
      parts: [
        { kind: 'ball', r: 0.3, at: [0, 0.32, 0], color: 0x4a4458 },
        { kind: 'ball', r: 0.18, at: [0, 0.3, -0.34], color: 0x5a5468 },
        { kind: 'sphere', r: 0.04, detail: 0, at: [-0.08, 0.36, -0.48], color: 0x7ac8d8 },
        { kind: 'sphere', r: 0.04, detail: 0, at: [0.08, 0.36, -0.48], color: 0x7ac8d8 },
        { kind: 'box', size: [0.8, 0.05, 0.05], at: [0, 0.22, 0.1], rotY: 0.5, color: 0x322e3e },
        { kind: 'box', size: [0.8, 0.05, 0.05], at: [0, 0.22, -0.06], rotY: -0.5, color: 0x322e3e },
        { kind: 'box', size: [0.8, 0.05, 0.05], at: [0, 0.22, -0.2], rotY: 0.4, color: 0x322e3e },
      ],
    },
  },
  crystal_scuttler: {
    name: 'Crystal scuttler',
    examine: 'A beetle that ate the cavern and grew opinions.',
    stats: { att: 36, str: 38, def: 32, hp: 54 }, // lv 45
    bonuses: { att: 8, str: 8, def: 10 },
    attackType: 'crush',
    speed: 5, aggroRadius: 5, wanderRadius: 4, respawnTicks: 55,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'coins', count: [10, 40], weight: 3 },
      { item: 'uncut_sapphire', count: 1, weight: 2 },
      { item: 'uncut_emerald', count: 1, weight: 1 },
      { item: 'coal', count: [1, 2], weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 0.9,
      parts: [
        { kind: 'sphere', r: 0.42, scale: [1.2, 0.7, 1.35], at: [0, 0.42, 0], color: 0x3a3448 },
        { kind: 'cone', r: 0.14, h: 0.5, at: [-0.16, 0.85, 0.05], color: 0x7ac8d8 },  // crystal growths
        { kind: 'cone', r: 0.12, h: 0.42, at: [0.18, 0.8, -0.12], color: 0x9a6ad8 },
        { kind: 'cone', r: 0.1, h: 0.34, at: [0, 0.78, 0.25], color: 0x7ac8d8 },
        { kind: 'box', size: [0.24, 0.16, 0.2], at: [0, 0.34, -0.6], color: 0x4a4458 },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [-0.3, 0.15, 0.2], color: 0x322e3e },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [0.3, 0.15, 0.2], color: 0x322e3e },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [-0.3, 0.15, -0.24], color: 0x322e3e },
        { kind: 'cyl', rt: 0.05, rb: 0.04, h: 0.3, at: [0.3, 0.15, -0.24], color: 0x322e3e },
      ],
    },
  },
  deep_troll: {
    name: 'Deep troll',
    examine: 'Never seen the sun. Would fight it if it had.',
    stats: { att: 46, str: 48, def: 42, hp: 66 }, // lv 57
    bonuses: { att: 12, str: 14, def: 12 },
    attackType: 'crush',
    speed: 6, aggroRadius: 5, wanderRadius: 4, respawnTicks: 75,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [20, 60], weight: 3 },
      { item: 'adamantite_ore', count: 1, weight: 1 },
      { item: 'limpwurt_root', count: 1, weight: 2 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 2.2,
      parts: [
        ...figure({ scale: 1.38, build: 1.48, headScale: 1.1, skin: 0x6a6a78, shirt: 0x55556a, sleeve: 0x55556a, pants: 0x44445a, hair: 0x3a3a4c, boot: 0x30303e, bald: true }),
        { kind: 'sphere', r: 0.15, scale: [1, 0.65, 1], at: [-0.35, 1.86, -0.04], color: 0x7a7a8c },
        { kind: 'sphere', r: 0.15, scale: [1, 0.65, 1], at: [0.36, 1.82, -0.04], color: 0x7a7a8c },
        { kind: 'cone', r: 0.05, h: 0.16, rotX: 3.14, at: [-0.1, 1.58, 0.16], color: 0xd8d4e0 },
        { kind: 'cone', r: 0.05, h: 0.16, rotX: 3.14, at: [0.1, 1.58, 0.16], color: 0xd8d4e0 },
      ],
    },
  },
  gloom_stalker: {
    name: 'Gloom stalker',
    examine: 'The dark between the crystals, gone hunting.',
    stats: { att: 58, str: 62, def: 54, hp: 84 }, // lv 73
    bonuses: { att: 16, str: 16, def: 14 },
    attackType: 'slash',
    speed: 4, aggroRadius: 6, wanderRadius: 5, respawnTicks: 95,
    drops: [
      { item: 'big_bones', count: 1, weight: 1 },
      { item: 'coins', count: [40, 140], weight: 3 },
      { item: 'runite_ore', count: 1, weight: 1 },
      { item: 'ranarr', count: 1, weight: 1 },
      { item: 'irit_seed', count: 1, weight: 1 },
      { item: 'clue_scroll', count: 1, weight: 1 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.9,
      parts: [
        { kind: 'box', size: [0.46, 1.0, 0.3], at: [0, 1.0, 0], color: 0x1e1a28 },
        { kind: 'box', size: [0.3, 0.3, 0.3], at: [0, 1.66, 0], color: 0x2a2438 },
        { kind: 'sphere', r: 0.05, detail: 0, at: [-0.08, 1.7, 0.14], color: 0x9a6ad8 },
        { kind: 'sphere', r: 0.05, detail: 0, at: [0.08, 1.7, 0.14], color: 0x9a6ad8 },
        { kind: 'box', size: [0.13, 0.85, 0.16], at: [-0.32, 0.95, 0], color: 0x16121e },
        { kind: 'box', size: [0.13, 0.85, 0.16], at: [0.32, 0.95, 0], color: 0x16121e },
        { kind: 'cone', r: 0.09, h: 0.5, seg: 5, rotZ: 0.5, at: [-0.2, 2.0, -0.05], color: 0x0e0a14 },
        { kind: 'cone', r: 0.09, h: 0.5, seg: 5, rotZ: -0.5, at: [0.2, 2.0, -0.05], color: 0x0e0a14 },
      ],
    },
  },

  // Night-only: pale things that keep pace along the roads after 20:00.
  night_wraith: {
    name: 'Night wraith',
    examine: 'It has no face, and still you know it is looking at you.',
    stats: { att: 28, str: 30, def: 26, hp: 44 }, // lv 36
    bonuses: { att: 8, str: 8, def: 6 },
    attackType: 'slash',
    speed: 4, aggroRadius: 6, wanderRadius: 6, respawnTicks: 60,
    drops: [
      { item: 'bones', count: 1, weight: 1 },
      { item: 'coins', count: [8, 34], weight: 3 },
      { item: 'spirit_glyph', count: [2, 5], weight: 2 },
      { item: 'ranarr_seed', count: 1, weight: 1 }, { weight: 2 },
    ],
    alwaysDrops: 1,
    model: {
      height: 1.7,
      parts: [
        { kind: 'cyl', rt: 0.16, rb: 0.42, h: 1.35, seg: 8, at: [0, 0.85, 0], color: 0xcfd8dc },
        { kind: 'sphere', r: 0.16, at: [0, 1.62, 0], color: 0xe4ecf0 },
        { kind: 'box', size: [0.2, 0.1, 0.1], at: [0, 1.58, 0.1], color: 0x8a98a2 }, // the not-face
        { kind: 'cyl', rt: 0.04, rb: 0.04, h: 0.5, rotZ: 0.3, at: [-0.26, 1.1, 0.02], color: 0xcfd8dc },
        { kind: 'cyl', rt: 0.04, rb: 0.04, h: 0.5, rotZ: -0.3, at: [0.26, 1.1, 0.02], color: 0xcfd8dc },
      ],
    },
  },

  // The villain of the arc: Malgrim, master of the severed circle.
  malgrim: {
    name: 'Malgrim',
    examine: 'The hand that severed the circle, the voice beneath Corvath. Done hiding.',
    stats: { att: 70, str: 74, def: 66, hp: 220 },
    bonuses: { att: 22, str: 22, def: 20 },
    attackType: 'magic', attackRange: 7, projectileColor: 0x8f2fbf,
    boss: true, enrage: 0.55, specialChance: 0.2,
    onDeathQuest: ['the_last_circle', 2, 3],
    speed: 4, aggroRadius: 9, wanderRadius: 2, respawnTicks: 300,
    drops: [],
    alwaysDrops: 0,
    model: {
      height: 2.15,
      parts: [
        { kind: 'cyl', rt: 0.2, rb: 0.5, h: 1.65, seg: 10, at: [0, 0.95, 0], color: 0x241a30 }, // great robe
        { kind: 'sphere', r: 0.17, at: [0, 1.86, 0.02], color: 0xd6d0dc },                        // pale head
        { kind: 'cone', r: 0.26, h: 0.5, seg: 8, at: [0, 2.12, -0.02], color: 0x1a1226 },         // high cowl
        { kind: 'sphere', r: 0.045, detail: 0, at: [-0.07, 1.9, 0.15], color: 0x8f2fbf },         // burning eyes
        { kind: 'sphere', r: 0.045, detail: 0, at: [0.07, 1.9, 0.15], color: 0x8f2fbf },
        { kind: 'box', size: [0.16, 0.55, 0.05], at: [0, 1.15, 0.26], color: 0x8f2f4a },          // sigil stole
        { kind: 'cyl', rt: 0.05, rb: 0.05, h: 0.6, rotZ: 0.2, at: [-0.3, 1.15, 0.05], color: 0x241a30 }, // sleeves
        { kind: 'cyl', rt: 0.05, rb: 0.05, h: 0.6, rotZ: -0.2, at: [0.3, 1.15, 0.05], color: 0x241a30 },
        { kind: 'cyl', rt: 0.035, rb: 0.035, h: 1.9, rotZ: 0.12, at: [0.44, 1.15, 0.06], color: 0x16101e }, // black staff
        { kind: 'sphere', r: 0.11, detail: 0, at: [0.47, 2.14, 0.06], color: 0x8f2fbf },          // staff void-gem
        // orbiting shard crown
        { kind: 'cone', r: 0.05, h: 0.22, rotZ: 0.9, at: [-0.34, 2.2, 0], color: 0x9a6ad8 },
        { kind: 'cone', r: 0.05, h: 0.22, rotZ: -0.9, at: [0.34, 2.24, 0], color: 0x7ac8d8 },
        { kind: 'cone', r: 0.05, h: 0.22, rotX: 0.9, at: [0, 2.3, -0.3], color: 0x9a6ad8 },
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
      height: 2.05,
      parts: [
        // gaunt noble in black, tall and slim, deathly-pale face
        ...figure({ scale: 1.16, build: 0.86, skin: 0xd6d0dc, shirt: 0x241f2c, sleeve: 0x1f1a26, pants: 0x18141e, hair: 0x100c16, boot: 0x0c0a12, headScale: 0.94 }),
        // floor-length cloak: a dark flared drape behind, blood-red lining
        { kind: 'cone', r: 0.62, h: 1.75, seg: 10, scale: [1.15, 1, 0.32], at: [0, 0.9, -0.16], color: 0x14111c },
        { kind: 'cone', r: 0.5, h: 1.55, seg: 8, scale: [1.05, 1, 0.22], at: [0, 0.86, -0.02], color: 0x5a0e1c },
        // high vampiric collar rising behind the head
        { kind: 'cone', r: 0.17, h: 0.5, seg: 6, scale: [1, 1, 0.35], rotX: -0.5, at: [-0.17, 1.62, -0.16], color: 0x120a16 },
        { kind: 'cone', r: 0.17, h: 0.5, seg: 6, scale: [1, 1, 0.35], rotX: -0.5, at: [0.17, 1.62, -0.16], color: 0x120a16 },
        // red chest V + glowing eyes
        { kind: 'box', size: [0.18, 0.42, 0.05], at: [0, 1.22, 0.16], color: 0x5a0e1c },
        { kind: 'sphere', r: 0.035, detail: 0, at: [-0.07, 1.58, 0.15], color: 0xe23636 },
        { kind: 'sphere', r: 0.035, detail: 0, at: [0.07, 1.58, 0.15], color: 0xe23636 },
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
      height: 2.9,
      parts: [
        // huge charred demon, broad and bald, ember-lit
        ...figure({ scale: 1.68, build: 1.42, skin: 0x3a1414, shirt: 0x4a1614, sleeve: 0x3a1212, pants: 0x280e0e, boot: 0x180808, bald: true, headScale: 1.12 }),
        // great swept horns
        { kind: 'cone', r: 0.14, h: 0.85, seg: 6, rotZ: 0.55, rotX: -0.25, at: [-0.26, 2.6, -0.05], color: 0x120808 },
        { kind: 'cone', r: 0.14, h: 0.85, seg: 6, rotZ: -0.55, rotX: -0.25, at: [0.26, 2.6, -0.05], color: 0x120808 },
        // burning eyes + brow
        { kind: 'sphere', r: 0.06, detail: 0, at: [-0.11, 2.34, 0.26], color: 0xffa32a },
        { kind: 'sphere', r: 0.06, detail: 0, at: [0.11, 2.34, 0.26], color: 0xffa32a },
        // ember cracks blazing across the chest + belly
        { kind: 'box', size: [0.09, 0.7, 0.05], at: [0, 1.55, 0.4], color: 0xff7a1e },
        { kind: 'box', size: [0.52, 0.08, 0.05], at: [0, 1.72, 0.4], color: 0xff7a1e },
        { kind: 'box', size: [0.34, 0.08, 0.05], at: [-0.02, 1.32, 0.41], rotZ: 0.5, color: 0xf06a1a },
        { kind: 'box', size: [0.3, 0.07, 0.05], at: [0.16, 1.46, 0.41], rotZ: -0.6, color: 0xf06a1a },
        { kind: 'sphere', r: 0.09, detail: 0, at: [0, 0.95, 0.42], color: 0xff8a2a }, // ember core
        // jagged shoulder + back spikes
        { kind: 'cone', r: 0.14, h: 0.5, seg: 5, rotX: -0.7, at: [-0.56, 2.02, -0.12], color: 0x120808 },
        { kind: 'cone', r: 0.14, h: 0.5, seg: 5, rotX: -0.7, at: [0.56, 2.02, -0.12], color: 0x120808 },
        { kind: 'cone', r: 0.1, h: 0.34, at: [0, 2.0, -0.2], color: 0x180a0a },
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
      height: 2.75,
      parts: [
        // barrel body (chest thick at front -z, hips narrower at back +z)
        { kind: 'cyl', rt: 0.56, rb: 0.34, h: 1.9, seg: 12, rotX: 1.5708, at: [0, 1.05, 0.15], color: 0x6a2418 },
        { kind: 'cyl', rt: 0.42, rb: 0.24, h: 1.75, seg: 10, scale: [1, 0.5, 1], rotX: 1.5708, at: [0, 0.74, 0.15], color: 0xc24e1a }, // glowing ember belly
        // long serpentine neck (two segments) rising up and forward
        { kind: 'cyl', rt: 0.36, rb: 0.28, h: 0.85, seg: 10, rotX: 0.95, at: [0, 1.6, -0.7], color: 0x7a2c1a },
        { kind: 'cyl', rt: 0.28, rb: 0.24, h: 0.78, seg: 10, rotX: 0.42, at: [0, 2.2, -1.28], color: 0x7a2c1a },
        // elongated head, clearly the highest point of the silhouette
        { kind: 'sphere', r: 0.37, scale: [1, 0.95, 1.5], at: [0, 2.52, -1.74], color: 0x7a2c1a },
        { kind: 'box', size: [0.34, 0.2, 0.52], at: [0, 2.44, -2.16], color: 0x8a3a20 }, // snout / upper jaw
        { kind: 'box', size: [0.3, 0.12, 0.44], at: [0, 2.28, -2.12], color: 0x261008 }, // lower jaw
        { kind: 'box', size: [0.24, 0.1, 0.3], at: [0, 2.35, -2.06], color: 0xff8a2a }, // glowing maw
        { kind: 'cone', r: 0.03, h: 0.11, rotX: 3.14, at: [-0.1, 2.33, -2.32], color: 0xe8e0d0 }, // fangs
        { kind: 'cone', r: 0.03, h: 0.11, rotX: 3.14, at: [0.1, 2.33, -2.32], color: 0xe8e0d0 },
        // great swept-back horns, brow spikes, glowing eyes
        { kind: 'cone', r: 0.1, h: 0.82, seg: 5, rotX: -1.2, at: [-0.2, 2.74, -1.5], color: 0x241008 },
        { kind: 'cone', r: 0.1, h: 0.82, seg: 5, rotX: -1.2, at: [0.2, 2.74, -1.5], color: 0x241008 },
        { kind: 'cone', r: 0.05, h: 0.24, seg: 5, rotX: -0.6, at: [-0.15, 2.62, -1.92], color: 0x241008 },
        { kind: 'cone', r: 0.05, h: 0.24, seg: 5, rotX: -0.6, at: [0.15, 2.62, -1.92], color: 0x241008 },
        { kind: 'sphere', r: 0.055, detail: 0, at: [-0.18, 2.54, -2.0], color: 0xffd23a },
        { kind: 'sphere', r: 0.055, detail: 0, at: [0.18, 2.54, -2.0], color: 0xffd23a },
        // grand membranous wings: leading-edge spar + a thin triangular membrane
        { kind: 'cyl', rt: 0.05, rb: 0.02, h: 2.0, seg: 5, rotZ: -0.8, at: [-0.72, 1.95, 0.25], color: 0x3a1810 },
        { kind: 'cone', r: 1.15, h: 2.1, seg: 3, scale: [1, 1, 0.05], rotZ: 0.72, rotY: 0.3, at: [-1.02, 1.9, 0.28], color: 0x5a1e14 },
        { kind: 'cyl', rt: 0.05, rb: 0.02, h: 2.0, seg: 5, rotZ: 0.8, at: [0.72, 1.95, 0.25], color: 0x3a1810 },
        { kind: 'cone', r: 1.15, h: 2.1, seg: 3, scale: [1, 1, 0.05], rotZ: -0.72, rotY: -0.3, at: [1.02, 1.9, 0.28], color: 0x5a1e14 },
        // spinal ridge of spikes down the back
        { kind: 'cone', r: 0.1, h: 0.34, at: [0, 1.62, -0.35], color: 0x3a1810 },
        { kind: 'cone', r: 0.11, h: 0.38, at: [0, 1.64, 0.15], color: 0x3a1810 },
        { kind: 'cone', r: 0.09, h: 0.32, at: [0, 1.55, 0.62], color: 0x3a1810 },
        // long tapering tail with a spade tip
        { kind: 'cone', r: 0.3, h: 1.95, seg: 8, rotX: -1.5708, at: [0, 0.92, 1.55], color: 0x6a2418 },
        { kind: 'cone', r: 0.14, h: 0.42, seg: 5, rotX: 1.4, at: [0, 0.98, 2.45], color: 0x3a1810 },
        // four clawed legs
        { kind: 'cyl', rt: 0.17, rb: 0.12, h: 0.72, at: [-0.44, 0.36, -0.5], color: 0x5a2014 },
        { kind: 'cyl', rt: 0.17, rb: 0.12, h: 0.72, at: [0.44, 0.36, -0.5], color: 0x5a2014 },
        { kind: 'cyl', rt: 0.19, rb: 0.13, h: 0.72, at: [-0.48, 0.36, 0.7], color: 0x5a2014 },
        { kind: 'cyl', rt: 0.19, rb: 0.13, h: 0.72, at: [0.48, 0.36, 0.7], color: 0x5a2014 },
        { kind: 'box', size: [0.32, 0.12, 0.34], at: [-0.44, 0.06, -0.58], color: 0x261008 },
        { kind: 'box', size: [0.32, 0.12, 0.34], at: [0.44, 0.06, -0.58], color: 0x261008 },
        { kind: 'box', size: [0.34, 0.12, 0.36], at: [-0.48, 0.06, 0.78], color: 0x261008 },
        { kind: 'box', size: [0.34, 0.12, 0.36], at: [0.48, 0.06, 0.78], color: 0x261008 },
      ],
    },
  },
};

// Herblore supply: append a low-weight herb/secondary drop to themed mobs, so
// each herb has a level-appropriate source (guam low -> irit high). The item
// ids resolve against ITEMS (generated from the HERBLORE table in items.js).
const HERB_DROPS = {
  goblin: 'guam', giant_rat: 'guam', skeleton: 'tarromin', zombie: 'harralander',
  guard: 'harralander', ghoul: 'ranarr', moss_giant: 'marrentill', hill_giant: 'irit',
  ashfiend: 'irit', wild_dog: 'wolf_bone', giant_spider: 'snape_grass', bear: 'snape_grass',
};
for (const [mob, item] of Object.entries(HERB_DROPS)) {
  if (MOBS[mob]) MOBS[mob].drops.push({ item, count: 1, weight: 2 });
}

// Treasure trails: a rare clue scroll on the mid-tier bestiary (weight 1
// against rest-totals of ~9-12, so roughly a 1-in-10 roll where present).
for (const mob of ['guard', 'skeleton', 'zombie', 'hobgoblin', 'ghoul', 'moss_giant',
  'ice_fiend', 'hill_giant', 'lesser_demon', 'troll']) {
  if (MOBS[mob]) MOBS[mob].drops.push({ item: 'clue_scroll', count: 1, weight: 1 });
}

// Farming: seeds fall where the level band suits the crop (see data/farming.js).
const SEED_DROPS = {
  goblin: 'wheat_seed', barbarian: 'guam_seed', hobgoblin: 'tarromin_seed',
  guard: 'harralander_seed', ghoul: 'ranarr_seed', troll: 'marrentill_seed',
  lesser_demon: 'irit_seed', wild_dog: 'wheat_seed',
};
for (const [mob, seed] of Object.entries(SEED_DROPS)) {
  if (MOBS[mob]) MOBS[mob].drops.push({ item: seed, count: [1, 2], weight: 2 });
}
