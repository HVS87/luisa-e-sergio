// Nível de ciclismo: uma viagem de bicicleta a dois, com alforges.
// A estrada sobe e desce; os dois pedalam em fila e revezam-se à frente:
// quem puxa cansa-se, quem vai na roda recupera.
//
// Controlos (os mesmos botões das plataformas):
//   ▶ / seta direita (manter)  pedalar
//   ▲ / Espaço                 saltar por cima de buracos e ovelhas
//   ◀ / seta esquerda          trocar quem vai à frente
import { LEVELS } from '../levels/index.js';
import { THEMES, drawBackground } from '../themes.js';
import { getCharacter, getSprites, makeSprite, partnerOf } from '../sprites.js';
import { Particles } from '../fx.js';

const STEP = 4;          // distância entre amostras do perfil da estrada (px)
const GAP = 30;          // distância entre as duas bicicletas
const WB = 16, WR = 5;   // distância entre eixos e raio da roda
const VMAX = 235;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const INK = '#2b1d2e';

// Aspeto de cada ciclista: camisola, capacete, bicicleta e alforge.
const KIT = {
  luisa: { jersey: '#3fa0b5', shade: '#2f7f92', helmet: '#ffffff', bike: '#ff5d8f', bag: '#f08a4b', head: [2, 3, 12, 11] },
  sergio: { jersey: '#3d5aa8', shade: '#2a3f7a', helmet: '#d43d51', bike: '#3fae8a', bag: '#ffd166', head: [2, 1, 12, 11] },
};

const WHEEL = [
  ['...ooooo...', '..o.....o..', '.o...s...o.', 'o....s....o', 'o....s....o', 'o.sssosss.o', 'o....s....o', 'o....s....o', '.o...s...o.', '..o.....o..', '...ooooo...'],
  ['...ooooo...', '..o.....o..', '.os.....so.', 'o..s...s..o', 'o...s.s...o', 'o....o....o', 'o...s.s...o', 'o..s...s..o', '.os.....so.', '..o.....o..', '...ooooo...'],
];
const SHEEP = [
  '..wwwwwww.....',
  '.wwwwwwwwwkk..',
  'wwwwwwwwwwkkk.',
  'wWWwwwwwwwkk..',
  '.WWWwwwww.....',
  '..k.k..k.k....',
  '..k.k..k.k....',
];

function line(ctx, x0, y0, x1, y1, w, color) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  ctx.fillStyle = color;
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), w, w);
  }
}

