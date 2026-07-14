import Phaser from 'phaser';

const W = 800;
const H = 600;

const TOTAL_GOAL = 5_000_000;
const FUNDING_RATE_PER_SEC = 180_000; // £180k/s per active line

const UK = { x: 338, y: 183 };

const SOURCES = [
  { id: 'russia',  label: 'RUSSIA',        x: 596, y: 132, color: 0xff4444, hex: '#ff4444' },
  { id: 'saudi',   label: 'SAUDI ARABIA',  x: 492, y: 294, color: 0xffaa00, hex: '#ffaa00' },
  { id: 'china',   label: 'CHINA',         x: 658, y: 262, color: 0xff6600, hex: '#ff6600' },
  { id: 'usdark',  label: 'US DARK MONEY', x: 116, y: 210, color: 0xaa44ff, hex: '#aa44ff' },
  { id: 'qatar',   label: 'QATAR / UAE',   x: 514, y: 276, color: 0xffdd00, hex: '#ffdd00' },
  { id: 'crypto',  label: 'ANON CRYPTO',   x: 136, y: 336, color: 0x00ddff, hex: '#00ddff' },
];

const S_HIDDEN   = 0;
const S_REVEALED = 1;
const S_SEVERED  = 2;

// Continent polygons for 800×600 canvas
const CONTINENTS = [
  { color: 0x2d5a1b, pts: [80,152, 198,128, 232,178, 254,228, 238,282, 202,322, 152,332, 118,302, 88,252, 78,202] },
  { color: 0x2d5a1b, pts: [168,342, 232,328, 252,378, 232,480, 190,522, 160,492, 148,422, 166,382] },
  { color: 0x1e3d12, pts: [292,128, 360,118, 404,138, 412,180, 392,212, 360,222, 318,212, 292,182] },
  { color: 0x1e3d12, pts: [314,148, 342,142, 356,160, 352,188, 330,192, 312,178] },
  { color: 0x2d5a1b, pts: [338,272, 422,264, 462,298, 462,378, 432,480, 392,512, 350,492, 322,432, 314,362, 328,292] },
  { color: 0x1e3d12, pts: [428,238, 500,232, 532,268, 522,312, 480,322, 448,292, 438,258] },
  { color: 0x1e3d12, pts: [420,88, 700,78, 732,98, 722,158, 682,198, 638,218, 578,208, 528,198, 478,178, 448,158, 428,128] },
  { color: 0x2d5a1b, pts: [578,198, 698,188, 742,218, 762,278, 742,358, 702,418, 658,402, 618,358, 588,308, 568,258] },
  { color: 0x2d5a1b, pts: [658,418, 762,408, 772,468, 742,512, 682,522, 648,492, 638,452] },
];

