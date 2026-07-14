import Phaser from 'phaser';

// Sound hook stubs — replace with real WebAudio calls when assets exist
function sfx(/* key */) {}

const BINFACE_SPEED = 220;
const FARAGE_SPEED = 105;
const JUMP_VY = -530;
const MILK_SPEED = 390;
const BEER_SPEED = 310;
const MILK_DMG = 15;
const BEER_DMG = 10;
const SPLASH_DMG = 8;
const SPLASH_R = 82;
const PLAYER_FIRE_CD = 680;
const AI_FIRE_CD_BASE = 1900;
const BINFACE_HP_MAX = 120;
const FARAGE_HP_MAX = 150;

export default class Level2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._genTextures();
    this._drawBg(W, H);

    this.platforms = this.physics.add.staticGroup();
    this._buildPlatforms(W, H);

    // Characters
    this.binface = this.physics.add.sprite(120, H - 130, 'bf_i0');
    this.binface.setDepth(10);
    this.binface.body.setCollideWorldBounds(true);
    this.binface.body.setSize(34, 58);
    this.binface.body.setOffset(7, 7);

    this.farage = this.physics.add.sprite(W - 140, H - 130, 'fg_i0');
    this.farage.setDepth(10);
    this.farage.body.setCollideWorldBounds(true);
    this.farage.body.setSize(34, 58);
    this.farage.body.setOffset(9, 7);
    this.farage.setFlipX(true); // starts facing left (toward player)

    // Projectile groups
    this.milkshakes = this.physics.add.group();
    this.beers = this.physics.add.group();

    // Colliders
    this.physics.add.collider(this.binface, this.platforms);
    this.physics.add.collider(this.farage, this.platforms);

    this.physics.add.collider(this.milkshakes, this.platforms, (p) => {
      if (!p.active) return;
      sfx('milk_splat');
      p.destroy();
    });

    this.physics.add.collider(this.beers, this.platforms, (p) => {
      if (!p.active) return;
      this._beerSplash(p.x, p.y);
      p.destroy();
    });

    this.physics.add.overlap(this.milkshakes, this.farage, (p) => {
      if (!p.active) return;
      p.destroy();
      this._hurt('farage', MILK_DMG, p.x, p.y);
    });

    this.physics.add.overlap(this.beers, this.binface, (p) => {
      if (!p.active) return;
      this._beerSplash(p.x, p.y);
      p.destroy();
    });

    // Animations
    this._buildAnims();
    this.binface.play('bf_idle');
    this.farage.play('fg_idle');

    // HUD
    this._buildHUD(W);

    // Keyboard controls
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    // Touch / virtual d-pad
    this.touch = { left: false, right: false, jump: false, crouch: false, fire: false };
    this._buildTouch(W, H);

    // State
    this.bfHP = BINFACE_HP_MAX;
    this.fgHP = FARAGE_HP_MAX;
    this.playerCD = 0;
    this.aiCD = AI_FIRE_CD_BASE;
    this.over = false;

    // "FIGHT!" flash
    const ft = this.add
      .text(W / 2, H / 2, 'FIGHT!', {
        font: 'bold 72px monospace',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.time.delayedCall(900, () =>
      this.tweens.add({ targets: ft, alpha: 0, duration: 350, onComplete: () => ft.destroy() })
    );
  }

  update(_time, delta) {
    if (this.over) return;
    const W = this.scale.width;
    const H = this.scale.height;
    const dt = delta;

    // ── Player input ──
    const kl = this.keys.left.isDown || this.keys.a.isDown || this.touch.left;
    const kr = this.keys.right.isDown || this.keys.d.isDown || this.touch.right;
    const kj =
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w) ||
      this.touch.jump;
    const kc = this.keys.down.isDown || this.keys.s.isDown || this.touch.crouch;
    const kf =
      Phaser.Input.Keyboard.JustDown(this.keys.space) || this.touch.fire;
    this.touch.jump = false;
    this.touch.fire = false;

    const bfGnd = this.binface.body.blocked.down;

    if (kl && !kc) {
      this.binface.body.setVelocityX(-BINFACE_SPEED);
      this.binface.setFlipX(true);
      this.binface.play('bf_walk', true);
    } else if (kr && !kc) {
      this.binface.body.setVelocityX(BINFACE_SPEED);
      this.binface.setFlipX(false);
      this.binface.play('bf_walk', true);
    } else {
      this.binface.body.setVelocityX(0);
      this.binface.play(kc ? 'bf_crouch' : 'bf_idle', true);
    }

    if (kj && bfGnd) {
      this.binface.body.setVelocityY(JUMP_VY);
      sfx('jump');
    }

    this.playerCD -= dt;
    if (kf && this.playerCD <= 0) {
      this.playerCD = PLAYER_FIRE_CD;
      // Fire toward whichever direction Binface faces; flipX=true → facing left
      const dir = this.binface.flipX ? -1 : 1;
      this._fireMilkshake(this.binface.x + dir * 26, this.binface.y - 8, dir);
      sfx('fire_milk');
    }

    // ── Farage AI ──
    this._farageAI(dt);

    // ── Cull out-of-bounds projectiles ──
    const cull = (p) => {
      if (p.x < -80 || p.x > W + 80 || p.y > H + 80) p.destroy();
    };
    this.milkshakes.getChildren().forEach(cull);
    this.beers.getChildren().forEach(cull);

    // ── HUD update ──
    this.bfBar.setScale(Math.max(0, this.bfHP / BINFACE_HP_MAX), 1);
    this.fgBar.setScale(Math.max(0, this.fgHP / FARAGE_HP_MAX), 1);
  }

  // ─────────────────────────────────────────────────────────────
  // TEXTURE GENERATION  (programmatic pixel art via Phaser Graphics)
  // ─────────────────────────────────────────────────────────────

  _genTextures() {
    // Guard against re-generating on scene restart
    if (this.textures.exists('bf_i0')) return;

    // Binface frames
    this._genBfFrame('bf_i0', 'idle', 0);
    this._genBfFrame('bf_i1', 'idle', 1);
    this._genBfFrame('bf_w0', 'walk', 0);
    this._genBfFrame('bf_w1', 'walk', 1);
    this._genBfFrame('bf_w2', 'walk', 2);
    this._genBfFrame('bf_w3', 'walk', 3);
    this._genBfFrame('bf_c0', 'crouch', 0);

    // Farage frames
    this._genFgFrame('fg_i0', 'idle', 0);
    this._genFgFrame('fg_i1', 'idle', 1);
    this._genFgFrame('fg_w0', 'walk', 0);
    this._genFgFrame('fg_w1', 'walk', 1);
    this._genFgFrame('fg_w2', 'walk', 2);
    this._genFgFrame('fg_w3', 'walk', 3);

    // Milkshake projectile
    const mg = this.make.graphics({ add: false });
    mg.fillStyle(0xff69b4);
    mg.fillCircle(7, 7, 7);
    mg.fillStyle(0xffd1f2, 0.75);
    mg.fillCircle(5, 5, 3);
    mg.generateTexture('milk_proj', 14, 14);
    mg.destroy();

    // Beer projectile
    const bg = this.make.graphics({ add: false });
    bg.fillStyle(0xd4a017);
    bg.fillCircle(8, 8, 8);
    bg.fillStyle(0xfffbe6, 0.75);
    bg.fillCircle(6, 5, 3);
    bg.generateTexture('beer_proj', 16, 16);
    bg.destroy();

    // 1-pixel platform anchor
    const px = this.make.graphics({ add: false });
    px.fillStyle(0xffffff);
    px.fillRect(0, 0, 1, 1);
    px.generateTexture('_px', 1, 1);
    px.destroy();
  }

  _genBfFrame(key, state, frame) {
    const g = this.make.graphics({ add: false });

    // Legs
    g.fillStyle(0x606060);
    if (state === 'crouch') {
      g.fillRect(9, 50, 12, 10);
      g.fillRect(27, 50, 12, 10);
    } else {
      const lb = frame % 2 === 0 ? 0 : 4;
      g.fillRect(11, 54, 10, 14 + lb);
      g.fillRect(27, 54, 10, 14 + (lb ? 0 : 4));
    }

    // Body
    g.fillStyle(0xa8a8a8);
    g.fillRect(10, 28, 28, 26);

    // Arms
    g.fillStyle(0x909090);
    g.fillRect(2, 30, 8, 14);
    g.fillRect(38, 30, 8, 14);

    // Milkshake hose nozzle (right)
    g.fillStyle(0xff69b4);
    g.fillRect(40, 34, 8, 5);
    g.fillStyle(0xcc0066);
    g.fillCircle(47, 36, 4);

    // Bin head
    g.fillStyle(0xc8c8c8);
    g.fillRect(12, 6, 24, 22);
    g.fillRect(10, 18, 28, 10);

    // Lid
    g.fillStyle(0x888888);
    g.fillRect(8, 22, 32, 6);

    // Visor
    g.fillStyle(0x00aadd);
    g.fillRect(14, 9, 20, 9);
    g.fillStyle(0x007799);
    g.fillRect(14, 9, 3, 9);
    g.fillRect(31, 9, 3, 9);

    // Visor highlight
    g.fillStyle(0xffffff, 0.55);
    g.fillRect(16, 10, 5, 3);

    g.generateTexture(key, 48, 72);
    g.destroy();
  }

  _genFgFrame(key, state, frame) {
    const g = this.make.graphics({ add: false });

    // Legs / shoes
    g.fillStyle(0x0d2045);
    const lb = frame % 2 === 0 ? 0 : 5;
    g.fillRect(13, 56, 12, 14 + lb);
    g.fillRect(27, 56, 12, 14 + (lb ? 0 : 5));
    g.fillStyle(0x111111);
    g.fillRect(11, 68 + lb, 15, 4);
    g.fillRect(25, 68 + (lb ? 0 : 5), 15, 4);

    // Pink shirt (visible between lapels)
    g.fillStyle(0xf7a8b8);
    g.fillRect(20, 28, 12, 24);

    // Suit body (jacket over shirt)
    g.fillStyle(0x1a3a6b);
    g.fillRect(12, 28, 8, 26);   // left lapel
    g.fillRect(32, 28, 8, 26);   // right lapel

    // REFORM blue tie (diagonal stripe pattern)
    g.fillStyle(0x3a8fd4);
    g.fillRect(23, 28, 6, 20);
    g.fillTriangle(21, 48, 31, 48, 26, 58);
    // Tie stripe highlights
    g.fillStyle(0x1a5fa0);
    g.fillRect(24, 30, 2, 6);
    g.fillRect(24, 38, 2, 6);

    // Arms
    g.fillStyle(0x1a3a6b);
    g.fillRect(2, 28, 10, 22);
    g.fillRect(40, 28, 10, 22);

    // Pint glass (left hand)
    g.fillStyle(0xe0e0e0);
    g.fillRect(0, 44, 9, 16);
    g.fillStyle(0xf5c518);
    g.fillRect(1, 46, 7, 12);
    g.fillStyle(0xffffff);
    g.fillRect(1, 44, 7, 4);

    // Cigarette (right hand)
    g.fillStyle(0xfafafa);
    g.fillRect(50, 40, 10, 3);
    g.fillStyle(0xff4400);
    g.fillRect(58, 39, 4, 5);
    g.fillStyle(0xaaaaaa, 0.65);
    g.fillRect(59, 31, 2, 9);
    g.fillRect(61, 27, 2, 6);

    // Beer hose (right arm)
    g.fillStyle(0xd4a017);
    g.fillRect(40, 34, 12, 4);
    g.fillStyle(0xf5a623);
    g.fillCircle(51, 36, 4);

    // Ruddy face (matching reference)
    g.fillStyle(0xeca070);
    g.fillRect(14, 4, 24, 24);

    // Grey swept hair (matching reference)
    g.fillStyle(0xa0a09a);
    g.fillRect(12, 2, 28, 6);
    g.fillRect(12, 4, 4, 14);
    // Hair highlight
    g.fillStyle(0xd0d0cc);
    g.fillRect(18, 3, 10, 2);

    // Ears
    g.fillStyle(0xe8b870);
    g.fillRect(10, 10, 4, 8);
    g.fillRect(38, 10, 4, 8);

    // Eyes
    g.fillStyle(0x1a1a1a);
    g.fillRect(18, 12, 5, 5);
    g.fillRect(29, 12, 5, 5);
    g.fillStyle(0x4466ff, 0.4);
    g.fillRect(19, 13, 2, 2);
    g.fillRect(30, 13, 2, 2);

    // Smug smirk
    g.fillStyle(0xcc8844);
    g.fillRect(18, 21, 14, 3);
    g.fillStyle(0xff9966);
    g.fillRect(22, 22, 4, 2);

    // Jowls
    g.fillStyle(0xe8a860, 0.5);
    g.fillRect(11, 20, 4, 6);
    g.fillRect(37, 20, 4, 6);

    g.generateTexture(key, 52, 72);
    g.destroy();
  }

  // ─────────────────────────────────────────────────────────────
  // ANIMATIONS
  // ─────────────────────────────────────────────────────────────

  _buildAnims() {
    if (this.anims.exists('bf_idle')) return;

    this.anims.create({
      key: 'bf_idle',
      frames: [{ key: 'bf_i0' }, { key: 'bf_i1' }],
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'bf_walk',
      frames: [
        { key: 'bf_w0' },
        { key: 'bf_w1' },
        { key: 'bf_w2' },
        { key: 'bf_w3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'bf_crouch',
      frames: [{ key: 'bf_c0' }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: 'fg_idle',
      frames: [{ key: 'fg_i0' }, { key: 'fg_i1' }],
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'fg_walk',
      frames: [
        { key: 'fg_w0' },
        { key: 'fg_w1' },
        { key: 'fg_w2' },
        { key: 'fg_w3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND  (Clacton-on-Sea seaside theme)
  // ─────────────────────────────────────────────────────────────

  _drawBg(W, H) {
    const g = this.add.graphics().setDepth(0);

    // Sky
    g.fillStyle(0x87ceeb);
    g.fillRect(0, 0, W, H * 0.62);

    // Clouds
    g.fillStyle(0xffffff, 0.9);
    [
      [80, 58, 62, 26],
      [240, 44, 78, 30],
      [490, 68, 68, 24],
      [680, 48, 56, 22],
    ].forEach(([x, y, w, h]) => {
      g.fillEllipse(x, y, w, h);
      g.fillEllipse(x + 22, y - 9, w * 0.68, h * 0.78);
      g.fillEllipse(x - 16, y - 4, w * 0.58, h * 0.7);
    });

    // Sea strip
    g.fillStyle(0x1e90ff);
    g.fillRect(0, H * 0.59, W, H * 0.07);
    g.fillStyle(0x63b3ff, 0.38);
    for (let i = 0; i < W; i += 32) g.fillRect(i, H * 0.596, 20, 4);

    // Pier
    g.fillStyle(0x7a5c3a);
    g.fillRect(W * 0.41, H * 0.57, W * 0.21, 10);
    [W * 0.48, W * 0.57].forEach((px) => g.fillRect(px, H * 0.46, 8, H * 0.12));

    // Promenade / sand
    g.fillStyle(0xf0d090);
    g.fillRect(0, H * 0.66, W, H * 0.34);
    g.fillStyle(0xe0c070);
    g.fillRect(0, H * 0.66, W, 6);

    // Clacton buildings (background silhouette)
    const bldgs = [
      [35, H * 0.44, 68, H * 0.22, 0x9aabbf],
      [118, H * 0.37, 54, H * 0.29, 0x8a9baf],
      [535, H * 0.41, 64, H * 0.25, 0x9aabbf],
      [648, H * 0.35, 78, H * 0.31, 0x8a9baf],
      [718, H * 0.43, 52, H * 0.23, 0x9aabbf],
    ];
    bldgs.forEach(([x, y, w, h, col]) => {
      g.fillStyle(col);
      g.fillRect(x, y, w, h);
      g.fillStyle(0xfff8dc, 0.55);
      for (let row = 0; row < 3; row++) {
        for (let c = 0; c < 2; c++) {
          g.fillRect(x + 8 + c * (w / 2 - 5), y + 10 + row * 24, 10, 14);
        }
      }
      g.fillStyle(0x777777);
      g.fillRect(x + w / 2 - 6, y + h - 20, 12, 20);
    });

    // Ground
    g.fillStyle(0x2a1a0a);
    g.fillRect(0, H - 48, W, 48);
    g.fillStyle(0x3a2a1a);
    g.fillRect(0, H - 48, W, 6);

    // Seaside sign
    this.add
      .text(W / 2, 22, '— CLACTON-ON-SEA —', {
        font: 'bold 14px monospace',
        fill: '#d4af37',
      })
      .setOrigin(0.5)
      .setDepth(1);

    // Controls hint
    this.add
      .text(W / 2, H - 10, 'ARROWS/WASD: move  |  SPACE: fire milkshake', {
        font: '10px monospace',
        fill: '#887755',
      })
      .setOrigin(0.5)
      .setDepth(1);
  }

  // ─────────────────────────────────────────────────────────────
  // PLATFORMS
  // ─────────────────────────────────────────────────────────────

  _buildPlatforms(W, H) {
    const gnd = H - 48;
    const platDefs = [
      // [cx, cy, w, h, colour]
      [W / 2, gnd + 24, W, 48, 0x2a1a0a],     // ground
      [160, gnd - 100, 180, 16, 0x5c4030],     // left low
      [400, gnd - 192, 160, 16, 0x6c5040],     // centre mid
      [620, gnd - 100, 180, 16, 0x5c4030],     // right low
      [230, gnd - 292, 140, 16, 0x7c6050],     // left high
      [560, gnd - 292, 140, 16, 0x7c6050],     // right high
      [400, gnd - 375, 180, 16, 0x8c7060],     // top centre
    ];

    const g = this.add.graphics().setDepth(2);
    platDefs.forEach(([cx, cy, w, h, col]) => {
      g.fillStyle(col);
      g.fillRect(cx - w / 2, cy - h / 2, w, h);
      g.fillStyle(0xffffff, 0.13);
      g.fillRect(cx - w / 2, cy - h / 2, w, 3);

      const p = this.platforms.create(cx, cy, '_px').setVisible(false);
      p.body.setSize(w, h);
      p.refreshBody();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PROJECTILES
  // ─────────────────────────────────────────────────────────────

  _fireMilkshake(x, y, dir) {
    const p = this.milkshakes.create(x, y, 'milk_proj');
    // Gentle upward arc — gravity counteracted by -250
    p.body.setGravityY(-250);
    p.body.setVelocity(dir * MILK_SPEED, -110);
    p.setDepth(9);
  }

  _fireBeer(x, y, dir) {
    const p = this.beers.create(x, y, 'beer_proj');
    p.body.setVelocity(dir * BEER_SPEED, -65);
    p.setDepth(9);
  }

  _beerSplash(x, y) {
    sfx('beer_splash');

    // Visual shockwave ring
    const sg = this.add.graphics().setDepth(12);
    sg.lineStyle(3, 0xd4a017, 1);
    sg.strokeCircle(0, 0, 10);
    sg.setPosition(x, y);
    this.tweens.add({
      targets: sg,
      scaleX: SPLASH_R / 10,
      scaleY: SPLASH_R / 10,
      alpha: 0,
      duration: 450,
      onComplete: () => sg.destroy(),
    });

    // Floating text
    const t = this.add
      .text(x, y - 18, 'SPLOSH!', { font: '11px monospace', fill: '#f5a623' })
      .setOrigin(0.5)
      .setDepth(13);
    this.tweens.add({
      targets: t,
      y: y - 52,
      alpha: 0,
      duration: 650,
      onComplete: () => t.destroy(),
    });

    // AOE damage on Binface
    const d = Phaser.Math.Distance.Between(x, y, this.binface.x, this.binface.y);
    if (d < SPLASH_R) this._hurt('binface', SPLASH_DMG, x, y);
  }

  // ─────────────────────────────────────────────────────────────
  // FARAGE AI
  // ─────────────────────────────────────────────────────────────

  _farageAI(dt) {
    if (this.over) return;
    const f = this.farage;
    const b = this.binface;
    const dx = b.x - f.x;
    const onGround = f.body.blocked.down;

    // Move toward player
    if (Math.abs(dx) > 90) {
      f.body.setVelocityX(dx > 0 ? FARAGE_SPEED : -FARAGE_SPEED);
      f.setFlipX(dx < 0); // flipX=true → facing left; flipX=false → facing right
      f.play('fg_walk', true);
    } else {
      f.body.setVelocityX(0);
      f.play('fg_idle', true);
    }

    // Occasional random jump
    if (onGround && Math.random() < 0.004) {
      f.body.setVelocityY(JUMP_VY * 0.88);
      sfx('jump');
    }

    // Fire beer toward player
    this.aiCD -= dt;
    if (this.aiCD <= 0 && Math.abs(dx) < 520) {
      this.aiCD = AI_FIRE_CD_BASE + Math.random() * 900;
      const dir = dx >= 0 ? 1 : -1;
      f.setFlipX(dx < 0);
      this._fireBeer(f.x + dir * 28, f.y - 8, dir);
      sfx('fire_beer');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DAMAGE
  // ─────────────────────────────────────────────────────────────

  _hurt(who, amount, px, py) {
    if (this.over) return;

    if (who === 'farage') {
      this.fgHP = Math.max(0, this.fgHP - amount);
      this._flashTint(this.farage);
      this._floatDmg(px, py, amount, '#ff4444');
      sfx('hit_farage');
      if (this.fgHP <= 0) this._end(true);
    } else {
      this.bfHP = Math.max(0, this.bfHP - amount);
      this._flashTint(this.binface);
      this._floatDmg(px, py, amount, '#ff9966');
      sfx('hit_binface');
      if (this.bfHP <= 0) this._end(false);
    }
  }

  _flashTint(sprite) {
    sprite.setTint(0xff3333);
    this.time.delayedCall(130, () => {
      if (sprite.active) sprite.clearTint();
    });
  }

  _floatDmg(x, y, amount, colour) {
    const t = this.add
      .text(x, y - 28, `-${amount}`, {
        font: 'bold 16px monospace',
        fill: colour,
        stroke: '#000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: t,
      y: y - 72,
      alpha: 0,
      duration: 750,
      onComplete: () => t.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HUD
  // ─────────────────────────────────────────────────────────────

  _buildHUD(W) {
    const D = 40;

    // Semi-transparent panel
    const hudBg = this.add.graphics().setDepth(D).setScrollFactor(0);
    hudBg.fillStyle(0x000000, 0.5);
    hudBg.fillRect(0, 0, W, 46);

    // Binface health (left)
    this.add
      .text(8, 5, 'BINFACE', { font: '10px monospace', fill: '#00ccff' })
      .setDepth(D + 1)
      .setScrollFactor(0);
    this.add
      .rectangle(8, 20, 170, 14, 0x333333)
      .setOrigin(0, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
    this.bfBar = this.add
      .rectangle(8, 20, 170, 14, 0x00ccff)
      .setOrigin(0, 0)
      .setDepth(D + 2)
      .setScrollFactor(0);

    // Farage health (right)
    this.add
      .text(W - 8, 5, 'FARAGE', { font: '10px monospace', fill: '#ff8800' })
      .setOrigin(1, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
    this.add
      .rectangle(W - 178, 20, 170, 14, 0x333333)
      .setOrigin(0, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
    this.fgBar = this.add
      .rectangle(W - 178, 20, 170, 14, 0xff8800)
      .setOrigin(0, 0)
      .setDepth(D + 2)
      .setScrollFactor(0);
  }

  // ─────────────────────────────────────────────────────────────
  // TOUCH CONTROLS  (virtual d-pad)
  // ─────────────────────────────────────────────────────────────

  _buildTouch(W, H) {
    const t = this.touch;
    const alpha = 0.33;
    const r = 27;
    const bY = H - 48;
    const ts = { font: '17px monospace', fill: '#fff' };

    const mk = (x, y, col, label, down, up) => {
      const btn = this.add
        .circle(x, y, r, col, alpha)
        .setInteractive()
        .setDepth(45)
        .setScrollFactor(0);
      this.add.text(x, y, label, ts).setOrigin(0.5).setDepth(46).setScrollFactor(0);
      btn.on('pointerdown', down);
      if (up) {
        btn.on('pointerup', up);
        btn.on('pointerout', up);
      }
    };

    mk(48, bY, 0xffffff, '◀', () => { t.left = true; }, () => { t.left = false; });
    mk(115, bY, 0xffffff, '▶', () => { t.right = true; }, () => { t.right = false; });
    mk(W - 48, bY, 0x00ccff, '▲', () => { t.jump = true; });
    mk(W - 115, bY, 0x888888, '▼', () => { t.crouch = true; }, () => { t.crouch = false; });
    mk(W - 190, bY, 0xff69b4, 'FIRE', () => { t.fire = true; });
  }

  // ─────────────────────────────────────────────────────────────
  // END GAME
  // ─────────────────────────────────────────────────────────────

  _end(playerWon) {
    if (this.over) return;
    this.over = true;
    sfx(playerWon ? 'win' : 'lose');

    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setDepth(60);

    const msg = playerWon
      ? 'COUNT BINFACE WINS!\nFarage defunded!'
      : 'FARAGE WINS!\nClacton falls...';

    this.add
      .text(W / 2, H / 2 - 50, msg, {
        font: 'bold 34px monospace',
        fill: playerWon ? '#00ff88' : '#ff4444',
        stroke: '#000',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(61);

    this.add
      .text(W / 2, H / 2 + 60, 'TAP or press any key to return', {
        font: '16px monospace',
        fill: '#cccccc',
      })
      .setOrigin(0.5)
      .setDepth(61);

    this.time.delayedCall(900, () => {
      const next = playerWon ? 'Level3' : 'Title';
      this.input.keyboard.once('keydown', () => this.scene.start(next));
      this.input.once('pointerdown', () => this.scene.start(next));
    });
  }
}
