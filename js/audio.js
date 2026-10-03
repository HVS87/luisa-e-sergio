// Som "chiptune" gerado com WebAudio (sem ficheiros de som): efeitos e música de fundo.
// Os efeitos e a música têm volumes (e botões de silêncio) independentes.
let ac = null;
let sfxBus = null, musicBus = null;
let muted = false;        // efeitos sonoros desligados
let musicMuted = false;   // música desligada
let ducked = false;       // música mais baixa (por exemplo, na pausa)

function tone(freq, at, dur, type = 'square', vol = 0.06, slideTo = 0, bus = sfxBus, start = ac.currentTime) {
  const t0 = start + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(bus);
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
  slurp: () => tone(520, 0, 0.09, 'sine', 0.07, 300),
  chirp: () => { tone(2300, 0, 0.06, 'sine', 0.04, 3100); tone(2700, 0.09, 0.06, 'sine', 0.04, 3300); tone(2300, 0.18, 0.08, 'sine', 0.04, 3000); },
  ring: () => { tone(1400, 0, 0.09, 'square', 0.05); tone(1750, 0.1, 0.09, 'square', 0.05); },
  kiss: () => { tone(900, 0, 0.08, 'sine', 0.08, 1600); tone(1319, 0.12, 0.3, 'triangle', 0.08); },
  fanfare: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.16, 0.24, 'square', 0.05)),
};

