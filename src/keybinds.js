// OLDHOLM — keybinds.js
// Remappable controls. BINDS maps an action to the KeyboardEvent.code list
// that triggers it; the System tab rebinds the primary code and the result
// persists via save.saveSettings. Lookups go through actionFor()/isBound so
// every consumer (player, interact, map) honours remaps automatically.

export const BINDS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  interact: ['KeyE'],
  map: ['KeyM'],
};

export const BIND_LABELS = {
  forward: 'Walk forward', back: 'Walk back', left: 'Strafe left',
  right: 'Strafe right', run: 'Toggle run', interact: 'Options menu', map: 'World map',
};

/** Does this key code trigger the given action? */
export const isBound = (action, code) => BINDS[action]?.includes(code) ?? false;

/** Rebind an action's PRIMARY key (secondary/arrow fallbacks are kept). */
export function rebind(action, code) {
  if (!BINDS[action] || !code) return false;
  for (const a of Object.keys(BINDS)) { // a code can serve only one action
    const i = BINDS[a].indexOf(code);
    if (i !== -1 && a !== action) BINDS[a].splice(i, 1);
  }
  BINDS[action][0] = code;
  return true;
}

/** Pretty-print a code for the settings UI ("KeyW" -> "W"). */
export const keyLabel = (code) => (code ?? '—')
  .replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '')
  .replace('ShiftLeft', 'Shift').replace('ShiftRight', 'R-Shift');

/** Serialize / apply for settings persistence (primary keys only). */
export function bindsSnapshot() {
  const out = {};
  for (const [a, codes] of Object.entries(BINDS)) out[a] = codes[0];
  return out;
}
export function applyBinds(saved) {
  if (!saved) return;
  for (const [a, code] of Object.entries(saved))
    if (BINDS[a] && typeof code === 'string') BINDS[a][0] = code;
}
