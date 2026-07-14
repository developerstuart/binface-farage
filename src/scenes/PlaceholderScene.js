import Phaser from 'phaser';

export default class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Placeholder' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0x111122).setOrigin(0);

    this.add
      .text(cx, cy - 40, '[ CUTSCENE / LEVEL COMING SOON ]', {
        font: '22px monospace',
        fill: '#00ff88',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 20, 'Scaffold verified — Phaser 3 + Vite', {
        font: '16px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 60, 'TAP / PRESS ESC to return to title', {
        font: '14px monospace',
        fill: '#555555',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ESC', () => this.scene.start('Title'));
    this.input.once('pointerdown', () => this.scene.start('Title'));
  }
}
