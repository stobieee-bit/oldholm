// OLDHOLM — Farming. Plant a seed in a soil patch, wait for it to grow (game
// ticks), harvest a small yield. Closes the Herblore supply loop: every herb
// can be grown as well as looted. src/farming.js runs the patches.

// seed item id -> crop. growTicks at 0.6s/tick: ~90s for guam up to ~4min.
export const CROPS = {
  wheat_seed:      { req: 1,  plantXp: 8,  harvestXp: 18,  yields: 'wheat',       count: [2, 4], growTicks: 120 },
  guam_seed:       { req: 3,  plantXp: 10, harvestXp: 25,  yields: 'guam',        count: [2, 3], growTicks: 150 },
  tarromin_seed:   { req: 12, plantXp: 14, harvestXp: 38,  yields: 'tarromin',    count: [2, 3], growTicks: 180 },
  harralander_seed:{ req: 24, plantXp: 18, harvestXp: 54,  yields: 'harralander', count: [2, 3], growTicks: 220 },
  ranarr_seed:     { req: 36, plantXp: 24, harvestXp: 78,  yields: 'ranarr',      count: [2, 3], growTicks: 260 },
  marrentill_seed: { req: 45, plantXp: 30, harvestXp: 96,  yields: 'marrentill',  count: [2, 3], growTicks: 300 },
  irit_seed:       { req: 55, plantXp: 38, harvestXp: 120, yields: 'irit',        count: [2, 3], growTicks: 340 },
};

// A patch is grown at stage 2. Stage thresholds as fractions of growTicks.
export const STAGES = [0, 0.5, 1];
