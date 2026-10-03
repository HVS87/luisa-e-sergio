// Efeitos sonoros "chiptune" gerados com WebAudio (sem ficheiros de som).
let ac = null;
let muted = false;

function tone(freq, at, dur, type = 'square', vol = 0.06, slideTo = 0) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.06, 'square', 0.04),
  jump: () => tone(330, 0, 0.14, 'square', 0.05, 660),
  heart: () => { tone(988, 0, 0.08, 'square', 0.05); tone(1319, 0.07, 0.14, 'square', 0.05); },
  stomp: () => tone(220, 0, 0.12, 'triangle', 0.1, 440),
  hurt: () => tone(300, 0, 0.3, 'sawtooth', 0.05, 90),
  check: () => { tone(523, 0, 0.08, 'triangle', 0.08); tone(784, 0.08, 0.12, 'triangle', 0.08); },
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.16, 'square', 0.05)),
  boom: () => { tone(160, 0, 0.35, 'triangle', 0.09, 45); tone(900 + Math.random() * 600, 0.02, 0.2, 'square', 0.012, 200); },
  saw: () => [0, 0.09, 0.18, 0.27].forEach((d, i) => tone(i % 2 ? 150 : 190, d, 0.08, 'sawtooth', 0.05)),
  toc: () => { tone(520, 0, 0.07, 'triangle', 0.14, 180); tone(140, 0, 0.1, 'square', 0.05, 70); },
  buzz: () => { tone(110, 0, 0.5, 'sawtooth', 0.08); tone(116, 0, 0.5, 'square', 0.04); },
  inject: () => tone(300, 0, 0.5, 'sine', 0.06, 700),
  pop: () => { tone(500, 0, 0.1, 'square', 0.05, 1200); tone(1319, 0.1, 0.16, 'square', 0.05); },
  fanfare: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.16, 0.24, 'square', 0.05)),
};

export const audio = {
  get muted() { return muted; },
  setMuted(m) { muted = !!m; },

  // Os browsers só permitem som depois de um gesto do utilizador.
  unlock() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ac = new AC();
      }
      if (ac && ac.state === 'suspended') ac.resume();
    } catch (err) { /* sem áudio */ }
  },

  play(name) {
    if (muted || !ac || ac.state !== 'running') return;
    const s = SOUNDS[name];
    if (s) try { s(); } catch (err) { /* ignora */ }
  },
};
