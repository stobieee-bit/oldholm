# OLDHOLM — Backlog

Living list of planned / possible work. Seeded from the 2026-07-20 idea brainstorm.
Check items off as they ship; move things between sections freely.

## 🔨 Building now (this batch — client-side, I deploy these fully)
- [x] **Sound & music** — core system already existed (11 procedural region themes + SFX bank, spec §13); added SFX for the newer actions: potion/enchant/alch/superheat/herb/bake/dragonfire/slay
- [x] **New-player tutorial** — a skippable 5-step guided intro (look/move → open pack → talk → fight → skills), shown only on a fresh start; polls game state, no event bus
- [ ] **Slayer-style task loop** — a Slayer master assigns "kill N of X", you earn points and spend them in an unlock shop (reuses the kill-count infra from the bounty quests)
- [ ] **Achievement diaries** — per-region task lists with reward gear / perks
- [ ] **Clue scrolls / treasure trails** — rare hunt drops (dig spots, riddles pointing at NPCs) → reward caskets; reuses the whole map
- [ ] **Real boss mechanics** — phases / dodgeable specials / adds for Cindermaw, Zarkhul, Ravenmoor
- [ ] **Mobile / touch controls** — virtual joystick + drag-look + tap-to-interact

## 🌐 Needs a backend (your Render account to run it)
I'll build the server + a one-click deploy blueprint (like the initial static deploy); you connect it. The client degrades gracefully when the backend is offline.
- [ ] **Hiscores / leaderboard** — post total-level & per-skill rankings
- [ ] **Minimal multiplayer presence** — see other players walking around + a global chat (websockets)

## 📦 Backlog (not started)

### Content drops
- [ ] **Grand villain questline** — a multi-part arc with a recurring antagonist and a real climax
- [ ] **New biome + skill** — an underworld / underwater / sky zone with its own mobs; a **Farming** skill (grow your own Herblore herbs — closes that supply loop) or **Thieving** (pickpocket NPCs, loot stalls)
- [ ] **Wave-defense minigame** — hold the Brinkton gate against the Blight for escalating waves + a point shop

### Feel & polish (deferred)
- [ ] Weather + day/night that *affect* play (night-only mobs, rain dampening fires)
- [ ] In-game **bestiary / collection log**
- [ ] Settings & accessibility — graphics-quality toggle, colorblind hitsplats, keybind remapping