export class BikeScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.usesPad = true;       // joga-se com os botões táteis ◀ ▶ ▲ (ver js/layout.js)
    this.spr = getSprites();
    const pal = { o: INK, s: '#aab2c5' };
    this.wheels = WHEEL.map((rows) => makeSprite(rows, pal));
    this.sheep = makeSprite(SHEEP, { w: '#ffffff', W: '#d8dce6', k: '#2b1d2e' });
    this.t = 0;
    this.paused = false;
    this.build();
    this.setup();
  }

  // Constrói o perfil da estrada e espalha os objetos, a partir de `route` no ficheiro do nível.
  build() {
    const pts = [0];
    let x = 0, y = 0, slope = 0;
    this.zones = [];
    this.hearts = [];
    this.bidons = [];
    this.obstacles = [];
    this.events = [];
    this.winds = [];
    this.tips = [];
    for (const seg of this.level.route) {
      if (seg.zone) { this.zones.push({ x, theme: THEMES[seg.zone] }); continue; }
      const x0 = x, n = Math.round(seg.len / STEP), target = -(seg.grade || 0);
      for (let i = 0; i < n; i++) {
        slope += (target - slope) * 0.06;    // as mudanças de inclinação são suaves
        y += slope * STEP;
        pts.push(y);
      }
      x += n * STEP;
      if (seg.tip) this.tips.push({ x: x0, text: seg.tip, shown: false });
      if (seg.wind) this.winds.push([x0, x]);
      if (seg.event) this.events.push({ x: x0 + 50, kind: seg.event, done: false });
      const obs = seg.obstacles || [];
      obs.forEach((kind, i) => this.obstacles.push({ x: Math.round(x0 + 130 + ((x - x0 - 220) * (i + 0.5)) / obs.length), kind, hit: false }));
      for (let i = 0; i < (seg.hearts || 0); i++) {
        const hx = Math.round(x0 + 60 + ((x - x0 - 120) * (i + 0.5)) / seg.hearts);
        // por cima de um obstáculo (ou de vez em quando) o coração fica no ar: só saltando
        const high = this.obstacles.some((o) => Math.abs(o.x - hx) < 22) || (seg.air && i % 2 === 1);
        this.hearts.push({ x: hx, h: high ? 30 : 11, got: false });
      }
      if (seg.bidon) this.bidons.push({ x: Math.round((x0 + x) / 2), got: false });
    }
    this.pts = pts;
    this.length = x;
    this.total = this.hearts.length;
  }

  setup() {
    const me = this.game.save.data.character;
    // riders[0] começa à frente (a personagem escolhida no menu)
    this.riders = [me, partnerOf(me)].map((name) => ({ name, e: 1, kit: KIT[name], img: getCharacter(name, 'casual').stand.r }));
    for (const o of this.obstacles) o.hit = false;
    for (const h of this.hearts) h.got = false;
    for (const b of this.bidons) b.got = false;
    for (const e of this.events) e.done = false;
    for (const tp of this.tips) tp.shown = false;
    this.state = 'intro';      // intro → ride ⇄ (furo | cafe) → won → done
    this.front = 0;
    this.swapT = 0;            // 0 = sem troca; de 1 a 0 durante a troca
    this.bx = 60;              // posição da bicicleta da frente
    this.v = 0;
    this.hop = 0;              // altura do salto
    this.hopV = 0;
    this.rearHops = [];        // a bicicleta de trás salta no mesmo sítio, um pouco depois
    this.rearHop = 0;
    this.rearHopV = 0;
    this.stun = 0;
    this.crank = 0;
    this.spin = 0;
    this.got = 0;
    this.timer = 0;
    this.taps = 0;
    this.bonked = false;
    this.inWind = false;
    this.hintT = 0;
    this.prevLeft = false;
    this.camH = 0;
    this.fx = new Particles();
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() { this.game.ui.setLevelMode(false, false); }

  begin() {
    this.state = 'ride';
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.hint(this.level.controls, 7);
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'intro' || this.state === 'won' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  hint(text, secs = 4) {
    if (!text) return;
    this.game.ui.setHint(this.game.ui.fmt(text));
    this.hintT = secs;
  }

  // Altura da estrada (y do mundo; para cima é negativo) na posição x.
  H(x) {
    const f = clamp(x / STEP, 0, this.pts.length - 1.001);
    const i = Math.floor(f);
    return this.pts[i] + (this.pts[i + 1] - this.pts[i]) * (f - i);
  }

  // Inclinação em x: positivo = a subir.
  grade(x) { return -(this.H(x + 8) - this.H(x - 8)) / 16; }

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
    if (this.state === 'ride') this.ride(dt, I);
    else if (this.state === 'furo') this.fixFlat(dt, I);
    else if (this.state === 'cafe') this.coffee(dt);
    else if (this.state === 'won') {
      this.v = Math.max(0, this.v - 160 * dt);
      this.move(dt);
      this.timer += dt;
      if (Math.floor(this.timer * 7) !== Math.floor((this.timer - dt) * 7)) {
        this.fx.heart(this.bx - 20 + Math.random() * 40, this.H(this.bx) - 34, Math.random() < 0.3 ? '#ffd166' : '#ff5d8f');
      }
      if (this.timer > 3) this.finish();
    }
    this.prevLeft = I.left;
    this.camH += (this.H(this.bx) - this.camH) * Math.min(1, dt * 5);
  }

  move(dt) {
    this.bx += this.v * dt;
    this.crank += this.v * dt * 0.09;
    this.spin += this.v * dt;
    // saltos (gravidade simples)
    if (this.hop > 0 || this.hopV > 0) {
      this.hop += this.hopV * dt;
      this.hopV -= 620 * dt;
      if (this.hop <= 0) { this.hop = 0; this.hopV = 0; }
    }
    for (let i = this.rearHops.length - 1; i >= 0; i--) {
      this.rearHops[i] -= dt;
      if (this.rearHops[i] <= 0) { this.rearHops.splice(i, 1); this.rearHopV = 158; this.rearHop = 0.01; }
    }
    if (this.rearHop > 0) {
      this.rearHop += this.rearHopV * dt;
      this.rearHopV -= 620 * dt;
      if (this.rearHop <= 0) { this.rearHop = 0; this.rearHopV = 0; }
    }
  }

  ride(dt, I) {
    const g = this.grade(this.bx);
    const wind = this.winds.some(([a, b]) => this.bx >= a && this.bx < b);
    if (wind && !this.inWind) this.hint('Vento de frente! Quem vai à frente cansa-se depressa: revezem-se (◀).', 5);
    this.inWind = wind;

    // Trocar quem vai à frente
    if (I.left && !this.prevLeft && this.swapT <= 0) {
      this.front = 1 - this.front;
      this.swapT = 1;
      this.bonked = false;
      this.game.audio.play('click');
    }
    if (this.swapT > 0) this.swapT = Math.max(0, this.swapT - dt * 1.8);

    // Pedalar gasta a energia de quem puxa; quem vai na roda recupera
    const pedal = I.right && this.stun <= 0;
    const lead = this.riders[this.front];
    if (pedal) lead.e -= 0.05 * (1 + Math.max(0, g) * 5.5) * (wind ? 1.7 : 1) * dt;
    else lead.e += 0.035 * dt;
    this.riders[1 - this.front].e += 0.075 * dt;
    for (const r of this.riders) r.e = clamp(r.e, 0, 1);
    if (lead.e <= 0 && !this.bonked) {
      this.bonked = true;
      this.game.audio.play('hurt');
      this.hint(`Bateu o homem da marreta ${lead.name === 'luisa' ? 'à Luísa' : 'ao Sérgio'}! Troca de posição (◀).`, 4);
    } else if (this.bonked && lead.e > 0.3) this.bonked = false;

    // Velocidade: pedalada contra o atrito, a inclinação e o vento
    const power = this.bonked ? 0.4 : 1;
    let a = (pedal ? 92 * power : 0) - this.v * (wind ? 0.8 : 0.6) - g * (g > 0 ? 250 : 480);
    if (this.stun > 0) { this.stun -= dt; a -= this.v * 2; }
    this.v = clamp(this.v + a * dt, pedal ? 34 : 0, VMAX);

    // Salto
    if (I.jumpPressed && this.hop <= 0 && this.stun <= 0) {
      this.hop = 0.01;
      this.hopV = 158;
      this.rearHops.push(GAP / Math.max(40, this.v));
      this.game.audio.play('jump');
    }
    this.move(dt);
    if (this.v > 150 && Math.random() < dt * 14) this.fx.add({ x: this.bx - GAP - 12, y: this.H(this.bx - GAP) - 2, vx: -30, vy: -10, life: 0.3, color: '#ffffff' });

    // Dicas ao longo do percurso
    for (const tp of this.tips) if (!tp.shown && this.bx >= tp.x) { tp.shown = true; this.hint(tp.text, 5); }

    // Corações e bidões
    const gy = this.H(this.bx);
    for (const h of this.hearts) {
      if (h.got || Math.abs(h.x - this.bx - 6) > 12) continue;
      if (Math.abs(h.h - (this.hop + 12)) > 15) continue;
      h.got = true;
      this.got++;
      this.fx.burst(h.x, this.H(h.x) - h.h, 8, ['#ff5d8f', '#ffd1e0', '#ffffff'], 50);
      this.game.audio.play('heart');
      this.game.ui.setHud(this.got, this.total, this.level.title);
    }
    for (const b of this.bidons) {
      if (b.got || Math.abs(b.x - this.bx - 6) > 12 || this.hop > 16) continue;
      b.got = true;
      for (const r of this.riders) r.e = Math.min(1, r.e + 0.45);
      this.fx.burst(b.x, gy - 12, 10, ['#8fd0f5', '#ffffff'], 50);
      this.game.audio.play('check');
      this.hint('Um bidão fresquinho! Energia para os dois.', 3);
    }

    // Obstáculos: só não contam se a bicicleta for no ar
    for (const o of this.obstacles) {
      if (o.hit || Math.abs(o.x - (this.bx + WB)) > 7 || this.hop > 5) continue;
      o.hit = true;
      this.stun = 0.9;
      this.v *= 0.3;
      lead.e = Math.max(0, lead.e - 0.12);
      this.fx.burst(o.x, gy - 8, 14, ['#ffffff', '#ffd166', '#ff5d8f'], 70);
      this.game.audio.play('buzz');
      this.hint(o.kind === 'ovelha' ? 'Mééé! Cuidado com as ovelhas (salta com ▲)!' : 'Ui, um buraco! Salta por cima com ▲.', 3);
    }

    // Acontecimentos: furo e paragem no café
    for (const ev of this.events) {
      if (ev.done || this.bx < ev.x) continue;
      ev.done = true;
      this.state = ev.kind;
      this.timer = 0;
      this.taps = 0;
      this.game.input.reset();
      if (ev.kind === 'furo') { this.game.audio.play('buzz'); this.hint('Furo! Toca depressa (▲ ou ▶) para encher o pneu!', 30); }
      else { this.game.audio.play('check'); this.hint('Paragem para o café e um pastel de nata. É sagrada!', 4); }
    }

    if (this.bx >= this.length - 150) {
      this.state = 'won';
      this.timer = 0;
      this.game.ui.setLevelMode(true, false);
      this.game.audio.play('win');
      this.hint(this.level.arrival, 6);
    }
  }

  // Furo: toques rápidos enchem o pneu.
  fixFlat(dt, I) {
    this.v = Math.max(0, this.v - 400 * dt);
    this.move(dt);
    this.timer += dt;
    if (I.jumpPressed || I.actionPressed || (I.right && !this.prevRight)) {
      this.taps++;
      this.game.audio.play('slurp');
    }
    this.prevRight = I.right;
    if (this.taps >= 12) {
      this.state = 'ride';
      this.game.audio.play('check');
      this.hint('Pneu cheio. Siga viagem!', 3);
    }
  }

  // Café: os dois recuperam a energia toda.
  coffee(dt) {
    this.v = Math.max(0, this.v - 300 * dt);
    this.move(dt);
    this.timer += dt;
    for (const r of this.riders) r.e = Math.min(1, r.e + dt * 0.5);
    if (Math.floor(this.timer * 4) !== Math.floor((this.timer - dt) * 4)) this.fx.heart(this.bx - 10 + Math.random() * 20, this.H(this.bx) - 34);
    if (this.timer > 2.8) {
      this.state = 'ride';
      this.bonked = false;
      this.hint('De barriga cheia e pernas novas!', 3);
    }
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const camX = Math.round(this.bx - v.w * 0.32);
    const base = Math.round(v.h * 0.7);    // linha do chão no ecrã, junto à bicicleta
    const sy = (wx) => base + Math.round(this.H(wx) - this.camH);  // y no ecrã da estrada em wx
    const t = this.t;

    // Fundo: muda com a zona; o horizonte desce um pouco quando se sobe
    const gy = clamp(base + 8 - Math.round(this.camH * 0.12), base - 30, v.h - 4);
    const cx = this.bx;
    let zi = 0;
    while (zi + 1 < this.zones.length && cx >= this.zones[zi + 1].x) zi++;
    const bgX = Math.max(0, camX);
    drawBackground(this.zones[zi].theme, ctx, v.w, v.h, bgX, gy, t);
    const next = this.zones[zi + 1];
    if (next && next.x - cx < 160) {
      ctx.globalAlpha = clamp(1 - (next.x - cx) / 160, 0, 1);
      drawBackground(next.theme, ctx, v.w, v.h, bgX, gy, t);
      ctx.globalAlpha = 1;
    }

    // Estrada e terreno, coluna a coluna
    let zj = 0;
    for (let x = 0; x < v.w; x += 2) {
      const wx = camX + x;
      while (zj + 1 < this.zones.length && wx >= this.zones[zj + 1].x) zj++;
      const road = this.zones[zj].theme.road, y = sy(wx);
      ctx.fillStyle = road.earth;
      ctx.fillRect(x, y + 5, 2, v.h - y);
      ctx.fillStyle = road.grass;
      ctx.fillRect(x, y + 3, 2, 3 + (((wx >> 1) * 7) % 3));
      ctx.fillStyle = '#4a4e5e';
      ctx.fillRect(x, y, 2, 3);
      ctx.fillStyle = '#7a7f90';
      ctx.fillRect(x, y, 2, 1);
      if (((wx >> 1) * 13) % 37 === 0) { ctx.fillStyle = road.earthDark; ctx.fillRect(x, y + 12 + ((wx * 3) % 30), 2, 2); }
    }

    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x - camX), Math.round(y), w, h); };

    // Marcos quilométricos
    for (let k = Math.max(1, Math.floor(camX / 480)); k * 480 < camX + v.w + 20; k++) {
      const wx = k * 480, y = sy(wx);
      R(wx - 3, y - 9, 6, 9, INK);
      R(wx - 2, y - 8, 4, 8, '#ffffff');
      R(wx - 2, y - 8, 4, 2, '#d43d51');
    }

    // Café e meta
    for (const ev of this.events) if (ev.kind === 'cafe') this.drawCafe(R, ev.x + 26, sy(ev.x + 26), t);
    this.drawFinish(R, this.length - 110, sy(this.length - 110), t);

    // Obstáculos
    for (const o of this.obstacles) {
      if (o.x < camX - 20 || o.x > camX + v.w + 20) continue;
      const y = sy(o.x);
      if (o.kind === 'ovelha') ctx.drawImage(this.sheep, Math.round(o.x - camX) - 7, y - 7 - (o.hit ? 3 : 0));
      else { R(o.x - 7, y, 14, 3, INK); R(o.x - 5, y + 1, 10, 2, '#15101c'); R(o.x - 8, y - 1, 3, 1, '#7a7f90'); R(o.x + 6, y - 1, 2, 1, '#7a7f90'); }
    }

    // Corações e bidões
    for (const h of this.hearts) {
      if (h.got || h.x < camX - 10 || h.x > camX + v.w + 10) continue;
      ctx.drawImage(this.spr.heart, Math.round(h.x - camX) - 4, sy(h.x) - h.h - 4 + Math.round(Math.sin(t * 4 + h.x) * 1.5));
    }
    for (const b of this.bidons) {
      if (b.got) continue;
      const y = sy(b.x) - 16 + Math.round(Math.sin(t * 3) * 2);
      R(b.x - 3, y - 1, 6, 11, INK);
      R(b.x - 2, y, 4, 9, '#3d8fe0');
      R(b.x - 2, y + 3, 4, 2, '#ffffff');
      R(b.x - 1, y - 3, 2, 3, INK);
    }

    // As duas bicicletas: a de trás vai na roda da da frente
    {
      const s = this.swapT;                       // 1 → 0 enquanto trocam de lugar
      const lead = this.riders[this.front], rear = this.riders[1 - this.front];
      const xLead = this.bx - GAP * s, xRear = this.bx - GAP * (1 - s);
      const pedal = this.state === 'ride' && this.game.input.right;
      this.drawBike(ctx, rear, xRear, camX, sy, this.rearHop, pedal, s > 0 ? -2 : 0);
      this.drawBike(ctx, lead, xLead, camX, sy, this.hop, pedal, 0);
    }

    // Vento de frente
    if (this.inWind && this.state === 'ride') {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 9; i++) {
        const x = v.w - ((t * (170 + i * 23) + i * 97) % (v.w + 40));
        ctx.fillRect(Math.round(x), 16 + ((i * 53) % Math.max(20, base - 30)), 14 + (i % 3) * 6, 1);
      }
    }

    // Furo: bomba e barra do pneu
    if (this.state === 'furo') {
      const x = this.bx + WB, y = sy(x) - 22;
      const push = this.taps % 2 ? 3 : 0;
      R(x + 3, y - 12 + push, 6, 2, INK);
      R(x + 5, y - 10 + push, 2, 8, '#aab2c5');
      R(x + 3, y - 2, 6, 12, '#d43d51');
      R(x - 14, y - 22, 30, 5, INK);
      R(x - 13, y - 21, Math.round((28 * this.taps) / 12), 3, '#5cf08a');
    }

    this.fx.draw(ctx, camX, this.camH - base);

    // Percurso: barra de progresso em baixo
    const pw = Math.min(120, v.w - 120), px = Math.round((v.w - pw) / 2), py = v.h - 7;
    ctx.fillStyle = INK;
    ctx.fillRect(px - 1, py - 1, pw + 2, 4);
    ctx.fillStyle = '#fff6e6';
    ctx.fillRect(px, py, pw, 2);
    ctx.fillStyle = '#ff5d8f';
    ctx.fillRect(px, py, Math.round(pw * clamp(this.bx / (this.length - 150), 0, 1)), 2);
    for (const ev of this.events) { ctx.fillStyle = ev.kind === 'cafe' ? '#8a5a34' : '#d43d51'; ctx.fillRect(px + Math.round((pw * ev.x) / this.length), py - 2, 2, 6); }

  }

  // Uma bicicleta com alforge e o seu ciclista. x = roda de trás (posição no mundo).
  drawBike(ctx, r, x, camX, sy, hop, pedal, dz) {
    const k = r.kit;
    const rx = Math.round(x - camX), fx = rx + WB;
    const wob = this.stun > 0 ? Math.round(Math.sin(this.t * 40) * 2) : 0;
    const ry = sy(x) - WR - Math.round(hop) + dz, fy = sy(x + WB) - WR - Math.round(hop) + dz + wob;
    const P = (tt, up) => [rx + WB * tt, ry + (fy - ry) * tt - up];
    const wheel = this.wheels[Math.floor(this.spin / 6) % 2];
    ctx.drawImage(wheel, rx - 5, ry - 5);
    ctx.drawImage(wheel, fx - 5, fy - 5);

    const bb = P(0.45, 1), seat = P(0.2, 10), bar = P(0.9, 11);
    const a = this.crank, legAt = (ang) => [bb[0] + Math.cos(ang) * 3, bb[1] + Math.sin(ang) * 3];
    const hip = [seat[0] + 1, seat[1] - 2], sh = P(0.64, 19);
    const leg = (ang, c1, c2) => {
      const p = pedal || this.v > 4 ? legAt(ang) : legAt(1.2);
      const knee = [(hip[0] + p[0]) / 2 + 3, (hip[1] + p[1]) / 2 - 2];
      line(ctx, hip[0], hip[1], knee[0], knee[1], 2, c1);
      line(ctx, knee[0], knee[1], p[0], p[1], 2, c2);
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) + 1, 4, 1);
    };
    leg(a + Math.PI, '#1c1c28', '#c79a78');                     // perna de trás, mais escura
    // quadro
    line(ctx, rx, ry, seat[0], seat[1], 1, k.bike);
    line(ctx, seat[0], seat[1], bb[0], bb[1], 1, k.bike);
    line(ctx, bb[0], bb[1], rx, ry, 1, k.bike);
    line(ctx, seat[0], seat[1] + 2, bar[0], bar[1] + 2, 1, k.bike);
    line(ctx, bb[0], bb[1], bar[0], bar[1] + 3, 1, k.bike);
    line(ctx, bar[0], bar[1], fx, fy, 1, k.bike);
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(seat[0]) - 2, Math.round(seat[1]) - 1, 5, 2);
    ctx.fillRect(Math.round(bar[0]) - 1, Math.round(bar[1]) - 2, 3, 2);
    // alforge
    ctx.fillRect(rx - 5, ry - 10, 8, 8);
    ctx.fillStyle = k.bag;
    ctx.fillRect(rx - 4, ry - 9, 6, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(rx - 4, ry - 6, 6, 1);
    // ciclista
    line(ctx, hip[0], hip[1], sh[0], sh[1], 3, k.jersey);
    line(ctx, hip[0] + 1, hip[1], sh[0] + 1, sh[1] + 1, 1, k.shade);
    leg(a, '#2b2b3a', '#f6c9a0');
    line(ctx, sh[0] + 1, sh[1] + 1, bar[0], bar[1] - 2, 2, k.jersey);
    ctx.fillStyle = '#f6c9a0';
    ctx.fillRect(Math.round(bar[0]) - 1, Math.round(bar[1]) - 3, 2, 2);
    const hx = Math.round(sh[0]) - 4, hy = Math.round(sh[1]) - 11;
    const [sx, sy0, sw, shh] = k.head;
    ctx.drawImage(r.img, sx, sy0, sw, shh, hx, hy, sw, shh);
    // capacete
    ctx.fillStyle = INK;
    ctx.fillRect(hx, hy - 2, 12, 5);
    ctx.fillStyle = k.helmet;
    ctx.fillRect(hx + 1, hy - 1, 10, 3);
    ctx.fillRect(hx + 2, hy - 2, 8, 1);
    ctx.fillStyle = INK;
    ctx.fillRect(hx + 3, hy - 1, 1, 2);
    ctx.fillRect(hx + 6, hy - 1, 1, 2);
    ctx.fillRect(hx + 9, hy - 1, 1, 2);
    // energia por cima da cabeça
    ctx.fillStyle = INK;
    ctx.fillRect(hx - 1, hy - 9, 14, 4);
    ctx.fillStyle = r.e > 0.5 ? '#5cf08a' : r.e > 0.22 ? '#ffd166' : '#ff3b3b';
    ctx.fillRect(hx, hy - 8, Math.round(12 * r.e), 2);
  }

  drawCafe(R, x, y, t) {
    R(x - 1, y - 30, 46, 30, INK);
    R(x, y - 29, 44, 29, '#fff6e6');
    R(x - 3, y - 34, 50, 6, '#c2543a');
    R(x - 3, y - 34, 50, 1, '#e8884a');
    R(x + 4, y - 16, 9, 16, '#5a3524');
    R(x + 18, y - 20, 20, 10, '#8fd0f5');
    R(x + 27, y - 20, 1, 10, '#fff6e6');
    for (let i = 0; i < 6; i++) R(x + 15 + i * 5, y - 25, 5, 4, i % 2 ? '#ffffff' : '#d43d51');
    // esplanada
    R(x + 52, y - 9, 12, 2, '#fff6e6');
    R(x + 57, y - 7, 2, 7, '#8a93a7');
    R(x + 54, y - 13, 3, 4, '#ffffff');
    R(x + 59, y - 12, 4, 3, '#ffd166');
    if (Math.floor(t * 3) % 2) R(x + 55, y - 16, 1, 2, '#ffffff');
  }

  drawFinish(R, x, y, t) {
    R(x, y - 46, 3, 46, '#fff6e6');
    R(x + 60, y - 46, 3, 46, '#fff6e6');
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) R(x + 3 + i * 6, y - 46 + j * 5, 6, 5, (i + j) % 2 ? '#2b1d2e' : '#ffffff');
    const cols = ['#ff5d8f', '#ffd166', '#7be0b0', '#6fb0f0'];
    for (let i = 0; i < 9; i++) R(x + 5 + i * 6, y - 35 + Math.round(Math.sin(t * 4 + i) * 1), 4, 4, cols[i % 4]);
  }
}
