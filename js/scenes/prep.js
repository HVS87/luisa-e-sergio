// Nível dos preparativos do casamento, no relvado do solar.
// Usa o motor das visitas vistas de cima (tour.js) e acrescenta as tarefas:
//   1. montar a tenda: ir a cada um dos postes para os levantar
//   2. pôr as mesas: toalhas e pratos vêm da carrinha, flores do canteiro
//   3. pendurar as luzes nos ganchos da tenda
//   4. levar o bolo (devagar!) até à mesa do bolo
// Cada tarefa acabada antes do pôr do sol vale um coração.
import { TILE as T } from '../config.js';
import { TourScene } from './tour.js';
import { getCharacter, partnerOf } from '../sprites.js';

const DAY = 175;           // segundos até ao pôr do sol
const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f', GREEN = '#5cf08a';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NAMES = { toalha: 'a toalha', pratos: 'os pratos', flores: 'as flores', luzes: 'as luzes', bolo: 'o bolo' };

export class PrepScene extends TourScene {
  constructor(game, index) {
    super(game, index);
    // aqui joga-se com a personagem escolhida no menu; o par vem atrás, a ajudar
    const me = game.save.data.character;
    this.lead = getCharacter(me, 'casual');
    this.follow = getCharacter(partnerOf(me), 'casual');
  }

  setup() {
    super.setup();
    // Tira do mapa os objetos das tarefas e passa a tratá-los à parte
    const m = this.map;
    this.poles = [];
    this.tables = [];
    this.hooks = [];
    this.van = null;
    this.stall = null;
    this.cakeTable = null;
    for (let y = 0; y < m.rows; y++) {
      for (let x = 0; x < m.cols; x++) {
        const ch = m.grid[y][x], o = { x: x * T + 8, y: y * T + 12 };
        if (ch === 'I') this.poles.push({ ...o, up: false, prog: 0 });
        else if (ch === 'Q') this.tables.push({ ...o, stage: 0 });
        else if (ch === 'H') this.hooks.push({ ...o, lit: false });
        else if (ch === '&') this.van = o;
        else if (ch === 'J') this.stall = o;
        else if (ch === 'U') this.cakeTable = { ...o, cake: false };
        else continue;
        m.grid[y][x] = '.';
      }
    }
    this.phase = 'tenda';      // tenda → mesas → luzes → bolo
    this.carry = null;
    this.day = 0;
    this.sunset = false;
    this.total = this.poles.length + this.tables.length * 3 + this.hooks.length + 1;
    this.totalHearts = this.total;
    this.done = 0;
    this.shownGuide = null;
    this.speedMul = 1;
  }

  begin() {
    super.begin();
    this.game.ui.setHud(this.got, this.total, this.level.title);
  }

  hint(text, secs) {
    super.hint(text, secs);
    this.shownGuide = null;
  }

  // Móveis e carrinha também não se atravessam.
  blocked(px, py) {
    if (super.blocked(px, py)) return true;
    const hit = (o, rx, ry) => o && Math.abs(px - o.x) < rx && Math.abs(py - 4 - o.y) < ry;
    for (const tb of this.tables) if (hit(tb, 13, 8)) return true;
    return hit(this.cakeTable, 11, 8) || hit(this.van, 27, 10) || hit(this.stall, 12, 8);
  }

  near(o, d = 24) { return o && Math.hypot(this.p.x - o.x, this.p.y - o.y) < d; }

  // Instrução do momento, com a contagem do que falta.
  guide() {
    const up = this.poles.filter((p) => p.up).length, set = this.tables.reduce((s, tb) => s + tb.stage, 0), lit = this.hooks.filter((h) => h.lit).length;
    if (this.phase === 'tenda') return `A tenda primeiro! Vai a cada poste para o levantar (${up}/${this.poles.length}).`;
    if (this.phase === 'mesas') return this.carry ? `Leva ${NAMES[this.carry]} até à mesa com a seta.` : `As mesas: toalhas e pratos estão na carrinha, flores no canteiro (${set}/${this.tables.length * 3}).`;
    if (this.phase === 'luzes') return this.carry ? 'Pendura as luzes num gancho da tenda.' : `As luzes: traz-as da carrinha (${lit}/${this.hooks.length}).`;
    return this.carry ? 'Devagar com o bolo! Atenção aos regadores...' : 'Só falta o bolo: está na carrinha.';
  }

