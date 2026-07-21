// OLDHOLM — region definitions. All world layout is data; world.js only interprets.
// Distances are in tiles (1 tile = 1 world unit). Heights are world Y units.

export const REGIONS = {
  holmbridge: {
    id: 'holmbridge',
    name: 'Holmbridge',
    size: 384,                 // Phase 10: the realm quadruples; Holmbridge keeps its coords
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
      // Phase 10: the realm's highways
      [150, 88, 246, 88],      // east to the crossroads
      [246, 88, 246, 124], [246, 124, 262, 124],   // south-east to Corvath's west gate
      [246, 88, 246, 63], [246, 63, 285, 63],      // north to Whitehold's south gate
      [246, 63, 210, 28],      // north-west fork to Brinkton
      [76, 40, 58, 32],        // north-west to Skalvik
      [76, 140, 76, 204], [76, 204, 88, 210],      // south to Murkwell
      // Phase 11: roads to the wider realm
      [296, 160, 296, 214], [296, 214, 278, 244],  // Corvath south to Sunmarch's north gate
      [76, 204, 120, 260], [120, 260, 160, 300],   // Murkwell south-east to Port Gullwick
      [246, 88, 320, 100], [320, 100, 340, 120],   // crossroads east to the Blight verge
    ],
    flattens: [
      { x0: 262, z0: 94, x1: 330, z1: 160, h: 2.2, margin: 6 },  // Corvath
      { x0: 264, z0: 20, x1: 312, z1: 64, h: 2.4, margin: 6 },   // Whitehold
      { x0: 36, z0: 16, x1: 76, z1: 48, h: 2.2, margin: 5 },     // Skalvik
      { x0: 176, z0: 12, x1: 212, z1: 40, h: 2.3, margin: 5 },   // Brinkton
      { x0: 76, z0: 202, x1: 104, z1: 228, h: 1.6, margin: 5 },  // Murkwell (low, damp)
      { x0: 110, z0: 204, x1: 128, z1: 222, h: 3.4, margin: 5 }, // the manor knoll
      { x0: 256, z0: 244, x1: 320, z1: 300, h: 2.6, margin: 6 }, // Sunmarch (desert)
      { x0: 150, z0: 300, x1: 214, z1: 330, h: 1.4, margin: 5 }, // Port Gullwick (low, coastal)
      { x0: 286, z0: 336, x1: 330, z1: 366, h: 3.0, margin: 6 }, // Ashkara tribal village
    ],

    // ---- Phase 11 terrain bands ----
    // Desert around Sunmarch: sandy colour + gentle dunes.
    desert: { x0: 224, z0: 224, x1: 358, z1: 322, fade: 12, dune: 0.6 },
    // The southern sea: terrain sinks below the waterline past zStart.
    sea: { zStart: 316, fade: 18, floorH: -3.2 },
    // Islands rising from the sea. Ashkara has a volcano cone.
    islands: [
      { x: 306, z: 358, r: 30, h: 2.6, rim: 6, volcano: { r: 9, h: 7, caldera: 3 } },
    ],
    // The eastern Blight: ashen wastes, high-risk, death drops EVERYTHING.
    blight: { x0: 334, z0: 56, x1: 381, z1: 208, fade: 8, roughen: 0.8 },

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

    swamp: { zStart: 148, fade: 14, zEnd: 235, sink: 1.1, sinkVar: 1.3 },

    trees: { count: 520, oaks: 34, willows: 20, minSpacing: 2 },
    treeClusters: [
      { type: 'yew', x: 194, z: 34, count: 7, radius: 8 },      // Brinkton's yews
      { type: 'willow', x: 95, z: 221, count: 8, radius: 9 },   // Murkwell's weepers
      { type: 'tree', x: 306, z: 348, count: 16, radius: 17 },  // Ashkara jungle
    ],

    // Mining outcrop southwest of the castle. rocks: [ore, dx, dz] tile offsets.
    mine: {
      x: 52, z: 122,
      rocks: [
        ['copper', -1, 0], ['copper', 1, 1], ['copper', 0, 2],
        ['tin', 2, -1], ['tin', 3, 1], ['tin', -2, 2],
        ['iron', -3, 0], ['iron', 4, 0],
        ['coal', 1, -2],
        ['gold', 5, 2],
        ['slate', -4, 3],
      ],
    },

    // Smithy in the north courtyard: furnace + anvil.
    smithy: { furnace: { x: 45.5, z: 78.5 }, anvil: { x: 48.5, z: 78.5 } },

    // Tanning rack by the pasture (the tanner themselves remains a rumor).
    // (Nudged off the eastern highway when the realm grew in Phase 10.)
    tanningRack: { x: 128.5, z: 90.4 },

    // The church of Aurel, east of the north road. Door on the south wall;
    // the altar inside restores prayer points.
    church: { x0: 80, x1: 89, z0: 58, z1: 65 },

    // The general store, west of the road, door facing it.
    store: { x0: 66, x1: 74, z0: 52, z1: 58 },

    // The bank chest, upstairs in the keep (per the atlas).
    bankChest: { x: 59.5, z: 87.6 },

    // ---- Phase 10: the wider realm ----
    towns: [
      {
        id: 'corvath', bounds: { x0: 262, z0: 94, x1: 330, z1: 160 },
        wall: { x0: 262, z0: 94, x1: 330, z1: 160, h: 5, gates: [{ side: 'w', at: 122, w: 4 }, { side: 'e', at: 122, w: 4 }] },
        buildings: [
          { x0: 282, z0: 96, x1: 312, z1: 108, doorSide: 's', h: 5, color: 0xa8a29a,
            name: 'Palace of Corvath', examine: 'Where the realm’s paperwork goes to be signed twice.' },
          { x0: 266, z0: 116, x1: 276, z1: 124, doorSide: 'e', contains: ['bankChest'],
            name: 'Bank of Aldera — West', examine: 'The west vault. Same gold, different door.' },
          { x0: 316, z0: 116, x1: 326, z1: 124, doorSide: 'w', contains: ['bankChest'],
            name: 'Bank of Aldera — East', examine: 'The east vault. Probably safe. Officially.' },
          { x0: 266, z0: 132, x1: 276, z1: 140, doorSide: 'e', contains: ['counter'],
            name: 'The Honed Edge', examine: 'Corvath’s sword shop. The stock hums faintly.' },
          { x0: 316, z0: 132, x1: 326, z1: 140, doorSide: 'w', contains: ['counter'],
            name: 'The Third Eye Emporium', examine: 'Corvath’s staff shop. Smells of ozone and incense.' },
          { x0: 284, z0: 142, x1: 296, z1: 152, doorSide: 'n', color: 0xa8a29a,
            name: 'Church of Aurel — Corvath', examine: 'A grander ledger for a grander flock.' },
          { x0: 300, z0: 142, x1: 312, z1: 152, doorSide: 'n', contains: ['anvil', 'furnace'],
            name: 'The Anvil District', examine: 'Legally one building, spiritually a district.' },
          { x0: 266, z0: 96, x1: 280, z1: 108, doorSide: 's', h: 4, color: 0x8a6a42,
            name: 'The Rusty Flagon', examine: 'Corvath’s tavern. Sticky floors, honest ale.' },
          { x0: 314, z0: 96, x1: 328, z1: 108, doorSide: 's', h: 5, color: 0xb0a878,
            name: "Champions' Guild", examine: 'Twelve quest points buys the door. Glory is extra.' },
        ],
        props: [
          { kind: 'fountain', x: 296.5, z: 126.5 },
          { kind: 'stall', x: 291.5, z: 121.5, name: 'Market stall', awning: 0xc23a5a,
            examine: 'The Grand Market: where prices drift and hopes follow.' },
          { kind: 'stall', x: 301.5, z: 130.5, name: 'Market stall', awning: 0x3a5fbf },
        ],
      },
      {
        id: 'whitehold', bounds: { x0: 264, z0: 20, x1: 312, z1: 64 },
        wall: { x0: 264, z0: 20, x1: 312, z1: 64, h: 5, wallColor: 0xd8d8d2, gates: [{ side: 's', at: 284, w: 3 }] },
        wallColor: 0xd8d8d2,
        buildings: [
          { x0: 272, z0: 24, x1: 292, z1: 34, doorSide: 's', h: 4.2, color: 0xd8d8d2,
            name: 'Hall of the Pale Shield', examine: 'Stately. The knights polish it out of principle.' },
          { x0: 296, z0: 40, x1: 306, z1: 50, doorSide: 'w', color: 0xd8d8d2,
            name: 'Mining Guild', examine: 'Members descend. Others admire the door.' },
        ],
        props: [
          { kind: 'statue', x: 288.5, z: 42.5, name: 'Statue of the First Shield',
            examine: 'She holds her shield toward the north, where the trouble is.' },
        ],
      },
      {
        id: 'skalvik', bounds: { x0: 36, z0: 16, x1: 76, z1: 48 },
        buildings: [
          { x0: 40, z0: 20, x1: 52, z1: 26, doorSide: 's', color: 0x8a6a42, name: 'Longhouse',
            examine: 'Smoke, snoring, and songs about both.' },
          { x0: 40, z0: 30, x1: 52, z1: 36, doorSide: 's', color: 0x8a6a42, name: 'Longhouse',
            examine: 'The beds are benches. The benches are beds.' },
          { x0: 58, z0: 22, x1: 70, z1: 28, doorSide: 'w', color: 0x8a6a42, name: 'Longhouse',
            examine: 'Somebody is arm-wrestling in there. Always.' },
          { x0: 58, z0: 32, x1: 68, z1: 40, doorSide: 'n', contains: ['counter'], color: 0x8a6a42,
            name: 'Helm & Hearth', examine: 'Skalvik’s helmet shop. Hats for hitting.' },
        ],
        props: [{ kind: 'firepit', x: 55.5, z: 43.5 }],
      },
      {
        id: 'brinkton', bounds: { x0: 176, z0: 12, x1: 212, z1: 40 },
        buildings: [
          { x0: 180, z0: 18, x1: 190, z1: 26, doorSide: 's', contains: ['bankChest'],
            name: 'Bank of Aldera — Brinkton', examine: 'The last vault before the ash. Sleep well.' },
          { x0: 196, z0: 18, x1: 206, z1: 26, doorSide: 's', contains: ['counter'],
            name: 'The Last Shelf', examine: 'Brinkton’s general store. Stocked for regret.' },
        ],
        props: [
          { kind: 'signpost', x: 208.5, z: 30.5, arms: 2,
            examine: 'North: THE BLIGHT (closed for your safety). South: everything nicer.' },
        ],
      },
      {
        id: 'murkwell', bounds: { x0: 76, z0: 202, x1: 128, z1: 228 },
        buildings: [
          { x0: 80, z0: 206, x1: 90, z1: 214, doorSide: 'e', contains: ['bankChest'], color: 0x77716a,
            name: 'Bank of Aldera — Murkwell', examine: 'Damp, but the ledgers are dry. Priorities.' },
          { x0: 94, z0: 206, x1: 102, z1: 214, doorSide: 'w', contains: ['counter'], color: 0x77716a,
            name: 'The Humble Market', examine: 'Murkwell’s shop. Everything smells faintly of pond.' },
          { x0: 80, z0: 218, x1: 88, z1: 226, doorSide: 'n', color: 0x6a6a72,
            name: 'Murkwell Jail', examine: 'Currently between guests. The bars stay optimistic.' },
          { x0: 112, z0: 206, x1: 126, z1: 220, doorSide: 'w', h: 4.6, color: 0x5a5a62,
            name: 'Ravenmoor Manor', examine: 'The hill house sleeps. Something in it sleeps lighter.' },
        ],
        props: [
          { kind: 'signpost', x: 90.5, z: 204.5, arms: 2,
            examine: 'North: Holmbridge, sunshine, cows. Here: Murkwell. Adjust expectations.' },
        ],
      },
      {
        id: 'sunmarch', bounds: { x0: 256, z0: 244, x1: 320, z1: 300 },
        wall: { x0: 256, z0: 244, x1: 320, z1: 300, h: 4.5, wallColor: 0xcaa96a, gates: [{ side: 'n', at: 284, w: 3 }] },
        wallColor: 0xcaa96a,
        buildings: [
          { x0: 264, z0: 250, x1: 276, z1: 260, doorSide: 'e', contains: ['counter'], color: 0xcaa96a,
            name: 'Sunmarch Scimitars', examine: 'Curved steel for a curving sun.' },
          { x0: 300, z0: 250, x1: 312, z1: 260, doorSide: 'w', contains: ['bankChest'], color: 0xcaa96a,
            name: 'Bank of Aldera — Sunmarch', examine: 'Cool vault, warm welcome.' },
          { x0: 264, z0: 282, x1: 274, z1: 292, doorSide: 'n', color: 0xcaa96a,
            name: 'The Tannery', examine: 'Hides become handbags become history.' },
        ],
        props: [
          { kind: 'fountain', x: 288.5, z: 272.5 },
          { kind: 'stall', x: 296.5, z: 264.5, name: 'Gem stall', awning: 0x4a72e0,
            examine: 'Uncut fortunes under a blue awning.' },
          { kind: 'stall', x: 280.5, z: 264.5, name: 'Meat stall', awning: 0xb5542a,
            examine: 'The vendor calls it kebab. The kebab declines to confirm.' },
          { kind: 'signpost', x: 284.5, z: 246.5, arms: 2,
            examine: 'North: Corvath and cooler climes. Within: Sunmarch. Bring water.' },
        ],
      },
      {
        id: 'gullwick', bounds: { x0: 150, z0: 300, x1: 214, z1: 330 },
        buildings: [
          { x0: 156, z0: 306, x1: 166, z1: 314, doorSide: 'e', contains: ['counter'], color: 0x6a6a72,
            name: 'Gullwick Fishmonger', examine: 'Nets, bait, and rods for the salt-tempered.' },
          { x0: 176, z0: 306, x1: 190, z1: 316, doorSide: 'n', h: 4, color: 0x6e5a42,
            name: 'The Rusty Anchor', examine: 'A tavern that has heard every fish story twice.' },
          { x0: 198, z0: 306, x1: 208, z1: 316, doorSide: 'w', color: 0x5a5a62,
            name: 'Gullwick Jail', examine: 'One cell, one very talkative pirate.' },
        ],
        props: [
          { kind: 'signpost', x: 168.5, z: 302.5, arms: 2,
            examine: 'North: the mainland and its manners. South: the docks, and beyond, Ashkara.' },
        ],
      },
      {
        id: 'ashkara', bounds: { x0: 286, z0: 336, x1: 330, z1: 366 },
        buildings: [
          { x0: 292, z0: 342, x1: 302, z1: 350, doorSide: 'e', color: 0x7a5a3a,
            name: 'Tribal longhut', examine: 'Woven leaves, warm hospitality, distant volcano.' },
          { x0: 312, z0: 342, x1: 322, z1: 350, doorSide: 'w', contains: ['counter'], color: 0x7a5a3a,
            name: 'Banana grove stall', examine: 'The realm’s only vertically-integrated banana concern.' },
        ],
        props: [
          { kind: 'firepit', x: 307.5, z: 356.5 },
        ],
      },
    ],
    sewers: { x0: 270, z0: 100, x1: 322, z1: 152, entrance: { x: 302.5, z: 122.5 } },
    miningGuild: { x: 301, z: 45 },
    mines: [
      { x: 288, z: 8, rocks: [ // the dwarven mine north of Whitehold
        ['iron', -3, 0], ['iron', 0, 1], ['iron', 3, 0], ['coal', -1, -1],
        ['coal', 2, -1], ['coal', 5, 1], ['gold', -5, 1], ['copper', 7, 0], ['tin', 8, 2],
      ] },
      { x: 301, z: 45, plane: 'guild', rocks: [ // the guild's exquisite basement
        ['coal', -2, -1], ['coal', 2, -1], ['coal', -2, 1], ['coal', 2, 1], ['gold', 0, 2],
      ] },
      // ---- Endgame veins (Mining 55/70/85). Mithril on the cold cliffs west
      // of Whitehold; adamantite and runite deep in the death-drops Blight. ----
      { x: 254, z: 15, rocks: [
        ['mithril', -1, 0], ['mithril', 1, 1], ['mithril', 0, 2], ['coal', 2, 0],
      ] },
      { x: 356, z: 118, rocks: [
        ['adamantite', -1, 0], ['adamantite', 1, 1], ['coal', 0, 2], ['coal', 2, 0],
      ] },
      { x: 372, z: 172, rocks: [ // the realm's richest, deadliest seam
        ['runite', 0, 0], ['runite', 2, 1], ['adamantite', -2, 1], ['coal', 1, -1],
      ] },
    ],
    signposts: [
      { x: 247.5, z: 86.5, arms: 3,
        examine: 'West: Holmbridge. East: Corvath. North: Whitehold & Brinkton. You are: at the crossroads.' },
    ],

    // ---- Phase 11 dungeons & quest sites (world.js builds these) ----
    // The manor interior sits inside the Ravenmoor Manor footprint; the
    // lever-and-door puzzle gates the way to the mad wizard's study. The
    // crypt is a separate plane below (Ravenmoor sleeps there).
    manor: {
      building: { x0: 112, z0: 206, x1: 126, z1: 220 }, // matches the Murkwell manor
      entry: { x: 113, z: 213 },      // the west door row (integer tile row)
      crypt: { cx: 119, cz: 213, r: 4 },
      cryptStair: { x: 114.5, z: 207.5 }, // NW corner of the main room (not behind the puzzle)
    },
    // The ice cave — coldiron ore + ice fiends (quest 8). Entrance on the
    // cold cliffs north-west of Whitehold.
    iceCave: {
      entrance: { x: 250.5, z: 22.5 },
      cx: 245, cz: 18, r: 6,
      rocks: [['coldiron', -2, -1], ['coldiron', 2, 0], ['coldiron', 0, 2]],
    },
    // The sealed tomb beneath Corvath — Dawnbrand + 3 key bearers (quest 9).
    tomb: {
      entrance: { x: 288.5, z: 104.5 }, // trapdoor by the palace
      cx: 296, cz: 118, r: 7,
    },
    // The Ashkara caldera — Cindermaw's lair (quest 10), reached by boat.
    caldera: {
      cx: 306, cz: 358, r: 8,
      arrive: { x: 306.5, z: 352.5 },
    },
    // Port Gullwick docks: a pier over the sea with the Ashkara charter boat.
    docks: {
      x: 182, z0: 316, z1: 328,        // pier runs south from the town onto the water
      boat: { x: 182.5, z: 328.5 },
    },
    // Sunmarch's toll gate (10 gold to pass north↔south through the wall).
    // Spans the full 3-tile gate gap (cols 284-286) so it cannot be sidestepped.
    tollGate: { x: 284, z: 244, w: 3, cost: 10 },

    // ---- Phase 9 sites ----
    windmill: { x: 94.5, z: 40.5 },
    wizardTower: { x: 46.5, z: 112.5 },
    galeAltar: { x: 136.5, z: 42.5 },       // NE, among the pines
    // The other elemental altars, rediscovered after the Severed Circle. Each
    // imbues blank slates into its own glyph (world.js _buildGlyphAltars).
    glyphAltars: [
      { element: 'tide', x: 115.5, z: 66.5, name: 'Tide altar',
        examine: 'River-bank stones in a broken ring, humming with the tide.' },
      { element: 'stone', x: 46.5, z: 128.5, name: 'Stone altar',
        examine: 'A ring of the mountain’s own bones, near the old mine.' },
      { element: 'spirit', x: 38.5, z: 104.5, name: 'Spirit altar',
        examine: 'Pale stones that hum with the thoughts that stayed. West of the tower.' },
      { element: 'ember', x: 338.5, z: 282.5, name: 'Ember altar',
        examine: 'Scorched stones in the deep desert, warm to the palm.' },
      { element: 'sigil', x: 256.5, z: 128.5, name: 'Sigil altar',
        examine: 'Old-word stones at Corvath’s western verge, edged in red.' },
    ],
    dyeCart: { x: 125.5, z: 91.5 },
    pickables: [
      { kind: 'wheat', item: 'wheat', x: 90.5, z: 43.5 }, { kind: 'wheat', item: 'wheat', x: 91.5, z: 45.0 },
      { kind: 'wheat', item: 'wheat', x: 89.5, z: 46.2 }, { kind: 'wheat', item: 'wheat', x: 92.3, z: 42.2 },
      { kind: 'bush', item: 'redberries', x: 96.5, z: 129.5 }, { kind: 'bush', item: 'redberries', x: 99.5, z: 133.5 },
      { kind: 'bush', item: 'redberries', x: 93.5, z: 135.5 },
      { kind: 'marsh', item: 'marsh_greens', x: 88.5, z: 146.5 }, { kind: 'marsh', item: 'marsh_greens', x: 92.5, z: 149.5 },
      { kind: 'marsh', item: 'marsh_greens', x: 84.5, z: 150.5 },
    ],

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
      // Phase 9 quest folk
      { npc: 'magus_orin', x: 46.5, z: 111.5 },
      { npc: 'maud', x: 124.3, z: 91.0 },
      { npc: 'ghost', x: 84.5, z: 55.8 },
      { npc: 'wartfang', x: 119.5, z: 56.8 },
      { npc: 'grubnose', x: 123.5, z: 57.2 },
      { npc: 'grubfoot', x: 118.2, z: 54.2 },
      { npc: 'dairy_cow', x: 128.5, z: 81.5 },
      // Phase 10 townsfolk
      { npc: 'corvath_swordsmith', x: 269.5, z: 136.5 },
      { npc: 'corvath_staffseller', x: 322.5, z: 136.5 },
      { npc: 'corvath_banker', x: 270.5, z: 120.5 },
      { npc: 'market_clerk', x: 293.5, z: 122.5 },
      { npc: 'guildmaster', x: 300.5, z: 46.5 },
      { npc: 'skalvik_helmsmith', x: 62.5, z: 35.5 },
      { npc: 'brinkton_keeper', x: 200.5, z: 21.5 },
      { npc: 'murkwell_keeper', x: 97.5, z: 210.5 },
      { npc: 'murkwell_banker', x: 84.5, z: 210.5 },
      { npc: 'villager_man', x: 290.5, z: 128.5 },
      { npc: 'villager_woman', x: 300.5, z: 124.5 },
      // ---- Phase 11 town & quest folk ----
      { npc: 'toll_guard', x: 284.5, z: 242.5 },        // Sunmarch north gate
      { npc: 'scimitar_seller', x: 270.5, z: 255.5 },
      { npc: 'sunmarch_tanner', x: 269.5, z: 287.5 },
      { npc: 'gem_seller', x: 296.5, z: 262.5 },
      { npc: 'meat_vendor', x: 280.5, z: 262.5 },
      { npc: 'fishmonger', x: 161.5, z: 310.5 },
      { npc: 'ferryman', x: 182.5, z: 322.5 },          // on the pier
      { npc: 'gullwick_barkeep', x: 183.5, z: 311.5 },
      { npc: 'pirate', x: 203.5, z: 311.5 },            // the jail cell
      { npc: 'chieftain', x: 297.5, z: 346.5 },
      { npc: 'banana_seller', x: 317.5, z: 346.5 },
      { npc: 'hermit', x: 232.5, z: 300.5 },            // desert edge
      { npc: 'hunter', x: 270.5, z: 101.5 },            // Corvath tavern
      { npc: 'collector', x: 316.5, z: 122.5 },         // Corvath, near the guild
      { npc: 'squire', x: 283.5, z: 31.5 },             // Whitehold hall
      { npc: 'armorer', x: 275.5, z: 31.5 },            // Whitehold — anti-flame shield
      { npc: 'cliff_smith', x: 258.5, z: 26.5 },        // by the ice cave cliffs
      { npc: 'champions_master', x: 321.5, z: 100.5 },  // inside the guild building
      { npc: 'mad_wizard', x: 124.5, z: 208.5 },        // manor study
      { npc: 'professor', x: 123.5, z: 213.5, hidden: true }, // the chicken, in the study behind the puzzle
      // tomb key wardens (quest 9)
      { npc: 'warden_stone', x: 291.5, z: 114.5, plane: 'corvathTomb' },
      { npc: 'warden_flame', x: 301.5, z: 114.5, plane: 'corvathTomb' },
      { npc: 'warden_deep', x: 296.5, z: 123.5, plane: 'corvathTomb' },
      // Wave 3 bounty givers
      { npc: 'crossroads_sergeant', x: 248.5, z: 90.5 }, // the crossroads
      { npc: 'blight_warden', x: 204.5, z: 25.5 },       // Brinkton, facing the ash road
      // Wave 4: bankers for the four bankless towns (open-square placements)
      { npc: 'whitehold_banker', x: 280.5, z: 50.5 },
      { npc: 'skalvik_banker', x: 50.5, z: 45.5 },
      { npc: 'gullwick_banker', x: 170.5, z: 318.5 },
      { npc: 'ashkara_banker', x: 300.5, z: 350.5 },
      // Wave 5: Skalvik & Brinkton get residents with something to say
      { npc: 'skalvik_jarl', x: 53.5, z: 42.5 },   // by the Skalvik firepit
      { npc: 'skalvik_skald', x: 57.5, z: 41.5 },
      { npc: 'blight_survivor', x: 192.5, z: 32.5 }, // Brinkton, near the signpost
      { npc: 'slayer_master', x: 290.5, z: 120.5 },  // Corvath square, near the fountain
    ],

    // Fishing spots hug the west edge of the channel (x derived from the river).
    fishingSpots: [
      { type: 'net', z: 95 },
      { type: 'net', z: 101 },
      { type: 'bait', z: 76 },
      { type: 'lure', z: 71 },
      { type: 'lure', z: 30 },   // Skalvik's fly water
      { type: 'net', z: 218 },   // Murkwell's murky shallows
      // Wave 7: Gullwick's sea fishing at the shoreline past the pier end. The
      // spot tile is walkable shore (y~0.5); its ring renders one tile out over
      // the water (z+0.5), so it's both reachable and visible on the surface.
      { type: 'cage', x: 181.5, z: 331.5 },
      { type: 'harpoon', x: 183.5, z: 331.5 },
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
      // Phase 9: imps in the meadows south of the wizard tower; a cultist below it
      { mob: 'imp', x: 50.5, z: 118.5 }, { mob: 'imp', x: 55.5, z: 112.5 },
      { mob: 'imp', x: 42.5, z: 119.5 }, { mob: 'imp', x: 58.5, z: 118.5 },
      { mob: 'vex_cultist', x: 47.5, z: 111.5, plane: 'towerBasement' },
      // ---- Phase 10: the wider realm's dangers and watchmen ----
      { mob: 'guard', x: 264.5, z: 123.5 }, { mob: 'guard', x: 296.5, z: 122.5 },
      { mob: 'guard', x: 297.5, z: 132.5 }, { mob: 'guard', x: 327.5, z: 125.5 },
      { mob: 'guard', x: 285.5, z: 60.5 }, { mob: 'guard', x: 290.5, z: 46.5 },
      { mob: 'guard', x: 186.5, z: 28.5 }, { mob: 'guard', x: 199.5, z: 29.5 },
      { mob: 'highwayman', x: 172.5, z: 86.5 }, { mob: 'highwayman', x: 222.5, z: 90.5 },
      // enough live targets for the crossroads_menace cull (8 kills) to read as
      // clearing an area rather than camping two respawns
      { mob: 'highwayman', x: 210.5, z: 92.5 }, { mob: 'highwayman', x: 224.5, z: 96.5 },
      { mob: 'highwayman', x: 230.5, z: 90.5 },
      { mob: 'bear', x: 162.5, z: 60.5 }, { mob: 'bear', x: 232.5, z: 136.5 },
      { mob: 'hill_giant', x: 30.5, z: 152.5 }, { mob: 'hill_giant', x: 152.5, z: 172.5 },
      { mob: 'moss_giant', x: 104.5, z: 233.5 },
      { mob: 'barbarian', x: 46.5, z: 40.5 }, { mob: 'barbarian', x: 54.5, z: 28.5 },
      { mob: 'barbarian', x: 64.5, z: 44.5 }, { mob: 'barbarian', x: 70.5, z: 34.5 },
      // the sewers ladder: rats -> zombies -> skeletons -> the ghoul den
      { mob: 'giant_rat', x: 272.5, z: 112.5, plane: 'corvathSewers' },
      { mob: 'giant_rat', x: 272.5, z: 124.5, plane: 'corvathSewers' },
      { mob: 'giant_rat', x: 272.5, z: 136.5, plane: 'corvathSewers' },
      { mob: 'zombie', x: 284.5, z: 102.5, plane: 'corvathSewers' },
      { mob: 'zombie', x: 296.5, z: 102.5, plane: 'corvathSewers' },
      { mob: 'zombie', x: 308.5, z: 102.5, plane: 'corvathSewers' },
      { mob: 'skeleton', x: 319.5, z: 112.5, plane: 'corvathSewers' },
      { mob: 'skeleton', x: 319.5, z: 124.5, plane: 'corvathSewers' },
      { mob: 'skeleton', x: 319.5, z: 136.5, plane: 'corvathSewers' },
      { mob: 'ghoul', x: 292.5, z: 148.5, plane: 'corvathSewers' },
      { mob: 'ghoul', x: 302.5, z: 148.5, plane: 'corvathSewers' },
      // ---- Phase 11: the far realm ----
      // The Blight (x 334-381): three depth bands, worsening eastward.
      { mob: 'bogwyrm', x: 344.5, z: 90.5 }, { mob: 'bogwyrm', x: 342.5, z: 140.5 },
      { mob: 'echo', x: 348.5, z: 110.5 }, { mob: 'echo', x: 346.5, z: 170.5 },
      { mob: 'ashfiend', x: 362.5, z: 100.5 }, { mob: 'ashfiend', x: 366.5, z: 150.5 },
      { mob: 'echo', x: 372.5, z: 120.5 }, { mob: 'ashfiend', x: 374.5, z: 180.5 },
      // Desert giant-spider nests around Sunmarch.
      { mob: 'giant_spider', x: 236.5, z: 262.5 }, { mob: 'giant_spider', x: 240.5, z: 288.5 },
      { mob: 'giant_spider', x: 332.5, z: 270.5 },
      // ---- Wave 2: difficulty-curve fillers, placed by theme + level band ----
      { mob: 'giant_frog', x: 82.5, z: 158.5 }, { mob: 'giant_frog', x: 88.5, z: 172.5 },
      { mob: 'giant_frog', x: 78.5, z: 190.5 },
      { mob: 'mugger', x: 210.5, z: 88.5 }, { mob: 'mugger', x: 180.5, z: 95.5 },
      { mob: 'rat_king', x: 290.5, z: 128.5, plane: 'corvathSewers' },
      { mob: 'rat_king', x: 76.5, z: 130.5 },
      { mob: 'hobgoblin', x: 132.5, z: 52.5 }, { mob: 'hobgoblin', x: 138.5, z: 58.5 },
      { mob: 'wild_dog', x: 156.5, z: 110.5 }, { mob: 'wild_dog', x: 172.5, z: 70.5 },
      { mob: 'wild_dog', x: 148.5, z: 130.5 },
      { mob: 'goblin_champion', x: 121.5, z: 53.5 }, { mob: 'goblin_champion', x: 124.5, z: 59.5 },
      { mob: 'dire_bear', x: 188.5, z: 44.5 }, { mob: 'dire_bear', x: 162.5, z: 50.5 },
      { mob: 'frost_skeleton', x: 258.5, z: 18.5 }, { mob: 'frost_skeleton', x: 250.5, z: 12.5 },
      { mob: 'ogre', x: 36.5, z: 158.5 }, { mob: 'ogre', x: 144.5, z: 168.5 },
      { mob: 'troll', x: 110.5, z: 238.5 }, { mob: 'troll', x: 64.5, z: 186.5 },
      { mob: 'elder_moss_giant', x: 100.5, z: 236.5 },
      { mob: 'lesser_demon', x: 338.5, z: 78.5 }, { mob: 'lesser_demon', x: 340.5, z: 110.5 },
      // ---- Wave 8: farmable dragons + repeatable mini-bosses (lv 63-92) ----
      { mob: 'green_dragon', x: 40.5, z: 175.5 },      // SW wilds, past the hill giants
      { mob: 'blue_dragon', x: 130.5, z: 252.5 },      // southern marsh-edge
      { mob: 'red_dragon', x: 330.5, z: 238.5 },       // deep SE desert
      { mob: 'black_dragon', x: 362.5, z: 190.5 },     // deep Blight
      { mob: 'kalphar_bonelord', x: 300.5, z: 130.5, plane: 'corvathSewers' },
      { mob: 'sunmarch_broodmother', x: 236.5, z: 272.5 }, // among the desert nests
      { mob: 'abyssal_warden', x: 370.5, z: 150.5 },   // deepest Blight
      { mob: 'frost_monarch', x: 252.5, z: 14.5 },     // the far northern ice cliffs
      // The ice cave (quest 8) — coldiron guarded by ice fiends.
      { mob: 'ice_fiend', x: 244.5, z: 16.5, plane: 'iceCave' },
      { mob: 'ice_fiend', x: 247.5, z: 20.5, plane: 'iceCave' },
      { mob: 'ice_fiend', x: 242.5, z: 21.5, plane: 'iceCave' },
      // The sealed tomb (quest 9) — undead wardens; Zarkhul waits hidden.
      { mob: 'skeleton', x: 292.5, z: 114.5, plane: 'corvathTomb' },
      { mob: 'skeleton', x: 300.5, z: 122.5, plane: 'corvathTomb' },
      { mob: 'vex_cultist', x: 296.5, z: 120.5, plane: 'corvathTomb' },
      { mob: 'zarkhul', x: 296.5, z: 116.5, plane: 'corvathTomb', hidden: true },
      // The manor crypt (quest 7) — Lord Ravenmoor sleeps, awaiting a stake.
      { mob: 'ravenmoor', x: 119.5, z: 213.5, plane: 'manorCrypt', hidden: true },
      // The caldera (quest 10) — Cindermaw, the capstone wyrm.
      { mob: 'cindermaw', x: 306.5, z: 360.5, plane: 'ashkaraCaldera', hidden: true },
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
      // Phase 9: the coop lays, the cellar hoards
      { item: 'egg', x: 131.9, z: 78.6, respawn: 60 },
      { item: 'skull', x: 48.2, z: 113.5, plane: 'towerBasement', respawn: 80,
        onTakeQuest: ['unquiet_grave', 2, 3] },
      // Phase 11: the knight's heirloom portrait (quest 8), in the Whitehold hall
      { item: 'family_portrait', x: 282.5, z: 26.5, respawn: 120,
        onTakeQuest: ['squires_blunder', 1, 2] },
      // Wave 3: the highwaymen's stash off the crossroads (quest 11 step 2)
      { item: 'stolen_ledger', x: 226.5, z: 95.5, respawn: 120,
        onTakeQuest: ['crossroads_menace', 1, 2] },
    ],

    spawn: { x: 67.5, z: 88.5, yaw: -Math.PI / 2 }, // castle courtyard, facing the east gate
  },
};
