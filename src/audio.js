// OLDHOLM — audio.js
// Fully procedural WebAudio: a looping music theme per region (crossfaded on
// region change) and a bank of one-shot SFX. No audio files (spec §13).
// The AudioContext is created lazily on the first user gesture.

const A4 = 440;
const semis = (root, s) => root * Math.pow(2, s / 12); // frequency at s semitones above root

// Scales as semitone offsets from the root.
const SCALES = {
  majorPent: [0, 2, 4, 7, 9, 12, 14, 16],
  minorPent: [0, 3, 5, 7, 10, 12, 15, 17],
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  phrygian: [0, 1, 3, 5, 7, 8, 10, 12], // desert flavour
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
};

// Region music themes. motif = array of {d: scale-degree index, t: beats}.
// root in Hz, bpm tempo, type oscillator, plus optional drone/perc.
const THEMES = {
  plains:   { scale: 'majorPent', root: semis(A4, -9), bpm: 96, type: 'triangle', gain: 0.5, drone: 0.10, perc: false,
              motif: [[0, 1], [2, 1], [4, 1], [2, 1], [3, 1], [4, 2], [2, 1], [0, 1], [1, 1], [0, 2]] },
  capital:  { scale: 'major', root: semis(A4, -12), bpm: 84, type: 'square', gain: 0.42, drone: 0.14, perc: false,
              motif: [[0, 2], [4, 1], [3, 1], [4, 2], [5, 1], [4, 1], [2, 2], [0, 2]] },
  white:    { scale: 'major', root: semis(A4, -5), bpm: 76, type: 'triangle', gain: 0.44, drone: 0.10, perc: false,
              motif: [[0, 2], [2, 2], [4, 2], [3, 1], [2, 1], [1, 2], [0, 2]] },
  harbor:   { scale: 'major', root: semis(A4, -7), bpm: 120, type: 'square', gain: 0.4, drone: 0.06, perc: true, swing: true,
              motif: [[0, 1], [0, 0.5], [2, 0.5], [4, 1], [3, 1], [2, 1], [4, 0.5], [2, 0.5], [0, 2]] },
  barbarian:{ scale: 'minorPent', root: semis(A4, -16), bpm: 100, type: 'sawtooth', gain: 0.4, drone: 0.16, perc: true,
              motif: [[0, 1], [0, 1], [3, 1], [2, 1], [0, 1], [3, 1], [4, 2]] },
  frontier: { scale: 'minorPent', root: semis(A4, -9), bpm: 72, type: 'triangle', gain: 0.34, drone: 0.10, perc: false,
              motif: [[0, 2], [3, 1], [2, 1], [0, 2], [4, 2], [2, 2]] },
  murk:     { scale: 'minor', root: semis(A4, -14), bpm: 62, type: 'sine', gain: 0.36, drone: 0.18, perc: false,
              motif: [[0, 3], [2, 1], [3, 2], [1, 2], [0, 4]] },
  desert:   { scale: 'phrygian', root: semis(A4, -8), bpm: 88, type: 'sawtooth', gain: 0.34, drone: 0.12, perc: true,
              motif: [[0, 1], [1, 1], [3, 1], [1, 1], [0, 2], [4, 1], [3, 1], [1, 2]] },
  ashkara:  { scale: 'minorPent', root: semis(A4, -10), bpm: 108, type: 'triangle', gain: 0.4, drone: 0.10, perc: true,
              motif: [[0, 1], [2, 1], [4, 1], [2, 1], [3, 1], [4, 1], [2, 1], [0, 1]] },
  blight:   { scale: 'minor', root: semis(A4, -19), bpm: 50, type: 'sine', gain: 0.4, drone: 0.24, perc: false,
              motif: [[0, 4], [3, 2], [2, 2], [5, 4], [0, 4]] },
  dungeon:  { scale: 'minor', root: semis(A4, -17), bpm: 54, type: 'sine', gain: 0.34, drone: 0.22, perc: false,
              motif: [[0, 4], [1, 2], [0, 2], [4, 4], [3, 4]] },
};

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.volume = 0.6;
    this.theme = null;      // current theme key
    this._musicNodes = [];  // active drone oscillators
    this._beat = 0;         // beats scheduled so far
    this._nextNoteTime = 0; // audio-clock time of the next beat
    this._motifPos = 0;
    this._scheduler = null;
  }

  /** Create the context on the first user gesture (browsers require this). */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0; // respect a saved "sound off"
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.master);
    this._nextNoteTime = this.ctx.currentTime + 0.1;
    this._scheduler = setInterval(() => this._schedule(), 60);
  }

  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = this.enabled ? v : 0; }
  toggle(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? this.volume : 0;
    if (on) this.init();
  }
  toggleMusic(on) {
    this.musicEnabled = on;
    if (this.musicGain) this.musicGain.gain.linearRampToValueAtTime(on ? 0.5 : 0, (this.ctx?.currentTime ?? 0) + 0.4);
    if (on && this.theme) this._startDrone(THEMES[this.theme]);
    else this._stopDrone();
  }

  // ---- region music ---------------------------------------------------------

  setTheme(theme) {
    if (!this.ctx || theme === this.theme) return;
    if (!THEMES[theme]) theme = 'plains';
    this.theme = theme;
    this._motifPos = 0;
    const def = THEMES[theme];
    // crossfade the music bed
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    this.musicGain.gain.linearRampToValueAtTime(this.musicEnabled ? def.gain : 0, now + 0.9);
    this._stopDrone();
    if (this.musicEnabled) this._startDrone(def);
  }

  _startDrone(def) {
    if (!this.ctx || def.drone <= 0) return;
    const now = this.ctx.currentTime;
    for (const off of [0, 7]) { // root + fifth drone
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = semis(def.root, off - 12);
      const g = this.ctx.createGain();
      g.gain.value = def.drone * (off === 0 ? 1 : 0.6);
      osc.connect(g); g.connect(this.musicGain);
      osc.start(now);
      this._musicNodes.push({ osc, g });
    }
  }

  _stopDrone() {
    const now = this.ctx?.currentTime ?? 0;
    for (const n of this._musicNodes) {
      try { n.g.gain.setTargetAtTime(0, now, 0.15); n.osc.stop(now + 0.6); } catch (_) {}
    }
    this._musicNodes = [];
  }

  _schedule() {
    if (!this.ctx || !this.musicEnabled || !this.theme) return;
    const def = THEMES[this.theme];
    const beatDur = 60 / def.bpm;
    // if the audio clock ever ran past us (backgrounded tab / sleep-resume),
    // don't dump a catch-up burst — snap the cursor back to the present.
    if (this._nextNoteTime < this.ctx.currentTime) this._nextNoteTime = this.ctx.currentTime + 0.05;
    // schedule ~0.4s ahead
    while (this._nextNoteTime < this.ctx.currentTime + 0.4) {
      const [deg, len] = def.motif[this._motifPos % def.motif.length];
      const scale = SCALES[def.scale];
      const oct = Math.random() < 0.18 ? 12 : 0; // occasional octave lift
      const freq = semis(def.root, scale[deg % scale.length] + oct);
      let t = this._nextNoteTime;
      if (def.swing && this._beat % 1 === 0) t += beatDur * 0.06;
      this._playTone(freq, t, len * beatDur * 0.92, def.type, 0.5);
      if (def.perc && (this._beat % 2 === 0)) this._playPerc(t);
      this._nextNoteTime += len * beatDur;
      this._beat += len;
      this._motifPos++;
    }
  }

  _playTone(freq, time, dur, type, vel) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.16 * vel, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(time); o.stop(time + dur + 0.05);
  }

  _playPerc(time) {
    const noise = this._noiseBurst(0.08);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 220; bp.Q.value = 0.7;
    noise.connect(bp); bp.connect(g); g.connect(this.musicGain);
    noise.start(time);
  }

  // ---- SFX ------------------------------------------------------------------

  _noiseBurst(dur) {
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  _blip(freq, dur, type, vol, slideTo) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type ?? 'square'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol ?? 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.03);
  }

  _noise(dur, freq, q, vol) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const src = this._noiseBurst(dur);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q ?? 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol ?? 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    src.start(t);
  }

  // one-shots, called by game systems
  sfx(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'whiff': this._noise(0.14, 900, 0.6, 0.14); break;
      case 'thud': this._blip(150, 0.12, 'sine', 0.3, 70); this._noise(0.08, 200, 0.8, 0.12); break;
      case 'block': this._blip(320, 0.1, 'square', 0.12, 260); break;
      case 'bow': this._noise(0.09, 1400, 3, 0.16); this._blip(600, 0.08, 'sawtooth', 0.08, 300); break;
      case 'spell': this._noise(0.22, 700, 0.6, 0.1); this._blip(400, 0.25, 'sine', 0.14, 1200); break;
      case 'coins': for (let i = 0; i < 4; i++) setTimeout(() => this._blip(1400 + Math.random() * 600, 0.06, 'square', 0.08), i * 45); break;
      case 'teleport': this._blip(300, 0.5, 'sine', 0.16, 1800); this._noise(0.5, 1000, 0.5, 0.08); break;
      case 'door': this._blip(120, 0.4, 'sawtooth', 0.12, 80); break;
      case 'chicken': this._blip(900, 0.06, 'square', 0.14, 1300); setTimeout(() => this._blip(800, 0.08, 'square', 0.12, 600), 70); break;
      case 'eat': this._blip(260, 0.1, 'triangle', 0.12, 180); break;
      case 'chop': this._blip(180, 0.1, 'square', 0.14, 90); this._noise(0.06, 400, 1, 0.08); break;
      case 'mine': this._blip(220, 0.09, 'square', 0.14, 120); this._noise(0.05, 600, 1, 0.08); break;
      case 'levelup': this._fanfare([0, 4, 7, 12, 16], 0.11, 'square'); break;
      case 'quest': this._fanfare([0, 5, 7, 12, 14, 19], 0.13, 'triangle'); break;
      case 'error': this._blip(200, 0.12, 'sawtooth', 0.1, 140); break;
    }
  }

  _fanfare(offs, step, type) {
    const base = semis(A4, -3);
    offs.forEach((o, i) => {
      const t = this.ctx.currentTime + i * step;
      const osc = this.ctx.createOscillator();
      osc.type = type; osc.frequency.value = semis(base, o);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + step * 2.5);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(t); osc.stop(t + step * 2.6);
    });
  }
}
