// Cena de jogo: um nível de plataformas.
import { TILE as T, PHYS } from '../config.js';
import { LEVELS, buildGrid } from '../levels/index.js';
import { THEMES, drawBackground, getTiles } from '../themes.js';
import { getCharacter, charFrame, getSprites, partnerOf, drawSign, drawCheckpoint, drawArch, drawCrib } from '../sprites.js';
import { Particles } from '../fx.js';

const PW = 10, PH = 20;        // caixa de colisão do jogador (o sprite tem 16x24)
const TRAIL = 16;              // atraso (em passos) com que o par segue o jogador
const NO_INPUT = { left: false, right: false, jump: false, jumpPressed: false };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

export class PlayScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.theme = THEMES[this.level.theme] || THEMES.park;
    this.tiles = getTiles(this.theme);
    this.sprites = getSprites();
    this.t = 0;
    this.state = 'intro';      // intro → play ⇄ hurt → won → done
    this.paused = false;
  }

  enter() {
    this.load();
    this.game.ui.showStory(this.index);
  }

  exit() {
    this.game.ui.setLevelMode(false, false);
  }

  // Lê o mapa do nível e coloca jogador, corações, inimigos e meta.
  load() {
    const L = this.level;
    const me = this.game.save.data.character;
    this.grid = buildGrid(L.chunks, L.rows);
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.W = this.cols * T;
    this.H = this.rows * T;
    this.hearts = [];
    this.walkers = [];
    this.checks = [];
    let start = { x: 1, y: this.rows - 3 };
    let goal = { x: this.cols - 3, y: this.rows - 3 };
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const ch = this.grid[y][x];
        if (ch === '.' || ch === '#' || ch === '-' || ch === '^') continue;
        if (ch === 'P') start = { x, y };
        else if (ch === 'G') goal = { x, y };
        else if (ch === 'h') this.hearts.push({ x: x * T + 8, y: y * T + 8, got: false, ph: (x * 0.9) % 6 });
        else if (ch === 'w') this.walkers.push({ x: x * T + 1, y: (y + 1) * T - 10, w: 14, h: 10, dir: -1, x0: x * T + 1, dead: false });
        else if (ch === 'C') this.checks.push({ x: x * T + 8, y: (y + 1) * T, on: false });
        this.grid[y][x] = '.';
      }
    }
    this.goal = { x: goal.x * T + 8, y: (goal.y + 1) * T };
    this.spawn = { x: start.x * T + (T - PW) / 2, y: (start.y + 1) * T - PH };
    this.me = getCharacter(me, L.outfit);
    this.partner = getCharacter(partnerOf(me), L.outfit);
    this.player = { x: this.spawn.x, y: this.spawn.y, w: PW, h: PH, vx: 0, vy: 0, facing: 1, onGround: true, coyote: 0, buffer: 0, invuln: 0, dist: 0 };
    this.comp = L.companion ? { x: this.spawn.x - 14, y: this.spawn.y, facing: 1, moving: false, air: false, dist: 0 } : null;
    this.trail = [];
    this.fx = new Particles();
    this.got = 0;
    this.timer = 0;
    this.camX = 0;
    this.camY = 0;
    this.updateCamera(0, true);
  }

  begin() {
    this.state = 'play';
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.hearts.length, this.level.title);
    this.game.ui.setLevelMode(true, true);
  }

  restart() {
    this.load();
    this.begin();
  }

  togglePause() {
    if (this.state !== 'play' && this.state !== 'hurt') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  // Chamado quando o ecrã muda de tamanho ou de orientação.
  onResize() {
    if (this.player) this.updateCamera(0, true);
  }

  // Chamado quando a janela perde o foco.
  autoPause() {
    if (!this.paused && this.state === 'play') this.togglePause();
  }

  // ---------- Mapa ----------
  tile(tx, ty) {
    if (tx < 0 || tx >= this.cols) return '#';
    if (ty < 0 || ty >= this.rows) return '.';
    return this.grid[ty][tx];
  }

  solid(tx, ty) { return this.tile(tx, ty) === '#'; }

  moveX(e, dx) {
    e.x += dx;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    if (dx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / T);
      for (let ty = y0; ty <= y1; ty++) if (this.solid(tx, ty)) { e.x = tx * T - e.w; e.vx = 0; break; }
    } else if (dx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++) if (this.solid(tx, ty)) { e.x = (tx + 1) * T; e.vx = 0; break; }
    }
  }

  moveY(e, dy) {
    const prevBottom = e.y + e.h;
    e.y += dy;
    e.onGround = false;
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
    if (dy >= 0) {
      const ty = Math.floor((e.y + e.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const c = this.tile(tx, ty);
        if (c === '#' || (c === '-' && prevBottom <= ty * T + 0.01)) {
          e.y = ty * T - e.h;
          e.vy = 0;
          e.onGround = true;
          break;
        }
      }
    } else {
      const ty = Math.floor(e.y / T);
      for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) { e.y = (ty + 1) * T; e.vy = 0; break; }
    }
  }

  // ---------- Atualização ----------
  update(dt) {
    this.t += dt;
    if (this.paused) return;
    this.fx.update(dt);
    if (this.state === 'play') {
      this.stepPlayer(dt, this.game.input);
      this.stepWorld(dt);
    } else if (this.state === 'hurt') {
      this.timer -= dt;
      if (this.timer <= 0) this.respawn();
    } else if (this.state === 'won') {
      this.stepPlayer(dt, NO_INPUT);
      this.timer += dt;
      if (Math.floor(this.timer * 7) !== Math.floor((this.timer - dt) * 7)) {
        this.fx.heart(this.goal.x - 12 + Math.random() * 24, this.goal.y - 26, Math.random() < 0.3 ? '#ffd166' : '#ff5d8f');
      }
      if (this.timer > 1.9) this.finish();
    }
    this.updateCamera(dt, false);
  }

  stepPlayer(dt, I) {
    const p = this.player;
    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (dir) {
      p.vx = approach(p.vx, dir * PHYS.speed, PHYS.accel * dt);
      p.facing = dir;
    } else {
      p.vx = approach(p.vx, 0, PHYS.friction * dt);
    }

    p.coyote = p.onGround ? PHYS.coyote : p.coyote - dt;
    p.buffer = I.jumpPressed ? PHYS.buffer : p.buffer - dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -PHYS.jump;
      p.buffer = 0;
      p.coyote = 0;
      this.game.audio.play('jump');
    }
    // Largar o botão a meio da subida encurta o salto.
    if (!I.jump && p.vy < -PHYS.jump * PHYS.cut) p.vy = -PHYS.jump * PHYS.cut;
    p.vy = Math.min(p.vy + PHYS.gravity * dt, PHYS.maxFall);

    const ox = p.x, oy = p.y;
    this.moveX(p, p.vx * dt);
    this.moveY(p, p.vy * dt);
    p.dist += Math.abs(p.x - ox);
    if (p.invuln > 0) p.invuln -= dt;

    this.stepCompanion(Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.05);
  }

  // O par repete o caminho do jogador com um pequeno atraso.
  stepCompanion(moved) {
    const c = this.comp, p = this.player;
    if (!c) return;
    if (moved) this.trail.push({ x: p.x, y: p.y, facing: p.facing, air: !p.onGround });
    const catchUp = !moved && this.trail.length > 0 && (c.air || Math.abs(c.x - p.x) > 16);
    if (this.trail.length > TRAIL || catchUp) {
      const s = this.trail.shift();
      c.dist += Math.abs(s.x - c.x);
      c.moving = true;
      c.x = s.x; c.y = s.y; c.facing = s.facing; c.air = s.air;
    } else {
      c.moving = false;
    }
  }

  stepWorld(dt) {
    const p = this.player;
    const cx = p.x + PW / 2, cy = p.y + PH / 2;

    // Corações
    for (const h of this.hearts) {
      if (h.got || Math.abs(cx - h.x) > 9 || Math.abs(cy - h.y) > 12) continue;
      h.got = true;
      this.got++;
      this.fx.burst(h.x, h.y, 8, ['#ff5d8f', '#ffd1e0', '#ffffff'], 50);
      this.game.audio.play('heart');
      this.game.ui.setHud(this.got, this.hearts.length, this.level.title);
    }

    // Pontos de passagem
    for (const c of this.checks) {
      if (c.on || cx < c.x) continue;
      c.on = true;
      this.spawn = { x: c.x - PW / 2, y: c.y - PH };
      this.fx.burst(c.x, c.y - 18, 10, ['#ff5d8f', '#ffd166'], 40);
      this.game.audio.play('check');
    }

    // Nuvens cinzentas: saltar-lhes em cima afasta-as; tocar-lhes de lado magoa.
    for (const w of this.walkers) {
      if (w.dead) continue;
      w.x += w.dir * 20 * dt;
      const front = w.dir > 0 ? w.x + w.w + 1 : w.x - 1;
      const tx = Math.floor(front / T);
      const mid = this.tile(tx, Math.floor((w.y + w.h / 2) / T));
      const below = this.tile(tx, Math.floor((w.y + w.h + 2) / T));
      if (mid === '#' || mid === '^' || (below !== '#' && below !== '-')) {
        w.dir *= -1;
        w.x += w.dir * 20 * dt * 2;
      } else if (w.x - w.x0 > 44) w.dir = -1;
      else if (w.x - w.x0 < -44) w.dir = 1;

      if (p.x < w.x + w.w && p.x + PW > w.x && p.y < w.y + w.h && p.y + PH > w.y) {
        if (p.vy > 0 && p.y + PH - w.y < 9) {
          w.dead = true;
          p.vy = -210;
          this.fx.burst(w.x + 7, w.y + 5, 12, ['#8b93a7', '#d8dce6', '#ffffff'], 60);
          this.game.audio.play('stomp');
        } else {
          this.hurt();
        }
      }
    }

    // Espinhos (só a metade de baixo do bloco magoa)
    const tx0 = Math.floor(p.x / T), tx1 = Math.floor((p.x + PW - 0.01) / T);
    const ty0 = Math.floor(p.y / T), ty1 = Math.floor((p.y + PH - 0.01) / T);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.tile(tx, ty) !== '^') continue;
        if (p.x + PW > tx * T + 3 && p.x < tx * T + 13 && p.y + PH > ty * T + 9) this.hurt();
      }
    }

    // Cair num buraco
    if (p.y > this.H + 24) this.hurt(true);

    // Meta
    if (this.state === 'play' && Math.abs(cx - this.goal.x) < 14 && Math.abs(p.y + PH - this.goal.y) < 24) this.win();
  }

  hurt(force) {
    const p = this.player;
    if (this.state !== 'play' || (!force && p.invuln > 0)) return;
    this.state = 'hurt';
    this.timer = 0.55;
    this.fx.burst(p.x + PW / 2, Math.min(p.y + PH / 2, this.H - 8), 14, ['#ffffff', '#ff5d8f', '#ffd166'], 70);
    this.game.audio.play('hurt');
  }

  respawn() {
    const p = this.player;
    p.x = this.spawn.x; p.y = this.spawn.y;
    p.vx = 0; p.vy = 0;
    p.onGround = true;
    p.invuln = 1.4;
    this.trail = [];
    if (this.comp) Object.assign(this.comp, { x: p.x - 14, y: p.y, air: false, moving: false, facing: 1 });
    this.state = 'play';
    this.updateCamera(0, true);
  }

  win() {
    this.state = 'won';
    this.timer = 0;
    this.player.facing = this.goal.x >= this.player.x ? 1 : -1;
    this.game.ui.setLevelMode(true, false);
    this.game.audio.play('win');
    this.fx.burst(this.goal.x, this.goal.y - 20, 18, ['#ff5d8f', '#ffd166', '#ffffff'], 80);
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.hearts.length);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.hearts.length);
  }

  updateCamera(dt, snap) {
    const v = this.game.view, p = this.player;
    const visH = v.h - v.pad;
    const k = snap ? 1 : Math.min(1, dt * 6);
    const maxX = this.W - v.w;
    const tx = maxX <= 0 ? maxX / 2 : clamp(p.x + PW / 2 - v.w / 2 + p.facing * 12, 0, maxX);
    this.camX += (tx - this.camX) * k;
    // Níveis mais baixos que o ecrã ficam encostados ao fundo; os mais altos seguem o jogador.
    const maxY = this.H - visH;
    const ty = maxY <= 0 ? maxY : clamp(p.y + PH / 2 - visH * 0.6, 0, maxY);
    this.camY += (ty - this.camY) * k;
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const visH = v.h - v.pad;
    const camX = Math.round(this.camX), camY = Math.round(this.camY);
    const gy = this.H - 2 * T - camY;
    drawBackground(this.theme, ctx, v.w, v.h, Math.max(0, this.camX), gy, this.t);

    // Blocos visíveis
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(this.cols - 1, Math.floor((camX + v.w) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(this.rows - 1, Math.floor((camY + visH) / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.grid[y][x];
        if (ch === '.') continue;
        let img = this.tiles.body;
        if (ch === '#') { if (y === 0 || this.grid[y - 1][x] !== '#') img = this.tiles.top; }
        else if (ch === '-') img = this.tiles.platform;
        else if (ch === '^') img = this.tiles.hazard;
        ctx.drawImage(img, x * T - camX, y * T - camY);
      }
    }

    this.drawGoal(ctx, camX, camY);
    for (const c of this.checks) drawCheckpoint(ctx, Math.round(c.x - camX), Math.round(c.y - camY), c.on, this.t);

    for (const h of this.hearts) {
      if (h.got) continue;
      const bob = Math.round(Math.sin(this.t * 4 + h.ph) * 1.5);
      ctx.drawImage(this.sprites.heart, Math.round(h.x - camX) - 4, Math.round(h.y - camY) - 4 + bob);
    }

    for (const w of this.walkers) {
      if (w.dead) continue;
      const hop = Math.floor(this.t * 6 + w.x0) % 2;
      ctx.drawImage(this.sprites.walker, Math.round(w.x - camX), Math.round(w.y - camY) - hop);
    }

    if (this.state !== 'hurt') {
      const p = this.player, c = this.comp;
      if (c) {
        const img = charFrame(this.partner, c.facing, c.moving, c.air, c.dist);
        ctx.drawImage(img, Math.round(c.x - camX) - 3, Math.round(c.y - camY) - 4);
      }
      if (!(p.invuln > 0 && Math.floor(p.invuln * 12) % 2)) {
        const img = charFrame(this.me, p.facing, Math.abs(p.vx) > 8, !p.onGround, p.dist);
        ctx.drawImage(img, Math.round(p.x - camX) - 3, Math.round(p.y - camY) - 4);
      }
    }

    this.fx.draw(ctx, camX, camY);

    // Em retrato com ecrã tátil, a faixa de baixo fica reservada aos botões.
    if (v.pad > 0) {
      ctx.fillStyle = '#1a1433';
      ctx.fillRect(0, v.h - v.pad, v.w, v.pad);
      ctx.fillStyle = '#2d2452';
      ctx.fillRect(0, v.h - v.pad, v.w, 2);
    }
  }

  drawGoal(ctx, camX, camY) {
    const g = this.goal, kind = this.level.goal;
    const x = Math.round(g.x - camX), y = Math.round(g.y - camY);
    if (kind === 'altar') drawArch(ctx, x, y);
    if (kind === 'partner' || kind === 'altar') {
      const img = this.partner.stand[this.player.x < g.x ? 'l' : 'r'];
      ctx.drawImage(img, x - 8, y - 24);
      if (this.state !== 'won') {
        const bob = Math.round(Math.sin(this.t * 4) * 1.5);
        ctx.drawImage(this.sprites.heart, x - 4, y - 36 + bob);
      }
    } else if (kind === 'crib') {
      drawCrib(ctx, x, y, this.level.baby || '#8fc4ff');
    } else {
      drawSign(ctx, x, y, this.t);
    }
  }
}
