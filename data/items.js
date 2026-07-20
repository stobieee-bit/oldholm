// OLDHOLM — item definitions. Adding an item means adding one object here.
// Fields:
//   name        display name
//   examine     the examine line (mandatory — every item has one)
//   value       base gold value (economy phases)
//   stackable   coins/arrows/etc. stack infinitely in one slot
//   icon        inline SVG fragment drawn in a 24x24 viewBox (inventory slot art)
//   model       ground-item mesh recipe, interpreted by world.js:
//               kind: 'cylinder'|'box'|'sphere'|'log'|'bones'|'blade'
// Later phases add: slot, bonuses {stab,slash,crush,magic,ranged x atk/def, str, prayer}, reqs.

import { HERBLORE } from './crafting.js'; // for generating herbs/unf potions

export const ITEMS = {
  bucket: {
    name: 'Bucket',
    examine: 'It holds things. Usually water.',
    value: 2, stackable: false,
    icon: '<path d="M5 7h14l-2 13H7Z" fill="#8d939c"/><path d="M6.5 7a5.5 4.6 0 0 1 11 0" fill="none" stroke="#6f757d" stroke-width="1.6"/>',
    model: { kind: 'cylinder', color: 0x8d939c, rTop: 0.17, rBot: 0.13, h: 0.24 },
  },
  jug: {
    name: 'Jug',
    examine: 'Empty. Much like my prospects.',
    value: 1, stackable: false,
    icon: '<path d="M10 4h4v3l2.5 3v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-9L10 7Z" fill="#b08d57"/>',
    model: { kind: 'cylinder', color: 0xb08d57, rTop: 0.09, rBot: 0.14, h: 0.26 },
  },
  bones: {
    name: 'Bones',
    examine: "Somebody's former somebody.",
    value: 1, stackable: false,
    icon: '<path d="M7 17 17 7" stroke="#e8e2d0" stroke-width="3" stroke-linecap="round"/><circle cx="6" cy="18" r="2.1" fill="#e8e2d0"/><circle cx="18" cy="6" r="2.1" fill="#e8e2d0"/><circle cx="8.5" cy="19.5" r="2.1" fill="#e8e2d0"/><circle cx="19.5" cy="8.5" r="2.1" fill="#e8e2d0"/>',
    model: { kind: 'bones', color: 0xe8e2d0 },
  },
  coins: {
    name: 'Coins',
    examine: 'Lovely money.',
    value: 1, stackable: true,
    icon: '<ellipse cx="12" cy="17" rx="7" ry="3" fill="#b8942a"/><ellipse cx="9.3" cy="15" rx="4.6" ry="2" fill="#d0aa34"/><ellipse cx="14.6" cy="14.2" rx="4.6" ry="2" fill="#d0aa34"/><ellipse cx="12" cy="12" rx="7" ry="3" fill="#dcb63c"/><ellipse cx="12" cy="8" rx="7" ry="3" fill="#eccd62"/><path d="M6.4 7.1a7 3 0 0 1 8.4-0.9" stroke="#f9eca6" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
    model: { kind: 'cylinder', color: 0xd8b13a, rTop: 0.13, rBot: 0.13, h: 0.06 },
  },
  logs: {
    name: 'Logs',
    examine: 'A log. Wood, mostly.',
    value: 4, stackable: false,
    icon: '<rect x="3.5" y="9" width="15" height="6" rx="3" fill="#6e5030"/><rect x="4.5" y="9.3" width="13" height="1.8" rx="0.9" fill="#8a6a42"/><path d="M5 12.4h11.5M5 13.7h11" stroke="#5a4326" stroke-width="0.55"/><ellipse cx="18.3" cy="12" rx="2.4" ry="3" fill="#c9a877"/><ellipse cx="18.3" cy="12" rx="1.5" ry="1.9" fill="none" stroke="#a8875c" stroke-width="0.5"/><ellipse cx="18.3" cy="12" rx="0.7" ry="0.9" fill="#9a7a4e"/>',
    model: { kind: 'log', color: 0x7a5a38, r: 0.12, len: 0.8 },
  },
  cabbage: {
    name: 'Cabbage',
    examine: 'Nutritious-ish. A vegetable of the people.',
    value: 1, stackable: false, heals: 1,
    icon: '<circle cx="12" cy="13" r="7.2" fill="#7da75a"/><path d="M12 5.8a7.2 7.2 0 0 1 6.2 3.6M12 5.8a7.2 7.2 0 0 0-6.2 3.6M12 5.8v7" stroke="#5d8742" stroke-width="1.5" fill="none"/>',
    model: { kind: 'sphere', color: 0x7da75a, r: 0.16 },
  },
  cheese: {
    name: 'Cheese',
    examine: 'A wedge of the good stuff. The rat king’s ransom.',
    value: 4, stackable: false, heals: 4,
    icon: '<path d="M4 15l14-6 2 6Z" fill="#e6c33a"/><circle cx="10" cy="13" r="1" fill="#c9a422"/><circle cx="14" cy="12.4" r="0.8" fill="#c9a422"/><circle cx="16.5" cy="13.6" r="0.7" fill="#c9a422"/>',
    model: { kind: 'box', color: 0xe6c33a, w: 0.2, h: 0.12, d: 0.16 },
  },
  feather: {
    name: 'Feather',
    examine: 'Surprisingly aerodynamic.',
    value: 1, stackable: true,
    icon: '<path d="M12 21c0-9 2-14 7-17-1 7-3 12-7 17Z" fill="#e8e4da"/><path d="M12 21c0-9-2-14-7-17 1 7 3 12 7 17Z" fill="#d5d0c2"/>',
    model: { kind: 'box', color: 0xe8e4da, w: 0.06, h: 0.02, d: 0.3 },
  },
  raw_chicken: {
    name: 'Raw chicken',
    examine: 'It was this or the egg.',
    value: 2, stackable: false,
    icon: '<path d="M7 6c4-3 9-1 9 4 0 4-3 6-6 6l-2 4-2-1 1.5-3.5C5 14 4 9 7 6Z" fill="#e8c8b8"/>',
    model: { kind: 'box', color: 0xe8c8b8, w: 0.3, h: 0.14, d: 0.24 },
  },
  raw_beef: {
    name: 'Raw beef',
    examine: 'Moo, formerly.',
    value: 3, stackable: false,
    icon: '<path d="M5 8c5-4 12-2 14 2-1 5-6 8-11 7S3 11 5 8Z" fill="#b8524a"/><path d="M8 10c3-1.5 6-1 8 1" stroke="#e0a8a0" stroke-width="1.5" fill="none"/>',
    model: { kind: 'box', color: 0xb8524a, w: 0.28, h: 0.1, d: 0.24 },
  },
  cowhide: {
    name: 'Cowhide',
    examine: 'Fashion, pending.',
    value: 3, stackable: false,
    icon: '<path d="M5 5h14l-2 3 2 3-2 3 2 3-2 3H5l2-3-2-3 2-3-2-3Z" fill="#c9a877"/><circle cx="10" cy="11" r="1.8" fill="#8a6a42"/><circle cx="15" cy="15" r="1.4" fill="#8a6a42"/>',
    model: { kind: 'box', color: 0xc9a877, w: 0.5, h: 0.04, d: 0.4 },
  },
  old_boot: {
    name: 'Old boot',
    examine: 'It has walked roads you haven’t.',
    value: 0, stackable: false,
    icon: '<path d="M9 4h5v9l4.5 2.5V20H6V4Z" fill="#6b5a44"/><path d="M6 17h12.5" stroke="#54452f" stroke-width="1.5"/>',
    model: { kind: 'box', color: 0x6b5a44, w: 0.3, h: 0.18, d: 0.16 },
  },

  // ---- tools (gates for gathering; tiers add nothing but pride yet) --------
  bronze_axe: {
    name: 'Bronze axe', examine: 'For persuading trees.', value: 16, stackable: false,
    tool: 'axe', toolReq: 1,
    icon: '<rect x="11" y="6" width="2.6" height="15" rx="1" fill="#6e4f33"/><path d="M11 5 6 7c0 3 1.5 5 5 5.5L14 11V6Z" fill="#b5854b"/>',
    model: { kind: 'axe', color: 0xb5854b, handle: 0x6e4f33 },
  },
  iron_axe: {
    name: 'Iron axe', examine: 'A sterner argument for trees.', value: 56, stackable: false,
    tool: 'axe', toolReq: 5,
    icon: '<rect x="11" y="6" width="2.6" height="15" rx="1" fill="#6e4f33"/><path d="M11 5 6 7c0 3 1.5 5 5 5.5L14 11V6Z" fill="#9a9aa2"/>',
    model: { kind: 'axe', color: 0x9a9aa2, handle: 0x6e4f33 },
  },
  steel_axe: {
    name: 'Steel axe', examine: 'Trees speak of it in whispers.', value: 200, stackable: false,
    tool: 'axe', toolReq: 10,
    icon: '<rect x="11" y="6" width="2.6" height="15" rx="1" fill="#6e4f33"/><path d="M11 5 6 7c0 3 1.5 5 5 5.5L14 11V6Z" fill="#c8ccd4"/>',
    model: { kind: 'axe', color: 0xc8ccd4, handle: 0x6e4f33 },
  },
  bronze_pickaxe: {
    name: 'Bronze pickaxe', examine: 'Rock bothering, entry level.', value: 14, stackable: false,
    tool: 'pickaxe', toolReq: 1,
    icon: '<rect x="11" y="7" width="2.4" height="14" rx="1" fill="#6e4f33"/><path d="M4 8c3-3 13-3 16 0-2-2-6-3-8-3s-6 1-8 3Z" fill="#b5854b"/>',
    model: { kind: 'pick', color: 0xb5854b, handle: 0x6e4f33 },
  },
  iron_pickaxe: {
    name: 'Iron pickaxe', examine: 'Rocks respect it slightly more.', value: 50, stackable: false,
    tool: 'pickaxe', toolReq: 5,
    icon: '<rect x="11" y="7" width="2.4" height="14" rx="1" fill="#6e4f33"/><path d="M4 8c3-3 13-3 16 0-2-2-6-3-8-3s-6 1-8 3Z" fill="#9a9aa2"/>',
    model: { kind: 'pick', color: 0x9a9aa2, handle: 0x6e4f33 },
  },
  steel_pickaxe: {
    name: 'Steel pickaxe', examine: 'The mountain sighs.', value: 180, stackable: false,
    tool: 'pickaxe', toolReq: 10,
    icon: '<rect x="11" y="7" width="2.4" height="14" rx="1" fill="#6e4f33"/><path d="M4 8c3-3 13-3 16 0-2-2-6-3-8-3s-6 1-8 3Z" fill="#c8ccd4"/>',
    model: { kind: 'pick', color: 0xc8ccd4, handle: 0x6e4f33 },
  },
  small_net: {
    name: 'Small net', examine: 'Holes arranged to catch fish.', value: 5, stackable: false,
    tool: 'net', toolReq: 1,
    icon: '<path d="M6 4v13a4 4 0 0 0 8 0V4" fill="none" stroke="#c9bf98" stroke-width="1.6"/><path d="M6 8h8M6 12h8M8 4v15M12 4v15" stroke="#c9bf98" stroke-width="0.9"/>',
    model: { kind: 'box', color: 0xc9bf98, w: 0.28, h: 0.1, d: 0.28 },
  },
  fishing_rod: {
    name: 'Fishing rod', examine: 'Patience, with a handle.', value: 15, stackable: false,
    tool: 'rod', toolReq: 1,
    icon: '<path d="M5 21C9 15 15 8 19 3" stroke="#6e4f33" stroke-width="2" fill="none"/><path d="M19 3c0 4-1 7-3 9" stroke="#c9bf98" stroke-width="0.9" fill="none"/>',
    model: { kind: 'rod', color: 0x6e4f33 },
  },
  fly_rod: {
    name: 'Fly rod', examine: 'For fooling clever fish with feathers.', value: 20, stackable: false,
    tool: 'flyrod', toolReq: 1,
    icon: '<path d="M5 21C9 15 15 8 19 3" stroke="#8a6a42" stroke-width="2" fill="none"/><path d="M19 3c0 5-2 9-5 12" stroke="#c9bf98" stroke-width="0.9" fill="none"/>',
    model: { kind: 'rod', color: 0x8a6a42 },
  },
  tinderbox: {
    name: 'Tinderbox', examine: 'Civilization in a small box.', value: 1, stackable: false,
    tool: 'tinderbox', toolReq: 1,
    icon: '<rect x="5" y="9" width="14" height="8" rx="1.5" fill="#8a8078"/><path d="M9 9c0-3 2-5 3-5 0 2 2 2 2 5" fill="#d8862a"/>',
    model: { kind: 'box', color: 0x8a8078, w: 0.22, h: 0.1, d: 0.16 },
  },
  fishing_bait: {
    name: 'Fishing bait', examine: 'Wriggly. The fish disagree about whether that’s good.', value: 1, stackable: true,
    icon: '<circle cx="9" cy="13" r="4.5" fill="#b08d97"/><circle cx="14" cy="10" r="3.5" fill="#c9a2ac"/>',
    model: { kind: 'box', color: 0xb08d97, w: 0.14, h: 0.08, d: 0.14 },
  },

  // ---- logs & ores ----------------------------------------------------------
  oak_logs: {
    name: 'Oak logs', examine: 'Dense, dependable wood.', value: 8, stackable: false,
    icon: '<rect x="3.5" y="9" width="15" height="6" rx="3" fill="#8a6a42"/><ellipse cx="18.5" cy="12" rx="2.3" ry="3" fill="#d4b58a"/><ellipse cx="18.5" cy="12" rx="1.1" ry="1.5" fill="#a8875c"/>',
    model: { kind: 'log', color: 0x8a6a42, r: 0.13, len: 0.8 },
  },
  willow_logs: {
    name: 'Willow logs', examine: 'Light wood that remembers the river.', value: 16, stackable: false,
    icon: '<rect x="3.5" y="9" width="15" height="6" rx="3" fill="#9a8a58"/><ellipse cx="18.5" cy="12" rx="2.3" ry="3" fill="#d8cf9e"/><ellipse cx="18.5" cy="12" rx="1.1" ry="1.5" fill="#b0a468"/>',
    model: { kind: 'log', color: 0x9a8a58, r: 0.12, len: 0.8 },
  },
  yew_logs: {
    name: 'Yew logs', examine: 'Wood that outlived every opinion about it.', value: 80, stackable: false,
    icon: '<rect x="3.5" y="9" width="15" height="6" rx="3" fill="#4a3a28"/><ellipse cx="18.5" cy="12" rx="2.3" ry="3" fill="#a88d5c"/><ellipse cx="18.5" cy="12" rx="1.1" ry="1.5" fill="#7a6038"/>',
    model: { kind: 'log', color: 0x4a3a28, r: 0.14, len: 0.8 },
  },
  copper_ore: {
    name: 'Copper ore', examine: 'One half of a famous partnership.', value: 3, stackable: false,
    icon: '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="#b5703a"/>',
    model: { kind: 'sphere', color: 0xb5703a, r: 0.15 },
  },
  tin_ore: {
    name: 'Tin ore', examine: 'The other half.', value: 3, stackable: false,
    icon: '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="#b8bcc0"/>',
    model: { kind: 'sphere', color: 0xb8bcc0, r: 0.15 },
  },
  iron_ore: {
    name: 'Iron ore', examine: 'Stubborn rock with ambitions.', value: 17, stackable: false,
    icon: '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="#8a5a44"/>',
    model: { kind: 'sphere', color: 0x8a5a44, r: 0.15 },
  },
  coal: {
    name: 'Coal', examine: 'A rock that burns. Truly we live in an age of wonders.', value: 45, stackable: false,
    icon: '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#3a3632"/><path d="M9 12l3-3 3 2-1 4-3 1Z" fill="#221f1c"/>',
    model: { kind: 'sphere', color: 0x2a2624, r: 0.15 },
  },

  // ---- fish: raw, cooked, and regrettable ------------------------------------
  raw_shrimp: {
    name: 'Raw shrimp', examine: 'Small, pink, and full of promise.', value: 2, stackable: false,
    icon: '<path d="M7 8c6-3 11 2 9 7-2 4-8 4-10 1l3-2c1 2 4 2 5 0 1-3-2-6-7-4Z" fill="#e8a8a0"/>',
    model: { kind: 'box', color: 0xe8a8a0, w: 0.16, h: 0.06, d: 0.1 },
  },
  shrimp: {
    name: 'Shrimp', examine: 'Cooked until agreeable.', value: 3, stackable: false, heals: 3,
    icon: '<path d="M7 8c6-3 11 2 9 7-2 4-8 4-10 1l3-2c1 2 4 2 5 0 1-3-2-6-7-4Z" fill="#e07a6a"/>',
    model: { kind: 'box', color: 0xe07a6a, w: 0.16, h: 0.06, d: 0.1 },
  },
  raw_sardine: {
    name: 'Raw sardine', examine: 'A modest fish of modest dreams.', value: 3, stackable: false,
    icon: '<path d="M4 12c4-4 10-4 13 0l3-3v6l-3-3c-3 4-9 4-13 0Z" fill="#a8b8c8"/>',
    model: { kind: 'box', color: 0xa8b8c8, w: 0.26, h: 0.05, d: 0.09 },
  },
  sardine: {
    name: 'Sardine', examine: 'Now with 100% more edible.', value: 4, stackable: false, heals: 4,
    icon: '<path d="M4 12c4-4 10-4 13 0l3-3v6l-3-3c-3 4-9 4-13 0Z" fill="#8a9aa8"/>',
    model: { kind: 'box', color: 0x8a9aa8, w: 0.26, h: 0.05, d: 0.09 },
  },
  raw_herring: {
    name: 'Raw herring', examine: 'Silver and suspicious.', value: 4, stackable: false,
    icon: '<path d="M4 12c4-5 11-5 14 0l2-2v5l-2-2c-3 5-10 5-14-1Z" fill="#c0ccd8"/>',
    model: { kind: 'box', color: 0xc0ccd8, w: 0.28, h: 0.05, d: 0.1 },
  },
  herring: {
    name: 'Herring', examine: 'A red herring, technically.', value: 5, stackable: false, heals: 5,
    icon: '<path d="M4 12c4-5 11-5 14 0l2-2v5l-2-2c-3 5-10 5-14-1Z" fill="#b08a80"/>',
    model: { kind: 'box', color: 0xb08a80, w: 0.28, h: 0.05, d: 0.1 },
  },
  raw_trout: {
    name: 'Raw trout', examine: 'A handsome river fish, briefly inconvenienced.', value: 12, stackable: false,
    icon: '<path d="M3 12c4-5 12-5 15 0l3-3v6l-3-3c-3 5-11 5-15 0Z" fill="#c8b8a8"/><circle cx="7" cy="11" r="0.9" fill="#5a4a3a"/>',
    model: { kind: 'box', color: 0xc8b8a8, w: 0.32, h: 0.06, d: 0.11 },
  },
  trout: {
    name: 'Trout', examine: 'The pride of the Holm. Delicious.', value: 14, stackable: false, heals: 7,
    icon: '<path d="M3 12c4-5 12-5 15 0l3-3v6l-3-3c-3 5-11 5-15 0Z" fill="#c89a6a"/><circle cx="7" cy="11" r="0.9" fill="#5a4a3a"/>',
    model: { kind: 'box', color: 0xc89a6a, w: 0.32, h: 0.06, d: 0.11 },
  },
  raw_pike: {
    name: 'Raw pike', examine: 'All teeth and grudges.', value: 15, stackable: false,
    icon: '<path d="M2 12c5-4 13-4 16 0l4-2v4l-4-2c-3 4-11 4-16 0Z" fill="#a8b090"/>',
    model: { kind: 'box', color: 0xa8b090, w: 0.36, h: 0.06, d: 0.11 },
  },
  pike: {
    name: 'Pike', examine: 'The teeth are optional eating.', value: 17, stackable: false, heals: 8,
    icon: '<path d="M2 12c5-4 13-4 16 0l4-2v4l-4-2c-3 4-11 4-16 0Z" fill="#98a078"/>',
    model: { kind: 'box', color: 0x98a078, w: 0.36, h: 0.06, d: 0.11 },
  },
  raw_salmon: {
    name: 'Raw salmon', examine: 'It swam upstream for this?', value: 20, stackable: false,
    icon: '<path d="M3 12c4-5 12-5 15 0l3-3v6l-3-3c-3 5-11 5-15 0Z" fill="#d8a090"/>',
    model: { kind: 'box', color: 0xd8a090, w: 0.34, h: 0.06, d: 0.11 },
  },
  salmon: {
    name: 'Salmon', examine: 'Pink perfection.', value: 22, stackable: false, heals: 9,
    icon: '<path d="M3 12c4-5 12-5 15 0l3-3v6l-3-3c-3 5-11 5-15 0Z" fill="#d88a72"/>',
    model: { kind: 'box', color: 0xd88a72, w: 0.34, h: 0.06, d: 0.11 },
  },
  raw_tuna: {
    name: 'Raw tuna', examine: 'A torpedo with fins.', value: 22, stackable: false,
    icon: '<path d="M2 12c5-5 14-5 18 0l2-3v6l-2-3c-4 5-13 5-18 0Z" fill="#5a7a8a"/>',
    model: { kind: 'box', color: 0x5a7a8a, w: 0.4, h: 0.07, d: 0.12 },
  },
  tuna: {
    name: 'Tuna', examine: 'Steaked and serious.', value: 24, stackable: false, heals: 10,
    icon: '<path d="M2 12c5-5 14-5 18 0l2-3v6l-2-3c-4 5-13 5-18 0Z" fill="#8a5a4a"/>',
    model: { kind: 'box', color: 0x8a5a4a, w: 0.4, h: 0.07, d: 0.12 },
  },
  raw_lobster: {
    name: 'Raw lobster', examine: 'Grumpy, blue, and heavily armed.', value: 28, stackable: false,
    icon: '<ellipse cx="12" cy="13" rx="5" ry="7" fill="#3a5a8a"/><path d="M8 6l-2-2M16 6l2-2" stroke="#3a5a8a" stroke-width="1.6"/>',
    model: { kind: 'box', color: 0x3a5a8a, w: 0.22, h: 0.12, d: 0.3 },
  },
  lobster: {
    name: 'Lobster', examine: 'Now red, now delicious.', value: 30, stackable: false, heals: 12,
    icon: '<ellipse cx="12" cy="13" rx="5" ry="7" fill="#c23a2a"/><path d="M8 6l-2-2M16 6l2-2" stroke="#c23a2a" stroke-width="1.6"/>',
    model: { kind: 'box', color: 0xc23a2a, w: 0.22, h: 0.12, d: 0.3 },
  },
  raw_swordfish: {
    name: 'Raw swordfish', examine: 'It came at you point-first.', value: 34, stackable: false,
    icon: '<path d="M4 12c5-4 12-4 15 0l3-2v4l-3-2c-3 4-10 4-15 0Z" fill="#6a8090"/><path d="M2 12h4" stroke="#c8ccd4" stroke-width="1.4"/>',
    model: { kind: 'box', color: 0x6a8090, w: 0.44, h: 0.06, d: 0.11 },
  },
  swordfish: {
    name: 'Swordfish', examine: 'The finest fish, disarmed and grilled.', value: 38, stackable: false, heals: 14,
    icon: '<path d="M4 12c5-4 12-4 15 0l3-2v4l-3-2c-3 4-10 4-15 0Z" fill="#9a7a5a"/><path d="M2 12h4" stroke="#c8ccd4" stroke-width="1.4"/>',
    model: { kind: 'box', color: 0x9a7a5a, w: 0.44, h: 0.06, d: 0.11 },
  },
  raw_shark: {
    name: 'Raw shark', examine: 'It was apex until about ten minutes ago.', value: 60, stackable: false,
    icon: '<path d="M3 13c6-6 13-6 17-1l3-3-1 5 1 5-3-3c-4 5-11 5-17-1Z" fill="#5a6a72"/><path d="M12 4l3 5h-6Z" fill="#5a6a72"/>',
    model: { kind: 'box', color: 0x5a6a72, w: 0.5, h: 0.1, d: 0.16 },
  },
  shark: {
    name: 'Shark', examine: 'The finest catch in the realm. Bites back less, now.', value: 70, stackable: false, heals: 20,
    icon: '<path d="M3 13c6-6 13-6 17-1l3-3-1 5 1 5-3-3c-4 5-11 5-17-1Z" fill="#7a8a92"/><path d="M12 4l3 5h-6Z" fill="#7a8a92"/>',
    model: { kind: 'box', color: 0x7a8a92, w: 0.5, h: 0.1, d: 0.16 },
  },
  lobster_pot: {
    name: 'Lobster pot', examine: 'A cage that lobsters keep walking into. Rude of them.', value: 20, stackable: false,
    tool: 'cage', toolReq: 1,
    icon: '<path d="M6 8h12l-1 12H7Z" fill="none" stroke="#a89060" stroke-width="1.4"/><path d="M6 12h12M9 8v12M15 8v12" stroke="#a89060" stroke-width="0.9"/>',
    model: { kind: 'box', color: 0xa89060, w: 0.26, h: 0.2, d: 0.26 },
  },
  harpoon: {
    name: 'Harpoon', examine: 'For fish that fight back. And the sea, generally.', value: 25, stackable: false,
    tool: 'harpoon', toolReq: 1,
    icon: '<rect x="11" y="4" width="2" height="17" rx="1" fill="#6e4f33"/><path d="M12 2l-3 5h6ZM9 6l-2 2M15 6l2 2" stroke="#c8ccd4" stroke-width="1.4" fill="#c8ccd4"/>',
    model: { kind: 'rod', color: 0xc8ccd4 },
  },
  cooked_beef: {
    name: 'Cooked beef', examine: 'Moo, well done.', value: 4, stackable: false, heals: 3,
    icon: '<path d="M5 8c5-4 12-2 14 2-1 5-6 8-11 7S3 11 5 8Z" fill="#8a5a44"/>',
    model: { kind: 'box', color: 0x8a5a44, w: 0.28, h: 0.1, d: 0.24 },
  },
  cooked_chicken: {
    name: 'Cooked chicken', examine: 'Tastes like chicken.', value: 4, stackable: false, heals: 3,
    icon: '<path d="M7 6c4-3 9-1 9 4 0 4-3 6-6 6l-2 4-2-1 1.5-3.5C5 14 4 9 7 6Z" fill="#d8a45a"/>',
    model: { kind: 'box', color: 0xd8a45a, w: 0.3, h: 0.14, d: 0.24 },
  },
  burnt_fish: {
    name: 'Burnt fish', examine: 'Charcoal, fish-shaped.', value: 0, stackable: false,
    icon: '<path d="M4 12c4-4 10-4 13 0l3-3v6l-3-3c-3 4-9 4-13 0Z" fill="#3a3632"/>',
    model: { kind: 'box', color: 0x3a3632, w: 0.26, h: 0.05, d: 0.09 },
  },
  burnt_meat: {
    name: 'Burnt meat', examine: 'A cautionary tale with a crust.', value: 0, stackable: false,
    icon: '<path d="M5 8c5-4 12-2 14 2-1 5-6 8-11 7S3 11 5 8Z" fill="#3a3632"/>',
    model: { kind: 'box', color: 0x3a3632, w: 0.28, h: 0.1, d: 0.24 },
  },
  ashes: {
    name: 'Ashes', examine: 'Regret, powdered.', value: 1, stackable: false,
    icon: '<path d="M6 16c0-3 3-4 6-4s6 1 6 4-3 3-6 3-6 0-6-3Z" fill="#8a8480"/><path d="M9 12c0-2 1-4 3-5 2 1 3 3 3 5" fill="none" stroke="#a8a29c" stroke-width="1.2"/>',
    model: { kind: 'box', color: 0x8a8480, w: 0.24, h: 0.05, d: 0.24 },
  },

  // ---- smithing & crafting supplies -----------------------------------------
  gold_ore: {
    name: 'Gold ore', examine: 'Heavy, gleaming, and extremely willing to be admired.', value: 75, stackable: false,
    icon: '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="#e0b83a"/>',
    model: { kind: 'sphere', color: 0xe0b83a, r: 0.15 },
  },
  bronze_bar: {
    name: 'Bronze bar', examine: 'Copper and tin, happily married.', value: 8, stackable: false,
    icon: '<path d="M5 10h11l3 5H8Z" fill="#b5854b"/><path d="M5 10l3 5" stroke="#8a6338" stroke-width="1"/>',
    model: { kind: 'box', color: 0xb5854b, w: 0.34, h: 0.09, d: 0.15 },
  },
  iron_bar: {
    name: 'Iron bar', examine: 'It agreed to be a bar after all.', value: 28, stackable: false,
    icon: '<path d="M5 10h11l3 5H8Z" fill="#9a9aa2"/><path d="M5 10l3 5" stroke="#71717a" stroke-width="1"/>',
    model: { kind: 'box', color: 0x9a9aa2, w: 0.34, h: 0.09, d: 0.15 },
  },
  steel_bar: {
    name: 'Steel bar', examine: 'Iron, but with ambition and coal.', value: 100, stackable: false,
    icon: '<path d="M5 10h11l3 5H8Z" fill="#c8ccd4"/><path d="M5 10l3 5" stroke="#9aa0aa" stroke-width="1"/>',
    model: { kind: 'box', color: 0xc8ccd4, w: 0.34, h: 0.09, d: 0.15 },
  },
  gold_bar: {
    name: 'Gold bar', examine: 'Wealth in its most huggable form.', value: 150, stackable: false,
    icon: '<path d="M5 10h11l3 5H8Z" fill="#e0b83a"/><path d="M5 10l3 5" stroke="#b08d20" stroke-width="1"/>',
    model: { kind: 'box', color: 0xe0b83a, w: 0.34, h: 0.09, d: 0.15 },
  },
  hammer: {
    name: 'Hammer', examine: 'The first and final argument of the smith.', value: 1, stackable: false,
    tool: 'hammer', toolReq: 1,
    icon: '<rect x="11" y="8" width="2.4" height="13" rx="1" fill="#6e4f33"/><rect x="6" y="4" width="12" height="5" rx="1" fill="#8a8078"/>',
    model: { kind: 'pick', color: 0x8a8078, handle: 0x6e4f33 },
  },
  shears: {
    name: 'Shears', examine: 'For negotiating with sheep.', value: 1, stackable: false,
    tool: 'shears', toolReq: 1,
    icon: '<path d="M8 4l4 9M16 4l-4 9" stroke="#c8ccd4" stroke-width="2"/><circle cx="8" cy="16" r="3" fill="none" stroke="#8a8078" stroke-width="1.8"/><circle cx="16" cy="16" r="3" fill="none" stroke="#8a8078" stroke-width="1.8"/>',
    model: { kind: 'blade', color: 0xc8ccd4, handle: 0x8a8078 },
  },
  needle: {
    name: 'Needle', examine: 'Small, sharp, easily lost, dearly missed.', value: 1, stackable: false,
    tool: 'needle', toolReq: 1,
    icon: '<path d="M6 18 18 6" stroke="#c8ccd4" stroke-width="1.6"/><circle cx="17" cy="7" r="1.6" fill="none" stroke="#c8ccd4" stroke-width="1"/>',
    model: { kind: 'box', color: 0xc8ccd4, w: 0.02, h: 0.02, d: 0.2 },
  },
  thread: {
    name: 'Thread', examine: 'Holds the realm’s trousers together.', value: 1, stackable: true,
    icon: '<circle cx="12" cy="12" r="5" fill="none" stroke="#c9bf98" stroke-width="2.4"/><rect x="11" y="6" width="2" height="12" fill="#b0a684"/>',
    model: { kind: 'cylinder', color: 0xc9bf98, rTop: 0.06, rBot: 0.06, h: 0.1 },
  },
  chisel: {
    name: 'Chisel', examine: 'For telling gems what shape to be.', value: 1, stackable: false,
    tool: 'chisel', toolReq: 1,
    icon: '<rect x="10.8" y="4" width="2.4" height="10" fill="#8a8078"/><path d="M10.8 14h2.4l-1.2 6Z" fill="#c8ccd4"/>',
    model: { kind: 'box', color: 0x8a8078, w: 0.05, h: 0.05, d: 0.22 },
  },
  ring_mould: {
    name: 'Ring mould', examine: 'A small circle of great expectations.', value: 3, stackable: false,
    icon: '<rect x="5" y="7" width="14" height="10" rx="1.5" fill="#6a655e"/><circle cx="12" cy="12" r="3" fill="#3a3632"/>',
    model: { kind: 'box', color: 0x6a655e, w: 0.2, h: 0.05, d: 0.2 },
  },
  amulet_mould: {
    name: 'Amulet mould', examine: 'For casting fashionable destiny.', value: 3, stackable: false,
    icon: '<rect x="5" y="7" width="14" height="10" rx="1.5" fill="#6a655e"/><path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0-1v2" stroke="#3a3632" stroke-width="1.6" fill="none"/>',
    model: { kind: 'box', color: 0x6a655e, w: 0.2, h: 0.05, d: 0.2 },
  },
  wool: {
    name: 'Wool', examine: 'Recently a sheep’s pride and joy.', value: 1, stackable: false,
    icon: '<circle cx="9" cy="12" r="4" fill="#e8e4da"/><circle cx="14" cy="10" r="4" fill="#f0ede4"/><circle cx="14" cy="14" r="3.5" fill="#e0dcd2"/>',
    model: { kind: 'sphere', color: 0xe8e4da, r: 0.16 },
  },
  ball_of_wool: {
    name: 'Ball of wool', examine: 'Wool, but organized.', value: 2, stackable: false,
    icon: '<circle cx="12" cy="12" r="6" fill="#e8e4da"/><path d="M6 12c4-3 8-3 12 0M6 12c4 3 8 3 12 0" stroke="#c9c4b8" stroke-width="1" fill="none"/>',
    model: { kind: 'sphere', color: 0xe8e4da, r: 0.13 },
  },
  leather: {
    name: 'Leather', examine: 'Cow, refined.', value: 5, stackable: false,
    icon: '<path d="M5 6h14l-2 3 2 3-2 3 2 3-2 2H5l2-3-2-3 2-3-2-3Z" fill="#a8794e"/>',
    model: { kind: 'box', color: 0xa8794e, w: 0.44, h: 0.03, d: 0.36 },
  },
  uncut_sapphire: {
    name: 'Uncut sapphire', examine: 'A blue promise in a rough coat.', value: 25, stackable: false,
    icon: '<path d="M7 15l3-8 6 2 1 7-5 3Z" fill="#3a5fbf"/>',
    model: { kind: 'sphere', color: 0x3a5fbf, r: 0.1 },
  },
  cut_sapphire: {
    name: 'Sapphire', examine: 'Cut until it learned to sparkle.', value: 60, stackable: false,
    icon: '<path d="M6 10h12l-6 9Z" fill="#4a72e0"/><path d="M6 10l3-4h6l3 4" fill="#6a90f0"/>',
    model: { kind: 'sphere', color: 0x4a72e0, r: 0.09 },
  },
  uncut_emerald: {
    name: 'Uncut emerald', examine: 'Green with potential.', value: 40, stackable: false,
    icon: '<path d="M7 15l3-8 6 2 1 7-5 3Z" fill="#2f9f5a"/>',
    model: { kind: 'sphere', color: 0x2f9f5a, r: 0.1 },
  },
  cut_emerald: {
    name: 'Emerald', examine: 'Green with achievement.', value: 100, stackable: false,
    icon: '<path d="M6 10h12l-6 9Z" fill="#38bf6a"/><path d="M6 10l3-4h6l3 4" fill="#5fd88a"/>',
    model: { kind: 'sphere', color: 0x38bf6a, r: 0.09 },
  },
  uncut_ruby: {
    name: 'Uncut ruby', examine: 'A smoulder waiting for a jeweller.', value: 60, stackable: false,
    icon: '<path d="M7 15l3-8 6 2 1 7-5 3Z" fill="#b03038"/>',
    model: { kind: 'sphere', color: 0xb03038, r: 0.1 },
  },
  cut_ruby: {
    name: 'Ruby', examine: 'It smoulders professionally now.', value: 150, stackable: false,
    icon: '<path d="M6 10h12l-6 9Z" fill="#d8404a"/><path d="M6 10l3-4h6l3 4" fill="#e86a72"/>',
    model: { kind: 'sphere', color: 0xd8404a, r: 0.09 },
  },
  gold_ring: {
    name: 'Gold ring', examine: 'A circle of modest importance.', value: 70, stackable: false,
    slot: 'ring', reqs: {}, def: [0, 0, 0, 0, 0],
    icon: '<circle cx="12" cy="13" r="5.5" fill="none" stroke="#e0b83a" stroke-width="2.6"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.08, rBot: 0.08, h: 0.03 },
  },
  sapphire_ring: {
    name: 'Sapphire ring', examine: 'Blue-eyed and smug about it.', value: 220, stackable: false,
    slot: 'ring', reqs: {}, def: [0, 0, 0, 0, 0],
    icon: '<circle cx="12" cy="14" r="5" fill="none" stroke="#e0b83a" stroke-width="2.4"/><path d="M10 7h4l-2 3Z" fill="#4a72e0"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.08, rBot: 0.08, h: 0.03 },
  },
  emerald_ring: {
    name: 'Emerald ring', examine: 'Green fire for a steadier hand.', value: 340, stackable: false,
    slot: 'ring', reqs: {}, atk: [3, 3, 3, 2, 3], str: 0, def: [0, 0, 0, 0, 0],
    icon: '<circle cx="12" cy="14" r="5" fill="none" stroke="#e0b83a" stroke-width="2.4"/><path d="M10 7h4l-2 3Z" fill="#3aa86a"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.08, rBot: 0.08, h: 0.03 },
  },
  ruby_ring: {
    name: 'Ruby ring', examine: 'It lends your arm a little of its temper.', value: 520, stackable: false,
    slot: 'ring', reqs: {}, atk: [0, 0, 0, 0, 0], str: 5, def: [0, 0, 0, 0, 0],
    icon: '<circle cx="12" cy="14" r="5" fill="none" stroke="#e0b83a" stroke-width="2.4"/><path d="M10 7h4l-2 3Z" fill="#d8404a"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.08, rBot: 0.08, h: 0.03 },
  },
  gold_amulet_u: {
    name: 'Gold amulet (unstrung)', examine: 'All dressed up with no string to hang from.', value: 90, stackable: false,
    icon: '<path d="M12 8a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="#e0b83a"/><rect x="10.8" y="5" width="2.4" height="3" fill="#e0b83a"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.09, rBot: 0.09, h: 0.03 },
  },
  wool_cape: {
    name: 'Wool cape', examine: 'Warm. Fashion is subjective.', value: 12, stackable: false,
    slot: 'cape', reqs: {}, atk: [0, 0, 0, 0, 0], str: 0, def: [0, 1, 1, 0, 1],
    icon: '<path d="M8 4h8l3 15-7 2-7-2Z" fill="#e8e4da"/><path d="M8 4c1.5 2 6.5 2 8 0" stroke="#c9c4b8" stroke-width="1.4" fill="none"/>',
    model: { kind: 'box', color: 0xe8e4da, w: 0.34, h: 0.05, d: 0.3 },
  },
  gold_amulet: {
    name: 'Gold amulet', examine: 'Ready to dangle importantly.', value: 100, stackable: false,
    slot: 'neck', reqs: {}, def: [0, 0, 0, 0, 0],
    icon: '<path d="M5 5c2 4 5 6 7 6s5-2 7-6" fill="none" stroke="#c9bf98" stroke-width="1.4"/><circle cx="12" cy="14" r="4" fill="#e0b83a"/>',
    model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.09, rBot: 0.09, h: 0.03 },
  },
};

