// Nível da casa nova: uma vivenda de dois andares, com jardim e piscina, em Campolide,
// mesmo junto ao Aqueduto das Águas Livres, com a obra orientada pelo Tio Alberto (arquiteto).
//
//   1. A obra: a grua passa de um lado para o outro com cada peça (fundações, rés-do-chão,
//      laje, 1.º andar, telhado); toca-se para a largar em cima da planta. À primeira e bem
//      centrada vale um coração; fora da planta, a peça volta a subir.
//   2. A piscina: mantém-se premido para a encher até à linha dos azulejos.
//   3. O jardim cresce sozinho e entra-se em casa: penduram-se as fotografias das memórias
//      dos níveis anteriores. Cada quadro balança; tocar quando está direito vale um coração.
//
// Controlos: tocar no ecrã (ou Espaço/Enter); manter premido para encher a piscina.
import { LEVELS } from '../levels/index.js';
import { getCharacter } from '../sprites.js';
import { Particles } from '../fx.js';
import { drawMemory } from '../memories.js';

const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Peças da obra, de baixo para cima: altura em píxeis e largura em relação à casa.
const PIECES = [
  { h: 6, w: 1.1 },    // fundações
  { h: 28, w: 1 },     // rés-do-chão
  { h: 4, w: 1.06 },   // laje do 1.º andar
  { h: 26, w: 1 },     // 1.º andar
  { h: 18, w: 1.14 },  // telhado
];
const PERFECT = 5, NEAR = 15;            // desvio (px) para "ao milímetro" e para ainda caber na planta
const POOL_LO = 0.74, POOL_HI = 0.92;    // linha dos azulejos (fração da altura da piscina)
const TILT = 14, STRAIGHT = 4.5;         // balanço dos quadros e tolerância para ficarem direitos (graus)
const SKY = ['#5aaeea', '#74bdf0', '#93cdf3', '#b5ddf5', '#d8ecf3'];
const PHOTO_BG = ['#cfe8f5', '#ffe2c8', '#d8f0d0', '#f5e0f0', '#fff1c4'];

