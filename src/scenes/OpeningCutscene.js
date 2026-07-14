import Phaser from 'phaser';

export default class OpeningCutscene extends Phaser.Scene {
  constructor() {
    super({ key: 'Cutscene' });
  }

  create() {
    const { width: W, height: H } = this.scale;
    this._W = W;
    this._H = H;
    this._actObjs = [];
    this._lipTimer = null;
    this._mouthGraphics = null;
    this._mouthX = 0;
    this._mouthY = 0;
    this._mouthOpen = false;
    this._skipped = false;

    // Skip hint — fixed in scene (depth 100 so it's always on top)
    this.add
      .text(W - 12, H - 10, 'TAP / ANY KEY TO SKIP ▶', {
        font: '11px monospace',
        fill: '#555555',
      })
      .setOrigin(1, 1)
      .setDepth(100)
      .setScrollFactor(0);

    this.input.keyboard.on('keydown', () => this._skip());
    this.input.on('pointerdown', () => this._skip());

    this._playAct1();
  }

  // ── Object lifecycle ────────────────────────────────────────────────────────

  _track(obj) {
    this._actObjs.push(obj);
    return obj;
  }

  _trackTimer(timer) {
    // Wrap timer events so _clearAct can cancel them safely
    this._actObjs.push({
      destroy: () => {
        try {
          timer.remove(false);
        } catch (_) {}
      },
    });
    return timer;
  }

  _clearAct() {
    if (this._lipTimer) {
      try {
        this._lipTimer.remove(false);
      } catch (_) {}
      this._lipTimer = null;
    }
    this.tweens.killAll();
    for (const obj of this._actObjs) {
      try {
        obj.destroy();
      } catch (_) {}
    }
    this._actObjs = [];
    this._mouthGraphics = null;
  }

  // ── Skip ────────────────────────────────────────────────────────────────────

  _skip() {
    if (this._skipped) return;
    this._skipped = true;
    this._clearAct();
    this.cameras.main.fade(300, 0, 0, 0, false, (_cam, p) => {
      if (p >= 1) this.scene.start('Placeholder');
    });
  }

  // ── Transition helper ────────────────────────────────────────────────────────

  _fadeToAct(nextFn) {
    if (this._skipped) return;
    this.cameras.main.fade(600, 0, 0, 0, false, (_cam, p) => {
      if (this._skipped) return;
      if (p >= 1) {
        this._clearAct();
        this.cameras.main.setZoom(1);
        nextFn();
      }
    });
  }

  // ── Speech bubble ────────────────────────────────────────────────────────────

  _makeSpeechBubble(x, y, w, h, text, tailSide = 'down-left') {
    const objs = [];
    const g = this.add.graphics();
    objs.push(g);

    g.fillStyle(0xffffff, 0.96).fillRoundedRect(x, y, w, h, 14);
    g.lineStyle(3, 0x111111).strokeRoundedRect(x, y, w, h, 14);

    if (tailSide === 'down-left') {
      g.fillStyle(0xffffff, 0.96);
      g.fillTriangle(x + 55, y + h, x + 95, y + h, x + 40, y + h + 28);
      g.lineStyle(3, 0x111111);
      g.beginPath();
      g.moveTo(x + 55, y + h);
      g.lineTo(x + 40, y + h + 28);
      g.lineTo(x + 95, y + h);
      g.strokePath();
    } else {
      // tail points down-center (for Act 3)
      const tx = x + w / 2;
      g.fillStyle(0xffffff, 0.96);
      g.fillTriangle(tx - 18, y + h, tx + 18, y + h, tx, y + h + 26);
      g.lineStyle(3, 0x111111);
      g.beginPath();
      g.moveTo(tx - 18, y + h);
      g.lineTo(tx, y + h + 26);
      g.lineTo(tx + 18, y + h);
      g.strokePath();
    }

    objs.push(
      this.add
        .text(x + w / 2, y + h / 2, text, {
          font: 'bold 16px monospace',
          fill: '#111111',
          wordWrap: { width: w - 32 },
          align: 'center',
        })
        .setOrigin(0.5)
    );
    return objs;
  }

  // ── ACT 1: Farage at Reform HQ lectern ─────────────────────────────────────