// ---- magic, ranged & prayer supplies (Phase 7) -------------------------------
const GLYPHS = [
  ['ember_glyph', 'Ember glyph', 0xe07a2a, 'Bottled hearth-anger.'],
  ['gale_glyph', 'Gale glyph', 0xcfd8dc, 'A sliver of caught wind.'],
  ['tide_glyph', 'Tide glyph', 0x4a90c2, 'The river, folded small.'],
  ['stone_glyph', 'Stone glyph', 0x8a7a5a, 'Patience, mineralized.'],
  ['spirit_glyph', 'Spirit glyph', 0xd8d0f0, 'A thought that stayed.'],
  ['sigil_glyph', 'Sigil glyph', 0xc23a5a, 'A word too old to say aloud.'],
  ['void_glyph', 'Void glyph', 0x2a2432, 'The absence of everything else.'],
];
for (const [id, name, hex, examine] of GLYPHS) {
  const css = '#' + hex.toString(16).padStart(6, '0');
  ITEMS[id] = {
    name, examine, value: 4, stackable: true,
    icon: `<rect x="6" y="6" width="12" height="12" rx="2" transform="rotate(45 12 12)" fill="${css}"/><circle cx="12" cy="12" r="2.4" fill="#00000045"/>`,
    model: { kind: 'box', color: hex, w: 0.12, h: 0.05, d: 0.12 },
  };
}

