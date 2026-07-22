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
      { if: { quest: 'shadow_over_corvath', is: 0 }, node: 'corvath0' },
      { if: { quest: 'shadow_over_corvath', lt: 100 }, node: 'corvathprog' },
      { node: 'after' },
    ],
    nodes: {
      corvath0: {
        speaker: 'npc', text: 'You have the ear of the dead, and I have grim need of it. Word from the capital: Malgrim’s cult stirs beneath Corvath, working to summon the ash demon Zarkhul. There is a sealed tomb below the palace — and in it, the blessed blade Dawnbrand. Will you go?',
        options: [
          { label: 'I’ll stop the summoning.', actions: ['quest:shadow_over_corvath:1'], next: 'corvathgo' },
          { label: 'That’s Corvath’s problem.', action: 'end' },
        ],
      },
      corvathgo: {
        speaker: 'npc', text: 'A trapdoor by the Corvath palace descends to the tomb. Three wardens guard Dawnbrand, each with a riddle — answer them for the keys. Take up the blade, learn the warding words within, and end Zarkhul at the circle. Dawnbrand was forged for exactly this.',
        options: [{ label: 'To Corvath, then.', action: 'end' }],
      },
      corvathprog: {
        speaker: 'npc', text: 'The tomb below the Corvath palace. Answer the wardens, claim Dawnbrand, speak the wards, and strike. Aurel steady your arm against the ash.',
        options: [{ label: 'It will be done, Father.', action: 'end' }],
      },
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

  // ================= Phase 11 =================
  toll_guard: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Ten gold to pass into Sunmarch. Pay at the gate bar. The desert is free; I am not.',
        options: [
          { label: 'Why a toll?', next: 'why' },
          { label: 'Understood.', action: 'end' },
        ],
      },
      why: {
        speaker: 'npc', text: 'Shade costs money. Water costs more. Somebody has to pay for the fountains, and it will not be me.',
        options: [{ label: 'Fair enough.', action: 'end' }],
      },
    },
  },
  tanner: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Cowhides into leather, one coin the hide. Best in the desert, or my name isn’t on this apron.',
        options: [
          { label: 'Tan my hides.', action: 'tan' },
          { label: 'Just admiring the smell.', action: 'end' },
        ],
      },
    },
  },
  ferryman: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', gte: 2, lt: 100 }, node: 'ready' },
      { node: 'flavor' },
    ],
    nodes: {
      ready: {
        speaker: 'npc', text: 'So you’ve the full chart. The boat’s at the pier — thirty gold, one way, no refunds, no rescues. Board when your courage does.',
        options: [{ label: 'I’ll board when ready.', action: 'end' }],
      },
      flavor: {
        speaker: 'npc', text: 'Ashkara? No chart, no crossing. And I’ll tell you for free: you’d want a very good shield before you meet what lives there.',
        options: [{ label: 'Noted.', action: 'end' }],
      },
    },
  },
  gullwick_barkeep: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Ale, rumor, or both? The ale’s honest. The rumors, less so.',
        options: [
          { label: 'Show me the bar.', action: 'openShop' },
          { label: 'Any rumors?', next: 'rumor' },
          { label: 'Later.', action: 'end' },
        ],
      },
      rumor: {
        speaker: 'npc', text: 'The retired hunter drinks in Corvath’s Rusty Flagon. Ask him about Ravenmoor — but bring beers. Two, at least. He tells for barter, not for free.',
        options: [
          { label: 'Show me the bar.', action: 'openShop' },
          { label: 'Thanks.', action: 'end' },
        ],
      },
    },
  },
  pirate: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', gte: 1, lacks: ['sea_chart_b', 'sea_chart'] }, node: 'deal' },
      { node: 'flavor' },
    ],
    nodes: {
      deal: {
        speaker: 'npc', text: 'A corner of a sea chart? Aye, I’ve got one, tucked where the guards don’t look. Slide me a beer through the bars and it’s yours, matey.',
        options: [
          { label: 'Here’s a beer.', if: { hasCount: { beer: 1 } }, actions: ['take:beer:1', 'give:sea_chart_b:1'], next: 'cheers' },
          { label: 'I’ll fetch a beer.', action: 'end' },
        ],
      },
      cheers: {
        speaker: 'npc', text: 'Pleasure doing crime with you. Mind the third corner’s with some Corvath dandy who won’t part with it cheap.',
        options: [{ label: 'Cheers.', action: 'end' }],
      },
      flavor: {
        speaker: 'npc', text: 'Arr, and other vowels. A cell’s not so bad. Three meals, no weather, and the finest sea stories this side of drowning.',
        options: [{ label: 'Stay dry.', action: 'end' }],
      },
    },
  },
  chieftain: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', gte: 1, lt: 100 }, node: 'warn' },
      { node: 'flavor' },
    ],
    nodes: {
      warn: {
        speaker: 'npc', text: 'You hunt Cindermaw. Brave. Foolish. Same thing here. Wear the anti-flame kiteshield, outlander — its breath is forty deaths without one, and eight with.',
        options: [{ label: 'I’ll wear the shield.', action: 'end' }],
      },
      flavor: {
        speaker: 'npc', text: 'The isle is peaceful. The mountain sleeps. We would very much like both to continue.',
        options: [{ label: 'Banana?', next: 'banana' }, { label: 'Peace to you.', action: 'end' }],
      },
      banana: {
        speaker: 'npc', text: 'The grove-seller is right there. We are, as a people, very serious about bananas.',
        options: [{ label: 'A noble focus.', action: 'end' }],
      },
    },
  },
  hermit: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', gte: 1, lacks: ['sea_chart_a', 'sea_chart'] }, node: 'give' },
      { node: 'flavor' },
    ],
    nodes: {
      give: {
        speaker: 'npc', text: 'Company! Ugh. Fine. You want my chart-corner? Take it, take it — anything to make the talking stop. It maps the Ashkara approach. Now go.',
        options: [{ label: 'Thank you, hermit.', actions: ['give:sea_chart_a:1'], next: 'bye' }],
      },
      bye: {
        speaker: 'npc', text: 'The pirate has the second corner. The Corvath collector, the third. Now GO. Fondly.',
        options: [{ label: 'Going.', action: 'end' }],
      },
      flavor: {
        speaker: 'npc', text: 'I chose solitude. I regret it, briefly, near mealtimes and whenever anyone speaks to me.',
        options: [{ label: 'I’ll leave you be.', action: 'end' }],
      },
    },
  },
  collector: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', gte: 1, lacks: ['sea_chart_c', 'sea_chart'] }, node: 'deal' },
      { node: 'flavor' },
    ],
    nodes: {
      deal: {
        speaker: 'npc', text: 'The third corner of the Ashkara chart? Oh, I have it. Under glass. Beautiful thing. Five hundred gold and it’s yours — or you could try burgling me, and we’ll see how that ends.',
        options: [
          { label: 'Pay 500 gold.', if: { hasCount: { coins: 500 } }, actions: ['take:coins:500', 'give:sea_chart_c:1'], next: 'sold' },
          { label: 'Robbery. Another time.', action: 'end' },
        ],
      },
      sold: {
        speaker: 'npc', text: 'Pleasure. Do bring me something rare when you return. Assuming you return.',
        options: [{ label: 'Assuming.', action: 'end' }],
      },
      flavor: {
        speaker: 'npc', text: 'I collect beautiful things and, regrettably, few friends. The two may be related.',
        options: [{ label: 'Regrettable indeed.', action: 'end' }],
      },
    },
  },
  hunter: {
    start: [
      { if: { quest: 'lord_of_murkwell', is: 1 }, node: 'q1' },
      { if: { quest: 'lord_of_murkwell', gte: 2, lt: 100 }, node: 'q2' },
      { node: 'idle' },
    ],
    nodes: {
      q1: {
        speaker: 'npc', text: 'Ravenmoor. There’s a name I drink to forget. You want the trick to end him? That’s two beers of remembering, friend.',
        options: [
          { label: 'Here are two beers.', if: { hasCount: { beer: 2 } }, actions: ['take:beer:2', 'give:garlic:1', 'give:stake:1', 'quest:lord_of_murkwell:2'], next: 'told' },
          { label: 'I’ll get the beers.', action: 'end' },
        ],
      },
      told: {
        speaker: 'npc', text: 'Garlic to weaken the old ghoul. A stake to end him — keep it IN HAND, or he simply won’t die. A hammer to drive it, which you carry already. The crypt’s beneath the manor. Aurel keep you.',
        options: [{ label: 'My thanks, hunter.', action: 'end' }],
      },
      q2: {
        speaker: 'npc', text: 'Stake in hand? Garlic in pack? Then go, and don’t come back until it’s done — or don’t come back at all.',
        options: [
          { label: 'I lost the stake. Spare another?', if: { lacks: ['stake'] }, actions: ['give:stake:1', 'give:garlic:1'], next: 'restake' },
          { label: 'It’ll be done.', action: 'end' },
        ],
      },
      restake: {
        speaker: 'npc', text: 'Careless. This is my LAST stake — carved it myself from a coffin lid, which felt appropriate. Keep it IN HAND. Do not lose it in the Blight or anywhere else.',
        options: [{ label: 'On my life. Or unlife.', action: 'end' }],
      },
      idle: {
        speaker: 'npc', text: 'Ravenmoor’s dust. I sleep now. First time in years. Buy yourself a beer on me. Actually, no. Buy your own.',
        options: [{ label: 'Rest easy.', action: 'end' }],
      },
    },
  },
  squire: {
    start: [
      { if: { quest: 'squires_blunder', is: 0 }, node: 's0' },
      { if: { quest: 'squires_blunder', is: 1 }, node: 'fetch' },
      { if: { quest: 'squires_blunder', gte: 2, lt: 4 }, node: 'waiting' },
      { if: { quest: 'squires_blunder', is: 4 }, node: 'ret' },
      { node: 'done' },
    ],
    nodes: {
      s0: {
        speaker: 'npc', text: 'I— I broke it. Sir Bellwether’s heirloom sword. I only LEANED on it! He returns at dusk and I’ll be a squire no longer, or worse. Please — can you help?',
        options: [
          { label: 'I’ll get it reforged.', actions: ['quest:squires_blunder:1'], next: 's0go' },
          { label: 'Should’ve leaned less.', action: 'end' },
        ],
      },
      s0go: {
        speaker: 'npc', text: 'Only cliff-smith Yorra knows the old technique — she forges up by the ice cave, north of here. But she’s prickly. Take her the family portrait from the Hall wall; she was sweet on Sir Bellwether’s mother, they say.',
        options: [{ label: 'The portrait, then Yorra.', action: 'end' }],
      },
      fetch: {
        speaker: 'npc', text: 'The portrait’s on the Hall wall. Take it to Yorra on the cliffs.',
        options: [{ label: 'On it.', action: 'end' }],
      },
      waiting: {
        speaker: 'npc', text: 'Yorra is a hard woman and coldiron is a hard metal. Keep at it — dusk is coming.',
        options: [{ label: 'I’m trying.', action: 'end' }],
      },
      ret: {
        speaker: 'npc', text: 'Is that— IT IS! The heirloom, whole again! You’ve saved my station and my skin.',
        options: [
          { label: 'Here’s the heirloom, Aldous.', if: { hasAll: ['heirloom_sword'] }, actions: ['take:heirloom_sword:1', 'complete:squires_blunder', 'end'] },
          { label: 'I… mislaid it. Yorra can forge another.', if: { lacks: ['heirloom_sword'] }, action: 'end' },
        ],
      },
      done: {
        speaker: 'npc', text: 'Sir Bellwether never knew. I owe you everything. And I will never lean on a sword again.',
        options: [{ label: 'See that you don’t.', action: 'end' }],
      },
    },
  },
  cliff_smith: {
    start: [
      { if: { quest: 'squires_blunder', lt: 2 }, node: 'notyet' },
      { if: { quest: 'squires_blunder', is: 2 }, node: 'portrait' },
      { if: { quest: 'squires_blunder', is: 3 }, node: 'bar' },
      { if: { quest: 'squires_blunder', is: 4, lacks: ['heirloom_sword'] }, node: 'reforge' },
      { node: 'done' },
    ],
    nodes: {
      reforge: {
        speaker: 'npc', text: 'Lost it already? By the frost. …Fine. I hold the technique in these hands now — I can forge it again from memory, no coldiron needed. One more, for her memory. Do not lose this one.',
        options: [{ label: 'Thank you, Yorra.', actions: ['give:heirloom_sword:1'], next: 'done2' }],
      },
      notyet: {
        speaker: 'npc', text: 'I forge alone, up here, for good reason. Bring me a reason of your own — a certain portrait, perhaps — and we’ll talk.',
        options: [{ label: 'I’ll be back.', action: 'end' }],
      },
      portrait: {
        speaker: 'npc', text: 'That portrait— …the mother. Yes. All right. For her memory I’ll forge the heirloom. But it must be COLDIRON — mined in the ice cave below (Mining forty-five), smelted to a bar. Bring me one.',
        options: [
          { label: 'Here is the portrait.', if: { hasAll: ['family_portrait'] }, actions: ['take:family_portrait:1', 'quest:squires_blunder:3'], next: 'go' },
        ],
      },
      go: {
        speaker: 'npc', text: 'The cave’s just there. Ice fiends guard the coldiron. Smelt the ore at any furnace — coal helps — and bring the bar to me.',
        options: [{ label: 'A coldiron bar. Understood.', action: 'end' }],
      },
      bar: {
        speaker: 'npc', text: 'Coldiron. Good and cold. Stand back — this technique is loud.',
        options: [
          { label: 'Forge it, Yorra.', if: { hasAll: ['coldiron_bar'] }, actions: ['take:coldiron_bar:1', 'give:heirloom_sword:1', 'quest:squires_blunder:4'], next: 'done2' },
          { label: 'Still mining.', action: 'end' },
        ],
      },
      done2: {
        speaker: 'npc', text: 'There. Better than new, and it’ll hold an edge through winter. Take it to the squire. And tell no one where I am.',
        options: [{ label: 'Your secret’s safe.', action: 'end' }],
      },
      done: {
        speaker: 'npc', text: 'The frost keeps me company enough. Off with you.',
        options: [{ label: 'Farewell, Yorra.', action: 'end' }],
      },
    },
  },
  champions_master: {
    start: [
      { if: { quest: 'wyrm_of_ashkara', is: 0 }, node: 'assign' },
      { if: { quest: 'wyrm_of_ashkara', is: 1 }, node: 'chart' },
      { if: { quest: 'wyrm_of_ashkara', gte: 2, lt: 100 }, node: 'hunt' },
      { node: 'hero' },
    ],
    nodes: {
      assign: {
        speaker: 'npc', text: 'Twelve quest points. You’ve earned the door — now earn the legend. Far south lies Ashkara, and in its caldera sleeps Cindermaw, the wyrm. It must fall. First: a sea chart, torn into three, held by a hermit near Sunmarch, a pirate in Gullwick’s jail, and a collector here in Corvath.',
        options: [
          { label: 'I’ll assemble the chart.', actions: ['quest:wyrm_of_ashkara:1'], next: 'go' },
          { label: 'Not today.', action: 'end' },
        ],
      },
      go: {
        speaker: 'npc', text: 'Bring me all three corners and I’ll piece them together. Then buy an anti-flame kiteshield from the Whitehold armorer — without it, the wyrm’s breath is certain death.',
        options: [{ label: 'Three corners. Understood.', action: 'end' }],
      },
      chart: {
        speaker: 'npc', text: 'Have you the three corners of the chart?',
        options: [
          { label: 'All three — assemble them.', if: { hasAll: ['sea_chart_a', 'sea_chart_b', 'sea_chart_c'] }, actions: ['take:sea_chart_a:1', 'take:sea_chart_b:1', 'take:sea_chart_c:1', 'give:sea_chart:1', 'quest:wyrm_of_ashkara:2'], next: 'assembled' },
          { label: 'Still gathering.', next: 'remind' },
        ],
      },
      remind: {
        speaker: 'npc', text: 'The hermit near Sunmarch, the pirate in Gullwick’s cell, the collector here. A corner each.',
        options: [{ label: 'Right.', action: 'end' }],
      },
      assembled: {
        speaker: 'npc', text: 'There — one chart, whole, pointing at doom. Buy the anti-flame kiteshield in Whitehold, then take the ferryman’s boat from Gullwick’s docks. Wear the shield, champion. Cindermaw shows no mercy and neither should you.',
        options: [{ label: 'To Ashkara, then.', action: 'end' }],
      },
      hunt: {
        speaker: 'npc', text: 'The chart is yours, the wyrm awaits. Anti-flame kiteshield from Whitehold; the boat from Gullwick. Go and be a legend, or at least a cautionary tale.',
        options: [{ label: 'I’ll be the former.', action: 'end' }],
      },
      hero: {
        speaker: 'npc', text: 'Cindermaw is fallen and you wear the Starmetal. The Guild — and the realm — salute you. Even the ferryman respects you now, and that man respects NOTHING.',
        options: [{ label: 'It was an honor.', action: 'end' }],
      },
    },
  },
  mad_wizard: {
    start: [
      { if: { quest: 'poultrified_professor', is: 0 }, node: 'q6' },
      { if: { quest: 'poultrified_professor', lt: 100 }, node: 'q6prog' },
      { if: { quest: 'lord_of_murkwell', is: 0 }, node: 'q7' },
      { if: { quest: 'lord_of_murkwell', lt: 100 }, node: 'q7prog' },
      { node: 'idle' },
    ],
    nodes: {
      q6: {
        speaker: 'npc', text: 'A visitor! Splendid. Mind the professor — he pecks the notes. Oh, that IS the professor. I turned Pimm into a chicken. Accidentally! Mostly. He’s locked in the study behind my little puzzle. Free him?',
        options: [
          { label: 'I’ll solve your puzzle.', actions: ['give:oil_can:1', 'give:poison:1', 'give:fish_food:1', 'quest:poultrified_professor:1'], next: 'q6go' },
          { label: 'Turn him back yourself.', action: 'end' },
        ],
      },
      q6go: {
        speaker: 'npc', text: 'Take these: an oil can, a vial of poison, and fish food. The ODD levers open the study — one, three, five. Lever three is rusted, so OIL it. Lever five sits past my piranha fountain — POISON the fish food and feed them, and they’ll trouble you no more.',
        options: [{ label: 'Odd levers. Oil three. Poison five.', action: 'end' }],
      },
      q6prog: {
        speaker: 'npc', text: 'The odd levers, remember — one, three, five. Oil the stuck one. Poison the piranhas. Pimm is counting on you. Quietly. In chicken.',
        options: [
          { label: 'I lost your supplies — more, please?', if: { lacks: ['oil_can'] }, actions: ['give:oil_can:1', 'give:poison:1', 'give:fish_food:1'], next: 'resupply' },
          { label: 'I lost the poison and food.', if: { lacks: ['poison'] }, actions: ['give:poison:1', 'give:fish_food:1'], next: 'resupply' },
          { label: 'I lost the fish food.', if: { lacks: ['fish_food'] }, actions: ['give:fish_food:1'], next: 'resupply' },
          { label: 'Working on it.', action: 'end' },
        ],
      },
      resupply: {
        speaker: 'npc', text: 'Honestly. A wizard’s supplies are not infinite — but here. Try to keep hold of them this time. The odd levers. Oil three. Poison five.',
        options: [{ label: 'Got it.', action: 'end' }],
      },
      q7: {
        speaker: 'npc', text: 'Now that Pimm is de-chickened — a darker matter. Lord Ravenmoor stirs in the crypt below my manor. The village trembles. Someone ought to put the old ghoul down for good.',
        options: [
          { label: 'I’ll end Ravenmoor.', actions: ['quest:lord_of_murkwell:1'], next: 'q7go' },
          { label: 'Not my department.', action: 'end' },
        ],
      },
      q7go: {
        speaker: 'npc', text: 'The retired hunter in Corvath’s Rusty Flagon knows the trick — two beers loosens his tongue. He’ll give you garlic and a stake. The crypt stair is here in the manor.',
        options: [{ label: 'Corvath, then the crypt.', action: 'end' }],
      },
      q7prog: {
        speaker: 'npc', text: 'The crypt is below. Keep the stake in hand or Ravenmoor simply laughs at you. Undeath is very smug.',
        options: [{ label: 'Understood.', action: 'end' }],
      },
      idle: {
        speaker: 'npc', text: 'Science! And chickens. And the occasional undead nobleman. A full life, really.',
        options: [{ label: 'Quite.', action: 'end' }],
      },
    },
  },
  professor: {
    start: [
      { if: { quest: 'poultrified_professor', lt: 100 }, node: 'free' },
      { node: 'freed' },
    ],
    nodes: {
      free: {
        speaker: 'npc', text: 'BAWK— ahem — thank the heavens! Professor Pimm, at your service, currently poultry. The wizard can restore me now that I’m free of that dreadful study. Here — three hundred gold, and my eternal, clucking gratitude.',
        options: [{ label: 'Glad to help, Professor.', actions: ['complete:poultrified_professor', 'end'] }],
      },
      freed: {
        speaker: 'npc', text: 'Human again, mostly. I still crave seeds, but the lectures resume Monday. You have my thanks.',
        options: [{ label: 'Any time.', action: 'end' }],
      },
    },
  },
  warden_stone: {
    start: [
      { if: { quest: 'shadow_over_corvath', gte: 1, lacks: ['key_stone'] }, node: 'riddle' },
      { node: 'idle' },
    ],
    nodes: {
      riddle: {
        speaker: 'npc', text: 'I am the Warden of Stone. Answer, and the key is yours: "The more you take, the more you leave behind. What am I?"',
        options: [
          { label: 'Footsteps.', actions: ['give:key_stone:1'], next: 'right' },
          { label: 'Gold.', next: 'wrong' },
          { label: 'Shadows.', next: 'wrong' },
        ],
      },
      right: {
        speaker: 'npc', text: 'Just so. The stone key is yours. Two wardens remain.',
        options: [{ label: 'My thanks.', action: 'end' }],
      },
      wrong: {
        speaker: 'npc', text: 'No. The stone does not yield to the wrong word. Think again.',
        options: [{ label: 'Ask me once more.', next: 'riddle' }, { label: 'Later.', action: 'end' }],
      },
      idle: {
        speaker: 'npc', text: 'You hold my key. Seek the others.',
        options: [{ label: 'I will.', action: 'end' }],
      },
    },
  },
  warden_flame: {
    start: [
      { if: { quest: 'shadow_over_corvath', gte: 1, lacks: ['key_flame'] }, node: 'riddle' },
      { node: 'idle' },
    ],
    nodes: {
      riddle: {
        speaker: 'npc', text: 'Warden of Flame, I. Answer true: "I am not alive, yet I grow; I have no lungs, yet I need air; I have no mouth, yet water slays me. What am I?"',
        options: [
          { label: 'Fire.', actions: ['give:key_flame:1'], next: 'right' },
          { label: 'A ghost.', next: 'wrong' },
          { label: 'The sea.', next: 'wrong' },
        ],
      },
      right: {
        speaker: 'npc', text: 'Correct, and warm of you. Take the flame key.',
        options: [{ label: 'My thanks.', action: 'end' }],
      },
      wrong: {
        speaker: 'npc', text: 'The flame gutters at your error. Try once more.',
        options: [{ label: 'Ask me again.', next: 'riddle' }, { label: 'Later.', action: 'end' }],
      },
      idle: {
        speaker: 'npc', text: 'My key is yours. The deep warden waits.',
        options: [{ label: 'I go.', action: 'end' }],
      },
    },
  },
  warden_deep: {
    start: [
      { if: { quest: 'shadow_over_corvath', gte: 1, lacks: ['key_deep'] }, node: 'riddle' },
      { node: 'idle' },
    ],
    nodes: {
      riddle: {
        speaker: 'npc', text: 'Warden of the Deep. Last riddle, deepest: "Roots that nobody sees, taller than trees; up, up it goes, and yet it never grows. What am I?"',
        options: [
          { label: 'A mountain.', actions: ['give:key_deep:1'], next: 'right' },
          { label: 'A river.', next: 'wrong' },
          { label: 'The moon.', next: 'wrong' },
        ],
      },
      right: {
        speaker: 'npc', text: 'Deep and true. The last key is yours. Open the reliquary; take up Dawnbrand.',
        options: [{ label: 'At last.', action: 'end' }],
      },
      wrong: {
        speaker: 'npc', text: 'The deep is patient, and wrong. Consider again.',
        options: [{ label: 'Ask me again.', next: 'riddle' }, { label: 'Later.', action: 'end' }],
      },
      idle: {
        speaker: 'npc', text: 'All three keys you hold. The reliquary awaits.',
        options: [{ label: 'To the reliquary.', action: 'end' }],
      },
    },
  },

  // ---- Wave 3: bounty quests. Turn-in keys on {killed}+item at any active
  // stage, so grabbing the ledger before accepting can't soft-lock the quest.
  crossroads_sergeant: {
    start: [
      { if: { quest: 'crossroads_menace', is: 0 }, node: 's0' },
      { if: { quest: 'crossroads_menace', gte: 1, lt: 100 }, node: 'working' },
      { node: 'done' },
    ],
    nodes: {
      s0: {
        speaker: 'npc', text: 'You there — handy with that blade? Highwaymen have made the crossroads their own. Robbed the toll cart, cracked heads doing it. Cull eight of them, and fetch back the toll ledger from whatever hole they call a stash.',
        options: [
          { label: 'Consider it done.', actions: ['quest:crossroads_menace:1', 'mark:highwayman'], next: 's0go' },
          { label: 'Not my problem.', action: 'end' },
        ],
      },
      s0go: {
        speaker: 'npc', text: 'Good. They lurk along the road and off it, west of here. The ledger will be near their nastiest camp. Eight of them, mind — the road stays theirs until then.',
        options: [{ label: 'I’ll thin the herd.', action: 'end' }],
      },
      working: {
        speaker: 'npc', text: 'Progress: {kills:highwayman} of eight highwaymen down. Bring me the eight and the stolen ledger, and we’re square.',
        options: [
          { label: 'Cleared — and here’s the ledger.', if: { killed: { highwayman: 8 }, hasAll: ['stolen_ledger'] }, actions: ['take:stolen_ledger:1', 'complete:crossroads_menace', 'end'] },
          { label: 'Still working on it.', action: 'end' },
        ],
      },
      done: {
        speaker: 'npc', text: 'The crossroads is quiet again, thanks to you. Travelers keep their teeth AND their coin now. Rare luxury.',
        options: [{ label: 'Safe roads, Sergeant.', action: 'end' }],
      },
    },
  },
  blight_warden: {
    start: [
      { if: { quest: 'blight_cull', is: 0 }, node: 's0' },
      { if: { quest: 'blight_cull', gte: 1, lt: 100 }, node: 'turnin' },
      { if: { quest: 'the_blights_heart', gte: 100 }, node: 'bh_done' },
      { if: { quest: 'the_blights_heart', gte: 1 }, node: 'bh_mid' },
      { if: { quest: 'the_last_circle', gte: 100 }, node: 'bh_offer' },
      { node: 'done' },
    ],
    nodes: {
      s0: {
        speaker: 'npc', text: 'You smell of road, not ash — good, you’re still alive. The Blight east of here leaks horrors toward Brinkton. Cull them: five echoes, three ashfiends. And bring me four shards of ash-glass, the black stuff their fire leaves. I study it. Don’t ask why.',
        options: [
          { label: 'The Blight will bleed. I accept.', actions: ['quest:blight_cull:1', 'mark:echo', 'mark:ashfiend'], next: 's0go' },
          { label: 'I’m not ready for the Blight.', action: 'end' },
        ],
      },
      s0go: {
        speaker: 'npc', text: 'Echoes haunt the verge; ashfiends prowl deeper. Wear something that laughs at fire. Four shards, five echoes, three ashfiends — and mind the ash keeps what falls in it.',
        options: [{ label: 'I’ll return.', action: 'end' }],
      },
      turnin: {
        speaker: 'npc', text: 'Back, and breathing. So far: {kills:echo} echoes and {kills:ashfiend} ashfiends felled. Show me five, three, and four shards of ash-glass, and Brinkton owes you a debt.',
        options: [
          { label: 'It’s done — glass and all.', if: { killed: { echo: 5, ashfiend: 3 }, hasCount: { ash_glass: 4 } }, actions: ['take:ash_glass:4', 'complete:blight_cull', 'end'] },
          { label: 'Not finished yet.', action: 'end' },
        ],
      },
      done: {
        speaker: 'npc', text: 'The verge is quieter than it’s been in a year. Brinkton sleeps a little easier — and so, gods help me, do I. Though if you’re restless… the gate could always use holding.',
        options: [
          { label: 'The gate needs holding? I’m ready.', next: 'siege_brief' },
          { label: 'Watch the ash, Warden.', action: 'end' },
        ],
      },
      siege_brief: {
        speaker: 'npc', text: 'Then hear it plain: I sound the horn, the Blight answers, and you hold the road east of town — wave after wave, worse each time. Coin per wave held, and something finer if you outlast the horn. Walk away from the fight and it ends.',
        options: [
          { label: 'Sound the horn.', actions: ['siege:start', 'end'] },
          { label: 'Another day.', action: 'end' },
        ],
      },
      bh_offer: {
        speaker: 'npc', text: 'Since Malgrim fell, I hear it on still nights. A beat, deep in the ash. Slow. Patient. The Blight isn’t a wound, wanderer — it’s a body, and somewhere out there it keeps a heart. I marked a circle of cinders on no map I’ll ever file. Go and stop it beating.',
        options: [
          { label: 'Point me at the circle. I’ll do the rest.', actions: ['quest:the_blights_heart:1', 'unhide:blightheart'], next: 'bh_go' },
          { label: 'The gate needs holding? I’m ready.', next: 'siege_brief' },
          { label: 'Some hearts should keep beating. Not this one. But not today.', action: 'end' },
        ],
      },
      bh_go: {
        speaker: 'npc', text: 'Deep east, past everything that wants you dead. It slams the ground — MOVE when the ash rings. It tears its echoes loose when it bleeds. And if you take too long, the very air ignites. Eat first. Come back after.',
        options: [{ label: 'One heartbeat. Then none.', action: 'end' }],
      },
      bh_mid: {
        speaker: 'npc', text: 'Still beating. I can hear it — or I’ve stopped sleeping, one of the two. The circle of cinders, deep east. Move when the ash rings, mind the echoes, and don’t linger.',
        options: [
          { label: 'On my way.', action: 'end' },
          { label: 'The gate needs holding? I’m ready.', next: 'siege_brief' },
        ],
      },
      bh_done: {
        speaker: 'npc', text: 'The nights are quiet now. Properly quiet — I’d forgotten what that was. Whatever grows back out there will grow back around the hole you left in it. Brinkton owes you twice.',
        options: [
          { label: 'It still drops treasure, Warden.', next: 'bh_go' },
          { label: 'The gate needs holding? I’m ready.', next: 'siege_brief' },
          { label: 'Sleep well, Ashe.', action: 'end' },
        ],
      },
    },
  },

  // ---- Wave 5: Skalvik & Brinkton finally speak ----
  skalvik_jarl: {
    start: ['greet'],
    nodes: {
      greet: {
        speaker: 'npc', text: 'Stranger in the longhouse! Sit, drink, and mind the arm-wrestling. I am Jarl Halvard, and this frozen heap of benches is mine by right of shouting loudest.',
        options: [
          { label: 'Tell me of Skalvik.', next: 'lore' },
          { label: 'Why the longhouses?', next: 'houses' },
          { label: 'I’ll leave you to it.', action: 'end' },
        ],
      },
      lore: {
        speaker: 'npc', text: 'We came south off the ice when the fishing failed. Kept our axes, our songs, and our stubbornness. Whitehold calls us barbarians. We call it Tuesday.',
        options: [{ label: 'And the barbarians in the hills?', next: 'barb' }, { label: 'Fair enough.', action: 'end' }],
      },
      barb: {
        speaker: 'npc', text: 'Cousins who took the axe part more seriously than the song part. Do not begrudge them a swing — they mean it as a greeting. Mostly.',
        options: [{ label: 'I’ll greet them back.', action: 'end' }],
      },
      houses: {
        speaker: 'npc', text: 'A longhouse holds heat, and heat holds us. The beds are benches, the benches are beds, and the snoring is a folk instrument. You’ll sleep. Eventually.',
        options: [{ label: 'Cozy.', action: 'end' }],
      },
    },
  },
  skalvik_skald: {
    start: ['s1', 's2', 's3'],
    nodes: {
      s1: {
        speaker: 'npc', text: 'A saga for you? "The adventurer came, they poked a cow, the cow said naught — the end." I am still workshopping the middle.',
        options: [{ label: 'Keep at it.', action: 'end' }],
      },
      s2: {
        speaker: 'npc', text: 'Every hero south of the ice smells of goblin and regret. You fit the verse nicely.',
        options: [{ label: 'Charmed.', action: 'end' }],
      },
      s3: {
        speaker: 'npc', text: 'I rhymed "Halvard" with "hard word" once. He threw a bench. Art demands sacrifice — usually mine.',
        options: [{ label: 'Suffer for the craft.', action: 'end' }],
      },
    },
  },
  blight_survivor: {
    start: [
      { if: { quest: 'rebuild_brinkton', gte: 100 }, node: 'rb_done' },
      { if: { quest: 'rebuild_brinkton', gte: 1 }, node: 'rb_mid' },
      'greet',
    ],
    nodes: {
      greet: {
        speaker: 'npc', text: 'You’re looking north. Don’t. I looked north. I came back, mostly — the Blight kept the rest. Ash for soil, ash for sky, and things in it that used to be people.',
        options: [
          { label: 'What lives out there?', next: 'mobs' },
          { label: 'Why does anyone stay in Brinkton?', next: 'stay' },
          { label: 'Could Brinkton be rebuilt?', next: 'rb_pitch' },
          { label: 'I’ll be careful.', action: 'end' },
        ],
      },
      rb_pitch: {
        speaker: 'npc', text: 'Rebuilt? I… kept the plans. Every house, every beam, drawn from memory the winter after. But plans need timber, coin, and hands that don’t shake. Mine shake.',
        options: [
          { label: 'Mine don’t. Let’s raise it.', actions: ['quest:rebuild_brinkton:1'], next: 'rb_accept' },
          { label: 'Some things stay buried.', action: 'end' },
        ],
      },
      rb_accept: {
        speaker: 'npc', text: 'Then take them to the rebuilding board, there by the well that was. Start small — start with water. Everything alive needs water first.',
        options: [{ label: 'Brick by brick.', action: 'end' }],
      },
      rb_mid: {
        speaker: 'npc', text: 'I hear hammering some mornings and forget to be sad. The board keeps the tally — timber, bars, coin. Brinkton keeps the score.',
        options: [{ label: 'Back to work.', action: 'end' }],
      },
      rb_done: {
        speaker: 'npc', text: 'I stood at the beacon last night and watched the windows glow — every one a family that came home because of you. I looked north and, for the first time, the north blinked first.',
        options: [{ label: 'Brinkton endures.', action: 'end' }],
      },
      mobs: {
        speaker: 'npc', text: 'Bogwyrms in the shallows of it. Echoes — deaths that keep happening. Deeper, the ashfiends, and they burn. If you go, go armoured against fire and light of foot. And do not die there — the Blight keeps everything you drop.',
        options: [{ label: 'Noted, grimly.', action: 'end' }],
      },
      stay: {
        speaker: 'npc', text: 'Somebody has to watch the door so it doesn’t open wider. Warden Ashe watches. I drink. Between us, Brinkton sleeps. Barely.',
        options: [{ label: 'Keep watching.', action: 'end' }],
      },
    },
  },

  brinkton_reeve: {
    start: ['greet'],
    nodes: {
      greet: {
        speaker: 'npc', text: 'Reeve of Brinkton — words I never thought to say again. The hall you raised holds our records, our beacon, and on feast days, entirely too much singing.',
        options: [
          { label: 'How fares the town?', next: 'fares' },
          { label: 'Sing away, reeve.', action: 'end' },
        ],
      },
      fares: {
        speaker: 'npc', text: 'Water from the well, bread in the cottages, the Ashguard snoring in shifts. The Blight still glowers at our fence — but now Brinkton glowers back.',
        options: [{ label: 'Long may it glower.', action: 'end' }],
      },
    },
  },

  // ---- The villain arc: Inquisitor Serra (three-quest chain; the start list
  // checks quests in reverse progression order so each state is unambiguous) ----
  inquisitor_serra: {
    start: [
      { if: { quest: 'the_last_circle', is: 3 }, node: 'lc_done' },
      { if: { quest: 'the_last_circle', gte: 100 }, node: 'epilogue' },
      { if: { quest: 'the_last_circle', gte: 1 }, node: 'lc_mid' },
      { if: { quest: 'the_black_stair', is: 100 }, node: 'lc_offer' },
      { if: { quest: 'the_black_stair', gte: 2 }, node: 'bs_return' },
      { if: { quest: 'the_black_stair', is: 1 }, node: 'bs_mid' },
      { if: { quest: 'embers_of_malgrim', is: 100 }, node: 'bs_offer' },
      { if: { quest: 'embers_of_malgrim', is: 1 }, node: 'embers_mid' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'npc', text: 'You’ve the look of someone the dark hasn’t managed to eat yet. Good. I am Serra, Aurel’s Inquisitor — and I believe the severed circle still burns. Cult shrines, lit again: the gale altar, the manor grounds, our own churchyard.',
        options: [
          { label: 'What needs doing?', next: 'intro2' },
          { label: 'Not my fight.', action: 'end' },
        ],
      },
      intro2: {
        speaker: 'npc', text: 'Cull six of their Vex cultists and bring me three of their sigils from the shrines. Burn the roots before the tree.',
        options: [
          { label: 'The circle burns out today. I accept.', actions: ['quest:embers_of_malgrim:1', 'mark:vex_cultist', 'unhide:vex_cultist'], next: 'accepted' },
          { label: 'Let me prepare first.', action: 'end' },
        ],
      },
      accepted: {
        speaker: 'npc', text: 'Aurel keep your edge. Six cultists, three sigils. I’ll be here, praying I’m wrong. I am not wrong.',
        options: [{ label: 'To work.', action: 'end' }],
      },
      embers_mid: {
        speaker: 'npc', text: 'The count so far: {kills:vex_cultist} of six cultists. Sigils in hand, or still in the dirt?',
        options: [
          { label: 'Done — six down, three sigils.', if: { killed: { vex_cultist: 6 }, hasCount: { cult_sigil: 3 } }, actions: ['take:cult_sigil:3', 'complete:embers_of_malgrim', 'end'] },
          { label: 'Still hunting.', action: 'end' },
        ],
      },
      bs_offer: {
        speaker: 'npc', text: 'The sigils named a place, not a person: a shaft in the hills south of the east road. The old records call what lies under it the Undervault — and what lies under THAT, they refuse to name. Bring me the Warden’s Seal from the cavern. And the shadows there — gloom stalkers — thin them by four.',
        options: [
          { label: 'Into the Undervault, then.', actions: ['quest:the_black_stair:1', 'mark:gloom_stalker'], next: 'bs_go' },
          { label: 'Below can wait.', action: 'end' },
        ],
      },
      bs_go: {
        speaker: 'npc', text: 'Take light, take food, and mind the crystal — it hums when something moves behind you.',
        options: [{ label: 'Understood.', action: 'end' }],
      },
      bs_mid: {
        speaker: 'npc', text: 'The shaft is south of the east road, in the empty hills. The Seal will be deep in the cavern — where the stalkers are thickest ({kills:gloom_stalker}/4 so far).',
        options: [{ label: 'On it.', action: 'end' }],
      },
      bs_return: {
        speaker: 'npc', text: 'The Seal — you actually… Aurel’s teeth. And the stalkers: {kills:gloom_stalker} of four thinned.',
        options: [
          { label: 'Here it is. Four stalkers, down.', if: { hasAll: ['wardens_seal'], killed: { gloom_stalker: 4 } }, actions: ['take:wardens_seal:1', 'complete:the_black_stair', 'end'] },
          { label: 'Not finished below yet.', action: 'end' },
        ],
      },
      lc_offer: {
        speaker: 'npc', text: 'The Seal’s wards are broken; the Black Stair in the Undervault stands open. Beneath it, Malgrim — the hand that severed the circle, the voice your Dawnbrand silenced once already, wearing a new servant. Go down. Disturb his circle. End him. I would come, but someone must hold the prayer if you fail.',
        options: [
          { label: 'I’ll finish what the circle started.', actions: ['quest:the_last_circle:1'], next: 'lc_go' },
          { label: 'I need to prepare for this one.', action: 'end' },
        ],
      },
      lc_go: {
        speaker: 'npc', text: 'Come armed. Come fed. Come back.',
        options: [{ label: 'All three. Promise.', action: 'end' }],
      },
      lc_mid: {
        speaker: 'npc', text: 'The Stair waits in the Undervault’s far corner. Scuff his circle and he will come to you — pride was always the cult’s true god.',
        options: [{ label: 'Going.', action: 'end' }],
      },
      lc_done: {
        speaker: 'npc', text: 'I felt it from here — like a held breath finally let out. Malgrim is ended. The circle is closed, truly closed, and the realm owes you a debt it will immediately forget. I won’t. Take his mantle — tamed, I promise — and this.',
        options: [{ label: 'It was worth the climb down.', actions: ['complete:the_last_circle', 'end'] }],
      },
      epilogue: {
        speaker: 'npc', text: 'Quiet, isn’t it? The shrines are cold, the Stair is just stairs. I find I don’t trust it — but that is MY burden. Yours is worn magnificently, by the way.',
        options: [{ label: 'Stay watchful, Inquisitor.', action: 'end' }],
      },
    },
  },

  // ---- Slayer master: assign tasks, track progress, spend points ----
  slayer_master: {
    start: [
      { if: { slayer: 'done' }, node: 'done' },
      { if: { slayer: 'active' }, node: 'active' },
      { node: 'idle' },
    ],
    nodes: {
      idle: {
        speaker: 'npc', text: 'No task, no glory. Want something to kill? You hold {slayer:points} Slayer points.',
        options: [
          { label: 'Give me a task.', actions: ['slayer:assign'], next: 'assigned' },
          { label: 'Show me the rewards.', next: 'shop' },
          { label: 'Not now.', action: 'end' },
        ],
      },
      assigned: {
        speaker: 'npc', text: 'Your task: slay {slayer:task}. Off you go — I’ll be counting.',
        options: [{ label: 'On it.', action: 'end' }],
      },
      active: {
        speaker: 'npc', text: 'Still on the job: {slayer:task}, and you’re at {slayer:progress}. Finish it before you come whining.',
        options: [
          { label: 'Show me the rewards.', next: 'shop' },
          { label: 'I’ll keep at it.', action: 'end' },
        ],
      },
      done: {
        speaker: 'npc', text: 'Done already — {slayer:task}, all of them. Respect. Claim what you’ve earned.',
        options: [
          { label: 'Claim my reward.', actions: ['slayer:turnin'], next: 'claimed' },
        ],
      },
      claimed: {
        speaker: 'npc', text: 'Banked. You now hold {slayer:points} Slayer points. Another task, or the reward stall?',
        options: [
          { label: 'Assign another.', actions: ['slayer:assign'], next: 'assigned' },
          { label: 'Show me the rewards.', next: 'shop' },
          { label: 'Later.', action: 'end' },
        ],
      },
      shop: {
        speaker: 'npc', text: 'You hold {slayer:points} Slayer points. Spend them well — I don’t do refunds.',
        options: [
          { label: '2,000 coins — 3 pts', if: { pointsGte: 3 }, actions: ['slayer:buy:coins'], next: 'shop' },
          { label: '5 prayer potions — 5 pts', if: { pointsGte: 5 }, actions: ['slayer:buy:potions'], next: 'shop' },
          { label: '3 runite ore — 6 pts', if: { pointsGte: 6 }, actions: ['slayer:buy:ore'], next: 'shop' },
          { label: 'A combat xp lamp — 9 pts', if: { pointsGte: 9 }, actions: ['slayer:buy:lamp'], next: 'shop' },
          { label: 'Done browsing.', action: 'end' },
        ],
      },
    },
  },
};