// ---------- Música ----------
// Cada faixa é uma sequência de compassos de 8 colcheias: um acorde por compasso (que dá o
// baixo e o arpejo) e a melodia, escrita como notas ('E5'), '-' (prolonga a nota anterior)
// ou '.' (pausa). As melodias são originais, compostas para o jogo.
const TRACKS = {
  // menu e momentos ternos: calma, em dó maior
  menu: {
    bpm: 88, lead: 'triangle', leadVol: 0.05, arp: 'square', arpVol: 0.012, bassVol: 0.06,
    chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
    melody: [
      'E5 - - G5 E5 - C5 -', 'D5 - - G5 D5 - B4 -', 'C5 - E5 - A5 - G5 -', 'F5 - E5 - D5 - C5 -',
      'E5 - G5 - C6 - G5 -', 'B5 - A5 - G5 - D5 -', 'A5 - G5 - F5 - E5 D5', 'C5 - - - . . . .',
    ],
  },
  // durante os níveis: alegre e mexida
  play: {
    bpm: 132, lead: 'square', leadVol: 0.028, arp: 'square', arpVol: 0.011, bassVol: 0.065,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'],
    melody: [
      'G5 . G5 E5 G5 - C6 -', 'A5 . A5 E5 A5 - C6 -', 'C6 B5 A5 G5 F5 - A5 -', 'G5 - D5 - G5 F5 E5 D5',
      'E5 . E5 G5 C6 - E6 -', 'D6 C6 B5 A5 E5 - A5 -', 'F5 G5 A5 C6 D6 - C6 A5', 'G5 - - - D5 E5 F5 D5',
    ],
  },
  // noites e momentos tranquilos (a aurora, a pandemia)
  calm: {
    bpm: 72, lead: 'sine', leadVol: 0.06, arp: 'triangle', arpVol: 0.03, bassVol: 0.05,
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
    melody: [
      'E5 - - - A5 - - -', 'C6 - - - A5 - G5 -', 'G5 - - - E5 - - -', 'D5 - - - G5 - B4 -',
      'C5 - E5 - A5 - - -', 'A5 - C6 - F6 - E6 -', 'E6 - D6 - C6 - G5 -', 'B5 - - - . . . .',
    ],
  },
  // festa: o casamento e os finais
  party: {
    bpm: 120, lead: 'square', leadVol: 0.03, arp: 'triangle', arpVol: 0.03, bassVol: 0.065,
    chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
    melody: [
      'C5 E5 G5 C6 - - G5 -', 'A5 - C6 - F6 - C6 -', 'B5 - D6 - G6 - F6 -', 'E6 - C6 - G5 - - -',
      'A5 B5 C6 - E6 - C6 -', 'F6 - E6 - D6 - C6 -', 'D6 - B5 - G5 A5 B5 D6', 'C6 - - - G5 - - -',
    ],
  },
};

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freqOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
function midiOf(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
// Acorde → notas MIDI da tríade, a partir da oitava 3 ('Am' = lá, dó, mi).
function triad(chord) {
  const minor = chord.endsWith('m');
  const root = midiOf(chord.replace('m', '') + '3');
  return [root, root + (minor ? 3 : 4), root + 7];
}
// Prepara uma faixa: uma lista de colcheias com { note, len } (ou null) para a melodia.
const prepared = {};
function prepare(name) {
  if (prepared[name]) return prepared[name];
  const tr = TRACKS[name], tokens = tr.melody.join(' ').split(/\s+/);
  const lead = tokens.map((tok, i) => {
    if (tok === '-' || tok === '.') return null;
    let len = 1;
    while (tokens[i + len] === '-') len++;
    return { f: freqOf(midiOf(tok)), len };
  });
  prepared[name] = { ...tr, lead: lead, wave: tr.lead, chords: tr.chords.map(triad), steps: tokens.length };
  return prepared[name];
}

const music = { want: null, track: null, step: 0, next: 0, timer: 0 };

function musicLevel() { return musicMuted ? 0 : ducked ? 0.35 : 1; }
function applyMusicLevel() {
  if (!musicBus) return;
  const t = ac.currentTime;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setTargetAtTime(musicLevel(), t, 0.15);
}

// Agenda as colcheias que vão tocar nos próximos instantes (técnica do "lookahead").
function schedule() {
  if (!ac || ac.state !== 'running' || !music.track) return;
  const tr = music.track, eighth = 60 / tr.bpm / 2;
  if (music.next < ac.currentTime) music.next = ac.currentTime + 0.05;
  while (music.next < ac.currentTime + 0.25) {
    const s = music.step % tr.steps, bar = Math.floor(s / 8), beat = s % 8;
    const ch = tr.chords[bar % tr.chords.length], t0 = music.next;
    const n = tr.lead[s];
    if (n) tone(n.f, 0, eighth * n.len * 0.95, tr.wave, tr.leadVol, 0, musicBus, t0);
    // arpejo: notas do acorde, a subir e descer, uma oitava acima do baixo
    const arpNote = ch[[0, 1, 2, 1][beat % 4]] + 12;
    tone(freqOf(arpNote), 0, eighth * 0.8, tr.arp, tr.arpVol, 0, musicBus, t0);
    // baixo: fundamental nos tempos 1 e 3, quinta nos tempos 2 e 4
    if (beat % 2 === 0) tone(freqOf((beat % 4 === 0 ? ch[0] : ch[2]) - 12), 0, eighth * 1.7, 'triangle', tr.bassVol, 0, musicBus, t0);
    music.step++;
    music.next += eighth;
  }
}

function startMusic() {
  if (!ac || ac.state !== 'running' || document.hidden || musicMuted || !music.want) return;
  if (!music.track || music.track.name !== music.want) {
    music.track = { ...prepare(music.want), name: music.want };
    music.step = 0;
    music.next = ac.currentTime + 0.12;
  }
  if (!music.timer) music.timer = setInterval(schedule, 50);
  schedule();
}

function stopMusic(forget) {
  if (music.timer) clearInterval(music.timer);
  music.timer = 0;
  if (forget) music.track = null;
}

export const audio = {
  get muted() { return muted; },
  setMuted(m) { muted = !!m; },

  get musicMuted() { return musicMuted; },
  setMusicMuted(m) {
    musicMuted = !!m;
    if (!ac) return;
    applyMusicLevel();
    if (musicMuted) stopMusic(true); else startMusic();
  },

  // Escolhe a faixa de música ('menu', 'play', 'calm', 'party').
  setTrack(name) {
    if (!TRACKS[name]) name = 'play';
    if (music.want === name) return;
    music.want = name;
    stopMusic(true);
    startMusic();
  },

  // Baixa a música (pausa) ou repõe o volume normal.
  duck(on) {
    ducked = !!on;
    if (ac) applyMusicLevel();
  },

  // Os browsers só permitem som depois de um gesto do utilizador.
  unlock() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        sfxBus = ac.createGain();
        sfxBus.connect(ac.destination);
        musicBus = ac.createGain();
        musicBus.gain.value = musicLevel();
        musicBus.connect(ac.destination);
        ac.onstatechange = () => { if (ac.state === 'running') startMusic(); };
      }
      // no iOS o contexto pode ficar "suspended" ou "interrupted" (chamadas, ecrã bloqueado)
      if (ac.state !== 'running') ac.resume().then(startMusic, () => {});
      else startMusic();
    } catch (err) { /* sem áudio */ }
  },

  // Chamado quando a página fica escondida ou volta a estar visível.
  visibility(hidden) {
    if (!ac) return;
    if (hidden) { stopMusic(false); if (ac.suspend) ac.suspend().catch(() => {}); }
    else if (ac.resume) ac.resume().then(startMusic, () => {});
  },

  play(name) {
    if (muted || !ac || ac.state !== 'running') return;
    const s = SOUNDS[name];
    if (s) try { s(); } catch (err) { /* ignora */ }
  },
};
