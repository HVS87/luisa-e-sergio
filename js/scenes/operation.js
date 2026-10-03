// Minijogo "Operação": o Sérgio retira ossos ao doente com serrote e martelo;
// quando falha, o doente acorda aos saltos e a Luísa tem de lhe dar mais anestesia.
//
// Controlo único (tocar no ecrã, clicar, Espaço ou Enter):
//  - Sérgio: carregar quando o marcador passa na zona verde do osso (3 vezes por osso);
//  - Luísa:  manter premido para encher a seringa e largar dentro da zona verde.
import { LEVELS } from '../levels/index.js';
import { getCharacter } from '../sprites.js';
import { Particles } from '../fx.js';

// O cenário é desenhado num "palco" de 240x146 píxeis, centrado no ecrã.
const SW = 240, SH = 146, FLOOR = 96;
const TRACK0 = 30, TRACK1 = 210, TRACK = TRACK1 - TRACK0, PCY = 126;   // painel de raio-X
const HITS = 3;            // golpes certeiros necessários por osso
const FILL_RATE = 0.48;    // velocidade a que a seringa enche (por segundo)

// Onde fica a "janela" de cada osso no corpo do doente: [x, y, largura, altura, é num membro que esperneia?]
const SLOTS = {
  umero: [70, 69, 20, 8, true],
  costela: [95, 61, 16, 8, false],
  femur: [126, 70, 24, 8, false],
  rotula: [156, 68, 10, 10, true],
  tibia: [169, 71, 20, 8, true],
};

const C = {
  ink: '#2b1d2e', skin: '#f2c7a5', skinD: '#d9a585', hair: '#6b4a2e',
  gown: '#9fd8e8', gownD: '#7fbdd0', bone: '#fff6e6', boneD: '#d9cdb8', cavity: '#a02c3c',
  steel: '#d8dce6', steelD: '#8a93a7', wood: '#c98f52', woodD: '#8a5a34',
  green: '#5cf08a', gold: '#ffd166', red: '#ff3b3b',
};

const mod = (a, n) => ((a % n) + n) % n;

