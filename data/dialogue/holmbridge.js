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
    start: 'hello',
    nodes: {
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
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Oh! Don’t sneak up on a man holding a whisk. The duke’s birthday is coming and my mind is a sieve.',
        options: [
          { label: 'What’s the matter?', next: 'matter' },
          { label: 'Carry on, then.', action: 'end' },
        ],
      },
      matter: {
        speaker: 'npc', text: 'Nothing yet. NOTHING YET. But if I forget the cake, it will very suddenly be everything. Come back around the duke’s birthday and we’ll see how doomed I am.',
        options: [{ label: 'Good luck with the sieve.', action: 'end' }],
      },
    },
  },

  priest: {
    start: 'hello',
    nodes: {
      hello: {
        speaker: 'npc', text: 'Aurel’s light on you, traveler. Order, gold, and punctuality — the three graces.',
        options: [
          { label: 'Tell me of Aurel.', next: 'aurel' },
          { label: 'And the altar?', next: 'altar' },
          { label: 'Light on you too. Goodbye.', action: 'end' },
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
