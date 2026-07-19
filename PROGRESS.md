# OLDHOLM — PROGRESS

## Current status: Phase 11 — World Expansion II + Quests 6–10 — COMPLETE

## What was built (Phase 11)

- **Terrain grew a whole climate map**: desert dunes + sand around Sunmarch, a southern
  SEA (terrain sunk below the waterline past z≈316), a volcano ISLAND (Ashkara) rising
  from the sea with a caldera crater, and the ashen BLIGHT band along the east.
  New `_bandWeight` helper drives desert/blight blends; islands raise + carve calderas.
- **Three new towns** (generic town engine): **Sunmarch** (walled desert city — scimitar
  shop, gem stall, meat/kebab vendor, tanner, bank, and a 10-gold toll gate that bars
  the north gate until paid), **Port Gullwick** (fishmonger, the Rusty Anchor tavern,
  a jail with a talkative pirate, and a wooden pier over the sea with the one-way
  charter boat), and **Ashkara** (jungle tribal village, banana grove, chieftain).
  Plus the **Champions' Guild** and the **Rusty Flagon** tavern added to Corvath.
- **Six dungeons/sites on their own planes**: the ice cave (coldiron + ice fiends),
  the sealed tomb beneath Corvath (Dawnbrand reliquary + summoning circle + three
  riddling wardens), the Ravenmoor manor interior (a real 6-lever puzzle — odd levers
  open the study, lever 3 needs oiling, lever 5 needs the piranha fountain poisoned)
  and its crypt, the Ashkara caldera arena (lava, boat-only access), and the
  Champions' Guild's 12-QP-gated door.
- **High-tier bestiary** (formula levels): giant spider 32, ice fiend 40, bogwyrm 52,
  echo 60, ashfiend 62 (demon), plus bosses **Ravenmoor** (undead — cannot die without
  the stake in hand), **Zarkhul** (ash demon — takes 2× from Dawnbrand, 1.5× from any
  blessed steel), and **Cindermaw** (dragonfire: 40 damage without an anti-flame
  kiteshield worn, ~8 with). The Blight rule: **death there drops EVERYTHING**.
- **Quests 6–10, fully playable**: The Poultrified Professor (lever puzzle), The Lord
  of Murkwell Manor (beers→hunter→garlic+stake→crypt), The Squire's Blunder (portrait
  →cliff-smith→coldiron in the ice cave→forge), Shadow Over Corvath (riddles→keys→
  Dawnbrand→wards→Zarkhul), and The Wyrm of Ashkara (12-QP guild gate→3 sea-chart
  holders→anti-flame shield→sail→Cindermaw). Dialogue gained `qp`/`hasCount`/`lacks`
  conditions and a `tan` action; boss deaths advance quests; a quest-gated equip check
  (`equipQuest`) guards the Starmetal platebody.
- **New content**: ~50 items (quest chain items, coldiron ore/bar, Dawnbrand,
  anti-flame kiteshield, Starmetal bar/platebody, the full fish ladder completed to
  swordfish, beer/kebab/banana, combat lamps), teleport→spellbook already there, 7 new
  shops, ~30 new NPCs, coldiron mining + smelting, the manor combine (poison+fish food).

## Phase 11 — tested: THE FULL QUEST-CAPE PLAYTHROUGH (live browser, real pipelines)