export class OperationScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.bones = this.level.bones;
    this.luisa = getCharacter('luisa', 'scrubs');
    this.sergio = getCharacter('sergio', 'scrubs');
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  enter() {
    this.game.ui.showStory(this.index);
  }

  exit() {
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
  }

  setup() {
    this.state = 'intro';   // intro → cut ⇄ (pain → anes ⇄ anesFail → calm) → removed → ... → won → done
    this.i = 0;             // osso atual
    this.got = 0;           // ossos retirados sem falhar (corações)
    this.timer = 0;
    this.lock = 0;          // pequeno intervalo em que os toques são ignorados
    this.anim = 0;          // animação da ferramenta depois de um golpe certeiro
    this.fill = 0;
    this.holding = false;
    this.zone = [0.5, 0.7];
    this.removed = [];
    this.fx = new Particles();
    this.sx = this.slotX(0);
    this.startBone();
  }

  slotX(i) {
    const s = SLOTS[this.bones[i].slot];
    return s[0] + s[2] / 2;
  }

  startBone() {
    this.hits = 0;
    this.clean = true;
    this.cracks = [];
    this.m = 0;
    this.dir = 1;
    this.placeBand();
  }

  // Escolhe a zona verde, algures dentro do comprimento do osso.
  placeBand() {
    const b = this.bones[this.i];
    const x0 = 120 - b.size / 2, x1 = 120 + b.size / 2;
    const w = Math.min(b.band, x1 - x0);
    let c;
    do { c = x0 + w / 2 + Math.random() * (x1 - x0 - w); }
    while (this.band && x1 - x0 - w > 30 && Math.abs(c - (this.band[0] + this.band[1] / 2)) < 16);
    this.band = [Math.round(c - w / 2), w];
  }

  begin() {
    this.state = 'cut';
    this.paused = false;
    this.lock = 0.3;
    this.game.input.reset();
    document.body.classList.add('minigame');
    this.game.ui.setHud(this.got, this.bones.length, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.hintBone();
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

  autoPause() {
    if (!this.paused) this.togglePause();
  }

  hint(text) { this.game.ui.setHint(text); }

  hintBone() {
    const b = this.bones[this.i];
    this.hint(`${b.name}: ${b.tool === 'saw' ? 'serra' : 'martela'} quando o marcador estiver no verde!`);
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    const I = this.game.input, audio = this.game.audio;
    if (this.lock > 0) this.lock -= dt;
    const pressed = I.actionPressed && this.lock <= 0;
    if (this.anim > 0) this.anim -= dt;

    const target = this.state === 'won' || this.state === 'done' ? 78 : this.slotX(Math.min(this.i, this.bones.length - 1));
    this.sx += (target - this.sx) * Math.min(1, dt * 6);

    switch (this.state) {
      case 'cut': {
        const b = this.bones[this.i];
        if (this.anim <= 0) {
          this.m += this.dir * b.speed * dt;
          if (this.m >= 1) { this.m = 1; this.dir = -1; } else if (this.m <= 0) { this.m = 0; this.dir = 1; }
        }
        if (pressed) this.strike();
        break;
      }
      case 'pain':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'anes';
          this.fill = 0;
          this.holding = false;
          const lo = 0.42 + Math.random() * 0.3;
          this.zone = [lo, lo + 0.2];
          this.hint('Luísa: mantém premido para injetar e larga no verde!');
        }
        break;
      case 'anes':
        if (I.action && (this.holding || pressed)) {
          if (!this.holding) audio.play('inject');
          this.holding = true;
          this.fill += FILL_RATE * dt;
          if (this.fill >= 1) this.anesFail('Demasiada anestesia! Tenta outra vez...');
        } else if (this.holding) {
          this.holding = false;
          if (this.fill >= this.zone[0] && this.fill <= this.zone[1]) {
            this.state = 'calm';
            this.timer = 1.1;
            audio.play('check');
            this.hint('Zzz... O doente voltou a adormecer.');
          } else {
            this.anesFail(this.fill < this.zone[0] ? 'Pouca anestesia! Tenta outra vez...' : 'Demasiada anestesia! Tenta outra vez...');
          }
        }
        break;
      case 'anesFail':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'anes';
          this.fill = 0;
          this.hint('Luísa: mantém premido para injetar e larga no verde!');
        }
        break;
      case 'calm':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'cut';
          this.lock = 0.2;
          this.hintBone();
        }
        break;
      case 'removed':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.i++;
          if (this.i >= this.bones.length) {
            this.state = 'won';
            this.timer = 0;
            this.game.ui.setLevelMode(true, false);
            audio.play('win');
            this.hint('Operação concluída! Que bela equipa!');
          } else {
            this.band = null;
            this.startBone();
            this.state = 'cut';
            this.lock = 0.2;
            this.hintBone();
          }
        }
        break;
      case 'won':
        this.timer += dt;
        if (Math.floor(this.timer * 6) !== Math.floor((this.timer - dt) * 6)) {
          this.fx.heart(40 + Math.random() * 30, 26, Math.random() < 0.3 ? '#ffd166' : '#ff5d8f');
        }
        if (this.timer > 2.6) this.finish();
        break;
    }
  }

  // O Sérgio dá um golpe: acerta se o marcador estiver dentro da zona verde.
  strike() {
    const b = this.bones[this.i], audio = this.game.audio;
    const x = TRACK0 + this.m * TRACK;
    const s = SLOTS[b.slot];
    if (x >= this.band[0] && x <= this.band[0] + this.band[1]) {
      this.hits++;
      this.cracks.push(Math.round(x));
      this.anim = 0.4;
      this.lock = 0.4;
      audio.play(b.tool === 'saw' ? 'saw' : 'toc');
      this.fx.burst(s[0] + s[2] / 2, s[1] + 2, 8, [C.bone, '#ffffff', C.boneD], 45);
      if (this.hits >= HITS) this.removeBone();
      else this.placeBand();
    } else {
      this.clean = false;
      this.state = 'pain';
      this.timer = 1.2;
      this.lock = 0.5;
      audio.play('buzz');
      this.fx.burst(59, 58, 12, [C.red, C.gold, '#ffffff'], 70);
      this.hint('AI! O doente acordou!');
    }
  }

  anesFail(msg) {
    this.state = 'anesFail';
    this.timer = 1;
    this.holding = false;
    this.game.audio.play('hurt');
    this.hint(msg);
  }

  removeBone() {
    const b = this.bones[this.i];
    this.state = 'removed';
    this.timer = 1.3;
    this.removed.push(this.i);
    this.game.audio.play('pop');
    if (this.clean) {
      this.got++;
      this.fx.heart(this.sx, 20);
      this.fx.heart(this.sx + 6, 26, '#ffd166');
      this.game.ui.setHud(this.got, this.bones.length, this.level.title);
    }
    this.hint(`${b.name} ${b.fem ? 'removida' : 'removido'}!` + (this.clean ? ' Perfeito!' : ''));
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.bones.length);
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.bones.length);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const ox = Math.floor((v.w - SW) / 2);
    const oy = v.portrait ? Math.floor((v.h - SH) * 0.36) : Math.max(0, Math.floor((v.h - SH) / 2) + 4);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, w, h); };
    const t = this.t;
    const awake = this.state === 'pain' || this.state === 'anes' || this.state === 'anesFail';

    this.drawRoom(ctx, v, ox, oy, R, awake);

    // Luísa (junto à cabeça do doente) e Sérgio (junto ao osso), atrás da mesa
    const hop = awake ? Math.round(Math.abs(Math.sin(t * 12)) * 2) : 0;
    const joy = this.state === 'won' || this.state === 'done' ? Math.round(Math.abs(Math.sin(t * 6)) * 3) : 0;
    const lx = this.state === 'anes' || this.state === 'anesFail' ? 16 : 12;
    ctx.drawImage(this.luisa.stand.r, ox + lx, oy + 22 - hop - joy, 32, 48);
    const bob = this.state === 'cut' && this.anim > 0 ? 1 : 0;
    ctx.drawImage(this.sergio.stand.l, ox + Math.round(this.sx) - 16, oy + 22 - hop - joy + bob, 32, 48);

    // Carro de anestesia, à frente da Luísa
    R(13, 60, 28, 42, C.ink);
    R(14, 61, 26, 40, '#b8c4d6');
    R(14, 61, 26, 3, '#dfe6f0');
    R(17, 67, 20, 9, '#0f2a2a');
    R(19, 71, 4, 1, C.green);
    R(24, 69, 3, 5, C.green);
    R(28, 71, 7, 1, C.green);
    R(17, 80, 4, 4, C.gold);
    R(23, 80, 4, 4, '#ff5d8f');
    R(29, 80, 4, 4, '#7be0b0');
    R(17, 88, 20, 2, C.steelD);
    R(17, 93, 20, 2, C.steelD);
    R(15, 102, 5, 3, C.ink);
    R(34, 102, 5, 3, C.ink);

    // Mesa de operações
    R(38, 82, 166, 5, '#ffffff');
    R(38, 86, 166, 2, C.steel);
    R(36, 88, 170, 4, C.steelD);
    R(44, 92, 3, 14, C.steelD);
    R(196, 92, 3, 14, C.steelD);
    R(42, 106, 7, 3, C.ink);
    R(194, 106, 7, 3, C.ink);

    this.drawPatient(R, t, awake);
    this.drawTools(R, t, awake);
    this.drawPanel(R, t, awake);
    this.fx.draw(ctx, -ox, -oy);
  }

  drawRoom(ctx, v, ox, oy, R, awake) {
    const fy = oy + FLOOR, t = this.t;
    // Parede de azulejos
    ctx.fillStyle = '#c4e6df';
    ctx.fillRect(0, 0, v.w, fy);
    ctx.fillStyle = '#afd6ce';
    for (let x = mod(ox, 16) - 16; x < v.w; x += 16) ctx.fillRect(x, 0, 1, fy);
    for (let y = fy - 16; y > -16; y -= 16) ctx.fillRect(0, y, v.w, 1);
    // Chão em xadrez
    ctx.fillStyle = '#7d9fb5';
    ctx.fillRect(0, fy, v.w, v.h - fy);
    ctx.fillStyle = '#8cb0c6';
    for (let y = fy, row = 0; y < v.h; y += 16, row++) {
      for (let x = mod(ox, 16) - 16; x < v.w; x += 16) {
        if ((Math.floor((x - ox) / 16) + row) & 1) ctx.fillRect(x, y, 16, 16);
      }
    }
    ctx.fillStyle = '#5f8198';
    ctx.fillRect(0, fy, v.w, 2);

    // Candeeiro cirúrgico
    ctx.fillStyle = C.steelD;
    ctx.fillRect(ox + 118, 0, 4, oy + 8);
    R(98, 8, 44, 6, C.steel);
    R(98, 8, 44, 1, '#ffffff');
    R(102, 14, 36, 3, '#fff6c8');

    // Suporte do soro
    R(10, 26, 2, 76, C.steelD);
    R(4, 102, 14, 2, C.steelD);
    R(5, 26, 12, 2, C.steelD);
    R(4, 29, 8, 12, '#eaf8ff');
    R(4, 34, 8, 7, '#8fd0f5');
    R(7, 41, 1, 30, '#bfe9ff');

    // Monitor: batimento calmo a dormir, disparado quando acorda
    R(200, 22, 32, 24, C.ink);
    R(202, 24, 28, 16, '#0f2a2a');
    const sp = awake ? 70 : 22, amp = awake ? 6 : 4;
    const col = awake ? '#ff5d5d' : C.green;
    for (let x = 0; x < 28; x++) {
      const ph = mod(x + Math.floor(t * sp), 14);
      const d = ph === 6 ? -amp : ph === 7 ? Math.round(amp * 0.6) : 0;
      R(202 + x, 33 + Math.min(0, d), 1, Math.abs(d) + 1, col);
    }
    R(203, 42, 3, 2, col);
    R(208, 42, 3, 2, C.gold);
    R(214, 46, 4, 6, C.steelD);

    // Tabuleiro onde vão parar os ossos retirados
    R(208, 76, 28, 3, C.steel);
    R(210, 79, 2, 23, C.steelD);
    R(232, 79, 2, 23, C.steelD);
    const landed = this.state === 'removed' && this.timer > 0.5 ? this.removed.length - 1 : this.removed.length;
    for (let k = 0; k < landed; k++) {
      const bx = 210 + (k % 3) * 8, by = 73 - Math.floor(k / 3) * 3;
      R(bx + 1, by, 6, 2, C.bone);
      R(bx, by - 1, 2, 4, C.bone);
      R(bx + 6, by - 1, 2, 4, C.bone);
    }
  }

  drawPatient(R, t, awake) {
    const dx = awake ? Math.round(Math.sin(t * 38) * 1.5) : 0;
    const dy = awake ? -Math.round(Math.abs(Math.sin(t * 21)) * 2) : 0;
    const P = (x, y, w, h, c) => R(x + dx, y + dy, w, h, c);
    const breath = awake ? 0 : Math.max(0, Math.round(Math.sin(t * 2)));

    // Almofada
    R(40, 73, 30, 9, '#ffffff');
    R(40, 80, 30, 2, C.steel);

    // Pernas: esticadas a dormir, a espernear quando acorda
    P(140, 68, 24, 14, C.skin);
    if (awake) {
      const k = Math.abs(Math.sin(t * 14));
      for (let i = 0; i < 7; i++) P(162 + i * 4, 68 - Math.round(i * 3.2 * k), 6, 12, C.skin);
      P(188, 60 - Math.round(22 * k), 7, 14, C.skin);
    } else {
      P(164, 68, 28, 14, C.skin);
      P(140, 79, 52, 3, C.skinD);
      P(190, 58, 7, 24, C.skin);
      P(189, 56, 6, 3, C.skin);
    }

    // Tronco com bata de hospital (a barriga sobe e desce a respirar)
    P(66, 62, 74, 20, C.gown);
    P(66, 78, 74, 4, C.gownD);
    P(82, 60 - breath, 34, 2 + breath, C.gown);
    P(138, 62, 3, 20, C.gownD);

    // Pescoço e cabeça (deitado de barriga para cima, nariz vermelho como no jogo clássico)
    P(61, 66, 6, 9, C.skin);
    P(46, 60, 16, 16, C.skin);
    P(47, 59, 14, 1, C.skin);
    P(47, 76, 14, 1, C.skin);
    P(44, 61, 5, 14, C.hair);
    P(45, 72, 11, 5, C.hair);
    P(46, 59, 4, 2, C.hair);
    P(52, 68, 2, 3, C.skinD);
    const blink = Math.floor(t * 10) % 2 === 0;
    if (awake) {
      P(53, 62, 4, 4, '#ffffff');
      P(54, 63, 2, 2, C.ink);
      P(61, 58, 3, 4, '#7a1f2e');
      if (blink) P(56, 54, 6, 6, 'rgba(255,59,59,0.4)');
      P(57, 55, 4, 5, blink ? C.red : '#ff8a8a');
    } else {
      P(53, 64, 4, 1, C.ink);
      P(62, 60, 2, 1, '#b5524a');
      P(57, 56, 4, 4, '#e86a6a');
    }

    // Braço: pousado a dormir, no ar quando acorda
    P(66, 69, 10, 8, C.gownD);
    if (awake) {
      const k = Math.abs(Math.sin(t * 17 + 1));
      for (let i = 0; i < 7; i++) P(74 + i * 5, 68 - Math.round(i * 4 * k), 6, 5, C.skin);
    } else {
      P(74, 71, 36, 5, C.skin);
      P(74, 75, 36, 1, C.skinD);
      P(110, 70, 5, 6, C.skin);
    }

    // "Janelas" com os ossos
    const flying = this.state === 'removed' ? this.i : -1;
    this.bones.forEach((b, j) => {
      const [x, y, w, h, limb] = SLOTS[b.slot];
      if (awake && limb) return;
      const cy = y + Math.floor(h / 2);
      if (this.removed.includes(j)) {
        // osso já retirado: fica um penso com pontos
        P(x, y, w, h, '#ffe9d6');
        for (let k = 2; k < w - 1; k += 3) P(x + k, cy - 1, 1, 3, C.ink);
        return;
      }
      const current = j === this.i && this.state === 'cut';
      P(x - 1, y - 1, w + 2, h + 2, current && Math.floor(t * 5) % 2 ? C.gold : C.ink);
      P(x, y, w, h, C.cavity);
      if (j === flying) return;
      if (b.shape === 'round') {
        P(x + 2, y + 3, w - 4, h - 6, C.bone);
        P(x + 3, y + 2, w - 6, h - 4, C.bone);
      } else if (b.shape === 'rib') {
        P(x + 2, y + 2, w - 4, 2, C.bone);
        P(x + 2, y + 2, 2, h - 3, C.bone);
        P(x + w - 4, y + 2, 2, h - 3, C.bone);
      } else {
        P(x + 2, cy - 1, w - 4, 2, C.bone);
        P(x + 1, cy - 2, 2, 4, C.bone);
        P(x + w - 3, cy - 2, 2, 4, C.bone);
      }
    });

    // A dormir: Zzz a subir. Acordado: pontos de exclamação.
    if (awake) {
      if (blink) {
        R(48, 42, 2, 7, C.red);
        R(48, 51, 2, 2, C.red);
        R(54, 39, 2, 7, C.gold);
        R(54, 48, 2, 2, C.gold);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const ph = mod(t * 0.5 + i / 3, 1);
        if (ph > 0.9) continue;
        const zx = 52 + Math.round(ph * 5), zy = 52 - Math.round(ph * 22), s = ph > 0.5 ? 5 : 4;
        R(zx, zy, s, 1, '#ffffff');
        R(zx, zy + s - 1, s, 1, '#ffffff');
        for (let k = 1; k < s - 1; k++) R(zx + s - 1 - k, zy + k, 1, 1, '#ffffff');
      }
    }
  }

  drawTools(R, t, awake) {
    // Seringa da Luísa
    const injecting = this.state === 'anes' || this.state === 'anesFail' || this.state === 'calm';
    const sx = injecting ? 58 : 45;
    const sy = injecting ? 40 + Math.round(this.fill * 6) : 40;
    R(sx - 1, sy - 4, 5, 1, C.steelD);
    R(sx + 1, sy - 4, 1, 4, C.steelD);
    R(sx, sy, 3, 10, '#eaf8ff');
    R(sx, sy + 3 + Math.round(this.fill * 5), 3, 7 - Math.round(this.fill * 5), '#7be0b0');
    R(sx + 1, sy + 10, 1, 5, C.steelD);

    if (this.state === 'won' || this.state === 'done' || this.state === 'intro') return;

    // Ferramenta do Sérgio por cima do osso atual
    const b = this.bones[Math.min(this.i, this.bones.length - 1)];
    const [x, y, w] = SLOTS[b.slot];
    const cx = Math.round(this.state === 'cut' ? x + w / 2 : this.sx + 16);
    const hit = this.state === 'cut' && this.anim > 0;
    if (b.tool === 'saw') {
      const lift = hit ? 0 : this.state === 'cut' ? 5 + Math.round(Math.sin(t * 4)) : 12;
      const off = hit ? Math.round(Math.sin(this.anim * 45) * 4) : 0;
      const bx = cx - 13 + off, by = y - 5 - lift;
      R(bx, by, 22, 4, C.steel);
      R(bx, by, 22, 1, '#ffffff');
      for (let i = 0; i < 11; i++) R(bx + i * 2, by + 4, 1, 1, C.steelD);
      R(bx + 22, by - 4, 7, 9, C.wood);
      R(bx + 24, by - 2, 3, 4, C.woodD);
    } else {
      // o martelo bate de imediato e depois volta a subir
      const lift = hit ? (this.anim > 0.3 ? 0 : Math.round(((0.3 - this.anim) / 0.3) * 9)) : this.state === 'cut' ? 9 + Math.round(Math.sin(t * 4)) : 12;
      const by = y - 7 - lift;
      R(cx - 1, by - 14, 3, 15, C.wood);
      R(cx - 6, by, 13, 7, C.steelD);
      R(cx - 6, by, 13, 2, C.steel);
      if (hit && this.anim > 0.3) {
        R(cx - 10, by + 6, 3, 1, C.gold);
        R(cx + 8, by + 6, 3, 1, C.gold);
        R(cx - 8, by + 3, 2, 1, C.gold);
        R(cx + 7, by + 3, 2, 1, C.gold);
      }
    }

    // Osso a voar para o tabuleiro
    if (this.state === 'removed' && this.timer > 0.5) {
      const s = SLOTS[this.bones[this.i].slot];
      const e = 1 - (this.timer - 0.5) / 0.8;
      const fx = s[0] + s[2] / 2 + (222 - s[0] - s[2] / 2) * e;
      const fy = s[1] + 4 + (72 - s[1] - 4) * e - Math.sin(Math.PI * e) * 34;
      R(Math.round(fx) - 4, Math.round(fy), 8, 2, C.bone);
      R(Math.round(fx) - 5, Math.round(fy) - 1, 2, 4, C.bone);
      R(Math.round(fx) + 3, Math.round(fy) - 1, 2, 4, C.bone);
    }
  }

  // Painel de raio-X: vista ampliada do osso (vez do Sérgio) ou da seringa (vez da Luísa).
  drawPanel(R, t, awake) {
    R(18, 108, 204, 36, C.ink);
    R(20, 110, 200, 32, '#fff6e6');
    R(22, 112, 196, 28, '#10323d');
    for (let y = 113; y < 140; y += 3) R(22, y, 196, 1, '#143b47');

    if (awake || this.state === 'calm') {
      // Seringa: o êmbolo avança enquanto se mantém premido
      const fw = Math.round(this.fill * 126);
      const [lo, hi] = this.zone;
      R(50, 118, 130, 16, '#eaf8ff');
      R(52, 120, 126, 12, '#bcd6e2');
      R(52 + fw, 120, 126 - fw, 12, this.state === 'anesFail' ? '#ff8a8a' : '#7be0b0');
      for (let k = 1; k < 10; k++) R(52 + Math.round(k * 12.6), 120, 1, 3, '#6f93a8');
      const zx = 52 + Math.round(lo * 126), zw = Math.round((hi - lo) * 126);
      R(zx, 115, zw, 22, 'rgba(92,240,138,0.4)');
      R(zx, 115, 1, 22, C.green);
      R(zx + zw - 1, 115, 1, 22, C.green);
      R(zx, 115, zw, 1, C.green);
      R(zx, 136, zw, 1, C.green);
      R(26 + fw, 117, 4, 18, C.steel);
      R(30 + fw, 124, 20, 4, C.steelD);
      R(50 + fw, 119, 3, 14, C.steelD);
      R(180, 123, 6, 6, C.steelD);
      R(186, 125, 22, 2, C.steel);
      if (this.state === 'calm') {
        R(210, 124 + mod(Math.floor(t * 10), 4), 2, 3, '#7be0b0');
        R(213, 122 + mod(Math.floor(t * 10 + 2), 4), 2, 2, '#7be0b0');
      }
      return;
    }

    if (this.state === 'won' || this.state === 'done') return;
    const b = this.bones[Math.min(this.i, this.bones.length - 1)];
    const gone = this.state === 'removed';
    const x0 = 120 - b.size / 2, x1 = 120 + b.size / 2;

    if (!gone) {
      // Osso ampliado
      if (b.shape === 'round') {
        for (let dy = -11; dy <= 11; dy++) {
          const half = Math.floor(Math.sqrt(121 - dy * dy));
          R(120 - half, PCY + dy, half * 2, 1, dy > 6 ? C.boneD : C.bone);
        }
      } else if (b.shape === 'rib') {
        for (let x = x0; x < x1; x += 2) {
          const y = PCY + 6 - Math.round(Math.sin((Math.PI * (x - x0)) / b.size) * 11);
          R(x, y - 3, 2, 6, C.bone);
          R(x, y + 2, 2, 1, C.boneD);
        }
      } else {
        R(x0 + 8, PCY - 3, b.size - 16, 7, C.bone);
        R(x0 + 8, PCY + 3, b.size - 16, 1, C.boneD);
        for (const ex of [x0 + 6, x1 - 6]) {
          for (const ey of [PCY - 4, PCY + 4]) {
            for (let dy = -5; dy <= 5; dy++) {
              const half = Math.floor(Math.sqrt(25 - dy * dy));
              R(ex - half, ey + dy, half * 2, 1, C.bone);
            }
          }
        }
      }
      // Rachas dos golpes já dados
      for (const cx of this.cracks) {
        for (let j = 0; j < 9; j++) R(cx + (j % 2), PCY - 4 + j, 1, 1, C.ink);
      }
      // Zona verde
      const [bx, bw] = this.band;
      R(bx, 113, bw, 26, 'rgba(92,240,138,0.38)');
      R(bx, 113, 1, 26, C.green);
      R(bx + bw - 1, 113, 1, 26, C.green);
      // Marcador
      const mx = Math.round(TRACK0 + this.m * TRACK);
      R(mx, 112, 2, 28, C.gold);
      R(mx - 2, 112, 6, 2, C.gold);
      R(mx - 1, 114, 4, 1, C.gold);
      R(mx - 2, 138, 6, 2, C.gold);
      R(mx - 1, 137, 4, 1, C.gold);
    }

    // Golpes dados / necessários
    for (let k = 0; k < HITS; k++) R(212 - k * 6, 114, 4, 4, k >= HITS - this.hits ? C.green : '#2a5665');
  }
}
