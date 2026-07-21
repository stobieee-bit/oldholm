// OLDHOLM — title.js
// The title screen's slowly rotating low-poly castle (spec §16). A tiny
// self-contained three.js scene rendered to its own canvas, independent of
// the game's renderer so it can spin while the world sits paused behind the
// lock overlay.

import * as THREE from 'three';

export class TitleCastle {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    if (!canvas) return;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._resize();

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a1712, 30, 78);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    this.camera.position.set(0, 12.5, 33);
    this.camera.lookAt(0, 5.5, 0);

    this.scene.add(new THREE.HemisphereLight(0x9fb0d0, 0x3a3020, 1.15));
    const key = new THREE.DirectionalLight(0xffe6b8, 1.5);
    key.position.set(-9, 16, 12);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 4; key.shadow.camera.far = 60;
    key.shadow.camera.left = -16; key.shadow.camera.right = 16;
    key.shadow.camera.top = 20; key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.4;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7f92cf, 0.7);
    rim.position.set(10, 6, -9);
    this.scene.add(rim);

    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this._buildCastle();
    // let the castle self-shadow and drop onto its rocky base
    this.pivot.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    this._loop = this._loop.bind(this);
    this._t = 0;
  }

  _resize() {
    const w = this.canvas.clientWidth || this.canvas.width || 640;
    const h = this.canvas.clientHeight || this.canvas.height || 420;
    this.renderer.setSize(w, h, false);
    if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  }

  _buildCastle() {
    const stone = new THREE.MeshStandardMaterial({ color: 0x8d8577, flatShading: true, roughness: 0.95 });
    const darkStone = new THREE.MeshStandardMaterial({ color: 0x6f6858, flatShading: true, roughness: 1 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x7a2f2a, flatShading: true, roughness: 0.9 });
    const banner = new THREE.MeshStandardMaterial({ color: 0x3a5f9f, flatShading: true, roughness: 0.8, side: THREE.DoubleSide });
    const g = this.pivot;

    // rocky base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 2.2, 7), darkStone);
    base.position.y = -0.4;
    g.add(base);

    const wallH = 4;
    // curtain wall as an octagon of slabs with crenellations
    const R = 6.4, seg = 8;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(5, wallH, 1.1), stone);
      wall.position.set(x, wallH / 2 + 0.7, z);
      wall.rotation.y = -a + Math.PI / 2;
      g.add(wall);
      // battlement teeth
      for (let t = -1; t <= 1; t++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 1.1), stone);
        tooth.position.set(x + Math.cos(a + Math.PI / 2) * t * 1.5,
          wallH + 1.05, z + Math.sin(a + Math.PI / 2) * t * 1.5);
        tooth.rotation.y = -a + Math.PI / 2;
        g.add(tooth);
      }
    }

    // corner towers
    const towerAt = (x, z, h, r) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 6), stone);
      t.position.set(x, h / 2 + 0.7, z);
      g.add(t);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 1.35, r * 2.1, 6), roof);
      cap.position.set(x, h + 0.7 + r * 1.0, z);
      g.add(cap);
      return t;
    };
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      towerAt(Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02, 6.5, 1.5);
    }

    // central keep with a taller spire and a banner
    const keep = new THREE.Mesh(new THREE.BoxGeometry(4.6, 7.5, 4.6), stone);
    keep.position.y = 4.2;
    g.add(keep);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 4.6, 4), roof);
    spire.position.y = 10.2;
    spire.rotation.y = Math.PI / 4;
    g.add(spire);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), darkStone);
    pole.position.y = 13.4;
    g.add(pole);
    const flagGeo = new THREE.PlaneGeometry(1.8, 1.0);
    flagGeo.translate(0.9, 0, 0); // hinge the cloth at its pole-side edge
    const flag = new THREE.Mesh(flagGeo, banner);
    flag.position.set(0, 13.8, 0); // flutter now pivots around the pole
    g.add(flag);
    this.flag = flag;

    // gatehouse arch facing the camera
    const gate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 1.4), darkStone);
    gate.position.set(0, 2.4, R + 0.2);
    g.add(gate);
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.5, 8, 1, false, 0, Math.PI), roof);
    arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 2.6, R + 0.95);
    g.add(arch);
  }

  start() {
    if (!this.renderer || this.running) return;
    this.running = true;
    this._last = null;
    this._raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _loop(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._loop);
    // pick up the real canvas size once the overlay has laid out
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w && h && (w !== this._w || h !== this._h)) { this._w = w; this._h = h; this._resize(); }
    if (this._last == null) this._last = now;
    const dt = Math.min((now - this._last) / 1000, 0.05);
    this._last = now;
    this._t += dt;
    this.pivot.rotation.y += dt * 0.18;          // slow, stately spin
    this.pivot.position.y = Math.sin(this._t * 0.5) * 0.25; // gentle bob
    if (this.flag) this.flag.rotation.y = Math.sin(this._t * 2) * 0.35; // banner flutter
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
  }
}
