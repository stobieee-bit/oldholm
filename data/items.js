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
    icon: '<ellipse cx="12" cy="16.5" rx="7" ry="3" fill="#c9a232"/><ellipse cx="12" cy="12.5" rx="7" ry="3" fill="#d8b13a"/><ellipse cx="12" cy="8.5" rx="7" ry="3" fill="#eccd62"/>',
    model: { kind: 'cylinder', color: 0xd8b13a, rTop: 0.13, rBot: 0.13, h: 0.06 },
  },
  logs: {
    name: 'Logs',
    examine: 'A log. Wood, mostly.',
    value: 4, stackable: false,
    icon: '<rect x="3.5" y="9" width="15" height="6" rx="3" fill="#7a5a38"/><ellipse cx="18.5" cy="12" rx="2.3" ry="3" fill="#c9a877"/><ellipse cx="18.5" cy="12" rx="1.1" ry="1.5" fill="#9a7a4e"/>',
    model: { kind: 'log', color: 0x7a5a38, r: 0.12, len: 0.8 },
  },
  bronze_dagger: {
    name: 'Bronze dagger',
    examine: 'A pointy beginning.',
    value: 10, stackable: false,
    icon: '<path d="M12 2.5 14 12l-2 2.2L10 12Z" fill="#b5854b"/><rect x="8.4" y="13.6" width="7.2" height="1.8" rx="0.9" fill="#6e4f33"/><rect x="11.1" y="15.2" width="1.8" height="5.2" rx="0.9" fill="#6e4f33"/>',
    model: { kind: 'blade', color: 0xb5854b, handle: 0x6e4f33 },
  },
  cabbage: {
    name: 'Cabbage',
    examine: 'Nutritious-ish. A vegetable of the people.',
    value: 1, stackable: false, heals: 1,
    icon: '<circle cx="12" cy="13" r="7.2" fill="#7da75a"/><path d="M12 5.8a7.2 7.2 0 0 1 6.2 3.6M12 5.8a7.2 7.2 0 0 0-6.2 3.6M12 5.8v7" stroke="#5d8742" stroke-width="1.5" fill="none"/>',
    model: { kind: 'sphere', color: 0x7da75a, r: 0.16 },
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
};
