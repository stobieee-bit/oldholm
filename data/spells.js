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
];

export const spellById = (id) => SPELLS.find((s) => s.id === id);

/** staffElement: which element a wielded staff supplies for free. */
export const STAFF_ELEMENTS = {
  gale_staff: 'gale', tide_staff: 'tide', stone_staff: 'stone', ember_staff: 'ember',
};
