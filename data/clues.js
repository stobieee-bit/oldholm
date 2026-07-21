// OLDHOLM — treasure trails. A clue scroll picks 2-3 dig spots; each hint is
// a riddle naming a real landmark (coordinates from data/regions.js). Digging
// with a spade within DIG_RADIUS tiles advances the trail; the last dig pays
// out a casket (weighted loot below).

export const DIG_RADIUS = 3;

export const CLUE_SPOTS = [
  { x: 247.5, z: 86.5, hint: 'Dig where three roads argue about where to send you.' },              // crossroads signpost
  { x: 288.5, z: 42.5, hint: 'Dig at the feet of the First Shield, who watches the north.' },      // Whitehold statue
  { x: 55.5, z: 43.5, hint: 'Dig by the fire where benches are beds and songs never end.' },       // Skalvik firepit
  { x: 94.5, z: 40.5, hint: 'Dig where sails turn wheat into patience.' },                          // windmill
  { x: 46.5, z: 112.5, hint: 'Dig beneath the tower that hums on Tuesdays.' },                      // wizard tower
  { x: 136.5, z: 42.5, hint: 'Dig in the broken ring where the wind waits, among the pines.' },     // gale altar
  { x: 90.5, z: 204.5, hint: 'Dig by the sign that tells you to adjust your expectations.' },       // Murkwell signpost
  { x: 288.5, z: 272.5, hint: 'Dig beside the fountain that defies the desert.' },                  // Sunmarch fountain
  { x: 296.5, z: 126.5, hint: 'Dig where the capital’s water rises and its prices drift.' },        // Corvath fountain
  { x: 168.5, z: 302.5, hint: 'Dig by the sign that points to the mainland and its manners.' },     // Gullwick signpost
  { x: 208.5, z: 30.5, hint: 'Dig by the sign that calls the north closed for your safety.' },      // Brinkton signpost
  { x: 84.5, z: 61.5, hint: 'Dig outside the house of Aurel, keeper of every ledger.' },            // Holmbridge church
  { x: 307.5, z: 356.5, hint: 'Dig by the island fire, under a sleeping mountain.' },               // Ashkara firepit
  { x: 250.5, z: 22.5, hint: 'Dig at the mouth of the cave where iron never warmed.' },             // ice cave entrance
  { x: 128.5, z: 90.4, hint: 'Dig where hides become fashion, one coin at a time.' },               // tanning rack
  { x: 121.0, z: 57.5, hint: 'Dig in the camp where armor colors nearly started a war.' },          // goblin camp fire
];

// One weighted roll per casket (npc.js-style: weight / total).
export const CASKET_LOOT = [
  { item: 'coins', count: [200, 800], weight: 5 },
  { item: 'uncut_sapphire', count: 1, weight: 2 },
  { item: 'uncut_emerald', count: 1, weight: 2 },
  { item: 'uncut_ruby', count: 1, weight: 1 },
  { item: 'mithril_bar', count: [1, 2], weight: 2 },
  { item: 'adamant_bar', count: 1, weight: 1 },
  { item: 'rune_bar', count: 1, weight: 1 },
  { item: 'prayer_potion', count: [1, 2], weight: 2 },
  { item: 'combat_lamp', count: 1, weight: 1 },
];
