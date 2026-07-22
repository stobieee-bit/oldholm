// OLDHOLM — a shared rounded low-poly humanoid chassis (v2).
// Returns a `parts` array for npc.js's geometry baker. Callers spread it and
// append distinctive bits (helmets, weapons, ears), so the anatomy landmarks
// are LOAD-BEARING and must not move: head centre (0, 1.33) r 0.155·hs,
// shoulders ~1.10, torso top ~1.15, hands ~0.64, boots on +z (the front).
//
// v2 over v1: flattened torso (people aren't tubes), hips + belt closing the
// leg gap, sloped shoulder caps, a neck that meets an oval head, brow/eyes/
// nose so faces read at a glance, two-segment arms with a forward drift,
// boot shafts, and a back-of-head hair mass so front and back differ.
//
// Options (all optional): skin, shirt, sleeve, pants, hair, boot (hex colours);
// build (girth ×), headScale (head size ×), bald (skip hair).
export function figure(o = {}) {
  const skin = o.skin ?? 0xd8b090, shirt = o.shirt ?? 0x6a7a4a,
    sleeve = o.sleeve ?? shirt, pants = o.pants ?? 0x5a4a33,
    hair = o.hair ?? 0x6e4f33, boot = o.boot ?? 0x3a3632;
  const b = o.build ?? 1, hs = o.headScale ?? 1;
  const parts = [
    // legs (knee taper), boot shafts, boots with a toe box toward +z
    { kind: 'cyl', rt: 0.088 * b, rb: 0.07 * b, h: 0.5, at: [-0.11 * b, 0.37, 0], color: pants },
    { kind: 'cyl', rt: 0.088 * b, rb: 0.07 * b, h: 0.5, at: [0.11 * b, 0.37, 0], color: pants },
    { kind: 'cyl', rt: 0.075 * b, rb: 0.082 * b, h: 0.14, at: [-0.11 * b, 0.13, 0], color: boot },
    { kind: 'cyl', rt: 0.075 * b, rb: 0.082 * b, h: 0.14, at: [0.11 * b, 0.13, 0], color: boot },
    { kind: 'box', size: [0.14 * b, 0.09, 0.23], at: [-0.11 * b, 0.045, 0.04], color: boot },
    { kind: 'box', size: [0.14 * b, 0.09, 0.23], at: [0.11 * b, 0.045, 0.04], color: boot },
    // hips close the leg/torso gap; a belt marks the waist
    { kind: 'cyl', rt: 0.145 * b, rb: 0.122 * b, h: 0.16, seg: 10, scale: [1, 1, 0.85], at: [0, 0.585, 0], color: pants },
    { kind: 'cyl', rt: 0.152 * b, rb: 0.152 * b, h: 0.05, seg: 10, scale: [1, 1, 0.86], at: [0, 0.665, 0], color: boot },
    // torso: tapered AND flattened front-to-back
    { kind: 'cyl', rt: 0.205 * b, rb: 0.138 * b, h: 0.5, seg: 10, scale: [1, 1, 0.8], at: [0, 0.92, 0], color: shirt },
    // sloped shoulder caps
    { kind: 'sphere', r: 0.085 * b, scale: [1, 0.72, 0.9], at: [-0.2 * b, 1.11, 0], color: sleeve },
    { kind: 'sphere', r: 0.085 * b, scale: [1, 0.72, 0.9], at: [0.2 * b, 1.11, 0], color: sleeve },
    // neck + slightly oval head (extra detail: it's the face)
    { kind: 'cyl', rt: 0.062, rb: 0.078, h: 0.1, at: [0, 1.19, 0], color: skin },
    { kind: 'sphere', r: 0.155 * hs, scale: [0.94, 1.06, 0.96], detail: 2, at: [0, 1.33, 0], color: skin },
    // the face lives on +z: two brows (a single bar read as a visor), dark
    // eyes a step below them, and a nose bump for the profile
    { kind: 'box', size: [0.055 * hs, 0.024, 0.03], at: [-0.052 * hs, 1.33 + 0.056 * hs, 0.131 * hs], color: hair },
    { kind: 'box', size: [0.055 * hs, 0.024, 0.03], at: [0.052 * hs, 1.33 + 0.056 * hs, 0.131 * hs], color: hair },
    { kind: 'box', size: [0.03 * hs, 0.024, 0.02], at: [-0.052 * hs, 1.33 + 0.008 * hs, 0.141 * hs], color: 0x241a12 },
    { kind: 'box', size: [0.03 * hs, 0.024, 0.02], at: [0.052 * hs, 1.33 + 0.008 * hs, 0.141 * hs], color: 0x241a12 },
    { kind: 'box', size: [0.034, 0.05, 0.045], at: [0, 1.33 - 0.024 * hs, 0.142 * hs], color: skin },
    // arms in two segments: upper at the shoulder, forearm drifting forward
    { kind: 'cyl', rt: 0.06, rb: 0.054, h: 0.26, rotZ: 0.16, at: [-0.235 * b, 1.0, 0], color: sleeve },
    { kind: 'cyl', rt: 0.06, rb: 0.054, h: 0.26, rotZ: -0.16, at: [0.235 * b, 1.0, 0], color: sleeve },
    { kind: 'cyl', rt: 0.05, rb: 0.044, h: 0.26, rotZ: 0.1, rotX: -0.18, at: [-0.272 * b, 0.76, 0.02], color: sleeve },
    { kind: 'cyl', rt: 0.05, rb: 0.044, h: 0.26, rotZ: -0.1, rotX: -0.18, at: [0.272 * b, 0.76, 0.02], color: sleeve },
    // mitt hands, a touch forward of the seams
    { kind: 'sphere', r: 0.056, scale: [0.9, 1.1, 0.95], at: [-0.285 * b, 0.63, 0.05], color: skin },
    { kind: 'sphere', r: 0.056, scale: [0.9, 1.1, 0.95], at: [0.285 * b, 0.63, 0.05], color: skin },
  ];
  if (!o.bald) {
    // cap + a back-of-head mass: hairline from the side, unmistakable back
    parts.push({ kind: 'sphere', r: 0.163 * hs, scale: [1.0, 0.62, 1.02], at: [0, 1.405, -0.02 * hs], color: hair });
    parts.push({ kind: 'sphere', r: 0.135 * hs, scale: [0.95, 0.9, 0.75], at: [0, 1.325, -0.075 * hs], color: hair });
  }
  // overall size: scale every dimension + position (short goblins, tall giants)
  const S = o.scale ?? 1;
  if (S !== 1) for (const p of parts) {
    p.at = p.at.map((v) => v * S);
    if (p.size) p.size = p.size.map((v) => v * S);
    for (const k of ['r', 'rt', 'rb', 'h']) if (p[k] != null) p[k] *= S;
  }
  return parts;
}
