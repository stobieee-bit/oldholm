# OLDHOLM — Backlog

Living list of planned / possible work. Seeded from the 2026-07-20 idea brainstorm.
Check items off as they ship; move things between sections freely.

## 🔨 Building now (this batch — client-side, I deploy these fully)
- [x] **Sound & music** — core system already existed (11 procedural region themes + SFX bank, spec §13); added SFX for the newer actions: potion/enchant/alch/superheat/herb/bake/dragonfire/slay
- [x] **New-player tutorial** — a skippable 5-step guided intro (look/move → open pack → talk → fight → skills), shown only on a fresh start; polls game state, no event bus
- [x] **Slayer-style task loop** — Slayer master Kr0nk (Corvath) assigns level-scaled "kill N of X" tasks, awards points on completion, and runs a point reward-stall (coins/potions/ore/combat-lamp). State persists. (Points-based; a full Slayer *skill* with level gates is a possible refinement.)
- [x] **Achievement diaries** — 4 region diaries (Holmbridge/Corvath/Frontier/Southern, 6 tasks each) in the Quest panel; progress derives live from persisted state, claim pays coins/lamps once; claimed flags saved
- [x] **Clue scrolls / treasure trails** — rare clue drops from 10 mid-tier mobs → 2-3-step riddle trails over 16 real landmarks → dig with a spade → casket with a weighted loot roll; trail state persists
- [x] **Real boss mechanics** — quest bosses (Cindermaw/Zarkhul/Ravenmoor) now escalate: outgoing damage climbs as they weaken (+22% at half HP, +36% at quarter), ~15% chance of a ×1.7 "crushing blow", once-only phase snarls; resets each fresh fight. Per-boss `enrage`/`specialChance` overridable in data.
- [x] **Mobile / touch controls** — floating joystick (left 40%) drives movement keys, drag-look elsewhere, short tap = act, long press = context menu; canvas-only handlers so the HUD keeps native taps; touch-aware tutorial text

## 🌐 Backend (built — needs one Render deploy to go live)
`server/` + the `oldholm-server` service in render.yaml are ready; **sync/redeploy the Blueprint on Render to create it**. The client degrades gracefully while it's offline.
- [x] **Hiscores / leaderboard** — POST/GET top-50 by total level; name set in System → Online; clients re-submit on visit so the board survives free-tier restarts
- [x] **Minimal multiplayer presence** — golden ghost players eased between position beacons + join/leave notices + global chat (Enter in the chat box); ws with rate-limited relay

## 📦 Backlog (not started)

### Content drops
- [ ] **Grand villain questline** — a multi-part arc with a recurring antagonist and a real climax
- [ ] **New biome + skill** — an underworld / underwater / sky zone with its own mobs; a **Farming** skill (grow your own Herblore herbs — closes that supply loop) or **Thieving** (pickpocket NPCs, loot stalls)
- [ ] **Wave-defense minigame** — hold the Brinkton gate against the Blight for escalating waves + a point shop

### Feel & polish (deferred)
- [ ] Weather + day/night that *affect* play (night-only mobs, rain dampening fires)
- [ ] In-game **bestiary / collection log**
- [ ] Settings & accessibility — graphics-quality toggle, colorblind hitsplats, keybind remapping
