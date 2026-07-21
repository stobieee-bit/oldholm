// OLDHOLM — smithing & crafting recipe tables.

// Smelting at a furnace. iron's 50% success is the realm's oldest joke.
export const SMELTING = {
  bronze_bar: {
    req: 1, xp: 6.25, inputs: { copper_ore: 1, tin_ore: 1 }, successChance: 1,
  },
  iron_bar: {
    req: 15, xp: 12.5, inputs: { iron_ore: 1 }, successChance: 0.5,
    failMsg: 'The iron ore stubbornly refuses to become a bar. You suspect it is doing this on purpose.',
  },
  steel_bar: {
    req: 30, xp: 17.5, inputs: { iron_ore: 1, coal: 2 }, successChance: 1,
  },
  gold_bar: {
    req: 40, xp: 22.5, inputs: { gold_ore: 1 }, successChance: 1,
  },
  coldiron_bar: {
    req: 45, xp: 27.5, inputs: { coldiron_ore: 1, coal: 2 }, successChance: 1,
  },
  mithril_bar: {
    req: 50, xp: 30, inputs: { mithril_ore: 1, coal: 4 }, successChance: 1,
  },
  adamant_bar: {
    req: 70, xp: 37.5, inputs: { adamantite_ore: 1, coal: 6 }, successChance: 1,
  },
  rune_bar: {
    req: 85, xp: 50, inputs: { runite_ore: 1, coal: 8 }, successChance: 1,
  },
  TICKS_PER_BAR: 3,
};

// Anvil smithables: level = metal.smithReqBase + off; xp = metal.barXp * bars.
// (The full per-metal item list is generated in items.js from these shapes.)
export const SMITHABLES = {
  dagger:     { off: 1,  bars: 1, kind: 'weapon' },
  sword:      { off: 4,  bars: 1, kind: 'weapon' },
  scimitar:   { off: 5,  bars: 2, kind: 'weapon' },
  longsword:  { off: 6,  bars: 2, kind: 'weapon' },
  full_helm:  { off: 7,  bars: 2, kind: 'armor' },
  sq_shield:  { off: 8,  bars: 2, kind: 'armor' },
  warhammer:  { off: 9,  bars: 3, kind: 'weapon' },
  battleaxe:  { off: 10, bars: 3, kind: 'weapon' },
  chainbody:  { off: 11, bars: 3, kind: 'armor' },
  kiteshield: { off: 12, bars: 3, kind: 'armor' },
  two_handed: { off: 14, bars: 3, kind: 'weapon' },
  platelegs:  { off: 16, bars: 3, kind: 'armor' },
  platebody:  { off: 18, bars: 5, kind: 'armor' },
  arrowtips:  { off: 3,  bars: 1, kind: 'ammo', count: 15 },
  // Wave 9: gloves/boots/med-helm smithables (rune tops out at 81+15=96 <= 99)
  med_helm:   { off: 6,  bars: 1, kind: 'armor' },
  gauntlets:  { off: 13, bars: 2, kind: 'armor' },
  plateboots: { off: 15, bars: 2, kind: 'armor' },
};
export const SMITH_TICKS_PER_ITEM = 4;

// Tanning: hides -> leathers, coins per hide (the absent owner insists).
// startTan works the first entry the player is carrying (dragon first).
export const TANNING = [
  { input: 'dragon_hide', output: 'dragon_leather', coinCost: 5 },
  { input: 'cowhide', output: 'leather', coinCost: 1 },
];

// Leatherwork: needle in pack, one thread per item.
export const LEATHER_RECIPES = {
  leather_gloves:    { req: 1,  xp: 13.8 },
  leather_boots:     { req: 7,  xp: 16.25 },
  leather_cowl:      { req: 9,  xp: 18.5 },
  leather_vambraces: { req: 11, xp: 22 },
  leather_body:      { req: 14, xp: 25 },
  leather_chaps:     { req: 18, xp: 27 },
  // dragonhide (consumes dragon_leather instead of leather)
  dhide_vambraces:   { req: 57, xp: 62, hide: 'dragon_leather' },
  dhide_chaps:       { req: 60, xp: 74, hide: 'dragon_leather' },
  dhide_body:        { req: 63, xp: 86, hide: 'dragon_leather' },
};
export const LEATHER_TICKS_PER_ITEM = 3;

// Spinning at the wheel: wool -> ball of wool.
export const SPINNING = { input: 'wool', output: 'ball_of_wool', req: 1, xp: 2.5, ticksPer: 2 };