function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function fmtMoney(n) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}m`;
  return `£${Math.floor(n / 1000)}k`;
}

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1' });
  }

  create() {
    this._funding    = 0;
    this._lineStates = SOURCES.map(() => S_HIDDEN);
    this._lineActive = SOURCES.map(() => false);
    this._linePulse  = SOURCES.map(() => 0);
    this._done       = false;

    this._buildMap();
    this._buildLines();
    this._buildNodes();
    this._buildFarage();
    this._buildBinface();
    this._buildHUD();
    this._buildInput();
    this._startFarageAI();
  }

  // ─── Map ─────────────────────────────────────────────────────────────────

  _buildMap() {
    this.add.rectangle(0, 0, W, H, 0x0a1a2e).setOrigin(0);

    const g = this.add.graphics();
    for (const c of CONTINENTS) {
      const pts = [];
      for (let i = 0; i < c.pts.length; i += 2) pts.push({ x: c.pts[i], y: c.pts[i + 1] });
      g.fillStyle(c.color, 1);
      g.fillPoints(pts, true);
    }

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1a3355, 0.35);
    for (let x = 0; x <= W; x += 80) { grid.moveTo(x, 0); grid.lineTo(x, H); }
    for (let y = 0; y <= H; y += 60) { grid.moveTo(0, y); grid.lineTo(W, y); }
    grid.strokePath();

    this.add.rectangle(0, 0, W, 28, 0x000000, 0.75).setOrigin(0);
    this.add.text(8, 5, 'LEVEL 1 — FOLLOW THE MONEY', { font: '13px monospace', fill: '#00ff88' });

    this.add.rectangle(0, H - 24, W, 24, 0x000000, 0.75).setOrigin(0);
    this.add.text(8, H - 19, 'CLICK/TAP lines to REVEAL  •  Click REVEALED lines to SEVER  •  Stop £5m reaching Clacton!', {
      font: '10px monospace', fill: '#aaaaaa',
    });
  }

  // ─── Lines ───────────────────────────────────────────────────────────────

  _buildLines() {
    this._lineGfx    = SOURCES.map(() => this.add.graphics().setDepth(2));
    this._lineLabels = SOURCES.map((src) => {
      const midX = (UK.x + src.x) / 2;
      const midY = (UK.y + src.y) / 2;
      return this.add.text(midX, midY, '', {
        font: '10px monospace', fill: src.hex,
        backgroundColor: '#000000cc', padding: { x: 3, y: 2 },
      }).setOrigin(0.5).setDepth(6).setVisible(false);
    });
  }

  _redrawLines() {
    SOURCES.forEach((src, i) => {
      const g   = this._lineGfx[i];
      const st  = this._lineStates[i];
      const act = this._lineActive[i];
      const p   = this._linePulse[i];
      g.clear();

      if (st === S_HIDDEN) {
        if (!act) { this._lineLabels[i].setVisible(false); return; }
        // Active hidden line: faint pulsing dashes as a hint
        const alpha = 0.06 + 0.05 * Math.sin(p);
        g.lineStyle(2, src.color, alpha);
        g.beginPath();
        this._dashedLine(g, UK.x, UK.y, src.x, src.y, 8, 8);
        g.strokePath();
        this._lineLabels[i].setVisible(false);
      } else if (st === S_REVEALED) {
        const alpha = 0.65 + 0.35 * Math.sin(p * 2);
        g.lineStyle(3, src.color, alpha);
        g.strokeLineShape(new Phaser.Geom.Line(UK.x, UK.y, src.x, src.y));

        // Moving money-flow dot
        const t    = ((p * 0.35) % 1 + 1) % 1;
        const dotX = UK.x + (src.x - UK.x) * t;
        const dotY = UK.y + (src.y - UK.y) * t;
        g.fillStyle(src.color, 0.95);
        g.fillCircle(dotX, dotY, 4);

        const lbl = this._lineLabels[i];
        lbl.setVisible(true);
        lbl.setText(act ? `${src.label} ► ACTIVE` : src.label);
      } else { // S_SEVERED
        g.lineStyle(2, 0x333333, 0.5);
        g.strokeLineShape(new Phaser.Geom.Line(UK.x, UK.y, src.x, src.y));
        const mx = (UK.x + src.x) / 2;
        const my = (UK.y + src.y) / 2;
        g.lineStyle(3, 0xff0000, 0.8);
        g.beginPath();
        g.moveTo(mx - 8, my - 8); g.lineTo(mx + 8, my + 8);
        g.moveTo(mx + 8, my - 8); g.lineTo(mx - 8, my + 8);
        g.strokePath();
        this._lineLabels[i].setVisible(false);
      }
    });
  }

  _dashedLine(g, x1, y1, x2, y2, dash, gap) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const ux   = (x2 - x1) / dist;
    const uy   = (y2 - y1) / dist;
    let pos = 0, draw = true;
    while (pos < dist) {
      const seg = Math.min(draw ? dash : gap, dist - pos);
      if (draw) {
        g.moveTo(x1 + ux * pos, y1 + uy * pos);
        g.lineTo(x1 + ux * (pos + seg), y1 + uy * (pos + seg));
      }
      pos += seg; draw = !draw;
    }
  }

  // ─── Nodes ───────────────────────────────────────────────────────────────

  _buildNodes() {
    SOURCES.forEach((src) => {
      const g = this.add.graphics().setDepth(4);
      g.fillStyle(src.color).fillCircle(src.x, src.y, 8);
      g.lineStyle(2, 0xffffff, 0.5).strokeCircle(src.x, src.y, 8);
      this.add.text(src.x, src.y + 12, src.label, {
        font: '9px monospace', fill: src.hex, align: 'center',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5, 0).setDepth(5);
    });

    const uk = this.add.graphics().setDepth(4);
    uk.fillStyle(0x0044dd).fillCircle(UK.x, UK.y, 12);
    uk.lineStyle(3, 0xffffff).strokeCircle(UK.x, UK.y, 12);
    this.add.text(UK.x, UK.y + 16, 'CLACTON\nUK', {
      font: '9px monospace', fill: '#aaccff', align: 'center',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(5);
  }

  // ─── Farage sprite ───────────────────────────────────────────────────────

  _buildFarage() {
    this._farageGfx   = this.add.graphics().setDepth(8);
    this._farageLabel = this.add.text(0, 0, 'FARAGE', {
      font: '8px monospace', fill: '#ff4444', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9);
    this._faragePos    = { x: UK.x, y: UK.y };
    this._farageTarget = null;
    this._farageOnArrival = null;
    this._drawFarage();
  }

  _drawFarage() {
    const { x, y } = this._faragePos;
    const g = this._farageGfx;
    g.clear();
    if (this._done) return;
    g.fillStyle(0x222244).fillRect(x - 5, y + 12, 4, 8);
    g.fillStyle(0x222244).fillRect(x + 1,  y + 12, 4, 8);
    g.fillStyle(0x1a2f5e).fillRect(x - 8, y, 16, 14);
    g.fillStyle(0xf0b4c4).fillRect(x - 1, y + 1, 4, 10); // pink shirt
    g.fillStyle(0x2a7cc8).fillRect(x,  y + 1, 2, 10);    // blue REFORM tie
    g.fillStyle(0xd4a070).fillCircle(x, y - 6, 8);        // ruddy face
    g.fillStyle(0x9a9a9a).fillRect(x - 7, y - 14, 14, 7); // grey hair
    g.fillStyle(0xcc8833, 0.85).fillRect(x + 8, y + 4, 5, 8);
    g.fillStyle(0xffffff, 0.3).fillRect(x + 8, y + 4, 5, 3);
    g.fillStyle(0xffffff).fillRect(x + 8, y - 6, 6, 2);
    g.fillStyle(0xff6600).fillCircle(x + 14, y - 5, 1);
    this._farageLabel.setPosition(x, y - 24);
  }

  // ─── Binface sprite ──────────────────────────────────────────────────────

  _buildBinface() {
    this._binfaceGfx   = this.add.graphics().setDepth(9);
    this._binfaceLabel = this.add.text(0, 0, 'BINFACE', {
      font: '8px monospace', fill: '#00ccff', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    this._binfacePos    = { x: W * 0.55, y: H * 0.5 };
    this._binfaceTarget = { x: W * 0.55, y: H * 0.5 };
    this._drawBinface();
  }

  _drawBinface() {
    const { x, y } = this._binfacePos;
    const g = this._binfaceGfx;
    g.clear();
    if (this._done) return;
    g.fillStyle(0x336688).fillRect(x - 5, y + 12, 4, 8);
    g.fillStyle(0x336688).fillRect(x + 1,  y + 12, 4, 8);
    g.fillStyle(0x4488aa).fillRect(x - 8, y, 16, 14);
    g.fillStyle(0xaaaaaa).fillRect(x - 9, y - 18, 18, 16);
    g.fillStyle(0xcccccc).fillRect(x - 7, y - 20, 14, 4);
    g.fillStyle(0x001133).fillRect(x - 6, y - 14, 12, 5);
    g.fillStyle(0x0066ff, 0.6).fillRect(x - 5, y - 13, 10, 3);
    g.fillStyle(0x4488aa).fillCircle(x - 10, y + 6, 3);
    g.fillStyle(0x4488aa).fillCircle(x + 10, y + 6, 3);
    this._binfaceLabel.setPosition(x, y - 26);
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  _buildHUD() {
    const bg = this.add.graphics().setDepth(20);
    bg.fillStyle(0x000000, 0.78).fillRect(W - 222, 30, 217, 82);
    bg.lineStyle(1, 0x00ff88, 0.5).strokeRect(W - 222, 30, 217, 82);

    this.add.text(W - 212, 36, 'DARK MONEY COUNTER', {
      font: '10px monospace', fill: '#666666',
    }).setDepth(21);

    this._hudAmount = this.add.text(W - 212, 52, '£0.00m / £5.00m', {
      font: '15px monospace', fill: '#00ff88',
    }).setDepth(21);

    const barBg = this.add.graphics().setDepth(20);
    barBg.fillStyle(0x222222).fillRect(W - 212, 76, 197, 14);
    this._hudBarFg = this.add.graphics().setDepth(21);

    this._hudLines = this.add.text(W - 212, 95, 'Lines severed: 0 / 6', {
      font: '10px monospace', fill: '#aaaaaa',
    }).setDepth(21);
  }

  _updateHUD() {
    const pct = Math.min(this._funding / TOTAL_GOAL, 1);
    this._hudAmount.setText(`${fmtMoney(this._funding)} / £5.00m`);

    const col = pct < 0.5 ? 0x00ff88 : pct < 0.8 ? 0xffaa00 : 0xff2222;
    this._hudBarFg.clear();
    this._hudBarFg.fillStyle(col).fillRect(W - 212, 76, Math.floor(197 * pct), 14);

    const sv = this._lineStates.filter(s => s === S_SEVERED).length;
    this._hudLines.setText(`Lines severed: ${sv} / 6`);
  }

  // ─── Input ───────────────────────────────────────────────────────────────

  _buildInput() {
    this.input.on('pointermove', (ptr) => {
      this._binfaceTarget = { x: ptr.x, y: ptr.y };
    });
    this.input.on('pointerdown', (ptr) => {
      if (this._done) return;
      this._handleClick(ptr.x, ptr.y);
    });
  }

  _handleClick(px, py) {
    let bestDist = 44;
    let bestIdx  = -1;

    SOURCES.forEach((src, i) => {
      if (this._lineStates[i] === S_SEVERED) return;
      const d = distPointToSegment(px, py, UK.x, UK.y, src.x, src.y);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });

    if (bestIdx === -1) return;
    const st = this._lineStates[bestIdx];

    if (st === S_HIDDEN) {
      this._lineStates[bestIdx] = S_REVEALED;
      this._popText(bestIdx, '👁 REVEALED!', SOURCES[bestIdx].hex);
    } else if (st === S_REVEALED) {
      this._lineStates[bestIdx] = S_SEVERED;
      this._lineActive[bestIdx] = false;
      this._popText(bestIdx, '✂ SEVERED!', '#ff4444');
      this._screenFlash();
      this._checkWin();
    }
  }

  _popText(i, msg, fill) {
    const src = SOURCES[i];
    const mx  = (UK.x + src.x) / 2;
    const my  = (UK.y + src.y) / 2;
    const t   = this.add.text(mx, my - 12, msg, {
      font: '13px monospace', fill, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: t, y: my - 38, alpha: 0, duration: 850, onComplete: () => t.destroy() });
  }

  _screenFlash() {
    const f = this.add.rectangle(0, 0, W, H, 0xff0000, 0.18).setOrigin(0).setDepth(50);
    this.tweens.add({ targets: f, alpha: 0, duration: 280, onComplete: () => f.destroy() });
  }

  // ─── Farage AI ───────────────────────────────────────────────────────────

  _startFarageAI() {
    this._goToSource();
  }

  _goToSource() {
    if (this._done) return;
    const available = SOURCES.map((_, i) => i).filter(i => this._lineStates[i] !== S_SEVERED);
    if (available.length === 0) return;
    const idx = available[Phaser.Math.Between(0, available.length - 1)];

    this._farageTarget    = { x: SOURCES[idx].x, y: SOURCES[idx].y };
    this._farageOnArrival = () => {
      // Activate the line
      if (this._lineStates[idx] !== S_SEVERED) this._lineActive[idx] = true;
      // Wait at source 2-4 s, then return to UK
      this._farageTarget    = null;
      this._farageOnArrival = null;
      this.time.delayedCall(2000 + Math.random() * 2000, () => {
        if (this._done) return;
        this._farageTarget    = { x: UK.x, y: UK.y };
        this._farageOnArrival = () => {
          // Brief pause at UK then pick next target
          this._farageTarget    = null;
          this._farageOnArrival = null;
          this.time.delayedCall(800 + Math.random() * 700, () => this._goToSource());
        };
      });
    };
  }

  _updateFarage(delta) {
    if (!this._farageTarget) return;

    const dx   = this._farageTarget.x - this._faragePos.x;
    const dy   = this._farageTarget.y - this._faragePos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 3) {
      this._faragePos.x = this._farageTarget.x;
      this._faragePos.y = this._farageTarget.y;
      const cb = this._farageOnArrival;
      this._farageTarget    = null;
      this._farageOnArrival = null;
      if (cb) cb();
    } else {
      const spd = 60 * (delta / 1000);
      this._faragePos.x += (dx / dist) * spd;
      this._faragePos.y += (dy / dist) * spd;
    }

    this._drawFarage();
  }

  // ─── Win / Lose ──────────────────────────────────────────────────────────

  _checkWin() {
    if (this._lineStates.every(s => s === S_SEVERED)) {
      this._done = true;
      this._showOutcome(true);
    }
  }

  _checkLose() {
    if (!this._done && this._funding >= TOTAL_GOAL) {
      this._done = true;
      this._showOutcome(false);
    }
  }

  _showOutcome(won) {
    this._farageGfx.clear();
    this._binfaceGfx.clear();

    this.add.rectangle(0, 0, W, H, 0x000000, 0.82).setOrigin(0).setDepth(60);
    const col   = won ? '#00ff88' : '#ff2222';
    const title = won ? 'MONEY SEVERED!' : 'DARK MONEY WINS!';
    const sub   = won
      ? 'Count Binface cut all the funding lines!\nLevel 1 Complete — Press any key / tap to continue'
      : `£5 million in dark money raised!\nFarage wins this round.\nPress any key / tap to try again`;

    this.add.text(W / 2, H / 2 - 64, title, {
      font: 'bold 36px monospace', fill: col, stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(61);

    this.add.text(W / 2, H / 2 + 8, sub, {
      font: '15px monospace', fill: '#ffffff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(61);

    this.time.delayedCall(600, () => {
      this.input.keyboard.once('keydown', () => won ? this.scene.start('Level2') : this.scene.restart());
      this.input.once('pointerdown',      () => won ? this.scene.start('Level2') : this.scene.restart());
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(_time, delta) {
    if (this._done) return;

    // Advance pulse timers
    for (let i = 0; i < SOURCES.length; i++) this._linePulse[i] += delta * 0.003;

    // Accumulate funding from active, non-severed lines
    let activeFunding = 0;
    for (let i = 0; i < SOURCES.length; i++) {
      if (this._lineActive[i] && this._lineStates[i] !== S_SEVERED) activeFunding++;
    }
    if (activeFunding > 0) this._funding += (FUNDING_RATE_PER_SEC * activeFunding * delta) / 1000;

    this._redrawLines();
    this._updateFarage(delta);

    // Smooth Binface movement toward pointer
    const { x: bx, y: by } = this._binfacePos;
    const tdx  = this._binfaceTarget.x - bx;
    const tdy  = this._binfaceTarget.y - by;
    const tdst = Math.hypot(tdx, tdy);
    if (tdst > 1) {
      const step = Math.min(130 * (delta / 1000), tdst);
      this._binfacePos.x += (tdx / tdst) * step;
      this._binfacePos.y += (tdy / tdst) * step;
    }
    this._drawBinface();

    this._updateHUD();
    this._checkLose();
  }
}
