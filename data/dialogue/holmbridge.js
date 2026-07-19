// OLDHOLM — Holmbridge dialogue trees. Data only; src/dialogue.js interprets.
// Node shape: { speaker: 'npc' | 'player', text, options?: [{label, next?, action?}], next? }
// Actions: 'end', 'openShop', 'openBank'. A tree may set start: [ids] to pick randomly.

export const TREES = {
  shopkeeper: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Welcome to the Holmbridge General Store! We buy anything and sell everything. Mostly buckets.',
        options: [
          { label: 'Let’s trade.', action: 'openShop' },
          { label: 'What do you buy?', next: 'buys' },
          { label: 'Just browsing.', action: 'end' },
        ],
      },
      buys: {
        speaker: 'npc', text: 'Anything with a price, which is everything. I pay poorly and with great enthusiasm.',
        options: [
          { label: 'Let’s trade.', action: 'openShop' },
          { label: 'Goodbye.', action: 'end' },
        ],
      },
    },
  },

  banker: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Good day. Your gold is safe with the Bank of Aldera. Probably.',
        options: [
          { label: 'I’d like to access my bank.', action: 'openBank' },
          { label: '"Probably"?', next: 'probably' },
          { label: 'Goodbye.', action: 'end' },
        ],
      },
      probably: {
        speaker: 'npc', text: 'A jest. The vault is stone, the ledger is ink, and I am extremely underpaid. Nothing safer.',
        options: [
          { label: 'I’d like to access my bank.', action: 'openBank' },
          { label: 'Reassuring. Goodbye.', action: 'end' },
        ],
      },
    },
  },

  wizard: {
    start: [
      { if: { quest: 'severed_circle', is: 1 }, node: 'talisman' },
      { node: 'hello' },
    ],
    nodes: {
      talisman: {
        speaker: 'npc', text: 'What’s this you— by the Academy’s dusty archives. A severance talisman! Someone CUT the glyph circle, ages past — that is why the craft died. Hold still… mmh… hnnnGH… there. Attuned. Take it back to Orin — the old altars will answer it now.',
        options: [{
          label: 'To Orin, then.',
          if: { hasAll: ['strange_talisman'] },
          actions: ['quest:severed_circle:2', 'end'],
        }],
      },
      hello: {
        speaker: 'npc', text: 'Ah, a customer! Or a spark hazard. Fenwick, purveyor of staves and glyph stones. Do NOT lick the glyphs.',
        options: [
          { label: 'Show me your wares.', action: 'openShop' },
          { label: 'What are glyph stones?', next: 'glyphs' },
          { label: 'Goodbye.', action: 'end' },
        ],
      },
      glyphs: {
        speaker: 'npc', text: 'Fuel for spellwork. Ember, Gale, Tide, Stone for the elements — Spirit and Sigil to bind them. There is an older art to make them, but that knowledge is… scattered.',
        options: [
          { label: 'Show me your wares.', action: 'openShop' },
          { label: 'Intriguing. Goodbye.', action: 'end' },
        ],
      },
    },
  },

  smith: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Mind the sparks. Buying, selling, or standing in my light?',
        options: [
          { label: 'Let’s see your arms.', action: 'openShop' },
          { label: 'The anvil out there — may I use it?', next: 'anvil' },
          { label: 'Standing in your light, apparently.', action: 'end' },
        ],
      },
      anvil: {
        speaker: 'npc', text: 'Hammer’s by the stump, furnace is lit. Break the anvil and you buy me a new one.',
        options: [{ label: 'Fair. Goodbye.', action: 'end' }],
      },
    },
  },

  cook: {
    start: [
      { if: { quest: 'cooks_calamity', is: 0 }, node: 'q0' },
      { if: { quest: 'cooks_calamity', is: 1 }, node: 'q1' },
      { node: 'done' },
    ],
    nodes: {
      q0: {
        speaker: 'npc', text: 'DOOM. Doom in an apron. The duke’s birthday is TODAY and I have no cake — no egg, no milk, no flour! I am a sieve of a man!',
        options: [
          { label: 'I could fetch your ingredients.', next: 'q0yes' },
          { label: 'Sounds like a you problem.', action: 'end' },
        ],
      },
      q0yes: {
        speaker: 'npc', text: 'You would?! An egg from the coop across the bridge. Milk — take a bucket to the dairy cow in the pasture. And flour: pick wheat, then mill it at the windmill north of town. Hopper up top, bin below. GO!',
        options: [{ label: 'On it.', actions: ['quest:cooks_calamity:1', 'end'] }],
      },
      q1: {
        speaker: 'npc', text: 'Egg! Milk! Flour! Do you have them? Tell me you have them.',
        options: [
          {
            label: 'All three, right here.',
            if: { hasAll: ['egg', 'bucket_of_milk', 'flour'] },
            actions: ['take:egg:1', 'take:bucket_of_milk:1', 'take:flour:1', 'quest:cooks_calamity:2'],
            next: 'q2',
          },
          { label: 'Still gathering.', next: 'remind' },
        ],
      },
      remind: {
        speaker: 'npc', text: 'Egg — coop. Milk — bucket, dairy cow. Flour — wheat into the windmill hopper, pull the lever, collect from the bin. My whisk hand trembles.',
        options: [{ label: 'Right.', action: 'end' }],
      },
      q2: {
        speaker: 'npc', text: 'You beautiful errand-runner! The oven waits for no one — the duke shall have his cake and I shall keep my head. Use my range whenever you like. It burns less than fires. Like me.',
        options: [{ label: 'Happy baking.', actions: ['complete:cooks_calamity', 'end'] }],
      },
      done: {
        speaker: 'npc', text: 'The cake was a triumph. The duke had seconds. I have been breathing normally for almost a day.',
        options: [{ label: 'Glad to hear it.', action: 'end' }],
      },
    },
  },

  ghost: {
    start: [
      { if: { quest: 'unquiet_grave', is: 1 }, node: 'meet' },
      { if: { quest: 'unquiet_grave', is: 2 }, node: 'waiting' },
      { if: { quest: 'unquiet_grave', is: 3 }, node: 'skull' },
      { node: 'rest' },
    ],
    nodes: {
      meet: {
        speaker: 'npc', text: 'You… you can HEAR me? Oh, mercy. Aldric Weaver, forty years dead and very poorly slept. A robed wretch dug up my skull and hauled it to the wizard tower’s cellar.',
        options: [
          { label: 'I’ll get your skull back.', actions: ['quest:unquiet_grave:2'], next: 'thanks' },
          { label: 'Ghosts. Great. Goodbye.', action: 'end' },
        ],
      },
      thanks: {
        speaker: 'npc', text: 'Bless your ears. The cellar is below the tower — mind the cultist. He bites. Metaphorically. With lightning.',
        options: [{ label: 'Noted.', action: 'end' }],
      },
      waiting: {
        speaker: 'npc', text: 'The cellar, friend. My skull. My poor bald skull.',
        options: [{ label: 'Working on it.', action: 'end' }],
      },
      skull: {
        speaker: 'npc', text: 'That’s it! That’s ME! Oh, the relief — like taking off a boot after forty years. Lay it in my grave and I shall finally sleep.',
        options: [
          {
            label: 'Rest well, Aldric.',
            if: { hasAll: ['skull'] },
            actions: ['take:skull:1', 'complete:unquiet_grave', 'end'],
          },
        ],
      },
      rest: {
        speaker: 'npc', text: '…zzz… (The grave is quiet now. Somewhere, a weaver dreams of thread.)',
        options: [{ label: 'Sleep well.', action: 'end' }],
      },
    },
  },

  magus_orin: {
    start: [
      { if: { quest: 'beads_of_the_magus', is: 0 }, node: 'b0' },
      { if: { quest: 'beads_of_the_magus', is: 1 }, node: 'b1' },
      { if: { quest: 'severed_circle', is: 0 }, node: 's0' },
      { if: { quest: 'severed_circle', is: 1 }, node: 's1' },
      { if: { quest: 'severed_circle', is: 2 }, node: 's2' },
      { node: 'idle' },
    ],
    nodes: {
      b0: {
        speaker: 'npc', text: 'Imps! IMPS, I say! Four of my enchanted beads — red, yellow, black, white — snatched by giggling vermin while I napped academically.',
        options: [
          { label: 'I’ll hunt the imps down.', actions: ['quest:beads_of_the_magus:1'], next: 'b0go' },
          { label: 'Napping academically?', next: 'nap' },
          { label: 'Not my problem.', action: 'end' },
        ],
      },
      nap: {
        speaker: 'npc', text: 'Reviewing the insides of my eyelids for errata. As I said. Academic.',
        options: [{ label: 'Of course. I’ll get the beads.', actions: ['quest:beads_of_the_magus:1'], next: 'b0go' }],
      },
      b0go: {
        speaker: 'npc', text: 'They flit about the meadows south of the tower. They teleport when annoyed, which is always. Bring all four colors.',
        options: [{ label: 'Consider it done.', action: 'end' }],
      },
      b1: {
        speaker: 'npc', text: 'My beads! Have you got them? Red, yellow, black, white — the full academic spectrum.',
        options: [
          {
            label: 'All four, magus.',
            if: { hasAll: ['red_bead', 'yellow_bead', 'black_bead', 'white_bead'] },
            actions: ['take:red_bead:1', 'take:yellow_bead:1', 'take:black_bead:1', 'take:white_bead:1', 'complete:beads_of_the_magus'],
            next: 'bdone',
          },
          { label: 'Still hunting imps.', action: 'end' },
        ],
      },
      bdone: {
        speaker: 'npc', text: 'Restored! Take this amulet — it steadies the aim of sword, arrow, and spell alike. A magus pays his debts.',
        options: [{ label: 'A pleasure, magus.', action: 'end' }],
      },
      s0: {
        speaker: 'npc', text: 'Now — a puzzle. I unearthed this talisman by the old mine: a circle, deliberately severed. Fenwick in the keep was academy once. Take it to him; his eyes are better than his prices.',
        options: [
          { label: 'I’ll take it to Fenwick.', actions: ['give:strange_talisman:1', 'quest:severed_circle:1', 'end'] },
          { label: 'Later, perhaps.', action: 'end' },
        ],
      },
      s1: {
        speaker: 'npc', text: 'Fenwick has the talisman matter in hand, I trust? Wizards and errands — the wheels of knowledge grind on legwork.',
        options: [{ label: 'On my way.', action: 'end' }],
      },
      s2: {
        speaker: 'npc', text: 'A severed circle… so the old Glyphcraft wasn’t lost, it was CUT. Fenwick’s attunement completes it — and look, the wind stirs! An altar of Gale stands revealed north-east, among the pines. Take these slates. Mine more from the pale vein at the outcrop. Write the wind, adventurer.',
        options: [{ label: 'The circle is mended.', actions: ['take:strange_talisman:1', 'complete:severed_circle', 'end'] }],
      },
      idle: {
        speaker: 'npc', text: 'The tower stands, the beads are counted, the circle is mended. A rare good week for wizardry.',
        options: [{ label: 'Long may it last.', action: 'end' }],
      },
    },
  },

  maud: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Dyes, love. Finest colors this side of anywhere. Red from redberries, green from marsh greens — three of either and Maud works her art.',
        options: [
          { label: 'Make me red dye. (3 redberries)', if: { hasAll: ['redberries'] }, next: 'red' },
          { label: 'Make me green dye. (3 marsh greens)', if: { hasAll: ['marsh_greens'] }, next: 'green' },
          { label: 'Why park a dye cart HERE?', next: 'why' },
          { label: 'Just passing. Goodbye.', action: 'end' },
        ],
      },
      red: {
        speaker: 'npc', text: 'Three berries, squeezed with prejudice… there. Red as a chief’s temper.',
        options: [{
          label: 'Take the dye.',
          actions: ['take:redberries:3', 'give:red_dye:1', 'quest:matter_of_colors:2'],
          next: 'bye',
        }],
      },
      green: {
        speaker: 'npc', text: 'Three greens, mashed to a righteous pulp… done. Green as a goblin’s grudge.',
        options: [{
          label: 'Take the dye.',
          actions: ['take:marsh_greens:3', 'give:green_dye:1', 'quest:matter_of_colors:2'],
          next: 'bye',
        }],
      },
      why: {
        speaker: 'npc', text: 'Tanner’s rack there, cows over there, war paint across the river. Location, love. Location.',
        options: [{ label: 'Sound business. Goodbye.', action: 'end' }],
      },
      bye: {
        speaker: 'npc', text: 'Mind it doesn’t stain your conscience.',
        options: [{ label: 'No promises.', action: 'end' }],
      },
    },
  },

  wartfang: {
    start: [
      { if: { quest: 'matter_of_colors', is: 0 }, node: 'q0' },
      { if: { quest: 'matter_of_colors', gte: 1, lt: 3 }, node: 'present' },
      { if: { quest: 'matter_of_colors', is: 3 }, node: 'stall' },
      { if: { quest: 'matter_of_colors', is: 4 }, node: 'stall' },
      { node: 'peace' },
    ],
    nodes: {
      q0: {
        speaker: 'npc', text: 'RED! Armor is RED! Grubnose say green. Grubnose is wrong like a fish in a tree. Soon we WAR about it.',
        options: [
          { label: 'What if I brought a dye and settled this?', next: 'q0go' },
          { label: 'Enjoy your war.', action: 'end' },
        ],
      },
      q0go: {
        speaker: 'npc', text: 'Hah! Human fetch colors! Old Maud by the cow field makes dye. Bring RED. Or bring green and watch me laugh at it.',
        options: [{ label: 'I’ll be back with color.', actions: ['quest:matter_of_colors:1', 'end'] }],
      },
      present: {
        speaker: 'npc', text: 'Show Wartfang the color, human.',
        options: [
          { label: 'Behold: red dye.', if: { hasAll: ['red_dye'] }, next: 'red' },
          { label: 'Behold: green dye.', if: { hasAll: ['green_dye'] }, next: 'green' },
          { label: 'Still fetching.', action: 'end' },
        ],
      },
      red: {
        speaker: 'npc', text: 'Yes!! RED! …but wait. If human brings red, Grubnose says human is MY side. Then war anyway, but about YOU. Hmm. No. NO! This needs bigger brain. Fetch the third opinion. Fetch… GRUBFOOT.',
        options: [{ label: 'Who is Grubfoot?', actions: ['quest:matter_of_colors:3', 'unhide:grubfoot'], next: 'who' }],
      },
      green: {
        speaker: 'npc', text: 'GREEN?! You bring GREEN to WARTFANG? …bold. Stupid-bold. Grubnose will gloat until war comes early. No — this needs the third opinion. Fetch GRUBFOOT.',
        options: [{ label: 'Who is Grubfoot?', actions: ['quest:matter_of_colors:3', 'unhide:grubfoot'], next: 'who' }],
      },
      who: {
        speaker: 'npc', text: 'Oldest goblin. Sleeps in the big tent. Slept through two wars and one flood. If anyone can pick a color without a war, is him.',
        options: [{ label: 'I’ll wake the legend.', action: 'end' }],
      },
      stall: {
        speaker: 'npc', text: 'Grubfoot decides. Wartfang sharpens. Just in case.',
        options: [{ label: 'Comforting.', action: 'end' }],
      },
      peace: {
        speaker: 'npc', text: 'Goblin-colored armor. Was RED all along, deep down. Wartfang is satisfied. Wartfang was always satisfied.',
        options: [{ label: 'History will say so.', action: 'end' }],
      },
    },
  },

  grubnose: {
    start: [
      { if: { quest: 'matter_of_colors', lt: 100 }, node: 'ranting' },
      { node: 'peace' },
    ],
    nodes: {
      ranting: {
        speaker: 'npc', text: 'GREEN. Green like swamp, green like dinner, green like the best boogers. Wartfang’s red is loud. Green is FOREVER.',
        options: [{ label: 'A compelling platform.', action: 'end' }],
      },
      peace: {
        speaker: 'npc', text: 'Goblin-colored is basically green if you squint. Grubnose declares victory quietly, forever.',
        options: [{ label: 'Diplomacy at its finest.', action: 'end' }],
      },
    },
  },

  grubfoot: {
    start: [
      { if: { quest: 'matter_of_colors', is: 3 }, node: 'wake' },
      { if: { quest: 'matter_of_colors', is: 4 }, node: 'decide' },
      { node: 'peace' },
    ],
    nodes: {
      wake: {
        speaker: 'npc', text: '…mnh? Human wakes Grubfoot? Two hundred seasons Grubfoot sleeps, and always the same dream: everyone yelling about colors.',
        options: [{ label: 'They’re about to war over red versus green.', actions: ['quest:matter_of_colors:4'], next: 'sigh' }],
      },
      sigh: {
        speaker: 'npc', text: 'Always. ALWAYS. Bring the chiefs’ nonsense to me — Grubfoot will end it the old way: with a decision nobody likes equally.',
        options: [{ label: 'Ready when you are.', action: 'end' }],
      },
      decide: {
        speaker: 'npc', text: 'HEAR GRUBFOOT! Armor stays goblin-colored: the proud shade of mud, moss, and whatever was in the pot. Red keeps red flags. Green keeps green feelings. War is cancelled. Grubfoot goes back to sleep.',
        options: [{
          label: 'Witnessed. Peace under Grubfoot the Uniter.',
          actions: ['complete:matter_of_colors', 'end'],
        }],
      },
      peace: {
        speaker: 'npc', text: '…zzz… (The Uniter dreams, and the camp bickers at a respectful volume.)',
        options: [{ label: 'Sleep, legend.', action: 'end' }],
      },
    },
  },

  priest: {
    start: [
      { if: { quest: 'unquiet_grave', is: 0 }, node: 'hello' },
      { if: { quest: 'unquiet_grave', lt: 100 }, node: 'during' },
      { node: 'after' },
    ],
    nodes: {
      hello: {
        speaker: 'npc', text: 'Aurel’s light on you, traveler. Order, gold, and punctuality — the three graces. Though… our churchyard has lately known little order at all.',
        options: [
          { label: 'What troubles the churchyard?', next: 'trouble' },
          { label: 'Tell me of Aurel.', next: 'aurel' },
          { label: 'And the altar?', next: 'altar' },
          { label: 'Light on you too. Goodbye.', action: 'end' },
        ],
      },
      trouble: {
        speaker: 'npc', text: 'A restless spirit weeps among the graves by night. I hear only wind — the dead speak on frequencies faith alone cannot tune. Take this Spectral Charm. Carry it, and listen where the stones lean.',
        options: [
          { label: 'I’ll speak with your ghost.', actions: ['give:spectral_charm:1', 'quest:unquiet_grave:1', 'end'] },
          { label: 'Ghosts are above my pay. Goodbye.', action: 'end' },
        ],
      },
      during: {
        speaker: 'npc', text: 'The charm hums when the spirit is near. The graves are behind the church. Aurel keep you.',
        options: [{ label: 'I’m on it, Father.', action: 'end' }],
      },
      after: {
        speaker: 'npc', text: 'The churchyard is quiet. Whatever you did for that poor soul — Aurel has entered it in your ledger, on the good side.',
        options: [
          { label: 'Tell me of Aurel.', next: 'aurel' },
          { label: 'Light on you, Father.', action: 'end' },
        ],
      },
      aurel: {
        speaker: 'npc', text: 'Keeper of order and honest ledgers. Malgrim tears down, Verdan lets the weeds grow — Aurel files the paperwork that keeps the realm standing.',
        options: [{ label: 'Sensible god. Goodbye.', action: 'end' }],
      },
      altar: {
        speaker: 'npc', text: 'Kneel there and your spirit is restored. The candle is decorative. Please stop taking the candle.',
        options: [{ label: 'No promises. Goodbye.', action: 'end' }],
      },
    },
  },

  market_clerk: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'The Grand Market of Corvath. Post an offer, the book finds a taker, the box holds your winnings. Prices drift — patience pays, greed waits.',
        options: [
          { label: 'Open the order book.', action: 'openMarket' },
          { label: 'How do prices work?', next: 'prices' },
          { label: 'Another time.', action: 'end' },
        ],
      },
      prices: {
        speaker: 'npc', text: 'Every good has a fair price that wanders like a drunk goat. Sell at or under it, you fill fast. Ask the moon, and the moon takes her time.',
        options: [
          { label: 'Open the order book.', action: 'openMarket' },
          { label: 'Poetic. Goodbye.', action: 'end' },
        ],
      },
    },
  },

  guildmaster: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Guildmaster Dorn. The guild floor below is members only — Mining sixty, no exceptions, not even for people who ask twice.',
        options: [
          { label: 'What’s down there?', next: 'down' },
          { label: 'I’ll come back at sixty.', action: 'end' },
        ],
      },
      down: {
        speaker: 'npc', text: 'Coal seams like black butter and a gold vein that behaves itself. The dwarven mine north of the walls is open to everyone — start there, work up.',
        options: [{ label: 'To the north mine, then.', action: 'end' }],
      },
    },
  },

  villager: {
    start: ['one', 'two', 'three'],
    nodes: {
      one: {
        speaker: 'npc', text: 'The fog? You get used to it. The goblins? Less so.',
        options: [{ label: 'Noted.', action: 'end' }],
      },
      two: {
        speaker: 'npc', text: 'If you find my old boot by the river, keep it. It has moved on, and so have I.',
        options: [{ label: 'A dignified parting.', action: 'end' }],
      },
      three: {
        speaker: 'npc', text: 'Work hard, bank often, and never trust a cow that looks relaxed.',
        options: [{ label: 'Words to live by.', action: 'end' }],
      },
    },
  },
};
