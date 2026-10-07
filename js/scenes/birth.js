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
    const x0 = 100, x1 = v.w - 18;       // por onde o Sérgio pode andar
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
        this.launch(v, 76, g.gy - 54, r.toddler ? 1.9 : 2.2);
        this.fx.burst(78, g.gy - 52, 14, ['#ffffff', GOLD, r.blanket], 70);
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

    // O suporte do soro, à cabeceira
    R(1, gy - 82, 2, 78, '#8a93a7'); R(0, gy - 82, 5, 2, '#8a93a7'); R(0, gy - 5, 8, 2, '#8a93a7');
    R(5, gy - 79, 8, 12, '#eaf8ff'); R(5, gy - 73, 8, 6, '#8fd0f5'); R(8, gy - 67, 1, 26, '#bfe9ff');

    // A parteira, de pé ao lado da cama (atrás, para a cama lhe tapar as pernas), com uma toalha
    // nas mãos, a ajudar
    const busy = st === 'push', bob = busy ? Math.floor(t * 6) % 2 : 0;
    ctx.drawImage(this.midwife.stand.l, 40, gy - 70 - bob, 32, 48);
    R(50, gy - 52 - bob, 12, 7, INK); R(51, gy - 51 - bob, 10, 5, '#ffffff'); R(51, gy - 49 - bob, 10, 1, '#ffd1e0');

    // A cama de partos: cabeceira alta, colchão com almofada, grades e rodas
    const bx = 6, bw = 90, top = gy - 34;
    R(bx, gy - 58, 7, 36, INK); R(bx + 1, gy - 57, 5, 34, '#8a93a7'); R(bx + 2, gy - 56, 3, 32, '#b8c4d6');   // cabeceira
    R(bx + bw - 3, gy - 46, 5, 24, INK); R(bx + bw - 2, gy - 45, 3, 22, '#8a93a7');                            // pés da cama
    R(bx + 5, top, bw - 8, 12, INK); R(bx + 6, top + 1, bw - 10, 10, '#ffffff'); R(bx + 6, top + 8, bw - 10, 3, '#d8dce6');   // colchão
    R(bx + 7, top - 6, 24, 9, INK); R(bx + 8, top - 5, 22, 7, '#ffffff');                                       // almofada
    R(bx + 5, gy - 22, bw - 8, 3, '#6a7480');                                                                     // estrado
    R(bx + 9, gy - 19, 4, 15, '#8a93a7'); R(bx + bw - 13, gy - 19, 4, 15, '#8a93a7');                            // pernas
    for (const wx of [bx + 7, bx + bw - 15]) { R(wx, gy - 5, 8, 5, INK); R(wx + 2, gy - 4, 4, 3, '#4a4458'); }   // rodas

    // A Luísa deitada: a cabeça na almofada e o corpo debaixo do lençol azul, com os joelhos levantados
    const push = busy ? Math.round(Math.abs(Math.sin(t * 9)) * 2) : 0;
    ctx.drawImage(this.luisa.stand.r, 2, 3, 12, 11, bx + 9, top - 26 + push, 24, 22);
    R(bx + 30, top - 7, 34, 9, '#a8dcf7'); R(bx + 30, top - 7, 34, 2, '#cfeeff');                     // o tronco
    R(bx + 60, top - 21 - push, 20, 23, '#a8dcf7'); R(bx + 60, top - 21 - push, 20, 2, '#cfeeff');   // os joelhos
    R(bx + 56, top - 15 - push, 4, 17, '#8fc8e8'); R(bx + 80, top - 12, 5, 14, '#8fc8e8');          // o lençol a cair
    if (busy) {           // gotas de esforço
      R(bx + 34, top - 30 - (Math.floor(t * 8) % 4), 2, 3, '#8fd0f5');
      R(bx + 26, top - 34 + (Math.floor(t * 8 + 2) % 4), 2, 3, '#8fd0f5');
    } else if (st === 'caught' || st === 'end') ctx.drawImage(this.spr.heart, bx + 14, top - 44 + Math.round(Math.sin(t * 4) * 2));

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
    else if (st === 'caught' && this.nurse) this.drawBaby(R, 56, gy - 56, r.blanket, 0);   // nos braços da parteira
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
