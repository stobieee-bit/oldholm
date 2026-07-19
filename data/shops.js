// OLDHOLM — shop definitions (spec §9). Stock replenishes on ticks; general
// stores buy anything and pay poorly. Prices: player BUYS at value×buyMult
// (ceil), SELLS at value×sellMult (floor, min 0 — some things are worth less
// than the walk).

export const SHOPS = {
  general_store: {
    name: 'Holmbridge General Store',
    buyMult: 1.3, sellMult: 0.4,
    buysAnything: true,
    restockTicks: 25, // one step toward max per entry
    stock: [
      ['bucket', 5], ['jug', 3], ['tinderbox', 5], ['knife', 4], ['hammer', 4],
      ['small_net', 3], ['fishing_rod', 3], ['fly_rod', 2], ['fishing_bait', 150],
      ['thread', 200], ['needle', 4], ['bronze_axe', 4], ['bronze_pickaxe', 4],
      ['shears', 3], ['chisel', 3], ['cabbage', 8], ['shortbow', 3], ['longbow', 2],
      ['bronze_arrow', 200],
    ],
  },

  staff_shop: {
    name: "Fenwick's Focus & Fizzle",
    buyMult: 1.0, sellMult: 0.6,
    buysOnly: [
      'gale_staff', 'tide_staff', 'stone_staff', 'ember_staff',
      'gale_glyph', 'tide_glyph', 'stone_glyph', 'ember_glyph',
      'spirit_glyph', 'sigil_glyph', 'void_glyph',
      'wizard_hat', 'wizard_robe_top', 'wizard_robe_bottom',
    ],
    restockTicks: 20,
    stock: [
      ['gale_staff', 2], ['tide_staff', 2], ['stone_staff', 2], ['ember_staff', 2],
      ['gale_glyph', 500], ['tide_glyph', 300], ['stone_glyph', 300], ['ember_glyph', 300],
      ['spirit_glyph', 400], ['sigil_glyph', 200], ['void_glyph', 80],
      ['wizard_hat', 2], ['wizard_robe_top', 2], ['wizard_robe_bottom', 2],
    ],
  },

  sword_shop: {
    name: "Hilda's Arms",
    buyMult: 1.2, sellMult: 0.55,
    buysOnly: null, // set below: metal gear, bars, ores
    buysMatcher: (id) => /^(bronze|iron|steel)_/.test(id) ||
      ['copper_ore', 'tin_ore', 'iron_ore', 'coal', 'gold_ore', 'gold_bar'].includes(id),
    restockTicks: 30,
    stock: [
      ['bronze_dagger', 5], ['bronze_sword', 4], ['bronze_scimitar', 3],
      ['bronze_full_helm', 3], ['bronze_kiteshield', 2], ['bronze_platelegs', 2],
      ['iron_dagger', 4], ['iron_sword', 3], ['iron_scimitar', 3],
      ['iron_full_helm', 2], ['iron_chainbody', 2],
      ['steel_dagger', 2], ['steel_sword', 1],
    ],
  },
};