const STAVES = [
  ['gale_staff', 'Gale staff', 0xcfd8dc], ['tide_staff', 'Tide staff', 0x4a90c2],
  ['stone_staff', 'Stone staff', 0x8a7a5a], ['ember_staff', 'Ember staff', 0xe07a2a],
];
for (const [id, name, hex] of STAVES) {
  const css = '#' + hex.toString(16).padStart(6, '0');
  ITEMS[id] = {
    name, examine: 'It hums with its element and never runs dry.',
    value: 200, stackable: false,
    slot: 'weapon', speed: 5, styleSet: 'crusher',
    reqs: { Attack: 1 },
    atk: [1, 0, 3, 10, 0], str: 2, def: [1, 1, 1, 2, 1],
    icon: `<rect x="11" y="6" width="2" height="15" rx="1" fill="#6e4f33"/><circle cx="12" cy="5" r="3" fill="${css}"/>`,
    model: { kind: 'rod', color: hex },
  };
}
// The void staff — endgame focus that supplies void glyphs endlessly and hits
// harder than the elemental staves (redeems the orphaned void glyph line).
ITEMS.void_staff = {
  name: 'Void staff', examine: 'It drinks the light around it, and never runs dry.',
  value: 1500, stackable: false,
  slot: 'weapon', speed: 5, styleSet: 'crusher', reqs: { Attack: 1 },
  atk: [1, 0, 3, 18, 0], str: 2, def: [1, 1, 1, 4, 1],
  icon: '<rect x="11" y="6" width="2" height="15" rx="1" fill="#3a2e4a"/><circle cx="12" cy="5" r="3.2" fill="#6a4a8a"/><circle cx="12" cy="5" r="1.3" fill="#160f1e"/>',
  model: { kind: 'rod', color: 0x6a4a8a },
};

