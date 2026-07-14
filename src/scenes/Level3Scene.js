import Phaser from 'phaser';

const TIMER_MS = 14000;
const WIN_SCORE = 5;
const LOSE_PINTS = 5;

const ALL_QUESTIONS = [
  {
    q: 'Which of these is an actual Reform UK manifesto pledge?',
    opts: [
      'Rename the English Channel the "Farage Strait"',
      'Abolish inheritance tax for estates under £2 million',
      'Replace the BBC with a Wetherspoons loyalty scheme',
      'Mandate full English breakfasts in all schools',
    ],
    correct: 1,
  },
  {
    q: 'Real Reform pledge or one we invented?',
    opts: [
      'Scrap net zero and the 2050 climate target',
      'Replace wind turbines with giant Union Jack flags',
      'Make coal the official fuel of England',
      'Burn the Paris Agreement to heat Number 10',
    ],
    correct: 0,
  },
  {
    q: 'Which did Farage actually promise voters?',
    opts: [
      'Build a physical wall around Clacton seafront',
      'Make swimming the Channel illegal for non-citizens',
      'Abolish the BBC licence fee',
      'Put a Reform logo on every British passport',
    ],
    correct: 2,
  },
  {
    q: 'Spot the real Reform UK policy:',
    opts: [
      'Tax all French cheese imported into the UK',
      'Reduce overseas foreign aid spending',
      'Replace UK embassies with Wetherspoons pubs',
      'Dispatch pints of bitter to Brussels as diplomacy',
    ],
    correct: 1,
  },
  {
    q: 'One of these is a genuine pledge. Which?',
    opts: [
      'Leave the European Convention on Human Rights',
      'Ban hummus from all government buildings',
      'Rename Big Ben "Reform Ben"',
      'Make English the official language of the North Sea',
    ],
    correct: 0,
  },
  {
    q: 'Which did Reform actually put in writing?',
    opts: [
      'Give every voter a free pint on polling day',
      'Replace NHS management with pub landlords',
      'End all legal migration for five years',
      'Make Clacton the new capital of England',
    ],
    correct: 2,
  },
  {
    q: 'Real manifesto pledge or Farage fever dream?',
    opts: [
      'Tax foreigners a pint per air mile entering the UK',
      'Cut corporation tax to 20% immediately',
      'Make Nigel Farage honorary King of the Pub',
      'Charge EU citizens a "Britain Premium" at the border',
    ],
    correct: 1,
  },
  {
    q: "Which is genuinely from Reform's 2024 manifesto?",
    opts: [
      'Give everyone a free pint on the NHS',
      'Replace A&E departments with pub first-aid stations',
      'Recruit 13,000 more NHS GPs within two years',
      'Make doctors wear Union Jack bow ties',
    ],
    correct: 2,
  },
];

const LABEL = ['A', 'B', 'C', 'D'];
const BTN_COLS = [0x1a3a8a, 0x8a1a1a, 0x1a6a1a, 0x6a4a1a];
const BTN_HOVER = [0x2a5acc, 0xcc2a2a, 0x2aaa2a, 0xaa7a2a];