  // Sítios para onde faz sentido ir agora (ficam marcados com uma seta).
  targets() {
    if (this.phase === 'tenda') return this.poles.filter((p) => !p.up);
    if (this.phase === 'mesas') {
      const want = { toalha: 0, pratos: 1, flores: 2 };
      if (this.carry) return this.tables.filter((tb) => tb.stage === want[this.carry]);
      const out = [];
      if (this.tables.some((tb) => tb.stage < 2)) out.push(this.van);
      if (this.tables.some((tb) => tb.stage === 2)) out.push(this.stall);
      return out;
    }
    if (this.phase === 'luzes') return this.carry ? this.hooks.filter((h) => !h.lit) : [this.van];
    return this.carry ? [this.cakeTable] : [this.van];
  }

  task(x, y) {
    this.done++;
    if (!this.sunset) {
      this.got++;
      this.game.audio.play('heart');
      this.fx.heart(x, y - 20);
    } else this.game.audio.play('check');
    this.fx.burst(x, y - 10, 10, [GOLD, '#ffffff', PINK], 50);
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.shownGuide = null;
  }

  update(dt) {
    super.update(dt);
    if (this.paused || this.state !== 'walk') return;
    // a instrução do momento fica sempre à vista (as frases temporárias passam por cima)
    if (this.hintT <= 0) {
      const g = this.guide();
      if (g !== this.shownGuide) { this.game.ui.setHint(g); this.shownGuide = g; }
    }
  }

  walk(dt) {
    this.speedMul = this.carry === 'bolo' ? 0.6 : 1;
    super.walk(dt);
    if (this.state !== 'walk') return;
    const p = this.p;

    // O dia a passar
    this.day += dt / DAY;
    if (this.day >= 1 && !this.sunset) {
      this.sunset = true;
      this.hint('O sol pôs-se! O resto faz-se à luz das lanternas (mas já sem corações).', 4);
    }

    if (this.phase === 'tenda') {
      for (const pole of this.poles) {
        if (pole.up || !this.near(pole, 18)) continue;
        pole.prog += dt / 1.1;
        if (pole.prog >= 1) { pole.up = true; this.task(pole.x, pole.y); }
      }
      if (this.poles.every((q) => q.up)) {
        this.phase = 'mesas';
        this.game.audio.play('win');
        this.hint('A tenda está de pé! Agora, as mesas.', 3);
      }
    } else if (this.phase === 'mesas') {
      if (!this.carry) {
        if (this.near(this.van, 34) && this.tables.some((tb) => tb.stage < 2)) this.pick(this.tables.some((tb) => tb.stage === 0) ? 'toalha' : 'pratos');
        else if (this.near(this.stall, 24) && this.tables.some((tb) => tb.stage === 2)) this.pick('flores');
      } else {
        const want = { toalha: 0, pratos: 1, flores: 2 }[this.carry];
        const tb = this.tables.find((q) => q.stage === want && this.near(q, 26));
        if (tb) { tb.stage++; this.carry = null; this.task(tb.x, tb.y); }
      }
      if (this.tables.every((q) => q.stage === 3)) {
        this.phase = 'luzes';
        this.game.audio.play('win');
        this.hint('As mesas estão lindas! Faltam as luzes.', 3);
      }
    } else if (this.phase === 'luzes') {
      if (!this.carry && this.near(this.van, 34)) this.pick('luzes');
      else if (this.carry) {
        const h = this.hooks.find((q) => !q.lit && this.near(q, 20));
        if (h) { h.lit = true; this.carry = null; this.task(h.x, h.y); }
      }
      if (this.hooks.every((q) => q.lit)) {
        this.phase = 'bolo';
        this.game.audio.play('win');
        this.hint('Que bonito! Agora, o mais delicado: o bolo.', 3);
      }
    } else if (this.phase === 'bolo') {
      if (!this.carry && this.near(this.van, 34)) this.pick('bolo');
      else if (this.carry && this.near(this.cakeTable, 26)) {
        this.carry = null;
        this.cakeTable.cake = true;
        this.task(this.cakeTable.x, this.cakeTable.y);
        this.state = 'won';
        this.timer = 0;
        this.game.ui.setLevelMode(true, false);
        this.game.audio.play('fanfare');
        this.game.ui.setHint(this.level.ready);
      }
    }
  }

  pick(what) {
    this.carry = what;
    this.shownGuide = null;
    this.game.audio.play('pop');
  }

