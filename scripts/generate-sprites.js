#!/usr/bin/env node
/**
 * High-fidelity sprite sheet generator for Farage vs Binface.
 * Produces detailed cartoon-style SVG frames (128×160px) stitched into PNG sprite sheets.
 *
 * Output:
 *   public/assets/sprites/farage.png / farage-atlas.json
 *   public/assets/sprites/binface.png / binface-atlas.json
 *
 * Usage: npm run sprites
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/assets/sprites');
mkdirSync(OUT_DIR, { recursive: true });

const W = 128;
const H = 160;

function svgDoc(defs, body) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    '<defs>',
    defs,
    '</defs>',
    body,
    '</svg>',
  ].join('\n');
}

// ─── FARAGE ────────────────────────────────────────────────────────────────────
// Nigel Farage: jowly ruddy face, swept blonde hair, navy suit, red tie,
// pint of lager (left), lit cigarette with smoke (right).

function buildFarage({ legPhase = 0, armPhase = 0, hurt = false, attack = false, win = false }) {
  const skinBase   = hurt ? '#F08060' : '#E8A878';
  const skinDark   = hurt ? '#C86040' : '#C07850';
  const skinFlush  = hurt ? '#E06050' : '#D87868';
  const suitColor  = hurt ? '#2A4A8A' : '#1C3A6E';
  const suitDark   = hurt ? '#1A3070' : '#0F2040';

  const la = armPhase === 1 ? 4 : 0;   // arm bob down
  const ll = legPhase === 1 ? -8 : (legPhase === 2 ? 8 : 0);
  const rl = legPhase === 1 ? 8  : (legPhase === 2 ? -8 : 0);

  // Pint arm lifts on win / attack
  const pintRaise = win ? -20 : (attack ? -8 : 0);

  const defs = [
    '<linearGradient id="fSkin" x1="0" y1="0" x2="0" y2="1">',
    `  <stop offset="0%"   stop-color="${hurt ? '#F5A090' : '#F5C0A0'}"/>`,
    `  <stop offset="100%" stop-color="${skinDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="fHair" x1="0" y1="0" x2="0" y2="1">',
    '  <stop offset="0%"   stop-color="#C8C8C4"/>',
    '  <stop offset="60%"  stop-color="#A0A09A"/>',
    '  <stop offset="100%" stop-color="#787872"/>',
    '</linearGradient>',
    '<pattern id="fTiePat" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-40 64 0)">',
    '  <rect width="8" height="8" fill="#4AAAD8"/>',
    '  <rect width="3" height="8" fill="#1A6AAA"/>',
    '</pattern>',
    '<linearGradient id="fSuit" x1="0" y1="0" x2="1" y2="0">',
    `  <stop offset="0%"   stop-color="${suitDark}"/>`,
    `  <stop offset="35%"  stop-color="${suitColor}"/>`,
    `  <stop offset="100%" stop-color="${suitDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="fTrousers" x1="0" y1="0" x2="1" y2="0">',
    `  <stop offset="0%"   stop-color="#08182E"/>`,
    `  <stop offset="50%"  stop-color="${suitDark}"/>`,
    `  <stop offset="100%" stop-color="#08182E"/>`,
    '</linearGradient>',
    '<linearGradient id="fBeer" x1="0" y1="0" x2="0" y2="1">',
    '  <stop offset="0%"   stop-color="#FFFAE0" stop-opacity="0.95"/>',
    '  <stop offset="18%"  stop-color="#F8E898" stop-opacity="0.9"/>',
    '  <stop offset="22%"  stop-color="#F0B030"/>',
    '  <stop offset="100%" stop-color="#C08010"/>',
    '</linearGradient>',
    '<linearGradient id="fGlass" x1="0" y1="0" x2="1" y2="0">',
    '  <stop offset="0%"   stop-color="#90C0E0" stop-opacity="0.75"/>',
    '  <stop offset="30%"  stop-color="#D8EEFA" stop-opacity="0.2"/>',
    '  <stop offset="70%"  stop-color="#C0DDF0" stop-opacity="0.25"/>',
    '  <stop offset="100%" stop-color="#80B0D0" stop-opacity="0.8"/>',
    '</linearGradient>',
  ].join('\n');

  // ── Head ──────────────────────────────────────────────────────────────────
  const hcy = 34;  // face ellipse centre-Y
  const head = [
    // Hair (swept blonde/silver-blonde, slightly receding)
    `<ellipse cx="64" cy="${hcy - 12}" rx="24" ry="14" fill="url(#fHair)"/>`,
    `<path d="M40 ${hcy - 14} Q64 ${hcy - 30} 88 ${hcy - 14} Q80 ${hcy - 6} 64 ${hcy - 10} Q48 ${hcy - 6} 40 ${hcy - 14}Z" fill="url(#fHair)"/>`,
    // Hair highlight
    `<path d="M50 ${hcy - 18} Q64 ${hcy - 24} 78 ${hcy - 18}" stroke="#E0E0DC" stroke-width="2" fill="none" stroke-opacity="0.5"/>`,
    // Jowly face
    `<ellipse cx="64" cy="${hcy}" rx="24" ry="22" fill="url(#fSkin)"/>`,
    // Jowl pouches
    `<ellipse cx="44" cy="${hcy + 10}" rx="10" ry="9" fill="${skinBase}"/>`,
    `<ellipse cx="84" cy="${hcy + 10}" rx="10" ry="9" fill="${skinBase}"/>`,
    // Double chin
    `<ellipse cx="64" cy="${hcy + 20}" rx="17" ry="7" fill="${skinDark}"/>`,
    // Ears
    `<ellipse cx="40" cy="${hcy + 2}" rx="5" ry="7" fill="${skinDark}"/>`,
    `<ellipse cx="88" cy="${hcy + 2}" rx="5" ry="7" fill="${skinDark}"/>`,
    // Eyebrows — sardonic arch
    `<path d="M48 ${hcy - 6} Q56 ${hcy - 10} 62 ${hcy - 7}" stroke="#8A6828" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    `<path d="M66 ${hcy - 7} Q72 ${hcy - 10} 80 ${hcy - 6}" stroke="#8A6828" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    // Eye whites
    `<ellipse cx="55" cy="${hcy}" rx="6" ry="4.5" fill="white"/>`,
    `<ellipse cx="73" cy="${hcy}" rx="6" ry="4.5" fill="white"/>`,
    // Irises
    `<circle cx="56" cy="${hcy + 1}" r="3" fill="#3A2808"/>`,
    `<circle cx="74" cy="${hcy + 1}" r="3" fill="#3A2808"/>`,
    // Highlights
    `<circle cx="57.5" cy="${hcy - 0.5}" r="1.2" fill="white"/>`,
    `<circle cx="75.5" cy="${hcy - 0.5}" r="1.2" fill="white"/>`,
    // Upper eyelids
    `<path d="M49 ${hcy - 1.5} Q55 ${hcy - 5} 61 ${hcy - 1.5}" stroke="#8A5830" stroke-width="1.5" fill="none"/>`,
    `<path d="M67 ${hcy - 1.5} Q73 ${hcy - 5} 79 ${hcy - 1.5}" stroke="#8A5830" stroke-width="1.5" fill="none"/>`,
    // Nose — bulbous/prominent
    `<path d="M61 ${hcy + 6} Q58 ${hcy + 12} 57 ${hcy + 15} Q60 ${hcy + 17} 64 ${hcy + 16} Q68 ${hcy + 17} 71 ${hcy + 15} Q70 ${hcy + 12} 67 ${hcy + 6}Z" fill="${skinDark}"/>`,
    `<ellipse cx="61" cy="${hcy + 15}" rx="3.5" ry="2.5" fill="${skinDark}"/>`,
    `<ellipse cx="67" cy="${hcy + 15}" rx="3.5" ry="2.5" fill="${skinDark}"/>`,
    // Nasolabial folds
    `<path d="M55 ${hcy + 13} Q53 ${hcy + 19} 55 ${hcy + 22}" stroke="${skinDark}" stroke-width="1.5" fill="none" stroke-opacity="0.55"/>`,
    `<path d="M73 ${hcy + 13} Q75 ${hcy + 19} 73 ${hcy + 22}" stroke="${skinDark}" stroke-width="1.5" fill="none" stroke-opacity="0.55"/>`,
    // Mouth — smug smirk
    win
      ? [
          `<path d="M50 ${hcy + 20} Q64 ${hcy + 30} 78 ${hcy + 20}" stroke="#902020" stroke-width="3" fill="none" stroke-linecap="round"/>`,
          `<path d="M52 ${hcy + 21} Q64 ${hcy + 28} 76 ${hcy + 21}" fill="#B83030"/>`,
        ].join('\n')
      : [
          `<path d="M54 ${hcy + 21} Q64 ${hcy + 27} 74 ${hcy + 21}" stroke="#902020" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
          `<path d="M56 ${hcy + 21} Q64 ${hcy + 25} 72 ${hcy + 21}" fill="#B83030"/>`,
        ].join('\n'),
    // Cheek flush
    `<ellipse cx="46" cy="${hcy + 8}" rx="7" ry="5" fill="${skinFlush}" fill-opacity="0.4"/>`,
    `<ellipse cx="82" cy="${hcy + 8}" rx="7" ry="5" fill="${skinFlush}" fill-opacity="0.4"/>`,
  ].join('\n');

  // ── Neck ──────────────────────────────────────────────────────────────────
  const neckY = hcy + 22;
  const neck = `<rect x="56" y="${neckY}" width="16" height="14" rx="5" fill="${skinBase}"/>`;

  // ── Body ──────────────────────────────────────────────────────────────────
  const bodyY = neckY + 10;
  const body = [
    // Suit torso
    `<path d="M24 ${bodyY + 8} Q16 ${bodyY + 48} 18 115 L110 115 Q112 ${bodyY + 48} 104 ${bodyY + 8} Q90 ${bodyY - 4} 76 ${bodyY} L70 ${bodyY + 14} L64 ${bodyY + 8} L58 ${bodyY + 14} L52 ${bodyY} Q38 ${bodyY - 4} 24 ${bodyY + 8}Z" fill="url(#fSuit)"/>`,
    // Pink shirt front (matches reference)
    `<polygon points="52,${bodyY + 2} 64,${bodyY + 18} 76,${bodyY + 2} 70,${bodyY} 64,${bodyY + 12} 58,${bodyY}" fill="#F5C8C8"/>`,
    // Reform UK blue diagonal-stripe tie
    `<polygon points="62,${bodyY + 2} 66,${bodyY + 2} 69,${bodyY + 34} 64,${bodyY + 40} 59,${bodyY + 34}" fill="url(#fTiePat)"/>`,
    // Tie knot (darker)
    `<polygon points="62,${bodyY + 2} 66,${bodyY + 2} 64,${bodyY + 9}" fill="#0E5080"/>`,
    // Left lapel
    `<polygon points="52,${bodyY + 2} 36,${bodyY + 16} 46,${bodyY + 22} 58,${bodyY + 10}" fill="${suitDark}"/>`,
    // Right lapel
    `<polygon points="76,${bodyY + 2} 92,${bodyY + 16} 82,${bodyY + 22} 70,${bodyY + 10}" fill="${suitDark}"/>`,
    // Pocket square
    `<rect x="78" y="${bodyY + 8}" width="10" height="7" rx="1" fill="${suitColor}"/>`,
    `<polygon points="80,${bodyY + 8} 88,${bodyY + 8} 86,${bodyY + 6} 82,${bodyY + 6}" fill="#F0F0F0"/>`,
    // Buttons
    `<circle cx="64" cy="${bodyY + 44}" r="2.5" fill="${suitDark}"/>`,
    `<circle cx="64" cy="${bodyY + 56}" r="2.5" fill="${suitDark}"/>`,
  ].join('\n');

  // ── Left arm — pint glass ──────────────────────────────────────────────────
  const pintHandX = 12;
  const pintHandY = bodyY + 38 + la + pintRaise;
  const pintT = pintHandY - 32;  // pint top
  const pintB = pintHandY + 4;   // pint bottom
  const pintL = pintHandX - 5;
  const pintR = pintHandX + 11;

  const leftArm = [
    // Sleeve
    `<path d="M24 ${bodyY + 8} Q${pintHandX + 6} ${bodyY + 22 + la + pintRaise} ${pintHandX + 2} ${pintHandY - 10}" stroke="${suitColor}" stroke-width="18" fill="none" stroke-linecap="round"/>`,
    // Cuff
    `<rect x="${pintHandX - 7}" y="${pintHandY - 12}" width="18" height="6" rx="3" fill="${suitDark}"/>`,
    // Hand
    `<ellipse cx="${pintHandX + 3}" cy="${pintHandY + 1}" rx="8" ry="7" fill="${skinBase}"/>`,
    // Pint glass body
    `<path d="M${pintL} ${pintT} L${pintL - 2} ${pintB} L${pintR + 2} ${pintB} L${pintR} ${pintT}Z" fill="url(#fGlass)" stroke="#90B8D8" stroke-width="1.5"/>`,
    // Beer fill
    `<path d="M${pintL + 0.5} ${pintT + 7} L${pintL - 1.5} ${pintB - 1} L${pintR + 1.5} ${pintB - 1} L${pintR - 0.5} ${pintT + 7}Z" fill="url(#fBeer)"/>`,
    // Foam
    `<ellipse cx="${pintHandX + 3}" cy="${pintT + 4}" rx="8" ry="5" fill="#FFFAE8"/>`,
    `<ellipse cx="${pintHandX + 1}" cy="${pintT + 2}" rx="4" ry="3.5" fill="white"/>`,
    `<ellipse cx="${pintHandX + 6}" cy="${pintT + 1}" rx="3.5" ry="3" fill="white"/>`,
    `<ellipse cx="${pintHandX - 1}" cy="${pintT + 2}" rx="2.5" ry="2.5" fill="white"/>`,
    // Glass highlight
    `<path d="M${pintL + 2} ${pintT + 4} L${pintL} ${pintB - 4}" stroke="white" stroke-width="1.5" stroke-opacity="0.65" stroke-linecap="round"/>`,
    // Handle
    `<path d="M${pintR} ${pintT + 8} Q${pintR + 12} ${pintT + 8} ${pintR + 12} ${pintT + 18} Q${pintR + 12} ${pintT + 28} ${pintR} ${pintT + 26}" stroke="#90B8D8" stroke-width="2.5" fill="none"/>`,
  ].join('\n');

  // ── Right arm — cigarette ──────────────────────────────────────────────────
  const cigHandX = 116;
  const cigHandY = bodyY + 38 + la;
  const cigX = cigHandX - 2;
  const cigY = cigHandY - 4;

  const rightArm = [
    // Sleeve
    `<path d="M104 ${bodyY + 8} Q${cigHandX - 8} ${bodyY + 22 + la} ${cigHandX - 2} ${cigHandY - 10}" stroke="${suitColor}" stroke-width="18" fill="none" stroke-linecap="round"/>`,
    // Cuff
    `<rect x="${cigHandX - 11}" y="${cigHandY - 12}" width="18" height="6" rx="3" fill="${suitDark}"/>`,
    // Hand
    `<ellipse cx="${cigHandX - 5}" cy="${cigHandY + 1}" rx="8" ry="7" fill="${skinBase}"/>`,
    // Cigarette body
    `<rect x="${cigX}" y="${cigY}" width="20" height="4.5" rx="2" fill="#EEEEC8"/>`,
    // Filter
    `<rect x="${cigX}" y="${cigY}" width="5" height="4.5" rx="2" fill="#D4A080"/>`,
    // Ember
    `<ellipse cx="${cigX + 21}" cy="${cigY + 2.5}" rx="3" ry="2.5" fill="#FF6020"/>`,
    `<ellipse cx="${cigX + 22}" cy="${cigY + 2.5}" rx="2" ry="1.5" fill="#FFAA00"/>`,
    // Ash
    `<ellipse cx="${cigX + 19}" cy="${cigY + 2.5}" rx="2.5" ry="1" fill="#D0D0B8"/>`,
    // Smoke wisps
    `<path d="M${cigX + 21} ${cigY - 1} Q${cigX + 26} ${cigY - 10} ${cigX + 20} ${cigY - 18}" stroke="#C8C8A8" stroke-width="2" fill="none" stroke-opacity="0.7" stroke-linecap="round"/>`,
    `<path d="M${cigX + 20} ${cigY - 1} Q${cigX + 17} ${cigY - 12} ${cigX + 22} ${cigY - 22}" stroke="#BBBBAA" stroke-width="1.5" fill="none" stroke-opacity="0.4" stroke-linecap="round"/>`,
  ].join('\n');

  // ── Legs / trousers ───────────────────────────────────────────────────────
  const hipsY = 113;
  const llx = 46 + ll;
  const rlx = 82 + rl;

  const trousers = [
    // Hip waistband
    `<rect x="26" y="${hipsY}" width="76" height="10" rx="4" fill="${suitDark}"/>`,
    // Belt
    `<rect x="26" y="${hipsY + 2}" width="76" height="5" rx="2" fill="#2A2A1A"/>`,
    `<rect x="60" y="${hipsY + 1}" width="8" height="7" rx="1" fill="#888860"/>`,
    // Left leg
    `<path d="M40 ${hipsY + 8} Q${llx} ${hipsY + 28} ${llx} 152" stroke="url(#fTrousers)" stroke-width="20" fill="none" stroke-linecap="round"/>`,
    // Right leg
    `<path d="M88 ${hipsY + 8} Q${rlx} ${hipsY + 28} ${rlx} 152" stroke="url(#fTrousers)" stroke-width="20" fill="none" stroke-linecap="round"/>`,
    // Left shoe (brown, matches reference)
    `<path d="M${llx - 11} 151 Q${llx - 9} 158 ${llx + 13} 158 Q${llx + 17} 156 ${llx + 11} 151Z" fill="#6B3A1F"/>`,
    `<path d="M${llx - 8} 153 Q${llx} 156 ${llx + 8} 154" stroke="#8B5A3A" stroke-width="1" fill="none"/>`,
    // Right shoe
    `<path d="M${rlx - 11} 151 Q${rlx - 9} 158 ${rlx + 13} 158 Q${rlx + 17} 156 ${rlx + 11} 151Z" fill="#6B3A1F"/>`,
    `<path d="M${rlx - 8} 153 Q${rlx} 156 ${rlx + 8} 154" stroke="#8B5A3A" stroke-width="1" fill="none"/>`,
  ].join('\n');

  // Render order: trousers → body → neck → arms → head (head always on top)
  return svgDoc(defs, [trousers, body, neck, leftArm, rightArm, head].join('\n'));
}

const farageFrames = {
  'idle-0':   buildFarage({ legPhase: 0, armPhase: 0 }),
  'idle-1':   buildFarage({ legPhase: 0, armPhase: 1 }),
  'walk-0':   buildFarage({ legPhase: 0, armPhase: 0 }),
  'walk-1':   buildFarage({ legPhase: 1, armPhase: 0 }),
  'walk-2':   buildFarage({ legPhase: 0, armPhase: 1 }),
  'walk-3':   buildFarage({ legPhase: 2, armPhase: 1 }),
  'attack-0': buildFarage({ legPhase: 0, armPhase: 0, attack: true }),
  'attack-1': buildFarage({ legPhase: 0, armPhase: 1, attack: true }),
  'attack-2': buildFarage({ legPhase: 0, armPhase: 0 }),
  'hurt-0':   buildFarage({ legPhase: 0, armPhase: 1, hurt: true }),
  'hurt-1':   buildFarage({ legPhase: 2, armPhase: 0, hurt: true }),
  'win-0':    buildFarage({ legPhase: 0, armPhase: 0, win: true }),
  'win-1':    buildFarage({ legPhase: 0, armPhase: 1, win: true }),
  'win-2':    buildFarage({ legPhase: 1, armPhase: 0, win: true }),
};

// ─── COUNT BINFACE ─────────────────────────────────────────────────────────────
// Count Binface: silver cylindrical bin head with narrow visor slit,
// dark suit with blue campaign stripes, metallic space boots.

function buildBinface({ legPhase = 0, armPhase = 0, hurt = false, attack = false, win = false, jump = false }) {
  const metalBase  = hurt ? '#8898A8' : '#B8C8D4';
  const metalLight = hurt ? '#A0B4C4' : '#D8EAF2';
  const metalDark  = hurt ? '#607888' : '#88A0B0';
  const suitColor  = hurt ? '#3A3A6A' : '#1A1A2E';
  const suitDark   = '#0A0A18';
  const yOff       = jump ? -18 : 0;

  const la = armPhase === 1 ? 4 : 0;
  const ll = legPhase === 1 ? -8 : (legPhase === 2 ? 8 : 0);
  const rl = legPhase === 1 ? 8  : (legPhase === 2 ? -8 : 0);

  const defs = [
    '<linearGradient id="bMetal" x1="0" y1="0" x2="1" y2="0">',
    `  <stop offset="0%"   stop-color="${metalDark}"/>`,
    `  <stop offset="12%"  stop-color="${metalLight}"/>`,
    `  <stop offset="55%"  stop-color="${metalBase}"/>`,
    `  <stop offset="100%" stop-color="${metalDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="bLid" x1="0" y1="0" x2="0" y2="1">',
    `  <stop offset="0%"   stop-color="${metalLight}"/>`,
    `  <stop offset="100%" stop-color="${metalDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="bSuit" x1="0" y1="0" x2="1" y2="0">',
    `  <stop offset="0%"   stop-color="${suitDark}"/>`,
    `  <stop offset="40%"  stop-color="${suitColor}"/>`,
    `  <stop offset="100%" stop-color="${suitDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="bBoot" x1="0" y1="0" x2="0" y2="1">',
    `  <stop offset="0%"   stop-color="${metalBase}"/>`,
    `  <stop offset="100%" stop-color="${metalDark}"/>`,
    '</linearGradient>',
    '<linearGradient id="bVisor" x1="0" y1="0" x2="1" y2="0">',
    '  <stop offset="0%"   stop-color="#050810"/>',
    '  <stop offset="25%"  stop-color="#0A1828"/>',
    '  <stop offset="50%"  stop-color="#1A4070"/>',
    '  <stop offset="75%"  stop-color="#0A1828"/>',
    '  <stop offset="100%" stop-color="#050810"/>',
    '</linearGradient>',
    '<linearGradient id="bMilk" x1="0" y1="0" x2="1" y2="0">',
    '  <stop offset="0%"   stop-color="#E8F0F8"/>',
    '  <stop offset="50%"  stop-color="white"/>',
    '  <stop offset="100%" stop-color="#D0E4F4"/>',
    '</linearGradient>',
    '<radialGradient id="bBadge" cx="45%" cy="40%" r="60%">',
    '  <stop offset="0%"   stop-color="#FFE868"/>',
    '  <stop offset="100%" stop-color="#B06000"/>',
    '</radialGradient>',
  ].join('\n');

  // ── Bin Head ──────────────────────────────────────────────────────────────
  const htY  = 8 + yOff;     // head top
  const binH = 58;            // bin body height
  const hbY  = htY + binH;   // head bottom
  const bCX  = 64;            // bin centre-X
  const bHW  = 28;            // bin half-width (rect)

  const binHead = [
    // Bin cylinder body
    `<rect x="${bCX - bHW}" y="${htY + 8}" width="${bHW * 2}" height="${binH - 8}" rx="4" fill="url(#bMetal)"/>`,
    // Lid ellipse (top)
    `<ellipse cx="${bCX}" cy="${htY + 8}" rx="${bHW + 2}" ry="7" fill="url(#bLid)"/>`,
    // Knob on lid
    `<ellipse cx="${bCX}" cy="${htY + 3}" rx="7" ry="5" fill="${metalLight}"/>`,
    `<ellipse cx="${bCX}" cy="${htY + 2}" rx="4" ry="3" fill="${metalDark}"/>`,
    // Left edge highlight streak
    `<rect x="${bCX - bHW + 3}" y="${htY + 10}" width="6" height="${binH - 16}" rx="3" fill="${metalLight}" fill-opacity="0.6"/>`,
    // Secondary highlight
    `<rect x="${bCX - bHW + 13}" y="${htY + 12}" width="3" height="${binH - 20}" rx="1.5" fill="white" fill-opacity="0.22"/>`,
    // Horizontal rib lines (bin texture)
    `<line x1="${bCX - bHW + 1}" y1="${htY + 24}" x2="${bCX + bHW - 1}" y2="${htY + 24}" stroke="${metalDark}" stroke-width="1.5" stroke-opacity="0.45"/>`,
    `<line x1="${bCX - bHW + 1}" y1="${htY + 40}" x2="${bCX + bHW - 1}" y2="${htY + 40}" stroke="${metalDark}" stroke-width="1.5" stroke-opacity="0.45"/>`,
    // Visor slot (eye slit)
    `<rect x="${bCX - bHW + 5}" y="${htY + 17}" width="${bHW * 2 - 10}" height="13" rx="3" fill="url(#bVisor)"/>`,
    // Visor inner glow / scan-line
    `<rect x="${bCX - bHW + 8}" y="${htY + 20}" width="${bHW * 2 - 16}" height="4" rx="2" fill="#2080C0" fill-opacity="0.55"/>`,
    // Side handles (bin ears)
    `<path d="M${bCX - bHW} ${htY + 20} Q${bCX - bHW - 12} ${htY + 25} ${bCX - bHW - 10} ${htY + 35} Q${bCX - bHW - 8} ${htY + 42} ${bCX - bHW} ${htY + 40}" stroke="${metalDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${bCX + bHW} ${htY + 20} Q${bCX + bHW + 12} ${htY + 25} ${bCX + bHW + 10} ${htY + 35} Q${bCX + bHW + 8} ${htY + 42} ${bCX + bHW} ${htY + 40}" stroke="${metalDark}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
    // Bottom rim ellipse
    `<ellipse cx="${bCX}" cy="${hbY}" rx="${bHW + 1}" ry="5" fill="${metalDark}"/>`,
  ].join('\n');

  // ── Neck ──────────────────────────────────────────────────────────────────
  const neckY = hbY + 3;
  const neck  = `<rect x="58" y="${neckY}" width="12" height="10" rx="4" fill="${suitColor}"/>`;

  // ── Body ──────────────────────────────────────────────────────────────────
  const bodyY = neckY + 6;
  const body  = [
    // Suit torso
    `<path d="M22 ${bodyY + 10} Q14 ${bodyY + 48} 16 112 L112 112 Q114 ${bodyY + 48} 106 ${bodyY + 10} Q92 ${bodyY} 76 ${bodyY + 4} L70 ${bodyY + 14} L64 ${bodyY + 8} L58 ${bodyY + 14} L52 ${bodyY + 4} Q36 ${bodyY} 22 ${bodyY + 10}Z" fill="url(#bSuit)"/>`,
    // Campaign blue accent stripes
    `<rect x="24" y="${bodyY + 10}" width="11" height="38" rx="5" fill="#4A90D9" fill-opacity="0.85"/>`,
    `<rect x="93" y="${bodyY + 10}" width="11" height="38" rx="5" fill="#4A90D9" fill-opacity="0.85"/>`,
    // Badge / medal
    `<circle cx="64" cy="${bodyY + 22}" r="11" fill="url(#bBadge)"/>`,
    `<circle cx="64" cy="${bodyY + 22}" r="8" fill="none" stroke="#FFE060" stroke-width="1.5" stroke-opacity="0.7"/>`,
    // Star polygon on badge
    `<polygon points="64,${bodyY + 14} 65.5,${bodyY + 19.5} 71,${bodyY + 19.5} 66.5,${bodyY + 23} 68,${bodyY + 28.5} 64,${bodyY + 25} 60,${bodyY + 28.5} 61.5,${bodyY + 23} 57,${bodyY + 19.5} 62.5,${bodyY + 19.5}" fill="#7A3800"/>`,
    // Lapels
    `<polygon points="52,${bodyY + 4} 34,${bodyY + 18} 44,${bodyY + 24} 58,${bodyY + 12}" fill="${suitDark}"/>`,
    `<polygon points="76,${bodyY + 4} 94,${bodyY + 18} 84,${bodyY + 24} 70,${bodyY + 12}" fill="${suitDark}"/>`,
    // Suit buttons
    `<circle cx="64" cy="${bodyY + 40}" r="2.5" fill="${suitDark}"/>`,
    `<circle cx="64" cy="${bodyY + 52}" r="2.5" fill="${suitDark}"/>`,
    // Win: cape panels
    win ? [
      `<path d="M22 ${bodyY + 10} Q6 ${bodyY + 60} 10 112" stroke="#2A2A4E" stroke-width="16" fill="none" stroke-linecap="round"/>`,
      `<path d="M106 ${bodyY + 10} Q122 ${bodyY + 60} 118 112" stroke="#2A2A4E" stroke-width="16" fill="none" stroke-linecap="round"/>`,
    ].join('\n') : '',
  ].join('\n');

  // ── Left arm (attack = milkshake hose) ────────────────────────────────────
  const lAX = 20, lAY = bodyY + 10;
  const lHX = 8,  lHY = lAY + 36 + la;

  const leftArm = attack
    ? [
        // Sleeve
        `<path d="M${lAX} ${lAY} Q${lHX + 8} ${lAY + 16} ${lHX + 2} ${lHY - 8}" stroke="${suitColor}" stroke-width="18" fill="none" stroke-linecap="round"/>`,
        // Hand
        `<ellipse cx="${lHX + 4}" cy="${lHY}" rx="8" ry="7" fill="#C0A070"/>`,
        // Hose (green rubber pipe)
        `<path d="M${lHX} ${lHY - 4} Q${lHX - 12} ${lHY - 4} ${lHX - 20} ${lHY - 12}" stroke="#4A7A3A" stroke-width="7" fill="none" stroke-linecap="round"/>`,
        `<circle cx="${lHX - 20}" cy="${lHY - 12}" r="5.5" fill="#3A6A2A"/>`,
        // Milkshake stream
        `<path d="M${lHX - 24} ${lHY - 14} Q${lHX - 42} ${lHY - 18} ${lHX - 52} ${lHY - 26}" stroke="url(#bMilk)" stroke-width="9" fill="none" stroke-linecap="round" stroke-opacity="0.9"/>`,
        `<circle cx="${lHX - 52}" cy="${lHY - 26}" r="9" fill="white" fill-opacity="0.85"/>`,
        `<circle cx="${lHX - 44}" cy="${lHY - 22}" r="5" fill="white" fill-opacity="0.7"/>`,
      ].join('\n')
    : [
        `<path d="M${lAX} ${lAY} Q${lHX + 4} ${lAY + 18 + la} ${lHX} ${lHY - 8}" stroke="${suitColor}" stroke-width="18" fill="none" stroke-linecap="round"/>`,
        `<ellipse cx="${lHX + 4}" cy="${lHY}" rx="8" ry="7" fill="#C0A070"/>`,
      ].join('\n');

  // ── Right arm ─────────────────────────────────────────────────────────────
  const rAX = 108, rAY = bodyY + 10;
  const rHX = 120, rHY = rAY + 36 + la;

  const rightArm = [
    `<path d="M${rAX} ${rAY} Q${rHX - 6} ${rAY + 18 + la} ${rHX - 2} ${rHY - 8}" stroke="${suitColor}" stroke-width="18" fill="none" stroke-linecap="round"/>`,
    `<ellipse cx="${rHX - 5}" cy="${rHY}" rx="8" ry="7" fill="#C0A070"/>`,
  ].join('\n');

  // ── Legs / metallic boots ─────────────────────────────────────────────────
  const hipsY = 110 + yOff;
  const llx   = 46 + ll;
  const rlx   = 82 + rl;
  const legBotY = 152 + yOff;
  const bootBotY = 159 + yOff;

  const trousers = [
    `<rect x="24" y="${hipsY}" width="80" height="10" rx="4" fill="${suitDark}"/>`,
    // Left leg
    `<path d="M38 ${hipsY + 8} Q${llx} ${hipsY + 28} ${llx} ${legBotY}" stroke="${suitColor}" stroke-width="20" fill="none" stroke-linecap="round"/>`,
    // Right leg
    `<path d="M90 ${hipsY + 8} Q${rlx} ${hipsY + 28} ${rlx} ${legBotY}" stroke="${suitColor}" stroke-width="20" fill="none" stroke-linecap="round"/>`,
    // Left boot (metallic)
    `<path d="M${llx - 12} ${legBotY} Q${llx - 10} ${bootBotY} ${llx + 14} ${bootBotY} Q${llx + 18} ${bootBotY - 2} ${llx + 12} ${legBotY}Z" fill="url(#bBoot)"/>`,
    `<path d="M${llx - 9} ${legBotY + 2} Q${llx} ${legBotY + 5} ${llx + 9} ${legBotY + 3}" stroke="${metalLight}" stroke-width="1.5" fill="none" stroke-opacity="0.5"/>`,
    // Right boot
    `<path d="M${rlx - 12} ${legBotY} Q${rlx - 10} ${bootBotY} ${rlx + 14} ${bootBotY} Q${rlx + 18} ${bootBotY - 2} ${rlx + 12} ${legBotY}Z" fill="url(#bBoot)"/>`,
    `<path d="M${rlx - 9} ${legBotY + 2} Q${rlx} ${legBotY + 5} ${rlx + 9} ${legBotY + 3}" stroke="${metalLight}" stroke-width="1.5" fill="none" stroke-opacity="0.5"/>`,
  ].join('\n');

  return svgDoc(defs, [trousers, body, neck, leftArm, rightArm, binHead].join('\n'));
}

const binfaceFrames = {
  'idle-0':   buildBinface({ legPhase: 0, armPhase: 0 }),
  'idle-1':   buildBinface({ legPhase: 0, armPhase: 1 }),
  'walk-0':   buildBinface({ legPhase: 0, armPhase: 0 }),
  'walk-1':   buildBinface({ legPhase: 1, armPhase: 0 }),
  'walk-2':   buildBinface({ legPhase: 0, armPhase: 1 }),
  'walk-3':   buildBinface({ legPhase: 2, armPhase: 1 }),
  'jump-0':   buildBinface({ legPhase: 0, armPhase: 0, jump: true }),
  'jump-1':   buildBinface({ legPhase: 1, armPhase: 1, jump: true }),
  'attack-0': buildBinface({ legPhase: 0, armPhase: 0, attack: true }),
  'attack-1': buildBinface({ legPhase: 0, armPhase: 1, attack: true }),
  'attack-2': buildBinface({ legPhase: 0, armPhase: 0 }),
  'hurt-0':   buildBinface({ legPhase: 0, armPhase: 1, hurt: true }),
  'hurt-1':   buildBinface({ legPhase: 2, armPhase: 0, hurt: true }),
  'win-0':    buildBinface({ legPhase: 0, armPhase: 0, win: true }),
  'win-1':    buildBinface({ legPhase: 0, armPhase: 1, win: true }),
  'win-2':    buildBinface({ legPhase: 1, armPhase: 0, win: true }),
};

// ─── SPRITE SHEET STITCHER ────────────────────────────────────────────────────

async function buildSpriteSheet(frames, outName) {
  const keys  = Object.keys(frames);
  const cols  = Math.ceil(Math.sqrt(keys.length));
  const rows  = Math.ceil(keys.length / cols);
  const sheetW = cols * W;
  const sheetH = rows * H;

  const buffers = await Promise.all(
    keys.map((key) =>
      sharp(Buffer.from(frames[key]))
        .resize(W, H)
        .png()
        .toBuffer()
    )
  );

  const composites = buffers.map((buf, i) => ({
    input: buf,
    left: (i % cols) * W,
    top:  Math.floor(i / cols) * H,
  }));

  const sheetPath = resolve(OUT_DIR, `${outName}.png`);
  await sharp({
    create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toFile(sheetPath);

  const atlas = {
    frames: {},
    meta: { image: `${outName}.png`, size: { w: sheetW, h: sheetH }, scale: '1' },
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

  writeFileSync(resolve(OUT_DIR, `${outName}-atlas.json`), JSON.stringify(atlas, null, 2));
  console.log(`✓ ${outName}.png  (${cols}×${rows} grid, ${keys.length} frames, ${W}×${H}px each)`);
  console.log(`✓ ${outName}-atlas.json`);
}

async function main() {
  console.log(`Generating high-fidelity sprite sheets at ${W}×${H}px per frame…`);
  await buildSpriteSheet(farageFrames,  'farage');
  await buildSpriteSheet(binfaceFrames, 'binface');
  console.log('\nAll sprite sheets written to public/assets/sprites/');
}

main().catch((err) => { console.error(err); process.exit(1); });
