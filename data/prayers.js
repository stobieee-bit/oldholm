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
];

export const prayerById = (id) => PRAYERS.find((p) => p.id === id);

/** Bones and their burial xp (spec §10). */
export const BONES = { bones: 4.5, big_bones: 15, wyrm_bones: 72 };