  _playAct1() {
    const W = this._W;
    const H = this._H;
    const g = this._track(this.add.graphics());

    // Background – Reform UK dark blue
    g.fillStyle(0x001a5c).fillRect(0, 0, W, H);

    // Top banner bar
    g.fillStyle(0x0033aa).fillRect(0, 0, W, 80);
    g.fillStyle(0x002299).fillRect(0, 75, W, 5);

    this._track(
      this.add
        .text(W / 2, 38, 'REFORM UK — HQ  •  7 JULY 2026', {
          font: 'bold 22px monospace',
          fill: '#ffffff',
          stroke: '#001166',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
    );

    // Side drapes
    g.fillStyle(0x002288).fillRect(0, 80, 60, H - 80);
    g.fillStyle(0x002288).fillRect(W - 60, 80, 60, H - 80);

    // Floor
    g.fillStyle(0x0b0b2a).fillRect(0, H * 0.72, W, H * 0.28);
    g.lineStyle(3, 0x1133bb);
    g.beginPath();
    g.moveTo(0, H * 0.72);
    g.lineTo(W, H * 0.72);
    g.strokePath();

    // Background crowd silhouettes (simple)
    g.fillStyle(0x001466);
    for (let i = 0; i < 14; i++) {
      const cx = 70 + i * 50;
      const cy = H * 0.66;
      g.fillEllipse(cx, cy - 10, 28, 28);
      g.fillRect(cx - 12, cy + 4, 24, 30);
    }

    // Lectern
    g.fillStyle(0x3d2b1f).fillRect(W / 2 - 72, H * 0.46, 144, H * 0.26);
    g.fillStyle(0x5c3a1e).fillRect(W / 2 - 88, H * 0.45, 176, 22);
    g.lineStyle(2, 0x8b6520).strokeRect(W / 2 - 88, H * 0.45, 176, 22);
    // Lectern front panel
    g.fillStyle(0x4a2e18).fillRect(W / 2 - 55, H * 0.5, 110, H * 0.2);
    g.lineStyle(1, 0x7a5020).strokeRect(W / 2 - 55, H * 0.5, 110, H * 0.2);
    // Reform badge on lectern
    g.fillStyle(0x0044cc).fillEllipse(W / 2, H * 0.6, 44, 44);
    g.lineStyle(2, 0xffffff).strokeEllipse(W / 2, H * 0.6, 44, 44);

    // Microphone
    g.fillStyle(0x555555).fillRect(W / 2 - 2, H * 0.29, 4, H * 0.16);
    g.fillStyle(0x333333).fillEllipse(W / 2, H * 0.285, 22, 30);
    g.fillStyle(0x888888).fillEllipse(W / 2, H * 0.28, 10, 14);

    // ── Farage character ────────────────────────────────────────────────────
    const fx = W / 2;
    const fy = H * 0.44;

    // Body – dark blue suit
    g.fillStyle(0x0d1a3a).fillRect(fx - 50, fy - 15, 100, 115);
    // Lapels (lighter)
    g.fillStyle(0x1a2a55).fillTriangle(fx - 22, fy - 15, fx - 50, fy - 15, fx, fy + 25);
    g.fillStyle(0x1a2a55).fillTriangle(fx + 22, fy - 15, fx + 50, fy - 15, fx, fy + 25);
    // White shirt
    g.fillStyle(0xeeeeee).fillRect(fx - 10, fy - 16, 20, 44);
    // Red tie
    g.fillStyle(0xcc0000).fillTriangle(fx - 6, fy - 10, fx + 6, fy - 10, fx, fy + 58);
    g.fillStyle(0xaa0000).fillRect(fx - 5, fy - 12, 10, 9);

    // Pint (right side, over lectern)
    g.fillStyle(0xf5a623).fillRect(fx + 66, H * 0.455, 26, 48);
    g.fillStyle(0xfde68a).fillRect(fx + 66, H * 0.455, 26, 10);
    g.lineStyle(2, 0xd4841a).strokeRect(fx + 66, H * 0.455, 26, 48);
    g.fillStyle(0xffffff, 0.3).fillRect(fx + 69, H * 0.457, 4, 42);

    // Head
    g.fillStyle(0xe8c49a).fillEllipse(fx, fy - 58, 84, 88);

    // Hair (light-brown, side-parted)
    g.fillStyle(0x9b7a2e).fillEllipse(fx - 6, fy - 98, 88, 44);
    g.fillStyle(0x9b7a2e).fillRect(fx - 44, fy - 98, 90, 44);
    // Hair part
    g.lineStyle(2, 0xbfa048);
    g.beginPath();
    g.moveTo(fx + 8, fy - 102);
    g.lineTo(fx + 14, fy - 72);
    g.strokePath();

    // Eyebrows (slightly furrowed for smug look)
    g.lineStyle(3, 0x6b4c1a);
    g.beginPath();
    g.moveTo(fx - 26, fy - 79);
    g.lineTo(fx - 8, fy - 73);
    g.strokePath();
    g.beginPath();
    g.moveTo(fx + 8, fy - 73);
    g.lineTo(fx + 26, fy - 79);
    g.strokePath();

    // Eyes
    g.fillStyle(0x222222).fillEllipse(fx - 17, fy - 63, 15, 12);
    g.fillStyle(0x222222).fillEllipse(fx + 17, fy - 63, 15, 12);
    g.fillStyle(0xffffff).fillEllipse(fx - 12, fy - 66, 5, 4);
    g.fillStyle(0xffffff).fillEllipse(fx + 20, fy - 66, 5, 4);

    // Nose (bulbous)
    g.fillStyle(0xd4a070).fillEllipse(fx, fy - 49, 15, 17);
    g.fillStyle(0xc09060).fillEllipse(fx - 5, fy - 44, 7, 7);
    g.fillStyle(0xc09060).fillEllipse(fx + 5, fy - 44, 7, 7);

    // Rosy cheeks
    g.fillStyle(0xff8888, 0.35).fillEllipse(fx - 30, fy - 50, 26, 17);
    g.fillStyle(0xff8888, 0.35).fillEllipse(fx + 30, fy - 50, 26, 17);

    // Cigarette (corner of mouth)
    g.fillStyle(0xeeeeee).fillRect(fx + 14, fy - 43, 28, 5);
    g.fillStyle(0xcc4400).fillRect(fx + 40, fy - 46, 7, 10);
    g.fillStyle(0x888888, 0.55).fillEllipse(fx + 43, fy - 53, 11, 16);

    // Animated mouth
    const mouthG = this._track(this.add.graphics());
    this._mouthGraphics = mouthG;
    this._mouthX = fx;
    this._mouthY = fy - 38;
    this._drawMouth(false);

    // Speech bubble
    const bubble = this._makeSpeechBubble(
      W / 2 - 235,
      H * 0.06,
      470,
      90,
      '"It\'s the Establishment vs the people!"',
      'down-left'
    );
    bubble.forEach((o) => this._track(o));

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Start lip-flap after 0.5 s
    this._trackTimer(
      this.time.delayedCall(500, () => {
        if (this._skipped) return;
        this._lipTimer = this.time.addEvent({
          delay: 130,
          repeat: 32,
          callback: () => {
            this._mouthOpen = !this._mouthOpen;
            this._drawMouth(this._mouthOpen);
          },
        });
      })
    );

    // Transition to Act 2 after 4.8 s
    this._trackTimer(
      this.time.delayedCall(4800, () => {
        if (this._skipped) return;
        if (this._lipTimer) {
          this._lipTimer.remove(false);
          this._lipTimer = null;
        }
        this._fadeToAct(() => this._playAct2());
      })
    );
  }

  _drawMouth(open) {
    if (!this._mouthGraphics) return;
    const mg = this._mouthGraphics;
    const x = this._mouthX;
    const y = this._mouthY;
    mg.clear();
    if (open) {
      mg.fillStyle(0x2a0000).fillEllipse(x - 4, y, 24, 15);
      mg.fillStyle(0xdddddd).fillRect(x - 10, y - 5, 9, 4);
      mg.fillStyle(0xdddddd).fillRect(x - 2, y + 3, 9, 4);
    } else {
      // Smug closed-mouth smirk
      mg.lineStyle(2, 0x9b6a3a);
      mg.beginPath();
      mg.moveTo(x - 14, y);
      mg.lineTo(x + 8, y + 1);
      mg.strokePath();
      mg.beginPath();
      mg.moveTo(x + 6, y + 1);
      mg.lineTo(x + 13, y - 4);
      mg.strokePath();
    }
  }

  // ── ACT 2: Clacton skyline zoom ─────────────────────────────────────────────

  _playAct2() {
    const W = this._W;
    const H = this._H;
    const g = this._track(this.add.graphics());

    // Sky
    g.fillStyle(0x5b9bd5).fillRect(0, 0, W, H * 0.62);
    g.fillStyle(0x87ceeb).fillRect(0, H * 0.5, W, H * 0.12);

    // North Sea
    g.fillStyle(0x1e6b8a).fillRect(0, H * 0.62, W, H * 0.38);
    // Sea highlights
    for (let i = 0; i < 9; i++) {
      g.fillStyle(0xaaddff, 0.38).fillRect(20 + i * 88, H * 0.65 + (i % 3) * 16, 55, 5);
    }

    // Clouds
    g.fillStyle(0xffffff, 0.85).fillEllipse(160, 82, 120, 50);
    g.fillStyle(0xffffff, 0.85).fillEllipse(200, 66, 80, 40);
    g.fillStyle(0xffffff, 0.85).fillEllipse(580, 95, 150, 58);
    g.fillStyle(0xffffff, 0.85).fillEllipse(630, 78, 90, 44);

    // Seagulls (simple V shapes)
    g.lineStyle(2, 0x334455, 0.7);
    [[120, 55], [240, 40], [450, 68], [660, 45]].forEach(([sx, sy]) => {
      g.beginPath();
      g.moveTo(sx - 12, sy);
      g.lineTo(sx, sy - 6);
      g.lineTo(sx + 12, sy);
      g.strokePath();
    });

    // ── Building silhouettes ──────────────────────────────────────────────
    g.fillStyle(0x2c3e50);
    // Left
    g.fillRect(0, H * 0.42, 58, H * 0.2);
    g.fillRect(63, H * 0.37, 72, H * 0.25);
    g.fillRect(140, H * 0.43, 48, H * 0.19);
    g.fillRect(192, H * 0.35, 68, H * 0.27);
    // Lit windows, left buildings
    g.fillStyle(0xffee88, 0.75);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) g.fillRect(10 + c * 11, H * 0.45 + r * 18, 7, 10);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) g.fillRect(72 + c * 12, H * 0.41 + r * 18, 8, 10);

    // Central clock tower (landmark)
    g.fillStyle(0x2c3e50).fillRect(W / 2 - 30, H * 0.26, 60, H * 0.36);
    g.fillStyle(0x34495e).fillRect(W / 2 - 20, H * 0.19, 40, H * 0.09);
    g.fillStyle(0x2c3e50).fillRect(W / 2 - 12, H * 0.13, 24, H * 0.07);
    g.fillStyle(0x3d566e).fillEllipse(W / 2, H * 0.13, 28, 14); // spire base
    // Clock face
    g.fillStyle(0xdddaaa).fillEllipse(W / 2, H * 0.29, 40, 40);
    g.lineStyle(2, 0x2c3e50).strokeEllipse(W / 2, H * 0.29, 40, 40);
    g.lineStyle(3, 0x1a252f);
    g.beginPath();
    g.moveTo(W / 2, H * 0.29);
    g.lineTo(W / 2 + 11, H * 0.29 - 11);
    g.strokePath();
    g.beginPath();
    g.moveTo(W / 2, H * 0.29);
    g.lineTo(W / 2 - 7, H * 0.29 - 14);
    g.strokePath();

    // Right
    g.fillStyle(0x2c3e50);
    g.fillRect(W - 285, H * 0.38, 78, H * 0.24);
    g.fillRect(W - 202, H * 0.43, 52, H * 0.19);
    g.fillRect(W - 145, H * 0.35, 82, H * 0.27);
    g.fillRect(W - 60, H * 0.40, 60, H * 0.22);

    // ── Clacton Pier ─────────────────────────────────────────────────────
    g.fillStyle(0x7a5e18).fillRect(W * 0.29, H * 0.60, W * 0.27, 14);
    g.lineStyle(1, 0x5c3a00);
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      g.moveTo(W * 0.29 + i * 16, H * 0.60);
      g.lineTo(W * 0.29 + i * 16, H * 0.60 + 14);
      g.strokePath();
    }
    g.fillStyle(0x5c3a00);
    for (let i = 0; i < 7; i++) g.fillRect(W * 0.30 + i * 30, H * 0.614, 6, 24);
    // Pier pavilion
    g.fillStyle(0x6b4c00).fillRect(W * 0.29 + W * 0.27 - 58, H * 0.51, 64, H * 0.09);
    g.fillStyle(0x8b6914).fillTriangle(
      W * 0.29 + W * 0.27 - 64,
      H * 0.51,
      W * 0.29 + W * 0.27 + 12,
      H * 0.51,
      W * 0.29 + W * 0.27 - 26,
      H * 0.46
    );
    g.fillStyle(0xffee88, 0.7);
    for (let i = 0; i < 3; i++)
      g.fillRect(W * 0.29 + W * 0.27 - 52 + i * 16, H * 0.525, 10, 12);

