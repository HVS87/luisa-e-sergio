// Segunda parte do nível de Pretarouca: fazer bôla de Lamego no forno de lenha, com as tias.
// Três passos, cada um com o seu gesto:
//   1. Rachar a lenha (Sérgio)   — tocar quando a força está no máximo
//   2. Amassar (Luísa)           — tocar à esquerda e à direita, à vez
//   3. Cozer no forno (os dois)  — tirar cada bôla quando está dourada
// Esta cena é chamada no fim do passeio pela aldeia (ver `then: 'oven'` no ficheiro do nível).
import { LEVELS } from '../levels/index.js';
import { getCharacter, getSprites } from '../sprites.js';
import { Particles } from '../fx.js';

const SW = 240, SH = 146, FLOOR = 100;
const INK = '#2b1d2e', CREAM = '#fff6e6', GOLD = '#ffd166', GREEN = '#5cf08a', RED = '#ff3b3b', SLATE = '#4a3a55';
const GZ = 'rgba(92,240,138,0.38)';
const WOOD = '#9a6a3c', WOODD = '#6a4424';
const LOGS = 3, KNEADS = 16, KNEAD_TIME = 9, GOLD_LO = 0.62, GOLD_HI = 0.82;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class OvenScene {
  // prev: corações já apanhados no passeio pela aldeia ({ got, total })
  constructor(game, index, prev) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.prev = prev || { got: 0, total: 0 };
    this.spr = getSprites();
    this.luisa = getCharacter('luisa', 'casual');
    this.sergio = getCharacter('sergio', 'casual');
    this.tias = (this.level.ovenNpcs || []).map((look) => getCharacter(look));
    this.total = this.prev.total + LOGS + 1 + 3;
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'lenha';      // lenha → amassar → cozer → prova → done
    this.got = this.prev.got;
    this.timer = 0;
    this.lock = 0.4;
    this.sayT = 0;
    this.fx = new Particles();
    // rachar lenha
    this.log = 0;
    this.m = 0;
    this.dir = 1;
    this.strikes = 0;
    this.swing = 0;
    // amassar
    this.kn = 0;
    this.next = null;
    this.knT = 0;
    this.knOk = true;
    this.squish = 0;
    this.prevL = this.prevR = false;
    // cozer
    const rates = [0.17, 0.24, 0.13].sort(() => Math.random() - 0.5);
    this.bolas = rates.map((rate) => ({ d: 0, rate, out: null }));
    this.sel = 0;
    this.wait = 0;
  }

  enter() { this.begin(); }

  exit() {
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.paused = false;
    this.game.input.reset();
    this.game.ui.show(null);
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.setBase('Sérgio: racha a lenha! Toca quando a força estiver no máximo, na zona verde.');
    this.say(this.level.ovenIntro, 5);
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'prova' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  setBase(text) { this.baseHint = text; this.sayT = 0; this.game.ui.setHint(text); }
  say(text, secs) { if (text) { this.game.ui.setHint(text); this.sayT = secs; } }
  sfx(name) { this.game.audio.play(name); }

  heart(x, y) {
    this.got++;
    this.game.ui.setHud(this.got, this.total, this.level.title);
    for (let i = 0; i < 4; i++) this.fx.heart(x - 8 + Math.random() * 16, y);
  }

  offsets(v) {
    return {
      ox: Math.floor((v.w - SW) / 2),
      oy: v.portrait ? Math.floor((v.h - SH) * 0.36) : Math.max(0, Math.floor((v.h - SH) / 2) + 4),
    };
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input;
    if (this.lock > 0) this.lock -= dt;
    if (this.sayT > 0) {
      this.sayT -= dt;
      if (this.sayT <= 0 && this.state !== 'prova') this.game.ui.setHint(this.baseHint);
    }
    if (this.swing > 0) this.swing -= dt;
    if (this.squish > 0) this.squish -= dt;
    const pressed = I.actionPressed && this.lock <= 0;

    if (this.state === 'lenha') this.chop(dt, pressed);
    else if (this.state === 'amassar') this.knead(dt, I);
    else if (this.state === 'cozer') this.bake(dt, I, pressed);
    else if (this.state === 'prova') {
      this.timer += dt;
      if (Math.floor(this.timer * 5) !== Math.floor((this.timer - dt) * 5)) this.fx.heart(40 + Math.random() * 160, 40 + Math.random() * 20, Math.random() < 0.3 ? GOLD : '#ff5d8f');
      if (this.timer > 4) this.finish();
    }
    this.prevL = I.left;
    this.prevR = I.right;
  }

  // 1. Rachar a lenha: a força oscila; um golpe no máximo racha o toro de uma vez.
  chop(dt, pressed) {
    if (this.swing <= 0) {
      this.m += this.dir * (1.1 + this.log * 0.3) * dt;
      if (this.m >= 1) { this.m = 1; this.dir = -1; } else if (this.m <= 0) { this.m = 0; this.dir = 1; }
    }
    if (!pressed) return;
    this.swing = 0.35;
    this.lock = 0.4;
    this.strikes++;
    if (this.m >= 0.8 || this.strikes >= 3) {
      this.sfx('toc');
      this.fx.burst(121, 86, 10, ['#c98f52', '#e8b878', '#ffffff'], 60);
      if (this.strikes === 1) { this.heart(121, 70); this.say('Tia: «Assim é que é! De uma só vez.»', 2); }
      this.log++;
      this.strikes = 0;
      this.m = 0;
      this.dir = 1;
      if (this.log >= LOGS) {
        this.state = 'amassar';
        this.lock = 0.5;
        this.setBase('Luísa: amassa a massa! Toca à esquerda e à direita, à vez (ou setas ◀ ▶).');
      }
    } else {
      this.sfx('hurt');
      this.say('Tia: «Mais força, menino! Isso é rachar lenha ou fazer-lhe festas?»', 2.2);
    }
  }

  // 2. Amassar: uma mão de cada vez, antes que o tempo acabe.
  knead(dt, I) {
    if (this.kn > 0) this.knT += dt;
    let side = null;
    if (I.left && !this.prevL) side = 'L';
    else if (I.right && !this.prevR) side = 'R';
    else if (I.actionPressed && I.pointerX >= 0 && this.lock <= 0) side = I.pointerX < 0.5 ? 'L' : 'R';
    if (!side) return;
    if (this.next && side !== this.next) {
      this.knOk = false;
      this.sfx('buzz');
      this.fx.burst(96, 70, 12, ['#ffffff', '#f2e6c8'], 50);
      this.say('Tia: «Uma mão de cada vez, filha!»', 1.8);
      return;
    }
    this.next = side === 'L' ? 'R' : 'L';
    this.kn++;
    this.squish = 0.15;
    this.lastSide = side;
    this.sfx('slurp');
    if (this.kn >= KNEADS) {
      const fast = this.knT <= KNEAD_TIME;
      if (this.knOk && fast) { this.heart(96, 60); this.say('Tia: «Mãos de padeira! A massa está uma seda.»', 2.5); }
      else this.say(fast ? 'Tia: «Está amassada... à tua maneira.»' : 'Tia: «Amassada! Devagarinho, mas chegou lá.»', 2.5);
      this.state = 'cozer';
      this.lock = 0.6;
      this.wait = 2.6;       // tempo para ler a instrução antes de o forno começar a contar
      this.baseHint = 'Tira cada bôla quando estiver dourada: toca nela (ou ◀ ▶ e Espaço).';
    }
  }

  // 3. Cozer: três bôlas a cozer a ritmos diferentes; tirar cada uma no ponto.
  bake(dt, I, pressed) {
    if (this.wait > 0) { this.wait -= dt; return; }
    const v = this.game.view;
    let pick = -1;
    if (I.left && !this.prevL) this.sel = (this.sel + 2) % 3;
    if (I.right && !this.prevR) this.sel = (this.sel + 1) % 3;
    if (pressed) {
      if (I.pointerX >= 0) {
        const sx = I.pointerX * v.w - this.offsets(v).ox;
        pick = clamp(Math.floor((sx - 30) / 60), 0, 2);
        this.sel = pick;
      } else pick = this.sel;
    }
    this.bolas.forEach((b, i) => {
      if (b.out) return;
      b.d += b.rate * dt;
      if (b.d >= 1) this.takeOut(b, i, 'queimada');
      else if (i === pick) this.takeOut(b, i, b.d < GOLD_LO ? 'crua' : b.d > GOLD_HI ? 'queimada' : 'dourada');
    });
    if (this.bolas.every((b) => b.out)) {
      const n = this.bolas.filter((b) => b.out === 'dourada').length;
      this.state = 'prova';
      this.timer = 0;
      this.game.ui.setLevelMode(true, false);
      this.sfx('fanfare');
      this.sayT = 0;
      this.game.ui.setHint(n === 3 ? this.level.ovenGreat : n > 0 ? this.level.ovenGood : this.level.ovenBad);
    }
  }

  takeOut(b, i, how) {
    b.out = how;
    const x = 56 + i * 60;
    if (how === 'dourada') { this.sfx('check'); this.heart(x, 112); this.say('Douradinha, mesmo no ponto!', 1.6); }
    else if (how === 'crua') { this.sfx('hurt'); this.say('Tia: «Ai, essa ainda estava crua!»', 1.8); }
    else { this.sfx('buzz'); this.fx.burst(x, 120, 10, ['#3a2a20', '#6a6478'], 40); this.say('Tia: «Essa queimou-se... fica para as galinhas.»', 1.8); }
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const { ox, oy } = this.offsets(v);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + Math.round(x), oy + Math.round(y), w, h); };
    const t = this.t, fy = oy + FLOOR;
    const mod = (a, n) => ((a % n) + n) % n;

    // Parede de granito e chão de lajes
    ctx.fillStyle = '#8e8a82';
    ctx.fillRect(0, 0, v.w, fy);
    ctx.fillStyle = '#75716a';
    for (let y = fy - 12, row = 0; y > -12; y -= 12, row++) {
      ctx.fillRect(0, y, v.w, 1);
      for (let x = mod(ox, 26) - 26 + (row % 2) * 13; x < v.w; x += 26) ctx.fillRect(x, y, 1, 12);
    }
    ctx.fillStyle = '#5e5a54';
    ctx.fillRect(0, fy, v.w, v.h - fy);
    ctx.fillStyle = '#4e4a45';
    for (let y = fy, row = 0; y < v.h; y += 14, row++) {
      ctx.fillRect(0, y, v.w, 1);
      for (let x = mod(ox, 40) - 40 + (row % 2) * 20; x < v.w; x += 40) ctx.fillRect(x, y, 1, 14);
    }

    // Fumeiro: chouriços pendurados
    R(0, 6, 150, 2, WOODD);
    for (let i = 0; i < 9; i++) {
      const x = 8 + i * 16;
      R(x + 3, 8, 1, 3, INK);
      R(x, 11, 7, 3, i % 3 ? '#a8324a' : '#7a2338');
      R(x, 14, 2, 4, i % 3 ? '#a8324a' : '#7a2338');
      R(x + 5, 14, 2, 4, i % 3 ? '#a8324a' : '#7a2338');
    }

    // Forno de lenha, em granito, com a boca em arco
    R(152, 22, 84, 78, '#6e6a64');
    R(154, 24, 80, 76, '#a8a49c');
    for (let k = 0; k < 6; k++) R(154, 30 + k * 12, 80, 1, '#8e8a82');
    for (let k = 0; k < 5; k++) R(160 + k * 17, 24 + (k % 2) * 12, 1, 12, '#8e8a82');
    R(170, 54, 48, 36, '#55504a');
    R(174, 50, 40, 4, '#55504a');
    R(173, 58, 42, 30, '#1c1410');
    R(177, 54, 34, 4, '#1c1410');
    const fl = Math.floor(t * 9) % 2;
    R(176, 80 - fl, 36, 8 + fl, '#c2543a');
    for (let k = 0; k < 5; k++) R(178 + k * 7, 74 + ((k + fl) % 2) * 3, 4, 10, k % 2 ? GOLD : '#ff8a4b');
    R(166, 88, 56, 4, '#8e8a82');
    R(186, 4, 16, 20, '#6e6a64');
    // lenha empilhada
    const pile = this.state === 'lenha' ? this.log : LOGS;
    for (let k = 0; k < pile * 2; k++) {
      R(156 + (k % 3) * 9, 94 - Math.floor(k / 3) * 5, 8, 5, k % 2 ? '#8a5a34' : '#a8744e');
      R(156 + (k % 3) * 9, 94 - Math.floor(k / 3) * 5, 2, 5, '#e8c890');
    }
    // bôlas dentro do forno
    if (this.state === 'cozer') this.bolas.forEach((b, i) => { if (!b.out) this.drawBola(R, 178 + i * 11, 78 - (i % 2) * 3, 9, b.d); });

    // As tias, a Luísa atrás da mesa e o Sérgio junto ao forno
    const joy = this.state === 'prova' ? Math.round(Math.abs(Math.sin(t * 6)) * 3) : 0;
    this.tias.forEach((f, i) => ctx.drawImage(f.stand.r, ox + 2 + i * 26, oy + 52 - (this.state === 'prova' ? Math.round(Math.abs(Math.sin(t * 6 + i)) * 3) : 0), 32, 48));
    const lean = this.state === 'amassar' && this.squish > 0 ? 2 : 0;
    ctx.drawImage(this.luisa.stand.r, ox + 76, oy + 40 + lean - joy, 32, 48);
    const chopY = this.state === 'lenha' && this.swing > 0.2 ? 2 : 0;
    ctx.drawImage(this.sergio.stand[this.state === 'lenha' ? 'l' : 'r'], ox + 124, oy + 52 + chopY - joy, 32, 48);

    // Mesa com a massa
    R(60, 76, 62, 5, '#b8834a');
    R(62, 81, 58, 4, WOOD);
    R(64, 85, 4, 15, WOODD);
    R(114, 85, 4, 15, WOODD);
    const sq = this.squish > 0 ? (this.lastSide === 'L' ? -3 : 3) : 0;
    if (this.state === 'lenha' || this.state === 'amassar') {
      R(82 + sq, 70, 24, 6, '#f2e6c8');
      R(85 + sq, 67, 18, 3, '#f2e6c8');
      R(82 + sq, 75, 24, 1, '#d9c9a0');
    } else if (this.state === 'prova') {
      this.bolas.forEach((b, i) => this.drawBola(R, 68 + i * 17, 70, 14, b.out === 'crua' ? 0.3 : b.out === 'dourada' ? 0.72 : 1));
    }
    R(66, 72, 6, 4, '#a8744e');
    R(108, 71, 5, 5, '#7a4a9a');

    // Cepo, toro e machado
    if (this.state === 'lenha') {
      R(112, 90, 18, 10, WOODD);
      R(112, 90, 18, 2, '#b8834a');
      R(116, 82, 10, 8, '#a8744e');
      R(116, 82, 10, 2, '#e8c890');
      const up = this.swing > 0.2 ? 0 : this.swing > 0 ? 6 : 16;
      R(127, 70 - up, 14, 2, WOODD);
      R(121, 66 - up, 7, 9, '#d8dce6');
      R(121, 66 - up, 2, 9, '#8a93a7');
    }

    // Painel inferior
    R(18, 108, 204, 36, INK);
    R(20, 110, 200, 32, '#e8d9b8');
    R(22, 112, 196, 28, '#2a2233');
    if (this.state === 'lenha') {
      R(38, 120, 164, 10, CREAM);
      R(40, 122, 160, 6, SLATE);
      R(40 + 128, 122, 32, 6, GZ);
      R(40 + 128, 122, 1, 6, GREEN);
      R(40 + Math.round(this.m * 158), 117, 2, 16, this.swing > 0 ? RED : GOLD);
      for (let k = 0; k < LOGS; k++) R(92 + k * 20, 134, 14, 4, k < this.log ? '#c98f52' : SLATE);
    } else if (this.state === 'amassar') {
      // duas mãos: a que se segue está acesa
      for (const [side, x] of [['L', 60], ['R', 150]]) {
        const on = !this.next || this.next === side;
        R(x, 115, 30, 18, on ? GOLD : SLATE);
        R(x + 2, 117, 26, 14, on ? '#fff3c4' : '#2a2233');
        const hx = side === 'L' ? x + 8 : x + 18;
        R(hx - 1, 121, 6, 8, on ? '#f6c9a0' : SLATE);
        R(hx - 3, 119, 10, 4, on ? '#f6c9a0' : SLATE);
      }
      R(98, 118, 44, 5, SLATE);
      R(98, 118, Math.round((44 * this.kn) / KNEADS), 5, '#ff5d8f');
      R(98, 127, 44, 3, SLATE);
      R(98, 127, Math.round(44 * clamp(1 - this.knT / KNEAD_TIME, 0, 1)), 3, this.knT > KNEAD_TIME * 0.7 ? RED : GREEN);
    } else {
      this.bolas.forEach((b, i) => {
        const x = 34 + i * 60;
        if (this.state === 'cozer' && i === this.sel && !this.game.input.touch) R(x - 3, 113, 58, 26, GOLD);
        R(x - 1, 115, 54, 22, '#3a3046');
        if (b.out) {
          this.drawBola(R, x + 16, 119, 20, b.out === 'crua' ? 0.3 : b.out === 'dourada' ? 0.72 : 1);
          if (b.out === 'dourada') ctx.drawImage(this.spr.heart, ox + x + 40, oy + 121);
        } else {
          this.drawBola(R, x + 16, 117, 20, b.d);
          R(x + 2, 131, 48, 4, SLATE);
          R(x + 2 + Math.round(48 * GOLD_LO), 131, Math.round(48 * (GOLD_HI - GOLD_LO)), 4, GZ);
          R(x + 2 + Math.round(48 * b.d), 129, 2, 8, GOLD);
        }
      });
    }
    this.fx.draw(ctx, -ox, -oy);
  }

  // Uma bôla: branca em crua, dourada no ponto, escura quando se queima.
  drawBola(R, x, y, w, d) {
    const col = d < 0.35 ? '#f2e6c8' : d < GOLD_LO ? '#ecd09a' : d <= GOLD_HI ? '#e0a040' : d < 0.92 ? '#9a5a2a' : '#3a2a20';
    const h = Math.max(4, Math.round(w * 0.5));
    R(x + 1, y, w - 2, h, INK);
    R(x, y + 1, w, h - 2, INK);
    R(x + 1, y + 1, w - 2, h - 2, col);
    R(x + 2, y + 1, w - 5, 1, 'rgba(255,255,255,0.35)');
    if (w > 12) { R(x + 4, y + 3, 2, 1, '#a8324a'); R(x + w - 7, y + h - 3, 2, 1, '#a8324a'); }
  }
}
