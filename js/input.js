// Entrada unificada: teclado + ecrã tátil.
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyX: 'jump',
  Enter: 'action',
};

const kb = { left: false, right: false, jump: false, action: false };
const tc = { left: false, right: false, jump: false, action: false };
let opts = {};

export const input = {
  left: false,
  right: false,
  jump: false,          // salto mantido premido
  jumpPressed: false,   // salto premido neste instante
  action: false,        // ação dos minijogos (salto, Enter, ou tocar/clicar no ecrã) mantida premida
  actionPressed: false, // ação premida neste instante
  pointerX: -1,         // posição horizontal do dedo/rato enquanto toca no jogo (0 a 1), ou -1
  touch: false,         // true quando o jogador está a usar o ecrã tátil

  init(options) {
    opts = options || {};
    setTouch(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    bindKeyboard();
    bindTouch();
    const reset = () => this.reset();
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
  },

  endFrame() { this.jumpPressed = false; this.actionPressed = false; },

  reset() {
    kb.left = kb.right = kb.jump = kb.action = false;
    tc.left = tc.right = tc.jump = tc.action = false;
    this.jumpPressed = this.actionPressed = false;
    sync();
  },
};

function sync() {
  input.left = kb.left || tc.left;
  input.right = kb.right || tc.right;
  input.jump = kb.jump || tc.jump;
  input.action = input.jump || kb.action || tc.action;
}

function setTouch(on) {
  if (input.touch === on) return;
  input.touch = on;
  document.body.classList.toggle('is-touch', on);
  if (opts.onModeChange) opts.onModeChange();
}

function bindKeyboard() {
  window.addEventListener('keydown', (e) => {
    const playing = document.body.classList.contains('playing');
    if (e.code === 'Escape') { if (opts.onEscape) opts.onEscape(); e.preventDefault(); return; }
    if (e.code === 'KeyP') { if (opts.onPause) opts.onPause(); return; }
    const k = KEYS[e.code];
    if (!k) return;
    if (playing) { e.preventDefault(); setTouch(false); }
    if ((k === 'jump' || k === 'action') && !e.repeat && !kb[k]) {
      if (k === 'jump') input.jumpPressed = true;
      input.actionPressed = true;
    }
    kb[k] = true;
    sync();
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYS[e.code];
    if (!k) return;
    kb[k] = false;
    sync();
  });
}

function bindTouch() {
  window.addEventListener('touchstart', () => setTouch(true), { passive: true, capture: true });

  // Direcional: um único elemento dividido em duas metades, para o polegar poder deslizar.
  const pad = document.getElementById('pad');
  const pointers = new Map();
  const dirOf = (e) => {
    const r = pad.getBoundingClientRect();
    return e.clientX < r.left + r.width / 2 ? 'left' : 'right';
  };
  const update = () => {
    let l = false, r = false;
    pointers.forEach((d) => { if (d === 'left') l = true; else r = true; });
    tc.left = l; tc.right = r;
    pad.dataset.dir = l && !r ? 'left' : r && !l ? 'right' : '';
    sync();
  };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ }
    pointers.set(e.pointerId, dirOf(e));
    update();
  });
  pad.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, dirOf(e));
    update();
  });
  const padEnd = (e) => { if (pointers.delete(e.pointerId)) update(); };
  pad.addEventListener('pointerup', padEnd);
  pad.addEventListener('pointercancel', padEnd);
  pad.addEventListener('lostpointercapture', padEnd);

  // Botão de salto
  const jump = document.getElementById('jump');
  const jumpers = new Set();
  const jumpSync = () => {
    tc.jump = jumpers.size > 0;
    jump.classList.toggle('on', tc.jump);
    sync();
  };
  jump.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { jump.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ }
    jumpers.add(e.pointerId);
    input.jumpPressed = true;
    input.actionPressed = true;
    jumpSync();
  });
  const jumpEnd = (e) => { if (jumpers.delete(e.pointerId)) jumpSync(); };
  jump.addEventListener('pointerup', jumpEnd);
  jump.addEventListener('pointercancel', jumpEnd);
  jump.addEventListener('lostpointercapture', jumpEnd);

  // Tocar ou clicar em qualquer ponto do jogo: botão de ação dos minijogos
  const canvas = document.getElementById('game');
  const taps = new Set();
  const tapSync = () => { tc.action = taps.size > 0; if (!tc.action) input.pointerX = -1; sync(); };
  const tapMove = (e) => { if (taps.has(e.pointerId)) input.pointerX = e.clientX / Math.max(1, window.innerWidth); };
  canvas.addEventListener('pointerdown', (e) => {
    if (!document.body.classList.contains('playing')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ }
    taps.add(e.pointerId);
    input.actionPressed = true;
    tapMove(e);
    tapSync();
  });
  canvas.addEventListener('pointermove', tapMove);
  const tapEnd = (e) => { if (taps.delete(e.pointerId)) tapSync(); };
  canvas.addEventListener('pointerup', tapEnd);
  canvas.addEventListener('pointercancel', tapEnd);
  canvas.addEventListener('lostpointercapture', tapEnd);

  // Quando a janela perde o foco, larga tudo.
  const clear = () => { pointers.clear(); jumpers.clear(); taps.clear(); update(); jumpSync(); tapSync(); };
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);

  // Evita zoom, menus de contexto e "elástico" do iOS (exceto em zonas com scroll).
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (!e.target.closest || !e.target.closest('.scroll')) e.preventDefault();
  }, { passive: false });
}