ITEMS.shortbow = {
  name: 'Shortbow', examine: 'Bent wood with strong opinions about distance.', value: 40, stackable: false,
  slot: 'weapon', speed: 5, styleSet: 'bow', twoHanded: true, reqs: { Ranged: 1 },
  atk: [0, 0, 0, 0, 8], str: 0, def: [0, 0, 0, 0, 0], bowRange: 7,
  icon: '<path d="M8 3c6 3 6 15 0 18" fill="none" stroke="#8a6a42" stroke-width="2"/><path d="M8 3v18" stroke="#c9bf98" stroke-width="0.9"/>',
  model: { kind: 'rod', color: 0x8a6a42 },
};
ITEMS.longbow = {
  name: 'Longbow', examine: 'For disagreeing with people far away.', value: 80, stackable: false,
  slot: 'weapon', speed: 6, styleSet: 'bow', twoHanded: true, reqs: { Ranged: 1 },
  atk: [0, 0, 0, 0, 10], str: 0, def: [0, 0, 0, 0, 0], bowRange: 9,
  icon: '<path d="M9 2c7 4 7 16 0 20" fill="none" stroke="#7a5a38" stroke-width="2"/><path d="M9 2v20" stroke="#c9bf98" stroke-width="0.9"/>',
  model: { kind: 'rod', color: 0x7a5a38 },
};
const ARROW_METALS = [
  ['bronze', 'Bronze', '#b5854b', 0xb5854b, 7, 2],
  ['iron', 'Iron', '#9a9aa2', 0x9a9aa2, 10, 5],
  ['steel', 'Steel', '#c8ccd4', 0xc8ccd4, 16, 18],
  // Endgame ammo tiers. Also gives the anvil an ${metal}_arrowtips to smith
  // (openAnvil iterates every SMITHABLES shape, arrowtips included).
  ['coldiron', 'Coldiron', '#9ad0e0', 0x9ad0e0, 20, 30],
  ['mithril', 'Mithril', '#8f9fd8', 0x8f9fd8, 24, 40],
  ['adamant', 'Adamant', '#5aa87a', 0x5aa87a, 31, 70],
  ['rune', 'Rune', '#54b8c8', 0x54b8c8, 49, 150],
];
for (const [mid, label, css, hex, rStr, value] of ARROW_METALS) {
  ITEMS[`${mid}_arrow`] = {
    name: `${label} arrow`, examine: 'Sharp mail, hand-delivered.', value, stackable: true,
    slot: 'ammo', reqs: {}, atk: [0, 0, 0, 0, 0], str: 0, def: [0, 0, 0, 0, 0], rangedStr: rStr,
    icon: `<path d="M4 20 18 6" stroke="#8a6a42" stroke-width="1.6"/><path d="M18 6l-1 5 5-1Z" fill="${css}"/><path d="M4 20l4-1-3-3Z" fill="#e8e4da"/>`,
    model: { kind: 'box', color: hex, w: 0.03, h: 0.02, d: 0.4 },
  };
  ITEMS[`${mid}_arrowtips`] = {
    name: `${label} arrowtips`, examine: 'The pointy part of the plan.', value: Math.max(1, value - 1), stackable: true,
    icon: `<path d="M8 16l4-10 4 10-4-3Z" fill="${css}"/>`,
    model: { kind: 'box', color: hex, w: 0.1, h: 0.04, d: 0.1 },
  };
}
ITEMS.knife = {
  name: 'Knife', examine: 'For whittling wood and winning arguments with rope.', value: 3, stackable: false,
  tool: 'knife', toolReq: 1,
  icon: '<path d="M6 18 15 9l3 3-9 9H6Z" fill="#c8ccd4"/><rect x="14.6" y="4.6" width="4.8" height="4.8" rx="1" transform="rotate(45 17 7)" fill="#6e4f33"/>',
  model: { kind: 'blade', color: 0xc8ccd4, handle: 0x6e4f33 },
};
ITEMS.big_bones = {
  name: 'Big bones', examine: "Somebody's former somebody, but larger.", value: 2, stackable: false,
  icon: '<path d="M6 18 18 6" stroke="#e8e2d0" stroke-width="4" stroke-linecap="round"/><circle cx="5" cy="19" r="2.6" fill="#e8e2d0"/><circle cx="19" cy="5" r="2.6" fill="#e8e2d0"/>',
  model: { kind: 'bones', color: 0xe8e2d0 },
};
ITEMS.dragon_bones = {
  name: 'Dragon bones', examine: 'Heavy, and humming with old fire. The prayerful covet them.', value: 40, stackable: false,
  icon: '<path d="M5 19 19 5" stroke="#e8e0c8" stroke-width="4.5" stroke-linecap="round"/><circle cx="4.5" cy="19.5" r="3" fill="#e8e0c8"/><circle cx="19.5" cy="4.5" r="3" fill="#e8e0c8"/><path d="M10 14l4-4" stroke="#c9b98a" stroke-width="1"/>',
  model: { kind: 'bones', color: 0xe8e0c8 },
};

