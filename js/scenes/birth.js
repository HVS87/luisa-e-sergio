// Nível bónus: na maternidade.
// A Luísa está na maca a dar à luz e o bebé salta: o Sérgio tem de o apanhar!
// São duas rondas, com um "fade" a negro pelo meio: primeiro o Xavier e, dois anos
// depois, a pequena Luísa — enquanto o Xavier, que já anda, se mete pelo meio.
//
// Controlos: arrastar o dedo (ou setas ◀ ▶) para mover o Sérgio. A sombra no chão
// mostra onde o bebé vai cair. O chão é todo almofadado: se falhar, o bebé ressalta.
import { LEVELS } from '../levels/index.js';
import { getCharacter, charFrame, getSprites } from '../sprites.js';
import { Particles } from '../fx.js';

const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f';
const MATS = ['#a8d8f0', '#ffe9a8', '#ffc6de', '#bfe6c8'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class BirthScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.rounds = this.level.rounds;
    this.spr = getSprites();
    this.sergio = getCharacter('sergio', 'scrubs');
    this.luisa = getCharacter('luisa', 'casual');
    this.midwife = getCharacter('parteira');
    this.xavier = getCharacter('xavier');
    this.total = this.rounds.length * 3;
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'intro';      // intro → (fade → push → fly → caught) por cada ronda → end → done
    this.round = 0;
    this.got = 0;
    this.timer = 0;
    this.sx = 0.6;             // posição do Sérgio (fração da largura da sala)
    this.stun = 0;
    this.dist = 0;
    this.baby = null;
    this.bounces = 0;
    this.kid = null;           // o Xavier a passear (só na segunda ronda)
    this.nurse = false;        // a parteira apanhou o bebé
    this.moving = false;
    this.face = -1;
    this.held = [];            // bebés já ao colo ou no berço
    this.fx = new Particles();
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    document.body.classList.remove('caption');
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.startRound();
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
    document.body.classList.toggle('caption', !this.paused && this.state === 'fade');
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  // Cada ronda começa com o ecrã a negro e a legenda do tempo que passou.
  startRound() {
    const r = this.rounds[this.round];
    this.state = 'fade';
    this.timer = 0;
    this.baby = null;
    this.bounces = 0;
    this.count = 3;
    this.kid = r.toddler ? { x: 0.75, dir: -1, wait: 0, dist: 0, cool: 0 } : null;
    document.body.classList.add('caption');
    this.game.ui.setHint(r.when);
  }

  geo(v) {
    const gy = Math.round(v.h * (v.portrait ? 0.66 : 0.8));
    const x0 = 108, x1 = v.w - 18;       // por onde o Sérgio pode andar (à direita da cama)
    return { gy, x0, x1, X: (f) => x0 + f * (x1 - x0) };
  }

  // Lança o bebé num arco até um sítio ao acaso; T é o tempo que fica no ar
  // (a gravidade ajusta-se para o arco caber no ecrã).
  launch(v, fromX, fromY, T) {
    const g = this.geo(v);
    // um sítio ao acaso, longe do Sérgio; se a sala for estreita, o lado mais afastado dele
    const lo = g.x0 + 8, hi = g.x1 - 8, sx = g.X(this.sx);
    let target = -1;
    for (let k = 0; k < 20 && target < 0; k++) {
      const t = lo + Math.random() * (hi - lo);
      if (Math.abs(t - sx) >= 40) target = t;
    }
    if (target < 0) target = sx - lo > hi - sx ? lo : hi;
    const b = this.baby || {};
    b.x = fromX; b.y = fromY;
    b.tx = target;
    b.g = (8 * clamp(g.gy - 95, 50, 170)) / (T * T);
    b.vx = (target - fromX) / T;
    b.vy = (g.gy - 58 - fromY) / T - (b.g * T) / 2;
    this.baby = b;
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, v = this.game.view, g = this.geo(v), r = this.rounds[this.round];
    this.timer += dt;

    // Mover o Sérgio (exceto com o ecrã a negro)
    if (this.state === 'push' || this.state === 'fly') {
      const old = this.sx;
      if (this.stun > 0) this.stun -= dt;
      else {
        const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0), span = g.x1 - g.x0;
        if (dir) this.sx += (dir * 155 * dt) / span;
        else if (I.pointerX >= 0) this.sx += clamp((I.pointerX * v.w - g.x0) / span - this.sx, (-270 * dt) / span, (270 * dt) / span);
      }
      this.sx = clamp(this.sx, 0, 1);
      this.moving = Math.abs(this.sx - old) > 0.0005;
      if (this.moving) { this.dist += Math.abs(this.sx - old) * (g.x1 - g.x0); this.face = this.sx > old ? 1 : -1; }
      this.stepKid(dt, g);
    }

    if (this.state === 'fade') {
      if (this.timer > 2.6) {
        this.state = 'push';
        this.timer = 0;
        document.body.classList.remove('caption');
        this.game.ui.setHint(`Parteira: «Força, Luísa!» — Prepara-te, Sérgio... ${this.count}`);
      }
    } else if (this.state === 'push') {
      const left = 3 - Math.floor(this.timer / 1.1);
      if (left !== this.count && left > 0) {
        this.count = left;
        this.game.audio.play('click');
        this.game.ui.setHint(`Parteira: «Força, Luísa!» — Prepara-te, Sérgio... ${left}`);
      }
      if (this.timer > 3.3) {
        this.state = 'fly';
        this.timer = 0;
        this.game.audio.play('pop');
        this.launch(v, 80, g.gy - 58, r.toddler ? 1.9 : 2.2);
        this.fx.burst(82, g.gy - 56, 14, ['#ffffff', GOLD, r.blanket], 70);
        this.game.ui.setHint(`Lá vai ${r.article} ${r.name}! Apanha!`);
      }
    } else if (this.state === 'fly') {
      const b = this.baby;
      b.vy += b.g * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x > v.w - 8) { b.x = v.w - 8; b.vx = -Math.abs(b.vx); }       // ressalta na parede
      const sx = g.X(this.sx);
      if (b.vy > 0 && b.y >= g.gy - 66 && b.y <= g.gy - 44 && Math.abs(b.x - sx) < 18 && this.stun <= 0) {
        this.catch(g, r);
      } else if (b.y >= g.gy - 8) {
        // caiu no chão almofadado: ressalta (à terceira, a parteira trata do assunto)
        this.bounces++;
        this.game.audio.play('stomp');
        this.fx.burst(b.x, g.gy - 4, 10, ['#ffffff', ...MATS], 50);
        if (this.bounces >= 3) {
          this.state = 'caught';
          this.timer = 0;
          this.nurse = true;
          this.game.audio.play('check');
          this.game.ui.setHint(`A parteira apanhou ${r.article} ${r.name}! Ufa... ${r.born}`);
        } else {
          this.launch(v, b.x, g.gy - 10, 1.5);
          this.game.ui.setHint('Ups! Ainda bem que o chão é almofadado... Outra vez!');
        }
      }
    } else if (this.state === 'caught') {
      if (Math.floor(this.timer * 6) !== Math.floor((this.timer - dt) * 6)) this.fx.heart(g.X(this.sx) - 12 + Math.random() * 24, g.gy - 60, Math.random() < 0.3 ? GOLD : PINK);
      if (this.timer > 3.4) {
        this.held.push(r);
        this.round++;
        this.nurse = false;
        if (this.round < this.rounds.length) this.startRound();
        else {
          this.state = 'end';
          this.timer = 0;
          this.game.ui.setLevelMode(true, false);
          this.game.audio.play('fanfare');
          this.game.ui.setHint(this.level.ending);
        }
      }
    } else if (this.state === 'end') {
      if (Math.floor(this.timer * 6) !== Math.floor((this.timer - dt) * 6)) this.fx.heart(v.w * 0.2 + Math.random() * v.w * 0.6, g.gy - 40 - Math.random() * 30, Math.random() < 0.3 ? GOLD : PINK);
      if (this.timer > 4.5) this.finish();
    }
  }

  catch(g, r) {
    const hearts = Math.max(1, 3 - this.bounces);
    this.got += hearts;
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.state = 'caught';
    this.timer = 0;
    this.game.audio.play('win');
    this.fx.burst(this.baby.x, this.baby.y, 16, [GOLD, '#ffffff', r.blanket], 70);
    const apanhado = r.article === 'a' ? 'Apanhada' : 'Apanhado';
    this.game.ui.setHint((this.bounces ? apanhado + '! ' : apanhado + ' à primeira! ') + r.born);
  }

  // O Xavier a passear pela sala: se o Sérgio lhe tropeça, perde um instante.
  stepKid(dt, g) {
    const k = this.kid;
    if (!k) return;
    if (k.cool > 0) k.cool -= dt;
    if (k.wait > 0) k.wait -= dt;
    else {
      const old = k.x;
      k.x += (k.dir * 30 * dt) / (g.x1 - g.x0);
      k.dist += Math.abs(k.x - old) * (g.x1 - g.x0);
      if (k.x < 0.08 || k.x > 0.95 || Math.random() < dt * 0.35) {
        k.dir *= -1;
        k.x = clamp(k.x, 0.08, 0.95);
        k.wait = Math.random() < 0.5 ? 0.6 : 0;
      }
    }
    if (k.cool <= 0 && this.stun <= 0 && Math.abs(g.X(k.x) - g.X(this.sx)) < 13) {
      this.stun = 0.55;
      k.cool = 1.8;
      this.game.audio.play('hurt');
      this.fx.heart(g.X(k.x), g.gy - 30);
      this.game.ui.setHint('Xavier: «Papá!» — Agora não, filho, que a mana vem aí!');
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
    const g = this.geo(v), t = this.t, r = this.rounds[Math.min(this.round, this.rounds.length - 1)];
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const gy = g.gy;
    const st = this.state === 'done' ? 'end' : this.state;   // o ecrã final fica como pano de fundo

    // Sala de partos: parede clara, janela, e chão todo almofadado
    R(0, 0, v.w, gy, '#fde8d8');
    for (let x = 0; x < v.w; x += 24) R(x, 0, 1, gy, '#f6d8c4');
    R(0, gy - 22, v.w, 22, '#f3c9b0');
    R(0, gy - 22, v.w, 2, '#e8b89a');
    const wx = Math.round(v.w * 0.55);
    R(wx - 2, Math.max(28, gy - 110), 44, 34, '#ffffff');
    R(wx, Math.max(30, gy - 108), 40, 30, '#a8dcf7');
    R(wx + 19, Math.max(30, gy - 108), 2, 30, '#ffffff');
    R(wx + 6, Math.max(36, gy - 102), 10, 4, '#ffffff');
    for (let x = 0, i = 0; x < v.w; x += 20, i++) for (let y = gy, j = 0; y < v.h; y += 14, j++) {
      R(x, y, 20, 14, MATS[(i + j) % 4]);
      R(x, y, 20, 1, 'rgba(255,255,255,0.5)');
      R(x + 19, y, 1, 14, 'rgba(0,0,0,0.08)');
    }
    // berço à espera, ao canto
    const cxr = v.w - 22;
    R(cxr - 14, gy - 22, 28, 14, INK);
    R(cxr - 13, gy - 21, 26, 12, '#c98f52');
    R(cxr - 11, gy - 20, 22, 8, '#ffffff');
    R(cxr - 12, gy - 8, 3, 8, '#8a5a34');
    R(cxr + 9, gy - 8, 3, 8, '#8a5a34');

    this.drawBed(ctx, R, gy, st, t);

    // O Xavier, que já anda (segunda ronda)
    if (this.kid) {
      const k = this.kid, kx = g.X(k.x);
      const joy = st === 'end' || st === 'caught' ? Math.round(Math.abs(Math.sin(t * 8)) * 3) : 0;
      ctx.drawImage(charFrame(this.xavier, k.dir, k.wait <= 0 && st !== 'end', false, k.dist), Math.round(kx) - 8, gy - 24 - joy);
    }

    // O Sérgio, de braços estendidos
    const sx = Math.round(g.X(this.sx));
    const facing = this.face || -1;
    const wob = this.stun > 0 ? Math.round(Math.sin(t * 40) * 2) : 0;
    const frame = st === 'fly' || st === 'push' ? charFrame(this.sergio, facing, this.moving, false, this.dist) : this.sergio.stand.l;
    ctx.drawImage(frame, sx - 16 + wob, gy - 48, 32, 48);
    const hold = st === 'caught' && !this.nurse || st === 'end';
    if (!hold && (st === 'fly' || st === 'push')) {
      R(sx - 15 + wob, gy - 54, 4, 32, INK);     // braços no ar...
      R(sx + 11 + wob, gy - 54, 4, 32, INK);
      R(sx - 14 + wob, gy - 53, 2, 30, '#eebb8e');
      R(sx + 12 + wob, gy - 53, 2, 30, '#eebb8e');
      R(sx - 18 + wob, gy - 58, 36, 5, INK);     // ...a esticar o lençol para apanhar
      R(sx - 17 + wob, gy - 57, 34, 3, '#ffffff');
    }

    // O bebé: no ar (com sombra no chão), ao colo, ou nos braços da parteira
    const b = this.baby;
    if (st === 'fly' && b) {
      const hgt = clamp((gy - b.y) / 130, 0, 1), sw = Math.round(22 - hgt * 12);     // a sombra cresce à medida que ele desce
      R(b.tx - sw / 2, gy + 2, sw, 3, 'rgba(43,29,46,0.5)');
      R(b.tx - sw / 2 + 2, gy + 1, sw - 4, 1, 'rgba(43,29,46,0.5)');
      R(b.tx - sw / 2 + 2, gy + 5, sw - 4, 1, 'rgba(43,29,46,0.5)');
      this.drawBaby(R, b.x, b.y, r.blanket, Math.floor(t * 8) % 4);
    } else if (hold) this.drawBaby(R, sx, gy - 17, r.blanket, 0);
    else if (st === 'caught' && this.nurse) this.drawBaby(R, 60, gy - 54, r.blanket, 0);   // nos braços da parteira
    // quem já nasceu fica no berço (o Xavier só enquanto não anda)
    this.held.forEach((h, i) => { if (!(this.kid && h === this.rounds[0]) && !(st === 'end' && i === this.held.length - 1)) this.drawBaby(R, cxr, gy - 22, h.blanket, 0); });

    this.fx.draw(ctx);

    // "Fade" a negro entre rondas
    if (st === 'fade') {
      const a = this.timer < 1.9 ? 1 : clamp(1 - (this.timer - 1.9) / 0.7, 0, 1);
      R(0, 0, v.w, v.h, `rgba(10,6,20,${a.toFixed(2)})`);
    } else if (st === 'caught' && this.timer > 2.7 && this.round < this.rounds.length - 1) {
      R(0, 0, v.w, v.h, `rgba(10,6,20,${clamp((this.timer - 2.7) / 0.7, 0, 1).toFixed(2)})`);
    }
  }

  // A cama de partos vista de lado, com a Luísa deitada: o encosto levantado com a almofada, a
  // cabeça de perfil, a camisa do hospital, a barriga redonda e os joelhos levantados debaixo do
  // lençol, até aos pés. Atrás, o soro e o monitor; ao lado, a parteira, que durante o salto do
  // bebé agita os braços em pânico.
  drawBed(ctx, R, gy, st, t) {
    const busy = st === 'push', flying = st === 'fly';
    const push = busy ? Math.round(Math.abs(Math.sin(t * 9)) * 2) : 0;
    const bx = 6, T = gy - 30;                               // canto da cama e topo do colchão
    const SKIN = '#f6c9a0', SKIND = '#e0a888', HAIR = '#b07a45', HAIRD = '#8a5a30';
    const SHEET = '#a8dcf7', SHEETD = '#6fb0dc', SHEETL = '#dff3ff', GOWN = '#ffc6de', GOWND = '#e89ab8';
    const STEEL = '#8a93a7', STEELD = '#5a6478';
    const disc = (cx, cy, r, c, to = r) => { for (let dy = -r; dy < to; dy++) { const hw = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2)); R(cx - hw, cy + dy, 2 * hw, 1, c); } };

    // o soro e o monitor, atrás da cabeceira
    R(1, gy - 84, 2, 80, STEEL); R(0, gy - 84, 5, 2, STEEL); R(0, gy - 5, 8, 2, STEEL);
    R(4, gy - 81, 8, 12, INK); R(5, gy - 80, 6, 10, '#eaf8ff'); R(5, gy - 75, 6, 5, '#8fd0f5'); R(8, gy - 69, 1, 30, '#bfe9ff');
    R(12, gy - 94, 26, 18, INK); R(13, gy - 93, 24, 14, '#0f2a2a');
    for (let x = 0; x < 24; x++) { const ph = (x + Math.floor(t * (busy ? 40 : 18))) % 12; const d = ph === 5 ? -4 : ph === 6 ? 2 : 0; R(13 + x, gy - 86 + Math.min(0, d), 1, Math.abs(d) + 1, '#5cf08a'); }
    R(24, gy - 76, 2, 12, STEELD);

    // a parteira (desenhada antes da cama, para o colchão lhe tapar as pernas)
    const mx = 44, my = gy - 70, bob = busy ? Math.floor(t * 6) % 2 : 0;
    ctx.drawImage(this.midwife.stand.l, mx, my - bob, 32, 48);
    if (flying) {
      // em pânico: os braços no ar a abanar, e pontos de exclamação a piscar
      const a = Math.sin(t * 22);
      for (const [sx, dir] of [[mx + 7, -1], [mx + 25, 1]]) {
        for (let k = 0; k < 9; k++) {
          const x = sx + Math.round(dir * (2 + k * 0.8) + a * 2.5 * dir), y = my + 18 - k * 2;
          R(x - 1, y, 4, 2, INK); R(x, y, 2, 2, SKIN);
        }
      }
      if (Math.floor(t * 8) % 2) { R(mx + 12, my - 13, 2, 6, '#ff3b3b'); R(mx + 12, my - 5, 2, 2, '#ff3b3b'); R(mx + 18, my - 15, 2, 6, GOLD); R(mx + 18, my - 7, 2, 2, GOLD); }
    } else {
      // de toalha nas mãos, a ajudar
      R(mx + 10, my + 18 - bob, 12, 7, INK); R(mx + 11, my + 19 - bob, 10, 5, '#ffffff'); R(mx + 11, my + 21 - bob, 10, 1, '#ffd1e0');
    }

    // o encosto levantado (inclinado) e a almofada
    for (let i = 0; i < 30; i++) R(bx + 2 + Math.round(i * 0.45), T - 32 + i, 9, 1, INK);
    for (let i = 1; i < 29; i++) R(bx + 3 + Math.round(i * 0.45), T - 32 + i, 7, 1, i % 6 === 0 ? STEELD : STEEL);
    disc(bx + 17, T - 20, 9, INK); disc(bx + 17, T - 20, 8, '#ffffff'); R(bx + 11, T - 23, 6, 2, '#e8ecf4');

    // a Luísa, de perfil: o cabelo espalhado na almofada e a cara virada para cima
    disc(bx + 20, T - 18, 8, INK); disc(bx + 25, T - 16, 7, INK);
    disc(bx + 20, T - 18, 7, HAIR); R(bx + 8, T - 18, 10, 4, HAIR); R(bx + 7, T - 15, 9, 3, HAIR); R(bx + 10, T - 12, 8, 2, HAIRD);
    disc(bx + 25, T - 16, 6, SKIN);
    R(bx + 20, T - 23, 8, 3, HAIR); R(bx + 22, T - 21, 7, 2, HAIR);               // a franja
    R(bx + 24, T - 20, 4, 1, HAIRD);                                                 // a sobrancelha
    if (busy) {
      R(bx + 24, T - 18, 4, 1, INK); R(bx + 27, T - 13, 3, 3, '#7a1f2e');            // olhos fechados e boca aberta, a fazer força
      R(bx + 33, T - 23 - (Math.floor(t * 8) % 3), 2, 3, '#8fd0f5');                  // uma gota de esforço
    } else {
      R(bx + 24, T - 19, 3, 2, '#ffffff'); R(bx + 25, T - 19, 2, 2, '#55703f'); R(bx + 26, T - 13, 4, 1, '#c2544c');
    }
    R(bx + 29, T - 16, 1, 2, SKIND);                                                  // o nariz
    R(bx + 27, T - 15, 2, 1, '#f09a8c');                                              // a face corada

    // o pescoço, a camisa do hospital (às pintinhas) e o braço pousado em cima do lençol
    R(bx + 24, T - 11, 10, 4, SKIN);
    R(bx + 26, T - 10, 24, 11, INK); R(bx + 27, T - 9, 22, 9, GOWN);
    for (let k = 0; k < 6; k++) R(bx + 29 + k * 4, T - 7 + (k % 2) * 3, 1, 1, GOWND);
    R(bx + 30, T - 7, 20, 5, INK); R(bx + 31, T - 6, 18, 3, SKIN); R(bx + 47, T - 7, 5, 5, INK); R(bx + 48, T - 6, 3, 3, SKIN);

    // a barriga redonda, debaixo do lençol
    disc(bx + 58, T - 1, 13, INK, 0); disc(bx + 58, T - 1, 12, SHEET, 0); disc(bx + 54, T - 3, 6, SHEETL, 0);

    // os joelhos levantados (dois, um atrás do outro) e o lençol a descer até aos pés
    const kx = bx + 74, ky = T - 24 - push;
    const tent = (ox, oy, c, line) => {
      for (let y = 0; y <= 23 - oy; y++) {
        const l = Math.round(y * 0.8), r = Math.round(y * 0.6);
        R(kx + ox - l, ky + oy + y, l + r + 2, 1, c);
        if (line && y) { R(kx + ox - l, ky + oy + y, 1, 1, line); R(kx + ox + r + 1, ky + oy + y, 1, 1, line); }
      }
    };
    tent(-6, 3, INK); tent(-6, 3, SHEETD);                                   // o joelho de trás
    tent(0, 0, INK); tent(0, 0, SHEET, SHEETD);                              // o joelho da frente
    R(kx - 2, ky + 1, 4, 1, SHEETL); R(kx - 1, ky + 2, 2, 1, SHEETL);        // a luz no joelho
    R(bx + 86, T - 9, 8, 9, INK); R(bx + 87, T - 8, 6, 7, SHEET); R(bx + 88, T - 9, 2, 1, SHEET);   // os pés
    R(bx + 91, T - 7, 2, 1, SHEETD); R(bx + 91, T - 5, 2, 1, SHEETD);

    // o colchão, o lençol a cair sobre ele (com dobras), os pés da cama, o estrado e as rodas
    R(bx + 2, T, 96, 11, INK); R(bx + 3, T + 1, 94, 9, '#ffffff'); R(bx + 3, T + 7, 94, 3, '#d8dce6');
    R(bx + 44, T, 52, 7, SHEET); R(bx + 44, T + 6, 52, 1, SHEETD);
    for (let x = bx + 50; x < bx + 94; x += 9) R(x, T + 1, 1, 5, SHEETD);
    R(bx + 96, T - 18, 4, 30, INK); R(bx + 97, T - 17, 2, 28, STEEL);
    R(bx + 1, T + 11, 98, 4, STEELD); R(bx + 1, T + 11, 98, 1, STEEL);
    R(bx + 8, T + 15, 4, gy - T - 19, STEEL); R(bx + 88, T + 15, 4, gy - T - 19, STEEL);
    for (const wx of [bx + 6, bx + 86]) { R(wx, gy - 5, 8, 5, INK); R(wx + 2, gy - 4, 4, 3, '#4a4458'); }
    if (st === 'caught' || st === 'end') ctx.drawImage(this.spr.heart, bx + 20, T - 42 + Math.round(Math.sin(t * 4) * 2));
  }

  // Um bebé embrulhado numa mantinha; `spin` roda-o enquanto voa.
  drawBaby(R, x, y, blanket, spin) {
    const flip = spin === 1 || spin === 2 ? -1 : 1, up = spin >= 2 ? -1 : 1;
    const bx = (dx, w) => (flip > 0 ? x + dx : x - dx - w), by = (dy, h) => (up > 0 ? y + dy : y - dy - h);
    R(bx(-8, 16), by(-6, 13), 16, 13, INK);
    R(bx(-7, 9), by(-5, 11), 9, 11, blanket);
    R(bx(-7, 9), by(-5, 2), 9, 2, 'rgba(255,255,255,0.5)');
    R(bx(1, 6), by(-5, 9), 6, 9, '#f6c9a0');
    R(bx(1, 6), by(-5, 2), 6, 2, '#6b4a2e');
    R(bx(4, 1), by(-1, 2), 1, 2, INK);
    R(bx(3, 2), by(2, 1), 2, 1, '#f09a8c');
  }
}