    // Labels
    this._track(
      this.add
        .text(W / 2, H * 0.1, 'CLACTON-ON-SEA', {
          font: 'bold 32px monospace',
          fill: '#ffffff',
          stroke: '#1a2a4d',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
    );
    this._track(
      this.add
        .text(W / 2, H * 0.88, 'BY-ELECTION  ·  13 AUGUST 2026', {
          font: '15px monospace',
          fill: '#ffee55',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
    );

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Zoom in after 0.5 s
    this._trackTimer(
      this.time.delayedCall(500, () => {
        if (this._skipped) return;
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 1.75,
          duration: 2200,
          ease: 'Sine.easeInOut',
        });
      })
    );

    // Transition to Act 3 after 3.8 s
    this._trackTimer(
      this.time.delayedCall(3800, () => {
        if (this._skipped) return;
        this._fadeToAct(() => this._playAct3());
      })
    );
  }

  // ── ACT 3: Count Binface descends from outer space ──────────────────────────

  _playAct3() {
    const W = this._W;
    const H = this._H;
    const g = this._track(this.add.graphics());

    // Deep space
    g.fillStyle(0x000008).fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 110; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.74);
      const bright = Phaser.Math.FloatBetween(0.3, 1.0);
      g.fillStyle(0xffffff, bright);
      if (i % 7 === 0) {
        g.fillEllipse(sx, sy, 3, 3);
      } else {
        g.fillRect(sx, sy, 2, 2);
      }
    }