const WIZARD_WEAR = [
  ['wizard_hat', 'Wizard hat', 'head', [0, 0, 0, 3, -1], 'Pointy. Non-negotiable.'],
  ['wizard_robe_top', 'Wizard robe top', 'body', [0, 0, 0, 6, -4], 'Woven with confidence and static.'],
  ['wizard_robe_bottom', 'Wizard robe bottom', 'legs', [0, 0, 0, 5, -3], 'Swishes importantly.'],
];
for (const [id, name, slot, def, examine] of WIZARD_WEAR) {
  ITEMS[id] = {
    name, examine, value: 15, stackable: false,
    slot, reqs: {}, atk: [0, 0, 0, 2, 0], str: 0, def,
    icon: slot === 'head'
      ? '<path d="M12 3l5 11H7Z" fill="#3a4a8f"/><path d="M5 15h14l-2 4H7Z" fill="#3a4a8f"/>'
      : '<path d="M8 4h8l3 16H5Z" fill="#3a4a8f"/><path d="M8 4c1.5 2 6.5 2 8 0" stroke="#2a3568" stroke-width="1.4" fill="none"/>',
    model: { kind: 'box', color: 0x3a4a8f, w: 0.3, h: 0.06, d: 0.28 },
  };
}

// ---- quest & Glyphcraft items (Phase 9) --------------------------------------
const QUEST_ITEMS = {
  egg: ['Egg', 'Fragile hope, oval edition.', 2, '<ellipse cx="12" cy="13" rx="5" ry="6.5" fill="#f0e8d8"/>',
    { kind: 'sphere', color: 0xf0e8d8, r: 0.1 }],
  bucket_of_milk: ['Bucket of milk', 'The cow’s parting gift.', 3, '<path d="M5 7h14l-2 13H7Z" fill="#8d939c"/><ellipse cx="12" cy="8.5" rx="5.6" ry="1.6" fill="#f2efe6"/>',
    { kind: 'cylinder', color: 0xf2efe6, rTop: 0.17, rBot: 0.13, h: 0.24 }],
  wheat: ['Wheat', 'Bread’s humble ancestor.', 1, '<path d="M12 21V8M12 8l-3-3M12 8l3-3M12 12l-3-3M12 12l3-3M12 16l-3-3M12 16l3-3" stroke="#d8b13a" stroke-width="1.6" fill="none"/>',
    { kind: 'box', color: 0xd8b13a, w: 0.05, h: 0.3, d: 0.05 }],
  flour: ['Pot of flour', 'Ground patience.', 4, '<path d="M7 9h10l1 11H6Z" fill="#b08d57"/><ellipse cx="12" cy="9" rx="5" ry="1.6" fill="#f2efe6"/>',
    { kind: 'cylinder', color: 0xb08d57, rTop: 0.12, rBot: 0.14, h: 0.2 }],
  spectral_charm: ['Spectral charm', 'Cold to the touch. Hears what you cannot.', 0, '<circle cx="12" cy="12" r="6" fill="none" stroke="#8fb2e8" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#8fb2e8"/>',
    { kind: 'cylinder', color: 0x8fb2e8, rTop: 0.08, rBot: 0.08, h: 0.03 }],
  skull: ['Skull', 'Somebody misses this. Specifically.', 0, '<circle cx="12" cy="11" r="6" fill="#e8e2d0"/><rect x="9" y="15" width="6" height="4" rx="1" fill="#e8e2d0"/><circle cx="10" cy="10.5" r="1.4" fill="#2a2624"/><circle cx="14" cy="10.5" r="1.4" fill="#2a2624"/>',
    { kind: 'sphere', color: 0xe8e2d0, r: 0.13 }],
  strange_talisman: ['Strange talisman', 'A broken circle etched in old stone.', 0, '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#c9a232" stroke-width="2.2" stroke-dasharray="8 4"/>',
    { kind: 'cylinder', color: 0xc9a232, rTop: 0.1, rBot: 0.1, h: 0.03 }],
  redberries: ['Redberries', 'Stains everything it loves.', 2, '<circle cx="9" cy="12" r="3" fill="#c23a3a"/><circle cx="14" cy="10" r="3" fill="#d84a4a"/><circle cx="13" cy="15" r="3" fill="#b02f2f"/>',
    { kind: 'sphere', color: 0xc23a3a, r: 0.09 }],
  marsh_greens: ['Marsh greens', 'Green, damp, and oddly proud.', 2, '<path d="M8 20c0-6 1-10 4-14 3 4 4 8 4 14" fill="#4a7a3a"/>',
    { kind: 'box', color: 0x4a7a3a, w: 0.12, h: 0.22, d: 0.05 }],
  red_dye: ['Red dye', 'War paint, pending.', 5, '<path d="M9 5h6v4l2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8l2-2Z" fill="#c23a3a"/>',
    { kind: 'cylinder', color: 0xc23a3a, rTop: 0.07, rBot: 0.09, h: 0.16 }],
  green_dye: ['Green dye', 'The other war paint, pending.', 5, '<path d="M9 5h6v4l2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8l2-2Z" fill="#4a8f3a"/>',
    { kind: 'cylinder', color: 0x4a8f3a, rTop: 0.07, rBot: 0.09, h: 0.16 }],
  blank_slate: ['Blank slate', 'Stone that listens for a word.', 3, '<rect x="7" y="6" width="10" height="13" rx="1.5" fill="#8a8a92"/>',
    { kind: 'box', color: 0x8a8a92, w: 0.14, h: 0.05, d: 0.18 }],
};
for (const [id, [name, examine, value, icon, model]] of Object.entries(QUEST_ITEMS)) {
  ITEMS[id] = { name, examine, value, stackable: false, icon, model };
}
ITEMS.blank_slate.stackable = true;
ITEMS.wheat.stackable = false;

const BEAD_DEFS = [
  ['red_bead', '#c23a3a', 0xc23a3a], ['yellow_bead', '#d8b13a', 0xd8b13a],
  ['black_bead', '#3a3632', 0x3a3632], ['white_bead', '#e8e4da', 0xe8e4da],
];
for (const [id, css, hex] of BEAD_DEFS) {
  const label = id.replace('_bead', '');
  ITEMS[id] = {
    name: label[0].toUpperCase() + label.slice(1) + ' bead',
    examine: 'A magus’s bead, briefly an imp’s treasure.',
    value: 4, stackable: false,
    icon: `<circle cx="12" cy="12" r="5" fill="${css}"/><circle cx="12" cy="12" r="1.6" fill="#00000050"/>`,
    model: { kind: 'sphere', color: hex, r: 0.07 },
  };
}

ITEMS.amulet_of_accuracy = {
  name: 'Amulet of accuracy',
  examine: 'It hums when you aim true.',
  value: 120, stackable: false,
  slot: 'neck', reqs: {}, atk: [4, 4, 4, 2, 4], str: 0, def: [0, 0, 0, 0, 0],
  icon: '<path d="M5 5c2 4 5 6 7 6s5-2 7-6" fill="none" stroke="#c9bf98" stroke-width="1.4"/><circle cx="12" cy="14" r="4" fill="#4a72e0"/>',
  model: { kind: 'cylinder', color: 0x4a72e0, rTop: 0.09, rBot: 0.09, h: 0.03 },
};

