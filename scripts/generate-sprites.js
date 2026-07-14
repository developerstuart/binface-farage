#!/usr/bin/env node
/**
 * Sprite sheet generator for Farage vs Binface.
 * Generates pixel-art SVG frames and stitches them into PNG sprite sheets
 * using the `sharp` library.
 *
 * Output:
 *   public/assets/sprites/farage.png         — 9-frame spritesheet
 *   public/assets/sprites/farage-atlas.json  — Phaser texture atlas
 *   public/assets/sprites/binface.png        — 10-frame spritesheet
 *   public/assets/sprites/binface-atlas.json — Phaser texture atlas
 *
 * Usage: node scripts/generate-sprites.js
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/assets/sprites');
mkdirSync(OUT_DIR, { recursive: true });

const W = 64;  // frame width px
const H = 80;  // frame height px
const P = 4;   // logical pixel size (each logical px = 4×4 real px)

// ---------------------------------------------------------------------------
// SVG helpers
// ---------------------------------------------------------------------------

function px(x, y, w, h, fill) {
  return `<rect x="${x * P}" y="${y * P}" width="${w * P}" height="${h * P}" fill="${fill}"/>`;
}

function rect(x, y, w, h, fill) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${body}</svg>`;
}

// ---------------------------------------------------------------------------
// COLOUR PALETTE
// ---------------------------------------------------------------------------
const C = {
  // Farage
  farHair:    '#C8B87A',   // swept blonde/silver hair
  farHairDk:  '#A89860',
  farSkin:    '#F2C59A',   // ruddy complexion
  farSkinDk:  '#D4A578',
  farEye:     '#3A2010',
  farMouth:   '#A05040',
  farSuit:    '#1C3A6E',   // navy blue suit
  farSuitDk:  '#142D58',
  farShirt:   '#F5F5F5',
  farTie:     '#CC2222',   // red tie
  farTrousers:'#0F2040',
  farBeer:    '#F0B830',   // amber beer
  farGlass:   '#C8E8F8',   // pint glass (glass-like)
  farFoam:    '#FFFDF0',
  farCig:     '#F0F0D0',
  farCigTip:  '#FF4411',
  farSmoke:   '#CCCCBB',
  // Count Binface
  binMetal:   '#B8C8D4',   // silver bin metallic
  binMetalDk: '#88A0B0',
  binMetalLt: '#D8E8F0',
  binVisor:   '#111820',   // black visor
  binVisorGl: '#1A3A5C',   // visor reflection
  binSuit:    '#1A1A2E',   // dark suit
  binSuitDk:  '#0F0F1E',
  binAccent:  '#4A90D9',   // blue accent
  binCape:    '#2A2A4E',
  binSkin:    '#E8C8A0',   // if any skin shows
  binMilk:    '#FAFAFA',   // milkshake white
  binHose:    '#4A7A3A',   // hose green
  // Shared
  black:      '#000000',
  white:      '#FFFFFF',
  trans:      'none',
};

// ---------------------------------------------------------------------------
// FARAGE CHARACTER BUILDER
// ---------------------------------------------------------------------------
// Logical grid: 16×20 (each cell = 4×4px → 64×80px total)

function farageBody({ legPhase = 0, armPhase = 0, hurt = false, attack = false, win = false }) {
  const skinCol = hurt ? '#FF9977' : C.farSkin;
  const suitCol = hurt ? '#2A4A8A' : C.farSuit;

  // --- head ---
  const head = [
    // Hair (rows 1-2)
    px(3, 1, 10, 1, C.farHairDk),
    px(2, 2, 12, 1, C.farHair),
    px(1, 3, 1, 2, C.farHair),
    px(14, 3, 1, 2, C.farHair),
    // Face (rows 3-6)
    px(2, 3, 12, 4, skinCol),
    // Eyes (row 4)
    px(4, 4, 2, 1, C.farEye),
    px(10, 4, 2, 1, C.farEye),
    // Eyebrows
    px(4, 3, 2, 1, C.farHairDk),
    px(10, 3, 2, 1, C.farHairDk),
    // Nose
    px(7, 5, 2, 1, C.farSkinDk),
    // Mouth / smirk
    win
      ? px(4, 6, 8, 1, C.farMouth) + px(4, 7, 1, 1, C.farSkinDk) + px(11, 7, 1, 1, C.farSkinDk)
      : px(5, 6, 6, 1, C.farMouth),
    // Jowls / chin
    px(2, 7, 12, 1, C.farSkinDk),
    // Ears
    px(1, 4, 1, 2, C.farSkinDk),
    px(14, 4, 1, 2, C.farSkinDk),
  ].join('');

  // --- neck ---
  const neck = px(6, 8, 4, 1, skinCol);

  // --- collar / shirt ---
  const shirt = [
    px(4, 9, 8, 1, C.farShirt),
    px(6, 9, 4, 3, C.farShirt),
  ].join('');

  // --- tie (varies with attack) ---
  const tieX = attack ? 7 : 7;
  const tie = [
    px(tieX, 9, 2, 1, C.farTie),
    px(tieX, 10, 2, 4, C.farTie),
    px(tieX + 1, 14, 1, 1, C.farTie),
  ].join('');

  // --- suit jacket ---
  const jacket = [
    px(2, 9, 12, 6, suitCol),
    // Lapels
    px(4, 9, 2, 4, C.farShirt),
    px(10, 9, 2, 4, C.farShirt),
    // Jacket buttons
    px(7, 13, 2, 1, C.farSuitDk),
  ].join('');

  // --- LEFT ARM (pint glass) ---
  // Pint glass offset changes with animation
  const pintOff = win ? -2 : (attack ? -1 : 0);
  const leftArm = [
    px(1, 9 + armPhase, 2, 5, suitCol),   // sleeve
    px(0, 14 + armPhase, 2, 2, skinCol),   // hand
    // Pint glass
    px(-1 + pintOff, 11 + armPhase, 3, 5, C.farGlass),
    px(-1 + pintOff, 11 + armPhase, 3, 3, C.farBeer),
    px(-1 + pintOff, 11 + armPhase, 3, 1, C.farFoam),
  ].join('');

  // --- RIGHT ARM (cigarette) ---
  const cigOff = attack ? 2 : 0;
  const rightArm = [
    px(13, 9 + armPhase, 2, 5, suitCol),  // sleeve
    px(14, 14 + armPhase, 2, 2, skinCol), // hand
    // Cigarette
    px(15 + cigOff, 14 + armPhase, 2, 1, C.farCig),
    px(17 + cigOff, 14 + armPhase, 1, 1, C.farCigTip),
    px(16 + cigOff, 13 + armPhase, 1, 1, C.farSmoke),
  ].join('');

  // --- trousers ---
  const legL_x = legPhase === 0 ? 3 : (legPhase === 1 ? 2 : 4);
  const legR_x = legPhase === 0 ? 9 : (legPhase === 1 ? 10 : 8);
  const trousers = [
    px(2, 15, 12, 2, C.farTrousers),
    // Left leg
    px(legL_x, 17, 4, 3, C.farTrousers),
    px(legL_x, 20, 4, 1, C.black),
    // Right leg
    px(legR_x, 17, 4, 3, C.farTrousers),
    px(legR_x, 20, 4, 1, C.black),
  ].join('');

  return svg(head + neck + shirt + jacket + tie + leftArm + rightArm + trousers);
}

const farageFrames = {
  'idle-0':   farageBody({ legPhase: 0, armPhase: 0 }),
  'idle-1':   farageBody({ legPhase: 0, armPhase: 1 }),
  'walk-0':   farageBody({ legPhase: 0, armPhase: 0 }),
  'walk-1':   farageBody({ legPhase: 1, armPhase: 0 }),
  'walk-2':   farageBody({ legPhase: 0, armPhase: 1 }),
  'walk-3':   farageBody({ legPhase: 2, armPhase: 1 }),
  'attack-0': farageBody({ legPhase: 0, armPhase: 0, attack: true }),
  'attack-1': farageBody({ legPhase: 0, armPhase: 1, attack: true }),
  'attack-2': farageBody({ legPhase: 0, armPhase: 0 }),
  'hurt-0':   farageBody({ legPhase: 0, armPhase: 1, hurt: true }),
  'hurt-1':   farageBody({ legPhase: 2, armPhase: 0, hurt: true }),
  'win-0':    farageBody({ legPhase: 0, armPhase: 0, win: true }),
  'win-1':    farageBody({ legPhase: 0, armPhase: 1, win: true }),
  'win-2':    farageBody({ legPhase: 1, armPhase: 0, win: true }),
};

// ---------------------------------------------------------------------------
// COUNT BINFACE CHARACTER BUILDER
// ---------------------------------------------------------------------------

function binfaceBody({ legPhase = 0, armPhase = 0, hurt = false, attack = false, win = false, jump = false }) {
  const suitCol = hurt ? '#3A3A6A' : C.binSuit;
  const metalCol = hurt ? '#8898A8' : C.binMetal;
  const yOff = jump ? -4 : 0; // jump offset in logical pixels

  // --- bin head ---
  // Count Binface's head is a silver cylindrical bin shape
  const binHead = [
    // Lid ring at top
    px(3, 1 + yOff, 10, 1, C.binMetalDk),
    px(2, 2 + yOff, 12, 1, metalCol),
    // Main cylinder body
    px(2, 3 + yOff, 12, 5, metalCol),
    px(2, 3 + yOff, 1, 5, C.binMetalDk),
    px(13, 3 + yOff, 1, 5, C.binMetalDk),
    // Highlight on left
    px(3, 3 + yOff, 1, 5, C.binMetalLt),
    // Visor (black eye slot)
    px(3, 4 + yOff, 10, 2, C.binVisor),
    px(8, 4 + yOff, 2, 1, C.binVisorGl),
    // Bottom rim
    px(2, 8 + yOff, 12, 1, C.binMetalDk),
    // Ears/handles on sides
    px(1, 4 + yOff, 1, 3, C.binMetalDk),
    px(14, 4 + yOff, 1, 3, C.binMetalDk),
  ].join('');

  // --- neck ---
  const neck = px(6, 9 + yOff, 4, 1, suitCol);

  // --- body / suit ---
  const body = [
    // Dark suit
    px(2, 10 + yOff, 12, 5, suitCol),
    // Blue accent stripes (campaign badge)
    px(3, 11 + yOff, 2, 3, C.binAccent),
    px(11, 11 + yOff, 2, 3, C.binAccent),
    // Medal / badge
    px(7, 11 + yOff, 2, 2, '#FFD700'),
    px(7, 11 + yOff, 2, 1, '#FFA500'),
  ].join('');

  // --- LEFT ARM (milkshake hose when attacking) ---
  const leftArm = attack
    ? [
        px(0, 10, 2, 4, suitCol),
        px(0, 14, 2, 1, C.binSkin),
        // Hose nozzle
        px(-2, 13, 2, 2, C.binHose),
        // Milkshake projectile
        px(-6, 12, 4, 3, C.binMilk),
      ].join('')
    : [
        px(0, 10 + yOff, 2, 4 + armPhase, suitCol),
        px(0, 14 + yOff + armPhase, 2, 1, C.binSkin),
      ].join('');

  // --- RIGHT ARM ---
  const rightArm = [
    px(14, 10 + yOff, 2, 4 + armPhase, suitCol),
    px(14, 14 + yOff + armPhase, 2, 1, C.binSkin),
  ].join('');

  // --- cape ---
  const cape = win
    ? px(0, 10 + yOff, 2, 8, C.binCape) + px(14, 10 + yOff, 2, 8, C.binCape)
    : '';

  // --- trousers ---
  const legL_x = legPhase === 0 ? 3 : (legPhase === 1 ? 2 : 4);
  const legR_x = legPhase === 0 ? 9 : (legPhase === 1 ? 10 : 8);
  const trousers = [
    px(2, 15 + yOff, 12, 2, suitCol),
    px(legL_x, 17 + yOff, 4, 3, suitCol),
    px(legL_x, 20 + yOff, 4, 1, C.black),
    px(legR_x, 17 + yOff, 4, 3, suitCol),
    px(legR_x, 20 + yOff, 4, 1, C.black),
  ].join('');

  return svg(binHead + neck + body + leftArm + rightArm + cape + trousers);
}

const binfaceFrames = {
  'idle-0':   binfaceBody({ legPhase: 0, armPhase: 0 }),
  'idle-1':   binfaceBody({ legPhase: 0, armPhase: 1 }),
  'walk-0':   binfaceBody({ legPhase: 0, armPhase: 0 }),
  'walk-1':   binfaceBody({ legPhase: 1, armPhase: 0 }),
  'walk-2':   binfaceBody({ legPhase: 0, armPhase: 1 }),
  'walk-3':   binfaceBody({ legPhase: 2, armPhase: 1 }),
  'jump-0':   binfaceBody({ legPhase: 0, armPhase: 0, jump: true }),
  'jump-1':   binfaceBody({ legPhase: 1, armPhase: 1, jump: true }),
  'attack-0': binfaceBody({ legPhase: 0, armPhase: 0, attack: true }),
  'attack-1': binfaceBody({ legPhase: 0, armPhase: 1, attack: true }),
  'attack-2': binfaceBody({ legPhase: 0, armPhase: 0 }),
  'hurt-0':   binfaceBody({ legPhase: 0, armPhase: 1, hurt: true }),
  'hurt-1':   binfaceBody({ legPhase: 2, armPhase: 0, hurt: true }),
  'win-0':    binfaceBody({ legPhase: 0, armPhase: 0, win: true }),
  'win-1':    binfaceBody({ legPhase: 0, armPhase: 1, win: true }),
  'win-2':    binfaceBody({ legPhase: 1, armPhase: 0, win: true }),
};

// ---------------------------------------------------------------------------
// SPRITE SHEET STITCHER
// ---------------------------------------------------------------------------

async function buildSpriteSheet(frames, outName) {
  const keys = Object.keys(frames);
  const cols = Math.ceil(Math.sqrt(keys.length));
  const rows = Math.ceil(keys.length / cols);
  const sheetW = cols * W;
  const sheetH = rows * H;

  // Convert each SVG to a raw RGBA buffer via sharp
  const buffers = await Promise.all(
    keys.map((key) =>
      sharp(Buffer.from(frames[key]))
        .resize(W, H)
        .png()
        .toBuffer()
    )
  );

  // Create blank sheet
  const composites = buffers.map((buf, i) => ({
    input: buf,
    left: (i % cols) * W,
    top: Math.floor(i / cols) * H,
  }));

  const sheetPath = resolve(OUT_DIR, `${outName}.png`);
  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(sheetPath);

  // Build Phaser texture atlas JSON
  const atlas = {
    frames: {},
    meta: {
      image: `${outName}.png`,
      size: { w: sheetW, h: sheetH },
      scale: '1',
    },
  };

  keys.forEach((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    atlas.frames[key] = {
      frame: { x: col * W, y: row * H, w: W, h: H },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: W, h: H },
      sourceSize: { w: W, h: H },
    };
  });

  const atlasPath = resolve(OUT_DIR, `${outName}-atlas.json`);
  writeFileSync(atlasPath, JSON.stringify(atlas, null, 2));

  console.log(`✓ ${outName}.png (${cols}×${rows} grid, ${keys.length} frames)`);
  console.log(`✓ ${outName}-atlas.json`);

  return { keys, cols, rows };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log('Generating sprite sheets…');
  await buildSpriteSheet(farageFrames, 'farage');
  await buildSpriteSheet(binfaceFrames, 'binface');
  console.log('\nAll sprite sheets written to public/assets/sprites/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