    // Nebula wisps
    g.fillStyle(0x220033, 0.28).fillEllipse(130, 190, 280, 100);
    g.fillStyle(0x001144, 0.25).fillEllipse(610, 140, 240, 90);

    // Earth (top-left)
    g.fillStyle(0x1a6fa8).fillEllipse(78, 68, 92, 92);
    g.fillStyle(0x1a8a3a, 0.85).fillEllipse(64, 53, 38, 26);
    g.fillStyle(0x1a8a3a, 0.85).fillEllipse(92, 73, 26, 22);
    g.fillStyle(0xffffff, 0.45).fillEllipse(98, 43, 42, 16);
    g.lineStyle(1, 0x3399cc).strokeEllipse(78, 68, 92, 92);

    // Moon (top-right)
    g.fillStyle(0xccccaa).fillEllipse(W - 70, 55, 48, 48);
    g.fillStyle(0xaaaaaa, 0.4).fillEllipse(W - 60, 45, 12, 12);
    g.fillStyle(0xaaaaaa, 0.3).fillEllipse(W - 80, 65, 8, 8);

    // Clacton silhouette (night, bottom)
    g.fillStyle(0x090918).fillRect(0, H * 0.70, W, H * 0.30);
    g.fillStyle(0x06060f);
    g.fillRect(25, H * 0.60, 42, H * 0.10);
    g.fillRect(75, H * 0.56, 56, H * 0.14);
    g.fillRect(W / 2 - 30, H * 0.53, 60, H * 0.17);
    g.fillRect(W - 175, H * 0.58, 50, H * 0.12);
    g.fillRect(W - 115, H * 0.62, 44, H * 0.08);
    // Lit windows in night buildings
    g.fillStyle(0xffee66, 0.65);
    g.fillRect(33, H * 0.62, 7, 8);
    g.fillRect(48, H * 0.64, 7, 8);
    g.fillRect(82, H * 0.60, 8, 8);
    g.fillRect(100, H * 0.58, 8, 8);
    g.fillRect(W / 2 - 18, H * 0.57, 8, 8);
    g.fillRect(W / 2 + 8, H * 0.60, 8, 8);
    // Night horizon glow
    g.lineStyle(2, 0x1a1a55);
    g.beginPath();
    g.moveTo(0, H * 0.70);
    g.lineTo(W, H * 0.70);
    g.strokePath();