  // ---------- Desenho ----------
  extraEnts(ents, ctx, R, t) {
    for (const pole of this.poles) ents.push({ y: pole.y, draw: () => {
      if (pole.up) {
        R(pole.x - 2, pole.y - 31, 4, 31, INK);
        R(pole.x - 1, pole.y - 30, 2, 30, '#f2f2f7');
        R(pole.x - 2, pole.y - 33, 4, 3, GOLD);
      } else {
        R(pole.x - 9, pole.y - 4, 18, 4, INK);
        R(pole.x - 8, pole.y - 3, 16, 2, '#f2f2f7');
        if (pole.prog > 0) { R(pole.x - 8, pole.y - 12, 16, 4, INK); R(pole.x - 7, pole.y - 11, Math.round(14 * pole.prog), 2, GREEN); }
      }
    } });
    for (const tb of this.tables) ents.push({ y: tb.y, draw: () => this.drawTable(R, tb, t) });
    const ct = this.cakeTable;
    if (ct) ents.push({ y: ct.y, draw: () => {
      R(ct.x - 9, ct.y - 9, 18, 9, INK);
      R(ct.x - 8, ct.y - 8, 16, 7, '#ffffff');
      R(ct.x - 8, ct.y - 3, 16, 2, '#e8dcc0');
      if (ct.cake) this.drawItem(R, 'bolo', ct.x - 6, ct.y - 22);
    } });
    const v = this.van;
    if (v) ents.push({ y: v.y, draw: () => {
      R(v.x - 27, v.y - 25, 54, 23, INK);
      R(v.x - 26, v.y - 24, 52, 21, '#ffffff');
      R(v.x - 26, v.y - 12, 52, 4, PINK);
      R(v.x + 12, v.y - 22, 12, 9, '#8fd0f5');
      R(v.x - 24, v.y - 22, 20, 9, '#3a3046');
      R(v.x - 22, v.y - 20, 6, 5, '#ffffff');
      R(v.x - 14, v.y - 21, 7, 6, '#e8dcc0');
      R(v.x - 21, v.y - 4, 9, 6, INK);
      R(v.x + 11, v.y - 4, 9, 6, INK);
      R(v.x - 19, v.y - 2, 5, 3, '#8a93a7');
      R(v.x + 13, v.y - 2, 5, 3, '#8a93a7');
    } });
    const s = this.stall;
    if (s) ents.push({ y: s.y, draw: () => {
      R(s.x - 12, s.y - 12, 24, 10, INK);
      R(s.x - 11, s.y - 11, 22, 8, '#9a6a3c');
      R(s.x - 10, s.y - 2, 4, 4, INK);
      R(s.x + 6, s.y - 2, 4, 4, INK);
      const cols = [PINK, '#ffffff', '#d43d51', GOLD];
      for (let k = 0; k < 6; k++) { R(s.x - 10 + k * 4, s.y - 17 + (k % 2) * 2, 3, 3, cols[k % 4]); R(s.x - 9 + k * 4, s.y - 14 + (k % 2) * 2, 1, 3, '#3f8f5a'); }
    } });
    for (const h of this.hooks) ents.push({ y: h.y - 14, draw: () => { R(h.x - 1, h.y - 24, 2, 6, '#8a93a7'); R(h.x - 2, h.y - 19, 4, 2, '#8a93a7'); } });
  }

  drawTable(R, tb, t) {
    const x = tb.x, y = tb.y;
    R(x - 2, y - 4, 4, 5, '#5a3a20');
    if (tb.stage === 0) {
      R(x - 12, y - 11, 24, 8, INK);
      R(x - 11, y - 10, 22, 6, '#9a6a3c');
      R(x - 11, y - 10, 22, 1, '#b8834a');
    } else {
      R(x - 14, y - 12, 28, 11, INK);
      R(x - 13, y - 11, 26, 9, '#ffffff');
      R(x - 13, y - 4, 26, 2, '#e8dcc0');
    }
    if (tb.stage >= 2) for (const dx of [-9, -3, 3, 9]) { R(x + dx - 2, y - 10, 4, 3, '#cfe6f0'); R(x + dx - 1, y - 10, 2, 1, '#ffffff'); }
    if (tb.stage >= 3) { R(x - 2, y - 15, 4, 5, '#3f8f5a'); R(x - 4, y - 18, 3, 3, PINK); R(x, y - 19, 3, 3, '#ffffff'); R(x + 2, y - 17, 3, 3, GOLD); }
  }

