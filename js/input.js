// Entrada unificada: teclado + ecrã tátil.
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyX: 'jump',
};

const kb = { left: false, right: false, jump: false };
const tc = { left: false, right: false, jump: false };
let opts = {};

export const input = {
  left: false,
  right: false,
  jump: false,          // salto mantido premido
  jumpPressed: false,   // salto premido neste instante
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

  endFrame() { this.jumpPressed = false; },

  reset() {
    kb.left = kb.right = kb.jump = false;
    tc.left = tc.right = tc.jump = false;
    sync();
  },
};

function sync() {
  input.left = kb.left || tc.left;
  input.right = kb.right || tc.right;
  input.jump = kb.jump || tc.jump;
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
    if (k === 'jump' && !e.repeat && !kb.jump) input.jumpPressed = true;
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
    jumpSync();
  });
  const jumpEnd = (e) => { if (jumpers.delete(e.pointerId)) jumpSync(); };
  jump.addEventListener('pointerup', jumpEnd);
  jump.addEventListener('pointercancel', jumpEnd);
  jump.addEventListener('lostpointercapture', jumpEnd);

  // Quando a janela perde o foco, larga tudo.
  const clear = () => { pointers.clear(); jumpers.clear(); update(); jumpSync(); };
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
