// Nível de visita guiada, visto de cima: a Luísa mostra a casa de família ao Sérgio.
// O jogador conduz a Luísa por um ou mais mapas (interior do solar, jardim de buxo),
// o Sérgio segue-a, e em cada ponto de interesse ela conta-lhe qualquer coisa.
//
// Controlos: setas / WASD, ou tocar e manter o dedo no sítio para onde se quer ir.
import { TILE as T } from '../config.js';
import { LEVELS } from '../levels/index.js';
import { getCharacter, charFrame, getSprites } from '../sprites.js';
import { hash } from '../themes.js';
import { Particles } from '../fx.js';

const SPEED = 74;
const TRAIL = 13;
const INK = '#2b1d2e', GOLD = '#ffd166';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Blocos que não se atravessam. (O regador 's' só bloqueia enquanto está a regar.)
const SOLID = new Set('BTFxtWwRbPCAkmonvd'.split(''));
// Blocos altos, desenhados por cima do chão e ordenados com as personagens.
const FLOORS = { '.': 'grass', ',': 'gravel', '_': 'wood', ':': 'stone', r: 'rug' };

export class TourScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.spr = getSprites();
    this.luisa = getCharacter('luisa', 'casual');
    this.sergio = getCharacter('sergio', 'casual');
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  // Lê os mapas do nível: corações, pontos de interesse, portas, regadores...
  setup() {
    this.maps = {};
    this.totalHearts = 0;
    this.pois = [];
    for (const [id, def] of Object.entries(this.level.maps)) {
      const grid = def.rows.map((r) => r.split(''));
      const m = { id, def, grid, rows: grid.length, cols: grid[0].length, hearts: [], pois: [], sprinklers: [], doors: [], start: null, lost: null };
      for (let y = 0; y < m.rows; y++) {
        for (let x = 0; x < m.cols; x++) {
          const ch = grid[y][x];
          const cx = x * T + 8, cy = y * T + 12;
          const floor = def.indoor ? this.floorNear(grid, x, y) : ',';
          if (ch === 'h') { m.hearts.push({ x: cx, y: cy - 4, got: false }); grid[y][x] = floor; }
          else if (ch === 'L') { m.start = { x: cx, y: cy }; grid[y][x] = floor; }
          else if (ch === 'S') { m.lost = { x: cx, y: cy }; grid[y][x] = floor; }
          else if (ch === 's') m.sprinklers.push({ x, y, phase: hash(x * 3.1 + y * 7.7) * 4 });
          else if (ch === 'D') m.doors.push({ x, y });
          else if (ch >= '1' && ch <= '9') {
            const poi = { n: ch, map: id, x: cx, y: cy, done: false, def: this.level.pois[ch] || { text: '' } };
            m.pois.push(poi);
            this.pois.push(poi);
            grid[y][x] = floor;
          }
        }
      }
      this.totalHearts += m.hearts.length;
      this.maps[id] = m;
    }
    this.state = 'intro';      // intro → walk → won → done
    this.got = 0;
    this.timer = 0;
    this.hintT = 0;
    this.sergioLost = false;
    this.lostSeen = false;
    this.fx = new Particles();
    this.enterMap(this.level.start, null);
  }

  // Chão por baixo de um objeto dentro de casa: o mesmo do vizinho mais próximo.
  floorNear(grid, x, y) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
      const c = (grid[y + dy] || [])[x + dx];
      if (c === '_' || c === ':' || c === 'r') return c === 'r' ? '_' : c;
    }
    return '_';
  }

  enterMap(id, fromDoor) {
    const m = this.maps[id];
    this.map = m;
    let pos = m.start;
    if (fromDoor && m.doors.length) {
      // sai-se junto à porta: do lado de dentro do mapa
      const d = m.doors[0];
      const dy = d.y < m.rows / 2 ? 1 : -1;
      pos = { x: d.x * T + 8, y: (d.y + dy) * T + 12 };
    }
    this.p = { x: pos.x, y: pos.y, facing: 1, moving: false, dist: 0 };
    this.c = { x: pos.x - 12, y: pos.y, facing: 1, moving: false, dist: 0 };
    this.trail = [];
    // No jardim, o Sérgio perde-se no meio dos buxos até a Luísa o ir buscar.
    if (m.lost && !this.lostSeen) {
      this.lostSeen = true;
      this.sergioLost = true;
      this.c.x = m.lost.x;
      this.c.y = m.lost.y;
      if (this.state === 'walk') this.hint(this.level.lostText, 6);
    }
    this.camX = 0;
    this.camY = 0;
    this.updateCamera(true);
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.state = 'walk';
    this.paused = false;
    this.game.input.reset();
    document.body.classList.add('minigame');
    this.game.ui.setHud(this.got, this.totalHearts, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.hint(this.level.firstHint, 6);
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state !== 'walk') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  onResize() { if (this.map) this.updateCamera(true); }

  hint(text, secs = 5) {
    if (!text) return;
    this.game.ui.setHint(text);
    this.hintT = secs;
  }

  tile(x, y) {
    const m = this.map;
    if (x < 0 || y < 0 || x >= m.cols || y >= m.rows) return 'W';
    return m.grid[y][x];
  }

  sprinklerOn(s) { return (this.t + s.phase) % 4.4 < 2; }

  blocked(px, py) {
    // caixa dos pés: 10x6
    for (const [ox, oy] of [[-5, -6], [4, -6], [-5, -1], [4, -1]]) {
      const tx = Math.floor((px + ox) / T), ty = Math.floor((py + oy) / T);
      const ch = this.tile(tx, ty);
      if (SOLID.has(ch)) return true;
      if (ch === 's') {
        const s = this.map.sprinklers.find((k) => k.x === tx && k.y === ty);
        if (s && this.sprinklerOn(s)) { this.wet = true; return true; }
      }
    }
    return false;
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
    if (this.state === 'walk') this.walk(dt);
    else if (this.state === 'won') {
      this.timer += dt;
      if (Math.floor(this.timer * 6) !== Math.floor((this.timer - dt) * 6)) {
        this.fx.heart(this.p.x - 14 + Math.random() * 28, this.p.y - 30, Math.random() < 0.3 ? GOLD : '#ff5d8f');
      }
      if (this.timer > 3.4) this.finish();
    }
    this.updateCamera(false);
  }

  walk(dt) {
    const I = this.game.input, v = this.game.view, p = this.p;
    // Direção: teclado, ou em direção ao dedo/rato enquanto se toca no ecrã
    let dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    if (!dx && !dy && I.pointerX >= 0) {
      const tx = I.pointerX * v.w + this.camX - p.x, ty = I.pointerY * v.h + this.camY - (p.y - 8);
      if (Math.hypot(tx, ty) > 6) { dx = tx; dy = ty; }
    }
    const len = Math.hypot(dx, dy);
    p.moving = len > 0;
    if (p.moving) {
      const sx = (dx / len) * SPEED * dt, sy = (dy / len) * SPEED * dt;
      this.wet = false;
      const ox = p.x, oy = p.y;
      if (!this.blocked(p.x + sx, p.y)) p.x += sx;
      if (!this.blocked(p.x, p.y + sy)) p.y += sy;
      if (Math.abs(dx) > Math.abs(dy) * 0.3) p.facing = dx > 0 ? 1 : -1;
      const moved = Math.hypot(p.x - ox, p.y - oy);
      p.dist += moved;
      p.moving = moved > 0.05;
      if (this.wet && this.hintT <= 0) this.hint('Os regadores estão ligados! Espera que parem.', 2.5);
      if (p.moving && !this.sergioLost) this.trail.push({ x: p.x, y: p.y, facing: p.facing });
    }
    // O Sérgio segue o caminho da Luísa, uns passos atrás
    const c = this.c;
    if (!this.sergioLost && this.trail.length > TRAIL) {
      const s = this.trail.shift();
      c.dist += Math.hypot(s.x - c.x, s.y - c.y);
      c.x = s.x; c.y = s.y; c.facing = s.facing;
      c.moving = true;
    } else c.moving = false;

    const m = this.map;
    // Corações
    for (const h of m.hearts) {
      if (h.got || Math.hypot(h.x - p.x, h.y - (p.y - 6)) > 11) continue;
      h.got = true;
      this.got++;
      this.fx.burst(h.x, h.y, 8, ['#ff5d8f', '#ffd1e0', '#ffffff'], 50);
      this.game.audio.play('heart');
      this.game.ui.setHud(this.got, this.totalHearts, this.level.title);
    }
    // O Sérgio perdido nos buxos
    if (this.sergioLost && Math.hypot(c.x - p.x, c.y - p.y) < 18) {
      this.sergioLost = false;
      this.trail = [];
      this.game.audio.play('win');
      for (let i = 0; i < 5; i++) this.fx.heart(c.x - 8 + Math.random() * 16, c.y - 26);
      this.hint(this.level.foundText, 5);
    }
    // Pontos de interesse
    for (const poi of m.pois) {
      if (poi.done || Math.hypot(poi.x - p.x, poi.y - p.y) > 13) continue;
      if (poi.def.final) {
        const left = this.pois.filter((q) => !q.done && !q.def.final).length;
        if (this.sergioLost) { if (this.hintT <= 0) this.hint('Falta encontrar o Sérgio, que anda perdido nos buxos!', 3); continue; }
        if (left > 0) { if (this.hintT <= 0) this.hint(`Ainda falta mostrar ${left} ${left === 1 ? 'sítio' : 'sítios'} ao Sérgio. Procura os pontos a brilhar!`, 3); continue; }
        poi.done = true;
        this.state = 'won';
        this.timer = 0;
        this.game.ui.setLevelMode(true, false);
        this.game.audio.play('win');
        this.hint(poi.def.text, 9);
        return;
      }
      poi.done = true;
      this.game.audio.play('check');
      this.fx.burst(poi.x, poi.y - 14, 10, [GOLD, '#ffffff'], 45);
      this.hint(poi.def.text, 6);
    }
    // Portas entre mapas
    for (const d of m.doors) {
      if (Math.floor(p.x / T) === d.x && Math.floor((p.y - 3) / T) === d.y) {
        this.game.audio.play('click');
        this.enterMap(m.def.door, d);
        return;
      }
    }
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.totalHearts);
    document.body.classList.remove('minigame');
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.totalHearts);
  }

  updateCamera(snap) {
    const v = this.game.view, m = this.map, p = this.p;
    const W = m.cols * T, H = m.rows * T;
    const tx = W <= v.w ? (W - v.w) / 2 : clamp(p.x - v.w / 2, 0, W - v.w);
    const ty = H <= v.h ? (H - v.h) / 2 : clamp(p.y - 10 - v.h / 2, 0, H - v.h);
    const k = snap ? 1 : 0.15;
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const m = this.map, t = this.t;
    const camX = Math.round(this.camX), camY = Math.round(this.camY);
    ctx.fillStyle = m.def.indoor ? '#1a1420' : '#3f8a4a';
    ctx.fillRect(0, 0, v.w, v.h);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x - camX, y - camY, w, h); };
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(m.cols - 1, Math.floor((camX + v.w) / T));
    const y0 = Math.max(0, Math.floor(camY / T) - 1), y1 = Math.min(m.rows - 1, Math.floor((camY + v.h) / T) + 2);

    // 1) Chão
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.drawFloor(R, m, x, y);

    // 2) Objetos altos e personagens, linha a linha (os de baixo tapam os de cima)
    const ents = [
      { y: this.c.y, draw: () => this.drawPerson(ctx, this.sergio, this.c, camX, camY, this.sergioLost) },
      { y: this.p.y + 0.1, draw: () => this.drawPerson(ctx, this.luisa, this.p, camX, camY, false) },
    ];
    for (const h of m.hearts) if (!h.got) ents.push({ y: h.y + 4, draw: () => ctx.drawImage(this.spr.heart, Math.round(h.x - camX) - 4, Math.round(h.y - camY) - 6 + Math.round(Math.sin(t * 4 + h.x) * 1.5)) });
    for (const poi of m.pois) if (!poi.done) ents.push({ y: poi.y, draw: () => this.drawSpark(R, poi, t) });
    ents.sort((a, b) => a.y - b.y);
    let ei = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) this.drawTall(R, m, x, y, t);
      const limit = (y + 1) * T;
      while (ei < ents.length && ents[ei].y < limit) ents[ei++].draw();
    }
    while (ei < ents.length) ents[ei++].draw();

    this.fx.draw(ctx, camX, camY);

    // Progresso da visita: um ponto por sítio a mostrar
    const n = this.pois.length, px = Math.round((v.w - n * 7) / 2);
    ctx.fillStyle = INK;
    ctx.fillRect(px - 3, v.h - 12, n * 7 + 5, 9);
    this.pois.forEach((q, i) => {
      ctx.fillStyle = q.done ? GOLD : '#5a4a6e';
      ctx.fillRect(px + i * 7, v.h - 10, 5, 5);
    });
  }

  drawPerson(ctx, frames, e, camX, camY, lost) {
    const img = charFrame(frames, e.facing, e.moving, false, e.dist);
    const x = Math.round(e.x - camX) - 8, y = Math.round(e.y - camY) - 23;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(x + 3, y + 22, 10, 3);
    ctx.drawImage(img, x, y);
    if (lost) {
      const b = Math.round(Math.sin(this.t * 6) * 1.5);
      ctx.fillStyle = GOLD;
      ctx.fillRect(x + 5, y - 9 + b, 6, 2);
      ctx.fillRect(x + 9, y - 7 + b, 2, 3);
      ctx.fillRect(x + 7, y - 5 + b, 3, 2);
      ctx.fillRect(x + 7, y - 1 + b, 2, 2);
    }
  }

  // Brilho que marca um ponto de interesse ainda por mostrar.
  drawSpark(R, poi, t) {
    const b = Math.round(Math.sin(t * 5 + poi.x) * 2), x = poi.x, y = poi.y - 16 + b;
    const big = Math.floor(t * 4 + poi.x) % 2;
    R(x - 1, y - 4 - big, 2, 9 + big * 2, GOLD);
    R(x - 4 - big, y - 1, 9 + big * 2, 2, GOLD);
    R(x - 1, y - 1, 2, 2, '#ffffff');
    R(poi.x - 4, poi.y - 2, 8, 2, 'rgba(255,209,102,0.5)');
  }

  drawFloor(R, m, c, r) {
    const ch = m.grid[r][c], x = c * T, y = r * T, hs = hash(c * 7.3 + r * 13.1);
    let kind = FLOORS[ch];
    if (!kind) kind = m.def.indoor ? FLOORS[this.floorNear(m.grid, c, r)] : (ch === 'f' || ch === 't' ? 'grass' : 'gravel');
    if (kind === 'grass') {
      R(x, y, T, T, '#5fae5a');
      if (hs > 0.5) { R(x + 3 + Math.floor(hs * 8), y + 4, 2, 1, '#7fcf72'); R(x + 9 - Math.floor(hs * 6), y + 11, 2, 1, '#4f9a4f'); }
    } else if (kind === 'gravel') {
      R(x, y, T, T, '#e0d2a8');
      R(x + 2 + Math.floor(hs * 10), y + 3, 2, 1, '#c9b888');
      R(x + 12 - Math.floor(hs * 9), y + 10, 2, 1, '#c9b888');
      if (hs > 0.6) R(x + 6, y + 13, 1, 1, '#f2e8c8');
    } else if (kind === 'wood' || kind === 'rug') {
      R(x, y, T, T, '#b8834a');
      R(x, y + 7, T, 1, '#9a6a38');
      R(x, y + 15, T, 1, '#9a6a38');
      R(x + (r % 2 ? 4 : 11), y, 1, 7, '#9a6a38');
      R(x + (r % 2 ? 12 : 5), y + 8, 1, 7, '#9a6a38');
      if (kind === 'rug') {
        R(x + 1, y, 14, T, '#a8324a');
        R(x + 1, y, 1, T, GOLD);
        R(x + 14, y, 1, T, GOLD);
        if (r % 2 === 0) { R(x + 6, y + 6, 4, 4, GOLD); R(x + 7, y + 7, 2, 2, '#a8324a'); }
      }
    } else {
      R(x, y, T, T, (c + r) % 2 ? '#b0aca8' : '#a29e9a');
      R(x, y + 15, T, 1, '#8e8a86');
    }
  }

  drawTall(R, m, c, r, t) {
    const ch = m.grid[r][c];
    if (FLOORS[ch]) return;
    const x = c * T, y = r * T, hs = hash(c * 3.7 + r * 9.1);
    const below = (m.grid[r + 1] || [])[c];
    switch (ch) {
      case 'B': {   // sebe de buxo
        R(x, y - 5, T, T + 5, '#2f7a40');
        R(x + 2 + Math.floor(hs * 9), y - 2, 3, 2, '#4f9a55');
        R(x + 10 - Math.floor(hs * 7), y + 3, 2, 2, '#4f9a55');
        R(x + 5, y + 6, 2, 1, '#256a36');
        if ((m.grid[r - 1] || [])[c] !== 'B') R(x, y - 5, T, 2, '#5fae62');
        if (below !== 'B') { R(x, y + 8, T, 8, '#1f5a30'); R(x, y + 15, T, 1, '#17452a'); R(x + 3 + Math.floor(hs * 8), y + 11, 2, 1, '#2f7a40'); }
        break;
      }
      case 'T':     // buxo talhado em cone
        R(x + 7, y + 10, 2, 5, '#6a4a2a');
        R(x + 2, y + 2, 12, 9, '#2f7a40');
        R(x + 4, y - 4, 8, 6, '#2f7a40');
        R(x + 6, y - 9, 4, 5, '#2f7a40');
        R(x + 4, y - 3, 2, 8, '#4f9a55');
        R(x + 6, y - 8, 1, 4, '#4f9a55');
        R(x + 2, y + 9, 12, 2, '#1f5a30');
        break;
      case 'f': {   // japoneira (camélia)
        R(x + 1, y + 4, 14, 10, '#2f7a45');
        R(x + 3, y + 2, 10, 2, '#2f7a45');
        R(x + 1, y + 12, 14, 2, '#1f5a30');
        const cols = ['#ff5d8f', '#ffffff', '#d43d51'];
        for (let k = 0; k < 4; k++) R(x + 3 + k * 3, y + 4 + ((k * 5 + c) % 3) * 3, 2, 2, cols[(k + c) % 3]);
        break;
      }
      case 't':     // árvore grande
        R(x + 6, y, 4, 14, '#6a4a2a');
        R(x - 8, y - 24, 32, 20, '#2a6a3a');
        R(x - 4, y - 30, 24, 8, '#2a6a3a');
        R(x - 11, y - 16, 38, 9, '#2a6a3a');
        R(x - 2, y - 27, 10, 4, '#3f8a4f');
        R(x - 7, y - 19, 8, 3, '#3f8a4f');
        R(x - 8, y - 6, 32, 2, '#1f5230');
        break;
      case 'F': {   // fonte
        R(x - 13, y - 3, 42, 19, '#8e8a96');
        R(x - 12, y - 4, 40, 19, '#c4c0cc');
        R(x - 9, y - 1, 34, 12, '#5fb8e8');
        for (let k = 0; k < 4; k++) R(x - 6 + ((Math.floor(t * 6) + k * 9) % 28), y + 1 + (k % 3) * 3, 4, 1, '#bfe6ff');
        R(x - 12, y + 12, 40, 3, '#a8a4b0');
        R(x + 5, y - 12, 6, 16, '#d8d4e0');
        R(x, y - 15, 16, 4, '#c4c0cc');
        R(x + 1, y - 14, 14, 1, '#5fb8e8');
        const jet = Math.floor(t * 8) % 3;
        R(x + 7, y - 24 + jet, 2, 9 - jet, '#bfe6ff');
        R(x + 3, y - 19 + jet, 2, 3, '#bfe6ff');
        R(x + 11, y - 20 + jet, 2, 3, '#bfe6ff');
        break;
      }
      case 's': {   // regador
        R(x + 6, y + 9, 4, 4, '#8a93a7');
        R(x + 7, y + 7, 2, 2, '#5a6478');
        const s = m.sprinklers.find((k) => k.x === c && k.y === r);
        if (s && this.sprinklerOn(s)) {
          const f = Math.floor(t * 10) % 3;
          for (let k = 0; k < 5; k++) {
            R(x + 7 - k * 2 - f, y + 5 - k * 2 + (k > 2 ? (k - 2) * 3 : 0), 2, 2, 'rgba(190,230,255,0.9)');
            R(x + 8 + k * 2 + f, y + 5 - k * 2 + (k > 2 ? (k - 2) * 3 : 0), 2, 2, 'rgba(190,230,255,0.9)');
          }
          R(x + 7, y - 6 + f, 2, 13 - f, 'rgba(190,230,255,0.9)');
        }
        break;
      }
      case 'R':     // telhado
        R(x, y, T, T, '#c2543a');
        for (let k = 0; k < 4; k++) R(x, y + k * 4 + 3, T, 1, '#9a3f2c');
        for (let k = 0; k < 4; k++) R(x + ((k % 2) * 4 + 2), y + k * 4, 1, 3, '#d8704e');
        R(x, y + 14, T, 2, '#7a3022');
        break;
      case 'W':
      case 'w':
      case 'b':
      case 'D':
      case 'd':
      case 'P':
        if (m.def.indoor) this.drawWallIn(R, m, ch, c, r, x, y, below, hs);
        else this.drawWallOut(R, m, ch, c, r, x, y);
        break;
      case 'C': {   // lareira
        R(x - 1, y - 6, 18, 22, '#6e6a66');
        R(x, y - 5, 16, 21, '#9a9690');
        R(x, y - 5, 16, 3, '#b8b4ae');
        R(x + 2, y + 2, 12, 14, INK);
        const f = Math.floor(t * 9) % 2;
        R(x + 4, y + 9 - f, 8, 7 + f, '#ff8a4b');
        R(x + 6, y + 7 + f, 4, 6, GOLD);
        R(x + 3, y + 14, 10, 2, '#5a3524');
        break;
      }
      case 'A': {   // altar
        R(x - 3, y + 3, 22, 13, '#ffffff');
        R(x - 3, y + 3, 22, 2, GOLD);
        R(x - 3, y + 13, 22, 3, '#d8d0c0');
        R(x + 7, y - 12, 2, 14, GOLD);
        R(x + 4, y - 8, 8, 2, GOLD);
        R(x - 1, y - 3, 2, 6, '#fff6e6');
        R(x + 15, y - 3, 2, 6, '#fff6e6');
        const f = Math.floor(t * 8) % 2;
        R(x - 1, y - 5 - f, 2, 2, '#ff8a4b');
        R(x + 15, y - 5 - f, 2, 2, '#ff8a4b');
        break;
      }
      case 'k': {   // estante
        R(x, y - 6, T, 22, '#5a3a20');
        const cols = ['#a8324a', '#3d6fb5', '#3f8f5a', '#c9a060', '#6a4a8a'];
        for (let s = 0; s < 3; s++) {
          R(x + 1, y - 5 + s * 7, 14, 6, '#3a2414');
          for (let k = 0; k < 6; k++) R(x + 2 + k * 2, y - 4 + s * 7 + ((k + c) % 2), 2, 5 - ((k + c) % 2), cols[(k + s * 2 + c) % 5]);
        }
        break;
      }
      case 'm':     // mesa
        R(x, y + 3, T, 9, '#6a4424');
        R(x, y + 3, T, 7, '#9a6a3c');
        R(x, y + 3, T, 1, '#b8834a');
        R(x + 1, y + 12, 2, 4, '#5a3a20');
        R(x + 13, y + 12, 2, 4, '#5a3a20');
        R(x + 3, y + 1, 5, 4, '#e8c890');
        R(x + 4, y + 1, 3, 1, '#fff0c8');
        R(x + 10, y - 2, 3, 6, '#7a4a9a');
        R(x + 11, y - 3, 1, 1, '#7a4a9a');
        break;
      case 'o':     // piano
        R(x - 2, y - 2, 20, 16, INK);
        R(x - 1, y - 1, 18, 9, '#1c1c2a');
        R(x - 1, y + 8, 18, 4, '#ffffff');
        for (let k = 0; k < 6; k++) R(x + 1 + k * 3, y + 8, 1, 2, INK);
        R(x + 3, y - 5, 10, 3, '#fff6e6');
        break;
      case 'n':     // banco da capela
        R(x + 1, y + 2, 14, 4, '#6a4424');
        R(x + 1, y + 6, 14, 6, '#9a6a3c');
        R(x + 1, y + 12, 2, 3, '#5a3a20');
        R(x + 13, y + 12, 2, 3, '#5a3a20');
        break;
      case 'v':     // jarrão de louça azul e branca
        R(x + 5, y + 2, 6, 12, '#ffffff');
        R(x + 4, y + 5, 8, 6, '#ffffff');
        R(x + 5, y + 6, 6, 1, '#3d6fb5');
        R(x + 6, y + 8, 4, 2, '#3d6fb5');
        R(x + 4, y + 13, 8, 1, '#b8c4d6');
        R(x + 6, y - 4, 1, 6, '#3f8f5a');
        R(x + 9, y - 3, 1, 5, '#3f8f5a');
        R(x + 5, y - 6, 3, 3, '#ff5d8f');
        R(x + 8, y - 5, 3, 3, '#ffffff');
        break;
    }
  }

  // Paredes vistas de dentro de casa.
  drawWallIn(R, m, ch, c, r, x, y, below, hs) {
    const face = below !== undefined && !'WPd'.includes(below) && below !== 'D';
    if (ch === 'D') {       // porta aberta para o jardim
      R(x, y, T, T, '#7fcf72');
      R(x, y, T, 5, '#bfe6ff');
      R(x, y, 2, T, '#5a3524');
      R(x + 14, y, 2, T, '#5a3524');
      R(x, y, T, 2, '#5a3524');
      return;
    }
    if (!face) { R(x, y, T, T, '#3a2c2a'); R(x, y, T, 1, '#4a3a36'); return; }
    R(x, y - 8, T, T + 8, '#e8dcc0');
    R(x, y - 8, T, 2, '#4a3a36');
    R(x, y + 9, T, 7, '#8a5a3c');
    R(x, y + 9, T, 1, '#a8744e');
    R(x + 7, y + 10, 1, 6, '#6e442c');
    if (ch === 'P') {       // retrato de um antepassado
      const hair = ['#3b2a20', '#8a8794', '#7a4526', '#d8d8e0'][c % 4], coat = ['#2a3358', '#5a2a3a', '#2f4a3a'][c % 3];
      R(x + 2, y - 6, 12, 13, GOLD);
      R(x + 3, y - 5, 10, 11, '#3a2a30');
      R(x + 6, y - 3, 4, 4, '#f6c9a0');
      R(x + 5, y - 4, 6, 2, hair);
      R(x + 5, y - 3, 1, 3, hair);
      R(x + 4, y + 1, 8, 5, coat);
      R(x + 7, y + 1, 2, 2, '#ffffff');
    } else if (ch === 'd') { // porta da rua, fechada
      R(x + 2, y - 5, 12, 21, '#3a2414');
      R(x + 3, y - 4, 10, 20, '#6a4424');
      R(x + 7, y - 4, 1, 20, '#3a2414');
      R(x + 9, y + 6, 2, 2, GOLD);
    }
  }

  // Fachada do solar vista do jardim: paredes brancas, cantarias de granito.
  drawWallOut(R, m, ch, c, r, x, y) {
    R(x, y, T, T, '#f2ece0');
    if (c === 0 || c === m.cols - 1) {      // cunhais de granito
      for (let k = 0; k < 4; k++) R(x + (c === 0 ? 0 : 8 + (k % 2) * 2), y + k * 4, 6 + (k % 2) * 2, 3, '#a8a4a0');
    }
    const ground = (m.grid[r + 1] || [])[c] !== 'W' && !'wbD'.includes((m.grid[r + 1] || [])[c] || '');
    if (ground) R(x, y + 12, T, 4, '#a8a4a0');
    if (ch === 'w') {
      R(x + 1, y + 1, 14, 13, '#a8a4a0');
      R(x + 3, y + 3, 10, 10, '#4a7aa8');
      R(x + 7, y + 3, 2, 10, '#ffffff');
      R(x + 3, y + 7, 10, 1, '#ffffff');
      R(x, y + 13, T, 2, '#8e8a86');
    } else if (ch === 'D') {
      R(x - 2, y - 6, 20, 22, '#a8a4a0');
      R(x, y - 3, T, 19, '#5a3524');
      R(x + 7, y - 3, 2, 19, '#3a2414');
      R(x + 4, y + 6, 2, 2, GOLD);
      R(x + 10, y + 6, 2, 2, GOLD);
    } else if (ch === 'b') {  // brasão de armas em granito
      R(x + 1, y - 2, 14, 15, '#8e8a86');
      R(x + 2, y - 1, 12, 11, '#c4c0bc');
      R(x + 4, y + 10, 8, 2, '#c4c0bc');
      R(x + 6, y + 12, 4, 1, '#c4c0bc');
      R(x + 7, y, 2, 10, '#8e8a86');
      R(x + 3, y + 4, 10, 2, '#8e8a86');
      R(x + 4, y - 5, 8, 3, '#c4c0bc');
      R(x + 4, y - 6, 2, 1, '#c4c0bc');
      R(x + 7, y - 6, 2, 1, '#c4c0bc');
      R(x + 10, y - 6, 2, 1, '#c4c0bc');
    }
  }
}
