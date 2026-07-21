// OLDHOLM — pets: rare companion drops. A pet is an inventory item; Summon
// turns it into a little follower (src/pets.js). Pure charm, zero combat.

export const PETS = {
  pet_wyrmling: {
    name: 'Wyrmling', examine: 'A dragon the size of a regret. It thinks you are its hoard.',
    model: {
      height: 0.5,
      parts: [
        { kind: 'cyl', rt: 0.14, rb: 0.1, h: 0.4, seg: 8, rotX: 1.5708, at: [0, 0.22, 0.02], color: 0x8a2a24 },
        { kind: 'sphere', r: 0.11, scale: [1, 0.9, 1.3], at: [0, 0.34, -0.26], color: 0x8a2a24 },
        { kind: 'sphere', r: 0.03, detail: 0, at: [-0.05, 0.38, -0.34], color: 0xffd23a },
        { kind: 'sphere', r: 0.03, detail: 0, at: [0.05, 0.38, -0.34], color: 0xffd23a },
        { kind: 'cone', r: 0.16, h: 0.3, seg: 3, scale: [1, 1, 0.08], rotZ: 0.9, at: [-0.16, 0.36, 0.05], color: 0x5a1e14 },
        { kind: 'cone', r: 0.16, h: 0.3, seg: 3, scale: [1, 1, 0.08], rotZ: -0.9, at: [0.16, 0.36, 0.05], color: 0x5a1e14 },
        { kind: 'cone', r: 0.05, h: 0.3, seg: 5, rotX: -1.5708, at: [0, 0.2, 0.32], color: 0x6a1e18 },
      ],
    },
  },
  pet_void_sprite: {
    name: 'Void sprite', examine: 'A scrap of Malgrim’s dark that decided it liked you better.',
    model: {
      height: 0.55,
      parts: [
        { kind: 'sphere', r: 0.14, detail: 0, at: [0, 0.4, 0], color: 0x241a30 },
        { kind: 'sphere', r: 0.045, detail: 0, at: [-0.05, 0.44, -0.1], color: 0x8f2fbf },
        { kind: 'sphere', r: 0.045, detail: 0, at: [0.05, 0.44, -0.1], color: 0x8f2fbf },
        { kind: 'cone', r: 0.04, h: 0.14, rotZ: 0.6, at: [-0.12, 0.55, 0], color: 0x9a6ad8 },
        { kind: 'cone', r: 0.04, h: 0.14, rotZ: -0.6, at: [0.12, 0.55, 0], color: 0x9a6ad8 },
      ],
    },
  },
  pet_rock_golem: {
    name: 'Rock golem chick', examine: 'A pebble with ambitions and, apparently, legs.',
    model: {
      height: 0.45,
      parts: [
        { kind: 'sphere', r: 0.16, detail: 0, at: [0, 0.26, 0], color: 0x8a8a82 },
        { kind: 'sphere', r: 0.1, detail: 0, at: [0, 0.44, -0.05], color: 0x9a9a92 },
        { kind: 'sphere', r: 0.03, detail: 0, at: [-0.04, 0.46, -0.13], color: 0x2a2624 },
        { kind: 'sphere', r: 0.03, detail: 0, at: [0.04, 0.46, -0.13], color: 0x2a2624 },
        { kind: 'box', size: [0.08, 0.1, 0.1], at: [-0.09, 0.05, 0], color: 0x77716a },
        { kind: 'box', size: [0.08, 0.1, 0.1], at: [0.09, 0.05, 0], color: 0x77716a },
      ],
    },
  },
  pet_heron: {
    name: 'Heron', examine: 'It supervises your casts with open disappointment.',
    model: {
      height: 0.6,
      parts: [
        { kind: 'sphere', r: 0.1, scale: [1, 1.1, 1.3], at: [0, 0.34, 0], color: 0x8a98a2 },
        { kind: 'cyl', rt: 0.025, rb: 0.03, h: 0.2, at: [0, 0.5, -0.06], color: 0xd8d4e0 },
        { kind: 'sphere', r: 0.06, at: [0, 0.62, -0.08], color: 0xd8d4e0 },
        { kind: 'cone', r: 0.02, h: 0.14, rotX: -1.5708, at: [0, 0.62, -0.19], color: 0xe0b83a },
        { kind: 'cyl', rt: 0.012, rb: 0.012, h: 0.24, at: [-0.04, 0.12, 0], color: 0x2a2624 },
        { kind: 'cyl', rt: 0.012, rb: 0.012, h: 0.24, at: [0.04, 0.12, 0], color: 0x2a2624 },
      ],
    },
  },
  pet_beaver: {
    name: 'Beaver', examine: 'Judges every tree you fell. Approves of most.',
    model: {
      height: 0.4,
      parts: [
        { kind: 'sphere', r: 0.13, scale: [1, 0.9, 1.2], at: [0, 0.18, 0], color: 0x6a4a2a },
        { kind: 'sphere', r: 0.08, at: [0, 0.3, -0.14], color: 0x7a5a3a },
        { kind: 'box', size: [0.05, 0.05, 0.02], at: [0, 0.26, -0.21], color: 0xe8e0d0 },
        { kind: 'box', size: [0.1, 0.03, 0.16], at: [0, 0.1, 0.18], color: 0x4a3520 },
      ],
    },
  },
  pet_wild_pup: {
    name: 'Wild pup', examine: 'Decided the leg it wanted was yours, permanently, for company.',
    model: {
      height: 0.45,
      parts: [
        { kind: 'cyl', rt: 0.09, rb: 0.08, h: 0.3, seg: 8, rotX: 1.5708, at: [0, 0.2, 0.02], color: 0x6a5a48 },
        { kind: 'box', size: [0.12, 0.12, 0.14], at: [0, 0.28, -0.18], color: 0x6a5a48 },
        { kind: 'box', size: [0.07, 0.05, 0.07], at: [0, 0.24, -0.27], color: 0x554636 },
        { kind: 'cone', r: 0.03, h: 0.08, seg: 4, at: [-0.05, 0.37, -0.16], color: 0x554636 },
        { kind: 'cone', r: 0.03, h: 0.08, seg: 4, at: [0.05, 0.37, -0.16], color: 0x554636 },
        { kind: 'cone', r: 0.025, h: 0.16, rotX: -1.2, at: [0, 0.26, 0.18], color: 0x554636 },
      ],
    },
  },
};

// mob defId -> { pet, chance } rolled on death (independent of the drop table)
export const PET_DROPS = {
  green_dragon: { pet: 'pet_wyrmling', chance: 1 / 250 },
  blue_dragon: { pet: 'pet_wyrmling', chance: 1 / 220 },
  red_dragon: { pet: 'pet_wyrmling', chance: 1 / 190 },
  black_dragon: { pet: 'pet_wyrmling', chance: 1 / 150 },
  cindermaw: { pet: 'pet_wyrmling', chance: 1 / 40 },
  malgrim: { pet: 'pet_void_sprite', chance: 1 / 3 },
  wild_dog: { pet: 'pet_wild_pup', chance: 1 / 400 },
};

// gathering skill -> pet, rolled per xp grant at 1/PET_SKILL_CHANCE
export const PET_SKILLING = { Mining: 'pet_rock_golem', Fishing: 'pet_heron', Woodcutting: 'pet_beaver' };
export const PET_SKILL_CHANCE = 1500;
