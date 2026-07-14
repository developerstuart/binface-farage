import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bar = this.add.graphics();
    const progress = this.add.graphics();
    const label = this.add
      .text(cx, cy - 40, 'Loading…', {
        font: '20px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    bar.fillStyle(0x222222).fillRect(cx - 200, cy - 10, 400, 20);

    this.load.on('progress', (value) => {
      progress.clear();
      progress.fillStyle(0x00ff88).fillRect(cx - 200, cy - 10, 400 * value, 20);
    });

    this.load.on('complete', () => {
      bar.destroy();
      progress.destroy();
      label.destroy();
    });
  }

  create() {
    this.scene.start('Title');
  }
}
