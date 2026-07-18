// OLDHOLM — skills.js
// The xp curve (spec §4.1, exact) and level lookup. Skill state lives on the
// player; this module is pure math so combat, gathering, and UI all agree.

const MAX_LEVEL = 99;

/** Total xp required to BE level l. Level 2 = 83 xp; level 99 = 13,034,431. */
export function xpForLevel(l) {
  let p = 0;
  for (let i = 1; i < l; i++) p += Math.floor(i + 300 * Math.pow(2, i / 7));
  return Math.floor(p / 4);
}

// precomputed thresholds: XP_TABLE[l] = xp to be level l (index 1..99)
export const XP_TABLE = (() => {
  const t = [0, 0];
  for (let l = 2; l <= MAX_LEVEL; l++) t[l] = xpForLevel(l);
  return t;
})();

export function levelForXp(xp) {
  let l = 1;
  while (l < MAX_LEVEL && XP_TABLE[l + 1] <= xp) l++;
  return l;
}

/** Combat xp rates (spec §4.1): per point of damage dealt. */
export const XP_PER_DAMAGE_STYLE = 4;
export const XP_PER_DAMAGE_HP = 1.33;
