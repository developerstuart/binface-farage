// Retro arcade sound effects via Web Audio API — no assets needed.
// All sounds are procedurally generated square/noise waves.

let _ctx = null;

function ctx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      return null;
    }
  }
  // Resume after user gesture
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function tone(freq, duration, type = 'square', vol = 0.18, startDelay = 0) {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime + startDelay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function sweep(freqStart, freqEnd, duration, type = 'square', vol = 0.15) {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function noise(duration, vol = 0.12) {
  const c = ctx();
  if (!c) return;
  const sampleRate = c.sampleRate;
  const samples = Math.ceil(sampleRate * duration);
  const buf = c.createBuffer(1, samples, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  src.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.start();
  src.stop(c.currentTime + duration + 0.01);
}

const SFX = {
  jump:        () => sweep(180, 420, 0.15, 'square', 0.14),
  fire_milk:   () => { sweep(600, 280, 0.12, 'sawtooth', 0.1); noise(0.06, 0.06); },
  fire_beer:   () => sweep(300, 140, 0.18, 'square', 0.14),
  milk_splat:  () => { noise(0.1, 0.14); tone(200, 0.08, 'square', 0.08, 0.04); },
  beer_splash: () => { noise(0.18, 0.16); sweep(260, 80, 0.2, 'sawtooth', 0.08); },
  hit_farage:  () => { noise(0.07, 0.2); sweep(440, 110, 0.15, 'square', 0.12); },
  hit_binface: () => { noise(0.07, 0.18); sweep(330, 90, 0.15, 'square', 0.1); },
  reveal:      () => { tone(440, 0.07, 'square', 0.12); tone(660, 0.1, 'square', 0.1, 0.07); },
  sever:       () => {
    sweep(880, 220, 0.18, 'sawtooth', 0.16);
    noise(0.12, 0.12);
    tone(110, 0.2, 'square', 0.1, 0.1);
  },
  win: () => {
    [0, 0.12, 0.22, 0.34].forEach((d, i) => {
      tone([523, 659, 784, 1047][i], 0.18, 'square', 0.14, d);
    });
  },
  lose: () => {
    [0, 0.15, 0.3].forEach((d, i) => {
      tone([330, 277, 220][i], 0.22, 'sawtooth', 0.14, d);
    });
  },
};

export function sfx(key) {
  try {
    SFX[key]?.();
  } catch (_) {
    // Web Audio not available — silent fallback
  }
}
