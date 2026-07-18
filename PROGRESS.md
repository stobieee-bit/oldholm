# OLDHOLM — PROGRESS

## Current status: Phase 2 — Interaction & UI Shell — COMPLETE

## What was built (Phase 2)

- **Items** (`data/items.js`): 8 items, each with name/examine/value/stackable, a 24×24
  inline-SVG inventory icon, and a low-poly ground-model recipe (cylinder/box/sphere/
  log/bones/blade) interpreted by `world._buildItemModel`.
- **Planes** (`world.js`): plane 0 = terrain; higher planes are sparse per-tile
  {h, blocked} maps (absent tile = air). `getGroundHeight`/`isBlocked` take a plane;
  the player carries `plane`. Stairs/ladders teleport between planes per spec §3.2.
- **The keep rebuilt hollow**: shell walls with an east doorway + working hinged door
  (toggles its tile's blocked flag, dynamic Open/Close label), ground floor with table +
  items, staircase (→ plane 1, wooden upper floor with stairwell hole + banister),
  ladder (→ plane 2, crenellated roof terrace with hatch, banner of Aurel, and a
  bronze dagger as the climb reward). Parapets fill their blocked ring tiles.
- **Interactable registry + raycast targeting** (`interact.js`): crosshair ray when
  pointer-locked, cursor ray in cursor mode; pick pool includes plain occluders
  (terrain chunks, walls) so you cannot act through walls; ~4.2-unit reach gates
  actions ("You can't reach that from here."); hover action text top-center
  ("Open Door / 1 more"). Left click = default action; right click or E = context menu.
- **Context menu**: "CHOOSE OPTION" header; while locked: W/S/arrows/wheel highlight,
  1–9 direct, Enter/click confirm, Esc/E cancel; menu owns the keyboard (capture
  listener + player.menuOpen) and freezes look/movement. In cursor mode it opens at
  the cursor and is mouse-driven.
- **Ground items**: region-defined spawns (`regions.js groundItems`, incl. dy for
  table tops), Take/Drop lifecycle with mesh disposal and pick-pool rebuild, pack-full
  message.
- **UI shell** (`ui.js` + index.html): chatbox bottom-left (150-line cap, examine/system
  styling), right-side tab panel — Inventory 28 slots (4×7 grid, SVG icons, count
  badges, click → Drop/Examine menu) and Skills (15 skills, HP 10, total level),
  F2/F4 switching. Cursor-mode flow: title overlay only at boot; afterwards Esc frees
  the cursor (hint shown), TAB toggles mouse-look, WASD still walks in cursor mode.
- **Furniture**: data-driven table (blocks its tiles, examinable). Trees and the bridge
  are examinable scenery ("A tree. Notably wooden.").

## Phase 2 — tested (live browser, programmatic driving of the real pipelines)

- DoD: bucket targeted via raycast at 1.9u → taken → in pack → examined from the item
  menu ("It holds things. Usually water.") → dropped back into the world. Door opened
  (tile unblocks), stairs → plane 1 (coins looted), ladder → plane 2 roof, bronze
  dagger taken on the roof. Round trip back down to plane 0.
- Reach gating verified (dagger refused at 4.7u); occlusion verified (bucket not
  targetable through the keep wall); closed door blocks walking; parapet ring holds on
  the roof; menu keyboard flow (ArrowDown+Enter → examine in chat); full-pack refusal;
  F2/F4 tabs; 28 slots + 15 skill rows rendered.
- Phase 1 regressions all green (walls, bridge, river, boundary, ticks, run energy).
- Perf: 0.92 ms/frame GPU-synced, 117 draw calls, 212-mesh pick pool raycast per frame.

## Definition of Done — Phase 2

- [x] Pick up a bucket
- [x] Drop it
- [x] Examine it
- [x] Climb to the castle roof

---

## Phase 1 — Engine Core — COMPLETE

## What was built (Phase 1)

- **Project skeleton**: `index.html` (import map → three.js 0.160 CDN, HUD, pointer-lock overlay),
  `src/main.js`, `src/world.js`, `src/player.js`, `src/ui.js`, `data/regions.js`.
  ES modules, no build step. Serve with any static server (`npx serve` — a launch config
  exists in `.claude/launch.json`, port 8437). `file://` does not work for ES modules
  (browser CORS policy) — a static server is required.
- **Tick scheduler** (`main.js`): global 600ms tick with accumulator (clamped vs tab-away),
  `clock.on(fn)` subscription API. Game time advances 1 game-minute per tick (full day =
  14.4 real minutes) and drives the day tint cycle.
- **Day tint cycle**: subtle keyframed tint (night/dawn/day/dusk) multiplied onto the region
  fog color; drives fog, clear color, sun color/intensity, hemisphere intensity. Never dark.
- **Terrain** (`world.js` interpreting `data/regions.js`): 192×192-tile heightfield built from
  seeded 2-octave value noise; carved meandering river (north–south), southern swamp that dips
  below the waterline, castle plateau, rim hills at the region border, dirt roads
  (vertex-colored). 16×16-tile chunk meshes, non-indexed with per-face normals + per-tile
  vertex colors (flat-shaded 2004 look). Water is a transparent plane at the region water level.
  Fog color == clear color == skybox, per spec.
- **Tile collision layer**: per-tile flags (BLOCKED, WATER, cliffs via corner-height range,
  2-ring region boundary) + per-tile overrides (bridge deck height/walkability).
- **Holmbridge castle**: walled bailey on a plateau, 4 corner towers, merlons (instanced),
  east gate with walk-under lintel, 3-story keep with door/windows/roof/banner. All wall tiles
  flag-blocked, gate rows open.
- **Stone bridge**: deck spans the river aligned with the east road; walkable rows 87/88 via
  height override, parapet rows 86/89 blocked, piers into the river.
- **Trees**: ~240 seeded-random placements (excluded from roads/river/castle/bridge), three
  InstancedMeshes (trunk + 2 canopy cones) with per-instance color variance; each tree blocks
  its tile.
- **Player** (`player.js`): pointer-lock FP controller (plus drag-look fallback), WASD,
  Shift-**toggle** run, Space explicitly ignored. Run energy 0–100, drains 5/s running,
  regens 1.6/s otherwise, auto-untoggles at 0. Circle(r=0.32)-vs-blocked-tile collision with
  axis-separated wall sliding; smoothed ground following (eye height 1.55).
- **HUD** (`ui.js` + CSS): crosshair, run-energy orb with % fill, FPS readout, region banner,
  title/pointer-lock overlay.

## Tested (live browser, driven programmatically via `window.__OLDHOLM.step()`)

- Boot clean, zero console errors.
- Castle wall collision: stops at wall + player radius from inside (north wall, z=73.37)
  and outside (west wall, x=39.66). Frozen-in-blocked-tile only occurs on debug teleports
  into water — impossible in normal play.
- Gate + bridge: walked spawn → gate → across bridge to x=120 at z=88.5; deck height 2.05
  over the river; parapet rows hold (stop at z=88.65 walking south on deck).
- River blocks crossing away from the bridge; region boundary holds (stop z=2.38 walking north).
- Ticks: exactly 5 ticks per 3.0s simulated; game clock +5 minutes.
- Run energy: 100→80 after 4s running; regen to 88 after 5s walking; auto-untoggle verified in code.
- Performance: 0.58 ms/frame GPU-synced at 72 draw calls / ~40k triangles in the heaviest view
  (RTX 5080 — ~3% of the 16.6ms 60fps budget, so mid hardware has ~25× headroom).
- Visual screenshots verified: courtyard/gate/keep, bridge with parapets, river-into-fog,
  tree-lined road in fog.

## Definition of Done — Phase 1

- [x] Walk the whole Holmbridge region at 60 fps
- [x] Collide with the castle walls
- [x] Cross the bridge

## Post-review hardening (multi-agent review, 24 raw findings → 6 confirmed, all fixed)

- Input: movement keys clear on window blur / tab hide / pointer-lock exit (no more
  stuck-W after Alt-Tab); keyboard is gated off while the title/pause overlay is up
  (`player.inputEnabled`); resize handler refreshes pixel ratio for cross-monitor DPR.
- Worldgen: river carve fades out inside the rim band, so the river now springs from
  a cleft in the border hills instead of exposing the raw world edge at its mouths
  (channel terrain at the border: ~5.6 north / ~3.7 south, water stops 5+ rows short).
- One shared shoreline constant (`WATER_EPS`) for both the water-blocked flag and the
  bed color — no more dry-looking tiles that invisibly block.
- Bridge deck/parapets/piers/terrain-shaping all derive from `walkRows`/`railRows`
  (data-driven, no duplicated literals); parapets fill their blocked rail tiles so the
  collision face is the visible face. Dead `gate.side` field removed from region data
  (east-wall gate is a documented engine convention).
- Vertex/instance colors are authored in sRGB and converted once into the linear
  working space — fixes the washed-out palette and the floor-brighter-than-walls
  inversion under three.js r160 color management.

## Known issues / notes

- Pointer lock requires a real user click; a drag-look fallback exists for environments
  where pointer lock is denied.
- The castle interior walls read dark on their unlit side (sun is fixed east); acceptable
  old-school look, revisit in Phase 12 polish if desired.
- Water plane is region-wide at y=0 (hidden under terrain elsewhere) — cheap and correct.
- `window.__OLDHOLM` exposes {world, player, clock, camera, renderer, scene, step()} for
  debugging and automated playtesting. `step(dt, frames)` advances the sim without RAF.

## Exact next step

**Phase 3 — Combat v1**: full formula set (spec §5: effective levels, max hit, accuracy
rolls), engagement loop, auto-retaliate, hitsplats, HP orb, death/respawn at the
courtyard, xp drops + level-up fanfare. Mobs: chicken, cow, giant rat, goblin ×2,
spider — spawns, wander AI, aggro radius, tick-based BFS pathing on tiles, weighted
drop tables. DoD: train Attack 1→10 on cows, die to the goblin camp on purpose,
respawn correctly. (Will need `data/mobs.js`, `src/combat.js`, `src/npc.js`,
`skills.js` with the exact xp curve, and mob nameplates with level colors.)