export default class Level3Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level3' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._genTextures(W, H);
    this._drawBg(W, H);

    this.score = 0;
    this.pints = 0;
    this.over = false;
    this.answering = false;
    this._questions = Phaser.Utils.Array.Shuffle([...ALL_QUESTIONS]);
    this.qIdx = 0;

    this._buildHUD(W, H);
    this._buildCharacters(W, H);
    this._buildQuizPanel(W, H);

    this._nextQuestion();
  }

  update() {
    if (this.over || this.answering) return;
    if (!this._timerStart) return;

    const elapsed = this.time.now - this._timerStart;
    const frac = Math.max(0, 1 - elapsed / TIMER_MS);
    this._timerBar.setScale(frac, 1);
    this._timerBar.setFillStyle(frac > 0.4 ? 0x00cc44 : frac > 0.2 ? 0xffaa00 : 0xff2200);

    if (elapsed >= TIMER_MS) {
      this._onTimeout();
    }
  }

  _genTextures(W, H) {
    if (this.textures.exists('l3_farage_idle')) return;

    // Farage at podium - idle frame
    const fg = this.make.graphics({ add: false });
    // Podium
    fg.fillStyle(0x5c3d1e);
    fg.fillRect(8, 52, 48, 36);
    fg.fillStyle(0x7a5230);
    fg.fillRect(6, 50, 52, 6);
    // Reform logo on podium
    fg.fillStyle(0x1a3a8a);
    fg.fillRect(12, 60, 40, 20);
    fg.fillStyle(0xffffff);
    fg.fillRect(14, 62, 36, 3);
    fg.fillRect(14, 70, 36, 3);
    // Body / suit
    fg.fillStyle(0x1a3a6b);
    fg.fillRect(16, 24, 32, 28);
    // Pink shirt (between lapels)
    fg.fillStyle(0xf0b4c4);
    fg.fillRect(25, 24, 14, 26);
    // REFORM blue tie
    fg.fillStyle(0x2a7cc8);
    fg.fillRect(28, 24, 8, 20);
    fg.fillTriangle(26, 44, 38, 44, 32, 54);
    // Tie stripes (lighter blue)
    fg.fillStyle(0x5aa8f0);
    fg.fillRect(29, 28, 6, 3);
    fg.fillRect(29, 34, 6, 3);
    fg.fillRect(29, 40, 6, 3);
    // Arms
    fg.fillStyle(0x1a3a6b);
    fg.fillRect(6, 24, 10, 20);
    fg.fillRect(48, 24, 10, 20);
    // Face (ruddy orange)
    fg.fillStyle(0xd4956a);
    fg.fillRect(18, 2, 28, 22);
    // Grey swept hair
    fg.fillStyle(0x9a9a9a);
    fg.fillRect(16, 0, 32, 6);
    fg.fillRect(16, 2, 4, 18);
    // Hair highlight
    fg.fillStyle(0xc4c4c4);
    fg.fillRect(20, 1, 12, 3);
    // Eyes (smug)
    fg.fillStyle(0x1a1a1a);
    fg.fillRect(22, 9, 5, 4);
    fg.fillRect(37, 9, 5, 4);
    // Smirk
    fg.fillStyle(0xcc8844);
    fg.fillRect(22, 18, 20, 3);
    // Pint (left hand)
    fg.fillStyle(0xe0e0e0);
    fg.fillRect(4, 34, 10, 16);
    fg.fillStyle(0xf5c518);
    fg.fillRect(5, 36, 8, 12);
    fg.fillStyle(0xffffff);
    fg.fillRect(5, 34, 8, 4);
    // Cigarette
    fg.fillStyle(0xfafafa);
    fg.fillRect(58, 30, 12, 3);
    fg.fillStyle(0xff4400);
    fg.fillRect(68, 29, 4, 5);

    fg.generateTexture('l3_farage_idle', 72, 90);
    fg.destroy();

    // Farage sputter frame (correct answer reaction)
    const fgs = this.make.graphics({ add: false });
    fgs.fillStyle(0x5c3d1e);
    fgs.fillRect(8, 52, 48, 36);
    fgs.fillStyle(0x7a5230);
    fgs.fillRect(6, 50, 52, 6);
    fgs.fillStyle(0x1a3a8a);
    fgs.fillRect(12, 60, 40, 20);
    fgs.fillStyle(0x1a3a6b);
    fgs.fillRect(16, 24, 32, 28);
    fgs.fillStyle(0xf0b4c4); // pink shirt
    fgs.fillRect(25, 24, 14, 26);
    fgs.fillStyle(0x2a7cc8); // REFORM blue tie
    fgs.fillRect(28, 24, 8, 20);
    fgs.fillTriangle(26, 44, 38, 44, 32, 54);
    fgs.fillStyle(0x5aa8f0); // tie stripes
    fgs.fillRect(29, 28, 6, 3);
    fgs.fillRect(29, 34, 6, 3);
    fgs.fillRect(29, 40, 6, 3);
    fgs.fillStyle(0x1a3a6b);
    fgs.fillRect(6, 24, 10, 20);
    fgs.fillRect(48, 24, 10, 20);
    fgs.fillStyle(0xd4956a); // ruddy face
    fgs.fillRect(18, 2, 28, 22);
    fgs.fillStyle(0x9a9a9a); // grey hair
    fgs.fillRect(16, 0, 32, 6);
    fgs.fillRect(16, 2, 4, 18);
    fgs.fillStyle(0xc4c4c4);
    fgs.fillRect(20, 1, 12, 3);
    // Shocked eyes (wider)
    fgs.fillStyle(0x1a1a1a);
    fgs.fillRect(21, 8, 7, 6);
    fgs.fillRect(36, 8, 7, 6);
    fgs.fillStyle(0xffffff);
    fgs.fillRect(22, 9, 2, 2);
    fgs.fillRect(37, 9, 2, 2);
    // Open mouth (shocked)
    fgs.fillStyle(0x8b4513);
    fgs.fillEllipse(32, 19, 12, 8);
    // Beer spray
    fgs.fillStyle(0xf5c518, 0.8);
    for (let i = 0; i < 6; i++) {
      fgs.fillCircle(46 + i * 5, 18 - i * 2, 3 - i * 0.3);
    }
    fgs.fillStyle(0xe0e0e0);
    fgs.fillRect(4, 34, 10, 16);
    fgs.fillStyle(0xf5c518);
    fgs.fillRect(5, 36, 8, 12);
    fgs.fillStyle(0xffffff);
    fgs.fillRect(5, 34, 8, 4);
    fgs.generateTexture('l3_farage_sputter', 72, 90);
    fgs.destroy();

    // Farage drinking frame (wrong answer)
    const fgd = this.make.graphics({ add: false });
    fgd.fillStyle(0x5c3d1e);
    fgd.fillRect(8, 52, 48, 36);
    fgd.fillStyle(0x7a5230);
    fgd.fillRect(6, 50, 52, 6);
    fgd.fillStyle(0x1a3a8a);
    fgd.fillRect(12, 60, 40, 20);
    fgd.fillStyle(0x1a3a6b);
    fgd.fillRect(16, 24, 32, 28);
    fgd.fillStyle(0xf0b4c4); // pink shirt
    fgd.fillRect(25, 24, 14, 26);
    fgd.fillStyle(0x2a7cc8); // REFORM blue tie
    fgd.fillRect(28, 24, 8, 20);
    fgd.fillTriangle(26, 44, 38, 44, 32, 54);
    fgd.fillStyle(0x5aa8f0); // tie stripes
    fgd.fillRect(29, 28, 6, 3);
    fgd.fillRect(29, 34, 6, 3);
    fgd.fillRect(29, 40, 6, 3);
    fgd.fillStyle(0x1a3a6b);
    fgd.fillRect(6, 24, 10, 20);
    fgd.fillRect(48, 24, 10, 20);
    fgd.fillStyle(0xd4956a); // ruddy face
    fgd.fillRect(18, 2, 28, 22);
    fgd.fillStyle(0x9a9a9a); // grey hair
    fgd.fillRect(16, 0, 32, 6);
    fgd.fillRect(16, 2, 4, 18);
    fgd.fillStyle(0xc4c4c4);
    fgd.fillRect(20, 1, 12, 3);
    // Squinting smug eyes
    fgd.fillStyle(0x1a1a1a);
    fgd.fillRect(22, 10, 5, 3);
    fgd.fillRect(37, 10, 5, 3);
    // Big grin
    fgd.fillStyle(0xcc8844);
    fgd.fillRect(20, 17, 24, 4);
    fgd.fillRect(20, 17, 4, 2);
    fgd.fillRect(40, 17, 4, 2);
    // Pint raised to mouth
    fgd.fillStyle(0xe0e0e0);
    fgd.fillRect(2, 8, 10, 16);
    fgd.fillStyle(0xf5c518);
    fgd.fillRect(3, 10, 8, 12);
    fgd.fillStyle(0xffffff);
    fgd.fillRect(3, 8, 8, 4);
    fgd.generateTexture('l3_farage_drink', 72, 90);
    fgd.destroy();

    // Binface sprite (small, side-panel)
    const bf = this.make.graphics({ add: false });
    bf.fillStyle(0x606060);
    bf.fillRect(10, 54, 10, 14);
    bf.fillRect(26, 54, 10, 14);
    bf.fillStyle(0xa8a8a8);
    bf.fillRect(8, 30, 28, 24);
    bf.fillStyle(0x909090);
    bf.fillRect(2, 32, 6, 12);
    bf.fillRect(36, 32, 6, 12);
    bf.fillStyle(0xc8c8c8);
    bf.fillRect(10, 8, 24, 22);
    bf.fillRect(8, 18, 28, 10);
    bf.fillStyle(0x888888);
    bf.fillRect(6, 22, 32, 6);
    bf.fillStyle(0x00aadd);
    bf.fillRect(12, 10, 20, 9);
    bf.fillStyle(0x007799);
    bf.fillRect(12, 10, 3, 9);
    bf.fillRect(29, 10, 3, 9);
    bf.fillStyle(0xffffff, 0.55);
    bf.fillRect(14, 11, 5, 3);
    bf.generateTexture('l3_binface', 44, 70);
    bf.destroy();

    // Correct checkmark icon
    const ck = this.make.graphics({ add: false });
    ck.fillStyle(0x00cc44);
    ck.fillCircle(16, 16, 16);
    ck.fillStyle(0xffffff);
    ck.fillRect(6, 14, 6, 6);
    ck.fillRect(10, 18, 14, 6);
    ck.generateTexture('l3_correct', 32, 32);
    ck.destroy();

    // Wrong X icon
    const xk = this.make.graphics({ add: false });
    xk.fillStyle(0xcc2222);
    xk.fillCircle(16, 16, 16);
    xk.fillStyle(0xffffff);
    xk.fillRect(8, 14, 16, 4);
    xk.generateTexture('l3_wrong', 32, 32);
    xk.destroy();
  }

  _drawBg(W, H) {
    const g = this.add.graphics().setDepth(0);

    // Pub ceiling / walls
    g.fillStyle(0x2a1a0a);
    g.fillRect(0, 0, W, H);

    // Dark wood floor
    g.fillStyle(0x3d2010);
    g.fillRect(0, H * 0.68, W, H * 0.32);
    for (let i = 0; i < W; i += 60) {
      g.fillStyle(0x4a2815);
      g.fillRect(i, H * 0.68, 2, H * 0.32);
    }

    // Spotlight from ceiling on Farage
    g.fillStyle(0xfffbe0, 0.12);
    g.fillTriangle(W * 0.22, 0, W * 0.06, H * 0.7, W * 0.38, H * 0.7);

    // Pub decor: mounted fish
    g.fillStyle(0x5a8a4a);
    g.fillEllipse(W * 0.72, H * 0.16, 80, 24);
    g.fillTriangle(W * 0.76, H * 0.12, W * 0.76, H * 0.2, W * 0.82, H * 0.16);
    g.fillStyle(0x333333);
    g.fillCircle(W * 0.69, H * 0.16, 4);

    // Framed portrait (Reform logo)
    g.fillStyle(0x7a5c30);
    g.fillRect(W * 0.04, H * 0.08, 68, 84);
    g.fillStyle(0x1a3a8a);
    g.fillRect(W * 0.04 + 4, H * 0.08 + 4, 60, 76);
    g.fillStyle(0xffffff);
    g.fillRect(W * 0.04 + 10, H * 0.08 + 20, 48, 4);
    g.fillRect(W * 0.04 + 10, H * 0.08 + 32, 48, 4);
    g.fillRect(W * 0.04 + 10, H * 0.08 + 44, 36, 4);

    // Dartboard (back wall)
    g.fillStyle(0xcc0000);
    g.fillCircle(W * 0.88, H * 0.2, 32);
    g.fillStyle(0x111111);
    g.fillCircle(W * 0.88, H * 0.2, 24);
    g.fillStyle(0xcc0000);
    g.fillCircle(W * 0.88, H * 0.2, 16);
    g.fillStyle(0x111111);
    g.fillCircle(W * 0.88, H * 0.2, 8);
    g.fillStyle(0xff4444);
    g.fillCircle(W * 0.88, H * 0.2, 4);

    // Pub sign
    this.add
      .text(W / 2, 14, '— THE FARAGE ARMS: QUIZ NIGHT —', {
        font: 'bold 13px monospace',
        fill: '#d4af37',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  _buildCharacters(W, H) {
    // Farage at podium (left-centre area)
    this._fgSprite = this.add
      .image(W * 0.22, H * 0.54, 'l3_farage_idle')
      .setDepth(5)
      .setScale(1.8);

    // Speech bubble above Farage
    this._bubbleG = this.add.graphics().setDepth(6);
    this._bubbleText = this.add
      .text(W * 0.22, H * 0.2, '', {
        font: '10px monospace',
        fill: '#000000',
        wordWrap: { width: 120 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(7);

    // Binface (right side, watching)
    this.add.image(W * 0.88, H * 0.54, 'l3_binface').setDepth(5).setScale(1.6);

    this.add
      .text(W * 0.88, H * 0.68, 'BINFACE', {
        font: '10px monospace',
        fill: '#00ccff',
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  _drawSpeechBubble(cx, cy, w, h) {
    const g = this._bubbleG;
    g.clear();
    g.fillStyle(0xfffce0, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    g.lineStyle(2, 0x333333, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    // Tail pointing down-left toward Farage
    g.fillStyle(0xfffce0);
    g.fillTriangle(cx - 20, cy + h / 2, cx - 35, cy + h / 2 + 16, cx - 8, cy + h / 2);
    g.lineStyle(2, 0x333333);
    g.strokeTriangle(cx - 20, cy + h / 2, cx - 35, cy + h / 2 + 16, cx - 8, cy + h / 2);
  }

  _buildHUD(W, H) {
    const D = 50;

    // Top HUD bar background
    const hb = this.add.graphics().setDepth(D).setScrollFactor(0);
    hb.fillStyle(0x000000, 0.7);
    hb.fillRect(0, 0, W, 52);

    // Timer bar (full width, below HUD)
    this.add
      .rectangle(0, 52, W, 6, 0x333333)
      .setOrigin(0, 0)
      .setDepth(D)
      .setScrollFactor(0);
    this._timerBar = this.add
      .rectangle(0, 52, W, 6, 0x00cc44)
      .setOrigin(0, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);

    // Score label (left)
    this.add
      .text(8, 5, 'BINFACE', { font: '9px monospace', fill: '#00ccff' })
      .setDepth(D + 1)
      .setScrollFactor(0);
    this._scoreLabel = this.add
      .text(8, 18, '✓ 0 / 5', { font: 'bold 14px monospace', fill: '#00ff88' })
      .setDepth(D + 1)
      .setScrollFactor(0);

    // Pints label (right)
    this.add
      .text(W - 8, 5, 'FARAGE PINTS', { font: '9px monospace', fill: '#ff8800' })
      .setOrigin(1, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
    this._pintsLabel = this.add
      .text(W - 8, 18, '🍺 0 / 5', { font: 'bold 14px monospace', fill: '#ffcc00' })
      .setOrigin(1, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);

    // Timer text (centre)
    this.add
      .text(W / 2, 5, 'TIME', { font: '9px monospace', fill: '#888888' })
      .setOrigin(0.5, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
    this._timerText = this.add
      .text(W / 2, 18, '14', { font: 'bold 14px monospace', fill: '#cccccc' })
      .setOrigin(0.5, 0)
      .setDepth(D + 1)
      .setScrollFactor(0);
  }

  _buildQuizPanel(W, H) {
    // Question panel background
    const px = W * 0.33;
    const py = H * 0.1;
    const pw = W * 0.63;
    const ph = H * 0.34;

    this._panelG = this.add.graphics().setDepth(10);
    this._panelG.fillStyle(0x1a1a2e, 0.92);
    this._panelG.fillRoundedRect(px, py, pw, ph, 10);
    this._panelG.lineStyle(2, 0x4488ff, 1);
    this._panelG.strokeRoundedRect(px, py, pw, ph, 10);

    this._qText = this.add
      .text(px + pw / 2, py + 16, '', {
        font: 'bold 12px monospace',
        fill: '#ffffff',
        wordWrap: { width: pw - 24 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(11);

    // Answer buttons
    this._btnObjs = [];
    const bx = px + 12;
    const bw = pw - 24;
    const bh = 34;
    const bStartY = H * 0.46;
    const gap = 40;

    for (let i = 0; i < 4; i++) {
      const by = bStartY + i * gap;
      const btnBg = this.add
        .rectangle(bx, by, bw, bh, BTN_COLS[i])
        .setOrigin(0, 0)
        .setDepth(11)
        .setInteractive({ useHandCursor: true });

      const btnBorder = this.add.graphics().setDepth(12);
      btnBorder.lineStyle(1, 0xffffff, 0.3);
      btnBorder.strokeRect(bx, by, bw, bh);

      const btnLabel = this.add
        .text(bx + 10, by + bh / 2, '', {
          font: '11px monospace',
          fill: '#ffffff',
          wordWrap: { width: bw - 20 },
        })
        .setOrigin(0, 0.5)
        .setDepth(13);

      btnBg.on('pointerover', () => {
        if (!this.answering && !this.over) btnBg.setFillStyle(BTN_HOVER[i]);
      });
      btnBg.on('pointerout', () => {
        if (!this.answering && !this.over) btnBg.setFillStyle(BTN_COLS[i]);
      });
      btnBg.on('pointerdown', () => this._onAnswer(i));

      this._btnObjs.push({ bg: btnBg, label: btnLabel, border: btnBorder, y: by, h: bh, w: bw, x: bx });
    }

    // Keyboard shortcuts: A B C D or 1 2 3 4
    this.input.keyboard.on('keydown', (e) => {
      if (this.over || this.answering) return;
      const map = { KeyA: 0, Digit1: 0, KeyB: 1, Digit2: 1, KeyC: 2, Digit3: 2, KeyD: 3, Digit4: 3 };
      if (map[e.code] !== undefined) this._onAnswer(map[e.code]);
    });

    // Result feedback text
    this._resultText = this.add
      .text(W / 2, H * 0.86, '', {
        font: 'bold 18px monospace',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);
  }

  _nextQuestion() {
    if (this.over) return;
    this.answering = false;

    if (this.qIdx >= this._questions.length) {
      this._questions = Phaser.Utils.Array.Shuffle([...ALL_QUESTIONS]);
      this.qIdx = 0;
    }

    const q = this._questions[this.qIdx++];
    this._currentQ = q;

    this._qText.setText(q.q);

    for (let i = 0; i < 4; i++) {
      this._btnObjs[i].label.setText(`[${LABEL[i]}]  ${q.opts[i]}`);
      this._btnObjs[i].bg.setFillStyle(BTN_COLS[i]);
      this._btnObjs[i].bg.setInteractive();
    }

    // Speech bubble shows "Which is real, Binface?"
    const W = this.scale.width;
    const cy = this.scale.height * 0.2;
    this._drawSpeechBubble(W * 0.22, cy, 140, 48);
    this._bubbleText.setPosition(W * 0.22, cy);
    this._bubbleText.setText('Think you\nknow me?');

    this._fgSprite.setTexture('l3_farage_idle');

    // Update timer display
    this._timerBar.setScale(1, 1);
    this._timerText.setText('14');
    this._timerStart = this.time.now;

    // Update timer countdown text every second
    if (this._timerEvent) this._timerEvent.destroy();
    let remaining = Math.ceil(TIMER_MS / 1000);
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: Math.ceil(TIMER_MS / 1000) - 1,
      callback: () => {
        remaining -= 1;
        if (this._timerText && this._timerText.active) {
          this._timerText.setText(String(Math.max(0, remaining)));
        }
      },
    });
  }

  _onAnswer(idx) {
    if (this.over || this.answering) return;
    this.answering = true;
    this._timerStart = null;
    if (this._timerEvent) this._timerEvent.destroy();
    this._timerBar.setScale(0, 1);

    // Disable all buttons
    for (const b of this._btnObjs) b.bg.disableInteractive();

    const correct = idx === this._currentQ.correct;

    // Highlight correct and chosen
    for (let i = 0; i < 4; i++) {
      if (i === this._currentQ.correct) {
        this._btnObjs[i].bg.setFillStyle(0x00aa33);
      } else if (i === idx && !correct) {
        this._btnObjs[i].bg.setFillStyle(0xaa1111);
      }
    }

    if (correct) {
      this._onCorrect();
    } else {
      this._onWrong();
    }
  }

  _onTimeout() {
    if (this.over || this.answering) return;
    this.answering = true;
    this._timerStart = null;
    if (this._timerEvent) this._timerEvent.destroy();
    for (const b of this._btnObjs) b.bg.disableInteractive();
    // Show correct answer
    this._btnObjs[this._currentQ.correct].bg.setFillStyle(0x00aa33);
    this._onWrong(true);
  }

  _onCorrect() {
    this.score = Math.min(WIN_SCORE, this.score + 1);
    this._scoreLabel.setText(`✓ ${this.score} / 5`);

    this._fgSprite.setTexture('l3_farage_sputter');
    this._bubbleText.setText('That was\nreal?!');
    this._drawSpeechBubble(this.scale.width * 0.22, this.scale.height * 0.2, 140, 48);

    this._showResult('CORRECT!\nFarage splutters!', '#00ff88');

    this.time.delayedCall(1800, () => {
      this._fgSprite.setTexture('l3_farage_idle');
      if (this.score >= WIN_SCORE) {
        this._end(true);
      } else {
        this._nextQuestion();
      }
    });
  }

  _onWrong(timedOut = false) {
    this.pints = Math.min(LOSE_PINTS, this.pints + 1);
    this._pintsLabel.setText(`🍺 ${this.pints} / 5`);

    this._fgSprite.setTexture('l3_farage_drink');
    this._bubbleText.setText('Cheers!\nAnother pint!');
    this._drawSpeechBubble(this.scale.width * 0.22, this.scale.height * 0.2, 140, 48);

    const msg = timedOut
      ? `TIME'S UP!\nFarage drinks!`
      : `WRONG!\nFarage drinks!`;
    this._showResult(msg, '#ff6644');

    this.time.delayedCall(1800, () => {
      this._fgSprite.setTexture('l3_farage_idle');
      if (this.pints >= LOSE_PINTS) {
        this._end(false);
      } else {
        this._nextQuestion();
      }
    });
  }

  _showResult(msg, colour) {
    this._resultText.setText(msg).setColor(colour).setAlpha(1);
    this.tweens.add({
      targets: this._resultText,
      alpha: 0,
      delay: 1300,
      duration: 400,
    });
  }

  _end(playerWon) {
    if (this.over) return;
    this.over = true;

    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(70);

    const title = playerWon
      ? 'BINFACE WINS!\nPromises exposed!'
      : 'FARAGE WINS!\nHe drank five pints...';

    const sub = playerWon
      ? 'You spotted all the real pledges.\nVoters deserve to know.'
      : 'You ran out of time.\nFarage celebrated with a pint.';

    this.add
      .text(W / 2, H / 2 - 70, title, {
        font: 'bold 30px monospace',
        fill: playerWon ? '#00ff88' : '#ff4444',
        stroke: '#000',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(71);

    this.add
      .text(W / 2, H / 2 + 10, sub, {
        font: '14px monospace',
        fill: '#cccccc',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(71);

    this.add
      .text(W / 2, H / 2 + 80, 'TAP or press any key to return', {
        font: '14px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5)
      .setDepth(71);

    this.time.delayedCall(900, () => {
      this.input.keyboard.once('keydown', () => this.scene.start('Title'));
      this.input.once('pointerdown', () => this.scene.start('Title'));
    });
  }
}