export class HouseScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.photos = this.level.photos;
    this.total = PIECES.length + 1 + this.photos.length;
    this.luisa = getCharacter('luisa', 'obra');
    this.sergio = getCharacter('sergio', 'obra');
    this.luisaHome = getCharacter('luisa', 'casual');
    this.sergioHome = getCharacter('sergio', 'casual');
    this.alberto = getCharacter('alberto');
    this.albertoHome = getCharacter('alberto', 'casa');
    this.frames = new Map();
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'intro';      // intro → crane ⇄ drop → built → pool → garden → inside → photo ⇄ hung → end → done
    this.got = 0;
    this.i = 0;                // peça atual
    this.placed = 0;           // peças já assentes
    this.firstTry = true;
    this.phase = 0;
    this.hookX = 0;
    this.fall = null;
    this.timer = 0;
    this.lock = 0;
    this.sayT = 0;
    this.joy = 0;
    this.pool = { level: 0, holding: false, clean: true };
    this.garden = 0;
    this.k = 0;                // fotografia atual
    this.angle = 0;
    this.hung = [];            // inclinação final de cada quadro
    this.fx = new Particles();
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() { this.game.ui.setLevelMode(false, false); }

  begin() {
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.state = 'crane';
    this.timer = 0;
    this.lock = 0.5;
    this.setBase(this.level.pieces[0]);
    this.say(this.level.intro, 4);
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'intro' || this.state === 'end' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  setBase(text) { this.baseHint = text; this.sayT = 0; this.game.ui.setHint(text); }
  say(text, secs) { this.game.ui.setHint(text); this.sayT = secs; }
  sfx(name) { this.game.audio.play(name); }

  heart(x, y) {
    this.got++;
    this.joy = 1;
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.sfx('heart');
    for (let n = 0; n < 4; n++) this.fx.heart(x - 8 + Math.random() * 16, y);
  }

  // Medidas da obra (vista de lado), em função do ecrã.
  geo(v) {
    const gy = Math.round(v.h * (v.portrait ? 0.74 : 0.86));
    const W = Math.round(Math.min(120, v.w * (v.portrait ? 0.4 : 0.38)));
    const cx = Math.round(v.w * 0.42);
    const poolX = cx + Math.round(W / 2) + 12;
    const poolW = Math.max(26, Math.min(64, v.w - poolX - 22));
    return { gy, W, cx, poolX, poolW, amp: Math.min(60, Math.round(v.w * 0.24)), jibY: v.portrait ? Math.round(v.h * 0.2) : 12 };
  }

  stackTop(g) {
    let y = g.gy;
    for (let n = 0; n < this.placed; n++) y -= PIECES[n].h;
    return y;
  }

  // Onde fica cada quadro na parede da sala.
  wall(v) {
    const n = this.photos.length, cols = v.portrait ? 3 : 5, rows = Math.ceil(n / cols);
    const fw = v.portrait ? 32 : 28, fh = v.portrait ? 30 : 26, gx = 10, gyap = 12;
    const floor = v.h - Math.round(v.portrait ? v.h * 0.16 : 24);
    const top = v.portrait ? Math.round(v.h * 0.2) : 48;
    const spots = [];
    for (let r = 0; r < rows; r++) {
      const inRow = Math.min(cols, n - r * cols), rowW = inRow * fw + (inRow - 1) * gx;
      for (let c = 0; c < inRow; c++) spots.push({ x: Math.round((v.w - rowW) / 2 + c * (fw + gx) + fw / 2), y: top + r * (fh + gyap) });
    }
    return { spots, fw, fh, floor };
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, v = this.game.view, g = this.geo(v);
    if (this.lock > 0) this.lock -= dt;
    if (this.joy > 0) this.joy -= dt;
    if (this.sayT > 0) {
      this.sayT -= dt;
      if (this.sayT <= 0 && this.state !== 'end') this.game.ui.setHint(this.baseHint);
    }
    const pressed = I.actionPressed && this.lock <= 0;
    this.timer += dt;

    if (this.state === 'crane' || this.state === 'drop') {
      // a grua vai e vem, cada vez um pouco mais depressa
      this.phase += dt * (1 + this.i * 0.15);
      this.hookX = g.cx + g.amp * Math.sin(this.phase);
    }

    if (this.state === 'crane') {
      if (pressed) {
        this.fall = { x: this.hookX, y: this.stackTop(g) - 16 - PIECES[this.i].h, vy: 0 };
        this.state = 'drop';
        this.sfx('click');
      }
    } else if (this.state === 'drop') {
      const f = this.fall, p = PIECES[this.i], top = this.stackTop(g);
      f.vy += 700 * dt;
      f.y += f.vy * dt;
      if (f.y + p.h >= top) this.land(g, Math.round(f.x - g.cx), top);
    } else if (this.state === 'built') {
      if (this.timer > 1.8) { this.state = 'pool'; this.timer = 0; this.lock = 0.3; this.setBase(this.level.poolHint); }
    } else if (this.state === 'pool') {
      this.fillPool(dt, I, pressed, g);
    } else if (this.state === 'garden') {
      this.garden = clamp(this.timer / 2.2, 0, 1);
      if (this.timer > 3.6) { this.state = 'inside'; this.timer = 0; }
    } else if (this.state === 'inside') {
      if (this.timer > 1.3) this.startPhoto();
    } else if (this.state === 'photo') {
      this.angle = TILT * Math.sin(this.timer * (Math.PI * 2) / 2.6 + 0.9);
      if (pressed && this.timer > 0.5) this.hang(v);
    } else if (this.state === 'hung') {
      if (this.timer > 1.1) {
        this.k++;
        if (this.k < this.photos.length) this.startPhoto();
        else {
          this.state = 'end';
          this.timer = 0;
          this.game.ui.setLevelMode(true, false);
          this.sfx('fanfare');
          this.game.ui.setHint(this.level.ending);
        }
      }
    } else if (this.state === 'end') {
      if (Math.floor(this.timer * 6) !== Math.floor((this.timer - dt) * 6)) this.fx.heart(v.w * 0.2 + Math.random() * v.w * 0.6, v.h * 0.55, Math.random() < 0.3 ? GOLD : PINK);
      if (this.timer > 4.5) this.finish();
    }
  }

  // A peça chega ao topo da obra: assenta (se couber na planta) ou volta para a grua.
  land(g, dx, top) {
    const f = this.fall, lines = this.level;
    this.fall = null;
    if (Math.abs(dx) > NEAR) {
      this.firstTry = false;
      this.state = 'crane';
      this.lock = 0.3;
      this.sfx('hurt');
      this.fx.burst(f.x, top, 10, ['#b9a67e', '#ffffff'], 50);
      this.say(lines.miss, 2);
      return;
    }
    const perfect = this.firstTry && Math.abs(dx) <= PERFECT;
    this.placed++;
    this.sfx('toc');
    this.fx.burst(g.cx, top, 14, ['#d8d0c0', '#ffffff', '#b9a67e'], 60);
    if (perfect) this.heart(g.cx, top - 20);
    this.i++;
    this.firstTry = true;
    if (this.i >= PIECES.length) {
      this.state = 'built';
      this.timer = 0;
      this.sfx('win');
      this.setBase(lines.built);
      return;
    }
    this.state = 'crane';
    this.lock = 0.25;
    this.setBase(lines.pieces[this.i]);
    // a meio da obra, o Tio Alberto conta uma curiosidade do Aqueduto
    this.say(this.i === 3 && lines.fact ? lines.fact : perfect ? lines.perfect : lines.near, this.i === 3 ? 4.5 : 1.8);
  }

  // Encher a piscina: manter premido e largar com a água na linha dos azulejos.
  fillPool(dt, I, pressed, g) {
    const p = this.pool;
    if (I.action && (p.holding || pressed)) {
      if (!p.holding) this.sfx('slurp');
      p.holding = true;
      p.level += 0.3 * dt;
      if (p.level >= 1) this.overflow(g);
    } else if (p.holding) {
      p.holding = false;
      if (p.level > POOL_HI) this.overflow(g);
      else if (p.level >= POOL_LO) {
        if (p.clean) this.heart(g.poolX + g.poolW / 2, g.gy - 10);
        else this.sfx('check');
        this.say(this.level.poolDone, 3);
        this.setBase(this.level.gardenLine);
        this.state = 'garden';
        this.timer = 0;
      } else this.say(this.level.poolLow, 1.5);
    }
  }

  overflow(g) {
    const p = this.pool;
    p.clean = false;
    p.holding = false;
    p.level = 0.55;
    this.lock = 0.6;
    this.sfx('buzz');
    this.fx.burst(g.poolX + g.poolW / 2, g.gy - 2, 16, ['#8fd0f5', '#ffffff'], 70);
    this.say(this.level.poolOver, 2);
  }

  startPhoto() {
    this.state = 'photo';
    this.timer = 0;
    this.lock = 0.2;
    const ph = this.photos[this.k];
    this.setBase(`${this.k + 1}/${this.photos.length} — ${ph.text}`);
    if (this.k === 0) this.say(this.level.photosHint, 3.5);
  }

  hang(v) {
    const a = this.angle, straight = Math.abs(a) <= STRAIGHT, W = this.wall(v), s = W.spots[this.k];
    this.hung.push(straight ? 0 : a * 0.6);
    this.state = 'hung';
    this.timer = 0;
    if (straight) { this.heart(s.x, s.y + W.fh / 2); this.say(this.level.straight, 1.1); }
    else { this.sfx('toc'); this.say(this.level.crooked, 1.1); }
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const inside = ['inside', 'photo', 'hung', 'end', 'done'].includes(this.state) && !(this.state === 'inside' && this.timer < 0.65);
    if (inside) this.drawInterior(ctx, v, R);
    else this.drawSite(ctx, v, R);
    this.fx.draw(ctx);
    // passagem para dentro de casa: escurece e volta a clarear
    if (this.state === 'inside') {
      const a = this.timer < 0.65 ? this.timer / 0.65 : clamp(1 - (this.timer - 0.65) / 0.65, 0, 1);
      R(0, 0, v.w, v.h, `rgba(10,6,20,${a.toFixed(2)})`);
    }
  }

  drawSite(ctx, v, R) {
    const g = this.geo(v), t = this.t, gy = g.gy;
    const skyAt = (y) => SKY[clamp(Math.floor((y / gy) * SKY.length), 0, SKY.length - 1)];
    // céu, sol e nuvens
    for (let k = 0; k < SKY.length; k++) R(0, Math.floor((gy * k) / SKY.length), v.w, Math.ceil(gy / SKY.length) + 1, SKY[k]);
    for (let dy = -9; dy < 9; dy++) { const hw = Math.round(Math.sqrt(81 - (dy + 0.5) ** 2)); R(Math.round(v.w * 0.84) - hw, Math.round(gy * 0.2) + dy, hw * 2, 1, '#fff3b0'); }
    for (let k = 0; k < 3; k++) {
      const cx = ((k * 137 + t * 3) % (v.w + 80)) - 40, cy = Math.round(gy * (0.12 + k * 0.1));
      R(cx - 12, cy, 24, 4, '#ffffff'); R(cx - 6, cy - 3, 12, 3, '#ffffff');
    }
    this.drawAqueduct(v, R, g, skyAt);
    // colinas de Monsanto e árvores à frente da base do Aqueduto
    for (let x = 0; x < v.w; x += 2) {
      const a = Math.round(10 + 5 * Math.sin(x * 0.04 + 1) + 3 * Math.sin(x * 0.017));
      R(x, gy - a, 2, a, '#7fb27a');
    }
    for (let x = 6; x < v.w; x += 23) R(x, gy - 18 - (x % 5), 7, 8, '#5f9a5c');
    // terreno: relva e, no lote, terra (que fica relva quando o jardim cresce)
    R(0, gy, v.w, v.h - gy, '#9a7048');
    R(0, gy, v.w, 3, '#7fbf5f');
    const lotA = g.cx - g.W / 2 - 10, lotB = Math.min(v.w - 4, g.poolX + g.poolW + 8);
    R(lotA, gy, lotB - lotA, 3, this.garden > 0.3 ? '#7fbf5f' : '#b98a58');
    for (let k = 0; k < 30; k++) R((k * 53) % v.w, gy + 6 + ((k * 29) % Math.max(6, v.h - gy - 8)), 2, 1, '#86603c');
    // planta da casa (contorno azul tracejado)
    const total = PIECES.reduce((s, p) => s + p.h, 0);
    for (let y = gy - total; y < gy; y += 4) { R(g.cx - g.W / 2 - 1, y, 1, 2, 'rgba(79,143,224,0.75)'); R(g.cx + g.W / 2, y, 1, 2, 'rgba(79,143,224,0.75)'); }
    for (let x = g.cx - g.W / 2; x < g.cx + g.W / 2; x += 4) R(x, gy - total, 2, 1, 'rgba(79,143,224,0.75)');
    // a casa, peça a peça
    let y = gy;
    for (let n = 0; n < this.placed; n++) { this.drawPiece(R, n, g.cx, y, g.W); y -= PIECES[n].h; }
    // piscina (em corte) e jardim
    this.drawPool(R, g);
    if (this.garden > 0) this.drawGarden(R, g);
    // grua: torre à direita, lança, carrinho e a peça pendurada
    if (this.placed < PIECES.length || this.state === 'built') this.drawCrane(v, R, g);
    // personagens (à escala da casa): o Tio Alberto com a planta, a Luísa e o Sérgio
    const px = Math.max(2, Math.round(g.cx - g.W / 2 - 50)), hop = this.joy > 0 ? Math.round(Math.abs(Math.sin(t * 10)) * 2) : 0;
    ctx.drawImage(this.alberto.stand.r, px, gy - 24);
    R(px + 12, gy - 13, 7, 5, '#dfefff'); R(px + 13, gy - 12, 5, 1, '#4f8fe0'); R(px + 13, gy - 10, 3, 1, '#4f8fe0');
    ctx.drawImage(this.luisa.stand.r, px + 17, gy - 24 - hop);
    ctx.drawImage(this.sergio.stand.r, px + 32, gy - 24 - hop);
  }

  drawAqueduct(v, R, g, skyAt) {
    const gy = g.gy, deck = Math.round(gy * 0.36), base = gy - 6;
    const STONE = '#dccdaa', SHADE = '#bba98a';
    R(0, deck - 5, v.w, base - deck + 5, STONE);
    R(0, deck - 5, v.w, 1, SHADE);
    R(0, deck, v.w, 2, SHADE);
    // respiros (pequenas torres) sobre a conduta
    for (let x = 18; x < v.w; x += 64) { R(x, deck - 10, 6, 5, STONE); R(x, deck - 10, 6, 1, SHADE); }
    // arcos em ogiva; o Arco Grande, mais largo e mais alto, fica à direita da casa
    const big = Math.round(v.w * 0.7);
    let x = -8;
    while (x < v.w + 8) {
      const isBig = Math.abs(x + 17 - big) < 14;
      const span = isBig ? 34 : 18, spring = deck + (isBig ? 16 : 20), apex = isBig ? 12 : 8;
      const a = x + 5, b = a + span;
      for (let yy = spring; yy < base; yy++) R(a, yy, span, 1, skyAt(yy));
      for (let r = 1; r <= apex; r++) {
        const hw = (span / 2) * Math.pow(1 - r / apex, 0.55), yy = spring - r;
        R(a + span / 2 - hw, yy, hw * 2, 1, skyAt(yy));
      }
      R(a - 1, spring, 1, base - spring, SHADE);
      x = b;
    }
  }

  // Peça n da casa, com o fundo em `bottom`, centrada em cx.
  drawPiece(R, n, cx, bottom, W) {
    const p = PIECES[n], w = Math.round(W * p.w), x = Math.round(cx - w / 2), y = bottom - p.h;
    const WALL = '#f6f2ea', WALLD = '#dcd6ca', GLASS = '#8fd0f5', FRAME = '#4a4a5a';
    if (n === 0 || n === 2) {
      R(x, y, w, p.h, '#a7a39c'); R(x, y, w, 1, '#c8c4bc');
      for (let k = x + 6; k < x + w; k += 12) R(k, y + 1, 1, p.h - 1, '#8f8b84');
    } else if (n === 1) {
      R(x, y, w, p.h, WALL); R(x, y + p.h - 2, w, 2, WALLD);
      // porta de madeira e janelas grandes para o jardim
      R(x + 10, y + 8, 12, p.h - 8, '#8a5a34'); R(x + 19, y + 17, 2, 2, GOLD);
      for (const wx of [x + 30, x + w - 34]) { R(wx, y + 6, 24, 16, FRAME); R(wx + 1, y + 7, 22, 14, GLASS); R(wx + 12, y + 7, 1, 14, FRAME); R(wx + 3, y + 9, 4, 2, '#ffffff'); }
    } else if (n === 3) {
      R(x, y, w, p.h, WALL); R(x, y + p.h - 2, w, 2, WALLD);
      for (let k = 0; k < 3; k++) { const wx = x + 10 + k * Math.round((w - 32) / 2); R(wx, y + 5, 12, 13, FRAME); R(wx + 1, y + 6, 10, 11, GLASS); R(wx + 2, y + 7, 3, 2, '#ffffff'); }
      // varanda virada para o Aqueduto
      const bx = x + Math.round(w / 2) - 14;
      R(bx, y + p.h - 4, 28, 1, INK);
      for (let k = 0; k <= 28; k += 4) R(bx + k, y + p.h - 9, 1, 5, INK);
      R(bx, y + p.h - 9, 28, 1, INK);
    } else {
      // telhado de telha, com chaminé
      for (let r = 0; r < p.h; r++) {
        const inset = Math.round((r / p.h) * (w * 0.32));
        R(x + inset, bottom - 1 - r, w - inset * 2, 1, r % 3 === 0 ? '#a8462e' : '#c75a3a');
      }
      R(x + Math.round(w * 0.68), y - 2, 6, 9, '#a8462e'); R(x + Math.round(w * 0.68) - 1, y - 3, 8, 2, '#8a3a26');
    }
  }

  drawPool(R, g) {
    const x = g.poolX, w = g.poolW, top = g.gy, H = 14, p = this.pool;
    R(x - 2, top, w + 4, H + 2, '#e8eef2');
    R(x, top, w, H, '#cfe6f0');
    // linha dos azulejos: a altura certa da água
    const yLo = top + H - Math.round(POOL_LO * H), yHi = top + H - Math.round(POOL_HI * H);
    for (let k = x; k < x + w; k += 3) { R(k, yHi, 2, yLo - yHi + 1, '#2b5fa8'); }
    const wh = Math.round(clamp(p.level, 0, 1) * H);
    if (wh > 0) { R(x, top + H - wh, w, wh, 'rgba(47,143,208,0.85)'); R(x, top + H - wh, w, 1, '#bfe8ff'); }
    R(x + w - 5, top - 6, 1, 10, '#9aa4b0'); R(x + w - 3, top - 6, 1, 10, '#9aa4b0'); R(x + w - 5, top - 3, 3, 1, '#9aa4b0');
    if (this.state === 'pool' && p.holding) { R(x + 4, top - 10, 2, 10 - wh, '#8fd0f5'); R(x + 2, top - 12, 6, 2, '#6a7480'); }
  }

  drawGarden(R, g) {
    const k = this.garden, gy = g.gy;
    const tree = (x, h, leaf, fruit) => {
      const th = Math.round(h * k);
      if (th < 2) return;
      R(x, gy - th, 2, th, '#6b4a2e');
      R(x - 5, gy - th - 6, 12, 7, leaf); R(x - 3, gy - th - 9, 8, 3, leaf);
      if (fruit && k > 0.8) { R(x - 3, gy - th - 3, 2, 2, fruit); R(x + 3, gy - th - 5, 2, 2, fruit); }
    };
    tree(g.cx - g.W / 2 - 4, 16, '#7f9a5a', null);                  // oliveira
    if (g.poolX + g.poolW + 10 < this.game.view.w - 14) tree(g.poolX + g.poolW + 8, 14, '#3f8a3f', '#ffd84a');   // limoeiro
    for (let x = g.cx - g.W / 2 + 4; x < g.cx + g.W / 2 - 4; x += 5) if (k > 0.5) { R(x, gy - 3, 1, 3, '#5f9a52'); R(x, gy - 4, 1, 1, '#9a7fd0'); }   // alfazema
  }

  drawCrane(v, R, g) {
    const tx = v.w - 12, jy = g.jibY, top = this.stackTop(g);
    // torre treliçada
    R(tx, jy, 6, g.gy - jy, '#e8b030');
    for (let y = jy + 4; y < g.gy; y += 8) { R(tx + 1, y, 4, 1, '#b07a10'); R(tx + 2, y + 3, 2, 1, '#b07a10'); }
    // lança e contrapeso
    const jx0 = Math.max(4, g.cx - g.amp - 18);
    R(jx0, jy, tx - jx0 + 12, 3, '#e8b030');
    R(tx + 2, jy - 4, 8, 4, '#6a6478');
    if (this.placed >= PIECES.length) return;
    // carrinho, cabo e a peça
    const hx = Math.round(this.state === 'drop' && this.fall ? this.fall.x : this.hookX);
    const p = PIECES[this.i], pw = Math.round(g.W * p.w);
    R(hx - 4, jy + 3, 8, 3, '#4a4458');
    if (this.state === 'crane') {
      const bottom = top - 16;
      R(hx, jy + 6, 1, bottom - p.h - jy - 6, INK);
      this.drawPiece(R, this.i, hx, bottom, g.W);
      R(hx - pw / 2, bottom - p.h - 1, pw, 1, 'rgba(43,29,46,0.5)');
    } else if (this.fall) {
      this.drawPiece(R, this.i, this.fall.x, this.fall.y + p.h, g.W);
    }
  }

  // Sala da casa nova, com os quadros na parede.
  drawInterior(ctx, v, R) {
    const W = this.wall(v), t = this.t;
    R(0, 0, v.w, W.floor, '#f3e7d3');
    for (let x = 0; x < v.w; x += 16) R(x, 0, 1, W.floor, '#efe0c8');
    R(0, W.floor - 6, v.w, 6, '#e0ceb0');
    R(0, W.floor, v.w, v.h - W.floor, '#b07a4a');
    for (let y = W.floor + 6; y < v.h; y += 7) R(0, y, v.w, 1, '#946238');
    // sofá ao centro
    const sx = Math.round(v.w / 2 - 34);
    R(sx, W.floor - 18, 68, 12, '#5a7fb5'); R(sx - 4, W.floor - 22, 8, 16, '#4a6aa0'); R(sx + 64, W.floor - 22, 8, 16, '#4a6aa0'); R(sx, W.floor - 26, 68, 8, '#4a6aa0');
    // quadros: os já pendurados, o que está a balançar e os pregos à espera
    W.spots.forEach((s, n) => {
      R(s.x - 1, s.y - 2, 2, 2, '#6b4a2e');
      let a = null;
      if (n < this.hung.length) a = this.hung[n];
      else if (n === this.k && this.state === 'photo') a = this.angle;
      if (a !== null) this.drawFrame(ctx, n, s.x, s.y, a, W);
    });
    // a Luísa e o Sérgio (e o Tio Alberto, de visita) na sala
    const hop = this.joy > 0 || this.state === 'end' ? Math.round(Math.abs(Math.sin(t * 9)) * 3) : 0;
    ctx.drawImage(this.luisaHome.stand.r, 4, W.floor - 48 - hop, 32, 48);
    ctx.drawImage(this.sergioHome.stand.r, 30, W.floor - 48 - hop, 32, 48);
    ctx.drawImage(this.albertoHome.stand.l, v.w - 36, W.floor - 48, 32, 48);
  }

  // Um quadro (moldura de madeira, passe-partout e a fotografia), pendurado num prego.
  frame(n, W) {
    const key = n + ':' + W.fw;
    if (this.frames.has(key)) return this.frames.get(key);
    const c = document.createElement('canvas');
    c.width = W.fw; c.height = W.fh;
    const x = c.getContext('2d');
    const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    R(0, 0, W.fw, W.fh, INK);
    R(1, 1, W.fw - 2, W.fh - 2, '#7a5232');
    R(3, 3, W.fw - 6, W.fh - 6, '#fffaf0');
    R(5, 5, W.fw - 10, W.fh - 10, PHOTO_BG[n % PHOTO_BG.length]);
    drawMemory(R, this.photos[n].icon, Math.round(W.fw / 2 - 7), Math.round(W.fh / 2 - 7), 0);
    this.frames.set(key, c);
    return c;
  }

  drawFrame(ctx, n, x, y, deg, W) {
    const img = this.frame(n, W);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.fillStyle = INK;
    for (let k = 1; k <= 5; k++) { ctx.fillRect(-k, k * 0.6, 1, 1); ctx.fillRect(k - 1, k * 0.6, 1, 1); }
    ctx.drawImage(img, -Math.round(W.fw / 2), 3);
    ctx.restore();
  }
}
