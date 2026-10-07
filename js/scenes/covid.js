// Nível da pandemia de COVID-19: a Luísa e o Sérgio, médicos, na linha da frente.
// Jogo de arcada por vagas: os dois andam lado a lado pela enfermaria e desinfetam
// os vírus antes que cheguem às camas. São seis vagas, cada uma mais apertada: as três
// primeiras, a vacinação e as variantes Delta (aos ziguezagues) e Ómicron (pequenos, muitos,
// e os grandes desfazem-se em dois). Entre vagas há momentos do confinamento (palmas à
// janela, videochamada com a família, a chegada da vacina).
//
// Controlos: arrastar o dedo (ou setas ◀ ▶) para mover a dupla; o desinfetante sai sozinho.
import { LEVELS } from '../levels/index.js';
import { getCharacter, getSprites, makeSprite } from '../sprites.js';
import { hash } from '../themes.js';
import { Particles } from '../fx.js';

const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f', GREEN = '#5cf08a', RED = '#ff3b3b';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const VIRUS = [
  '......s......',
  '..s...g...s..',
  '...ggggggg...',
  '..ggGGGGGgg..',
  '..gGeGGGeGg..',
  '.ggGGGGGGGgg.',
  'sgGGGmmmGGGgs',
  '.ggGGGGGGGgg.',
  '..gGGGGGGGg..',
  '..ggGGGGGgg..',
  '...ggggggg...',
  '..s...g...s..',
  '......s......',
];
// Tipos de vírus: tempo que demoram a chegar às camas (cross), golpes que aguentam (hp), raio,
// pressão que causam, tamanho e, nalguns, o balanço lateral (sway, em fração da largura) e em
// quantos pequenos se desfazem ao rebentar (split).
const TYPES = {
  n: { cross: 9.5, hp: 1, r: 7, press: 10, scale: 1, pal: { g: '#3f9a4a', G: '#6fd06a', s: '#c2384a', e: INK, m: INK } },
  fast: { cross: 6, hp: 1, r: 7, press: 7, scale: 1, pal: { g: '#c2543a', G: '#ff8a4b', s: '#ffd166', e: INK, m: INK } },
  big: { cross: 13, hp: 3, r: 13, press: 18, scale: 2, pal: { g: '#6a4a9a', G: '#a58ae0', s: '#ff5d8f', e: INK, m: INK } },
  zig: { cross: 8, hp: 1, r: 7, press: 10, scale: 1, sway: 0.13, swayF: 2.6, pal: { g: '#2f6fb0', G: '#6fb0f0', s: '#ffd166', e: INK, m: INK } },
  mini: { cross: 5.4, hp: 1, r: 5, press: 5, scale: 0.7, pal: { g: '#b03060', G: '#ff6f9f', s: '#ffffff', e: INK, m: INK } },
  split: { cross: 11, hp: 2, r: 11, press: 14, scale: 1.6, split: 2, pal: { g: '#1f7a7a', G: '#3fc0b0', s: '#ff6f9f', e: INK, m: INK } },
};
const PRESS_DRAIN = 1.6;   // pressão que o hospital alivia por segundo
const MAX_FAILS = 3;       // à terceira vez que o hospital chega ao limite, segue-se em frente
const EASE_STEP = 0.3;     // quanto abranda a vaga de cada vez que recomeça

