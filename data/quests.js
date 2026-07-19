// OLDHOLM — quest definitions (spec §11, quests 1–5). The engine
// (src/quests.js) owns stages; dialogue advances them via action strings.
// stage 0 = not started, 100 = complete. journal[stage] = current objective.

export const QUESTS = {
  cooks_calamity: {
    name: "The Cook's Calamity",
    qp: 1,
    start: 'Talk to Cook Bramble in the castle keep.',
    journal: {
      1: 'Cook Bramble needs an egg, a bucket of milk, and a pot of flour for the duke’s cake.',
      2: 'I delivered everything. Bramble is baking like a man possessed.',
    },
    rewards: ['300 Cooking xp', 'Use of the castle range'],
    rewardFn: [['xp', 'Cooking', 300]],
  },
  unquiet_grave: {
    name: 'The Unquiet Grave',
    qp: 1,
    start: 'Talk to Father Merrit at the church of Aurel.',
    journal: {
      1: 'A spirit haunts the churchyard. Father Merrit gave me a Spectral Charm — with it, I might hear the dead.',
      2: 'The ghost, one Aldric Weaver, wants his skull back. A cultist took it to the wizard tower’s basement.',
      3: 'I have poor Aldric’s skull. I should return it to him in the churchyard.',
      100: null,
    },
    rewards: ['1,125 Prayer xp'],
    rewardFn: [['xp', 'Prayer', 1125]],
  },
  beads_of_the_magus: {
    name: 'Beads of the Magus',
    qp: 1,
    start: 'Talk to Magus Orin at the wizard tower.',
    journal: {
      1: 'Imps stole Magus Orin’s enchanted beads. I must hunt imps for the red, yellow, black, and white beads.',
      2: 'I have all four beads. Time to return them to Magus Orin.',
    },
    rewards: ['875 Magic xp', 'An amulet of accuracy'],
    rewardFn: [['xp', 'Magic', 875], ['item', 'amulet_of_accuracy', 1]],
  },
  severed_circle: {
    name: 'The Severed Circle',
    qp: 1,
    start: 'Talk to Magus Orin at the wizard tower.',
    journal: {
      1: 'Magus Orin found a strange talisman. Wizard Fenwick — an academy man before his exile to retail — might read it.',
      2: 'Fenwick attuned the talisman and muttered about a "severed circle". Orin must see it at once.',
      3: null,
    },
    rewards: ['The lost art of Glyphcraft', '12 blank slates', 'The Gale altar revealed'],
    rewardFn: [['item', 'blank_slate', 12]],
  },
  matter_of_colors: {
    name: 'A Matter of Colors',
    qp: 1,
    start: 'Talk to the goblin chiefs at the camp across the river.',
    journal: {
      1: 'Chiefs Wartfang and Grubnose will go to war over armor colors. Old Maud at her dye cart can make dyes — red needs 3 redberries, green needs 3 marsh greens.',
      2: 'I have dye in hand. Time to present options to two very loud goblins.',
      3: 'Red was rejected. Green was rejected. The chiefs demand a third opinion — apparently one exists under the name Grubfoot.',
      4: 'Grubfoot the Uniter has emerged from his tent. Peace hangs by a thread the width of a goblin’s attention span.',
    },
    rewards: ['250 Crafting xp', 'Peace in our time (goblin standards apply)'],
    rewardFn: [['xp', 'Crafting', 250]],
  },

  // ---- Phase 11 quests 6-10 ----
  poultrified_professor: {
    name: 'The Poultrified Professor',
    qp: 1,
    start: 'Talk to the mad wizard in Ravenmoor Manor, on the Murkwell knoll.',
    journal: {
      1: 'The mad wizard turned Professor Pimm into a chicken. Reach the study through the manor’s lever puzzle: oil the stuck lever, and poison the piranha fountain to reach the last lever.',
      2: 'The study door is open. Free Professor Pimm.',
    },
    rewards: ['300 gold', 'The eternal gratitude of a chicken'],
    rewardFn: [['item', 'coins', 300]],
  },
  lord_of_murkwell: {
    name: 'The Lord of Murkwell Manor',
    qp: 3,
    start: 'The villagers whisper of Lord Ravenmoor. Ask the manor’s mad wizard.',
    journal: {
      1: 'Ravenmoor sleeps in the manor crypt. The retired hunter in Corvath’s tavern knows the trick — but wants two beers and some convincing.',
      2: 'The hunter gave me garlic and a stake. With the stake in hand, descend to the manor crypt and end Ravenmoor. He cannot die without it.',
    },
    rewards: ['4,825 Attack xp'],
    rewardFn: [['xp', 'Attack', 4825]],
  },
  squires_blunder: {
    name: "The Squire's Blunder",
    qp: 1,
    start: 'Talk to Squire Aldous in the Hall of the Pale Shield, Whitehold.',
    journal: {
      1: 'Squire Aldous broke his knight’s heirloom sword. Fetch the family portrait from the Hall so cliff-smith Yorra will help.',
      2: 'I have the portrait. Take it to cliff-smith Yorra, on the frozen cliffs by the ice cave.',
      3: 'Yorra needs a coldiron bar. Mine coldiron in the ice cave (Mining 45), smelt it at a furnace, and bring the bar back.',
      4: 'Yorra forged the heirloom anew. Return it to Squire Aldous.',
    },
    rewards: ['12,725 Smithing xp'],
    rewardFn: [['xp', 'Smithing', 12725]],
  },
  shadow_over_corvath: {
    name: 'Shadow Over Corvath',
    qp: 3,
    start: 'Father Merrit fears Malgrim’s cult stirs beneath Corvath.',
    journal: {
      1: 'A trapdoor by the Corvath palace leads to a sealed tomb. Three wardens guard the blade Dawnbrand — answer each riddle for a key.',
      2: 'I hold all three keys. Open Dawnbrand’s reliquary and learn the warding words.',
      3: 'Dawnbrand is drawn, the words are learned. Slay Zarkhul at the summoning circle.',
    },
    rewards: ['Keep Dawnbrand', '3 combat xp lamps'],
    rewardFn: [['item', 'combat_lamp', 3]],
  },
  wyrm_of_ashkara: {
    name: 'The Wyrm of Ashkara',
    qp: 5,
    start: 'Enter the Champions’ Guild in Corvath (12 quest points required).',
    journal: {
      1: 'The Guildmaster names the wyrm Cindermaw. Assemble a sea chart from the hermit (near Sunmarch), the pirate (Gullwick jail), and the collector (Corvath).',
      2: 'I have the full sea chart. Buy an anti-flame kiteshield from the Whitehold armorer, then sail from Gullwick’s docks to the caldera.',
      3: 'The caldera. Cindermaw waits. Slay it — its dragonfire is lethal without the anti-flame kiteshield worn.',
    },
    rewards: ['Right to wear Starmetal platebody', 'Starmetal platebody', '18,650 Strength & Defence xp'],
    rewardFn: [['item', 'starmetal_platebody', 1], ['xp', 'Strength', 9325], ['xp', 'Defence', 9325]],
  },
};

export const QUEST_ORDER = [
  'cooks_calamity', 'unquiet_grave', 'beads_of_the_magus', 'severed_circle', 'matter_of_colors',
  'poultrified_professor', 'lord_of_murkwell', 'squires_blunder', 'shadow_over_corvath', 'wyrm_of_ashkara',
];

// The Champions' Guild opens its door at this many quest points (spec §11).
export const CHAMPIONS_QP_GATE = 12;

// The imps' four stolen beads (drop roughly evenly).
export const BEADS = ['red_bead', 'yellow_bead', 'black_bead', 'white_bead'];

// Glyphcraft: imbue blank slates at an elemental altar once the circle is mended.
export const GLYPHCRAFT = {
  req: 1, xpPerSlate: 9,
  stonesPerSlate: (level) => 1 + Math.floor(level / 10),
  altarElement: 'gale', // the first rediscovered altar
};
