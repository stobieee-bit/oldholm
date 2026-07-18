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
};
