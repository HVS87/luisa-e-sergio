// Nível do pedido de casamento, no Natal.
// 1. A Luísa abre os presentes: um jogo de memória em que cada par é uma recordação
//    dos níveis anteriores (tocar num presente, ou setas + Espaço).
// 2. Falta um presente... que brilha na árvore, onde o Sérgio o escondeu: é o colar.
// 3. O Sérgio ajoelha-se e faz o pedido; toca-se para a Luísa responder que sim.
import { LEVELS } from '../levels/index.js';
import { getCharacter, getSprites } from '../sprites.js';
import { hash } from '../themes.js';
import { Particles } from '../fx.js';

const INK = '#2b1d2e', GOLD = '#ffd166', CREAM = '#fff6e6', PINK = '#ff5d8f';
const WRAPS = [['#c2384a', '#ffd166'], ['#2f7a45', '#ffffff'], ['#3d6fb5', '#ffd166'], ['#e8c060', '#c2384a'], ['#7a4a9a', '#ffffff']];

export class ProposalScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.spr = getSprites();
    this.luisa = getCharacter('luisa', 'xmas');
    this.sergio = getCharacter('sergio', 'xmas');
    this.total = this.level.memories.length + 1;
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    // Baralha os presentes: dois de cada recordação
    const kinds = this.level.memories.map((m, i) => i);
    const deck = [...kinds, ...kinds].sort(() => Math.random() - 0.5);
    this.cards = deck.map((kind, i) => ({ kind, up: false, gone: false, seen: 0, wrap: WRAPS[i % WRAPS.length] }));
    this.state = 'intro';      // intro → memory → tree → open → ask → yes → done
    this.got = 0;
    this.picked = [];
    this.wait = 0;
    this.cursor = 0;
    this.pairs = 0;
    this.timer = 0;
    this.hintT = 0;
    this.fx = new Particles();
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.state = 'memory';
    this.timer = 0;
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.base(this.level.memoryHint);
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'intro' || this.state === 'yes' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  base(text) { this.baseHint = text; this.hintT = 0; this.game.ui.setHint(text); }
  say(text, secs) { this.game.ui.setHint(text); this.hintT = secs; }

  // Onde fica cada coisa no ecrã (depende do tamanho e da orientação).
  layout(v) {
    // em paisagem, duas filas; ao alto, quatro ou seis colunas (conforme o número de presentes)
    const n = this.cards.length, cols = v.portrait ? (n % 4 === 0 && n <= 16 ? 4 : 6) : n / 2, rows = Math.ceil(n / cols);
    const cs = Math.min(v.portrait ? 34 : 30, Math.floor((v.w - 10) / cols) - 4);
    const gw = cols * (cs + 4) - 4, gh = rows * (cs + 4) - 4;
    const gx = Math.round((v.w - gw) / 2);
    const gy = v.portrait ? Math.round(v.h * 0.44) : v.h - gh - 8;
    const floor = gy - (v.portrait ? 16 : 8);
    const cx = Math.round(v.w / 2);
    return { cols, rows, cs, gx, gy, gw, gh, floor, cx, treeX: cx - 74, boxX: cx - 62, boxY: floor - 38 };
  }

  cardAt(L, px, py) {
    const c = Math.floor((px - L.gx + 2) / (L.cs + 4)), r = Math.floor((py - L.gy + 2) / (L.cs + 4));
    const i = r * L.cols + c;
    return c < 0 || r < 0 || c >= L.cols || r >= L.rows || i >= this.cards.length ? -1 : i;
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, v = this.game.view, L = this.layout(v);
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) this.game.ui.setHint(this.baseHint);
    }
    this.timer += dt;
    const tapX = I.pointerX >= 0 ? I.pointerX * v.w : -1, tapY = I.pointerY * v.h;
    const left = I.left && !this.pl, right = I.right && !this.pr, up = I.up && !this.pu, down = I.down && !this.pd;
    this.pl = I.left; this.pr = I.right; this.pu = I.up; this.pd = I.down;

    if (this.state === 'memory') {
      // cursor do teclado
      const n = this.cards.length;
      if (left) this.cursor = (this.cursor + n - 1) % n;
      if (right) this.cursor = (this.cursor + 1) % n;
      if (up) this.cursor = (this.cursor + n - L.cols) % n;
      if (down) this.cursor = (this.cursor + L.cols) % n;

      if (this.wait > 0) {
        this.wait -= dt;
        if (this.wait <= 0) this.resolve(L);
      } else if (I.actionPressed && this.timer > 0.25) {
        const i = tapX >= 0 ? this.cardAt(L, tapX, tapY) : this.cursor;
        if (i >= 0) { this.cursor = i; this.flip(i); }
      }
    } else if (this.state === 'tree') {
      const near = tapX >= 0 ? Math.hypot(tapX - L.boxX, tapY - L.boxY) < 30 : true;
      if (I.actionPressed && this.timer > 0.8 && near) {
        this.state = 'open';
        this.timer = 0;
        this.game.audio.play('pop');
        this.fx.burst(L.boxX, L.boxY, 16, [GOLD, '#ffffff', PINK], 70);
        this.base('Uma caixinha escondida entre os ramos... com um colar lá dentro!');
      } else if (I.actionPressed && this.timer > 0.8) this.say('Procura melhor... há qualquer coisa a brilhar na árvore!', 2);
    } else if (this.state === 'open') {
      if (this.timer > 3) {
        this.state = 'ask';
        this.timer = 0;
        this.game.audio.play('check');
        this.base(this.level.question);
      }
    } else if (this.state === 'ask') {
      if (I.actionPressed && this.timer > 1.2) {
        this.state = 'yes';
        this.timer = 0;
        this.got++;
        this.game.ui.setHud(this.got, this.total, this.level.title);
        this.game.ui.setLevelMode(true, false);
        this.game.audio.play('fanfare');
        this.base(this.level.answer);
      }
    } else if (this.state === 'yes') {
      if (Math.floor(this.timer * 9) !== Math.floor((this.timer - dt) * 9)) {
        this.fx.heart(L.cx - 40 + Math.random() * 80, L.floor - 30 - Math.random() * 30, Math.random() < 0.3 ? GOLD : PINK);
        this.fx.add({ x: Math.random() * v.w, y: -4, vx: (Math.random() - 0.5) * 20, vy: 40 + Math.random() * 30, life: 3, color: [GOLD, PINK, '#7be0b0', '#6fb0f0', '#ffffff'][Math.floor(Math.random() * 5)], size: 2 });
      }
      if (this.timer > 5.5) this.finish();
    }
  }

  flip(i) {
    const c = this.cards[i];
    if (c.gone || c.up || this.picked.length >= 2) return;
    c.up = true;
    c.seen++;
    this.picked.push(i);
    this.game.audio.play('click');
    if (this.picked.length === 2) {
      const [a, b] = this.picked.map((k) => this.cards[k]);
      this.wait = a.kind === b.kind ? 0.55 : 1;
    }
  }

  resolve(L) {
    const [ia, ib] = this.picked, a = this.cards[ia], b = this.cards[ib];
    this.picked = [];
    if (a.kind !== b.kind) {
      a.up = b.up = false;
      this.game.audio.play('hurt');
      return;
    }
    a.gone = b.gone = true;
    this.pairs++;
    const mem = this.level.memories[a.kind];
    // boa memória: o par foi encontrado sem andar a virar os mesmos presentes vezes sem conta
    const clean = a.seen <= 2 && b.seen <= 2;
    if (clean) {
      this.got++;
      this.game.ui.setHud(this.got, this.total, this.level.title);
      this.game.audio.play('heart');
      this.fx.heart(L.gx + (ia % L.cols) * (L.cs + 4) + L.cs / 2, L.gy + Math.floor(ia / L.cols) * (L.cs + 4));
    } else this.game.audio.play('check');
    this.say(mem.text, 3.2);
    if (this.pairs >= this.level.memories.length) {
      this.state = 'tree';
      this.timer = 0;
      this.baseHint = this.level.treeHint;
    } else if (this.pairs === Math.ceil(this.level.memories.length / 2)) this.baseHint = this.level.nervous;
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const L = this.layout(v), t = this.t;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const after = ['open', 'ask', 'yes', 'done'].includes(this.state);

    // Sala: parede, janela com neve, lareira e chão de madeira com tapete
    R(0, 0, v.w, L.floor, '#6a3f55');
    for (let y = L.floor - 30, row = 0; y > -10; y -= 12, row++) for (let x = (row % 2) * 9 - 9; x < v.w; x += 18) R(x, y, 2, 2, '#7d4f68');
    R(0, L.floor - 18, v.w, 18, '#4a2a35');
    R(0, L.floor - 18, v.w, 2, '#5f3948');
    R(0, L.floor, v.w, v.h - L.floor, '#8a5a3c');
    for (let y = L.floor, row = 0; y < v.h; y += 10, row++) { R(0, y, v.w, 1, '#75492f'); for (let x = (row % 2) * 22 - 22; x < v.w; x += 44) R(x, y, 1, 10, '#75492f'); }
    R(L.gx - 8, L.gy - 6, L.gw + 16, L.gh + 12, '#7a2338');
    R(L.gx - 6, L.gy - 4, L.gw + 12, L.gh + 8, '#a8324a');
    R(L.gx - 6, L.gy - 4, L.gw + 12, 1, GOLD);
    R(L.gx - 6, L.gy + L.gh + 3, L.gw + 12, 1, GOLD);

    // janela
    const wx = L.cx - 16, wy = Math.max(26, L.floor - 92);
    R(wx - 2, wy - 2, 36, 32, '#e8d9b8');
    R(wx, wy, 32, 28, '#141a45');
    for (let i = 0; i < 9; i++) R(wx + ((i * 11 + Math.floor(t * 6 + i * 3)) % 30), wy + ((i * 7 + Math.floor(t * (9 + i))) % 26), 1, 1, '#ffffff');
    R(wx + 15, wy, 2, 28, '#e8d9b8');
    R(wx, wy + 13, 32, 2, '#e8d9b8');
    R(wx - 2, wy + 26, 36, 3, '#ffffff');

    // lareira com meias penduradas
    const fx0 = L.cx + 56, fy0 = L.floor;
    R(fx0 - 2, fy0 - 46, 48, 46, INK);
    R(fx0, fy0 - 44, 44, 44, '#9a968e');
    R(fx0 - 4, fy0 - 48, 52, 5, '#6a4424');
    R(fx0 + 7, fy0 - 30, 30, 30, '#1c1410');
    const fl = Math.floor(t * 9) % 2;
    R(fx0 + 11, fy0 - 12 - fl, 22, 12 + fl, '#ff8a4b');
    R(fx0 + 16, fy0 - 17 + fl, 12, 12, GOLD);
    R(fx0 + 9, fy0 - 3, 26, 3, '#5a3524');
    for (const [k, col] of [[4, '#c2384a'], [20, '#2f7a45'], [36, '#c2384a']]) { R(fx0 + k, fy0 - 43, 5, 9, col); R(fx0 + k, fy0 - 36, 8, 4, col); R(fx0 + k, fy0 - 43, 5, 2, '#ffffff'); }

    this.drawTree(R, L, t, after);

    // A Luísa e o Sérgio
    const lx = L.cx - 34, sx = L.cx + 4, py = L.floor - 48;
    const kneel = this.state === 'ask' || (this.state === 'yes' && this.timer < 1.2);
    const hug = this.state === 'yes' && this.timer >= 1.2 || this.state === 'done';
    const joy = hug ? Math.round(Math.abs(Math.sin(t * 5)) * 3) : 0;
    ctx.drawImage(this.luisa.stand.r, lx + (hug ? 6 : 0), py - joy, 32, 48);
    if (kneel) {
      const img = this.sergio.kneel.l;
      ctx.drawImage(img, sx, L.floor - img.height * 2, 32, img.height * 2);
      // a caixinha aberta, com o colar
      R(sx - 6, L.floor - 34, 10, 7, INK);
      R(sx - 5, L.floor - 33, 8, 5, '#3d6fb5');
      R(sx - 3, L.floor - 36 + Math.round(Math.sin(t * 6)), 4, 3, GOLD);
    } else {
      const nervous = this.state === 'memory' || this.state === 'tree' ? Math.round(Math.sin(t * 22) * (this.pairs / 8)) : 0;
      ctx.drawImage(this.sergio.stand.l, sx + nervous - (hug ? 6 : 0), py - joy, 32, 48);
      if ((this.state === 'memory' || this.state === 'tree') && this.pairs >= 3) {   // gota de suor
        const dy = Math.floor(t * 5) % 5;
        R(sx + 26, py + 8 + dy, 2, 2, '#8fd0f5');
        R(sx + 25, py + 10 + dy, 4, 3, '#8fd0f5');
      }
    }
    // o colar ao pescoço, depois do sim
    if (hug) { R(lx + 6 + 18, py - joy + 28, 6, 1, GOLD); R(lx + 6 + 20, py - joy + 29, 2, 2, '#6fd0ff'); }

    // Presentes do jogo de memória
    if (!after) this.drawCards(ctx, R, L, t);

    // O colar em grande, quando sai da caixa
    if (this.state === 'open' || this.state === 'ask') this.drawNecklace(R, L.cx, Math.max(40, L.floor - 92) + Math.round(Math.sin(t * 3) * 2), t);

    this.fx.draw(ctx);
  }

  drawTree(R, L, t, after) {
    const x = L.treeX, y = L.floor;
    R(x - 3, y - 8, 6, 8, '#6a4424');
    R(x - 9, y - 3, 18, 3, '#c2384a');
    const tiers = [[26, 12], [21, 26], [16, 40], [10, 52]];
    for (const [half, up] of tiers) {
      for (let k = 0; k < 16; k++) {
        const w = Math.max(2, Math.round(half * (1 - k / 17)));
        R(x - w, y - up - k, w * 2, 1, k < 2 ? '#1f5a30' : '#2f7a40');
      }
      R(x - half + 3, y - up - 3, 5, 1, '#4f9a55');
    }
    // luzes e bolas
    const cols = ['#ff5d8f', GOLD, '#6fb0f0', '#ffffff', '#ff8a4b'];
    for (let i = 0; i < 16; i++) {
      const up = 14 + Math.floor(hash(i * 2.3) * 48), half = Math.max(2, 24 - up * 0.36);
      const ox = Math.round((hash(i * 5.1) * 2 - 1) * half);
      const lit = Math.sin(t * 3 + i * 1.9) > -0.2;
      R(x + ox, y - up, 2, 2, lit ? cols[i % 5] : '#256a36');
    }
    // estrela
    R(x - 1, y - 74, 3, 7, GOLD);
    R(x - 3, y - 72, 7, 3, GOLD);
    R(x, y - 71, 1, 1, '#ffffff');
    // os outros presentes, junto ao tronco
    R(x - 22, y - 9, 10, 9, '#3d6fb5'); R(x - 18, y - 9, 2, 9, GOLD);
    R(x + 10, y - 7, 12, 7, '#2f7a45'); R(x + 15, y - 7, 2, 7, '#ffffff');
    // a caixinha escondida entre os ramos: um brilho discreto que cresce quando os presentes acabam
    if (!after) {
      const big = this.state === 'tree';
      const s = Math.floor(t * (big ? 8 : 2)) % (big ? 2 : 6) === 0;
      R(L.boxX - 3, L.boxY - 2, 6, 5, '#3d6fb5');
      R(L.boxX - 3, L.boxY, 6, 1, GOLD);
      if (s) { R(L.boxX - 1, L.boxY - 7, 2, 12, '#ffffff'); R(L.boxX - 6, L.boxY - 1, 12, 2, '#ffffff'); }
      if (big) { R(L.boxX - 9, L.boxY - 8, 18, 1, GOLD); R(L.boxX - 9, L.boxY + 7, 18, 1, GOLD); R(L.boxX - 9, L.boxY - 8, 1, 16, GOLD); R(L.boxX + 8, L.boxY - 8, 1, 16, GOLD); }
    }
  }

  drawCards(ctx, R, L, t) {
    this.cards.forEach((c, i) => {
      if (c.gone) return;
      const x = L.gx + (i % L.cols) * (L.cs + 4), y = L.gy + Math.floor(i / L.cols) * (L.cs + 4), s = L.cs;
      if (i === this.cursor && !this.game.input.touch && this.state === 'memory') R(x - 2, y - 2, s + 4, s + 4, GOLD);
      R(x, y, s, s, INK);
      if (c.up) {
        R(x + 1, y + 1, s - 2, s - 2, CREAM);
        R(x + 1, y + s - 5, s - 2, 4, '#e8d9b8');
        this.icon(ctx, R, this.level.memories[c.kind].icon, x + Math.floor(s / 2) - 7, y + Math.floor(s / 2) - 8, t);
      } else {
        const [wrap, ribbon] = c.wrap;
        R(x + 1, y + 1, s - 2, s - 2, wrap);
        R(x + 1, y + s - 6, s - 2, 5, 'rgba(0,0,0,0.18)');
        R(x + Math.floor(s / 2) - 2, y + 1, 4, s - 2, ribbon);
        R(x + 1, y + Math.floor(s / 2) - 2, s - 2, 4, ribbon);
        R(x + Math.floor(s / 2) - 5, y - 1, 4, 4, ribbon);
        R(x + Math.floor(s / 2) + 1, y - 1, 4, 4, ribbon);
      }
    });
  }

  // Recordações dos níveis anteriores (cerca de 14x14).
  icon(ctx, R, kind, x, y, t) {
    if (kind === 'osso') { R(x + 2, y + 6, 10, 3, '#b9a67e'); R(x, y + 4, 4, 7, '#b9a67e'); R(x + 10, y + 4, 4, 7, '#b9a67e'); R(x + 3, y + 6, 8, 1, '#e8dcc0'); }
    else if (kind === 'vinho') { R(x + 3, y + 1, 8, 7, '#cfe6f0'); R(x + 4, y + 3, 6, 4, '#8a1f3d'); R(x + 6, y + 8, 2, 5, '#cfe6f0'); R(x + 3, y + 13, 8, 1, '#cfe6f0'); }
    else if (kind === 'banana') { R(x + 1, y + 9, 8, 3, '#ffd84a'); R(x + 7, y + 6, 4, 4, '#ffd84a'); R(x + 10, y + 2, 2, 5, '#ffd84a'); R(x, y + 8, 2, 3, INK); R(x + 10, y + 1, 2, 2, INK); R(x + 2, y + 11, 6, 1, '#f0a93e'); }
    else if (kind === 'bicicleta') {
      for (const wx of [x, x + 8]) { R(wx + 1, y + 6, 4, 1, INK); R(wx + 1, y + 11, 4, 1, INK); R(wx, y + 7, 1, 4, INK); R(wx + 5, y + 7, 1, 4, INK); }
      R(x + 3, y + 8, 5, 1, PINK); R(x + 7, y + 4, 1, 5, PINK); R(x + 5, y + 4, 4, 1, INK); R(x + 10, y + 3, 1, 6, PINK); R(x + 9, y + 3, 4, 1, INK);
    }
    else if (kind === 'buxo') { R(x + 6, y + 11, 2, 3, '#6a4a2a'); R(x + 2, y + 6, 10, 6, '#2f7a40'); R(x + 4, y + 2, 6, 4, '#2f7a40'); R(x + 6, y, 2, 2, '#2f7a40'); R(x + 4, y + 3, 2, 6, '#4f9a55'); }
    else if (kind === 'bola') { R(x + 1, y + 4, 12, 7, INK); R(x + 2, y + 5, 10, 5, '#e0a040'); R(x + 3, y + 5, 7, 1, '#ffe0a0'); R(x + 5, y + 7, 2, 1, '#a8324a'); R(x + 8, y + 8, 2, 1, '#a8324a'); }
    else if (kind === 'binoculos') { R(x + 1, y + 4, 5, 9, INK); R(x + 8, y + 4, 5, 9, INK); R(x + 2, y + 5, 3, 7, '#5a6a7a'); R(x + 9, y + 5, 3, 7, '#5a6a7a'); R(x + 5, y + 6, 4, 3, INK); R(x + 2, y + 11, 3, 1, '#9fd3e8'); R(x + 9, y + 11, 3, 1, '#9fd3e8'); R(x + 2, y + 2, 2, 2, INK); R(x + 10, y + 2, 2, 2, INK); }
    else if (kind === 'mascara') { R(x + 2, y + 4, 10, 7, '#8fd0f5'); R(x + 2, y + 6, 10, 1, '#ffffff'); R(x + 2, y + 8, 10, 1, '#ffffff'); R(x, y + 5, 2, 1, '#ffffff'); R(x + 12, y + 5, 2, 1, '#ffffff'); R(x, y + 9, 2, 1, '#ffffff'); R(x + 12, y + 9, 2, 1, '#ffffff'); }
    else if (kind === 'aurora') {
      R(x, y, 14, 14, '#07102e');
      for (let k = 0; k < 7; k++) { const h = 4 + ((k * 5) % 4); R(x + k * 2, y + 8 - h + Math.round(Math.sin(t * 3 + k)), 2, h, 'rgba(120,255,170,0.85)'); R(x + k * 2, y + 5 - h, 2, 3, 'rgba(150,120,255,0.7)'); }
      R(x, y + 11, 14, 3, '#dfe9f7');
    }
  }

  drawNecklace(R, cx, y, t) {
    // fundo de veludo, para o colar se ver bem
    R(cx - 23, y - 8, 46, 38, INK);
    R(cx - 21, y - 6, 42, 34, '#3a2a5e');
    R(cx - 21, y - 6, 42, 1, GOLD);
    R(cx - 21, y + 27, 42, 1, GOLD);
    // corrente em arco e pendente
    for (let i = -14; i <= 14; i += 2) {
      const dy = Math.round((1 - (i * i) / 196) * 14);
      R(cx + i, y + dy, 2, 2, i % 4 ? GOLD : '#fff3c4');
    }
    R(cx - 4, y + 15, 8, 6, INK);
    R(cx - 3, y + 16, 6, 4, '#6fd0ff');
    R(cx - 2, y + 20, 4, 2, '#3d8fe0');
    R(cx - 1, y + 22, 2, 1, '#3d8fe0');
    R(cx - 2, y + 16, 2, 1, '#ffffff');
    const s = Math.floor(t * 6) % 3;
    R(cx - 12 - s, y + 6, 2, 2, '#ffffff');
    R(cx + 12 + s, y + 12, 2, 2, '#ffffff');
    R(cx + 6, y - 3 - s, 2, 2, '#ffffff');
  }
}