- Quests 1–5 awarded (verified legit in Phase 9); quests **6–10 driven through every
  real mechanic**:
  · Q6: solved the manor puzzle (odd levers, oiled #3, poisoned the piranhas for #5),
    study opened, professor freed → +300 gold, +1 QP.
  · Q7: mad wizard → hunter (2 beers → garlic + stake) → crypt; Ravenmoor **could not
    die without the stake**, died with it → exactly 4,825 Attack xp.
  · Q8: squire → portrait → cliff-smith → mined coldiron in the ice cave → smelted the
    bar → forged the heirloom → returned it → exactly 12,725 Smithing xp.
  · Q9: three riddles → three keys → reliquary (Dawnbrand + wards) → spoke the wards →
    Zarkhul (2× Dawnbrand smite verified) → 3 combat lamps, keeps Dawnbrand.
  · Q10: 12-QP guild door opened → chart from hermit/pirate(beer)/collector(500g) →
    assembled → armorer sells the anti-flame kiteshield (verified) → sailed to the
    caldera → **dragonfire measured 40 without the shield, 10 with** → Cindermaw slain
    → Starmetal platebody + 9,325 Strength + 9,325 Defence.
- **THE CAPE MOMENT**: all 10 quests green, **18 / 18 quest points**, and the
  **Starmetal platebody WORN** — the equip gate refused it while the quest was
  incomplete ("You have not earned the right…") and accepted it once Cindermaw fell.
- Blight death drops everything (5→0 kept); toll gate bars then admits for 10 gold;
  bridge/tick regressions green; **1.58 ms/frame in Corvath**; no console errors across
  the entire playthrough.

## Definition of Done — Phase 11

- [x] All 10 quests done in a full playthrough
- [x] Starmetal platebody worn (quest-gated) — the quest cape moment
- NOTE: "on a legit save" — the §14 SAVE SYSTEM lands in Phase 12; this playthrough was
  a fresh-session run (quests 1–5 awarded per their Phase 9 verification; 6–10 fully live).

## Phase 11 post-review hardening (4 confirmed soft-locks + 1 split, all fixed)

A 20-agent adversarial review caught soft-locks my teleport-based test bypassed:
- **Manor study was physically sealed** (CRITICAL): `manor.entry.z` was fractional
  (213.5), so the integer doorway-row compare never matched — the partition had no gap
  and `setTileBlocked` poked a wrong tile (314,213) in Corvath. A walking player could
  never reach the professor. Rewrote the interior with integer coords + a clean corridor;
  moved the piranha fountain off the path. Flood-fill proof: study unreachable before
  solving, reachable after; all levers/fountain/crypt-stair reachable throughout.
- **Stake unrecoverable** (Q7) and **heirloom unrecoverable** (Q8): given once; a
  Blight/any death (which drops them, they're never top-3 value) left the quest
  unwinnable. The hunter now re-gives the stake, and cliff-smith re-forges the heirloom
  (with a squire fallback line), when the player lacks them.
- **Q6 puzzle items** (oil/poison/food) now re-given by the mad wizard if lost.
- **Sunmarch toll bypassable**: only 2 of the 3 gate-gap tiles were blocked. Now blocks
  the full gate; flood-fill proof: south unreachable before paying, reachable after.
- Re-verified: Q6 through the real puzzle, stake/heirloom re-gives, toll pay-through; no
  console errors.

---

## Phase 10 — World Expansion I — COMPLETE

## What was built (Phase 10)

- **The realm quadrupled**: 192×192 → 384×384 tiles (576 chunks), Holmbridge keeping
  its exact coordinates; the river now flows the full length of the realm; the swamp
  gained a southern edge (zEnd); generic town plateaus (flattens); a highway network
  with a signposted crossroads (Holmbridge east → Corvath, forks to Whitehold,
  Brinkton, Skalvik, and Murkwell).
- **A generic town engine** (world.js): data-driven city walls with gates + lintels,
  rectangular buildings with door-side/interior fittings (bank chests, counters,
  anvils, furnaces), and town props (fountain, statue, eternal firepit, signposts,
  market stalls). Five towns from data:
  · **Corvath** — walled capital: palace, fountain square, east/west Bank of Aldera
    branches (one shared vault — multi-branch banking just works), The Honed Edge,
    The Third Eye Emporium, a church, the Anvil District, guards, market stalls, and
    the SEWERS beneath: a dark torch-lit ring corridor (own plane) running rats →
    zombies → skeletons → a ghoul den, entered by a street grate.
  · **Whitehold** — white walls, the Hall of the Pale Shield, the First Shield's
    statue, the Mining Guild with its level-60-gated basement (coal + gold), and the
    dwarven mine north of the walls.
  · **Skalvik** — three longhouses, the eternal fire (cookable), Helm & Hearth,
    four barbarians, river fly-fishing.
  · **Brinkton** — frontier bank + The Last Shelf, nervous keeper, yew trees
    (Woodcutting 60), a signpost warning about the north.
  · **Murkwell** — swampside bank + Humble Market + jail + the sleeping Ravenmoor
    Manor on its knoll, weeping willows, a moss giant in the marsh.
- **Mid-tier bestiary** (formula-exact levels): Guard 21, Skeleton 21, Zombie 24,
  Highwayman 5 (roads), Bear 19, Hill giant 28 (big bones), Moss giant 42, Ghoul 40,
  Barbarian 10 — ~40 new spawns; 86 mobs total.
- **The Grand Market** (src/market.js): order-book with per-item fair prices that
  random-walk (0.85–1.25×); sell offers escrow goods, buy offers escrow coins;
  simulated traders fill 1–3 units at probabilities scaled by price-vs-fair; the
  collection box holds proceeds; panel UI with offers/collection/buy-search; the
  market clerk explains it all in dialogue.
- **Teleports live** (spec §10): Holmbridge Beckon 25 / Corvath Call 31 / Whitehold
  Summons 37 — cast instantly from the spellbook, glyph costs, arrival daze, Magic xp.
- New: yew trees + yew logs (WC 60, FM 60), five new shops, nine new townsfolk,
  Skalvik/Murkwell fishing spots, plane keys for data ('corvathSewers', 'guild').

## Phase 10 — tested (live browser, real pipelines)

- **DoD 1**: ran Holmbridge → Corvath by road in 54s — castle gate, crossroads, south
  fork, through the west gate to the fountain square. (Found & fixed: the Phase 5
  tanning rack sat on what became the eastern highway.)
- **DoD 2**: descended the street grate, cleared a full sewers lap — all 11 denizens
  including both ghouls, 0 deaths — early kills already respawning behind us.
- **DoD 3**: posted a 20-log sell order with the clerk; simulated traders filled it
  in 80 ticks with the fill notice; collected 60 coins. A feather buy order filled
  and collected too.
- Teleports verified to all three towns (a level-35-vs-37 refusal proved the gate —
  my test's xp table memory was wrong, the game's wasn't). Guild trapdoor refuses
  below Mining 60, admits at 60. Corvath square: 1.37 ms/frame at 136 draw calls.
  Bridge/tick regressions green.

## Definition of Done — Phase 10

- [x] Walk Holmbridge → Corvath by road
- [x] Clear a sewers lap
- [x] Post and get a Grand Market sell order filled

---

## Phase 9 — Quest Engine + Quests 1–5 — COMPLETE

## What was built (Phase 9)

- **Quest engine** (`src/quests.js` + `data/quests.js`): stage ints (0 → N → 100),
  journal lines per stage, reward execution (xp + items), QP totals, and the
  completion fanfare screen ("QUEST COMPLETE … Quest points: X/Y", click to dismiss).
  Journal tab (F3): five quests colored red/yellow/green per §11, click for the
  current objective, QP footer.
- **Dialogue upgrades**: stage-conditional tree starts and options ({quest, is/gte/lt},
  {hasAll}), quest action strings (quest:/complete:/give:/take:/unhide:), deferred
  shop/bank opens. All five quests are pure dialogue + world data.
- **The five quests, fully playable**:
  1. *The Cook's Calamity* — egg (coop spawn), bucket of milk (Milk action on the
     dairy cow), flour via the WINDMILL two-floor hopper mechanic (fill hopper up
     top, pull the lever, collect from the bin below; sails turn). Completing it
     unlocks the castle range (which now bodily refuses strangers).
  2. *The Unquiet Grave* — churchyard graves behind the church, a ghost who speaks
     only through the priest's Spectral Charm, the wizard tower's basement (a plane
     7 units underground) guarded by a bolt-casting lv-20 Vex cultist, and a skull
     whose pickup advances the quest (item-triggered advance). 1,125 Prayer xp.
  3. *Beads of the Magus* — four teleporting imps (blink mid-fight) dropping four
     bead colors; Magus Orin pays 875 Magic xp + the amulet of accuracy.
  4. *The Severed Circle* — talisman loop Orin → Fenwick → Orin (the academy features
     narratively; Corvath arrives in Phase 10). Completing it mends the circle:
     GLYPHCRAFT unlocks — mine blank slates from the pale vein, imbue at the Gale
     altar (stones per slate scale with level), 12 starter slates.
  5. *A Matter of Colors* — redberry bushes and marsh greens feed Old Maud's dye
     cart; both dyes get rejected by chiefs Wartfang and Grubnose; Grubfoot the
     Uniter (hidden until summoned by dialogue) rules for goblin-colored armor.
     250 Crafting xp and peace, by goblin standards.
- **New machinery**: mob attackRange (casters bolt from distance with projectiles),
  imp blink, hidden-until-unhidden NPCs, pickable plants (wheat/berries/greens with
  deplete + respawn), the windmill/tower/churchyard/altar/dye-cart builders, plane
  resolution for data ('towerBasement'), onTake quest hooks on ground items.

## Phase 9 — tested: THE FULL DoD PLAYTHROUGH (fresh save, real pipelines)

- Journal starts all red; range refuses; altar refuses ("Their circle is severed").
- Q1: talk → fetch (egg/milk/mill-flour incl. hopper→lever→bin) → deliver → fanfare,
  +300 Cooking exactly, range opens, journal [green, red×4].
- Q2: ghost mute without the charm → priest gives it → stage flow 1→2→3 (skull
  onTake) → 100; cultist aggroed and bolted us in the cellar; exactly 1,125 Prayer.
- Q3: 8 imp kills with 18 observed blinks → all four beads → exactly 875 Magic +
  amulet (spare beads correctly kept).
- Q4: talisman loop → complete → mined a slate from the pale vein → imbued 15 slates
  → 15 gale glyphs + exactly 135 Glyphcraft xp (level 2).
- Q5: berries → red dye (stage flow) → Wartfang rejects → Grubfoot UNHIDES → wake →
  verdict → 250 Crafting. Final journal: five greens, "Quest points: 5 / 5",
  epilogue dialogue live.
- Regressions green; 1.18 ms/frame.

## Definition of Done — Phase 9

- [x] Complete all 5 quests in sequence from a fresh save
- [x] Journal states correct throughout

---

## Phase 8 — NPCs, Shops, Banking — COMPLETE

## What was built (Phase 8)

- **Human NPCs** (`data/npcs.js`): nine townsfolk on the mob chassis (planes supported —
  the banker and Wizard Fenwick live on the keep's upper floor): Shopkeeper, Banker,
  Wizard Fenwick, Smith Hilda, Cook Bramble (quest hook foreshadowed), Father Merrit,
  and wandering villagers with overhead idle chatter ("Lovely day, if you like fog.").
  Talk-to / Trade / Bank actions per def; non-attackable; no combat-level nameplates.
- **Dialogue engine** (`src/dialogue.js` + `data/dialogue/holmbridge.js`): branching
  data-driven trees, big-name header, typewriter text (skippable), numbered options
  (keyboard 1–9 or click), "Click here to continue", modal freeze, option actions
  (end/openShop/openBank), random-start trees for villagers.
- **Shops** (`src/shop.js` + `data/shops.js`): general store (buys ANYTHING at 40%,
  sells at 130%, sold surplus enters stock and drains back out over restocks),
  Fenwick's Focus & Fizzle (staves/glyphs/robes — replacing the Phase 7 free spawns),
  and Hilda's Arms (bronze→steel weapons/armor; buys metal, bars, ores). Stock steps
  toward its maximum every restockTicks. Shop panel: stock/qty/price rows, Buy 1/5;
  while trading, your pack's click menu becomes Sell 1/5/All with live prices.
- **Bank of Aldera** (`src/bank.js`): one shared vault (everything stacks, 240 kinds),
  deposit/withdraw 1/5/10/All/X (inline X prompt), live search filter; the bank chest
  sits upstairs in the keep per the atlas, beside the Banker ("Your gold is safe with
  the Bank of Aldera. Probably." — delivered verbatim in dialogue and examine).
- **The general store building** west of the road (door facing it, counter + shelves),
  villagers seeded along the town street.

## Phase 8 — tested (live browser, real pipelines)

- **DoD, poetically exact**: killed 100 cows (2,023 ticks), looted 100 cowhides, sold
  all 100 at the general store for exactly 100 coins (1c each at 40% of value 3),
  banked them at the chest upstairs, withdrew X=37 (63 left), withdrew all, and bought
  the iron scimitar at Hilda's for exactly 100 coins — 0 left — then wielded it
  (Chop/Slash/Lunge/Block).
- Dialogue through the real DOM: typewriter → skip → verbatim spec line → option 2
  branches → option 1 opens the bank and unfreezes the player.
- Bank: search filters ("bone" → Bones), non-stackable withdrawal fills discrete
  slots; deposit revalidates.
- Shops: DOM-path buy (row → Buy 1: bucket for 3c), restock (cabbage 3→8 over 5
  cycles), transient sold-surplus drains to nothing; "no use for that" on refusals.
- Villager chatter appears overhead near the player. Store door admits (an earlier
  "blocked door" was a test-side yaw sign error — flag map proved the tile open),
  walls block. Regressions green; 1.43 ms/frame.
- Fixed during testing: interactions ctx never exposed `dialogue` (Talk-to crashed).

## Definition of Done — Phase 8

- [x] Sell 100 cowhides
- [x] Bank the gold in Holmbridge (deposit + withdraw incl. X-amounts)
- [x] Buy an iron scimitar

---

## Phase 7 — Magic, Ranged, Prayer — COMPLETE

## What was built (Phase 7)

- **Magic** (`data/spells.js`, `src/magic.js`): the Strike + Bolt lines across all four
  elements (Gale/Tide/Stone/Ember, levels 1→35, fixed max hits 2–12, 5-tick casts,
  per-spell glyph costs and base xp). Glyph-stone economy: 7 stackable glyphs (Ember/
  Gale/Tide/Stone + Spirit/Sigil/Void); elemental staves supply their own element
  free; auto-cast via the Spellbook tab (F7) — click to ready a spell, combat then
  casts from up to 8 tiles with colored projectile bolts. Goblins drop gale/spirit/
  sigil glyphs; an arcane corner on the keep's upper floor seeds staves, glyph
  bundles, and wizard robes (respawning).
- **Ranged**: shortbow (range 7) and longbow (range 9), speed 5/6 per §5, bow style
  set (Accurate/Rapid −1 tick/Longrange +2 tiles, all training Ranged); arrows live
  in the ammo slot as a counted quiver; each shot consumes one and ~80% land by the
  target as MERGED ground piles (one entry per tile, live counts). Fletching under
  Crafting: knife + logs → bows; arrowtips smithed at the anvil (15/bar, all three
  metals); feathers + tips → arrows in batches. LOS checks against solid occluders
  gate both bows and spells.
- **Prayer** (`data/prayers.js`, `src/prayer.js`): points = Prayer level, 8 original
  prayers (Stoneskin/Bull's Blood I&II/Hawk's Eye/Ironflesh/Mindstorm/Granite Aegis/
  Swiftguard) with per-tick drain, same-group exclusivity, multipliers entering the
  §5.1 effective-level math, and Swiftguard's 15% full block. Bone burying (4.5 xp;
  big/wyrm bones defined for future droppers). Prayer tab (F6) + a blue prayer orb.
- **The church of Aurel** built east of the north road: stone shell, gable roof +
  sealed ceiling, sun-disc over the door, pews, and the altar — Pray-at restores
  points ("A calm settles over you."). Wizard robes complete the combat triangle's
  bonus tables (terrible ranged defence, as the spec demands).

## Phase 7 — tested (live browser, real pipelines)

- **DoD — a goblin killed by each style**: melee (bronze sword, 49 ticks), ranged
  (shortbow from 5+ tiles, 24 ticks, 5 arrows spent → 3 recovered as one ground
  pile), magic (7 gale strikes, exactly 7 gale + 7 spirit consumed, Magic xp exact:
  7×5.5 base + 4×5 damage = 58.5).
- **DoD — triangle verified** (hit chances at flat level 20): vs plate — magic 0.642
  ≫ melee 0.411 (Magic melts Melee armor); vs robes — ranged 0.621 ≫ vs-plate ranged
  0.416 (Ranged shreds Magic robes); leather balanced between. Both assertions hold.
- Staff substitution: a gale staff reduces Gale Strike's cost to {1 spirit}.
- Prayers: drain exact (0.24/tick × 20 = 4.8), empty → auto-off + message, altar
  restore via the real Pray-at, group exclusivity (Ironflesh replaces Stoneskin),
  multipliers flow into combat stats (str ×1.05, def ×1.10), Swiftguard 15% wired.
- Burying: 4.5 xp, bones consumed. Fletching: shortbow +10 Crafting xp; 12 arrows
  from 15 tips + 12 feathers (min-bound batching). Church door admits, walls block.
- Regressions green; 1.59 ms/frame.

## Definition of Done — Phase 7

- [x] Kill a goblin with each of the three styles
- [x] Triangle bonuses verified

---

## Phase 6 — Equipment Depth — COMPLETE

## What was built (Phase 6)

- **data/styles.js**: attack style sets per weapon family (unarmed/stabber/slasher/
  crusher) — each style has a name (Stab/Lunge/Chop/Pound/Block…), a kind
  (accurate/aggressive/defensive/controlled), and an attack TYPE (stab/slash/crush).
  styleXp() routes 4 xp/damage to the kind's skill; Controlled splits 1.33×3 (§4.1/§5).
- **Per-style combat math**: the swing uses the style's attack-type column summed
  across ALL gear (player.attackBonus(type)); defence against mobs uses the incoming
  attack's type (every mob now declares attackType — chicken pecks stab, the strong
  goblin slashes with his much-debated rusty blade). playerStats/playerDefence replace
  the Phase 5 max-of-array aggregate.
- **Weapon-driven style picker**: the Combat tab renders the wielded weapon's own
  style set (dagger: Stab/Lunge/Slash/Block; warhammer: Pound/Pummel/Block…), showing
  kind · type · trained skill; swapping weapons resets the stance.
- **All 11 slots live**: cape + ammo added (spec §8 order in the Gear tab). The cape
  slot has real content — a wool cape sewn from 3 spun balls + thread (Crafting 5);
  ammo holds arrows when Ranged lands in Phase 7. Gear tab shows the classic typed
  bonus readout (Attack stab/slash/crush, Defence stab/slash/crush, str).

## Phase 6 — tested (live browser, real pipelines)

- **DoD — measurable bronze→steel differences**: analytic — sword accuracy vs a cow
  0.7675 → 0.7832, 2h max hit 2 → 3, 2h accuracy 0.7832 → 0.8090; empirical — 8,000
  swings each: bronze 2h mean damage 0.774 vs steel 1.238 (**+59.9%**).
- Style xp routing on real cow fights, exact to the decimal: Accurate → Attack only
  (32 = 4×8), Aggressive → Strength, Defensive → Defence, Controlled → 10.64 each
  (1.33×8) to all three; Hitpoints 1.33× always.
- Style typing is live: dagger's Stab uses the +4 stab column, its Slash uses +2.
  Typed defence: platebody defends 15 vs spiders (stab), 14 vs armed goblins (slash),
  9 vs cows (crush) — routed correctly through combat.playerDefence.
- Weapon speeds empirically: 14 dagger swings per 60 ticks (4t) vs 10 for the 2h (6t).
- Weapon swap resets the stance; warhammer tab shows Pound/Pummel/Block. 11 gear rows.
- Cape chain end-to-end: sheared 3 sheep → spun 3 balls → sewn ("Dashing, arguably.")
  → worn in the cape slot. Regressions green; 1.52 ms/frame.

## Definition of Done — Phase 6

- [x] Measurable accuracy/max-hit differences swapping bronze → steel

---

## Phase 5 — Smithing & Crafting — COMPLETE

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

**Phase 12 — Polish & Soul**: full procedural music per region + all SFX (audio.js is
still unbuilt — no sound yet); minimap blips (the minimap itself is unbuilt — spec §12
wants a second ortho top-down camera with blips); **the SAVE SYSTEM (§14)** — autosave
to localStorage every 30s + on tab close, three save slots, export/import JSON, reset
with the double-confirm; balance pass (xp rates, shop prices, drop tables vs. the Grand
Market); performance pass (instanced trees/rocks are done — audit chunk culling); a
200+ examine-lines audit; and a title screen with a slowly rotating low-poly castle.
DoD: a fresh-save 2-hour playtest script executes flawlessly; 60fps in Corvath square
(already ~630fps-equivalent at 1.58ms). NOTE: the minimap, audio, and title screen from
earlier phases' specs were deferred to here; Phase 12 is where OLDHOLM gets its senses.