// A wool cape: 3 balls of wool + needle & thread. Fashion for the cape slot.
export const WOOL_CAPE = { output: 'wool_cape', balls: 3, req: 5, xp: 20, ticks: 4 };

// Fletching (under Crafting, spec §15.7): knife + logs -> bows;
// feathers + arrowtips -> arrows (batches of up to 10 per stitch of work).
export const FLETCHING = {
  bows: {
    shortbow: { logs: 1, req: 5, xp: 10 },
    longbow: { logs: 2, req: 10, xp: 20 },
    willow_bow: { log: 'willow_logs', logs: 1, req: 35, xp: 66 },
    yew_bow: { log: 'yew_logs', logs: 1, req: 65, xp: 135 },
  },
  arrows: { output: 'bronze_arrow', tip: 'bronze_arrowtips', req: 1, xpEach: 0.5, batch: 10, ticks: 2 },
};

// Gem cutting with a chisel (instant, satisfying).
export const GEMS = {
  uncut_sapphire: { cut: 'cut_sapphire', req: 20, xp: 50 },
  uncut_emerald:  { cut: 'cut_emerald',  req: 27, xp: 67.5 },
  uncut_ruby:     { cut: 'cut_ruby',     req: 34, xp: 85 },
};
// Rare strike while mining: 1 in GEM_CHANCE successful swings.
export const GEM_CHANCE = 40;
export const GEM_WEIGHTS = [['uncut_sapphire', 3], ['uncut_emerald', 2], ['uncut_ruby', 1]];

// Jewellery at the furnace (mould stays in the pack, bar is consumed).
export const JEWELRY = {
  gold_ring:      { req: 5,  xp: 15, bar: 'gold_bar', mould: 'ring_mould' },
  sapphire_ring:  { req: 20, xp: 40, bar: 'gold_bar', mould: 'ring_mould', gem: 'cut_sapphire' },
  emerald_ring:   { req: 27, xp: 55, bar: 'gold_bar', mould: 'ring_mould', gem: 'cut_emerald' },
  ruby_ring:      { req: 34, xp: 70, bar: 'gold_bar', mould: 'ring_mould', gem: 'cut_ruby' },
  gold_amulet_u:  { req: 8,  xp: 30, bar: 'gold_bar', mould: 'amulet_mould' },
};
export const JEWELRY_TICKS = 3;
// Stringing an unstrung amulet with a ball of wool (instant, 4 xp).
export const STRINGING = { input: 'gold_amulet_u', wool: 'ball_of_wool', output: 'gold_amulet', xp: 4 };

// Shearing sheep (instant; no xp — the xp is in the spinning).
export const SHEARING = { product: 'wool', regrowTicks: 60 };

// Baking combines (Cooking): mix several pack ingredients into an uncooked
// good, then cook it on a fire/range (COOKING in resources.js). `returns` gives
// a consumed container back (a milked bucket empties to a plain bucket).
export const BAKING = {
  uncooked_cake: { req: 40, xp: 40, inputs: { flour: 1, egg: 1, bucket_of_milk: 1 }, returns: { bucket: 1 } },
  uncooked_pie:  { req: 20, xp: 20, inputs: { flour: 1, redberries: 1 } },
};

// Herblore (spec §16): clean herb + vial of water -> unfinished potion; then
// unfinished + secondary -> finished potion. Keyed by the finished potion; the
// herb/unf items and mixing actions are generated from this table. Herblore
// level gates both steps; xp is granted on the finishing mix. The finished
// potions are the same ones the general store sells (drink logic in player.js).
export const HERBLORE = {
  attack_potion:   { req: 3,  herb: 'guam',        secondary: 'eye_of_newt',   xp: 25 },
  strength_potion: { req: 12, herb: 'tarromin',    secondary: 'limpwurt_root', xp: 50 },
  defence_potion:  { req: 30, herb: 'harralander', secondary: 'ashes',         xp: 60 },
  prayer_potion:   { req: 38, herb: 'ranarr',      secondary: 'snape_grass',   xp: 72 },
  ranged_potion:   { req: 45, herb: 'marrentill',  secondary: 'wolf_bone',     xp: 82 },
  magic_potion:    { req: 50, herb: 'irit',        secondary: 'red_bead',      xp: 92 },
};
export const VIAL_OF_WATER = 'vial_of_water';
