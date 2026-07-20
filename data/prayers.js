// OLDHOLM — the 8 prayers (spec §10, original names). Prayer points equal the
// Prayer level; each active prayer drains points per tick. Prayers sharing a
// `group` are mutually exclusive (a stronger skin replaces a weaker one).
// mult fields feed the §5.1 effective-level math; Swiftguard is a flat chance
// to fully block an incoming hit.

export const PRAYERS = [
  { id: 'stoneskin', name: 'Stoneskin', req: 1, drain: 0.08, group: 'def', defMult: 1.05,
    examine: '+5% Defence. The skin of a very patient rock.' },
  { id: 'bulls_blood', name: "Bull's Blood", req: 4, drain: 0.08, group: 'str', strMult: 1.05,
    examine: '+5% Strength. The cows know, and disapprove.' },
  { id: 'hawks_eye', name: "Hawk's Eye", req: 7, drain: 0.08, group: 'att', attMult: 1.05,
    examine: '+5% Attack. See the gap in their guard.' },
  { id: 'ironflesh', name: 'Ironflesh', req: 10, drain: 0.16, group: 'def', defMult: 1.10,
    examine: '+10% Defence. Skin with smithing ambitions.' },
  { id: 'bulls_blood_2', name: "Bull's Blood II", req: 13, drain: 0.16, group: 'str', strMult: 1.10,
    examine: '+10% Strength. The herd grows nervous.' },
  { id: 'mindstorm', name: 'Mindstorm', req: 16, drain: 0.16, group: 'mag', magicMult: 1.10,
    examine: '+10% Magic. Thoughts with thunder in them.' },
  { id: 'granite_aegis', name: 'Granite Aegis', req: 22, drain: 0.3, group: 'def', defMult: 1.15,
    examine: '+15% Defence. Wear the mountain.' },
  { id: 'swiftguard', name: 'Swiftguard', req: 28, drain: 0.3, group: 'guard', blockChance: 0.15,
    examine: 'A chance to turn a blow aside entirely.' },

  // ---- Prayer 29-99: stronger skins, offensive tiers, ranged, protection ----
  { id: 'bulls_blood_3', name: "Bull's Blood III", req: 31, drain: 0.3, group: 'str', strMult: 1.15,
    examine: '+15% Strength. The herd has filed a complaint.' },
  { id: 'keen_edge', name: 'Keen Edge', req: 34, drain: 0.3, group: 'att', attMult: 1.12,
    examine: '+12% Attack. Every guard has a gap.' },
  { id: 'adamant_skin', name: 'Adamant Skin', req: 44, drain: 0.4, group: 'def', defMult: 1.20,
    examine: '+20% Defence. Ore where your nerves used to be.' },
  { id: 'mindstorm_2', name: 'Mindstorm II', req: 45, drain: 0.4, group: 'mag', magicMult: 1.15,
    examine: '+15% Magic. The thunder has thunder.' },
  { id: 'titans_fury', name: "Titan's Fury", req: 70, drain: 0.5, group: 'str', strMult: 1.20,
    examine: '+20% Strength. Lift first, ask never.' },
  { id: 'perfect_strike', name: 'Perfect Strike', req: 74, drain: 0.5, group: 'att', attMult: 1.18,
    examine: '+18% Attack. It lands before they flinch.' },
  { id: 'archmage', name: 'Archmage', req: 76, drain: 0.55, group: 'mag', magicMult: 1.20,
    examine: '+20% Magic. The spellbook reads YOU now.' },
  { id: 'diamond_skin', name: 'Diamond Skin', req: 80, drain: 0.55, group: 'def', defMult: 1.25,
    examine: '+25% Defence. Flawless, and faintly smug.' },

  // Ranged prayers (boost ranged accuracy + strength; own group)
  { id: 'sharp_eye', name: 'Sharp Eye', req: 8, drain: 0.08, group: 'ranged', rangedAttMult: 1.05, rangedStrMult: 1.05,
    examine: '+5% Ranged. Squint professionally.' },
  { id: 'hawkeye', name: 'Hawkeye', req: 43, drain: 0.4, group: 'ranged', rangedAttMult: 1.13, rangedStrMult: 1.13,
    examine: '+13% Ranged. The arrow already knows.' },
  { id: 'eagle_eye', name: 'Eagle Eye', req: 82, drain: 0.55, group: 'ranged', rangedAttMult: 1.20, rangedStrMult: 1.20,
    examine: '+20% Ranged. Distance is a suggestion.' },

  // Overhead protection (one at a time; halves the matching incoming hit)
  { id: 'protect_melee', name: 'Protect from Melee', req: 40, drain: 0.5, group: 'overhead', protect: 'melee', factor: 0.5,
    examine: 'Halves incoming melee damage.' },
  { id: 'protect_ranged', name: 'Protect from Missiles', req: 50, drain: 0.5, group: 'overhead', protect: 'ranged', factor: 0.5,
    examine: 'Halves incoming ranged damage.' },
  { id: 'protect_magic', name: 'Protect from Magic', req: 55, drain: 0.5, group: 'overhead', protect: 'magic', factor: 0.5,
    examine: 'Halves incoming magic damage.' },
];

export const prayerById = (id) => PRAYERS.find((p) => p.id === id);

/** Bones and their burial xp (spec §10). */
export const BONES = { bones: 4.5, big_bones: 15, dragon_bones: 48, wyrm_bones: 72 };
