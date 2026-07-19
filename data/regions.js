// OLDHOLM — region definitions. All world layout is data; world.js only interprets.
// Distances are in tiles (1 tile = 1 world unit). Heights are world Y units.

export const REGIONS = {
  holmbridge: {
    id: 'holmbridge',
    name: 'Holmbridge',
    size: 192,                 // tiles per side; world spans x/z 0..192
    seed: 1337,
    waterLevel: 0,
    baseHeight: 2.0,           // mean ground height of the plains
    noise: {
      // two octaves of value noise: [frequency, amplitude]
      octaves: [[0.045, 0.9], [0.11, 0.35]],
    },
    fog: { color: 0x8ea88a, near: 14, far: 52 }, // green-grey plains haze; the fog IS the skybox
    rim: { width: 8, height: 4 },                // enclosing hills at the region border

    // The river runs north-south (along z), meandering around centerX.
    river: {
      centerX: 102,
      width: 6,                // full channel width where the bed is flat
      depth: 3.2,              // bed depth below waterLevel
      falloff: 6,              // bank slope distance beyond the channel
      meander: [[7, 0.035, 0], [3, 0.011, 2]],   // [amplitude, frequency, phase] sine terms
    },

    // Roads are polyline segments [x1, z1, x2, z2]; tiles near them are worn to dirt.
    roads: [
      [71, 88, 150, 88],       // castle gate east over the bridge toward the pasture bank
      [76, 40, 76, 140],       // north-south road just outside the gate
    ],

    // Holmbridge castle: a walled bailey with corner towers and a central keep.
    // x0..x1 / z0..z1 are corner-grid bounds (tiles x0..x1-1 are inside).
    castle: {
      x0: 40, x1: 72, z0: 72, z1: 104,
      plateauH: 2.0,           // the bailey sits on a flattened plateau
      flattenMargin: 5,
      wallH: 4.5,
      // Engine convention: the gate is always cut into the EAST wall;
      // z0..z1 are the open tile rows.
      gate: { z0: 87, z1: 89 },
      // The keep is hollow: ground floor, an upper floor (plane 1), and a
      // crenellated roof terrace (plane 2). Door east-center; stairs NW; ladder NE.
      keep: { x0: 49, x1: 63, z0: 83, z1: 93, wallH: 6.2, floorH: 3.0 },
    },

    // Stone bridge over the river, aligned with the east road. The deck's
    // z-extent, meshes, and terrain shaping are all derived from these rows.
    bridge: {
      deckH: 2.05,
      walkRows: [87, 88],      // walkable deck tile rows
      railRows: [86, 89],      // parapet tile rows (blocked)
      margin: 3,               // deck extends this far past the carved banks
      approach: 4,             // land is ramped up to the deck over this many tiles
    },

    swamp: { zStart: 148, fade: 14, sink: 1.1, sinkVar: 1.3 },

    trees: { count: 220, oaks: 16, willows: 12, minSpacing: 2 },

    // Mining outcrop southwest of the castle. rocks: [ore, dx, dz] tile offsets.
    mine: {
      x: 52, z: 122,
      rocks: [
        ['copper', -1, 0], ['copper', 1, 1], ['copper', 0, 2],
        ['tin', 2, -1], ['tin', 3, 1], ['tin', -2, 2],
        ['iron', -3, 0], ['iron', 4, 0],
        ['coal', 1, -2],
        ['gold', 5, 2],
      ],
    },

    // Smithy in the north courtyard: furnace + anvil.
    smithy: { furnace: { x: 45.5, z: 78.5 }, anvil: { x: 48.5, z: 78.5 } },

    // Tanning rack by the pasture (the tanner themselves remains a rumor).
    tanningRack: { x: 128.5, z: 88.8 },

    // The church of Aurel, east of the north road. Door on the south wall;
    // the altar inside restores prayer points.
    church: { x0: 80, x1: 89, z0: 58, z1: 65 },

    // The general store, west of the road, door facing it.
    store: { x0: 66, x1: 74, z0: 52, z1: 58 },

    // The bank chest, upstairs in the keep (per the atlas).
    bankChest: { x: 59.5, z: 87.6 },

    // Townsfolk. plane 1 = the keep's upper floor.
    npcs: [
      { npc: 'shopkeeper', x: 68.5, z: 55.5 },
      { npc: 'banker', x: 58.3, z: 88.6, plane: 1 },
      { npc: 'wizard_fenwick', x: 53.5, z: 90.5, plane: 1 },
      { npc: 'smith_hilda', x: 47.5, z: 80.5 },
      { npc: 'cook', x: 55.5, z: 90.5 },
      { npc: 'priest', x: 84.5, z: 61.5 },
      { npc: 'villager_man', x: 76.5, z: 95.5 },
      { npc: 'villager_man', x: 70.5, z: 62.5 },
      { npc: 'villager_woman', x: 77.5, z: 70.5 },
    ],

    // Fishing spots hug the west edge of the channel (x derived from the river).
    fishingSpots: [
      { type: 'net', z: 95 },
      { type: 'net', z: 101 },
      { type: 'bait', z: 76 },
      { type: 'lure', z: 71 },
    ],

    // Furniture props (interior dressing; blocks its tiles).
    furniture: [
      { kind: 'table', x: 54.0, z: 90.5, plane: 0 },
    ],

    // Cow pasture east across the bridge: rail fence with a gate gap onto the
    // road, chicken coop in its corner. Tile bounds x0..x1-1 / z0..z1-1.
    pasture: { x0: 118, z0: 74, x1: 134, z1: 87, gaps: [[125, 86], [126, 86]] },
    coop: { x: 131.5, z: 76.5 },

    // Goblin camp on the far bank, north of the road.
    goblinCamp: { x: 121, z: 56, tents: [[118.5, 54.5], [124, 54]], fire: [121, 57.5] },

    // Mob spawn points (interpreted by npc.js). Both goblin variants display
    // as "Goblin" — the level color tells them apart, as is proper.
    spawns: [
      { mob: 'cow', x: 121.5, z: 78.5 }, { mob: 'cow', x: 124.5, z: 82.5 },
      { mob: 'cow', x: 128.5, z: 77.5 }, { mob: 'cow', x: 122.5, z: 84.5 },
      { mob: 'cow', x: 130.5, z: 83.5 }, { mob: 'cow', x: 126.5, z: 79.5 },
      { mob: 'chicken', x: 130.5, z: 78.5 }, { mob: 'chicken', x: 132.5, z: 79.5 },
      { mob: 'chicken', x: 129.5, z: 75.5 }, { mob: 'chicken', x: 132.5, z: 75.5 },
      { mob: 'goblin', x: 119.5, z: 57.5 }, { mob: 'goblin', x: 122.5, z: 58.5 },
      { mob: 'goblin', x: 124.5, z: 56.5 },
      { mob: 'goblin_strong', x: 120.5, z: 55.5 }, { mob: 'goblin_strong', x: 122.5, z: 54.5 },
      { mob: 'giant_rat', x: 78.5, z: 125.5 }, { mob: 'giant_rat', x: 74.5, z: 132.5 },
      { mob: 'giant_rat', x: 80.5, z: 138.5 },
      { mob: 'spider', x: 128.5, z: 96.5 }, { mob: 'spider', x: 133.5, z: 99.5 },
      { mob: 'spider', x: 137.5, z: 94.5 },
      { mob: 'sheep', x: 120.5, z: 76.5 }, { mob: 'sheep', x: 123.5, z: 75.5 },
      { mob: 'sheep', x: 126.5, z: 77.5 },
    ],

    // Items lying about the region at boot. plane: 0 ground, 1 keep floor 2, 2 keep roof.
    // dy lifts an item off the ground (e.g. onto a table top).
    groundItems: [
      { item: 'bucket', x: 53.6, z: 90.4, plane: 0, dy: 0.84 },  // on the keep's table
      { item: 'jug', x: 54.5, z: 90.6, plane: 0, dy: 0.84 },
      { item: 'cabbage', x: 65.5, z: 84.6, plane: 0 },           // courtyard corner
      { item: 'bones', x: 69.5, z: 91.5, plane: 0 },
      { item: 'logs', x: 79.5, z: 95.5, plane: 0 },              // outside the gate
      { item: 'old_boot', x: 94.5, z: 84.5, plane: 0 },          // river bank
      { item: 'coins', count: 25, x: 58.5, z: 88.5, plane: 1 },  // keep, upstairs
      { item: 'bronze_dagger', x: 56.5, z: 88.5, plane: 2 },     // keep roof — the climb reward
      // gathering tools (respawn after being taken, so death can't strand you)
      { item: 'bronze_axe', x: 79.5, z: 93.5, respawn: 150 },        // by the trees near the gate
      { item: 'tinderbox', x: 56.5, z: 89.5, respawn: 150 },         // keep ground floor
      { item: 'bronze_pickaxe', x: 53.5, z: 120.5, respawn: 150 },   // at the mine
      { item: 'small_net', x: 92.5, z: 96.5, respawn: 150 },         // bank by the net spots
      { item: 'fishing_rod', x: 98.5, z: 76.5, respawn: 150 },       // bank by the bait spot
      { item: 'fly_rod', x: 98.5, z: 72.5, respawn: 150 },           // bank by the lure spot
      { item: 'fishing_bait', count: 30, x: 98.0, z: 75.5, respawn: 200 },
      // smithing & crafting supplies
      { item: 'hammer', x: 49.5, z: 79.5, respawn: 150 },            // at the anvil
      { item: 'chisel', x: 46.5, z: 79.8, respawn: 150 },            // by the furnace
      { item: 'ring_mould', x: 45.0, z: 79.8, respawn: 150 },
      { item: 'amulet_mould', x: 44.5, z: 78.9, respawn: 150 },
      { item: 'shears', x: 130.5, z: 77.8, respawn: 150 },           // at the coop
      { item: 'needle', x: 127.6, z: 89.5, respawn: 150 },           // by the tanning rack
      { item: 'thread', count: 40, x: 128.2, z: 89.8, respawn: 200 },
      // fletching onboarding (bows, arrows, staves & glyphs now sold in shops)
      { item: 'knife', x: 55.5, z: 89.8, respawn: 150 },             // keep ground floor
    ],

    spawn: { x: 67.5, z: 88.5, yaw: -Math.PI / 2 }, // castle courtyard, facing the east gate
  },
};
