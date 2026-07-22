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

  // ---- Wave 3: repeatable-style bounty quests (kill-count objectives) ----
  crossroads_menace: {
    name: 'The Crossroads Menace',
    qp: 1,
    start: 'Speak with Sergeant Rook at the crossroads east of Holmbridge.',
    journal: {
      1: 'Sergeant Rook wants the crossroads cleared: cull 8 highwaymen and recover the stolen toll ledger from their stash off the road.',
      2: 'I have the ledger. Return it to Sergeant Rook — though he won’t call the road safe until 8 highwaymen have fallen.',
    },
    rewards: ['500 gold', '1,500 Attack xp'],
    rewardFn: [['item', 'coins', 500], ['xp', 'Attack', 1500]],
  },
  blight_cull: {
    name: 'The Blight Cull',
    qp: 2,
    start: 'Speak with Warden Ashe at Brinkton, on the edge of the Blight.',
    journal: {
      1: 'Warden Ashe wants the Blight bled back: slay 5 echoes and 3 ashfiends, and gather 4 shards of ash-glass from the wreckage.',
    },
    rewards: ['1,000 gold', '4,000 Strength xp', '4,000 Defence xp'],
    rewardFn: [['item', 'coins', 1000], ['xp', 'Strength', 4000], ['xp', 'Defence', 4000]],
  },
};

// ---- The villain arc: Malgrim, master of the severed circle ----
QUESTS.embers_of_malgrim = {
  name: 'Embers of Malgrim',
  qp: 2,
  start: 'Speak with Inquisitor Serra outside the Corvath church.',
  journal: {
    1: 'Serra suspects the severed circle never died. Cull 6 Vex cultists at their shrines and bring her 3 cult sigils — by the gale altar, the manor grounds, and the Holmbridge churchyard.',
  },
  rewards: ['2,500 coins', '3,000 Prayer xp'],
  rewardFn: [['item', 'coins', 2500], ['xp', 'Prayer', 3000]],
};
QUESTS.the_black_stair = {
  name: 'The Black Stair',
  qp: 2,
  start: 'Serra has traced the cult’s tunnels to a shaft in the southern hills.',
  journal: {
    1: 'Find the Undervault — a shaft in the hills south of the east road — and recover the Warden’s Seal from its depths.',
    2: 'I hold the Warden’s Seal. Serra will want it — though the gloom stalkers below deserve thinning too (slay 4).',
  },
  rewards: ['4,000 coins', 'A combat xp lamp', 'The Black Stair unsealed'],
  rewardFn: [['item', 'coins', 4000], ['item', 'combat_lamp', 1]],
};
QUESTS.the_last_circle = {
  name: 'The Last Circle',
  qp: 4,
  start: 'The Black Stair stands open. Serra asks the unthinkable: go down and finish it.',
  journal: {
    1: 'Descend the Black Stair beneath the Undervault and disturb Malgrim’s circle. Come armed. Come fed.',
    2: 'Malgrim has stopped hiding. End the master of the severed circle.',
    3: 'Malgrim is dust. Tell Serra the circle is closed for good.',
  },
  rewards: ["Malgrim's mantle", '2 combat xp lamps', '8,000 coins'],
  rewardFn: [['item', 'malgrims_mantle', 1], ['item', 'combat_lamp', 2], ['item', 'coins', 8000]],
};

// ---- The Construction capstone: raising Brinkton from the ash ----
QUESTS.rebuild_brinkton = {
  name: 'Rebuild Brinkton',
  qp: 3,
  start: 'Speak with the Blight survivor in Brinkton, by the signpost.',
  journal: {
    1: 'The survivor has plans and no hands. First, the well: 8 logs and 300 coins at the rebuilding board (Construction 5).',
    2: 'The well flows. Next, Cottage Row: 12 oak logs, 4 iron bars, 1,200 coins (Construction 20).',
    3: 'Families are home. Next, the Ashguard barracks: 14 willow logs, 6 steel bars, 3,000 coins (Construction 35).',
    4: 'The guard is housed. Last, the Beacon Hall: 16 yew logs, 8 mithril bars, 8,000 coins (Construction 50).',
  },
  rewards: ['4,000 Construction xp', 'Brinkton, alive again'],
  rewardFn: [['xp', 'Construction', 4000]],
};

export const QUEST_ORDER = [
  'cooks_calamity', 'unquiet_grave', 'beads_of_the_magus', 'severed_circle', 'matter_of_colors',
  'poultrified_professor', 'lord_of_murkwell', 'squires_blunder', 'shadow_over_corvath', 'wyrm_of_ashkara',
  // Wave 3 (append-only: never reorder — save order is positional)
  'crossroads_menace', 'blight_cull',
  // the villain arc
  'embers_of_malgrim', 'the_black_stair', 'the_last_circle',
  // Round 3
  'rebuild_brinkton',
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