// ---- Phase 11 quest items, consumables, and capstone gear -------------------
const P11_ITEMS = {
  beer: ['Beer', 'Liquid courage, mostly foam.', 3, '<path d="M7 8h8v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1Z" fill="#d8a83a"/><rect x="14" y="10" width="3" height="6" rx="1.5" fill="none" stroke="#d8a83a" stroke-width="1.4"/><rect x="7" y="6" width="8" height="3" rx="1.5" fill="#f0ecdc"/>',
    { kind: 'cylinder', color: 0xd8a83a, rTop: 0.09, rBot: 0.09, h: 0.24 }],
  garlic: ['Garlic', 'Repels vampires and conversation.', 2, '<circle cx="12" cy="14" r="5" fill="#eae6da"/><path d="M12 9V5M10 13c0 3 4 3 4 0" stroke="#c9c4b4" stroke-width="1.2" fill="none"/>',
    { kind: 'sphere', color: 0xeae6da, r: 0.12 }],
  stake: ['Wooden stake', 'One end pointed with grim intent.', 4, '<path d="M11 3h2l1 14-2 4-2-4Z" fill="#8a6a42"/>',
    { kind: 'box', color: 0x8a6a42, w: 0.06, h: 0.5, d: 0.06 }],
  oil_can: ['Oil can', 'For hinges, levers, and stubborn machinery.', 5, '<path d="M6 12h9l3-2v6l-3-2H6Z" fill="#5a5a62"/><path d="M15 10l4-4" stroke="#5a5a62" stroke-width="1.6"/>',
    { kind: 'box', color: 0x5a5a62, w: 0.2, h: 0.16, d: 0.14 }],
  fish_food: ['Fish food', 'Flakes. Piranhas are not fussy.', 2, '<circle cx="9" cy="10" r="1.6" fill="#c9a24a"/><circle cx="14" cy="9" r="1.6" fill="#c9a24a"/><circle cx="12" cy="14" r="1.6" fill="#c9a24a"/><circle cx="15" cy="14" r="1.6" fill="#c9a24a"/>',
    { kind: 'box', color: 0xc9a24a, w: 0.1, h: 0.06, d: 0.1 }],
  poison: ['Vial of poison', 'The label is a skull. The skull is smiling.', 6, '<path d="M9 4h6v3l2 4v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8l2-4Z" fill="#5aa84a"/><circle cx="12" cy="14" r="2" fill="#2a2624"/>',
    { kind: 'cylinder', color: 0x5aa84a, rTop: 0.06, rBot: 0.08, h: 0.16 }],
  poisoned_food: ['Poisoned fish food', 'Dinner, with a fatal seasoning.', 2, '<circle cx="9" cy="10" r="1.6" fill="#5aa84a"/><circle cx="14" cy="9" r="1.6" fill="#5aa84a"/><circle cx="12" cy="14" r="1.6" fill="#5aa84a"/><circle cx="15" cy="14" r="1.6" fill="#5aa84a"/>',
    { kind: 'box', color: 0x5aa84a, w: 0.1, h: 0.06, d: 0.1 }],
  family_portrait: ['Family portrait', 'A stern knight, sterner frame.', 8, '<rect x="5" y="4" width="14" height="16" rx="1" fill="#8a6a42"/><rect x="7" y="6" width="10" height="12" fill="#c9b48a"/><circle cx="12" cy="11" r="2.4" fill="#5a4a3a"/>',
    { kind: 'box', color: 0x8a6a42, w: 0.28, h: 0.36, d: 0.04 }],
  coldiron_ore: ['Coldiron ore', 'Cold to the marrow, even in your hand.', 50, '<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="#9ad0e0"/>',
    { kind: 'sphere', color: 0x9ad0e0, r: 0.15 }],
  coldiron_bar: ['Coldiron bar', 'It frosts the anvil it rests on.', 110, '<path d="M5 10h11l3 5H8Z" fill="#9ad0e0"/><path d="M5 10l3 5" stroke="#6ea8b8" stroke-width="1"/>',
    { kind: 'box', color: 0x9ad0e0, w: 0.34, h: 0.09, d: 0.15 }],
  heirloom_sword: ['Heirloom sword', 'Reforged. The knight need never know it broke.', 120, '<path d="M11 2h2l0.6 12h-3.2Z" fill="#c8e4ec"/><rect x="8" y="14" width="8" height="1.8" rx="0.9" fill="#c9a232"/><rect x="11" y="15.6" width="2" height="5" rx="1" fill="#6e4f33"/>',
    { kind: 'blade', color: 0xc8e4ec, handle: 0xc9a232 }],
  warding_words: ['Warding words', 'Say them and the dark leans away.', 0, '<rect x="5" y="5" width="14" height="14" rx="1" fill="#e8e2d0"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#5a4a3a" stroke-width="1.1"/>',
    { kind: 'box', color: 0xe8e2d0, w: 0.2, h: 0.02, d: 0.24 }],
  key_stone: ['Stone key', 'Heavy, patient, unhurried.', 0, '<circle cx="8" cy="12" r="3.5" fill="none" stroke="#8a8a82" stroke-width="2"/><path d="M11 12h9M17 12v4M20 12v3" stroke="#8a8a82" stroke-width="2"/>',
    { kind: 'box', color: 0x8a8a82, w: 0.06, h: 0.02, d: 0.2 }],
  key_flame: ['Flame key', 'Warm to the touch, warmer to the lock.', 0, '<circle cx="8" cy="12" r="3.5" fill="none" stroke="#d86a2a" stroke-width="2"/><path d="M11 12h9M17 12v4M20 12v3" stroke="#d86a2a" stroke-width="2"/>',
    { kind: 'box', color: 0xd86a2a, w: 0.06, h: 0.02, d: 0.2 }],
  key_deep: ['Deep key', 'It smells of tomb and old rain.', 0, '<circle cx="8" cy="12" r="3.5" fill="none" stroke="#5a6a8a" stroke-width="2"/><path d="M11 12h9M17 12v4M20 12v3" stroke="#5a6a8a" stroke-width="2"/>',
    { kind: 'box', color: 0x5a6a8a, w: 0.06, h: 0.02, d: 0.2 }],
  sea_chart_a: ['Chart: the hermit’s corner', 'A torn third of a sea chart, in crayon.', 0, '<path d="M5 5h14v14H5Z" fill="#e8dcc0"/><path d="M6 12h6M12 6v10" stroke="#8a5a3a" stroke-width="1" stroke-dasharray="2 2"/>',
    { kind: 'box', color: 0xe8dcc0, w: 0.2, h: 0.02, d: 0.24 }],
  sea_chart_b: ['Chart: the pirate’s corner', 'A torn third, stained with rum and regret.', 0, '<path d="M5 5h14v14H5Z" fill="#e8dcc0"/><path d="M12 12h6M12 6v10" stroke="#8a5a3a" stroke-width="1" stroke-dasharray="2 2"/>',
    { kind: 'box', color: 0xe8dcc0, w: 0.2, h: 0.02, d: 0.24 }],
  sea_chart_c: ['Chart: the collector’s corner', 'A torn third, kept under glass and greed.', 0, '<path d="M5 5h14v14H5Z" fill="#e8dcc0"/><path d="M6 12h12M12 12v6" stroke="#8a5a3a" stroke-width="1" stroke-dasharray="2 2"/>',
    { kind: 'box', color: 0xe8dcc0, w: 0.2, h: 0.02, d: 0.24 }],
  sea_chart: ['Sea chart to Ashkara', 'Three thirds, one dread destination.', 0, '<path d="M4 5h16v14H4Z" fill="#e8dcc0"/><path d="M6 12h12M12 6v10" stroke="#8a5a3a" stroke-width="1.2"/><path d="M15 9l2 2-2 2" stroke="#b03030" stroke-width="1"/>',
    { kind: 'box', color: 0xe8dcc0, w: 0.28, h: 0.02, d: 0.3 }],
  banana: ['Banana', 'Curved, cheerful, faintly smug.', 2, '<path d="M6 16c4 3 10 1 12-4-1 5-7 8-12 4Z" fill="#e0c83a"/>',
    { kind: 'box', color: 0xe0c83a, w: 0.06, h: 0.06, d: 0.2 }],
  kebab: ['Kebab', 'The meat is a mystery. The mystery is delicious.', 14, '<rect x="11" y="3" width="2" height="18" fill="#8a6a42"/><circle cx="12" cy="8" r="3" fill="#b5542a"/><circle cx="12" cy="13" r="3" fill="#5aa84a"/><circle cx="12" cy="18" r="3" fill="#b5542a"/>',
    { kind: 'box', color: 0xb5542a, w: 0.08, h: 0.3, d: 0.08 }],
  combat_lamp: ['Combat lamp', 'Rub it to teach yourself. No genie included.', 0, '<path d="M5 14h10l4-3v3l-4-1a5 3 0 0 1-10 1Z" fill="#c9a232"/><path d="M8 14v3h4v-3" fill="#c9a232"/>',
    { kind: 'box', color: 0xc9a232, w: 0.2, h: 0.1, d: 0.12 }],
};
for (const [id, [name, examine, value, icon, model]] of Object.entries(P11_ITEMS)) {
  ITEMS[id] = { name, examine, value, stackable: false, icon, model };
}
ITEMS.beer.stackable = true;
ITEMS.combat_lamp.stackable = true;
ITEMS.banana.heals = 2;
ITEMS.kebab.heals = 8;

// ---- Endgame ores & bars (coldiron ore/bar already exist above). Gear is
// generated by the METALS loop below; these feed Mining/Smelting/Smithing. ----
const ORE_STOCK = [
  ['mithril_ore', 'Mithril ore', 'Faintly blue, and faintly smug about it.', 55, '#8f9fd8'],
  ['adamantite_ore', 'Adamantite ore', 'Green-black and heavy with promise.', 90, '#5aa87a'],
  ['runite_ore', 'Runite ore', 'It hums with a cold, valuable light.', 400, '#54b8c8'],
];
for (const [id, name, examine, value, css] of ORE_STOCK) {
  ITEMS[id] = {
    name, examine, value, stackable: false,
    icon: `<path d="M6 17l3-8 4-2 5 4-2 7Z" fill="#8a8078"/><circle cx="12" cy="12" r="2.6" fill="${css}"/>`,
    model: { kind: 'sphere', color: parseInt(css.slice(1), 16), r: 0.15 },
  };
}
const BAR_STOCK = [
  ['mithril_bar', 'Mithril bar', 'Light, strong, and slightly aloof.', 120, '#8f9fd8', '#6f7fb8'],
  ['adamant_bar', 'Adamant bar', 'Dense as a well-kept grudge.', 300, '#5aa87a', '#3f7f5a'],
  ['rune_bar', 'Rune bar', 'Endgame, distilled into an ingot.', 800, '#54b8c8', '#3f8f9f'],
];
for (const [id, name, examine, value, css, dark] of BAR_STOCK) {
  ITEMS[id] = {
    name, examine, value, stackable: false,
    icon: `<path d="M5 10h11l3 5H8Z" fill="${css}"/><path d="M5 10l3 5" stroke="${dark}" stroke-width="1"/>`,
    model: { kind: 'box', color: parseInt(css.slice(1), 16), w: 0.34, h: 0.09, d: 0.15 },
  };
}

// ---- Wave 3: bounty quest items ----
ITEMS.stolen_ledger = {
  name: 'Stolen ledger', examine: 'The crossroads toll-takings, lifted by highwaymen.',
  value: 0, stackable: false,
  icon: '<rect x="5" y="4" width="14" height="16" rx="1" fill="#5a4632"/><rect x="7" y="6" width="10" height="12" fill="#e8dcc0"/><path d="M9 9h6M9 12h6M9 15h4" stroke="#8a6a42" stroke-width="1"/>',
  model: { kind: 'box', color: 0x5a4632, w: 0.2, h: 0.26, d: 0.05 },
};
ITEMS.ash_glass = {
  name: 'Ash-glass', examine: 'Blight-fire fuses ash into black glass. It hums, faintly wrong.',
  value: 20, stackable: false,
  icon: '<path d="M9 3l5 2 1 8-4 8-4-8 1-8Z" fill="#3a3040"/><path d="M11 5l2 1 0.4 6-2.4 5-2-5 .4-6Z" fill="#6a5a80"/>',
  model: { kind: 'box', color: 0x3a3040, w: 0.14, h: 0.22, d: 0.14 },
};

ITEMS.dawnbrand = {
  name: 'Dawnbrand', examine: 'A blessed blade. It hates the dark, personally.',
  value: 2000, stackable: false,
  slot: 'weapon', speed: 4, styleSet: 'slasher', reqs: { Attack: 40 },
  atk: [8, 60, 8, 0, 0], str: 56, def: [0, 0, 0, 0, 0], smiteDemons: true,
  icon: '<path d="M11 2h2l0.7 13h-3.4Z" fill="#fbe8a0"/><rect x="7.5" y="15" width="9" height="2" rx="1" fill="#e0b83a"/><rect x="11" y="17" width="2" height="4.5" rx="1" fill="#c9a232"/>',
  model: { kind: 'blade', color: 0xfbe8a0, handle: 0xe0b83a },
};

ITEMS.anti_flame_kiteshield = {
  name: 'Anti-flame kiteshield', examine: 'Dragon-tested, wyrm-approved. Mostly.',
  value: 800, stackable: false,
  slot: 'shield', reqs: { Defence: 30 },
  atk: [0, 0, 0, 0, 0], str: 0, def: [14, 18, 16, 6, 16], dragonfireGuard: true,
  icon: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6Z" fill="#9a5a3a"/><path d="M12 6l3 3-3 3-3-3Z" fill="#e0b83a"/>',
  model: { kind: 'box', color: 0x9a5a3a, w: 0.34, h: 0.1, d: 0.3 },
};

ITEMS.starmetal_platebody = {
  name: 'Starmetal platebody', examine: 'Worn only by the wyrm’s undoing. That’s you now.',
  value: 5000, stackable: false,
  slot: 'body', reqs: {}, equipQuest: 'wyrm_of_ashkara',
  // The Wyrm capstone: kept best-in-slot above rune platebody (which the new
  // METALS tiers below push to ~[68,63,41,-27,63]), and uniquely un-penalised
  // against magic — the reward for the realm's hardest quest stays aspirational.
  atk: [0, 0, 0, 0, 0], str: 0, def: [72, 68, 50, 10, 68],
  icon: '<path d="M7 4h10l2 6-2 10H9L7 10Z" fill="#6a72c8"/><path d="M12 4v16M9 8h6" stroke="#e8e4ff40" stroke-width="1.2"/><circle cx="10" cy="12" r="0.8" fill="#e8e4ff"/><circle cx="14" cy="15" r="0.8" fill="#e8e4ff"/>',
  model: { kind: 'box', color: 0x6a72c8, w: 0.36, h: 0.1, d: 0.3 },
};

// ---------------------------------------------------------------------------
// Generated gear: metals × smithable shapes, plus leather wearables.
// One compact table each; the loop below writes full ITEMS entries.

const METALS = {
  bronze: { label: 'Bronze', hex: 0xb5854b, css: '#b5854b', mult: 1.0, equipReq: 1, valueMult: 1 },
  iron:   { label: 'Iron',   hex: 0x9a9aa2, css: '#9a9aa2', mult: 1.35, equipReq: 1, valueMult: 2.6 },
  steel:  { label: 'Steel',  hex: 0xc8ccd4, css: '#c8ccd4', mult: 2.0, equipReq: 5, valueMult: 9 },
  // ---- Endgame tiers. equipReq climbs 5 -> 15 -> 20 -> 30 -> 40, staying
  // below the quest-locked starmetal capstone. Each MUST ship its ore, bar,
  // smelt recipe, METAL_SMITHING row and world veins (see below) — no orphans.
  coldiron: { label: 'Coldiron', hex: 0x9ad0e0, css: '#9ad0e0', mult: 2.3, equipReq: 15, valueMult: 16 },
  mithril:  { label: 'Mithril',  hex: 0x8f9fd8, css: '#8f9fd8', mult: 2.6, equipReq: 20, valueMult: 25 },
  adamant:  { label: 'Adamant',  hex: 0x5aa87a, css: '#5aa87a', mult: 3.4, equipReq: 30, valueMult: 64 },
  rune:     { label: 'Rune',     hex: 0x54b8c8, css: '#54b8c8', mult: 4.5, equipReq: 40, valueMult: 160 },
};

