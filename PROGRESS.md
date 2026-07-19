# OLDHOLM — PROGRESS

## Current status: Phase 5 — Smithing & Crafting — COMPLETE

## What was built (Phase 5)

- **data/crafting.js**: smelting (bronze/iron/steel/gold; iron 50% with "The iron ore
  stubbornly refuses to become a bar. You suspect it is doing this on purpose."),
  the 13-shape smithable table with level offsets, tanning (1 coin/hide), 6 leather
  recipes, spinning, gem cutting (chisel), 1/40 gem strikes while mining, jewellery
  (ring/amulet moulds; moulds survive casting), amulet stringing, sheep shearing.
- **Generated gear** (`items.js`): METALS × 13 shapes = 39 bronze/iron/steel items with
  full §8-style bonus blocks (atk/def arrays, str), §5 weapon speeds, §8 equip
  requirements (bronze/iron 1, steel 5), tier-colored icons and values — plus bars,
  gold ore, 6 gems, 4 jewellery pieces, 6 leather wearables, wool/leather/thread/
  needle/chisel/moulds/hammer/shears. ~65 new items, all with examine lines.
- **Sites**: courtyard smithy (furnace with Smelt + Craft-jewellery, anvil with the
  Smithing panel — bar sections, 13 rows, level/bar locks, exits pointer lock for
  clicking), tanning rack by the pasture, spinning wheel on the keep's upper floor
  (per the atlas), a gold rock (Mining 40) in the mine, 3 shearable sheep (attackable:
  false — civilized realms do not battle sheep; wool regrows in ~36s, dignity slower).
- **Minimal equipment** (ahead of Phase 6's depth): 9 slots live (weapon/shield/head/
  body/legs/gloves/boots/neck/ring), Wield/Wear via item menus with the spec's rude
  refusals, Gear tab (F5) with Remove menus + bonus totals, aggregate bonuses flowing
  into the §5 combat formulas, weapon speeds applied, 2h↔shield mutual displacement
  (works even with a full pack — the swapped item reuses the freed slot).

## Phase 5 — tested (live browser, real pipelines, simulated ticks)

- **DoD**: mined 379+ copper/tin from the outcrop (Mining 23, xp exact ×17.5), smelted
  ~200 bronze bars, hammered daggers to Smithing 18 (xp exact: 6.25/smelt +
  12.5×bars/smith), then smithed the FULL BRONZE KIT — sword, full helm, sq shield,
  kiteshield, platelegs, platebody — **and wore it**: 5 slots filled, combat stats
  0/0/0 → attB 5 / strB 4 / defB 32, speed 4, Gear tab listing every piece.
- Anvil interface: 13 rows with correct locks at Smithing 15 (12 locked), real DOM
  click smiths an iron dagger and closes the panel.
- Iron smelting: 22/48 bars (~46%, within binomial of 50%), fail message verbatim,
  xp only on success (exact). Steel gates refuse at Smithing < 30; steel gear refuses
  below Attack/Defence 5 with the full rude sentence.
- Crafting chain: tanned hides until the coins ran out; crafted + wore leather gloves;
  boots refused at Crafting < 7; sheared a sheep ("The sheep looks relieved."), shear
  again → "still regrowing its dignity", spun wool (2.5 xp exact); cut-gem refusal
  below 20 then a clean cut; cast gold ring, sapphire ring (gem consumed), amulet →
  strung with the ball of wool → wore both (neck/ring slots). Crafting xp audited
  exact to the decimal (4609).
- Fixed during testing: equip availability math refused legal 2h↔shield swaps with a
  full pack (the incoming item's freed slot wasn't counted).
- Regressions green; furnace/anvil tiles block; 1.64 ms/frame with all Phase 5 props.

## Definition of Done — Phase 5

- [x] Smith a full bronze kit from raw ore
- [x] Wear it

---

## Phase 4 — Gathering Loop — COMPLETE

## What was built (Phase 4)

- **data/resources.js**: trees (normal 1/25xp, oak 15/37.5, willow 30/67.5, deplete odds,
  respawns), rocks (copper/tin 1/17.5, iron 15/35, coal 30/50), fishing spot tables
  (net: shrimp; bait: sardine/herring/pike; lure: trout/salmon, feather-fueled),
  firemaking (logs 40 / oak 60 / willow 90, fire lifetime), cooking (per-food burn-stop
  levels, range −4 bonus, 3 ticks/item, burn = 50% at req falling linearly to 0%).
- **Action engine** (`skills.js`, per the spec's file layout): one action at a time,
  per-tick success rolls with the EXACT spec formula min(0.95, 0.30+(lvl−req)·0.02);
  interrupted by moving, entering combat, or taking damage ("Disturbed, you stop what
  you were doing."). Tool gates (axe/pickaxe/net/rods/tinderbox as required items,
  tiers defined bronze/iron/steel), consumables (feathers/bait per catch), pack-full
  stops, level-gate refusals.
- **Trees reworked**: 220 normal + 16 oak + 12 riverbank willow on shared
  InstancedMeshes with per-instance state — raycast instanceId resolves the exact tree;
  depleted trees collapse to a stump instance ("Somebody was here with an axe.") and
  respawn on ticks.
- **World sites**: mining outcrop SW of the castle (9 rocks, colored veins that vanish
  when depleted), 4 fishing spots hugging the river channel (positions derived from the
  meander), player-lit fires (log+flame models, age out into ashes), the castle range
  in the keep (cooks with lower burn; quest-gating arrives with Phase 9's quest system).
- **~25 new items**: tiered axes/pickaxes, net/rods/tinderbox/bait, oak/willow logs,
  4 ores, 6 raw + 6 cooked fish (heals per the §8 ladder: shrimp 3 → pike 8, salmon 9),
  cooked beef/chicken (Phase 3 drops now cookable), burnt fish/meat, ashes. Every one
  with examine text.
- **Tool spawns respawn** after being taken (data-driven `respawn` field) so death can
  never strand the gathering loop. Cook menu on fires/ranges lists the pack's raws.

## Phase 4 — tested (live browser, real pipelines, simulated ticks)

- **DoD chain**: took the axe → chopped a tree (25 xp/log exact, tree → stump →
  respawned ~30t) → lit a fire with the tinderbox (40 xp, "The fire catches…") →
  netted 448 shrimp to Fishing 20 while cooking them to Cooking 20 (4480/4560 xp,
  both exactly divisible by 10/30; "You accidentally incinerate the fish." seen) →
  killed chickens for feathers → lured 3 trout at exactly 50 xp each (feathers
  consumed per catch) → cooked trout ON the fire (1 cooked +70 xp, 2 incinerated —
  authentic at Cooking 20) → **ate the trout: healed exactly 7**.
- Mining: copper +17.5 xp, veins hide on deplete, rock respawned. Fire aged out into
  ashes. Raycast → instanceId → tree record resolution verified. Cancel-on-move
  verified. Cook menu opens with correct rows via the real Cook action.
- Regressions green (bridge, walls, ticks 5/3s). Perf 0.97 ms/frame.

## Definition of Done — Phase 4

- [x] Chop → burn → catch → cook → eat a trout
- [x] All four skills gain xp at correct rates (Woodcutting/Firemaking/Fishing/Cooking
      — and Mining too)

---

## Phase 3 — Combat v1 — COMPLETE

## What was built (Phase 3)

- **skills.js**: the exact spec §4.1 xp curve (83 / 1,154 / 13,034,431 verified), level
  lookup table, combat xp constants (4/dmg style, 1.33/dmg Hitpoints).
- **combat.js**: exact §5 formulas (effective levels, max hit, accuracy rolls — unit
  verified: maxHit(1,0)=1, maxHit(7,0)=2, parity hit chance 0.4991), §5.2 combat level,
  the tick engagement loop (player swings on weapon-speed cadence while a target is in
  ~1.8u melee reach), auto-retaliate both ways, xp capped at the target's remaining hp,
  HP regen 1/100 ticks, and §3.4 death: keep the 3 most valuable stacks, drop the rest
  as a pile at the death spot (despawns 500 ticks), respawn at the courtyard with a
  gently mocking line.
- **data/mobs.js + npc.js**: chicken, cow, giant rat, goblin, goblin (strong), spider —
  combat levels DERIVED from stats via the formula (1/2/3/2/5/1). Each type bakes its
  low-poly recipe into one merged vertex-colored geometry (one draw call per mob).
  Per-tick AI: idle wander within a radius, aggro (radius-gated, only onto players
  ≤ 2× mob level), BFS pathing on tiles (bounded window), tile-to-tile movement with
  smooth visual glide + facing, leash/give-up with full reset, weighted drop tables
  (always-drops + one weighted roll), respawn timers.
- **World content**: fenced cow pasture with gate gap onto the road (instanced rails +
  posts, blocks its tiles), chicken coop, goblin camp (two tents, ember-lit campfire,
  examine lines: "the great debate rages: red armor or green?"), tree exclusions.
- **UI**: HP orb (green/amber/red states), hitsplats (red damage / blue zero) projected
  onto victims, xp drops floating by the crosshair, mob overhead hp bars during fights,
  level-up fanfare (chat + gold flash + banner), death fade, mob nameplates with
  §3.3 level colors (green weaker / yellow even / red stronger), Combat tab (F1) with
  Accurate/Aggressive/Defensive style picker (trains Attack/Strength/Defence) and
  auto-retaliate toggle, live Skills tab with xp tooltips.
- **Food**: cabbage is edible (heals 1, instant, 3-tick attack delay per §5); goblins
  occasionally drop one. New drop items: feather, raw chicken, raw beef, cowhide.

## Phase 3 — tested (live browser, real pipelines, simulated ticks)

- Single fight: engaged via raycast Attack, xp math EXACT (Attack +4.00/dmg,
  Hitpoints +1.33/dmg verified to the decimal), drops (bones/cowhide/raw beef) at the
  corpse, respawn at full hp after 42 ticks.
- **DoD grind**: Attack 1→10 on cows (281 damage, ~3,400 ticks), 17 deaths en route —
  punching cattle at 10 hp is honest work — 10 exact-wording fanfares, Hitpoints 10→11,
  combat level 3→6, Strength untouched on Accurate.
- **DoD death**: walked into the goblin camp with a full pack; strong goblins aggroed
  unprovoked and killed us in 60 ticks; kept exactly the 3 most valuable stacks
  (coins×25 / dagger / logs), the rest dropped as a pile at the camp; respawned at the
  courtyard spawn, full hp, plane 0, "Oh dear, you are dead."; pile despawned at 500
  ticks; goblins walked home.
- Aggro 2× cutoff (no aggro at cl 16 vs lv5), auto-retaliate off stays passive / on
  engages, leash gives up + fully heals (fixed a path that skipped the heal), eat
  heals 1 + 3-tick swing delay, regen 1/100t, Aggressive trains Strength, chicken
  drops bones/feather/raw chicken, idle wander confirmed, mobs face their targets
  (fixed models fighting backwards).
- Regressions green (walls, bridge, pasture gate/fence, ticks 5/3s, keep climb path
  untouched). Perf: 0.86 ms/frame with mobs on screen; 500 full simulation ticks cost
  3.6 ms total.

## Definition of Done — Phase 3

- [x] Train Attack from 1→10 on cows
- [x] Die to the goblin camp on purpose
- [x] Respawn correctly

---

## Phase 2 — Interaction & UI Shell — COMPLETE

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

## Phase 2 post-review hardening (multi-agent review: ~16 unique defects, all fixed)

- **Menus survive their opening mousedown** (was: the same event bubbled to the window
  dismiss handler and closed them instantly — right-click menus and inventory Drop were
  unreachable by real mouse input). Fixed with an opening-event identity guard; verified
  by dispatching real MouseEvents.
- **Tab pages actually hide**: `#tab-inventory`'s ID-specificity `display:grid` beat
  `.tab-page.hidden`; both pages rendered stacked. `.hidden` now wins (`!important`),
  verified via computed styles.
- **Door can't soft-lock you**: closing is refused while anyone stands in the doorway
  ("You can't close the door while standing in it.").
- **Movement resumes after menus**: menus no longer clear held keys; movement/look are
  frozen via `player.menuOpen` while open and resume on close. `menuOpen` releases
  synchronously (the deferred release guarded nothing and could race).
- **Esc = cancel**: losing pointer lock (browser-reserved Esc) closes an open menu.
- **Cursor mode polish**: left-drag looks without acting, a still click (<5px) acts;
  right button never drags; hover/action text suppressed while the cursor is over UI.
- **Menu input polish**: E-repeat no longer flickers the menu; out-of-range digits are
  ignored; wheel only moves the highlight when locked or over the menu.
- **Hover "/ N more" off-by-one fixed** (door now shows "Open Door / 1 more").
- **World geometry truth**: ladder rails no longer poke through the roof slab onto the
  roof-side stub (wrong-plane picks + z-fighting gone); stairwell visuals span exactly
  their four blocked tiles; banner registered as examinable scenery.
- **Registry contract**: `removeInteractable` now purges occluders, clears userData,
  detaches the entry root, and disposes item-owned materials (Phase 3 despawns can rely
  on it). Occluder gaps closed (tower caps, piers, merlons, banner pole; water stays
  deliberately non-occluding). Furniture blocking is plane-aware. Item-menu Drop
  revalidates its slot at run time.
- Re-verified after fixes: full real-mouse menu/drop/take flows, drag-vs-click, door
  refusal, tab computed styles, movement freeze/resume, Phase 1 regressions, 5 ticks/3s,
  0.96 ms/frame with the expanded 234-mesh pick pool.

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

**Phase 6 — Equipment Depth**: all 11 slots live (cape + ammo remain), full bonus math
flowing into combat — per-style attack bonuses (the §5 tri-style tables replace the
current max-of-array aggregate), attack style picker driven by the wielded weapon's
styles (training the right skills), weapon speeds (already applied) verified end-to-end,
two-hand vs shield exclusivity (already enforced), tier requirements with rude messages
(already worded). DoD: measurable accuracy/max-hit differences swapping bronze → steel.
Items already carry full atk/def arrays and str; the main work is per-style combat
aggregation, defender-style-aware defence, weapon-specific style sets in the Combat
tab, and the cape/ammo slots.
