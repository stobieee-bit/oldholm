// OLDHOLM — Rebuild Brinkton. The Construction capstone project: the burned
// edge-town by the Blight is raised again stage by stage, and repopulates as
// you go. Each stage is real materials, real coins, real Construction xp —
// spent at the rebuilding board the survivor keeps by the signpost.

export const BRINKTON_STAGES = [
  {
    key: 'well', name: 'The Well', req: 5,
    mats: { logs: 8 }, coins: 300, xp: 300,
    done: 'Clean water rises in Brinkton again. Someone is already back to drink it.',
    spawns: [{ npc: 'villager_man', x: 194.5, z: 28.5 }],
  },
  {
    key: 'cottages', name: 'Cottage Row', req: 20,
    mats: { oak_logs: 12, iron_bar: 4 }, coins: 1200, xp: 800,
    done: 'Two cottages stand where the ash blew through. Windows glow at dusk.',
    buildings: [
      { x0: 178, z0: 28, x1: 184, z1: 34, doorSide: 'e', name: 'Rebuilt cottage',
        examine: 'New timber over old scorch marks. Home.' },
      { x0: 186, z0: 28, x1: 192, z1: 34, doorSide: 'w', name: 'Rebuilt cottage',
        examine: 'The hearth inside is lit every evening now.' },
    ],
    spawns: [
      { npc: 'villager_woman', x: 185.2, z: 31.5 },
      { npc: 'villager_man', x: 190.5, z: 26.8 },
    ],
  },
  {
    key: 'barracks', name: 'The Ashguard Barracks', req: 35,
    mats: { willow_logs: 14, steel_bar: 6 }, coins: 3000, xp: 1600,
    done: 'The Ashguard has a roof. The Blight, for once, has a problem.',
    buildings: [
      { x0: 196, z0: 28, x1: 204, z1: 36, doorSide: 'w', name: 'Ashguard barracks',
        examine: 'Boots by the door, blades by the boots.' },
    ],
    spawns: [
      { npc: 'guard', x: 195.0, z: 30.5 },
      { npc: 'guard', x: 195.0, z: 34.5 },
    ],
  },
  {
    key: 'hall', name: 'The Beacon Hall', req: 50,
    mats: { yew_logs: 16, mithril_bar: 8 }, coins: 8000, xp: 3200,
    done: 'The Beacon Hall stands, and its fire says what words cannot: Brinkton endures.',
    buildings: [
      { x0: 184, z0: 12, x1: 198, z1: 18, doorSide: 's', name: 'The Beacon Hall',
        examine: 'Raised from ash by one stubborn pair of hands. The reeve is still amazed.' },
    ],
    spawns: [{ npc: 'brinkton_reeve', x: 191.5, z: 20.5 }],
  },
];

export const BOARD = { x: 194.5, z: 31.5 };