const WEAPON_SHAPES = {
  dagger:     { label: 'dagger', styleSet: 'stabber', atk: [4, 2, 1, 0, 0], str: 1, speed: 4, value: 10,
    examine: 'A pointy beginning.', icon: (c) => `<path d="M12 2.5 14 12l-2 2.2L10 12Z" fill="${c}"/><rect x="8.4" y="13.6" width="7.2" height="1.8" rx="0.9" fill="#6e4f33"/><rect x="11.1" y="15.2" width="1.8" height="5.2" rx="0.9" fill="#6e4f33"/>` },
  sword:      { label: 'sword', styleSet: 'stabber', atk: [5, 3, 1, 0, 0], str: 4, speed: 4, value: 26,
    examine: 'Short, sharp, and to the point.', icon: (c) => `<path d="M11 2h2l0.6 11h-3.2Z" fill="${c}"/><rect x="8" y="13.6" width="8" height="1.8" rx="0.9" fill="#6e4f33"/><rect x="11" y="15.4" width="2" height="5.4" rx="1" fill="#6e4f33"/>` },
  scimitar:   { label: 'scimitar', styleSet: 'slasher', atk: [1, 7, 1, 0, 0], str: 6, speed: 4, value: 32,
    examine: 'Curved for enthusiasm.', icon: (c) => `<path d="M7 3c6 2 9 7 8 12l-3 1c2-5 0-9-5-13Z" fill="${c}"/><rect x="10" y="15.4" width="5" height="1.8" rx="0.9" fill="#6e4f33"/><rect x="11.6" y="17" width="1.8" height="4" rx="0.9" fill="#6e4f33"/>` },
  longsword:  { label: 'longsword', styleSet: 'slasher', atk: [2, 8, 2, 0, 0], str: 8, speed: 5, value: 40,
    examine: 'Longer than a sword. Naming is hard.', icon: (c) => `<path d="M11.2 1h1.6l0.5 13h-2.6Z" fill="${c}"/><rect x="7.6" y="14.4" width="8.8" height="1.8" rx="0.9" fill="#6e4f33"/><rect x="11" y="16.2" width="2" height="5.4" rx="1" fill="#6e4f33"/>` },
  warhammer:  { label: 'warhammer', styleSet: 'crusher', atk: [0, 0, 9, 0, 0], str: 10, speed: 6, value: 45,
    examine: 'Diplomacy, blunt edition.', icon: (c) => `<rect x="6" y="3.5" width="12" height="7" rx="1" fill="${c}"/><rect x="10.8" y="10.5" width="2.4" height="10.5" rx="1" fill="#6e4f33"/>` },
  battleaxe:  { label: 'battleaxe', styleSet: 'slasher', atk: [0, 8, 6, 0, 0], str: 12, speed: 5, value: 52,
    examine: 'For trees that fight back.', icon: (c) => `<path d="M12 4 5 6c0 4 2 6 6 6.5V6Z" fill="${c}"/><path d="M12 4l7 2c0 4-2 6-6 6.5V6Z" fill="${c}"/><rect x="10.8" y="6" width="2.4" height="15" rx="1" fill="#6e4f33"/>` },
  two_handed: { label: '2h sword', styleSet: 'slasher', atk: [3, 10, 8, 0, 0], str: 14, speed: 6, value: 80, twoHanded: true,
    examine: 'Requires both hands and one big opinion.', icon: (c) => `<path d="M10.9 1h2.2l0.6 14h-3.4Z" fill="${c}"/><rect x="6.6" y="15.4" width="10.8" height="2" rx="1" fill="#6e4f33"/><rect x="10.9" y="17.4" width="2.2" height="5" rx="1" fill="#6e4f33"/>` },
};

const ARMOR_SHAPES = {
  full_helm:  { label: 'full helm', slot: 'head', def: [4, 5, 3, -1, 4], value: 44,
    examine: 'Keeps the rain and the arrows out.', icon: (c) => `<path d="M6 13c0-5 2.5-8 6-8s6 3 6 8v4h-3l-1-3h-4l-1 3H6Z" fill="${c}"/><rect x="10.7" y="9" width="2.6" height="5" fill="#3a3632"/>` },
  chainbody:  { label: 'chainbody', slot: 'body', def: [8, 12, 14, -3, 10], value: 60,
    examine: 'A thousand tiny rings, one big job.', icon: (c) => `<path d="M7 5h10l2 5-2 10H9L7 10Z" fill="${c}"/><circle cx="10" cy="9" r="0.8" fill="#00000033"/><circle cx="14" cy="9" r="0.8" fill="#00000033"/><circle cx="12" cy="12" r="0.8" fill="#00000033"/><circle cx="10" cy="15" r="0.8" fill="#00000033"/><circle cx="14" cy="15" r="0.8" fill="#00000033"/>` },
  platebody:  { label: 'platebody', slot: 'body', def: [15, 14, 9, -6, 14], value: 160,
    examine: 'A wall you can wear.', icon: (c) => `<path d="M7 4h10l2 6-2 10H9L7 10Z" fill="${c}"/><path d="M12 4v16M9 8h6" stroke="#00000040" stroke-width="1.2"/>` },
  platelegs:  { label: 'platelegs', slot: 'legs', def: [8, 7, 6, -4, 7], value: 80,
    examine: 'Dignity for the lower half.', icon: (c) => `<path d="M8 4h8v6l-1.4 10h-2.2L12 12l-0.4 8H9.4L8 10Z" fill="${c}"/>` },
  kiteshield: { label: 'kiteshield', slot: 'shield', def: [7, 9, 8, -2, 8], value: 68,
    examine: 'Shaped like a kite. Flies like a brick.', icon: (c) => `<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6Z" fill="${c}"/><path d="M12 3v18M5 9h14" stroke="#00000040" stroke-width="1.1"/>` },
  sq_shield:  { label: 'sq shield', slot: 'shield', def: [5, 6, 5, -1, 5], value: 48,
    examine: 'Square deal, square shield.', icon: (c) => `<rect x="6" y="4" width="12" height="14" rx="2" fill="${c}"/><path d="M12 4v14M6 11h12" stroke="#00000040" stroke-width="1.1"/>` },
  // Wave 9: metal gloves/boots/med-helm across every tier (were leather-only).
  med_helm:   { label: 'med helm', slot: 'head', def: [3, 4, 3, -1, 3], value: 30,
    examine: 'Half a full helm, all the peripheral vision.', icon: (c) => `<path d="M6 15c0-5 2.5-8 6-8s6 3 6 8v2H6Z" fill="${c}"/><rect x="10.7" y="10" width="2.6" height="4" fill="#3a3632"/>` },
  gauntlets:  { label: 'gauntlets', slot: 'gloves', def: [2, 2, 2, 0, 2], value: 26,
    examine: 'Knuckles, reinforced for emphasis.', icon: (c) => `<path d="M8 5h6l1 6-1 8H8l-1-8Z" fill="${c}"/><path d="M8.5 8h5" stroke="#00000033" stroke-width="1"/>` },
  plateboots: { label: 'plateboots', slot: 'boots', def: [3, 3, 2, -1, 3], value: 34,
    examine: 'Kick with authority.', icon: (c) => `<path d="M9 5h3v9l5 2v3H8V5Z" fill="${c}"/><path d="M8 17h9" stroke="#00000033" stroke-width="1"/>` },
};

// Anvil parameters per smithable metal (higher metals arrive in later phases).
export const METAL_SMITHING = {
  bronze: { bar: 'bronze_bar', reqBase: 0, barXp: 12.5 },
  iron:   { bar: 'iron_bar', reqBase: 14, barXp: 25 },
  steel:  { bar: 'steel_bar', reqBase: 29, barXp: 37.5 },
  // reqBase + shape.off = smith level. platebody has the largest off (18),
  // so rune's 81 lands rune platebody at exactly 99 (the level cap).
  coldiron: { bar: 'coldiron_bar', reqBase: 44, barXp: 50 },
  mithril:  { bar: 'mithril_bar', reqBase: 50, barXp: 50 },
  adamant:  { bar: 'adamant_bar', reqBase: 70, barXp: 75 },
  rune:     { bar: 'rune_bar', reqBase: 81, barXp: 100 },
};

const scaleArr = (arr, m) => arr.map((v) => Math.round(v * m));

// Bars a shape consumes at the anvil (mirrors crafting.js SMITHABLES.bars).
// Used to give generated gear a low vendorValue keyed to its bar cost, so
// smith-and-sell can't out-earn the whole economy (see shop.js sellPrice).
const BARS_PER_SHAPE = {
  dagger: 1, sword: 1, scimitar: 2, longsword: 2, warhammer: 3, battleaxe: 3, two_handed: 3,
  full_helm: 2, sq_shield: 2, chainbody: 3, kiteshield: 3, platelegs: 3, platebody: 5,
  med_helm: 1, gauntlets: 2, plateboots: 2,
};

for (const [mid, metal] of Object.entries(METALS)) {
  const barVal = ITEMS[METAL_SMITHING[mid].bar]?.value ?? 0;
  const vendor = (shape) => Math.round((BARS_PER_SHAPE[shape] ?? 1) * barVal * 1.5);
  for (const [wid, w] of Object.entries(WEAPON_SHAPES)) {
    ITEMS[`${mid}_${wid}`] = {
      name: `${metal.label} ${w.label}`,
      examine: w.examine,
      value: Math.round(w.value * metal.valueMult), vendorValue: vendor(wid), stackable: false,
      slot: 'weapon', twoHanded: !!w.twoHanded, speed: w.speed, styleSet: w.styleSet,
      reqs: { Attack: metal.equipReq },
      atk: scaleArr(w.atk, metal.mult), str: Math.round(w.str * metal.mult), def: [0, 0, 0, 0, 0],
      icon: w.icon(metal.css),
      model: { kind: 'blade', color: metal.hex, handle: 0x6e4f33 },
    };
  }
  for (const [aid, a] of Object.entries(ARMOR_SHAPES)) {
    ITEMS[`${mid}_${aid}`] = {
      name: `${metal.label} ${a.label}`,
      examine: a.examine,
      value: Math.round(a.value * metal.valueMult), vendorValue: vendor(aid), stackable: false,
      slot: a.slot,
      reqs: { Defence: metal.equipReq },
      atk: [0, 0, 0, 0, 0], str: 0, def: scaleArr(a.def, metal.mult),
      icon: a.icon(metal.css),
      model: { kind: 'box', color: metal.hex, w: 0.34, h: 0.1, d: 0.3 },
    };
  }
}

const LEATHER_WEAR = {
  leather_gloves:    { label: 'Leather gloves', slot: 'gloves', def: [1, 1, 1, 0, 1], value: 6,
    examine: 'Cow-warmed hands.' },
  leather_boots:     { label: 'Leather boots', slot: 'boots', def: [1, 1, 1, 0, 1], value: 8,
    examine: 'One careful owner (the cow).' },
  leather_cowl:      { label: 'Leather cowl', slot: 'head', def: [2, 3, 2, 0, 2], value: 10,
    examine: 'Mysterious, in a farmhand way.' },
  leather_vambraces: { label: 'Leather vambraces', slot: 'gloves', def: [2, 2, 1, 0, 2], value: 12,
    examine: 'Forearms, fortified.' },
  leather_body:      { label: 'Leather body', slot: 'body', def: [4, 5, 4, 0, 5], value: 18,
    examine: 'Soft armor for hard times.' },
  leather_chaps:     { label: 'Leather chaps', slot: 'legs', def: [3, 3, 2, 0, 3], value: 14,
    examine: 'Sturdy legwear with a farming past.' },
};
for (const [lid, l] of Object.entries(LEATHER_WEAR)) {
  ITEMS[lid] = {
    name: l.label, examine: l.examine, value: l.value, stackable: false,
    slot: l.slot, reqs: { Defence: 1 },
    atk: [0, 0, 0, 0, 0], str: 0, def: l.def,
    icon: `<path d="M7 5h10l1.5 5-1.5 9H8.5L7 10Z" fill="#a8794e"/><path d="M9 8h6" stroke="#7a5636" stroke-width="1.2"/>`,
    model: { kind: 'box', color: 0xa8794e, w: 0.3, h: 0.08, d: 0.26 },
  };
}

