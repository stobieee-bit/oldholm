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
      keep: { x0: 49, x1: 63, z0: 83, z1: 93, bodyH: 6, topH: 3.2 },
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

    trees: { count: 240, minSpacing: 2 },

    spawn: { x: 67.5, z: 88.5, yaw: -Math.PI / 2 }, // castle courtyard, facing the east gate
  },
};
