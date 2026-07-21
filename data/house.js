// OLDHOLM — the Hearthstead (Construction). A player cottage on the east road
// with five build-hotspots. Each build consumes wood + coins, pays
// Construction xp, and unlocks a real function. Renovating a built piece is
// the repeatable grind (a share of the build xp for a couple of its logs).

export const HOUSE_PLOT = { x0: 146, z0: 91, x1: 152, z1: 97, doorSide: 'n' };

export const HOTSPOTS = {
  hearth: {
    name: 'Stone hearth', req: 1, wood: ['logs', 8], coins: 200, xp: 150,
    unlocks: 'Cook at your own fire',
    examine: 'A hearth of river stone. It never lets the fire die.',
    spot: 'A cold ring of stones, waiting to be a hearth.',
  },
  bench: {
    name: 'Oak workbench', req: 15, wood: ['oak_logs', 10], coins: 600, xp: 420,
    unlocks: 'Smith at home (an anvil in all but name)',
    examine: 'Scarred oak and a good vice. The anvil bolts straight on.',
    spot: 'Floor markings for a workbench that isn’t there yet.',
  },
  chest: {
    name: 'Willow strongbox', req: 30, wood: ['willow_logs', 10], coins: 1500, xp: 950,
    unlocks: 'Bank of Aldera service, in your parlour',
    examine: 'Banded willow, bank-blessed. The vault reaches everywhere.',
    spot: 'A dust rectangle the size of a strongbox.',
  },
  trophy: {
    name: 'Trophy wall', req: 45, wood: ['willow_logs', 14], coins: 3000, xp: 1700,
    unlocks: 'Your legend, mounted',
    examine: 'Mounts, plaques, and one suspiciously large nail.',
    spot: 'Bare wall, aching for bragging rights.',
  },
  nexus: {
    name: 'Yew portal nexus', req: 60, wood: ['yew_logs', 12], coins: 8000, xp: 3200,
    unlocks: 'Free teleports to Holmbridge, Corvath and Whitehold',
    examine: 'A ring of yew humming with borrowed sky.',
    spot: 'A scorched circle where something impossible could stand.',
  },
};

export const RENOVATE_DIVISOR = 6; // renovate xp = build xp / 6, for 2 logs

export const NEXUS_DESTS = [
  { label: 'Holmbridge', x: 67.5, z: 88.5 },
  { label: 'Corvath', x: 296.5, z: 130.5 },
  { label: 'Whitehold', x: 288.5, z: 46.5 },
];
