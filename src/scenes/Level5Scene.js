import Phaser from 'phaser';
import { sfx } from '../audio.js';

const W = 800;
const H = 600;

// Road geometry (top-down street view)
const ROAD_CY   = 295;
const ROAD_HALF = 68;

// Building window/door slots (where player places residents)
const SLOT_UPPER_Y = 140;
const SLOT_LOWER_Y = 460;
const SLOT_XS = [95, 180, 265, 350, 435, 520, 605, 690];
const SLOTS = [
  ...SLOT_XS.map(x => ({ x, y: SLOT_UPPER_Y })),
  ...SLOT_XS.map(x => ({ x, y: SLOT_LOWER_Y })),
];

// Game parameters
const PUB_X         = 62;
const POLL_X        = 738;
const FARAGE_SPEEDS = [72, 116, 158]; // px/s — run 1 / 2 / 3
const HITS_TO_STOP  = 3;
const STUN_MS       = 1800;
const BUDGET        = 5;             // residents per run
const RANGE_R       = 155;
const MILK_SPEED    = 215;
const FIRE_CD       = 2100;          // ms between shots per resident

export default class Level5Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level5' });
  }

  // ─────────────────────────────────────────────────────────────
  create() {
    this._over    = false;
    this._run     = 0;
    this._running = false;
    this._placed  = [];  // { slot, x, y, cd, img, active }
    this._projs   = [];  // { x, y, vx, vy, img }

    this._genTextures();
    this._drawBg();
    this._buildHUD();
    this._buildInput();

    this._rangeLyr = this.add.graphics().setDepth(8);
    this._charLyr  = this.add.graphics().setDepth(20);

    this._startRun();
  }

  // ─────────────────────────────────────────────────────────────
  // TEXTURES
  // ─────────────────────────────────────────────────────────────

  _genTextures() {
    if (this.textures.exists('l5_milk')) return;

    // Milkshake projectile
    const mg = this.make.graphics({ add: false });
    mg.fillStyle(0xff69b4);
    mg.fillCircle(8, 8, 8);
    mg.fillStyle(0xffe0f4, 0.75);
    mg.fillCircle(6, 5, 4);
    mg.generateTexture('l5_milk', 16, 16);
    mg.destroy();

    // Resident idle
    const rg = this.make.graphics({ add: false });
    rg.fillStyle(0x338833);
    rg.fillCircle(10, 12, 9);
    rg.fillStyle(0xddc8a0);
    rg.fillCircle(10, 5, 5);
    rg.fillStyle(0xffffff);
    rg.fillRect(7, 0, 6, 5);
    rg.fillStyle(0xff69b4);
    rg.fillEllipse(10, 1, 9, 4);
    rg.generateTexture('l5_resident', 20, 22);
    rg.destroy();

    // Resident active (in-range — pink tint)
    const ra = this.make.graphics({ add: false });
    ra.fillStyle(0xaa2255);
    ra.fillCircle(10, 12, 9);
    ra.fillStyle(0xeeccaa);
    ra.fillCircle(10, 5, 5);
    ra.fillStyle(0xffffff);
    ra.fillRect(7, 0, 6, 5);
    ra.fillStyle(0xff00aa);
    ra.fillEllipse(10, 1, 9, 4);
    ra.generateTexture('l5_res_act', 20, 22);
    ra.destroy();
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND
  // ─────────────────────────────────────────────────────────────

  _drawBg() {
    const g  = this.add.graphics().setDepth(0);
    const upBldgH = ROAD_CY - ROAD_HALF - 8; // 219px

    // Sky strip (visible behind upper building)
    g.fillStyle(0x87ceeb);
    g.fillRect(0, 0, W, H);

    // Upper building facade
    g.fillStyle(0x7a8b9f);
    g.fillRect(0, 0, W, upBldgH);

    // Upper brickwork
    g.fillStyle(0x6a7b8f, 0.35);
    for (let by = 16; by < upBldgH - 10; by += 22) {
      const off = (Math.floor(by / 22) % 2) * 22;
      for (let bx = -off; bx < W; bx += 44) g.fillRect(bx, by, 40, 18);
    }

    // Upper windows (centered on SLOT_UPPER_Y)
    const uWinTop = SLOT_UPPER_Y - 21;
    SLOT_XS.forEach(x => {
      g.fillStyle(0x3a4a5a);
      g.fillRect(x - 17, uWinTop, 34, 42);
      g.fillStyle(0xb8d8f0, 0.88);
      g.fillRect(x - 14, uWinTop + 3, 28, 35);
      // Mullion cross
      g.fillStyle(0x3a4a5a);
      g.fillRect(x - 1, uWinTop + 3, 2, 35);
      g.fillRect(x - 14, uWinTop + 20, 28, 2);
      // Sill
      g.fillStyle(0xc0c8d0);
      g.fillRect(x - 18, uWinTop + 38, 36, 5);
    });

    // Upper pavement
    g.fillStyle(0xa8b4bc);
    g.fillRect(0, upBldgH, W, 8);

    // Road (tarmac)
    g.fillStyle(0x2e2e3a);
    g.fillRect(0, ROAD_CY - ROAD_HALF, W, ROAD_HALF * 2);

    // Lane dashes
    g.fillStyle(0xdddd70, 0.5);
    for (let lx = 70; lx < W - 60; lx += 58) g.fillRect(lx, ROAD_CY - 4, 36, 8);

    // Lower pavement
    g.fillStyle(0xa8b4bc);
    g.fillRect(0, ROAD_CY + ROAD_HALF, W, 8);

    // Lower building facade
    const loBldgY = ROAD_CY + ROAD_HALF + 8;
    g.fillStyle(0x8a9baf);
    g.fillRect(0, loBldgY, W, H - loBldgY);

    // Lower brickwork
    g.fillStyle(0x7a8b9f, 0.35);
    for (let by = loBldgY + 10; by < H - 10; by += 22) {
      const off = (Math.floor(by / 22) % 2) * 22;
      for (let bx = -off; bx < W; bx += 44) g.fillRect(bx, by, 40, 18);
    }

    // Lower windows (centered on SLOT_LOWER_Y)
    const lWinTop = SLOT_LOWER_Y - 21;
    SLOT_XS.forEach(x => {
      g.fillStyle(0x3a4a5a);
      g.fillRect(x - 17, lWinTop, 34, 42);
      g.fillStyle(0xb8d8f0, 0.88);
      g.fillRect(x - 14, lWinTop + 3, 28, 35);
      g.fillStyle(0x3a4a5a);
      g.fillRect(x - 1, lWinTop + 3, 2, 35);
      g.fillRect(x - 14, lWinTop + 20, 28, 2);
      g.fillStyle(0xc0c8d0);
      g.fillRect(x - 18, lWinTop + 38, 36, 5);
    });

    // Pub (left — golden/brown)
    g.fillStyle(0x6a2a00);
    g.fillRect(0, 0, 60, H);
    g.fillStyle(0xd4921c);
    g.fillRect(4, ROAD_CY - 38, 52, 70);
    g.fillStyle(0x4a1a00);
    g.fillRect(4, ROAD_CY - 38, 52, 10);

    // Polling station (right — official blue/white)
    g.fillStyle(0x0a2252);
    g.fillRect(W - 60, 0, 60, H);
    g.fillStyle(0xf0f0f0);
    g.fillRect(W - 56, ROAD_CY - 38, 52, 70);
    g.fillStyle(0x0a2252);
    g.fillRect(W - 46, ROAD_CY + 20, 26, 20); // ballot box

    // Direction arrows on road
    this.add.text(W / 2, ROAD_CY, '► ► ► ► ►', {
      font: '13px monospace',
      fill: '#ffffff',
      alpha: 0.18,
    }).setOrigin(0.5).setDepth(1);

    // Labels (added as text objects so they render above graphics)
    this.add.text(30, ROAD_CY, 'PUB', {
      font: 'bold 11px monospace', fill: '#3a1a00',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(W - 30, ROAD_CY - 10, 'VOTE', {
      font: 'bold 9px monospace', fill: '#0a2252',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(W - 30, ROAD_CY + 4, 'HERE', {
      font: 'bold 9px monospace', fill: '#0a2252',
    }).setOrigin(0.5).setDepth(2);

    // Title
    this.add.text(W / 2, 13, 'PINT RUN  —  STOP FARAGE BEFORE HE VOTES!', {
      font: 'bold 12px monospace',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // Slot hint overlay
    this._slotHintGfx = this.add.graphics().setDepth(4);
    this._drawSlotHints();
  }

  _drawSlotHints() {
    this._slotHintGfx.clear();
    this._slotHintGfx.lineStyle(1, 0x00ff88, 0.35);
    for (const slot of SLOTS) {
      if (this._placed.some(r => r.slot === slot)) continue;
      this._slotHintGfx.strokeRect(slot.x - 16, slot.y - 20, 32, 40);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────

  _buildHUD() {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(0x000000, 0.65);
    g.fillRect(0, H - 40, W, 40);

    this._hudRun    = this.add.text(10, H - 30, '', { font: 'bold 14px monospace', fill: '#ffff88' }).setDepth(51);
    this._hudHits   = this.add.text(W / 2, H - 30, '', { font: 'bold 14px monospace', fill: '#ff69b4' }).setOrigin(0.5, 0).setDepth(51);
    this._hudBudget = this.add.text(W - 10, H - 30, '', { font: 'bold 14px monospace', fill: '#88ffff' }).setOrigin(1, 0).setDepth(51);
    this._hudHint   = this.add.text(W / 2, H - 12, 'TAP a window to place a milkshake thrower', { font: '10px monospace', fill: '#888888' }).setOrigin(0.5, 0).setDepth(51);

    // Hit pip indicators
    this._hitPips = [];
    for (let i = 0; i < HITS_TO_STOP; i++) {
      const pip = this.add.graphics().setDepth(51);
      this._hitPips.push(pip);
    }
  }

  _updateHUD() {
    this._hudRun.setText(`RUN ${this._run + 1}/3`);
    this._hudHits.setText(`HITS: ${this._hits}/${HITS_TO_STOP}`);
    this._hudBudget.setText(`THROWERS: ${this._budget}`);
    this._hitPips.forEach((pip, i) => {
      pip.clear();
      pip.fillStyle(i < this._hits ? 0xff69b4 : 0x444444);
      pip.fillRect(W / 2 - 40 + i * 30, H - 14, 22, 8);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // INPUT
  // ─────────────────────────────────────────────────────────────

  _buildInput() {
    this.input.on('pointerdown', (ptr) => {
      if (this._over || !this._running) return;
      this._tryPlace(ptr.x, ptr.y);
    });
  }

  _tryPlace(px, py) {
    if (this._budget <= 0) return;

    // Find nearest empty slot within 60px
    let best = null, bestD = 60;
    for (const slot of SLOTS) {
      if (this._placed.some(r => r.slot === slot)) continue;
      const d = Phaser.Math.Distance.Between(px, py, slot.x, slot.y);
      if (d < bestD) { best = slot; bestD = d; }
    }
    if (!best) return;

    this._budget--;
    sfx('reveal');

    const img = this.add.image(best.x, best.y, 'l5_resident').setDepth(15);
    this._placed.push({ slot: best, x: best.x, y: best.y, cd: 0, img, active: false });
    this._drawSlotHints();
    this._updateHUD();
  }

  // ─────────────────────────────────────────────────────────────
  // RUN MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  _startRun() {
    this._hits       = 0;
    this._stunTimer  = 0;
    this._guardAlive = true;
    this._budget     = BUDGET;
    this._running    = false;

    // Clear residents and projectiles from previous run
    this._placed.forEach(r => r.img.destroy());
    this._placed = [];
    this._projs.forEach(p => p.img.destroy());
    this._projs = [];
    this._rangeLyr.clear();
    this._charLyr.clear();
    this._drawSlotHints();

    // Reset Farage position
    this._farageX = PUB_X + 12;
    this._guardX  = this._farageX - 28;
    this._speed   = FARAGE_SPEEDS[this._run];

    this._updateHUD();
    this._drawChars();

    // Flash run label
    const speedLabels = ['SLOW', 'FASTER!', 'FASTEST!!'];
    const fl1 = this.add.text(W / 2, H / 2 - 32, `RUN ${this._run + 1}  of  3`, {
      font: 'bold 52px monospace', fill: '#ffff00', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(82);
    const fl2 = this.add.text(W / 2, H / 2 + 44, speedLabels[this._run], {
      font: 'bold 28px monospace', fill: '#ffcc44', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(82);

    this.time.delayedCall(1700, () => {
      this.tweens.add({
        targets: [fl1, fl2], alpha: 0, duration: 300,
        onComplete: () => { fl1.destroy(); fl2.destroy(); this._running = true; },
      });
    });
  }

  _winRun() {
    if (!this._running) return;
    this._running = false;
    sfx('sever');
    this._splashAt(this._farageX, ROAD_CY);

    const lbl = this.add.text(W / 2, H / 2 - 20, 'MILKSHAKED!', {
      font: 'bold 42px monospace', fill: '#ff69b4', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(82);
    const sub = this.add.text(W / 2, H / 2 + 38, `Run ${this._run + 1} stopped!`, {
      font: '22px monospace', fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(82);

    this.time.delayedCall(1900, () => {
      lbl.destroy(); sub.destroy();
      this._run++;
      if (this._run >= 3) {
        this._end(true);
      } else {
        this._startRun();
      }
    });
  }

  _failRun() {
    if (!this._running) return;
    this._running = false;
    sfx('lose');

    const lbl = this.add.text(W / 2, H / 2, 'FARAGE VOTED!', {
      font: 'bold 44px monospace', fill: '#ff4444', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(82);

    this.time.delayedCall(1100, () => { lbl.destroy(); this._end(false); });
  }

  _end(won) {
    if (this._over) return;
    this._over = true;
    this._running = false;
    sfx(won ? 'win' : 'lose');

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(88);

    const titleText = won
      ? 'BINFACE WINS!\nFarage soaked three times!'
      : 'FARAGE WINS!\nHe made it to the polls.';

    const subText = won
      ? 'The people of Clacton rose up.\nThree pints successfully wasted!'
      : 'Your milkshake throwers were outrun.\nFarage\'s pint remained unspilled.';

    this.add.text(W / 2, H / 2 - 85, titleText, {
      font: 'bold 30px monospace',
      fill: won ? '#00ff88' : '#ff4444',
      stroke: '#000000', strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setDepth(89);

    this.add.text(W / 2, H / 2 + 10, subText, {
      font: '15px monospace', fill: '#cccccc', align: 'center',
    }).setOrigin(0.5).setDepth(89);

    this.add.text(W / 2, H / 2 + 90, 'TAP or press any key to return', {
      font: '13px monospace', fill: '#888888',
    }).setOrigin(0.5).setDepth(89);

    this.time.delayedCall(900, () => {
      this.input.keyboard.once('keydown', () => this.scene.start('Title'));
      this.input.once('pointerdown', () => this.scene.start('Title'));
    });
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────

  update(_t, delta) {
    if (this._over || !this._running) return;
    const dt = delta / 1000;

    // Stun countdown
    if (this._stunTimer > 0) this._stunTimer -= delta;
    const stunned = this._stunTimer > 0;
    const speed   = stunned ? this._speed * 0.25 : this._speed;

    // Advance Farage (and guard tracks him)
    this._farageX += speed * dt;
    this._guardX   = this._farageX - 30;

    // Check if Farage reached the polling station
    if (this._farageX >= POLL_X) {
      this._failRun();
      return;
    }

    // Resident firing
    for (const r of this._placed) {
      const dist    = Phaser.Math.Distance.Between(r.x, r.y, this._farageX, ROAD_CY);
      const inRange = dist <= RANGE_R;

      if (inRange !== r.active) {
        r.active = inRange;
        r.img.setTexture(inRange ? 'l5_res_act' : 'l5_resident');
      }

      if (r.cd > 0) r.cd -= delta;
      if (inRange && r.cd <= 0) {
        r.cd = FIRE_CD;
        this._fireMilk(r.x, r.y);
      }
    }

    // Move projectiles + hit detection
    this._projs = this._projs.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.img.setPosition(p.x, p.y);

      // Bodyguard intercepts first
      if (this._guardAlive) {
        const gd = Phaser.Math.Distance.Between(p.x, p.y, this._guardX, ROAD_CY);
        if (gd < 22) {
          sfx('milk_splat');
          this._guardAlive = false;
          this._showSplat(this._guardX, ROAD_CY);
          p.img.destroy();
          return false;
        }
      }

      // Farage hit
      const fd = Phaser.Math.Distance.Between(p.x, p.y, this._farageX, ROAD_CY);
      if (fd < 22) {
        sfx('hit_farage');
        this._stunTimer = STUN_MS;
        this._hits++;
        this._showSplat(this._farageX, ROAD_CY);
        this._updateHUD();
        p.img.destroy();
        if (this._hits >= HITS_TO_STOP) this._winRun();
        return false;
      }

      // Cull out-of-bounds
      if (p.x < -24 || p.x > W + 24 || p.y < -24 || p.y > H + 24) {
        p.img.destroy();
        return false;
      }
      return true;
    });

    this._drawChars();
    this._drawRanges();
  }

  // ─────────────────────────────────────────────────────────────
  // PROJECTILES
  // ─────────────────────────────────────────────────────────────

  _fireMilk(fromX, fromY) {
    sfx('fire_milk');
    // Lead target slightly for better gameplay
    const lead = Math.min(80, this._speed * 0.35);
    const tx   = this._farageX + (fromX < this._farageX ? lead : -lead);
    const ty   = ROAD_CY;
    const dx   = tx - fromX;
    const dy   = ty - fromY;
    const len  = Math.hypot(dx, dy) || 1;

    const img = this.add.image(fromX, fromY, 'l5_milk').setDepth(26);
    this._projs.push({
      x: fromX, y: fromY,
      vx: (dx / len) * MILK_SPEED,
      vy: (dy / len) * MILK_SPEED,
      img,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────

  _showSplat(x, y) {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xff69b4, 0.85);
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 8 + Math.random() * 18;
      g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, 4 + Math.random() * 5);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 700, onComplete: () => g.destroy() });
  }

  _splashAt(x, y) {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xff69b4, 0.9);
    g.fillCircle(x, y, 26);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 22 + Math.random() * 30;
      g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r, 7 + Math.random() * 8);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 1400, onComplete: () => g.destroy() });
  }

  // ─────────────────────────────────────────────────────────────
  // CHARACTER RENDERING (top-down sprites via Graphics)
  // ─────────────────────────────────────────────────────────────

  _drawChars() {
    const g       = this._charLyr;
    const fx      = this._farageX;
    const fy      = ROAD_CY;
    const stunned = this._stunTimer > 0;
    g.clear();

    // ── Farage ──
    // Ground shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(fx, fy + 18, 34, 10);

    // Suit body (top-down silhouette)
    g.fillStyle(stunned ? 0x5599cc : 0x1a3a6b);
    g.fillEllipse(fx, fy, 34, 24);

    // Head
    g.fillStyle(0xeca070);
    g.fillCircle(fx, fy - 8, 12);

    // Grey hair (swept back arc)
    g.fillStyle(0xa0a09a);
    g.fillArc(fx, fy - 8, 12, 200, 340, false);

    // Face skin
    g.fillStyle(0xeca070);
    g.fillCircle(fx, fy - 6, 7);

    // Pint glass (left hand, top-down)
    g.fillStyle(0xe0e0e0, 0.88);
    g.fillRect(fx - 20, fy - 3, 7, 10);
    g.fillStyle(0xf5c518, 0.82);
    g.fillRect(fx - 19, fy - 1, 5, 7);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(fx - 19, fy - 3, 5, 3);

    // Milkshake stain when stunned
    if (stunned) {
      g.fillStyle(0xff69b4, 0.6);
      g.fillEllipse(fx + 2, fy - 6, 22, 16);
    }

    // ── Bodyguard ──
    if (this._guardAlive) {
      const gx = this._guardX;
      const gy = ROAD_CY + 7;

      // Shadow
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(gx, gy + 16, 28, 8);

      // Dark suit
      g.fillStyle(0x111111);
      g.fillEllipse(gx, gy, 26, 20);

      // Head
      g.fillStyle(0xc88050);
      g.fillCircle(gx, gy - 8, 9);

      // Sunglasses
      g.fillStyle(0x000000);
      g.fillRect(gx - 9, gy - 11, 18, 4);

      // Earpiece
      g.lineStyle(1, 0xffd700, 0.9);
      g.strokeCircle(gx + 9, gy - 7, 2);
      g.lineStyle(0);
    }
  }

  _drawRanges() {
    const g = this._rangeLyr;
    g.clear();
    for (const r of this._placed) {
      g.lineStyle(1, r.active ? 0xff69b4 : 0x44cc44, r.active ? 0.55 : 0.18);
      g.strokeCircle(r.x, r.y, RANGE_R);
    }
  }
}
