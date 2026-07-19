// OLDHOLM — main.js
// Boot, render loop, the 600ms game tick scheduler, and the day tint cycle.

import * as THREE from 'three';
import { REGIONS } from '../data/regions.js';
import { World } from './world.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { Interactions } from './interact.js';
import { NPCManager } from './npc.js';
import { Combat } from './combat.js';
import { Actions } from './skills.js';
import { Prayers } from './prayer.js';
import { Magic } from './magic.js';
import { Dialogue } from './dialogue.js';
import { Shops } from './shop.js';
import { Bank } from './bank.js';
import { Quests } from './quests.js';

export const TICK_MS = 600;

/** Global game clock. Consequential game logic subscribes to ticks. */
export const clock = {
  tick: 0,
  gameMinutes: 10 * 60, // the world wakes at 10:00
  listeners: new Set(),
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

// --- renderer / scene -------------------------------------------------------

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 90);

const def = REGIONS.holmbridge;
const fogBase = new THREE.Color(def.fog.color);
scene.fog = new THREE.Fog(def.fog.color, def.fog.near, def.fog.far);
renderer.setClearColor(def.fog.color);

const hemi = new THREE.HemisphereLight(0xd8e0cc, 0x59684a, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3da, 1.0);
sun.position.set(60, 100, 25);
scene.add(sun);

// --- world / player / hud ----------------------------------------------------

const world = new World(scene, def);
const player = new Player(camera, world, def.spawn);
player.attach(canvas);
const ui = new UI(player);
const interactions = new Interactions(camera, world, player, ui);
interactions.attach(canvas);
const npcs = new NPCManager(world);
const combat = new Combat(player, world, npcs, ui);
const actions = new Actions(player, world, ui);
const prayers = new Prayers(player, ui);
const magic = new Magic(player, ui);
const dialogue = new Dialogue(player, ui);
const shops = new Shops(player, ui);
const bank = new Bank(player, ui);
const quests = new Quests(player, ui);
combat.prayers = prayers;
combat.magic = magic;
dialogue.quests = quests;       // stage conditions + quest actions
dialogue.npcsRef = npcs;        // 'unhide:' summons quest characters
actions.quests = quests;        // range + Glyphcraft gates
interactions.combat = combat;   // action ctx + nameplate level colors
interactions.actions = actions; // gathering verbs
interactions.prayers = prayers; // the altar's Pray-at
interactions.dialogue = dialogue;
interactions.quests = quests;   // item-triggered advances (the skull)
ui.bind({
  world, combatLevelFn: () => combat.playerCombatLevel(),
  actions, prayers, magic, shops, bank, dialogue, quests,
});
npcs.spawnAll();
ui.showBanner(def.name.toUpperCase());
ui.chat.add('Welcome to OLDHOLM.', 'system');
ui.chat.add('Left click acts. Right click (or E) offers options. TAB frees the cursor.');

clock.on((tick) => {
  clock.gameMinutes = (clock.gameMinutes + 1) % (24 * 60); // one game minute per tick
  world.onTick(tick);
  prayers.tick();          // faith drains by the tick
  shops.tick();            // stock creeps back toward its maximums
  combat.tick(tick);       // the player swings first…
  actions.tick(tick);      // …or keeps working…
  npcs.tick(tick, combat); // …then the realm answers
});

// --- pointer lock / cursor mode ----------------------------------------------
// The title overlay appears once, at boot. After that, losing pointer lock
// (Esc) just enters cursor mode: the cursor is free for panels and menus,
// WASD still walks, TAB toggles back to mouse-look.

const overlay = document.getElementById('lock-overlay');
let entered = false;
overlay.addEventListener('click', () => {
  entered = true;
  overlay.classList.add('hidden');
  player.inputEnabled = true;
  player.requestLock();
});
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  ui.setCursorMode(entered && !locked);
  // browsers consume Esc to exit pointer lock — treat that as menu-cancel too
  if (!locked && ui.menu.isOpen) ui.menu.close();
});
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Tab' || !entered) return;
  e.preventDefault();
  if (player.pointerLocked) document.exitPointerLock();
  else player.requestLock();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR can change across monitors
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- day tint cycle ------------------------------------------------------------
// Subtle: the region fog color is multiplied by a time-of-day tint. Never dark —
// old-school worlds do not do bedtime.