export class CovidScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.spr = getSprites();
    this.luisa = getCharacter('luisa', 'ppe');
    this.sergio = getCharacter('sergio', 'ppe');
    this.virus = {};
    for (const [k, tp] of Object.entries(TYPES)) this.virus[k] = makeSprite(VIRUS, tp.pal);
    // A videochamada do confinamento: a família toda, cada um no seu quadradinho. O Henrique
    // ainda não tinha nascido: é a Carminho que conta, toda contente, que vai ter um irmão.
    const C = (look, outfit) => getCharacter(look, outfit);
    this.callTiles = [
      { who: [C('luisa'), C('sergio')], bg: '#cfe8e4', wave: false },
      { who: [C('avojose')], bg: '#7fcf72', scene: 'solar' },
      { who: [C('maeluisa'), C('pailuisa')], bg: '#e8b86a' },
      { who: [C('rosarinho')], bg: '#f5a3c0' },
      { who: [C('catarina')], bg: '#8fd0f5' },
      { who: [C('antonio')], bg: '#b9a2e0' },
      { who: [C('carminho')], bg: '#ffd166', hop: true, bubble: true },
      { who: [C('alberto', 'casa')], bg: '#9ab8d8' },
      { who: [C('pai')], bg: '#3d8fe0' },
      { who: [C('andre')], bg: '#e07a5a' },
      { who: [C('beatriz')], bg: '#3fae8a' },
      { who: [C('tia1'), C('tia2')], bg: '#8e8a82', scene: 'snow' },
    ];
    this.total = this.level.waves.reduce((s, w) => s + w.hearts, 0);
    // Sequência do nível: vagas intercaladas com momentos do confinamento
    this.phases = [];
    this.level.waves.forEach((w, i) => {
      if (w.before) this.phases.push({ inter: w.before });
      this.phases.push({ wave: i });
    });
    this.phases.push({ inter: 'fim', last: true });
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'intro';      // intro → (wave ⇄ fail | inter)... → done
    this.pi = 0;
    this.got = 0;
    this.u = 0.5;              // posição da dupla (0 = esquerda, 1 = direita)
    this.energy = 1;
    this.pressure = 0;
    this.shield = 0;
    this.fails = 0;
    this.timer = 0;
    this.hintT = 0;
    this.pending = '';
    this.fx = new Particles();
    this.clear();
  }

  clear() {
    this.viruses = [];
    this.shots = [];
    this.drops = [];
    this.spawned = 0;
    this.spawnT = 1;
    this.fireT = 0;
    this.cafeT = 7;
    this.epiDone = false;
    this.doneT = 0;
    this.extra = 0;            // vírus nascidos de outros (não contam para o total da vaga)
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.startPhase();
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'intro' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  hint(text, secs = 5) {
    if (!text) return;
    this.game.ui.setHint(text);
    this.hintT = secs;
  }

  startPhase() {
    const ph = this.phases[this.pi];
    this.timer = 0;
    this.clear();
    if (ph.inter) {
      this.state = 'inter';
      this.inter = ph.inter;
      this.energy = 1;
      this.pressure = 0;
      this.hint(this.note(this.level.moments[ph.inter]), 60);
      this.game.audio.play(ph.last ? 'fanfare' : 'check');
    } else {
      this.state = 'wave';
      this.wave = this.level.waves[ph.wave];
      this.fails = 0;
      this.ease = 1;
      this.pressure = 0;
      // quais dos vírus desta vaga trazem um coração
      const n = this.wave.n, h = this.wave.hearts;
      this.goldAt = new Set(Array.from({ length: h }, (_, k) => Math.round(((k + 0.5) * n) / h)));
      this.hint(this.note(`${this.wave.name} — ${this.wave.when}. ${this.wave.tip}`), 6);
    }
  }

  // Junta ao texto da fase o aviso que ficou pendente da anterior (se houver).
  note(text) {
    const pre = this.pending;
    this.pending = '';
    return pre ? `${pre} ${text}` : text;
  }

  nextPhase() {
    this.pi++;
    if (this.pi >= this.phases.length) this.finish();
    else this.startPhase();
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // Posição horizontal de um vírus neste instante (com o balanço lateral do seu tipo).
  uOf(vi) {
    const tp = TYPES[vi.type];
    return clamp(vi.u + Math.sin(this.t * (tp.swayF || 2) + vi.ph) * (tp.sway || 0.03), 0.04, 0.96);
  }

  layout(v) {
    const FW = Math.min(v.w, 260);
    return { fx0: Math.floor((v.w - FW) / 2), FW, y0: 34, yBed: v.h - 26 };
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) this.game.ui.setHint('');
    }
    const I = this.game.input;
    if (this.state === 'wave') this.stepWave(dt, I);
    else if (this.state === 'fail') {
      this.timer += dt;
      if (this.timer > 2.6) {
        this.clear();
        this.pressure = 0;
        this.energy = Math.max(this.energy, 0.7);
        this.state = 'wave';
        this.hint(`${this.wave.name}: outra vez, com calma.`, 3);
      }
    } else if (this.state === 'inter') {
      this.timer += dt;
      const L = this.layout(this.game.view);
      if (I.actionPressed && this.inter === 'palmas') {
        this.game.audio.play('click');
        this.fx.heart(L.fx0 + Math.random() * L.FW, this.game.view.h * (0.3 + Math.random() * 0.5), Math.random() < 0.3 ? GOLD : PINK);
      }
      if (Math.floor(this.timer * 3) !== Math.floor((this.timer - dt) * 3)) {
        this.fx.heart(L.fx0 + Math.random() * L.FW, this.game.view.h * (0.35 + Math.random() * 0.45), Math.random() < 0.3 ? GOLD : PINK);
      }
      const min = this.phases[this.pi].last ? 4.5 : 3;
      // nas palmas, tocar é para bater palmas: o momento acaba sozinho
      const clap = this.inter === 'palmas';
      if ((!clap && this.timer > min && I.actionPressed) || this.timer > (clap ? 7 : 11)) this.nextPhase();
    }
  }

  stepWave(dt, I) {
    const v = this.game.view, L = this.layout(v), w = this.wave;
    const X = (u) => L.fx0 + u * L.FW, Y = (f) => L.y0 + f * (L.yBed - L.y0);

    // Mover a dupla: setas, ou seguir o dedo
    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (dir) this.u += dir * 0.95 * dt;
    else if (I.pointerX >= 0) {
      const target = (I.pointerX * v.w - L.fx0) / L.FW;
      this.u += clamp(target - this.u, -2.4 * dt, 2.4 * dt);
    }
    this.u = clamp(this.u, 0.07, 0.93);

    // Cansaço: turnos sem fim gastam a energia; com pouca energia dispara-se mais devagar
    this.energy = Math.max(0, this.energy - 0.026 * dt);
    this.pressure = Math.max(0, this.pressure - PRESS_DRAIN * dt);
    if (this.shield > 0) this.shield -= dt;

    // Disparar (desinfetante; depois de chegar a vacina, vacinas que atravessam vários vírus)
    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fireT = w.vaccine ? 0.2 : this.energy > 0.22 ? 0.34 : 0.64;
      const off = 8 / L.FW;
      this.shots.push({ u: this.u - off, g: 0.92, pierce: !!w.vaccine, hit: new Set() });
      this.shots.push({ u: this.u + off, g: 0.92, pierce: !!w.vaccine, hit: new Set() });
    }

    // Novos vírus
    this.spawnT -= dt;
    if (this.spawned < w.n && this.spawnT <= 0) {
      this.spawnT = w.every * this.ease;
      const bag = Object.entries(w.mix).flatMap(([k, n]) => Array(n).fill(k));
      // de vez em quando chega um surto: vários vírus lado a lado, e depois um pequeno respiro
      const group = w.burst && this.spawned > 0 && this.spawned % 9 === 0 ? Math.min(w.burst, w.n - this.spawned) : 1;
      const u0 = 0.08 + Math.random() * (0.84 - (group - 1) * 0.12);
      for (let k = 0; k < group; k++) {
        const type = bag[Math.floor(Math.random() * bag.length)];
        this.viruses.push({ id: this.spawned, u: u0 + k * 0.12, f: 0, type, hp: TYPES[type].hp, ph: Math.random() * 6, gold: this.goldAt.has(this.spawned), flash: 0 });
        this.spawned++;
      }
      if (group > 1) this.spawnT += w.every * this.ease * (group - 1) * 0.6;
      // a meio da vaga chega uma caixa de equipamento de proteção
      if (!this.epiDone && this.spawned >= w.n / 2) { this.epiDone = true; this.drops.push({ u: 0.15 + Math.random() * 0.7, f: 0, kind: 'epi' }); }
    }
    this.cafeT -= dt;
    if (this.cafeT <= 0) { this.cafeT = 9; this.drops.push({ u: 0.1 + Math.random() * 0.8, f: 0, kind: 'cafe' }); }

    // Tiros
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.g -= dt / 0.55;
      if (s.g < -0.05) { this.shots.splice(i, 1); continue; }
      for (const vi of this.viruses) {
        if (vi.hp <= 0 || s.hit.has(vi.id)) continue;
        const tp = TYPES[vi.type], vx = X(this.uOf(vi));
        if (Math.abs(X(s.u) - vx) > tp.r + 2 || Math.abs(Y(s.g) - Y(vi.f)) > tp.r + 4) continue;
        vi.hp--;
        vi.flash = 0.12;
        s.hit.add(vi.id);
        if (vi.hp <= 0) this.pop(vi, vx, Y(vi.f));
        if (!s.pierce) { this.shots.splice(i, 1); break; }
      }
    }

    // Vírus a descer
    const shieldF = 0.84;
    for (let i = this.viruses.length - 1; i >= 0; i--) {
      const vi = this.viruses[i], tp = TYPES[vi.type];
      if (vi.hp <= 0) { this.viruses.splice(i, 1); continue; }
      if (vi.flash > 0) vi.flash -= dt;
      vi.f += (dt * (w.speed || 1)) / (tp.cross * this.ease);
      if (this.shield > 0 && vi.f >= shieldF) { vi.hp = 0; this.pop(vi, X(this.uOf(vi)), Y(vi.f)); continue; }
      if (vi.f >= 1) {
        this.viruses.splice(i, 1);
        this.pressure += tp.press;
        this.game.audio.play('buzz');
        this.fx.burst(X(this.uOf(vi)), L.yBed - 4, 10, [RED, '#ffffff'], 50);
      }
    }

    // Coisas a cair: corações, café e equipamento de proteção
    const dx = X(this.u);
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.f += dt / 4;
      if (d.f > 0.86 && d.f < 1.04 && Math.abs(X(d.u) - dx) < 20) {
        this.drops.splice(i, 1);
        if (d.kind === 'heart') {
          this.goldAt.delete(d.id);     // se a vaga recomeçar, este coração já não volta
          this.got++;
          this.game.audio.play('heart');
          this.game.ui.setHud(this.got, this.total, this.level.title);
          this.fx.burst(dx, Y(0.94), 8, [PINK, '#ffd1e0', '#ffffff'], 50);
        } else if (d.kind === 'cafe') {
          this.energy = Math.min(1, this.energy + 0.5);
          this.game.audio.play('check');
          this.hint('Um café! Dá para aguentar mais um bocado do turno.', 2.5);
        } else {
          this.shield = 6;
          this.game.audio.play('check');
          this.hint('Chegou equipamento de proteção! Durante uns segundos, nada passa.', 3);
        }
      } else if (d.f > 1.06) this.drops.splice(i, 1);
    }

    // Hospital no limite: a vaga recomeça mais lenta (à terceira, segue-se em frente)
    if (this.pressure >= 100) {
      this.fails++;
      this.ease = 1 + this.fails * EASE_STEP;
      this.game.audio.play('hurt');
      if (this.fails >= MAX_FAILS) { this.pending = 'Foi no limite, mas aguentaram. Em frente!'; this.nextPhase(); return; }
      this.state = 'fail';
      this.timer = 0;
      this.hint('O hospital ficou no limite... Respira fundo. Ninguém desiste!', 3);
      return;
    }

    // Vaga superada
    if (this.spawned >= w.n && this.viruses.length === 0) {
      this.doneT += dt;
      if (this.doneT > 1.4 && !this.drops.some((d) => d.kind === 'heart')) {
        this.game.audio.play('win');
        this.nextPhase();
      }
    }
  }

  pop(vi, x, y) {
    const tp = TYPES[vi.type];
    this.fx.burst(x, y, tp.scale > 1 ? 16 : 9, [tp.pal.G, '#ffffff', '#bfe6ff'], 55);
    this.game.audio.play('stomp');
    // as variantes que se desfazem: saem dois pequenos, um para cada lado
    for (let k = 0; k < (tp.split || 0); k++) {
      this.viruses.push({ id: 1000 + this.extra++, u: clamp(vi.u + (k ? 0.07 : -0.07), 0.06, 0.94), f: Math.max(0, vi.f - 0.03), type: 'mini', hp: 1, ph: Math.random() * 6, gold: false, flash: 0 });
    }
    if (vi.gold) this.drops.push({ u: this.uOf(vi), f: vi.f, kind: 'heart', id: vi.id });
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const L = this.layout(v), t = this.t;
    if (this.state === 'inter' || (this.state === 'done' && this.inter)) { this.drawMoment(ctx, v, L, t); this.fx.draw(ctx); return; }
    const X = (u) => Math.round(L.fx0 + u * L.FW), Y = (f) => Math.round(L.y0 + f * (L.yBed - L.y0));
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

    this.drawWard(ctx, v, L, R, t);

    // Barreira do equipamento de proteção
    if (this.shield > 0 && (this.shield > 1.5 || Math.floor(t * 10) % 2)) {
      const y = Y(0.84);
      for (let x = L.fx0; x < L.fx0 + L.FW; x += 8) R(x + (Math.floor(t * 20) % 8), y, 5, 2, '#8fd0f5');
      R(L.fx0, y + 2, L.FW, 1, 'rgba(143,208,245,0.4)');
    }

    // Tiros
    for (const s of this.shots) {
      const x = X(s.u), y = Y(s.g);
      // contorno escuro e cores vivas, para se distinguirem bem da parede clara da enfermaria
      if (s.pierce) {
        R(x, y - 13, 1, 5, INK);                                   // agulha
        R(x - 2, y - 9, 5, 11, INK); R(x - 1, y - 8, 3, 9, '#ffffff');
        R(x - 1, y - 5, 3, 6, '#12a07a');                          // a vacina
        R(x - 3, y + 2, 7, 2, INK);                                // êmbolo
        R(x - 1, y + 5, 3, 3, 'rgba(18,160,122,0.35)');
      } else {
        R(x - 2, y - 6, 4, 9, INK); R(x - 1, y - 5, 2, 7, '#1f7fe0'); R(x - 1, y - 5, 2, 2, '#ffffff');
        R(x - 1, y + 4, 2, 3, 'rgba(31,127,224,0.4)');             // rasto
      }
    }

    // Vírus
    for (const vi of this.viruses) {
      const tp = TYPES[vi.type], img = this.virus[vi.type];
      const x = X(this.uOf(vi)), y = Y(vi.f), sz = Math.round(13 * tp.scale);
      if (vi.gold) { R(x - sz / 2 - 2, y - sz / 2 - 2, sz + 4, sz + 4, 'rgba(255,209,102,0.45)'); }
      if (vi.flash > 0) ctx.globalAlpha = 0.5;
      ctx.drawImage(img, x - Math.floor(sz / 2), y - Math.floor(sz / 2) + Math.round(Math.sin(t * 6 + vi.ph)), sz, sz);
      ctx.globalAlpha = 1;
      if (vi.gold) ctx.drawImage(this.spr.heart, x - 4, y - 4);
    }

    // Coisas a cair
    for (const d of this.drops) {
      const x = X(d.u), y = Y(d.f);
      if (d.kind === 'heart') ctx.drawImage(this.spr.heart, x - 4, y - 4);
      else if (d.kind === 'cafe') { R(x - 5, y - 4, 10, 9, INK); R(x - 4, y - 3, 8, 7, '#ffffff'); R(x - 4, y - 3, 8, 2, '#6a4424'); R(x + 5, y - 1, 2, 4, INK); R(x - 2, y - 8 + (Math.floor(t * 6) % 2), 1, 3, '#ffffff'); R(x + 1, y - 9 + (Math.floor(t * 6 + 1) % 2), 1, 3, '#ffffff'); }
      else { R(x - 7, y - 5, 14, 10, INK); R(x - 6, y - 4, 12, 8, '#8fd0f5'); R(x - 6, y - 1, 12, 1, '#ffffff'); R(x - 6, y + 1, 12, 1, '#ffffff'); R(x - 9, y - 2, 3, 1, '#ffffff'); R(x + 6, y - 2, 3, 1, '#ffffff'); }
    }

    // A dupla, de bata, touca e máscara
    const dx = X(this.u), dy = L.yBed - 2;
    const hop = this.state === 'fail' ? 0 : Math.floor(t * 8) % 2;
    this.drawDoctor(ctx, this.luisa.stand.r, dx - 17, dy - 24 - hop, 'luisa', 1);
    this.drawDoctor(ctx, this.sergio.stand.l, dx + 1, dy - 24 - (1 - hop), 'sergio', 1);
    // energia da dupla
    R(dx - 13, dy - 33, 26, 4, INK);
    R(dx - 12, dy - 32, Math.round(24 * this.energy), 2, this.energy > 0.5 ? GREEN : this.energy > 0.22 ? GOLD : RED);

    // Pressão sobre o hospital
    const bx = L.fx0 + L.FW - 9, by = L.y0 + 30, bh = Math.max(40, L.yBed - 44 - by);
    const fill = Math.round((bh * clamp(this.pressure, 0, 100)) / 100);
    R(bx - 3, by - 10, 12, 8, INK);          // caminha por cima da barra
    R(bx - 2, by - 9, 10, 4, '#ffffff');
    R(bx - 2, by - 5, 10, 2, '#8fd0f5');
    R(bx - 1, by - 1, 8, bh + 2, INK);
    R(bx, by, 6, bh, '#3a3046');
    R(bx, by + bh - fill, 6, fill, this.pressure > 70 ? RED : this.pressure > 40 ? GOLD : '#7be0b0');

    this.fx.draw(ctx);
  }

  drawDoctor(ctx, img, x, y, who, scale) {
    ctx.drawImage(img, x, y, 16 * scale, 24 * scale);
    // máscara por cima da boca
    const r = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx * scale, y + dy * scale, w * scale, h * scale); };
    if (who === 'luisa') { r(6, 11, 7, 2, '#ffffff'); r(5, 11, 1, 1, '#bfe6ff'); r(6, 13, 6, 1, '#d8e8f0'); }
    else { r(3, 9, 7, 2, '#ffffff'); r(10, 9, 1, 1, '#bfe6ff'); r(4, 11, 6, 1, '#d8e8f0'); }
  }

  drawWard(ctx, v, L, R, t) {
    // Parede da enfermaria e janelas
    ctx.fillStyle = '#cfe8e4';
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.fillStyle = '#bcdcd6';
    for (let x = (L.fx0 % 20) - 20; x < v.w; x += 20) ctx.fillRect(x, 0, 1, L.yBed - 30);
    for (let y = L.yBed - 30; y > 0; y -= 20) ctx.fillRect(0, y, v.w, 1);
    // Chão
    ctx.fillStyle = '#9fc4cc';
    ctx.fillRect(0, L.yBed - 30, v.w, v.h);
    ctx.fillStyle = '#8fb4bd';
    ctx.fillRect(0, L.yBed - 30, v.w, 2);
    // Camas com doentes, ao fundo da enfermaria
    const n = Math.max(3, Math.floor(L.FW / 62));
    for (let i = 0; i < n; i++) {
      const x = Math.round(L.fx0 + ((i + 0.5) * L.FW) / n) - 24, y = L.yBed + 2;
      R(x, y, 48, 16, INK);
      R(x + 1, y + 1, 46, 14, '#ffffff');
      R(x + 14, y + 1, 33, 14, i % 2 ? '#a8d8f0' : '#bfe6d8');
      R(x + 3, y + 3, 9, 9, '#f6c9a0');
      R(x + 3, y + 3, 9, 3, ['#6b4a2e', '#8a8794', '#3b2a20', '#b07a45'][i % 4]);
      R(x + 5, y + 8, 5, 3, '#ffffff');
      R(x + 1, y + 16, 3, 5, '#8a93a7');
      R(x + 44, y + 16, 3, 5, '#8a93a7');
      // monitor
      R(x + 36, y - 14, 12, 10, INK);
      R(x + 37, y - 13, 10, 7, '#0f2a2a');
      const ph = Math.floor(t * 14 + i * 5) % 10;
      for (let k = 0; k < 10; k++) R(x + 37 + k, y - 10 - (((k + ph) % 10) === 4 ? 3 : 0), 1, 1 + (((k + ph) % 10) === 4 ? 3 : 0), this.pressure > 70 ? RED : GREEN);
    }
  }

  // Momentos entre vagas, a ecrã inteiro.
  drawMoment(ctx, v, L, t) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = Math.round(v.w / 2);
    if (this.inter === 'palmas') {
      // 22h00: o país à janela a bater palmas
      const sky = ['#0b0e33', '#141a45', '#1d2666'];
      sky.forEach((c, i) => R(0, (i * v.h) / 3, v.w, v.h / 3 + 1, c));
      for (let i = 0; i < 30; i++) if (Math.sin(t * 2 + i * 1.7) > -0.6) R(hash(i) * v.w, hash(i * 3.1) * v.h * 0.3, 1, 1, '#ffffff');
      const top = Math.round(v.h * 0.16);
      R(L.fx0 + 6, top, L.FW - 12, v.h, '#3a3550');
      R(L.fx0 + 6, top, L.FW - 12, 4, '#55507a');
      const cols = Math.max(3, Math.floor((L.FW - 24) / 38)), gap = (L.FW - 24) / cols;
      for (let r = 0; top + 12 + r * 34 < v.h - 20; r++) {
        for (let c = 0; c < cols; c++) {
          const x = Math.round(L.fx0 + 12 + c * gap + (gap - 26) / 2), y = top + 12 + r * 34, k = hash(r * 7.3 + c * 3.1);
          R(x - 1, y - 1, 28, 24, INK);
          R(x, y, 26, 22, '#ffe9a8');
          if (k < 0.3) {
            // desenho do arco-íris: "vai ficar tudo bem"
            ['#d43d51', '#ffd166', '#5cf08a', '#3d8fe0'].forEach((col, j) => { R(x + 5 + j, y + 6 + j, 16 - j * 2, 2, col); R(x + 5 + j, y + 8 + j, 2, 8 - j, col); R(x + 19 - j, y + 8 + j, 2, 8 - j, col); });
          } else {
            const clap = Math.floor(t * 6 + k * 10) % 2;
            R(x + 9, y + 6, 8, 8, '#f6c9a0');
            R(x + 9, y + 5, 8, 3, ['#3b2a20', '#b07a45', '#8a8794', '#6b4a2e'][Math.floor(k * 40) % 4]);
            R(x + 7, y + 14, 12, 8, ['#d43d51', '#3d8fe0', '#3fae8a', '#ffd166'][Math.floor(k * 30) % 4]);
            R(x + (clap ? 10 : 6), y + 15, 3, 3, '#f6c9a0');
            R(x + (clap ? 13 : 17), y + 15, 3, 3, '#f6c9a0');
            if (clap) { R(x + 9, y + 12, 1, 2, '#ffffff'); R(x + 16, y + 12, 1, 2, '#ffffff'); }
          }
          R(x, y + 22, 26, 2, '#55507a');
        }
      }
    } else if (this.inter === 'video') {
      // Videochamada: a família toda, cada um no seu quadradinho (ver callTiles)
      R(0, 0, v.w, v.h, '#1a1433');
      const tiles = this.callTiles;
      const cols = v.portrait ? 3 : 4, rows = Math.ceil(tiles.length / cols);
      const tw = Math.min(70, Math.floor((L.FW - 10) / cols) - 4), th = Math.min(58, Math.floor((v.h - 46) / rows) - 4);
      const gx = cx - (cols * (tw + 4) - 4) / 2, gy = Math.round((v.h - rows * (th + 4)) / 2) + 12;
      tiles.forEach((tile, i) => {
        const x = Math.round(gx + (i % cols) * (tw + 4)), y = Math.round(gy + Math.floor(i / cols) * (th + 4));
        R(x - 1, y - 1, tw + 2, th + 2, '#fff6e6');
        R(x, y, tw, th, tile.bg);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, tw, th);
        ctx.clip();
        if (tile.scene === 'solar') drawHouseIcon(ctx, x + tw / 2 + 8, y + th - 2);
        if (tile.scene === 'snow') {
          // em Pretarouca, em janeiro, neva
          R(x, y + th - 5, tw, 5, '#eef2f8');
          for (let k = 0; k < 9; k++) R(x + ((k * 13 + Math.floor(t * 9)) % tw), y + ((k * 11 + Math.floor(t * 16)) % th), 1, 1, '#ffffff');
        }
        const n = tile.who.length, span = n > 1 ? 22 : 0;
        const hop = tile.hop ? Math.round(Math.abs(Math.sin(t * 8)) * 3) : 0;
        tile.who.forEach((fr, k) => {
          const img = fr.stand[k === 0 ? 'r' : 'l'], kid = img.height <= 16;
          const sx = Math.round(x + tw / 2 - 16 - span / 2 + k * span - (tile.scene === 'solar' ? 6 : 0));
          if (kid) ctx.drawImage(img, sx, y + th - 30 - hop, 32, 32);
          else ctx.drawImage(img, sx, y + th - 38, 32, 48);
        });
        if (tile.wave !== false) R(x + tw / 2 + 12 + span / 2, y + th - 24 + Math.round(Math.sin(t * 6 + i) * 2), 5, 5, '#f6c9a0');   // a acenar
        if (tile.bubble) {
          // a Carminho conta que vai ter um irmão: um balão com um bebé e um coração
          const bx = x + 3, by = y + 3 + Math.round(Math.sin(t * 5));
          R(bx, by, 24, 14, INK); R(bx + 1, by + 1, 22, 12, '#ffffff'); R(bx + 6, by + 14, 3, 2, INK);
          R(bx + 4, by + 4, 6, 6, '#f6c9a0'); R(bx + 4, by + 3, 6, 2, '#3b2a20'); R(bx + 5, by + 6, 1, 1, INK); R(bx + 8, by + 6, 1, 1, INK);
          ctx.drawImage(this.spr.heart, bx + 13, by + 3, 9, 8);
        }
        ctx.restore();
        R(x, y + th - 2, tw, 2, 'rgba(26,20,51,0.5)');
        R(x + 2, y + 2, 3, 3, Math.floor(t * 2 + i) % 3 ? GREEN : '#3a3046');
      });
    } else if (this.inter === 'vacina') {
      // Chega a vacina
      R(0, 0, v.w, v.h, '#16335a');
      const cy = Math.round(v.h * 0.55);
      for (let k = 0; k < 12; k++) {
        const a = t * 0.6 + (k * Math.PI) / 6;
        for (let r = 26; r < 90; r += 6) R(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 3, k % 2 ? 'rgba(255,209,102,0.5)' : 'rgba(255,255,255,0.25)');
      }
      const b = Math.round(Math.sin(t * 3) * 2);
      // frasco
      R(cx - 30, cy - 12 + b, 22, 30, INK);
      R(cx - 29, cy - 11 + b, 20, 28, '#eaf8ff');
      R(cx - 29, cy + 2 + b, 20, 15, '#7be0b0');
      R(cx - 27, cy - 18 + b, 16, 7, '#8a93a7');
      R(cx - 27, cy - 4 + b, 16, 8, '#ffffff');
      // seringa
      R(cx + 6, cy - 26 - b, 12, 36, INK);
      R(cx + 7, cy - 25 - b, 10, 34, '#eaf8ff');
      R(cx + 7, cy - 8 - b, 10, 17, '#7be0b0');
      R(cx + 4, cy - 34 - b, 16, 4, '#8a93a7');
      R(cx + 11, cy - 30 - b, 2, 6, '#8a93a7');
      R(cx + 11, cy + 10 - b, 2, 14, '#aab2c5');
    } else {
      // Fim: o pior já passou. Máscaras fora, um abraço e o arco-íris
      const sky = ['#58a8e8', '#a8dcf7', '#fff2c9'];
      sky.forEach((c, i) => R(0, (i * v.h) / 3, v.w, v.h / 3 + 1, c));
      const gy = Math.round(v.h * 0.78);
      ['#d43d51', '#ff8a4b', '#ffd166', '#5cf08a', '#3d8fe0', '#6a4a9a'].forEach((col, j) => {
        const rad = Math.min(v.w * 0.42, gy * 0.8) - j * 5;
        for (let a = Math.PI; a <= Math.PI * 2; a += 0.012) R(cx + Math.cos(a) * rad, gy + Math.sin(a) * rad, 3, 3, col);
      });
      R(0, gy, v.w, v.h - gy, '#62c25a');
      R(0, gy, v.w, 3, '#a4ec8a');
      const hop = Math.round(Math.abs(Math.sin(t * 4)) * 2);
      ctx.drawImage(getCharacter('luisa', 'casual').stand.r, cx - 28, gy - 48 - hop, 32, 48);
      ctx.drawImage(getCharacter('sergio', 'casual').stand.l, cx - 4, gy - 48 - hop, 32, 48);
      ctx.drawImage(this.spr.heart, cx - 9, gy - 70 + Math.round(Math.sin(t * 3) * 2), 18, 16);
    }
  }
}

// A Casa da Beira (o solar da família da Luísa), para o quadradinho da videochamada.
function drawHouseIcon(ctx, x, baseY) {
  const r = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + dx), Math.round(baseY + dy), w, h); };
  r(-26, -30, 52, 30, '#f2ece0');
  r(-28, -36, 56, 7, '#c2543a');
  r(-28, -30, 56, 1, '#9a3f2c');
  r(-26, -30, 4, 30, '#a8a4a0');
  r(22, -30, 4, 30, '#a8a4a0');
  r(-5, -16, 10, 16, '#5a3524');
  r(-4, -22, 8, 5, '#c4c0bc');
  for (const wx of [-19, 11]) { r(wx, -24, 8, 9, '#a8a4a0'); r(wx + 1, -23, 6, 7, '#4a7aa8'); r(wx, -11, 8, 8, '#a8a4a0'); r(wx + 1, -10, 6, 6, '#4a7aa8'); }
  r(-30, 0, 60, 3, '#2f7a40');
}