// ---- Wave 5: bespoke per-shop greetings. Each NPC's `talk` id (data/npcs.js)
// now matches its def id, replacing the shared Holmbridge-store reuse so no
// vendor claims to be a store in another town. ----
const VENDOR_GREETINGS = {
  corvath_swordsmith: 'The Honed Edge — finest steel in Corvath, and a few things sharper. Buying?',
  corvath_staffseller: 'The Third Eye Emporium — staves, glyph stones, and the odd honest prophecy. Browsing?',
  skalvik_helmsmith: 'Helm & Hearth! Every problem is head-shaped, and I have the hat for it.',
  brinkton_keeper: 'The Last Shelf. Stocked for the road north, though I pray you turn south.',
  murkwell_keeper: 'The Humble Market. Everything’s a little damp, prices included. Bargain.',
  scimitar_seller: 'Curved steel for a curving sun. A Sunmarch scimitar never asks twice.',
  gem_seller: 'Uncut fortunes under a blue awning. Cut them yourself and thank me later.',
  meat_vendor: 'Kebab! Fresh-ish kebab! The meat is a surprise — a nice one, mostly.',
  fishmonger: 'Nets, bait, rods — all a salt-tempered angler needs. What’ll it be?',
  banana_seller: 'The realm’s only vertically-integrated banana concern. Yellow gold, friend.',
  armorer: 'The Whitehold Armory. Plate for knights, and the odd dragon-slayer. Try some on.',
};
for (const [id, line] of Object.entries(VENDOR_GREETINGS)) {
  TREES[id] = {
    start: 'hi',
    nodes: {
      hi: {
        speaker: 'npc', text: line,
        options: [
          { label: 'Let’s trade.', action: 'openShop' },
          { label: 'Just looking.', action: 'end' },
        ],
      },
    },
  };
}
