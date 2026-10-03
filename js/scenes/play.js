// Cena de jogo: um nível de plataformas.
import { TILE as T, PHYS } from '../config.js';
import { LEVELS, buildGrid } from '../levels/index.js';
import { THEMES, drawBackground, getTiles } from '../themes.js';
import { getCharacter, charFrame, getSprites, partnerOf, drawSign, drawCheckpoint, drawItem, drawHouse, drawCamp, getHuskies } from '../sprites.js';
import { Particles } from '../fx.js';
import { AuroraScene } from './aurora.js';

// Cenas que podem continuar o nível depois de se chegar à meta (`then` no ficheiro do nível).
const NEXT = { aurora: AuroraScene };

const PW = 10, PH = 20;        // caixa de colisão do jogador (o sprite tem 16x24)
const TRAIL = 16;              // atraso (em passos) com que o par segue o jogador
const SLED_SPEED = 125;        // velocidade do carro de cesto (px/s)
const NO_INPUT = { left: false, right: false, jump: false, jumpPressed: false };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

export class PlayScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.theme = THEMES[this.level.theme] || THEMES.park;
    this.sprites = getSprites();
    this.usesPad = true;       // joga-se com os botões táteis ◀ ▶ ▲ (ver js/layout.js)
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

  // Lê o mapa do nível e coloca jogador, corações, inimigos, família e meta.
  load() {
    const L = this.level;
    const me = this.game.save.data.character;
    this.grid = buildGrid(L.chunks, L.rows);
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
    this.W = this.cols * T;
    this.H = this.rows * T;

    // Zonas: um nível pode mudar de ambiente a meio. Na lista de troços, um objeto
    // { zone: 'tema', base: altura } marca onde começa uma zona nova.
    this.zones = [];
    let col = 0;
    for (const c of L.chunks) {
      if (Array.isArray(c)) col += Math.max(...c.map((r) => r.length));
      else this.zones.push({ x: col, theme: THEMES[c.zone] || this.theme, base: c.base || 0 });
    }
    this.zoned = this.zones.length > 0;
    if (!this.zoned) this.zones.push({ x: 0, theme: this.theme, base: 0 });
    this.colTiles = [];
    for (let x = 0, zi = 0; x < this.cols; x++) {
      while (zi + 1 < this.zones.length && x >= this.zones[zi + 1].x) zi++;
      this.colTiles.push(getTiles(this.zones[zi].theme));
    }

    this.hearts = [];
    this.items = [];
    this.walkers = [];
    this.checks = [];
    this.npcs = [];
    this.sled = null;          // troço de carro de cesto: { from, to, x, y }
    let start = { x: 1, y: this.rows - 3 };
    let goal = { x: this.cols - 3, y: this.rows - 3 };
    let sledTo = this.cols;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const ch = this.grid[y][x];
        if (ch === '.' || ch === '#' || ch === '-' || ch === '^') continue;
        if (ch === 'P') start = { x, y };
        else if (ch === 'G') goal = { x, y };
        else if (ch === 'h') this.hearts.push({ x: x * T + 8, y: y * T + 8, got: false, ph: (x * 0.9) % 6 });
        else if (ch === 'w') this.walkers.push({ x: x * T + 1, y: (y + 1) * T - 10, w: 14, h: 10, dir: -1, x0: x * T + 1, dead: false });
        else if (ch === 'C') this.checks.push({ x: x * T + 8, y: (y + 1) * T, on: false });
        else if (ch === 'N') this.npcs.push({ x: x * T + 8, y: (y + 1) * T, met: false, metT: 0 });
        else if (ch === 'S') this.sled = { from: x * T, to: 0, x: x * T + 3, y: (y + 1) * T - PH, seen: false };
        else if (ch === 'F') sledTo = x;
        else if (ch >= '1' && ch <= '9') this.items.push({ x: x * T + 8, y: y * T + 8, got: false, def: (L.items || [])[Number(ch) - 1] || { kind: 'banana', name: '' } });
        this.grid[y][x] = '.';
      }
    }
    if (this.sled) this.sled.to = sledTo * T;
    // Família pelo caminho: pela ordem em que aparece no nível
    this.npcs.sort((a, b) => a.x - b.x);
    this.npcs.forEach((n, i) => {
      n.def = (L.npcs || [])[i] || { look: 'carreiro', line: '' };
      n.frames = getCharacter(n.def.look);
    });
    // Quem aparece à porta de casa no final: só a família, cada pessoa uma vez
    this.family = this.npcs.filter((n, i) => n.def.family && this.npcs.findIndex((m) => m.def.look === n.def.look) === i);
    this.host = L.host ? getCharacter(L.host.look) : null;
    this.total = this.hearts.length + this.items.length;

    this.goal = { x: goal.x * T + 8, y: (goal.y + 1) * T };
    this.spawn = { x: start.x * T + (T - PW) / 2, y: (start.y + 1) * T - PH };
    this.me = getCharacter(me, L.outfit);
    this.partner = getCharacter(partnerOf(me), L.outfit);
    this.player = { x: this.spawn.x, y: this.spawn.y, w: PW, h: PH, vx: 0, vy: 0, facing: 1, onGround: true, coyote: 0, buffer: 0, invuln: 0, dist: 0, sled: false };
    this.comp = L.companion ? { x: this.spawn.x - 14, y: this.spawn.y, facing: 1, moving: false, air: false, dist: 0 } : null;
    this.trail = [];
    this.fx = new Particles();
    this.got = 0;
    this.timer = 0;
    this.hintT = 0;
    this.camX = 0;
    this.camY = 0;
    this.updateCamera(0, true);
  }

  begin() {
    this.state = 'play';
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
  }

  restart() {
    this.load();
    this.game.ui.setHint('');
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

  // Mostra uma frase no topo do ecrã durante uns segundos.
  hint(text, secs = 4) {
    if (!text) return;
    this.game.ui.setHint(this.game.ui.fmt(text));
    this.hintT = secs;
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
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) this.game.ui.setHint('');
    }
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
      if (this.timer > (this.host ? 3.4 : 1.9)) this.finish();
    }
    this.updateCamera(dt, false);
  }

  stepPlayer(dt, I) {
    const p = this.player;

    // Carro de cesto: entre as marcas S e F anda sozinho, só dá para saltar.
    const s = this.sled;
    const riding = !!s && this.state === 'play' && p.x >= s.from && p.x < s.to;
    if (riding !== p.sled) this.setSled(riding);

    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (p.sled) {
      p.vx = SLED_SPEED;
      p.facing = 1;
    } else if (dir) {
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

    if (!p.sled) this.stepCompanion(Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.05);
  }

  setSled(on) {
    const p = this.player, s = this.sled;
    p.sled = on;
    this.trail = [];
    if (on) {
      if (!s.seen) {
        s.seen = true;
        this.spawn = { x: s.x, y: s.y };
      }
    } else {
      p.vx = 60;
      if (this.comp) Object.assign(this.comp, { x: p.x - 14, y: p.y, air: !p.onGround, moving: false, facing: 1 });
      this.fx.burst(p.x + 5, p.y + PH, 12, ['#e8c878', '#ffffff', '#c9a060'], 60);
      this.game.audio.play('check');
      this.hint(this.level.sledEnd, 3);
    }
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

  collect() {
    this.got++;
    this.game.audio.play('heart');
    this.game.ui.setHud(this.got, this.total, this.level.title);
  }

  stepWorld(dt) {
    const p = this.player;
    const cx = p.x + PW / 2, cy = p.y + PH / 2;

    // Corações
    for (const h of this.hearts) {
      if (h.got || Math.abs(cx - h.x) > 9 || Math.abs(cy - h.y) > 12) continue;
      h.got = true;
      this.fx.burst(h.x, h.y, 8, ['#ff5d8f', '#ffd1e0', '#ffffff'], 50);
      this.collect();
    }

    // Iguarias e outros objetos especiais (contam como corações)
    for (const it of this.items) {
      if (it.got || Math.abs(cx - it.x) > 10 || Math.abs(cy - it.y) > 13) continue;
      it.got = true;
      this.fx.burst(it.x, it.y, 12, ['#ffd166', '#ffffff', '#ff5d8f'], 60);
      this.collect();
      this.hint(it.def.name, 3);
    }

    // Pontos de passagem
    for (const c of this.checks) {
      if (c.on || cx < c.x) continue;
      c.on = true;
      this.spawn = { x: c.x - PW / 2, y: c.y - PH };
      this.fx.burst(c.x, c.y - 18, 10, ['#ff5d8f', '#ffd166'], 40);
      this.game.audio.play('check');
    }

    // Quem se encontra pelo caminho cumprimenta (e serve de ponto de passagem)
    for (const n of this.npcs) {
      if (n.met || cx < n.x - 18) continue;
      n.met = true;
      n.metT = this.t;
      this.spawn = { x: n.x - 26, y: n.y - PH };
      this.fx.heart(n.x, n.y - 30);
      this.fx.heart(n.x + 6, n.y - 34, '#ffd166');
      this.game.audio.play('check');
      this.hint(n.def.line, 5);
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
        if (p.x + PW > tx * T + 3 && p.x < tx * T + 13 && p.y + PH > ty * T + 9) this.hurt(p.sled);
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
    p.sled = false;
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
    if (this.level.host) this.hint(this.level.host.line, 9);
  }

  finish() {
    this.state = 'done';
    const Next = NEXT[this.level.then];
    if (Next) {
      this.game.setScene(new Next(this.game, this.index, { got: this.got, total: this.total }));
      return;
    }
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  updateCamera(dt, snap) {
    const v = this.game.view, p = this.player;
    const k = snap ? 1 : Math.min(1, dt * 6);
    const maxX = this.W - v.w;
    const ahead = p.sled ? 56 : p.facing * 12;
    const tx = maxX <= 0 ? maxX / 2 : clamp(p.x + PW / 2 - v.w / 2 + ahead, 0, maxX);
    this.camX += (tx - this.camX) * k;
    // Níveis mais baixos que o ecrã ficam encostados ao fundo; os mais altos seguem o jogador.
    const maxY = this.H - v.h;
    const ty = maxY <= 0 ? maxY : clamp(p.y + PH / 2 - v.h * 0.6, 0, maxY);
    this.camY += (ty - this.camY) * k;
  }

  // ---------- Desenho ----------
  drawBackdrop(ctx, v, camY) {
    const camX = Math.max(0, this.camX);
    if (!this.zoned) {
      drawBackground(this.theme, ctx, v.w, v.h, camX, this.H - 2 * T - camY, this.t);
      return;
    }
    // Com zonas a alturas diferentes: quando o jogador está no chão da zona (à altura `base`),
    // o horizonte do cenário coincide com esse chão; quando sobe ou desce, acompanha só em parte.
    const maxY = this.H - v.h;
    const gyOf = (z) => {
      const surface = this.H - (2 + z.base) * T;
      const cam0 = maxY <= 0 ? maxY : clamp(surface - PH / 2 - v.h * 0.6, 0, maxY);
      const s0 = surface - cam0;
      return Math.round(s0 + (surface - camY - s0) * 0.3);
    };
    const cx = this.camX + v.w / 2;
    let zi = 0;
    while (zi + 1 < this.zones.length && cx >= this.zones[zi + 1].x * T) zi++;
    const z = this.zones[zi], next = this.zones[zi + 1];
    drawBackground(z.theme, ctx, v.w, v.h, camX, gyOf(z), this.t);
    if (next) {
      const d = next.x * T - cx;
      if (d < 80) {
        ctx.globalAlpha = clamp(1 - d / 80, 0, 1);
        drawBackground(next.theme, ctx, v.w, v.h, camX, gyOf(next), this.t);
        ctx.globalAlpha = 1;
      }
    }
  }

  draw(ctx, v) {
    const camX = Math.round(this.camX), camY = Math.round(this.camY);
    this.drawBackdrop(ctx, v, camY);

    // Blocos visíveis
    const x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(this.cols - 1, Math.floor((camX + v.w) / T));
    const y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(this.rows - 1, Math.floor((camY + v.h) / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.grid[y][x];
        if (ch === '.') continue;
        const tiles = this.colTiles[x];
        let img = tiles.body;
        if (ch === '#') { if (y === 0 || this.grid[y - 1][x] !== '#') img = tiles.top; }
        else if (ch === '-') img = tiles.platform;
        else if (ch === '^') img = tiles.hazard;
        ctx.drawImage(img, x * T - camX, y * T - camY);
      }
    }

    this.drawGoal(ctx, camX, camY);
    for (const c of this.checks) drawCheckpoint(ctx, Math.round(c.x - camX), Math.round(c.y - camY), c.on, this.t);

    const p = this.player;
    for (const n of this.npcs) {
      if (this.state === 'won' && this.host) continue;        // no fim juntam-se todos à porta de casa
      if (n.def.rides && p.sled) continue;                    // vai a conduzir o carro de cesto
      const hop = n.met && this.t - n.metT < 1.2 ? Math.round(Math.abs(Math.sin((this.t - n.metT) * 10)) * 3) : 0;
      const img = n.frames.stand[p.x < n.x ? 'l' : 'r'];
      ctx.drawImage(img, Math.round(n.x - camX) - 8, Math.round(n.y - camY) - 24 - hop);
    }

    for (const h of this.hearts) {
      if (h.got) continue;
      const bob = Math.round(Math.sin(this.t * 4 + h.ph) * 1.5);
      ctx.drawImage(this.sprites.heart, Math.round(h.x - camX) - 4, Math.round(h.y - camY) - 4 + bob);
    }
    for (const it of this.items) {
      if (it.got) continue;
      const bob = Math.round(Math.sin(this.t * 3 + it.x) * 2);
      drawItem(ctx, it.def.kind, Math.round(it.x - camX) - 5, Math.round(it.y - camY) - 5 + bob);
    }

    for (const w of this.walkers) {
      if (w.dead) continue;
      const hop = Math.floor(this.t * 6 + w.x0) % 2;
      ctx.drawImage(this.sprites.walker, Math.round(w.x - camX), Math.round(w.y - camY) - hop);
    }

    if (this.state !== 'hurt') {
      const c = this.comp;
      const px = Math.round(p.x - camX) - 3, py = Math.round(p.y - camY) - 4;
      if (p.sled) {
        this.drawSled(ctx, px, py);
      } else {
        if (c) {
          const img = charFrame(this.partner, c.facing, c.moving, c.air, c.dist);
          ctx.drawImage(img, Math.round(c.x - camX) - 3, Math.round(c.y - camY) - 4);
        }
        if (!(p.invuln > 0 && Math.floor(p.invuln * 12) % 2)) {
          const img = charFrame(this.me, p.facing, Math.abs(p.vx) > 8, !p.onGround, p.dist);
          ctx.drawImage(img, px, py);
        }
      }
    }

    this.fx.draw(ctx, camX, camY);
  }

  // Carro de cesto: o casal sentado no cesto de vime e o carreiro atrás, de pé no patim.
  drawSled(ctx, px, py) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
    const driver = this.npcs.find((n) => n.def.rides);
    const jig = this.player.onGround ? Math.floor(this.t * 16) % 2 : 0;
    if (this.level.sledStyle === 'husky') {
      // Trenó de madeira puxado por huskies, com o guia atrás
      const dogs = getHuskies(), f = Math.floor(this.t * 10) % 2;
      R(20, 18, 34, 1, '#5a3524');
      ctx.drawImage(dogs[f], px + 30, py + 13 + f);
      ctx.drawImage(dogs[1 - f], px + 48, py + 13 + (1 - f));
      if (driver) ctx.drawImage(driver.frames.stand.r, px - 22, py - 2 + jig);
      ctx.drawImage(this.partner.stand.r, px - 8, py - 2 + jig);
      ctx.drawImage(this.me.stand.r, px + 4, py - 2 + jig);
      R(-11, 12 + jig, 34, 10, '#2b1d2e');
      R(-10, 13 + jig, 32, 8, '#8a5a34');
      R(-10, 13 + jig, 32, 4, '#d43d51');
      R(-10, 16 + jig, 32, 1, '#fff6e6');
      R(-13, 4 + jig, 2, 18, '#5a3524');
      R(-16, 22, 44, 2, '#5a3524');
      R(27, 18, 2, 5, '#5a3524');
      if (this.player.onGround) for (let i = 0; i < 4; i++) R(-22 - ((Math.floor(this.t * 30) + i * 6) % 16), 20 - (i % 3) * 2, 3, 2, '#ffffff');
      return;
    }
    if (driver) ctx.drawImage(driver.frames.stand.r, px - 22, py - 2 + jig);
    ctx.drawImage(this.partner.stand.r, px - 8, py - 3 + jig);
    ctx.drawImage(this.me.stand.r, px + 4, py - 3 + jig);
    // cesto de vime
    R(-11, 11 + jig, 34, 11, '#2b1d2e');
    R(-10, 12 + jig, 32, 9, '#c9a060');
    for (let i = 0; i < 8; i++) R(-9 + i * 4, 13 + jig + (i % 2) * 2, 2, 6, '#a8803a');
    R(-10, 12 + jig, 32, 1, '#e8c878');
    R(22, 9 + jig, 3, 9, '#2b1d2e');
    R(23, 10 + jig, 1, 7, '#c9a060');
    // patins de madeira
    R(-16, 22, 44, 2, '#5a3524');
    R(27, 19, 2, 4, '#5a3524');
    // linhas de velocidade
    if (this.player.onGround) for (let i = 0; i < 3; i++) R(-34 - ((Math.floor(this.t * 30) + i * 7) % 14), 8 + i * 6, 8, 1, 'rgba(255,255,255,0.7)');
  }

  drawGoal(ctx, camX, camY) {
    const g = this.goal, kind = this.level.goal;
    const x = Math.round(g.x - camX), y = Math.round(g.y - camY);
    if (kind === 'camp') { drawCamp(ctx, x + 30, y, this.t); return; }
    if (kind === 'house') {
      drawHouse(ctx, x + 30, y);
      const won = this.state === 'won' || this.state === 'done';
      const hop = won ? Math.round(Math.abs(Math.sin(this.t * 7)) * 3) : 0;
      if (this.host) ctx.drawImage(this.host.stand[this.player.x < g.x ? 'l' : 'r'], x + 2, y - 24 - hop);
      // quando o casal chega, a família toda junta-se à porta
      if (won) {
        this.family.forEach((n, i) => {
          const h2 = Math.round(Math.abs(Math.sin(this.t * 7 + i * 1.3)) * 3);
          ctx.drawImage(n.frames.stand.l, x + 58 + i * 17, y - 24 - h2);
        });
      } else {
        const bob = Math.round(Math.sin(this.t * 4) * 1.5);
        ctx.drawImage(this.sprites.heart, x + 6, y - 36 + bob);
      }
    } else {
      drawSign(ctx, x, y, this.t);      // qualquer outra meta: uma placa com bandeira
    }
  }
}
