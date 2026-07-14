import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Title' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

    this.add
      .text(cx, cy - 80, 'FARAGE', {
        font: 'bold 64px monospace',
        fill: '#ff4444',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 20, 'VS', {
        font: 'bold 32px monospace',
        fill: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 40, 'COUNT BINFACE', {
        font: 'bold 48px monospace',
        fill: '#00ccff',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 120, 'CLACTON BY-ELECTION  •  13 AUG 2026', {
        font: '16px monospace',
        fill: '#888888',
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(cx, cy + 180, 'PRESS ANY KEY / TAP TO START', {
        font: '20px monospace',
        fill: '#ffff00',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown', () => this.scene.start('Cutscene'));
    this.input.once('pointerdown', () => this.scene.start('Cutscene'));
  }
}
