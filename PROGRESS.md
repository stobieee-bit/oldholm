# OLDHOLM — PROGRESS

## Current status: Phase 1 — Engine Core — COMPLETE

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

## Known issues / notes

- Pointer lock requires a real user click; a drag-look fallback exists for environments
  where pointer lock is denied.
- The castle interior walls read dark on their unlit side (sun is fixed east); acceptable
  old-school look, revisit in Phase 12 polish if desired.
- Water plane is region-wide at y=0 (hidden under terrain elsewhere) — cheap and correct.
- `window.__OLDHOLM` exposes {world, player, clock, camera, renderer, scene, step()} for
  debugging and automated playtesting. `step(dt, frames)` advances the sim without RAF.

## Exact next step

**Phase 2 — Interaction & UI Shell**: raycast targeting + nameplates, context menu
(right-click/E), chatbox with message log, tab panel with Inventory (28 slots) + static
Skills, ground items (drop/take), doors/ladders/stairs between castle floors, examine
text everywhere. DoD: pick up a bucket, drop it, examine it, climb to the castle roof.
(The castle keep currently has no interior — Phase 2 must add enterable floors + stairs.)