    // ── Count Binface character ─────────────────────────────────────────────
    const bfX = W / 2;
    const landY = H * 0.55;

    const bfContainer = this._track(this.add.container(bfX, -160));
    const bf = this.add.graphics();
    bfContainer.add(bf);

    // Space suit body
    bf.fillStyle(0x2a2a4a).fillRect(-34, 44, 68, 95); // torso
    bf.fillStyle(0x3a3a5a).fillRect(-46, 44, 92, 24); // shoulder pads
    // Chest insignia
    bf.fillStyle(0x00ccff, 0.6).fillEllipse(0, 80, 28, 28);
    bf.fillStyle(0x0044ff, 0.4).fillEllipse(0, 80, 18, 18);

    // Arms
    bf.fillStyle(0x2a2a4a).fillRect(-70, 46, 26, 68);
    bf.fillStyle(0x2a2a4a).fillRect(44, 46, 26, 68);
    // Gauntlets
    bf.fillStyle(0x888899).fillRect(-74, 110, 30, 18);
    bf.fillStyle(0x888899).fillRect(44, 110, 30, 18);

    // Legs
    bf.fillStyle(0x1e1e3a).fillRect(-30, 138, 24, 58);
    bf.fillStyle(0x1e1e3a).fillRect(6, 138, 24, 58);
    // Boots
    bf.fillStyle(0x55556a).fillRect(-34, 192, 30, 17);
    bf.fillStyle(0x55556a).fillRect(4, 192, 30, 17);

