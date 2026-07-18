// OLDHOLM — ui.js
// Phase 1 HUD: crosshair lives in CSS; this drives the run-energy orb,
// the FPS readout, and the region banner. Panels/chatbox arrive in Phase 2.

export class HUD {
  constructor() {
    this.runOrb = document.getElementById('run-orb');
    this.runFill = document.getElementById('run-fill');
    this.runText = document.getElementById('run-text');
    this.fpsEl = document.getElementById('fps');
    this.banner = document.getElementById('region-banner');
  }

  setRun(energy, on) {
    const pct = Math.round(energy);
    this.runFill.style.height = pct + '%';
    this.runText.textContent = pct;
    this.runOrb.classList.toggle('active', on);
  }

  setFps(fps) {
    this.fpsEl.textContent = fps + ' fps';
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.classList.remove('show');
    // restart the CSS animation
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
  }
}
