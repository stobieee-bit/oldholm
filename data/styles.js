// OLDHOLM — attack style sets (spec §5). Every weapon shape maps to one set.
// kind: accurate -> trains Attack, aggressive -> Strength, defensive -> Defence,
//       controlled -> splits evenly (1.33 xp/damage to each, spec §4.1).
// type: which attack bonus column the swing uses (stab/slash/crush).

export const ATTACK_TYPES = ['stab', 'slash', 'crush', 'magic', 'ranged'];
export const typeIndex = (t) => ATTACK_TYPES.indexOf(t);

export const STYLE_SETS = {
  unarmed: [
    { name: 'Punch', kind: 'accurate', type: 'crush' },
    { name: 'Kick', kind: 'aggressive', type: 'crush' },
    { name: 'Block', kind: 'defensive', type: 'crush' },
  ],
  stabber: [ // daggers, swords
    { name: 'Stab', kind: 'accurate', type: 'stab' },
    { name: 'Lunge', kind: 'aggressive', type: 'stab' },
    { name: 'Slash', kind: 'aggressive', type: 'slash' },
    { name: 'Block', kind: 'defensive', type: 'stab' },
  ],
  slasher: [ // scimitars, longswords, battleaxes, 2h swords
    { name: 'Chop', kind: 'accurate', type: 'slash' },
    { name: 'Slash', kind: 'aggressive', type: 'slash' },
    { name: 'Lunge', kind: 'controlled', type: 'stab' },
    { name: 'Block', kind: 'defensive', type: 'slash' },
  ],
  crusher: [ // warhammers, staves (bashing; autocast bypasses these)
    { name: 'Pound', kind: 'accurate', type: 'crush' },
    { name: 'Pummel', kind: 'aggressive', type: 'crush' },
    { name: 'Block', kind: 'defensive', type: 'crush' },
  ],
  bow: [ // all styles train Ranged; Rapid shoots a tick faster, Longrange reaches +2
    { name: 'Accurate', kind: 'ranged', type: 'ranged' },
    { name: 'Rapid', kind: 'ranged', type: 'ranged', speedDelta: -1 },
    { name: 'Longrange', kind: 'ranged', type: 'ranged', rangeDelta: 2 },
  ],
};

/** Which skills a style kind trains, with xp per point of damage. */
export function styleXp(kind, damage) {
  if (kind === 'controlled') {
    return [['Attack', 1.33 * damage], ['Strength', 1.33 * damage], ['Defence', 1.33 * damage]];
  }
  const skill = {
    accurate: 'Attack', aggressive: 'Strength', defensive: 'Defence', ranged: 'Ranged',
  }[kind];
  return [[skill, 4 * damage]];
}
