// Segunda parte do nível da Noruega: a aurora boreal.
// Uma luz atravessa o céu; seguindo-a com o dedo (ou com as setas), a aurora
// vai-se desenhando atrás dela. São três véus de cores diferentes e, no fim,
// tira-se a fotografia quando o céu está no seu máximo.
// Esta cena é chamada no fim do percurso de trenó (ver `then: 'aurora'` no ficheiro do nível).
import { LEVELS } from '../levels/index.js';
import { getCharacter, getSprites, drawCamp } from '../sprites.js';
import { hash, hills } from '../themes.js';
import { Particles } from '../fx.js';

const N = 110;            // pontos de cada véu
const T_VEIL = 11;        // segundos que a luz demora a atravessar o céu
const NEAR = 27;          // distância (px) a que conta como "a seguir a luz"
const VEILS = [
  { core: '120,255,170', top: '150,120,255' },   // verde com topo violeta
  { core: '255,120,200', top: '130,110,255' },   // rosa
  { core: '130,240,255', top: '120,255,170' },   // azul-turquesa
];
const INK = '#2b1d2e', GOLD = '#ffd166';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class AuroraScene {
  constructor(game, index, prev) {
    this.game = game;
    this.music = 'calm';   // a noite da aurora
    this.index = index;
    this.level = LEVELS[index];
    this.prev = prev || { got: 0, total: 0 };
    this.spr = getSprites();
    this.luisa = getCharacter('luisa', 'winter');
    this.sergio = getCharacter('sergio', 'winter');
    this.total = this.prev.total + VEILS.length + 1;
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'wait';       // wait → trace (x3, com pausas) → photo → end → done
    this.got = this.prev.got;
    this.k = 0;                // véu atual
    this.tau = 0;              // progresso da luz neste véu (0 a 1)
    this.near = 0;             // tempo passado junto à luz
    this.timer = 0;
    this.veils = VEILS.map(() => new Float32Array(N));
    this.rx = -100;
    this.ry = -100;
    this.shot = false;
    this.fx = new Particles();
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
    this.game.ui.setHint(this.level.auroraIntro);
    const v = this.game.view;
    this.rx = v.w / 2;
    this.ry = v.h * 0.4;
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state === 'end' || this.state === 'done') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  geo(v) {
    const horizon = Math.round(v.h * (v.portrait ? 0.7 : 0.72));
    return { horizon, x0: 12, x1: v.w - 12, top: 44, bot: horizon - 26 };
  }

  // Posição da luz do véu k no instante tau (0 a 1).
  path(k, tau, v) {
    const g = this.geo(v), mid = (g.top + g.bot) / 2, amp = ((g.bot - g.top) / 2) * 0.85;
    const dir = k % 2 === 0 ? tau : 1 - tau;
    return {
      x: g.x0 + (g.x1 - g.x0) * dir,
      y: mid + amp * (Math.sin(tau * Math.PI * 2 * (1.1 + k * 0.35) + k * 2.1) * 0.62 + Math.sin(tau * Math.PI * 2 * 2.4 + k) * 0.38),
    };
  }

  heart(x, y) {
    this.got++;
    this.game.ui.setHud(this.got, this.total, this.level.title);
    for (let i = 0; i < 5; i++) this.fx.heart(x - 12 + Math.random() * 24, y);
    this.game.audio.play('win');
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, v = this.game.view;

    // O "olhar": segue o dedo (um pouco acima, para não ficar tapado) ou as setas
    if (I.pointerX >= 0) {
      this.rx = I.pointerX * v.w;
      this.ry = I.pointerY * v.h - (I.touch ? 22 : 0);
    } else {
      this.rx += ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 150 * dt;
      this.ry += ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * 150 * dt;
    }
    this.rx = clamp(this.rx, 4, v.w - 4);
    this.ry = clamp(this.ry, 30, v.h - 30);

    this.timer += dt;
    if (this.state === 'wait') {
      if (this.timer > 4) { this.state = 'trace'; this.timer = 0; this.game.ui.setHint('Segue a luz!'); }
    } else if (this.state === 'trace') {
      this.tau += dt / T_VEIL;
      const p = this.path(this.k, Math.min(1, this.tau), v);
      if (Math.hypot(p.x - this.rx, p.y - this.ry) < NEAR) {
        this.near += dt;
        const i = Math.min(N - 1, Math.floor(this.tau * N));
        for (let j = Math.max(0, i - 2); j <= i; j++) this.veils[this.k][j] = Math.min(1, this.veils[this.k][j] + dt * 9);
        if (Math.random() < dt * 10) this.fx.add({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: -10, life: 0.5, color: '#ffffff' });
      }
      if (this.tau >= 1) {
        const good = this.near / T_VEIL >= 0.55;
        if (good) this.heart(v.w / 2, this.geo(v).top + 20);
        else this.game.audio.play('check');
        this.game.ui.setHint(good ? 'Que maravilha! O céu acendeu-se.' : 'Um véu tímido... mas é aurora!');
        this.k++;
        this.tau = 0;
        this.near = 0;
        this.timer = 0;
        this.state = this.k >= VEILS.length ? 'toPhoto' : 'pause';
      }
    } else if (this.state === 'pause') {
      if (this.timer > 1.6) { this.state = 'trace'; this.game.ui.setHint('Lá vem outra luz. Segue-a!'); }
    } else if (this.state === 'toPhoto') {
      if (this.timer > 1.8) {
        this.state = 'photo';
        this.timer = 0;
        this.game.ui.setHint('Momento perfeito! Toca para tirar a fotografia quando o céu estiver mais brilhante.');
      }
    } else if (this.state === 'photo') {
      if (I.actionPressed && this.timer > 0.6) {
        const b = this.brightness();
        this.shot = true;
        this.flash = 0.35;
        this.state = 'end';
        this.timer = 0;
        this.game.ui.setLevelMode(true, false);
        this.game.audio.play('pop');
        if (b > 0.78) { this.heart(v.w / 2, v.h * 0.4); this.game.ui.setHint('Fotografia perfeita! ' + this.level.auroraEnd); }
        else this.game.ui.setHint('Ficou um pouco escura, mas a memória é que conta. ' + this.level.auroraEnd);
      }
    } else if (this.state === 'end') {
      if (this.flash > 0) this.flash -= dt;
      if (Math.floor(this.timer * 5) !== Math.floor((this.timer - dt) * 5)) this.fx.heart(v.w / 2 - 20 + Math.random() * 40, this.geo(v).horizon - 30, Math.random() < 0.3 ? GOLD : '#ff5d8f');
      if (this.timer > 5) this.finish();
    }
  }

  // Brilho do céu durante a fotografia: pulsa devagar.
  brightness() { return 0.5 + 0.5 * Math.sin(this.t * 2.2); }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const g = this.geo(v), t = this.t;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

    // Céu do Ártico e estrelas
    const sky = ['#040818', '#07102e', '#0b1a44', '#102a55', '#17405f'];
    sky.forEach((c, i) => R(0, (i * g.horizon) / sky.length, v.w, g.horizon / sky.length + 1, c));
    for (let i = 0; i < 70; i++) {
      if (Math.sin(t * 2 + i * 1.7) < -0.7) continue;
      const x = hash(i + 4) * v.w, y = hash(i * 3.1 + 4) * g.horizon * 0.9;
      R(x, y, 1, 1, '#ffffff');
      if (hash(i * 7.7) > 0.85) { R(x - 1, y, 3, 1, '#ffffff'); R(x, y - 1, 1, 3, '#ffffff'); }
    }

    // A aurora: cortinas de luz ao longo do caminho que foi seguido
    const boost = this.state === 'photo' ? 0.55 + 0.45 * this.brightness() : this.shot ? 1 : 0.85;
    let glow = 0;
    this.veils.forEach((veil, k) => {
      const col = VEILS[k];
      for (let i = 0; i < N; i++) {
        const s = veil[i];
        if (s < 0.03) continue;
        glow += s;
        const p = this.path(k, i / N, v);
        const wave = Math.sin(t * 1.6 + i * 0.33 + k) * 4;
        const hgt = Math.round(22 + 11 * Math.sin(i * 0.21 + t * 0.9 + k * 2));
        const a = s * boost;
        R(p.x - 2, p.y - hgt * 2 + wave, 5, hgt, `rgba(${col.top},${(a * 0.28).toFixed(2)})`);
        R(p.x - 2, p.y - hgt + wave, 5, hgt, `rgba(${col.core},${(a * 0.5).toFixed(2)})`);
        R(p.x - 2, p.y - 3 + wave, 5, 4, `rgba(${col.core},${(a * 0.9).toFixed(2)})`);
      }
    });

    // Montanhas nevadas e o chão de neve (que reflete um pouco a aurora)
    hills(ctx, v.w, v.h, g.horizon, 0, 0, 26, 12, '#8fa8cc', 3);
    hills(ctx, v.w, v.h, g.horizon, 40, 1, 10, 8, '#c8d8ee', 7);
    R(0, g.horizon, v.w, v.h - g.horizon, '#dfe9f7');
    R(0, g.horizon, v.w, 2, '#ffffff');
    for (let i = 0; i < 40; i++) R(hash(i * 2.3) * v.w, g.horizon + 6 + hash(i * 5.1) * (v.h - g.horizon - 8), 2, 1, '#b8cfe6');
    const tint = clamp(glow / (N * 2), 0, 1) * boost;
    if (tint > 0.02) R(0, g.horizon, v.w, v.h - g.horizon, `rgba(120,255,190,${(tint * 0.22).toFixed(2)})`);

    // Acampamento e o casal, a olhar para o céu
    const cx = Math.round(v.w / 2), gy = g.horizon + Math.round((v.h - g.horizon) * 0.45);
    drawCamp(ctx, Math.round(v.w * 0.2), gy, t);
    const hop = this.state === 'end' ? Math.round(Math.abs(Math.sin(t * 5)) * 2) : 0;
    ctx.drawImage(this.luisa.stand.r, cx - 28, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand.l, cx - 4, gy - 48 - hop, 32, 48);

    // A luz a seguir, o caminho que ela vai fazer e o "olhar" do jogador
    if (this.state === 'trace') {
      for (let j = 1; j <= 9; j++) {
        const q = this.path(this.k, Math.min(1, this.tau + j * 0.012), v);
        R(q.x, q.y, 1, 1, 'rgba(255,255,255,0.5)');
      }
      const p = this.path(this.k, Math.min(1, this.tau), v);
      const pulse = Math.floor(t * 8) % 2;
      R(p.x - 5 - pulse, p.y - 1, 11 + pulse * 2, 3, 'rgba(255,255,255,0.55)');
      R(p.x - 1, p.y - 5 - pulse, 3, 11 + pulse * 2, 'rgba(255,255,255,0.55)');
      R(p.x - 2, p.y - 2, 5, 5, '#ffffff');
    }
    if (this.state === 'trace' || this.state === 'pause' || this.state === 'wait') {
      const on = this.state === 'trace' && Math.hypot(this.path(this.k, Math.min(1, this.tau), v).x - this.rx, this.path(this.k, Math.min(1, this.tau), v).y - this.ry) < NEAR;
      const c = on ? GOLD : 'rgba(255,255,255,0.7)';
      R(this.rx - 9, this.ry - 9, 5, 1, c); R(this.rx - 9, this.ry - 9, 1, 5, c);
      R(this.rx + 5, this.ry - 9, 5, 1, c); R(this.rx + 9, this.ry - 9, 1, 5, c);
      R(this.rx - 9, this.ry + 9, 5, 1, c); R(this.rx - 9, this.ry + 5, 1, 5, c);
      R(this.rx + 5, this.ry + 9, 5, 1, c); R(this.rx + 9, this.ry + 5, 1, 5, c);
    }

    // Fotografia: indicador de brilho e, depois, a polaroid
    if (this.state === 'photo') {
      const b = this.brightness(), bw = Math.min(120, v.w - 60), bx = Math.round((v.w - bw) / 2), by = g.horizon - 12;
      R(bx - 1, by - 1, bw + 2, 6, INK);
      R(bx, by, bw, 4, '#3a3046');
      R(bx + Math.round(bw * 0.78), by, bw - Math.round(bw * 0.78), 4, 'rgba(92,240,138,0.5)');
      R(bx + Math.round((bw - 3) * b), by - 2, 3, 8, GOLD);
    }
    if (this.shot) {
      const px = v.w - 62, py = 40 - Math.round(Math.max(0, 0.5 - this.timer) * 80);
      R(px - 2, py - 2, 54, 62, INK);
      R(px, py, 50, 58, '#fff6e6');
      R(px + 4, py + 4, 42, 40, '#07102e');
      for (let i = 0; i < 9; i++) { R(px + 6 + i * 4, py + 10 + ((i * 5) % 9), 4, 12, 'rgba(120,255,170,0.7)'); R(px + 6 + i * 4, py + 6 + ((i * 5) % 9), 4, 5, 'rgba(150,120,255,0.6)'); }
      R(px + 4, py + 36, 42, 8, '#dfe9f7');
      R(px + 20, py + 30, 4, 8, '#d43d51');
      R(px + 26, py + 29, 4, 9, '#3d5aa8');
      R(px + 20, py + 28, 4, 3, '#f6c9a0');
      R(px + 26, py + 27, 4, 3, '#f6c9a0');
      ctx.drawImage(this.spr.heart, px + 21, py + 47);
    }
    if (this.flash > 0) R(0, 0, v.w, v.h, `rgba(255,255,255,${(this.flash * 2.4).toFixed(2)})`);

    this.fx.draw(ctx);
  }
}
