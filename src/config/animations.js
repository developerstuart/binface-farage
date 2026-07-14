/**
 * Phaser animation definitions for Farage and Count Binface.
 *
 * Usage:
 *   import { createFarageAnimations, createBinfaceAnimations } from './config/animations.js';
 *
 *   // In a Phaser Scene preload():
 *   this.load.atlas('farage', 'assets/sprites/farage.png', 'assets/sprites/farage-atlas.json');
 *   this.load.atlas('binface', 'assets/sprites/binface.png', 'assets/sprites/binface-atlas.json');
 *
 *   // In a Phaser Scene create():
 *   createFarageAnimations(this.anims);
 *   createBinfaceAnimations(this.anims);
 *
 *   // On a sprite:
 *   const farage = this.add.sprite(x, y, 'farage');
 *   farage.play('farage-idle');
 */

export function createFarageAnimations(anims) {
  // Idle — gentle sway holding pint
  anims.create({
    key: 'farage-idle',
    frames: [
      { key: 'farage', frame: 'idle-0' },
      { key: 'farage', frame: 'idle-1' },
    ],
    frameRate: 2,
    repeat: -1,
  });

  // Walk — strutting with pint
  anims.create({
    key: 'farage-walk',
    frames: [
      { key: 'farage', frame: 'walk-0' },
      { key: 'farage', frame: 'walk-1' },
      { key: 'farage', frame: 'walk-2' },
      { key: 'farage', frame: 'walk-3' },
    ],
    frameRate: 8,
    repeat: -1,
  });

  // Attack — throws beer froth / uses cigarette as flamethrower
  anims.create({
    key: 'farage-attack',
    frames: [
      { key: 'farage', frame: 'attack-0' },
      { key: 'farage', frame: 'attack-1' },
      { key: 'farage', frame: 'attack-2' },
    ],
    frameRate: 10,
    repeat: 0,
  });

  // Hurt — recoils, spills pint
  anims.create({
    key: 'farage-hurt',
    frames: [
      { key: 'farage', frame: 'hurt-0' },
      { key: 'farage', frame: 'hurt-1' },
    ],
    frameRate: 8,
    repeat: 0,
  });

  // Win — raises pint, triumphant
  anims.create({
    key: 'farage-win',
    frames: [
      { key: 'farage', frame: 'win-0' },
      { key: 'farage', frame: 'win-1' },
      { key: 'farage', frame: 'win-2' },
    ],
    frameRate: 4,
    repeat: -1,
  });
}

export function createBinfaceAnimations(anims) {
  // Idle — slight hover/bob
  anims.create({
    key: 'binface-idle',
    frames: [
      { key: 'binface', frame: 'idle-0' },
      { key: 'binface', frame: 'idle-1' },
    ],
    frameRate: 2,
    repeat: -1,
  });

  // Walk
  anims.create({
    key: 'binface-walk',
    frames: [
      { key: 'binface', frame: 'walk-0' },
      { key: 'binface', frame: 'walk-1' },
      { key: 'binface', frame: 'walk-2' },
      { key: 'binface', frame: 'walk-3' },
    ],
    frameRate: 8,
    repeat: -1,
  });

  // Jump — two-frame arc
  anims.create({
    key: 'binface-jump',
    frames: [
      { key: 'binface', frame: 'jump-0' },
      { key: 'binface', frame: 'jump-1' },
    ],
    frameRate: 6,
    repeat: 0,
  });

  // Attack — fires milkshake from hose
  anims.create({
    key: 'binface-attack',
    frames: [
      { key: 'binface', frame: 'attack-0' },
      { key: 'binface', frame: 'attack-1' },
      { key: 'binface', frame: 'attack-2' },
    ],
    frameRate: 10,
    repeat: 0,
  });

  // Hurt
  anims.create({
    key: 'binface-hurt',
    frames: [
      { key: 'binface', frame: 'hurt-0' },
      { key: 'binface', frame: 'hurt-1' },
    ],
    frameRate: 8,
    repeat: 0,
  });

  // Win — victory arms up
  anims.create({
    key: 'binface-win',
    frames: [
      { key: 'binface', frame: 'win-0' },
      { key: 'binface', frame: 'win-1' },
      { key: 'binface', frame: 'win-2' },
    ],
    frameRate: 4,
    repeat: -1,
  });
}

// ---------------------------------------------------------------------------
// Animation state machine helpers
// ---------------------------------------------------------------------------

export const FARAGE_ANIMS = {
  IDLE:   'farage-idle',
  WALK:   'farage-walk',
  ATTACK: 'farage-attack',
  HURT:   'farage-hurt',
  WIN:    'farage-win',
};

export const BINFACE_ANIMS = {
  IDLE:   'binface-idle',
  WALK:   'binface-walk',
  JUMP:   'binface-jump',
  ATTACK: 'binface-attack',
  HURT:   'binface-hurt',
  WIN:    'binface-win',
};

/**
 * Returns the correct animation key for a character given game state.
 * Handles animation priority: hurt > attack > jump > walk > idle.
 */
export function resolveFarageAnim({ isHurt, isAttacking, isWalking, hasWon }) {
  if (hasWon) return FARAGE_ANIMS.WIN;
  if (isHurt) return FARAGE_ANIMS.HURT;
  if (isAttacking) return FARAGE_ANIMS.ATTACK;
  if (isWalking) return FARAGE_ANIMS.WALK;
  return FARAGE_ANIMS.IDLE;
}

export function resolveBinfaceAnim({ isHurt, isAttacking, isJumping, isWalking, hasWon }) {
  if (hasWon) return BINFACE_ANIMS.WIN;
  if (isHurt) return BINFACE_ANIMS.HURT;
  if (isAttacking) return BINFACE_ANIMS.ATTACK;
  if (isJumping) return BINFACE_ANIMS.JUMP;
  if (isWalking) return BINFACE_ANIMS.WALK;
  return BINFACE_ANIMS.IDLE;
}