    // Jetpack / rocket trails visual (triangular flares at back)
    bf.fillStyle(0x0000bb, 0.45).fillTriangle(-34, 135, -58, 210, -10, 210);
    bf.fillStyle(0x0000bb, 0.45).fillTriangle(34, 135, 10, 210, 58, 210);

    // ── THE BIN HEAD ──────────────────────────────────────────────────────
    // Main bin body (metallic cylinder)
    bf.fillStyle(0x8a8a8a).fillRect(-44, -40, 88, 88);
    // Left highlight
    bf.fillStyle(0xb8b8b8).fillRect(-40, -36, 24, 78);
    // Right shadow
    bf.fillStyle(0x606060).fillRect(22, -36, 18, 78);
    // Horizontal ribs
    bf.lineStyle(1, 0x6a6a6a);
    for (let i = 0; i < 5; i++) {
      bf.beginPath();
      bf.moveTo(-44, -22 + i * 16);
      bf.lineTo(44, -22 + i * 16);
      bf.strokePath();
    }

    // Lid (top ellipse)
    bf.fillStyle(0x9e9e9e).fillEllipse(0, -40, 96, 26);
    bf.fillStyle(0xd0d0d0).fillEllipse(0, -40, 74, 18);
    bf.fillStyle(0xb8b8b8).fillEllipse(0, -40, 42, 10);

    // Lid handle
    bf.fillStyle(0xcccccc).fillRect(-20, -60, 40, 22);
    bf.fillStyle(0xe0e0e0).fillRect(-14, -64, 28, 12);
    bf.lineStyle(2, 0x666666).strokeRect(-20, -60, 40, 22);

    // Recycling arrows on bin (green, simplified)
    bf.lineStyle(3, 0x00aa44, 0.7);
    bf.strokeCircle(0, 14, 16);
    bf.fillStyle(0x00aa44, 0.7);
    bf.fillTriangle(-4, -4, 4, -4, 0, -12);
    bf.fillTriangle(-14, 22, -10, 14, -4, 24);
    bf.fillTriangle(14, 22, 10, 14, 4, 24);

    // Face visor (glowing blue slit)
    bf.fillStyle(0x000022).fillRect(-36, -17, 72, 24);
    bf.fillStyle(0x001166, 0.85).fillRect(-34, -15, 68, 20);