  drawItem(R, kind, x, y) {
    if (kind === 'toalha') { R(x, y + 3, 12, 8, INK); R(x + 1, y + 4, 10, 6, '#ffffff'); R(x + 1, y + 7, 10, 1, '#e8dcc0'); }
    else if (kind === 'pratos') { for (let k = 0; k < 3; k++) { R(x, y + 8 - k * 3, 12, 3, INK); R(x + 1, y + 8 - k * 3, 10, 2, '#cfe6f0'); } }
    else if (kind === 'flores') { R(x + 5, y + 5, 2, 7, '#3f8f5a'); R(x + 2, y + 1, 4, 4, PINK); R(x + 6, y, 4, 4, '#ffffff'); R(x + 4, y + 3, 4, 4, GOLD); }
    else if (kind === 'luzes') { R(x, y + 5, 12, 1, INK); for (let k = 0; k < 4; k++) R(x + k * 3, y + 6, 2, 3, [GOLD, PINK, GREEN, '#8fd0f5'][k]); }
    else if (kind === 'bolo') {
      R(x - 1, y + 9, 14, 6, INK); R(x, y + 10, 12, 4, '#ffffff');
      R(x + 1, y + 4, 10, 6, INK); R(x + 2, y + 5, 8, 4, '#ffffff');
      R(x + 3, y, 6, 5, INK); R(x + 4, y + 1, 4, 3, '#ffffff');
      R(x, y + 12, 12, 1, PINK); R(x + 2, y + 7, 8, 1, PINK); R(x + 5, y - 2, 2, 3, PINK);
    }
  }

  overlay(ctx, v, R, camX, camY, t) {
    // A tenda: cobertura translúcida com franja, e as luzes quando estão penduradas
    if (this.poles.length && this.poles.every((p) => p.up)) {
      const xs = this.poles.map((p) => p.x), ys = this.poles.map((p) => p.y);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 31, y1 = Math.max(...ys) - 31;
      R(x0, y0, x1 - x0, y1 - y0, 'rgba(255,255,255,0.2)');
      for (let x = x0; x < x1; x += 16) R(x, y0, 8, y1 - y0, 'rgba(255,255,255,0.08)');
      R(x0 - 2, y0 - 2, x1 - x0 + 4, 3, '#ffffff');
      R(x0 - 2, y1, x1 - x0 + 4, 3, '#ffffff');
      R(x0 - 2, y0, 2, y1 - y0, '#ffffff');
      R(x1, y0, 2, y1 - y0, '#ffffff');
      for (let x = x0; x < x1; x += 8) { R(x, y1 + 3, 6, 2, '#ffffff'); R(x + 1, y1 + 5, 4, 1, '#ffffff'); }
      const lit = this.hooks.filter((h) => h.lit).length;
      if (lit) {
        const cols = [GOLD, PINK, GREEN, '#8fd0f5'];
        const span = lit >= this.hooks.length ? x1 - x0 : (x1 - x0) / 2;
        for (let k = 0; k * 8 < span; k++) {
          const on = Math.sin(t * 4 + k * 1.3) > -0.3;
          R(x0 + 3 + k * 8, y0 + 2 + (k % 2), 3, 3, on ? cols[k % 4] : '#8a7a5a');
        }
      }
    }

    // Setas por cima dos sítios para onde ir, e o que se leva nas mãos
    if (this.state === 'walk') {
      const b = Math.round(Math.sin(t * 6) * 2);
      for (const o of this.targets()) {
        if (!o) continue;
        const up = o === this.van ? 34 : this.poles.includes(o) && !o.up ? 18 : 28;
        R(o.x - 3, o.y - up - 8 + b, 6, 5, INK);
        R(o.x - 2, o.y - up - 7 + b, 4, 3, GOLD);
        R(o.x - 1, o.y - up - 4 + b, 2, 2, GOLD);
      }
    }
    if (this.carry) this.drawItem(R, this.carry, this.p.x - 6, this.p.y - 40);

    // O fim da tarde: a luz vai ficando dourada e depois azul
    const eve = clamp((this.day - 0.55) / 0.45, 0, 1);
    if (eve > 0) { ctx.fillStyle = `rgba(255,150,70,${(eve * 0.16).toFixed(2)})`; ctx.fillRect(0, 0, v.w, v.h); }
    if (this.day > 1) { ctx.fillStyle = `rgba(20,24,80,${clamp((this.day - 1) * 1.5, 0, 0.38).toFixed(2)})`; ctx.fillRect(0, 0, v.w, v.h); }

    // Relógio do dia: o sol a caminho do pôr do sol
    const bw = Math.min(110, v.w - 110), bx = Math.round((v.w - bw) / 2), by = v.h - 9;
    ctx.fillStyle = INK;
    ctx.fillRect(bx - 2, by - 2, bw + 4, 6);
    ctx.fillStyle = '#3a3046';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = this.sunset ? '#6a5a9a' : GOLD;
    ctx.fillRect(bx, by, Math.round(bw * clamp(this.day, 0, 1)), 2);
    const sx = bx + Math.round(bw * clamp(this.day, 0, 1));
    ctx.fillStyle = INK;
    ctx.fillRect(sx - 4, by - 4, 8, 8);
    ctx.fillStyle = this.sunset ? '#d8dcf5' : GOLD;
    ctx.fillRect(sx - 3, by - 3, 6, 6);
  }
}
