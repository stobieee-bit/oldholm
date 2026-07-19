# OLDHOLM

A first-person browser RPG built in vanilla JavaScript and [three.js](https://threejs.org/) — no build step, no framework. Explore an open medieval world, fight mobs and bosses, level skills, complete quests, trade with NPCs, and bank your loot. A full day/night cycle, procedural water, wind-swept flora, and torch-lit towns run entirely client-side.

## Play

Once deployed (see below), just open the site URL in a modern desktop browser. Progress saves to your browser via the in-game **System → Save & Load** menu.

**Controls**
- **WASD / mouse** — move and look (click the canvas to lock the pointer)
- **Left click** — attack / interact
- **1–9** — hotbar / spells
- **Tab or on-screen panels** — inventory, skills, quests, shop, bank

## Run locally

No dependencies to install — any static file server works:

```bash
npx serve -l 8437 .
# then open http://localhost:8437
```

## Deploy

This repo ships a [`render.yaml`](render.yaml) blueprint for a static site on [Render](https://render.com):

1. **One-click:** open
   `https://render.com/deploy?repo=https://github.com/stobieee-bit/oldholm`
   while signed in to Render, then confirm the blueprint.
2. **Or manually:** Render dashboard → **New → Static Site** → pick this repo →
   Build Command *(leave blank)* → Publish Directory `.` → **Create**.

Render gives you a public `*.onrender.com` URL to share with players. Any other
static host (GitHub Pages, Netlify, Cloudflare Pages, plain nginx) works too —
just serve the repo root.

## Tech

- three.js 0.160 via CDN import map · ES modules · zero build tooling
- Merged/instanced geometry and a small torch-light pool for performance
- Procedural GLSL (water, wind sway, sky) via `material.onBeforeCompile`