    // Cyan glowing eyes
    bf.fillStyle(0x00ffcc).fillEllipse(-15, -6, 20, 13);
    bf.fillStyle(0x00ffcc).fillEllipse(15, -6, 20, 13);
    bf.fillStyle(0x66ffee).fillEllipse(-11, -9, 8, 6);
    bf.fillStyle(0x66ffee).fillEllipse(19, -9, 8, 6);
    // Visor scan-line glow
    bf.lineStyle(1, 0x00ffcc, 0.4);
    bf.beginPath();
    bf.moveTo(-34, -4);
    bf.lineTo(34, -4);
    bf.strokePath();

    // ── Descent sequence ────────────────────────────────────────────────

    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Thruster flames while descending
    const flameTimer = this.time.addEvent({
      delay: 65,
      repeat: 50,
      callback: () => {
        if (this._skipped) return;
        const cy = bfContainer.y + 210;
        // Only draw if still on screen
        if (cy > H + 60) return;
        const flameG = this.add.graphics();
        const fh = Phaser.Math.Between(20, 60);
        flameG.fillStyle(0xff4400, Phaser.Math.FloatBetween(0.5, 0.9));
        flameG.fillTriangle(bfX - 22, cy, bfX + 22, cy, bfX, cy + fh);
        flameG.fillStyle(0xffaa00, 0.75);
        flameG.fillTriangle(bfX - 11, cy, bfX + 11, cy, bfX, cy + fh * 0.55);
        flameG.fillStyle(0xffffff, 0.45);
        flameG.fillTriangle(bfX - 5, cy, bfX + 5, cy, bfX, cy + fh * 0.25);
        this.tweens.add({
          targets: flameG,
          alpha: 0,
          duration: 170,
          onComplete: () => {
            try {
              flameG.destroy();
            } catch (_) {}
          },
        });
      },
    });
    this._trackTimer(flameTimer);

    // Descent tween
    this._trackTimer(
      this.time.delayedCall(300, () => {
        if (this._skipped) return;
        this.tweens.add({
          targets: bfContainer,
          y: landY,
          duration: 2100,
          ease: 'Back.easeOut',
          easeParams: [1.8],
          onComplete: () => {
            if (this._skipped) return;
            try {
              flameTimer.remove(false);
            } catch (_) {}

            // Landing shockwave
            const shockG = this._track(this.add.graphics());
            let radius = 4;
            const shockTimer = this.time.addEvent({
              delay: 30,
              repeat: 22,
              callback: () => {
                shockG.clear();
                const alpha = Math.max(0, 1 - radius / 140);
                shockG.lineStyle(4, 0x00ffcc, alpha);
                shockG.strokeEllipse(bfX, landY + 205, radius * 6, radius * 1.6);
                shockG.lineStyle(2, 0xffffff, alpha * 0.4);
                shockG.strokeEllipse(bfX, landY + 205, radius * 4, radius * 0.9);
                radius += 7;
              },
            });
            this._trackTimer(shockTimer);

            // Dust puffs at landing
            const dust = this._track(this.add.graphics());
            dust
              .fillStyle(0x334466, 0.55)
              .fillEllipse(bfX - 55, landY + 205, 65, 18)
              .fillStyle(0x334466, 0.5)
              .fillEllipse(bfX + 55, landY + 205, 65, 18);
            this.tweens.add({
              targets: dust,
              alpha: 0,
              duration: 900,
              delay: 200,
            });

            // Camera shake
            this.cameras.main.shake(380, 0.018);

            // Speech bubble
            this._trackTimer(
              this.time.delayedCall(550, () => {
                if (this._skipped) return;
                const bubble = this._makeSpeechBubble(
                  W / 2 - 248,
                  H * 0.04,
                  496,
                  105,
                  '"People of Clacton, I have landed!\nCount Binface is ready to fight!"',
                  'down'
                );
                bubble.forEach((o) => this._track(o));

                // Binface victory arm raise
                this.tweens.add({
                  targets: bfContainer,
                  y: landY - 12,
                  duration: 400,
                  ease: 'Sine.easeOut',
                  yoyo: true,
                });

                // End cutscene
                this._trackTimer(
                  this.time.delayedCall(3400, () => {
                    if (this._skipped) return;
                    this.cameras.main.fade(800, 0, 0, 0, false, (_cam, p) => {
                      if (p >= 1) {
                        this._clearAct();
                        this.scene.start('Placeholder');
                      }
                    });
                  })
                );
              })
            );
          },
        });
      })
    );
  }
}
