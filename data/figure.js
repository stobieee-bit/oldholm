// OLDHOLM — a shared rounded low-poly humanoid chassis.
// Returns a `parts` array for npc.js's geometry baker: tapered torso, ball head,
// cylinder limbs with hands + boots. Callers spread it and append distinctive
// bits (helmets, weapons, ears) so every human/humanoid reads as the same
// species without hand-authoring a box skeleton each time.
//
// Options (all optional): skin, shirt, sleeve, pants, hair, boot (hex colours);
// build (girth ×), headScale (head size ×), bald (skip hair).
export function figure(o = {}) {
  const skin = o.skin ?? 0xd8b090, shirt = o.shirt ?? 0x6a7a4a,
    sleeve = o.sleeve ?? shirt, pants = o.pants ?? 0x5a4a33,
    hair = o.hair ?? 0x6e4f33, boot = o.boot ?? 0x3a2f26;
  const b = o.build ?? 1, hs = o.headScale ?? 1;
  const parts = [
    // legs + boots
    { kind: 'cyl', rt: 0.085 * b, rb: 0.075 * b, h: 0.6, at: [-0.11 * b, 0.32, 0], color: pants },
    { kind: 'cyl', rt: 0.085 * b, rb: 0.075 * b, h: 0.6, at: [0.11 * b, 0.32, 0], color: pants },
    { kind: 'box', size: [0.15 * b, 0.1, 0.24], at: [-0.11 * b, 0.05, 0.03], color: boot },
    { kind: 'box', size: [0.15 * b, 0.1, 0.24], at: [0.11 * b, 0.05, 0.03], color: boot },
    // tapered torso (shoulders wider than waist)
    { kind: 'cyl', rt: 0.21 * b, rb: 0.15 * b, h: 0.54, seg: 10, at: [0, 0.88, 0], color: shirt },
    // neck + ball head
    { kind: 'cyl', rt: 0.06, rb: 0.07, h: 0.08, at: [0, 1.185, 0], color: skin },
    { kind: 'sphere', r: 0.155 * hs, at: [0, 1.33, 0], color: skin },
    // arms (sleeves) angled out, with hands
    { kind: 'cyl', rt: 0.062, rb: 0.055, h: 0.5, rotZ: 0.14, at: [-0.245 * b, 0.9, 0], color: sleeve },
    { kind: 'cyl', rt: 0.062, rb: 0.055, h: 0.5, rotZ: -0.14, at: [0.245 * b, 0.9, 0], color: sleeve },
    { kind: 'sphere', r: 0.058, at: [-0.285 * b, 0.64, 0], color: skin },
    { kind: 'sphere', r: 0.058, at: [0.285 * b, 0.64, 0], color: skin },
  ];
  if (!o.bald) parts.push({ kind: 'sphere', r: 0.16 * hs, scale: [1.02, 0.62, 1.04], at: [0, 1.4, -0.02], color: hair });
  // overall size: scale every dimension + position (short goblins, tall giants)
  const S = o.scale ?? 1;
  if (S !== 1) for (const p of parts) {
    p.at = p.at.map((v) => v * S);
    if (p.size) p.size = p.size.map((v) => v * S);
    for (const k of ['r', 'rt', 'rb', 'h']) if (p[k] != null) p[k] *= S;
  }
  return parts;
}