const TINTS = [ // [dayFraction, fogTint, sunColor, sunIntensity, hemiIntensity]
  [0.00, 0x8fa3b8, 0xcdd6e8, 0.60, 0.70], // deep night: cool and dim(ish)
  [0.23, 0xe6d0ac, 0xffd9a0, 0.85, 0.88], // dawn
  [0.35, 0xffffff, 0xfff3da, 1.00, 1.00], // morning
  [0.62, 0xffffff, 0xfff3da, 1.00, 1.00], // afternoon
  [0.80, 0xe2bd97, 0xffc890, 0.85, 0.88], // dusk
  [0.92, 0x8fa3b8, 0xcdd6e8, 0.60, 0.70], // nightfall
].map(([t, f, s, si, hi]) => ({ t, fog: new THREE.Color(f), sun: new THREE.Color(s), si, hi }));

const _tintFog = new THREE.Color(), _tintSun = new THREE.Color(), _fogNow = new THREE.Color();

function applyDayTint() {
  const frac = clock.gameMinutes / (24 * 60);
  let a = TINTS[TINTS.length - 1], b = TINTS[0], span, tt;
  for (let i = 0; i < TINTS.length; i++) {
    const next = TINTS[(i + 1) % TINTS.length];
    if (frac >= TINTS[i].t && (frac < next.t || next.t < TINTS[i].t)) { a = TINTS[i]; b = next; break; }
  }
  span = (b.t - a.t + 1) % 1 || 1;
  tt = ((frac - a.t + 1) % 1) / span;
  _tintFog.lerpColors(a.fog, b.fog, tt);
  _tintSun.lerpColors(a.sun, b.sun, tt);
  _fogNow.copy(fogBase).multiply(_tintFog);
  scene.fog.color.copy(_fogNow);
  renderer.setClearColor(_fogNow);
  sun.color.copy(_tintSun);
  sun.intensity = a.si + (b.si - a.si) * tt;
  hemi.intensity = a.hi + (b.hi - a.hi) * tt;
}

// --- main loop -------------------------------------------------------------------

let last = performance.now();
let tickAcc = 0;
let fpsFrames = 0, fpsLast = performance.now();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.1); // clamp huge tab-away deltas
  last = now;

  // tick scheduler: everything consequential is quantized to 600ms
  tickAcc = Math.min(tickAcc + dt * 1000, 3000);
  while (tickAcc >= TICK_MS) {
    tickAcc -= TICK_MS;
    clock.tick++;
    for (const fn of clock.listeners) fn(clock.tick);
  }

  player.update(dt);
  npcs.updateVisuals(dt, player.pos);
  world.updateProjectiles(dt);
  world.updateSpinners(dt);
  interactions.updateHover();
  applyDayTint();
  ui.setRun(player.energy, player.runOn);
  ui.setHp(player.hp, player.maxHp);
  ui.setPrayerOrb(prayers.points, prayers.maxPoints());
  ui.fx.update(camera);

  fpsFrames++;
  if (now - fpsLast >= 500) {
    ui.setFps(Math.round((fpsFrames * 1000) / (now - fpsLast)));
    fpsFrames = 0; fpsLast = now;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

// Debug/tooling handle (also used by automated playtesting).
window.__OLDHOLM = {
  world, player, clock, camera, renderer, scene, ui, interactions, npcs, combat, actions,
  prayers, magic, dialogue, shops, bank, quests,
  /** Advance the simulation without RAF (hidden-tab tooling). */
  step(dt = 0.016, frames = 1) {
    for (let i = 0; i < frames; i++) {
      tickAcc += dt * 1000;
      while (tickAcc >= TICK_MS) {
        tickAcc -= TICK_MS;
        clock.tick++;
        for (const fn of clock.listeners) fn(clock.tick);
      }
      player.update(dt);
      npcs.updateVisuals(dt, player.pos);
      world.updateProjectiles(dt);
    }
    interactions.updateHover();
    applyDayTint();
    ui.setHp(player.hp, player.maxHp);
    ui.setPrayerOrb(prayers.points, prayers.maxPoints());
    ui.fx.update(camera);
    renderer.render(scene, camera);
  },
};
