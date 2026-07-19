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
};

export const QUEST_ORDER = [
  'cooks_calamity', 'unquiet_grave', 'beads_of_the_magus', 'severed_circle', 'matter_of_colors',
];

// The imps' four stolen beads (drop roughly evenly).
export const BEADS = ['red_bead', 'yellow_bead', 'black_bead', 'white_bead'];

// Glyphcraft: imbue blank slates at an elemental altar once the circle is mended.
export const GLYPHCRAFT = {
  req: 1, xpPerSlate: 9,
  stonesPerSlate: (level) => 1 + Math.floor(level / 10),
  altarElement: 'gale', // the first rediscovered altar
};
