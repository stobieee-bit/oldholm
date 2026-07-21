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
import { Market } from './market.js';
import { Audio } from './audio.js';
import { Minimap } from './minimap.js';
import { SaveManager } from './save.js';
import { TitleCastle } from './title.js';
import { Tutorial } from './tutorial.js';
import { Slayer } from './slayer.js';
import { Diaries } from './diaries.js';
import { Clues } from './clues.js';
import { TouchControls } from './touch.js';
import { Online } from './online.js';
import { WorldMap } from './map.js';
import { Farming } from './farming.js';
import { Siege } from './siege.js';
import { Weather } from './weather.js';
import { applyBinds } from './keybinds.js';

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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft contact shadows ground the world

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 90);

const def = REGIONS.holmbridge;
const fogBase = new THREE.Color(def.fog.color);
scene.fog = new THREE.Fog(def.fog.color, def.fog.near, def.fog.far);
renderer.setClearColor(def.fog.color);

const hemi = new THREE.HemisphereLight(0xdfe6d2, 0x6d7a58, 1.12); // brighter, lighter ground bounce
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3da, 1.0);
sun.position.set(60, 100, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 12;
sun.shadow.camera.far = 210;
sun.shadow.camera.left = -48; sun.shadow.camera.right = 48;
sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -48;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.7;      // low-poly flat faces need a generous normal bias vs acne
sun.target = new THREE.Object3D();
scene.add(sun);
scene.add(sun.target);
const SUN_OFFSET = new THREE.Vector3(44, 58, 28); // ~46° elevation → readable shadows, follows the player
// cool fill from the opposite side so sun-shadowed faces keep their form
const fill = new THREE.DirectionalLight(0x9fb3d8, 0.32);
fill.position.set(-55, 42, -30);
scene.add(fill);

// A FIXED pool of hearth point-lights, created before the first render so the
// material shaders bake this light count in once (adding lights later would
// force a recompile hitch). Each frame the pool is retargeted onto whichever
// registered fire emitters are nearest the player, and flickers — never
// added/removed. Warm firelight pools bloom in towns and dungeons after dusk.
const TORCH_LIGHTS = 6;
const torchPool = [];
for (let i = 0; i < TORCH_LIGHTS; i++) {
  const l = new THREE.PointLight(0xffa03a, 0, 16, 1.7);
  l.castShadow = false;
  scene.add(l);
  torchPool.push(l);
}
const _winDark = new THREE.Color(0x140f09), _winWarm = new THREE.Color(0xffcf6a);
let nightAmount = 0, _fireT = 0;
function updateTorchLights(dt) {
  _fireT += dt;
  const ems = world.lightEmitters, px = player.pos.x, pz = player.pos.z, py = camera.position.y;
  const near = [];
  for (const e of ems) {
    const d2 = (e.x - px) ** 2 + (e.z - pz) ** 2 + (e.y - py) ** 2;
    if (d2 < 27 * 27) near.push({ e, d2 });
  }
  near.sort((a, b) => a.d2 - b.d2);
  for (let i = 0; i < TORCH_LIGHTS; i++) {
    const l = torchPool[i], n = near[i];
    if (!n) { l.intensity = 0; continue; }
    const e = n.e;
    l.position.set(e.x, e.y, e.z);
    l.color.setHex(e.color);
    l.distance = e.range;
    const flick = 0.82 + 0.18 * Math.sin(_fireT * 11 + i * 1.7) * Math.sin(_fireT * 6.3 + i * 3.1);
    l.intensity = e.strength * (0.12 + 0.95 * nightAmount) * flick * 1.5;
    if (e.flame) e.flame.scale.set(1, 0.9 + 0.16 * flick, 1);
  }
  if (world.windowMat) world.windowMat.color.copy(_winDark).lerp(_winWarm, nightAmount);
}

// --- gradient sky dome -------------------------------------------------------
// A camera-following inverted sphere with a vertical gradient. Its horizon band
// is driven to match the (tinted) fog colour each frame so distant terrain melts
// into it; the zenith deepens for painterly sky. Unfogged so the gradient holds.
const skyUniforms = {
  uHorizon: { value: new THREE.Color(def.fog.color) },
  uTop: { value: new THREE.Color(def.fog.color) },
  uExp: { value: 0.46 },
  uNight: { value: 0 },
  uSunDir: { value: new THREE.Vector3(1, 0, 0) },   // sun's compass direction (xz)
  uGlow: { value: new THREE.Color(0xffb060) },       // dawn/dusk warm-band colour
  uGlowStr: { value: 0 },
};
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(72, 28, 16),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `
      varying vec3 vDir;
      void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uHorizon; uniform vec3 uTop; uniform float uExp;
      uniform float uNight; uniform vec3 uSunDir; uniform vec3 uGlow; uniform float uGlowStr;
      varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(floor(p), vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        float t = pow(clamp(h, 0.0, 1.0), uExp);
        vec3 col = mix(uHorizon, uTop, t);
        // warm glow band low in the sky, concentrated toward the sun's azimuth
        float az = max(dot(normalize(d.xz), normalize(uSunDir.xz)), 0.0);
        float band = pow(az, 3.0) * pow(clamp(1.0 - h, 0.0, 1.0), 2.5);
        col += uGlow * band * uGlowStr;
        // stars: sparse hash points in the upper sky, fading in at night
        float sky = smoothstep(0.05, 0.35, h);
        float s = step(0.9975, hash(d * 260.0)) + step(0.9992, hash(d * 130.0 + 7.0));
        col += vec3(0.9, 0.93, 1.0) * s * sky * uNight;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }),
);
skyDome.renderOrder = -1000;
scene.add(skyDome);

// --- sun glow ----------------------------------------------------------------
// A soft additive disc in the sun's direction: gives the sky a focal light and
// something for the water to answer. Follows the camera; tinted by the hour.
const sunTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0.0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.16, 'rgba(255,248,224,0.95)');
  rg.addColorStop(0.5, 'rgba(255,226,150,0.32)');
  rg.addColorStop(1.0, 'rgba(255,210,120,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
})();
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: sunTex, transparent: true, depthWrite: false, fog: false,
  blending: THREE.AdditiveBlending, opacity: 0.85,
}));
sunGlow.renderOrder = -950;
scene.add(sunGlow);
const SUN_DIR = new THREE.Vector3(44, 58, 28).normalize();

// a pale moon riding opposite the sun, fading in at night
const moonTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0.0, 'rgba(238,244,255,1)');
  rg.addColorStop(0.42, 'rgba(226,234,250,0.98)');
  rg.addColorStop(0.52, 'rgba(200,214,240,0.35)');
  rg.addColorStop(1.0, 'rgba(180,200,235,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
})();
const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: moonTex, transparent: true, depthWrite: false, fog: false, opacity: 0,
}));
moonGlow.renderOrder = -948;
moonGlow.scale.setScalar(9);
scene.add(moonGlow);
const MOON_DIR = new THREE.Vector3(-38, 52, -34).normalize();

// --- drifting clouds ---------------------------------------------------------
// Soft billboard puffs high in the sky, in a group that follows the player so
// they stay far; they drift slowly and tint with the hour.
const cloudTex = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const blob = (x, y, r, a) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  for (let i = 0; i < 7; i++) blob(28 + i * 11, 58 + Math.sin(i) * 16, 22 + (i % 3) * 8, 0.85);
  return new THREE.CanvasTexture(cv);
})();
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
const clouds = [];
for (let i = 0; i < 11; i++) {
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cloudTex, transparent: true, opacity: 0.42, depthWrite: false, fog: false,
  }));
  const ang = (i / 11) * Math.PI * 2, rad = 26 + (i % 4) * 6;
  spr.position.set(Math.cos(ang) * rad, 26 + (i % 5) * 4, Math.sin(ang) * rad);
  spr.scale.set(16 + (i % 4) * 7, 8 + (i % 3) * 3, 1);
  spr.renderOrder = -900;
  cloudGroup.add(spr);
  clouds.push({ spr, drift: 0.25 + (i % 5) * 0.12, span: rad + 20 });
}
const _cloudTint = new THREE.Color();
const WHITE = new THREE.Color(0xffffff);
function updateClouds(dt) {
  cloudGroup.position.set(camera.position.x, 0, camera.position.z);
  _cloudTint.copy(_fogNow).lerp(WHITE, 0.35); // clouds ride a touch lighter than the haze
  for (const c of clouds) {
    c.spr.position.x += c.drift * dt;
    if (c.spr.position.x > c.span) c.spr.position.x = -c.span;
    c.spr.material.color.copy(_cloudTint);
  }
}

// --- distant mountains -------------------------------------------------------
// Layered low-poly ridgelines just past the fog, following the camera, tinted
// from the live fog colour so they melt up out of the haze and read warm at
// dawn / cool at night. Gives the valley a horizon and a sense of scale.
function buildRidge(radius, amp, seed, segs) {
  const pos = [];
  const h = (i) => {
    const a = (i / segs) * Math.PI * 2;
    const v = Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 7 + seed * 2) * 0.3 +
      Math.sin(a * 13 + seed * 3) * 0.2 + Math.sin(a * 23 + seed) * 0.12;
    return amp * (0.42 + 0.42 * v) + amp * 0.16 * Math.abs(Math.sin(a * 31 + seed));
  };
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
    const x0 = Math.cos(a0) * radius, z0 = Math.sin(a0) * radius, y0 = h(i);
    const x1 = Math.cos(a1) * radius, z1 = Math.sin(a1) * radius, y1 = h(i + 1);
    pos.push(x0, -4, z0, x0, y0, z0, x1, y1, z1, x0, -4, z0, x1, y1, z1, x1, -4, z1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
const RIDGE_SLATE = new THREE.Color(0x5a6478);
const farRidge = new THREE.Mesh(buildRidge(69, 26, 1.3, 64),
  new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide }));
const nearRidge = new THREE.Mesh(buildRidge(61, 15, 4.7, 80),
  new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide }));
farRidge.renderOrder = -960; nearRidge.renderOrder = -955;
scene.add(farRidge); scene.add(nearRidge);
const _ridgeF = new THREE.Color(), _ridgeN = new THREE.Color();
function updateRidges() {
  farRidge.position.set(camera.position.x, 0, camera.position.z);
  nearRidge.position.set(camera.position.x, 0, camera.position.z);
  farRidge.material.color.copy(_ridgeF.copy(_fogNow).lerp(RIDGE_SLATE, 0.5));
  nearRidge.material.color.copy(_ridgeN.copy(_fogNow).lerp(RIDGE_SLATE, 0.28));
}

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
const tutorial = new Tutorial({ player, ui, combat, dialogue });
const slayer = new Slayer(player, ui, combat);
const shops = new Shops(player, ui);
const bank = new Bank(player, ui);
const quests = new Quests(player, ui);
combat.prayers = prayers;
combat.magic = magic;
combat.quests = quests;         // boss deaths advance quests
combat.npcs = npcs;
dialogue.quests = quests;       // stage conditions + quest actions
dialogue.npcsRef = npcs;        // 'unhide:' summons quest characters
dialogue.actions = actions;     // the tanner's 'tan' verb
dialogue.combat = combat;       // 'killed' bounty conditions + 'mark' snapshots
dialogue.slayerRef = slayer;    // Slayer master: assign/turn-in/reward-shop
actions.quests = quests;        // range + Glyphcraft gates
world.quests = quests;          // world interactions read quest state
interactions.combat = combat;   // action ctx + nameplate level colors
interactions.actions = actions; // gathering verbs
interactions.prayers = prayers; // the altar's Pray-at
interactions.dialogue = dialogue;
interactions.quests = quests;   // item-triggered advances (the skull)
interactions.npcs = npcs;       // world interactions that unhide quest NPCs
interactions.magic = magic;
ui.quests = quests;             // the Starmetal equip gate
const market = new Market(player, ui);
ui.bind({
  world, combatLevelFn: () => combat.playerCombatLevel(),
  actions, prayers, magic, shops, bank, dialogue, quests,
});
ui.bindMarket(market);
npcs.spawnAll();

// Let the world and its inhabitants cast + receive the sun's shadow.
// Water casts nothing (it's transparent); everything else grounds itself.
world.group.traverse((o) => { if (o.isMesh) { o.castShadow = !o.userData.noCast; o.receiveShadow = true; } });
if (world.water) { world.water.castShadow = false; world.water.receiveShadow = false; }
for (const m of npcs.mobs) m.mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

// --- audio / minimap / persistence ------------------------------------------

const audio = new Audio();
combat.audio = audio;
actions.audio = audio;
magic.audio = audio;
shops.audio = audio;
ui.audio = audio;
interactions.audio = audio;

const minimap = new Minimap(world, player, npcs);
const worldMap = new WorldMap(player, world, minimap, ui);

// The SaveManager reaches into every subsystem through this handle.
const game = { player, world, clock, bank, quests, prayers, magic, market, combat, npcs, ui, slayer };
const diaries = new Diaries(game);
game.diaries = diaries;
ui.diaries = diaries; // the quest panel renders diary progress
const clues = new Clues(player, ui);
game.clues = clues;
ui.clues = clues; // pack-menu Read/Dig/Open actions
const farming = new Farming(player, ui, world, clock);
game.farming = farming;
ui.farming = farming; // soil-patch Plant/Harvest actions
const siege = new Siege(player, ui, npcs);
game.siege = siege;
dialogue.siegeRef = siege; // Warden Ashe's 'siege:start'
const weather = new Weather(scene, camera, world, npcs, farming, ui, audio, clock, player);
actions.weather = weather;  // rain drowns fresh tinder
ui.combatRef = combat;      // the bestiary reads the kill tally
// touch devices get a joystick + drag-look + tap-to-act layer on the canvas
const touch = TouchControls.isTouchDevice()
  ? new TouchControls(canvas, player, interactions, ui) : null;
// optional online services (hiscores + presence); quiet when the server's away
const online = new Online(player, ui, world);
ui.online = online; // System-tab Online section + chat input send path
const chatInput = document.getElementById('chat-input');
chatInput?.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.code === 'Escape') { chatInput.blur(); return; }
  if (e.code !== 'Enter') return;
  const msg = chatInput.value.trim();
  chatInput.value = '';
  chatInput.blur(); // hand the keyboard back to the game
  if (!msg) return;
  if (!online.name()) { ui.chat.add('Set your wanderer name in the System tab to chat.', 'system'); return; }
  online.sendChat(msg);
});
const save = new SaveManager(game);

// Restore persisted settings (volume, music toggle) BEFORE the System tab is
// rendered, so its controls reflect the real audio state rather than defaults.
const settings = save.loadSettings();
if (settings.volume !== undefined) audio.volume = settings.volume;
if (settings.music === false) audio.musicEnabled = false;
if (settings.sound === false) audio.enabled = false;

// graphics quality: High = full DPR + shadows; Low = 1x pixels, no sun shadow
ui.graphics = {
  set: (q) => {
    ui.graphicsQuality = q;
    renderer.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio, 2));
    sun.castShadow = q !== 'low';
  },
};
ui.graphics.set(settings.quality === 'low' ? 'low' : 'high');
if (ui.fx) ui.fx.colorblind = !!settings.colorblind; // accessible hitsplats
applyBinds(settings.binds);                          // remembered key remaps

ui.bindSaveSystem(save, audio);

ui.showBanner(def.name.toUpperCase());
ui.chat.add('Welcome to OLDHOLM.', 'system');
ui.chat.add('Left click acts. Right click (or E) offers options. TAB frees the cursor.');

clock.on((tick) => {
  clock.gameMinutes = (clock.gameMinutes + 1) % (24 * 60); // one game minute per tick
  world.onTick(tick);
  prayers.tick();          // faith drains by the tick
  player.tickBoosts(ui);   // potion boosts count down and expire
  shops.tick();            // stock creeps back toward its maximums
  market.tick();           // the order book murmurs
  combat.tick(tick);       // the player swings first…
  actions.tick(tick);      // …or keeps working…
  npcs.tick(tick, combat); // …then the realm answers
  tutorial.tick();         // advance the new-player onboarding
  online.tick();           // position beacon for fellow wanderers (if connected)
  farming.updateVisuals(); // crops climb their stages
  siege.tick();            // the gate holds, or it doesn't
  weather.tick(tick);      // rain rolls in; the night shift wakes
  if (tick % 500 === 0) online.submitHiscore(); // refresh the board ~5-minutely
});

// --- pointer lock / cursor mode ----------------------------------------------
// The title overlay appears once, at boot. After that, losing pointer lock
// (Esc) just enters cursor mode: the cursor is free for panels and menus,
// WASD still walks, TAB toggles back to mouse-look.

const overlay = document.getElementById('lock-overlay');
let entered = false;

// A slowly rotating low-poly castle behind the title (spec §16).
const titleCastle = new TitleCastle(document.getElementById('title-castle'));
titleCastle.start();

// Offer "Continue" only when there's an autosave to resume.
const continueBtn = document.getElementById('title-continue');
const isNewPlayer = !save.hasAuto(); // captured before any save is written
if (continueBtn && save.hasAuto()) continueBtn.classList.remove('hidden');

function enterWorld(loadAuto) {
  entered = true;
  overlay.classList.add('hidden');
  titleCastle.stop();
  audio.init();
  audio.setTheme(world.regionAt(player.pos.x, player.pos.z, player.plane).theme);
  player.inputEnabled = true;
  if (loadAuto) {
    if (save.loadAuto()) ui.chat.add('Your journey resumes where you left it.', 'system');
  } else {
    tutorial.maybeStart(isNewPlayer); // guide brand-new players through the basics
  }
  online.connect();        // joins presence if a name is set (System tab)
  online.submitHiscore();  // no-op without a name or server
  player.requestLock();
}

overlay.addEventListener('click', (e) => {
  if (entered) return;
  // clicks on the Continue button resume; anywhere else starts fresh
  enterWorld(e.target && e.target.id === 'title-continue');
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
  renderer.setPixelRatio(ui.graphicsQuality === 'low' ? 1
    : Math.min(window.devicePixelRatio, 2)); // DPR can change across monitors
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- day tint cycle ------------------------------------------------------------
// Subtle: the region fog color is multiplied by a time-of-day tint. Never dark —
// old-school worlds do not do bedtime.

const TINTS = [ // [dayFraction, fogTint, sunColor, sunIntensity, hemiIntensity]
  [0.00, 0x8090c4, 0xbcc8ee, 0.55, 0.66], // deep night: cool + moody
  [0.22, 0xf0c088, 0xffc678, 0.90, 0.88], // dawn: golden
  [0.34, 0xfff6e6, 0xfff2d6, 1.00, 1.00], // morning
  [0.60, 0xffffff, 0xfff3da, 1.00, 1.00], // afternoon
  [0.80, 0xf2ac6e, 0xff9c50, 0.88, 0.86], // dusk: warm orange
  [0.92, 0x8090c4, 0xbcc8ee, 0.55, 0.66], // nightfall
].map(([t, f, s, si, hi]) => ({ t, fog: new THREE.Color(f), sun: new THREE.Color(s), si, hi }));

const _tintFog = new THREE.Color(), _tintSun = new THREE.Color(), _fogNow = new THREE.Color();
const _skyTop = new THREE.Color();
const DEEP_SKY = new THREE.Color(0x2b4a5e); // the midday zenith; the hour-tint warms/cools it
const HEMI_BOOST = 1.06; // lift ambient, but leave room for shadows to read

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
  const si = a.si + (b.si - a.si) * tt;
  const hi = a.hi + (b.hi - a.hi) * tt;
  // how "night" it is (0 day → 1 deep night); dungeons are always lit by fire
  nightAmount = player.plane > 0 ? 1 : Math.max(0, Math.min(1, (0.95 - si) / 0.35));
  sun.intensity = si;
  hemi.intensity = hi * HEMI_BOOST;
  fill.intensity = 0.26 * hi;          // fill fades with the day
  fill.color.copy(_tintFog);           // and warms/cools with the hour
  // the sun (and its shadow frustum) rides along with the player
  sun.position.set(player.pos.x + SUN_OFFSET.x, SUN_OFFSET.y, player.pos.z + SUN_OFFSET.z);
  sun.target.position.set(player.pos.x, 0, player.pos.z);
  sun.target.updateMatrixWorld();
  // sky dome: horizon melts into the fog, the zenith is a cool blue-slate that
  // rides the hour-tint (warm at dawn/dusk, dim at night)
  skyUniforms.uHorizon.value.copy(_fogNow);
  _skyTop.copy(DEEP_SKY).multiply(_tintFog);
  skyUniforms.uTop.value.copy(_skyTop);
  skyDome.position.copy(camera.position);
  // sun glow rides in the sun's direction, tinted + sized by the hour;
  // it floors out at deep night when the moon takes over
  sunGlow.position.copy(camera.position).addScaledVector(SUN_DIR, 62);
  sunGlow.material.color.copy(_tintSun);
  sunGlow.scale.setScalar(20 + (1 - si) * 26); // low, dim sun blooms wider
  sunGlow.material.opacity = (0.55 + si * 0.35) * (1 - nightAmount * 0.85);
  // sky: warm sun-band at golden hour, stars + moon at night
  skyUniforms.uNight.value = nightAmount;
  skyUniforms.uSunDir.value.set(SUN_DIR.x, 0, SUN_DIR.z);
  skyUniforms.uGlow.value.copy(_tintSun);
  skyUniforms.uGlowStr.value = Math.max(0, 1 - (si - 0.86) * (si - 0.86) / 0.02) * (1 - nightAmount) * 0.9;
  moonGlow.position.copy(camera.position).addScaledVector(MOON_DIR, 62);
  moonGlow.material.opacity = nightAmount * 0.9;
  moonGlow.scale.setScalar(8 + nightAmount * 3);
  // the water reflects a lightened version of the current sky
  if (world._waterUniforms) world._waterUniforms.uSky.value.copy(_fogNow).lerp(WHITE, 0.34);
}

// --- main loop -------------------------------------------------------------------

let last = performance.now();
let tickAcc = 0;
let fpsFrames = 0, fpsLast = performance.now();
let autosaveAcc = 0;

/** The foe the target frame should show: your engaged target first, else
 *  whichever living mob is currently coming at you (retaliators, casters). */
function pickTargetMob() {
  const t = player.target;
  if (t && t.hp !== undefined && !t.hiddenNpc) return t;
  return npcs.mobs.find((m) => m.target === 'player' && !m.dead && !m.hiddenNpc
    && (m.plane ?? 0) === player.plane) ?? null;
}

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
  world.updateEffects(dt);
  world.updateSpinners(dt);
  online.update(dt); // ease fellow wanderers toward their reported spots
  weather.update(dt); // rain falls with the camera
  interactions.updateHover();
  applyDayTint();
  updateTorchLights(dt);
  ui.setRun(player.energy, player.runOn);
  ui.setHp(player.hp, player.maxHp);
  ui.setPrayerOrb(prayers.points, prayers.maxPoints());
  ui.updateTargetBar(pickTargetMob());
  ui.fx.update(camera);
  minimap.update();
  updateClouds(dt);
  updateRidges();
  audio.setTheme(world.regionAt(player.pos.x, player.pos.z, player.plane).theme);

  // autosave every 30s once the player is actually in the world
  autosaveAcc += dt;
  if (entered && autosaveAcc >= 30) { autosaveAcc = 0; save.autosave(); }

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
  prayers, magic, dialogue, shops, bank, quests, market, tutorial, slayer, diaries, clues, touch, online, worldMap,
  farming, siege, weather,
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
      world.updateEffects(dt);
      world.updateSpinners(dt);
    }
    interactions.updateHover();
    applyDayTint();
    updateTorchLights(dt);
    ui.setHp(player.hp, player.maxHp);
    ui.setPrayerOrb(prayers.points, prayers.maxPoints());
    ui.updateTargetBar(pickTargetMob());
    ui.fx.update(camera);
    minimap.update();
    updateClouds(dt);
    updateRidges();
    renderer.render(scene, camera);
  },
  audio, minimap, save, titleCastle,
};

// Best-effort autosave when the tab closes.
window.addEventListener('beforeunload', () => { if (entered) save.autosave(); });
