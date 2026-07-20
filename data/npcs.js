// OLDHOLM — human NPCs. They reuse the mob chassis (wander, tile movement,
// merged low-poly models) but talk instead of fight. Fields beyond mobs.js:
//   talk: dialogue tree id      shop: shop id (adds Trade)
//   bank: true (adds Bank)      chatter: overhead one-liners near the player
//   plane: building floor

import { figure } from './figure.js';

// A rounded low-poly person. boot defaults dark; pass a 5th colour to override.
const human = (skin, shirt, pants, hair, boot = 0x3a2f26) =>
  ({ height: 1.62, parts: figure({ skin, shirt, pants, hair, boot }) });

const base = {
  attackable: false,
  stats: { att: 1, str: 1, def: 1, hp: 7 },
  bonuses: { att: 0, str: 0, def: 0 },
  attackType: 'crush',
  speed: 4, aggroRadius: 0, respawnTicks: 50,
  drops: [], alwaysDrops: 0,
};

export const NPCS = {
  shopkeeper: {
    ...base, name: 'Shopkeeper',
    examine: 'Sells everything, judges nothing.',
    talk: 'shopkeeper', shop: 'general_store', wanderRadius: 0,
    model: human(0xd8b090, 0x6a7a4a, 0x5a4a33, 0x6e4f33),
  },
  banker: {
    ...base, name: 'Banker',
    examine: 'Guardian of other people’s money.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xc9a27a, 0x2e3a55, 0x2a2a30, 0x3a3632),
  },
  wizard_fenwick: {
    ...base, name: 'Wizard Fenwick',
    examine: 'Smells faintly of ozone and overconfidence.',
    talk: 'wizard', shop: 'staff_shop', wanderRadius: 0,
    model: human(0xd8b090, 0x3a4a8f, 0x2e3a72, 0x8a8078),
  },
  smith_hilda: {
    ...base, name: 'Smith Hilda',
    examine: 'Arms like anvils. Sells arms, also.',
    talk: 'smith', shop: 'sword_shop', wanderRadius: 1,
    model: human(0xc9a27a, 0x6a4a3a, 0x3a3632, 0xb5542a),
  },
  cook: {
    ...base, name: 'Cook Bramble',
    examine: 'Flour-dusted and quietly panicking.',
    talk: 'cook', wanderRadius: 1,
    model: human(0xd8b090, 0xe8e4da, 0x8a8078, 0x5a4a33),
    chatter: ['The duke eats like a horse with opinions.', 'Where did I put the sugar…'],
  },
  priest: {
    ...base, name: 'Father Merrit',
    examine: 'At peace with everything except the church roof.',
    talk: 'priest', wanderRadius: 1,
    model: human(0xc9a27a, 0xe8e2d0, 0xe8e2d0, 0x8a8078),
    chatter: ['Aurel keeps the ledger of every soul.', 'Mind the pews. They bite splinters.'],
  },
  villager_man: {
    ...base, name: 'Villager',
    examine: 'A man with somewhere vaguely to be.',
    talk: 'villager', wanderRadius: 6,
    model: human(0xd8b090, 0x8a6a42, 0x5a4a33, 0x3a3632),
    chatter: [
      'Lovely day, if you like fog.',
      'The goblins argue about armor colors. All night. ALL night.',
      'They say the bank is upstairs in the keep. Fancy that.',
    ],
  },
  magus_orin: {
    ...base, name: 'Magus Orin',
    examine: 'A wizard of the old school, and the old school’s old school.',
    talk: 'magus_orin', wanderRadius: 1,
    model: human(0xc9a27a, 0x5a3a72, 0x45305a, 0xe8e4da),
    chatter: ['The tower hums on Tuesdays. Nobody knows why.', 'Beads do not simply walk off. Imps, however…'],
  },
  maud: {
    ...base, name: 'Old Maud',
    examine: 'Hands stained forty colors, none of them regret.',
    talk: 'maud', wanderRadius: 0,
    model: human(0xc9a27a, 0x8f3f5a, 0x4a3a45, 0xd8d0c2),
    chatter: ['Reds from the bush, greens from the marsh.', 'Everything stains, love. Choose what.'],
  },
  ghost: {
    ...base, name: 'Ghost',
    examine: 'A shimmer of grief in the shape of a man.',
    talk: 'ghost', wanderRadius: 1, needsCharm: true,
    model: {
      height: 1.5,
      parts: [
        { kind: 'box', size: [0.42, 0.68, 0.26], at: [0, 0.75, 0], color: 0xbfd8cf },
        { kind: 'box', size: [0.3, 0.3, 0.28], at: [0, 1.28, 0], color: 0xd8e8e0 },
        { kind: 'box', size: [0.11, 0.44, 0.13], at: [-0.27, 0.78, 0], color: 0xbfd8cf },
        { kind: 'box', size: [0.11, 0.44, 0.13], at: [0.27, 0.78, 0], color: 0xbfd8cf },
      ],
    },
  },
  wartfang: {
    ...base, name: 'Chief Wartfang',
    examine: 'Red of banner, red of face.',
    talk: 'wartfang', wanderRadius: 1,
    model: {
      height: 1.25,
      parts: [
        { kind: 'box', size: [0.5, 0.5, 0.32], at: [0, 0.64, 0], color: 0x8f3f34 },
        { kind: 'box', size: [0.46, 0.42, 0.42], at: [0, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [-0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [-0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [-0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'cone', r: 0.1, h: 0.3, at: [0, 1.4, 0], color: 0xc23a3a },
      ],
    },
    chatter: ['RED!', 'Wartfang sharpens. Just in case.'],
  },
  grubnose: {
    ...base, name: 'Chief Grubnose',
    examine: 'Green of banner, green of everything, honestly.',
    talk: 'grubnose', wanderRadius: 1,
    model: {
      height: 1.25,
      parts: [
        { kind: 'box', size: [0.5, 0.5, 0.32], at: [0, 0.64, 0], color: 0x3f6f34 },
        { kind: 'box', size: [0.46, 0.42, 0.42], at: [0, 1.06, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [-0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.1, 0.05], at: [0.28, 1.1, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [-0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.12, 0.4, 0.12], at: [0.33, 0.6, 0], color: 0x6f8f3f },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [-0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'box', size: [0.14, 0.4, 0.14], at: [0.13, 0.2, 0], color: 0x5e4a33 },
        { kind: 'cone', r: 0.1, h: 0.3, at: [0, 1.4, 0], color: 0x4a8f3a },
      ],
    },
    chatter: ['GREEN!', 'Green is forever, human.'],
  },
  grubfoot: {
    ...base, name: 'Grubfoot the Uniter',
    examine: 'Two hundred seasons old and every one of them earned.',
    talk: 'grubfoot', wanderRadius: 0, hidden: true,
    model: {
      height: 1.15,
      parts: [
        { kind: 'box', size: [0.54, 0.46, 0.36], at: [0, 0.6, 0], color: 0x6a5a3a },
        { kind: 'box', size: [0.48, 0.44, 0.44], at: [0, 1.02, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.13, 0.1, 0.05], at: [-0.3, 1.06, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.13, 0.1, 0.05], at: [0.3, 1.06, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.4, 0.08, 0.42], at: [0, 1.28, 0], color: 0xd8d0c2 },
        { kind: 'box', size: [0.12, 0.36, 0.12], at: [-0.34, 0.56, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.12, 0.36, 0.12], at: [0.34, 0.56, 0], color: 0x5f7f36 },
        { kind: 'box', size: [0.15, 0.36, 0.15], at: [-0.14, 0.18, 0], color: 0x4a3a28 },
        { kind: 'box', size: [0.15, 0.36, 0.15], at: [0.14, 0.18, 0], color: 0x4a3a28 },
      ],
    },
  },
  dairy_cow: {
    ...base, name: 'Dairy cow',
    examine: 'The realm’s most patient beverage dispenser.',
    milkable: true, wanderRadius: 1,
    model: {
      height: 1.15,
      parts: [
        { kind: 'box', size: [0.62, 0.62, 1.15], at: [0, 0.72, 0], color: 0xe6e2d8 },
        { kind: 'box', size: [0.34, 0.3, 0.5], at: [0.16, 0.6, 0.3], color: 0x8a6a5a },
        { kind: 'box', size: [0.3, 0.3, 0.34], at: [0, 0.92, -0.72], color: 0xe6e2d8 },
        { kind: 'box', size: [0.1, 0.1, 0.14], at: [0, 0.84, -0.9], color: 0xd8b5a0 },
        { kind: 'box', size: [0.26, 0.05, 0.05], at: [0, 1.1, -0.72], color: 0xcfc8b8 },
        { kind: 'box', size: [0.24, 0.18, 0.3], at: [0, 0.32, 0.18], color: 0xd8b5a0 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, 0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [-0.22, 0.21, -0.42], color: 0xe6e2d8 },
        { kind: 'box', size: [0.09, 0.42, 0.09], at: [0.22, 0.21, -0.42], color: 0xe6e2d8 },
      ],
    },
  },
  // ---- Phase 10 townsfolk (reuse the generic shopkeeper/banker trees) ----
  corvath_swordsmith: {
    ...base, name: 'Swordsmith', examine: 'Sells edges, keeps his own.',
    talk: 'corvath_swordsmith', shop: 'corvath_swords', wanderRadius: 0,
    model: human(0xc9a27a, 0x6a4a3a, 0x3a3632, 0x2a2624),
  },
  corvath_staffseller: {
    ...base, name: 'Staff-seller', examine: 'Every finger ringed, every ring humming.',
    talk: 'wizard', shop: 'corvath_staffs', wanderRadius: 0,
    model: human(0xd8b090, 0x45305a, 0x3a2a4a, 0xe8e4da),
  },
  corvath_banker: {
    ...base, name: 'Banker', examine: 'Capital-city composure, county-fair salary.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xd8b090, 0x2e3a55, 0x2a2a30, 0x6e4f33),
  },
  market_clerk: {
    ...base, name: 'Market clerk', examine: 'Keeper of the order book and its many sorrows.',
    talk: 'market_clerk', market: true, wanderRadius: 0,
    model: human(0xc9a27a, 0x8f6a2a, 0x5a4a33, 0x3a3632),
    chatter: ['Prices drift. So do buyers.', 'The collection box does not judge. Much.'],
  },
  guildmaster: {
    ...base, name: 'Guildmaster Dorn', examine: 'Half dwarf-blood, all pickaxe.',
    talk: 'guildmaster', wanderRadius: 1,
    model: human(0xc9a27a, 0x8a5a2a, 0x4a3a28, 0xb5542a),
    chatter: ['Sixty Mining or the ladder stays shut.', 'The coal down there practically leaps into the pack.'],
  },
  skalvik_helmsmith: {
    ...base, name: 'Helm-smith', examine: 'Believes every problem is head-shaped.',
    talk: 'skalvik_helmsmith', shop: 'skalvik_helmets', wanderRadius: 0,
    model: human(0xd8b090, 0x8a6a42, 0x5a4a33, 0xb5542a),
  },
  brinkton_keeper: {
    ...base, name: 'Shopkeeper', examine: 'Stocks for the road north. Prays you go south.',
    talk: 'brinkton_keeper', shop: 'brinkton_general', wanderRadius: 0,
    model: human(0xc9a27a, 0x5a5a45, 0x3a3a30, 0x8a8078),
    chatter: ['You hear things, out here. Big things.', 'Nobody retires in Brinkton. They relocate.'],
  },
  murkwell_keeper: {
    ...base, name: 'Shopkeeper', examine: 'Sells damp goods with dry wit.',
    talk: 'murkwell_keeper', shop: 'murkwell_general', wanderRadius: 0,
    model: human(0xd8b090, 0x4a4a52, 0x33333a, 0x5a4a33),
  },
  murkwell_banker: {
    ...base, name: 'Banker', examine: 'Keeps the ledgers above the waterline.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xc9a27a, 0x2e3a55, 0x2a2a30, 0xd8d0c2),
  },
  villager_woman: {
    ...base, name: 'Villager',
    examine: 'A woman who has seen your type before.',
    talk: 'villager', wanderRadius: 6,
    model: human(0xc9a27a, 0x7a4a5a, 0x4a3a45, 0x6e4f33),
    chatter: [
      'Cows again. It is always cows with you adventurers.',
      'Father Merrit blesses the nets on fish-days.',
      'Keep off the wheat. We do not have wheat yet, but keep off it.',
    ],
  },

  // ---- Phase 11: Sunmarch ----
  toll_guard: {
    ...base, name: 'Toll guard', examine: 'Ten gold and a smile. The smile is optional.',
    talk: 'toll_guard', wanderRadius: 0,
    model: human(0xb08050, 0xcaa96a, 0x8a6a3a, 0x2a2624),
    chatter: ['Ten gold to pass. Rules are rules.', 'The desert takes no tolls. I do.'],
  },
  scimitar_seller: {
    ...base, name: 'Scimitar-seller', examine: 'Curved goods, straight prices.',
    talk: 'scimitar_seller', shop: 'sunmarch_scimitars', wanderRadius: 0,
    model: human(0xb08050, 0x8a3a2a, 0x5a2a1a, 0x2a2624),
  },
  sunmarch_tanner: {
    ...base, name: 'Tanner', examine: 'Turns yesterday’s cows into tomorrow’s fashion.',
    talk: 'tanner', shop: 'sunmarch_leather', wanderRadius: 0,
    model: human(0xb08050, 0x8a6a42, 0x5a4a33, 0x3a3028),
  },
  gem_seller: {
    ...base, name: 'Gem-seller', examine: 'Every stone a promise; every promise, cut.',
    talk: 'gem_seller', shop: 'sunmarch_gems', wanderRadius: 0,
    model: human(0xc9a27a, 0x4a3a8a, 0x2a2a5a, 0x2a2624),
  },
  meat_vendor: {
    ...base, name: 'Meat vendor', examine: 'Sells kebabs. Never names the animal.',
    talk: 'meat_vendor', shop: 'sunmarch_meat', wanderRadius: 0,
    model: human(0xb08050, 0xb5542a, 0x6a3a2a, 0x2a2624),
    chatter: ['Kebab! Fresh-ish kebab!', 'The meat is a surprise. A nice surprise.'],
  },

  // ---- Phase 11: Port Gullwick ----
  fishmonger: {
    ...base, name: 'Fishmonger', examine: 'Smells of the sea and honest labor.',
    talk: 'fishmonger', shop: 'gullwick_fishing', wanderRadius: 0,
    model: human(0xc9a27a, 0x2a6a7a, 0x1a4a5a, 0x5a4a33),
  },
  ferryman: {
    ...base, name: 'Ferryman', examine: 'He has seen you struggle. He is not impressed. Yet.',
    talk: 'ferryman', wanderRadius: 0,
    model: human(0xb08050, 0x3a4a5a, 0x2a3040, 0x8a8078),
    chatter: ['The sea keeps its own counsel.', 'Ashkara? You’d need a chart. And a death wish.'],
  },
  gullwick_barkeep: {
    ...base, name: 'Barkeep', examine: 'Pours a fair pint and a foul rumor.',
    talk: 'gullwick_barkeep', shop: 'gullwick_tavern', wanderRadius: 0,
    model: human(0xc9a27a, 0x6a4a3a, 0x3a3028, 0x3a3632),
  },
  pirate: {
    ...base, name: 'Pirate', examine: 'Jailed, jovial, and full of nautical opinions.',
    talk: 'pirate', wanderRadius: 0,
    model: human(0xb08050, 0x5a2a3a, 0x2a2a30, 0x2a2624),
    chatter: ['Arr, and other vowels!', 'A third of a chart’s worth more than a whole cell.'],
  },

  // ---- Phase 11: Ashkara ----
  chieftain: {
    ...base, name: 'Chieftain Vola', examine: 'Rules the isle and the bananas equally.',
    talk: 'chieftain', wanderRadius: 1,
    model: human(0x9a6a4a, 0x5a7a3a, 0x3a5a2a, 0x2a2624),
    chatter: ['The mountain sleeps. Keep it that way.', 'Cindermaw stirs. You brought a shield, yes?'],
  },
  banana_seller: {
    ...base, name: 'Banana-seller', examine: 'Vertically integrated. Horizontally delicious.',
    talk: 'banana_seller', shop: 'ashkara_bananas', wanderRadius: 0,
    model: human(0x9a6a4a, 0xe0c83a, 0x6a5a2a, 0x2a2624),
  },
  hermit: {
    ...base, name: 'Hermit', examine: 'Chose solitude. Regrets it near mealtimes.',
    talk: 'hermit', wanderRadius: 1,
    model: human(0xc9a27a, 0x7a7060, 0x5a5040, 0xd8d0c2),
    chatter: ['I keep a corner of a chart. And my own counsel.', 'Company! At last! Please leave.'],
  },

  // ---- Phase 11: Corvath quest folk ----
  hunter: {
    ...base, name: 'Retired hunter', examine: 'Hunted monsters. Now hunts a quiet pint.',
    talk: 'hunter', wanderRadius: 0,
    model: human(0xc9a27a, 0x4a5a3a, 0x3a3028, 0x8a8078),
    chatter: ['Ravenmoor? Bad memories, that name.', 'Two beers and I might remember the trick.'],
  },
  collector: {
    ...base, name: 'Collector', examine: 'Owns beautiful things and few friends.',
    talk: 'collector', wanderRadius: 0,
    model: human(0xd8b090, 0x5a3a6a, 0x2a2a4a, 0x3a3632),
  },

  // ---- Phase 11: Whitehold quest folk ----
  squire: {
    ...base, name: 'Squire Aldous', examine: 'Broke the heirloom. Has not slept since.',
    talk: 'squire', wanderRadius: 0,
    model: human(0xd8b090, 0xd8d8d2, 0x8a8a92, 0xb5854b),
    chatter: ['The sword! I only leaned on it a little!', 'Sir Bellwether will have my head. Rightly.'],
  },
  armorer: {
    ...base, name: 'Armorer', examine: 'Fits knights and, occasionally, dragon-slayers.',
    talk: 'armorer', shop: 'whitehold_armory', wanderRadius: 0,
    model: human(0xc9a27a, 0x8a8a92, 0x5a5a62, 0x3a3632),
  },
  cliff_smith: {
    ...base, name: 'Cliff-smith Yorra', examine: 'Left the guilds to forge in peace and frost.',
    talk: 'cliff_smith', wanderRadius: 0,
    model: human(0xb08050, 0x5a4a3a, 0x3a3028, 0xb5542a),
  },

  // ---- Phase 11: Champions' Guild ----
  champions_master: {
    ...base, name: 'Guildmaster of Champions', examine: 'Weighs your quest points, not your muscles.',
    talk: 'champions_master', wanderRadius: 0,
    model: human(0xd8b090, 0xb0a878, 0x8a7a3a, 0x8a8078),
  },

  // ---- Phase 11: Murkwell manor ----
  mad_wizard: {
    ...base, name: 'The mad wizard', examine: 'His experiments have opinions. Loud ones.',
    talk: 'mad_wizard', wanderRadius: 0,
    model: human(0xc9a27a, 0x6a3a8a, 0x4a2a5a, 0xe8e4da),
    chatter: ['The professor pecks at my notes!', 'Levers! Everything is levers, if you think about it.'],
  },
  professor: {
    ...base, name: 'Professor Pimm', examine: 'A distinguished academic. Also, currently, a chicken.',
    talk: 'professor', wanderRadius: 1,
    model: {
      height: 0.62,
      parts: [
        { kind: 'box', size: [0.34, 0.3, 0.42], at: [0, 0.3, 0], color: 0xe8e4da },
        { kind: 'box', size: [0.18, 0.18, 0.18], at: [0, 0.56, -0.22], color: 0xe8e4da },
        { kind: 'box', size: [0.2, 0.06, 0.02], at: [0, 0.58, -0.3], color: 0x2a2624 }, // spectacles
        { kind: 'cone', r: 0.05, h: 0.12, at: [0, 0.56, -0.34], rotX: -1.57, color: 0xd8a03a },
        { kind: 'box', size: [0.05, 0.08, 0.05], at: [0, 0.6, -0.16], color: 0xc84b38 },
        { kind: 'box', size: [0.04, 0.16, 0.04], at: [-0.08, 0.08, 0], color: 0xd8a03a },
        { kind: 'box', size: [0.04, 0.16, 0.04], at: [0.08, 0.08, 0], color: 0xd8a03a },
      ],
    },
  },

  // ---- Phase 11: tomb wardens (quest 9 riddles) ----
  warden_stone: {
    ...base, name: 'Warden of Stone', examine: 'A statue that answers, if you ask correctly.',
    talk: 'warden_stone', wanderRadius: 0,
    model: human(0x8a8a82, 0x6a6a62, 0x5a5a52, 0x7a7a72),
  },
  warden_flame: {
    ...base, name: 'Warden of Flame', examine: 'It flickers with borrowed life.',
    talk: 'warden_flame', wanderRadius: 0,
    model: human(0xd86a2a, 0xa84a1a, 0x8a3a10, 0xe0a83a),
  },
  warden_deep: {
    ...base, name: 'Warden of the Deep', examine: 'Cold, patient, and very sure of itself.',
    talk: 'warden_deep', wanderRadius: 0,
    model: human(0x5a6a8a, 0x3a4a6a, 0x2a3a5a, 0x6a7a9a),
  },

  // ---- Wave 3: bounty-quest givers ----
  crossroads_sergeant: {
    ...base, name: 'Sergeant Rook', examine: 'Guards the crossroads, mostly by frowning at it.',
    talk: 'crossroads_sergeant', wanderRadius: 1,
    model: {
      height: 1.64,
      parts: [
        ...figure({ skin: 0xd8b090, shirt: 0x7a7a82, sleeve: 0x6a6a72, pants: 0x4a4a52, hair: 0x3a3632, boot: 0x3a3a40 }),
        { kind: 'sphere', r: 0.17, scale: [1.06, 0.74, 1.06], at: [0, 1.44, 0], color: 0x9a9aa2 }, // helm
      ],
    },
    chatter: ['Keep to the road and keep your purse close.', 'Highwaymen again. Always again.'],
  },
  blight_warden: {
    ...base, name: 'Warden Ashe', examine: 'Watches the ash road so Brinkton doesn’t have to.',
    talk: 'blight_warden', wanderRadius: 1,
    model: {
      height: 1.62,
      parts: [
        ...figure({ skin: 0xc9a27a, shirt: 0x4a4640, sleeve: 0x3a352c, pants: 0x33302a, hair: 0x5a5048, boot: 0x2a2620 }),
        { kind: 'cone', r: 0.22, h: 0.34, seg: 8, at: [0, 1.5, 0], color: 0x3a352c }, // hood
        { kind: 'box', size: [0.5, 0.06, 0.16], at: [0, 1.02, 0.02], color: 0x2a2620 }, // baldric
      ],
    },
    chatter: ['The Blight leaks. Someone has to bleed it back.', 'Echoes at the verge. Ashfiends past them. Mind both.'],
  },

  // ---- Wave 4: bankers for the four bankless towns (bank:true adds Bank) ----
  whitehold_banker: {
    ...base, name: 'Banker', examine: 'Keeps the knights’ coin as polished as their shields.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xd8b090, 0x2e3a55, 0x2a2a30, 0x8a8078, 0xd8d8d2),
  },
  skalvik_banker: {
    ...base, name: 'Banker', examine: 'Vault’s a longhouse cellar. Nobody’s brave enough to test it.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xd8b090, 0x3a4a5a, 0x2a3040, 0xb5542a),
  },
  gullwick_banker: {
    ...base, name: 'Banker', examine: 'Salt in the ledger, iron in the strongbox.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0xc9a27a, 0x2a5a6a, 0x1a3a4a, 0x5a4a33),
  },
  ashkara_banker: {
    ...base, name: 'Banker', examine: 'Banks bananas and bullion alike. Mostly bananas.',
    talk: 'banker', bank: true, wanderRadius: 0,
    model: human(0x9a6a4a, 0x5a7a3a, 0x3a5a2a, 0x2a2624),
  },

  // ---- Wave 5: Skalvik & Brinkton townsfolk (finally with voices) ----
  skalvik_jarl: {
    ...base, name: 'Jarl Halvard', examine: 'Rules the longhouses by right of shouting loudest.',
    talk: 'skalvik_jarl', wanderRadius: 1,
    model: {
      height: 1.7,
      parts: [
        ...figure({ scale: 1.06, build: 1.3, skin: 0xd8b090, shirt: 0x6a4a3a, sleeve: 0x8a6a4a, pants: 0x4a3a2a, hair: 0xb5854b, boot: 0x3a2e22 }),
        { kind: 'sphere', r: 0.17, scale: [1.05, 1.1, 0.8], at: [0, 1.34, 0.08], color: 0xb5854b }, // big beard
        { kind: 'cyl', rt: 0.19, rb: 0.19, h: 0.12, seg: 10, at: [0, 1.56, 0], color: 0xcfc8b8 }, // iron circlet
        { kind: 'cone', r: 0.05, h: 0.16, rotZ: 0.7, at: [0.16, 1.66, 0], color: 0xe8e0d0 }, // horns
        { kind: 'cone', r: 0.05, h: 0.16, rotZ: -0.7, at: [-0.16, 1.66, 0], color: 0xe8e0d0 },
      ],
    },
    chatter: ['Drink! The benches are for sleeping, the floor for the rest.', 'Whitehold calls us barbarians. We call it Tuesday.'],
  },
  skalvik_skald: {
    ...base, name: 'Skald', examine: 'Rhymes for a living. Ducks benches for a hobby.',
    talk: 'skalvik_skald', wanderRadius: 2,
    model: {
      height: 1.58,
      parts: [
        ...figure({ scale: 0.98, skin: 0xc9a27a, shirt: 0x5a3a72, sleeve: 0x7a5a92, pants: 0x3a2a4a, hair: 0x3a3632, boot: 0x2a2620 }),
        { kind: 'box', size: [0.24, 0.3, 0.08], rotZ: 0.5, at: [0.24, 1.0, 0.08], color: 0x8a5a2a }, // a lute on the back
        { kind: 'cyl', rt: 0.02, rb: 0.02, h: 0.34, rotZ: 0.5, at: [0.36, 1.16, 0.08], color: 0x6a4a2a }, // its neck
      ],
    },
    chatter: ['A saga for a coin? A limerick for less?', 'I rhymed "Halvard" with "hard word" once. He threw a bench.'],
  },
  blight_survivor: {
    ...base, name: 'Blight survivor', examine: 'Went north whole. Came back mostly.',
    talk: 'blight_survivor', wanderRadius: 1,
    model: {
      height: 1.6,
      parts: [
        ...figure({ skin: 0xa89a86, shirt: 0x5a564e, sleeve: 0x4a463e, pants: 0x3a352c, hair: 0x6a6058, boot: 0x2a2620 }),
        { kind: 'cone', r: 0.22, h: 0.34, seg: 8, at: [0, 1.5, 0], color: 0x4a463e }, // deep hood
        { kind: 'box', size: [0.18, 0.05, 0.14], at: [-0.05, 1.34, 0.12], color: 0x8a4a3a }, // ash-scar across the face
      ],
    },
    chatter: ['Don’t look north. I looked north.', 'The Blight keeps everything you drop. Everything.'],
  },
};
