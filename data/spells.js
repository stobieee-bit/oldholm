// OLDHOLM — the combat spellbook (spec §10): Strike and Bolt lines across the
// four elements. Fixed max hits, 5-tick casts. Costs are glyph stones; an
// elemental staff substitutes its own element's stones endlessly.
// (The Blast line, utility magic, and teleports arrive with later phases.)

export const CAST_TICKS = 5;
export const MAGIC_RANGE = 8; // tiles

export const SPELLS = [
  { id: 'gale_strike', name: 'Gale Strike', element: 'gale', req: 1, maxHit: 2, baseXp: 5.5,
    cost: { gale_glyph: 1, spirit_glyph: 1 }, color: 0xcfd8dc,
    examine: 'A slap of wind with opinions.' },
  { id: 'tide_strike', name: 'Tide Strike', element: 'tide', req: 5, maxHit: 4, baseXp: 7.5,
    cost: { tide_glyph: 1, gale_glyph: 1, spirit_glyph: 1 }, color: 0x4a90c2,
    examine: 'The river, weaponized.' },
  { id: 'stone_strike', name: 'Stone Strike', element: 'stone', req: 9, maxHit: 6, baseXp: 9.5,
    cost: { stone_glyph: 2, gale_glyph: 1, spirit_glyph: 1 }, color: 0x8a7a5a,
    examine: 'Geology at speed.' },
  { id: 'ember_strike', name: 'Ember Strike', element: 'ember', req: 13, maxHit: 8, baseXp: 11.5,
    cost: { ember_glyph: 3, gale_glyph: 2, spirit_glyph: 1 }, color: 0xe07a2a,
    examine: 'A pointed argument from the hearth.' },
  { id: 'gale_bolt', name: 'Gale Bolt', element: 'gale', req: 17, maxHit: 9, baseXp: 13.5,
    cost: { gale_glyph: 2, sigil_glyph: 1 }, color: 0xe8f0f2,
    examine: 'Wind, but personal.' },
  { id: 'tide_bolt', name: 'Tide Bolt', element: 'tide', req: 23, maxHit: 10, baseXp: 15,
    cost: { tide_glyph: 2, gale_glyph: 2, sigil_glyph: 1 }, color: 0x3a7fc2,
    examine: 'A drowning, delivered.' },
  { id: 'stone_bolt', name: 'Stone Bolt', element: 'stone', req: 29, maxHit: 11, baseXp: 16.5,
    cost: { stone_glyph: 3, gale_glyph: 2, sigil_glyph: 1 }, color: 0x7a6a4a,
    examine: 'The mountain sends its regards.' },
  { id: 'ember_bolt', name: 'Ember Bolt', element: 'ember', req: 35, maxHit: 12, baseXp: 18,
    cost: { ember_glyph: 4, gale_glyph: 3, sigil_glyph: 1 }, color: 0xd85a1a,
    examine: 'Fire with a forwarding address.' },

  // ---- Wave 6: the Blast line (spec §10), Magic 41-59 ----
  { id: 'gale_blast', name: 'Gale Blast', element: 'gale', req: 41, maxHit: 14, baseXp: 20,
    cost: { gale_glyph: 3, sigil_glyph: 1 }, color: 0xeef6f8,
    examine: 'The wind, but it means it this time.' },
  { id: 'tide_blast', name: 'Tide Blast', element: 'tide', req: 47, maxHit: 15, baseXp: 22.5,
    cost: { tide_glyph: 3, gale_glyph: 2, sigil_glyph: 1 }, color: 0x2f6fc0,
    examine: 'A wave that files paperwork on the way down.' },
  { id: 'stone_blast', name: 'Stone Blast', element: 'stone', req: 53, maxHit: 16, baseXp: 25,
    cost: { stone_glyph: 4, gale_glyph: 2, sigil_glyph: 1 }, color: 0x6a5a3e,
    examine: 'Tectonics, expedited.' },
  { id: 'ember_blast', name: 'Ember Blast', element: 'ember', req: 59, maxHit: 18, baseXp: 27.5,
    cost: { ember_glyph: 5, gale_glyph: 3, sigil_glyph: 1 }, color: 0xc84a12,
    examine: 'The hearth, unbanked and unhappy.' },

  // ---- Wave 6: the Void line (redeems the void glyph), Magic 65-82 ----
  { id: 'void_bolt', name: 'Void Bolt', element: 'void', req: 65, maxHit: 19, baseXp: 30,
    cost: { void_glyph: 2, sigil_glyph: 1 }, color: 0x6a4a8a,
    examine: 'A hole where a hit used to be.' },
  { id: 'void_blast', name: 'Void Blast', element: 'void', req: 82, maxHit: 22, baseXp: 35,
    cost: { void_glyph: 3, sigil_glyph: 2 }, color: 0x7a52a2,
    examine: 'The absence of everything, delivered at speed.' },
];

// Teleports (spec §10): cast from the spellbook, instant travel, 5-tick daze.
export const TELEPORTS = [
  { id: 'tp_holmbridge', name: 'Holmbridge Beckon', req: 25, baseXp: 30, type: 'teleport',
    dest: { x: 67.5, z: 88.5 }, cost: { sigil_glyph: 1, gale_glyph: 3 }, color: 0xd8b13a,
    examine: 'Home, in a hurry.' },
  { id: 'tp_corvath', name: 'Corvath Call', req: 31, baseXp: 35, type: 'teleport',
    dest: { x: 296.5, z: 130.5 }, cost: { sigil_glyph: 1, tide_glyph: 3 }, color: 0x4a90c2,
    examine: 'The capital, minus the walking.' },
  { id: 'tp_whitehold', name: 'Whitehold Summons', req: 37, baseXp: 40, type: 'teleport',
    dest: { x: 288.5, z: 46.5 }, cost: { sigil_glyph: 1, stone_glyph: 3 }, color: 0xd8d8d2,
    examine: 'White walls on demand.' },
  // ---- Wave 6: teleports to the wider realm ----
  { id: 'tp_murkwell', name: 'Murkwell Mire', req: 29, baseXp: 33, type: 'teleport',
    dest: { x: 96.5, z: 210.5 }, cost: { sigil_glyph: 1, tide_glyph: 2 }, color: 0x5a6a52,
    examine: 'The damp, on request.' },
  { id: 'tp_sunmarch', name: 'Sunmarch Sending', req: 43, baseXp: 42, type: 'teleport',
    dest: { x: 288.5, z: 272.5 }, cost: { sigil_glyph: 1, ember_glyph: 3 }, color: 0xcaa96a,
    examine: 'Sand between your toes, instantly.' },
  { id: 'tp_gullwick', name: 'Gullwick Gust', req: 51, baseXp: 48, type: 'teleport',
    dest: { x: 180.5, z: 312.5 }, cost: { sigil_glyph: 2, tide_glyph: 4 }, color: 0x3a6a7a,
    examine: 'The salt air, summoned.' },
];
SPELLS.push(...TELEPORTS);

export const spellById = (id) => SPELLS.find((s) => s.id === id);

/** staffElement: which element a wielded staff supplies for free. */
export const STAFF_ELEMENTS = {
  gale_staff: 'gale', tide_staff: 'tide', stone_staff: 'stone', ember_staff: 'ember',
  void_staff: 'void',
};
