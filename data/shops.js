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
      ['attack_potion', 3], ['strength_potion', 3], ['defence_potion', 3],
      ['ranged_potion', 2], ['magic_potion', 2], ['prayer_potion', 3],
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

  corvath_swords: {
    name: 'The Honed Edge',
    buyMult: 1.2, sellMult: 0.6,
    // the capital's forge-market: buys every crafted metal, stocks up to adamant
    // (rune stays smith-or-slay only) — high prices act as an endgame gold sink.
    buysMatcher: (id) => /^(bronze|iron|steel|coldiron|mithril|adamant|rune)_/.test(id),
    restockTicks: 30,
    stock: [
      ['iron_scimitar', 4], ['iron_longsword', 3], ['iron_battleaxe', 2], ['iron_two_handed', 2],
      ['steel_dagger', 3], ['steel_sword', 3], ['steel_scimitar', 3], ['steel_longsword', 2],
      ['steel_warhammer', 2], ['steel_battleaxe', 2], ['steel_two_handed', 1],
      ['steel_platebody', 1], ['steel_platelegs', 2], ['steel_kiteshield', 2], ['steel_full_helm', 2],
      ['coldiron_scimitar', 2], ['coldiron_longsword', 2],
      ['mithril_scimitar', 2], ['mithril_longsword', 2], ['mithril_battleaxe', 1],
      ['adamant_scimitar', 1], ['adamant_longsword', 1],
    ],
  },

  corvath_staffs: {
    name: 'The Third Eye Emporium',
    buyMult: 1.0, sellMult: 0.6,
    buysOnly: [
      'gale_staff', 'tide_staff', 'stone_staff', 'ember_staff', 'void_staff',
      'gale_glyph', 'tide_glyph', 'stone_glyph', 'ember_glyph',
      'spirit_glyph', 'sigil_glyph', 'void_glyph',
      'wizard_hat', 'wizard_robe_top', 'wizard_robe_bottom',
    ],
    restockTicks: 20,
    stock: [
      ['gale_staff', 3], ['tide_staff', 3], ['stone_staff', 3], ['ember_staff', 3],
      ['void_staff', 1], // the endgame focus
      ['gale_glyph', 800], ['tide_glyph', 500], ['stone_glyph', 500], ['ember_glyph', 500],
      ['spirit_glyph', 600], ['sigil_glyph', 400], ['void_glyph', 200],
      ['wizard_hat', 3], ['wizard_robe_top', 3], ['wizard_robe_bottom', 3],
    ],
  },

  skalvik_helmets: {
    name: 'Helm & Hearth',
    buyMult: 1.1, sellMult: 0.6,
    buysMatcher: (id) => id.endsWith('_full_helm'),
    restockTicks: 30,
    stock: [['bronze_full_helm', 6], ['iron_full_helm', 4], ['steel_full_helm', 3]],
  },

  brinkton_general: {
    name: 'The Last Shelf',
    buyMult: 1.4, sellMult: 0.45, // frontier prices
    buysAnything: true,
    restockTicks: 30,
    stock: [
      ['tinderbox', 4], ['knife', 3], ['bronze_axe', 3], ['bronze_pickaxe', 3],
      ['hammer', 3], ['shortbow', 2], ['bronze_arrow', 100], ['trout', 8], ['pike', 5],
    ],
  },

  murkwell_general: {
    name: 'The Humble Market',
    buyMult: 1.2, sellMult: 0.45,
    buysAnything: true,
    restockTicks: 28,
    stock: [
      ['bucket', 4], ['tinderbox', 3], ['small_net', 3], ['fishing_bait', 80],
      ['cabbage', 6], ['thread', 100], ['needle', 3], ['knife', 2],
    ],
  },

  sword_shop: {
    name: "Hilda's Arms",
    buyMult: 1.2, sellMult: 0.55,
    buysOnly: null, // set below: metal gear, bars, ores
    buysMatcher: (id) => /^(bronze|iron|steel|coldiron|mithril|adamant|rune)_/.test(id) ||
      /^(mithril|adamantite|runite|coldiron)_ore$/.test(id) ||
      ['copper_ore', 'tin_ore', 'iron_ore', 'coal', 'gold_ore', 'gold_bar',
       'mithril_bar', 'adamant_bar', 'rune_bar', 'coldiron_bar'].includes(id),
    restockTicks: 30,
    stock: [
      ['bronze_dagger', 5], ['bronze_sword', 4], ['bronze_scimitar', 3],
      ['bronze_full_helm', 3], ['bronze_kiteshield', 2], ['bronze_platelegs', 2],
      ['iron_dagger', 4], ['iron_sword', 3], ['iron_scimitar', 3],
      ['iron_full_helm', 2], ['iron_chainbody', 2],
      ['steel_dagger', 2], ['steel_sword', 1],
    ],
  },

  // ---- Phase 11 shops ----
  sunmarch_scimitars: {
    name: 'Sunmarch Scimitars',
    buyMult: 1.25, sellMult: 0.55,
    buysMatcher: (id) => /_scimitar$/.test(id),
    restockTicks: 30,
    stock: [
      ['bronze_scimitar', 5], ['iron_scimitar', 4], ['steel_scimitar', 3],
    ],
  },
  sunmarch_gems: {
    name: 'Sunmarch Gem Stall',
    buyMult: 1.1, sellMult: 0.7,
    buysMatcher: (id) => /^(uncut_|cut_)/.test(id),
    restockTicks: 40,
    stock: [
      ['uncut_sapphire', 6], ['uncut_emerald', 4], ['uncut_ruby', 3], ['chisel', 3],
    ],
  },
  sunmarch_meat: {
    name: 'The Questionable Kebab',
    buyMult: 1.3, sellMult: 0.4,
    buysMatcher: (id) => ['raw_beef', 'raw_chicken', 'cooked_beef', 'cooked_chicken'].includes(id),
    restockTicks: 25,
    stock: [['kebab', 12], ['banana', 8]],
  },
  gullwick_fishing: {
    name: 'Gullwick Fishmonger',
    buyMult: 1.2, sellMult: 0.5,
    buysMatcher: (id) => /^(raw_|)/.test(id) && (ITEM_IS_FISH[id] ?? false),
    restockTicks: 26,
    stock: [
      ['small_net', 4], ['fishing_rod', 4], ['fly_rod', 3], ['fishing_bait', 200],
      ['feather', 200], ['lobster_pot', 3], ['harpoon', 3],
      ['trout', 8], ['salmon', 6], ['lobster', 4],
    ],
  },
  gullwick_tavern: {
    name: 'The Rusty Anchor',
    buyMult: 1.0, sellMult: 0.3,
    buysMatcher: () => false,
    restockTicks: 15,
    stock: [['beer', 20], ['kebab', 6]],
  },
  ashkara_bananas: {
    name: 'Banana Grove',
    buyMult: 1.1, sellMult: 0.4,
    buysMatcher: (id) => id === 'banana',
    restockTicks: 20,
    stock: [['banana', 20]],
  },
  whitehold_armory: {
    name: 'Whitehold Armory',
    buyMult: 1.2, sellMult: 0.55,
    buysMatcher: (id) => /_(kiteshield|sq_shield|platebody|platelegs|full_helm|chainbody)$/.test(id),
    restockTicks: 40,
    stock: [
      ['steel_kiteshield', 3], ['steel_platebody', 2], ['steel_platelegs', 2],
      ['steel_full_helm', 3], ['anti_flame_kiteshield', 2],
      ['coldiron_platebody', 1], ['coldiron_kiteshield', 2],
      ['mithril_platebody', 1], ['mithril_platelegs', 1], ['mithril_kiteshield', 2], ['mithril_full_helm', 2],
      ['adamant_platebody', 1], ['adamant_kiteshield', 1],
    ],
  },

  // ---- Wave 4: the Sunmarch Tannery, opened at last (a crafting-supply shop) ----
  sunmarch_leather: {
    name: 'The Sunmarch Tannery',
    buyMult: 1.2, sellMult: 0.5,
    buysMatcher: (id) => /^leather/.test(id) || ['cowhide', 'leather', 'thread', 'needle'].includes(id),
    restockTicks: 30,
    stock: [
      ['needle', 5], ['thread', 250], ['leather', 30], ['shears', 3],
      ['ring_mould', 3], ['amulet_mould', 3],
    ],
  },
};

// (a tiny lookup so the fishmonger only buys fish — cooked or raw)
const ITEM_IS_FISH = {
  raw_shrimp: true, shrimp: true, raw_sardine: true, sardine: true,
  raw_herring: true, herring: true, raw_trout: true, trout: true,
  raw_pike: true, pike: true, raw_salmon: true, salmon: true,
  raw_tuna: true, tuna: true, raw_lobster: true, lobster: true, raw_swordfish: true, swordfish: true,
  raw_shark: true, shark: true,
};