// ---- Wave 9: level-99 skill capes (cape slot). One per skill; granted by
// player.addXp on hitting 99 and gated to wearers who actually earned it.
// Keys must match SKILL_NAMES (player.js), lower-cased + "_cape".
const CAPE_HUE = {
  Attack: 0xb03030, Strength: 0xc8862a, Defence: 0x3a72c8, Hitpoints: 0xc83a5a,
  Ranged: 0x4a8f3a, Magic: 0x6a4a8a, Prayer: 0xe8e0c0, Cooking: 0x8a5a3a,
  Fishing: 0x2a7a9a, Mining: 0x6a6a72, Smithing: 0x8a8a92, Woodcutting: 0x5a7a3a,
  Firemaking: 0xe07a2a, Crafting: 0xb5854b, Glyphcraft: 0x9aa8c2,
};
for (const [skill, hex] of Object.entries(CAPE_HUE)) {
  const css = '#' + hex.toString(16).padStart(6, '0');
  ITEMS[skill.toLowerCase() + '_cape'] = {
    name: skill + ' cape', examine: 'Proof of mastery. Worn with unbearable poise.',
    value: 990, stackable: false,
    slot: 'cape', reqs: { [skill]: 99 },
    atk: [0, 0, 0, 0, 0], str: 0, def: [4, 4, 4, 4, 4],
    icon: `<path d="M8 4h8l3 15-7 2-7-2Z" fill="${css}"/><path d="M8 4c1.5 2 6.5 2 8 0" stroke="#ffffff55" stroke-width="1.4" fill="none"/><path d="M12 8v9" stroke="#ffffff30" stroke-width="1"/><circle cx="12" cy="12" r="2" fill="#ffffff66"/>`,
    model: { kind: 'box', color: hex, w: 0.34, h: 0.05, d: 0.3 },
  };
}

// ---- Herblore-lite: potions (Drink to boost a skill for a while, or restore
// prayer). Handled in player.drink(); boosts feed player.effLevel(). ----
const POTIONS = [
  ['attack_potion', 'Attack potion', 'Attack', 3, 200, '#c23a3a', 'A red brew that sharpens your swing.'],
  ['strength_potion', 'Strength potion', 'Strength', 3, 200, '#d8862a', 'An amber brew that lends your arm weight.'],
  ['defence_potion', 'Defence potion', 'Defence', 3, 200, '#3a72c8', 'A blue brew that thickens your guard.'],
  ['ranged_potion', 'Ranged potion', 'Ranged', 4, 200, '#4a9a3a', 'A green brew that steadies your aim.'],
  ['magic_potion', 'Magic potion', 'Magic', 4, 200, '#7a4a9a', 'A violet brew that quickens the mind.'],
];
for (const [id, name, skill, amount, ticks, css, examine] of POTIONS) {
  ITEMS[id] = {
    name, examine, value: 45, stackable: false,
    boost: { skill, amount, ticks },
    icon: `<path d="M9.5 3h5v3l1.8 4v8a1 1 0 0 1-1 1H8.7a1 1 0 0 1-1-1v-8L9.5 6Z" fill="${css}"/><rect x="9.2" y="2" width="5.6" height="2" rx="1" fill="#8a7a5a"/><ellipse cx="12" cy="15" rx="2.6" ry="2" fill="#ffffff33"/>`,
    model: { kind: 'cylinder', color: parseInt(css.slice(1), 16), rTop: 0.06, rBot: 0.08, h: 0.18 },
  };
}
ITEMS.prayer_potion = {
  name: 'Prayer potion', examine: 'A gold brew that rekindles faith. Tastes faintly of incense.',
  value: 65, stackable: false, restore: 'prayer', restoreAmount: 31,
  icon: '<path d="M9.5 3h5v3l1.8 4v8a1 1 0 0 1-1 1H8.7a1 1 0 0 1-1-1v-8L9.5 6Z" fill="#e0b83a"/><rect x="9.2" y="2" width="5.6" height="2" rx="1" fill="#8a7a5a"/><path d="M12 11v6M9.5 14h5" stroke="#ffffff55" stroke-width="1"/>',
  model: { kind: 'cylinder', color: 0xe0b83a, rTop: 0.06, rBot: 0.08, h: 0.18 },
};

// ---- Baking: the wheat -> flour -> bread chain finally bakes something ----
ITEMS.bread = {
  name: 'Bread', examine: 'Baked from your own-milled flour. Humble and hearty.', value: 12, stackable: false, heals: 5,
  icon: '<path d="M4 14c0-5 4-7 8-7s8 2 8 7v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" fill="#c9a35a"/><path d="M8 9l1 3M12 8l0 4M16 9l-1 3" stroke="#8a6a3a" stroke-width="0.9"/>',
  model: { kind: 'box', color: 0xc9a35a, w: 0.26, h: 0.14, d: 0.18 },
};
ITEMS.burnt_bread = {
  name: 'Burnt bread', examine: 'Charcoal, formerly bread. A learning experience.', value: 1, stackable: false,
  icon: '<path d="M4 14c0-5 4-7 8-7s8 2 8 7v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" fill="#3a3230"/>',
  model: { kind: 'box', color: 0x3a3230, w: 0.26, h: 0.14, d: 0.18 },
};
// Cakes & pies: multi-ingredient combines (see BAKING in crafting.js), then cooked.
ITEMS.uncooked_cake = {
  name: 'Uncooked cake', examine: 'Flour, egg, and milk, optimistic about their future.', value: 8, stackable: false,
  icon: '<ellipse cx="12" cy="16" rx="8" ry="3" fill="#e8dcc0"/><path d="M4 16v-3a8 3 0 0 0 16 0v3" fill="#f0e8d4"/>',
  model: { kind: 'box', color: 0xf0e8d4, w: 0.24, h: 0.14, d: 0.24 },
};
ITEMS.cake = {
  name: 'Cake', examine: 'Golden, risen, and briefly yours.', value: 30, stackable: false, heals: 12,
  icon: '<path d="M4 18v-6a8 3 0 0 1 16 0v6Z" fill="#e0b060"/><path d="M4 12a8 3 0 0 0 16 0" fill="#f2e0c0"/><path d="M12 6l1.5 3h-3Z" fill="#c23a5a"/>',
  model: { kind: 'box', color: 0xe0b060, w: 0.24, h: 0.16, d: 0.24 },
};
ITEMS.burnt_cake = {
  name: 'Burnt cake', examine: 'It did not rise so much as flee.', value: 1, stackable: false,
  icon: '<path d="M4 18v-6a8 3 0 0 1 16 0v6Z" fill="#3a3230"/>',
  model: { kind: 'box', color: 0x3a3230, w: 0.24, h: 0.16, d: 0.24 },
};
ITEMS.uncooked_pie = {
  name: 'Uncooked berry pie', examine: 'Pastry and redberries, awaiting an oven.', value: 6, stackable: false,
  icon: '<ellipse cx="12" cy="15" rx="8" ry="4" fill="#e8dcc0"/><path d="M8 13l2 2M12 12v3M16 13l-2 2" stroke="#c23a3a" stroke-width="1"/>',
  model: { kind: 'box', color: 0xe8dcc0, w: 0.24, h: 0.1, d: 0.24 },
};
ITEMS.redberry_pie = {
  name: 'Redberry pie', examine: 'Sweet, red, and staining. Worth it.', value: 24, stackable: false, heals: 10,
  icon: '<ellipse cx="12" cy="15" rx="8" ry="4" fill="#c9a35a"/><path d="M6 14a6 2.5 0 0 1 12 0" fill="#b02f2f"/>',
  model: { kind: 'box', color: 0xc9a35a, w: 0.24, h: 0.1, d: 0.24 },
};
ITEMS.burnt_pie = {
  name: 'Burnt pie', examine: 'The berries gave their lives for nothing.', value: 1, stackable: false,
  icon: '<ellipse cx="12" cy="15" rx="8" ry="4" fill="#3a3230"/>',
  model: { kind: 'box', color: 0x3a3230, w: 0.24, h: 0.1, d: 0.24 },
};

// ---- Herblore: clean herbs + unfinished potions (generated from HERBLORE),
// plus the water vials and secondaries the mixes consume. ----
const HERB_HEX = {
  guam: 0x5a7a3a, tarromin: 0x7a8a3a, harralander: 0x3a8a5a,
  ranarr: 0x4aa87a, marrentill: 0x3a6a8a, irit: 0x6a4a8a,
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
for (const h of Object.values(HERBLORE)) {
  const hex = HERB_HEX[h.herb] ?? 0x5a7a3a;
  const css = '#' + hex.toString(16).padStart(6, '0');
  ITEMS[h.herb] = {
    name: cap(h.herb) + ' leaf', examine: 'A cleaned herb, pungent and full of promise.',
    value: 12, stackable: false,
    icon: `<path d="M12 21c-1-6-5-9-8-10 5-1 8 1 8 5 0-4 3-6 8-5-3 1-7 4-8 10Z" fill="${css}"/>`,
    model: { kind: 'box', color: hex, w: 0.04, h: 0.02, d: 0.24 },
  };
  ITEMS[`${h.herb}_unf`] = {
    name: cap(h.herb) + ' potion (unf)', examine: 'A herb steeping in water. It wants one thing more.',
    value: 14, stackable: false,
    icon: `<path d="M9.5 5h5v3l1.8 4v7a1 1 0 0 1-1 1H8.7a1 1 0 0 1-1-1v-7L9.5 8Z" fill="${css}" opacity="0.75"/><rect x="9.2" y="4" width="5.6" height="2" rx="1" fill="#8a7a5a"/>`,
    model: { kind: 'cylinder', color: hex, rTop: 0.06, rBot: 0.08, h: 0.18 },
  };
}
ITEMS.vial_of_water = {
  name: 'Vial of water', examine: 'Clear water in a small glass vial. The start of everything.',
  value: 2, stackable: false,
  icon: '<path d="M9.5 5h5v3l1.8 4v7a1 1 0 0 1-1 1H8.7a1 1 0 0 1-1-1v-7L9.5 8Z" fill="#a8d0e0"/><rect x="9.2" y="4" width="5.6" height="2" rx="1" fill="#8a7a5a"/>',
  model: { kind: 'cylinder', color: 0xa8d0e0, rTop: 0.06, rBot: 0.08, h: 0.18 },
};
const SECONDARIES = [
  ['eye_of_newt', 'Eye of newt', 'The newt is fine about it. Probably.', 3, 0xc8a83a],
  ['limpwurt_root', 'Limpwurt root', 'A gnarled root humming with borrowed vigour.', 8, 0xb05a4a],
  ['snape_grass', 'Snape grass', 'Reedy, riverside, and faintly holy.', 10, 0x6a9a4a],
  ['wolf_bone', 'Wolf bone', 'Ground fine, it steadies a shaking draw.', 6, 0xe0dcc8],
];
for (const [id, name, examine, value, hex] of SECONDARIES) {
  const css = '#' + hex.toString(16).padStart(6, '0');
  ITEMS[id] = {
    name, examine, value, stackable: false,
    icon: `<circle cx="12" cy="13" r="5" fill="${css}"/><circle cx="10.5" cy="11.5" r="1.4" fill="#ffffff55"/>`,
    model: { kind: 'sphere', color: hex, r: 0.11 },
  };
}
