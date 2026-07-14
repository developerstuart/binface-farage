import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import OpeningCutscene from './scenes/OpeningCutscene.js';
import PlaceholderScene from './scenes/PlaceholderScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, OpeningCutscene, PlaceholderScene],
};

const game = new Phaser.Game(config);

game.events.once('ready', () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  }
});
