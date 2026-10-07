// Final do jogo.
// variant 'wedding' → animação do casamento: a cerimónia na igreja (com a família toda nos bancos
//                     e a Carminho e o Henrique a levar as alianças), a festa na Casa da Beira até
//                     de madrugada e, por fim, a imagem sobe até ao céu, onde rebenta o fogo de
//                     artifício à volta dos parabéns pelos anos de casados. A meio há dois momentos
//                     em que a animação espera por um toque (beijar a noiva e lançar o fogo de
//                     artifício): além de ser mais divertido, impede que o ecrã do telemóvel se apague
//                     por falta de interação quando está em poupança de energia.
// variant 'family'  → fim do nível bónus: a família completa, à noite, em frente à casa que a
//                     Luísa e o Sérgio construíram (a vivenda do nível "A Nossa Casa").
import { TILE as T, WEDDING_DAY } from '../config.js';
import { stars, disc, hills, hash } from '../themes.js';
import { getCharacter, charFrame, getSprites, drawCrib, drawArch } from '../sprites.js';
import { Fireworks, Particles } from '../fx.js';
import { drawVilla, VILLA_H } from './house.js';

const SKY = ['#070920', '#0d1238', '#161c52', '#232a6e', '#34327f', '#4a3a8a'];
const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f', CREAM = '#fff6e6';
// Tempos da animação do casamento (segundos); em T_KISS e T_PARTY espera-se por um toque
const T_YES = 5.6, T_KISS = 7.2, T_CHURCH = 10, T_PARTY = 20.5, T_RISE = 24.5;
const CUE_MIN = 0.35;      // um toque mais rápido do que isto, logo a seguir a chegar ao momento, não conta
const CUES = {
  beijo: { at: T_KISS, cap: 5, text: 'Toca para beijar a noiva!' },
  fogo: { at: T_PARTY, cap: 6, text: 'Toca para lançar o fogo de artifício!' },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };

export class VictoryScene {
  constructor(game, variant = 'wedding') {
    this.game = game;
    this.music = 'party';
    this.variant = variant;
    const outfit = variant === 'family' ? 'casual' : 'wedding';
    this.luisa = getCharacter('luisa', outfit);
    this.sergio = getCharacter('sergio', outfit);
    const cast = (list) => list.map((look) => getCharacter(look, look === 'alberto' ? 'casa' : 'casual'));   // o Tio Alberto vem sem capacete
    // nos bancos da igreja: a família da Luísa (atrás, junto à parede) e a do Sérgio (à frente)
    this.pews = [cast(['avojose', 'maeluisa', 'pailuisa', 'rosarinho', 'catarina', 'antonio', 'alberto']), cast(['pai', 'andre', 'beatriz', 'tia1', 'tia2'])];
    // na pista de dança
    this.guests = cast(['pai', 'andre', 'beatriz', 'rosarinho', 'maeluisa', 'pailuisa']);
    this.carminho = getCharacter('carminho');
    this.henrique = getCharacter('henrique');
    this.padre = getCharacter('padre');
    this.spr = getSprites();
    this.fire = new Fireworks();
    this.fx = new Particles();
    this.t = 0;                // tempo da história (para enquanto se espera por um toque)
    this.rt = 0;               // tempo real, para o que mexe sempre (velas, danças, estrelas)
    this.cue = null;           // momento à espera de um toque: 'beijo' ou 'fogo'
    this.cueT = 0;
    this.done = new Set();     // momentos já feitos
    this.lastBoom = 0;
    this.cap = -1;
    this.revealed = false;
  }

  enter() {
    // Tocar no ecrã (ou Espaço/Enter): nos momentos de toque faz a ação; no resto da animação
    // avança até ao momento seguinte; no ecrã final lança mais um foguete.
    this.onTap = (e) => {
      if (e && e.type === 'keydown' && ((e.code !== 'Space' && e.code !== 'Enter') || e.repeat)) return;   // tecla mantida não conta
      this.tap();
    };
    window.addEventListener('pointerdown', this.onTap);
    window.addEventListener('keydown', this.onTap);
    if (this.variant !== 'wedding') {
      this.revealed = true;
      this.game.ui.showVictory(this.variant);
      this.game.audio.play('fanfare');
      return;
    }
    this.game.ui.startCutscene('');
  }

  exit() {
    window.removeEventListener('pointerdown', this.onTap);
    window.removeEventListener('keydown', this.onTap);
    this.game.ui.setCue(false);
  }

  tap() {
    if (this.cue) {
      if (this.cueT >= CUE_MIN) this.act();
      return;
    }
    if (this.revealed) {
      // do mesmo sítio e para a mesma faixa do céu que o fogo de artifício automático
      const v = this.game.view, gy = this.groundY(v);
      if (this.variant === 'wedding') this.fire.launch(v.w, v.h, v.h * 0.06, v.h * 0.52);
      else this.fire.launch(v.w, gy, v.h * 0.06, gy * 0.72);
      return;
    }
    if (this.t > 1.5 && !this.done.has('beijo')) this.t = T_KISS;
    else if (this.t > T_KISS && this.t < T_PARTY) this.t = T_PARTY;
    else if (this.t > T_PARTY && this.t < T_RISE) this.t = T_RISE;
  }

  startCue(name) {
    const c = CUES[name];
    this.t = c.at;
    this.cue = name;
    this.cueT = 0;
    this.caption(c.cap, c.text, 'pop');
    this.game.ui.setCue(true);
  }

  act() {
    const name = this.cue, v = this.game.view;
    this.cue = null;
    this.done.add(name);
    this.game.ui.setCue(false);
    if (name === 'beijo') {
      this.caption(7, 'Vivam os noivos!', 'fanfare');
      const gy = Math.round(v.h * 0.8), ax = Math.round(Math.min(v.w - 44, v.w / 2 + 64));
      for (let k = 0; k < 14; k++) this.fx.heart(ax - 40 + Math.random() * 34, gy - 50 - Math.random() * 24, Math.random() < 0.3 ? GOLD : PINK);
    } else {
      this.caption(3, '');
      this.game.audio.play('boom');
      for (let k = 0; k < 3; k++) this.fire.launch(v.w, v.h, v.h * 0.06, v.h * 0.52);
    }
  }

  groundY(v) {
    return v.h - 2 * T - (v.portrait ? Math.floor(v.h * 0.12) : 0);
  }

  caption(i, text, sound) {
    if (this.cap === i) return;
    this.cap = i;
    this.game.ui.setCaption(text);
    if (sound) this.game.audio.play(sound);
  }

  update(dt) {
    this.rt += dt;
    if (this.cue) this.cueT += dt;
    else this.t += dt;
    const v = this.game.view;
    this.fx.update(dt);

    if (this.variant !== 'wedding') {
      const gy = this.groundY(v), t = this.t;
      this.boom(dt, v, gy, v.h * 0.06, gy * 0.72);
      if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) this.fx.heart(v.w / 2 - 14 + Math.random() * 28, gy - 52, Math.random() < 0.3 ? GOLD : PINK);
      return;
    }

    // os momentos de toque: a animação para e espera
    if (!this.cue && !this.done.has('beijo') && this.t >= T_KISS) this.startCue('beijo');
    else if (!this.cue && !this.done.has('fogo') && this.t >= T_PARTY) this.startCue('fogo');
    const t = this.t;

    const gy = Math.round(v.h * 0.8), cx = v.w / 2;
    if (t < 2.6) this.caption(0, `${WEDDING_DAY}. O grande dia chegou!`, 'check');
    else if (t < T_YES) this.caption(4, 'À frente da noiva, a Carminho e o Henrique levam as alianças.');
    else if (t < T_CHURCH) {
      if (!this.cue && !this.done.has('beijo')) this.caption(1, '«Sim!» — Marido e mulher!', 'fanfare');
      // pétalas a cair e corações
      if (Math.random() < dt * 22) this.fx.add({ x: Math.random() * v.w, y: -4, vx: (Math.random() - 0.5) * 16, vy: 30 + Math.random() * 25, life: 4, color: [PINK, '#ffffff', '#ffd1e0'][Math.floor(Math.random() * 3)], size: 2 });
      if (Math.random() < dt * 5) this.fx.heart(cx + 20 + Math.random() * 40, gy - 54);
    } else if (t < T_PARTY || this.cue === 'fogo') {
      if (!this.cue) this.caption(2, 'E depois... festa na Casa da Beira, até de madrugada!', 'win');
      if (Math.random() < dt * 6) this.fx.add({ x: cx - 80 + Math.random() * 160, y: gy - 40, vx: (Math.random() - 0.5) * 20, vy: -22, life: 1.6, color: [GOLD, PINK, '#7be0b0', '#8fd0f5'][Math.floor(Math.random() * 4)], size: 2 });
      if (Math.random() < dt * 3) this.fx.heart(cx - 20 + Math.random() * 40, gy - 54);
    } else {
      this.caption(3, '');
      this.boom(dt, v, v.h, v.h * 0.06, v.h * 0.52);
      if (t >= T_RISE && !this.revealed) {
        this.revealed = true;
        this.game.ui.showVictory('wedding');
        this.game.audio.play('fanfare');
      }
    }
  }

  boom(dt, v, from, top, bottom) {
    this.fire.update(dt, v.w, from, top, bottom, () => {
      if (this.t - this.lastBoom > 0.35) {
        this.lastBoom = this.t;
        this.game.audio.play('boom');
      }
    });
  }

  draw(ctx, v) {
    const t = this.t;
    if (this.variant !== 'wedding') this.drawFamily(ctx, v, t);
    else if (t < T_CHURCH) this.drawChurch(ctx, v, t, this.rt);
    else this.drawParty(ctx, v, t, this.rt);
    this.fx.draw(ctx);
  }

  // ---------- 1. A cerimónia, na igreja ----------
  drawChurch(ctx, v, t, a) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const gy = Math.round(v.h * 0.8), cx = Math.round(v.w / 2);
    const ax = Math.round(Math.min(v.w - 44, cx + 64));       // onde fica o altar

    // paredes, colunas e vitral
    R(0, 0, v.w, gy, '#e8dcc0');
    for (let x = 14; x < v.w; x += 64) { R(x, 0, 10, gy, '#cfc0a0'); R(x - 3, 0, 16, 8, '#b8a888'); R(x - 3, gy - 6, 16, 6, '#b8a888'); }
    R(0, 0, v.w, 5, '#b8a888');
    const wy = Math.round(gy * 0.26);
    disc(ctx, cx, wy, 19, '#8a7a5a');
    disc(ctx, cx, wy, 16, '#3d6fb5');
    R(cx - 16, wy - 16, 16, 16, 'rgba(212,61,81,0.75)');
    R(cx, wy, 16, 16, 'rgba(255,209,102,0.8)');
    R(cx - 16, wy, 16, 16, 'rgba(92,240,138,0.6)');
    R(cx - 1, wy - 18, 2, 36, '#8a7a5a');
    R(cx - 18, wy - 1, 36, 2, '#8a7a5a');
    // raio de luz do vitral
    ctx.fillStyle = 'rgba(255,240,180,0.10)';
    for (let k = 0; k < 6; k++) ctx.fillRect(cx - 14 + k * 4, wy + 16 + k * 8, 30 + k * 10, 8);

    // altar: cruz, mesa, velas e o arco de flores
    R(ax + 20, gy - 78, 4, 30, GOLD);
    R(ax + 12, gy - 70, 20, 4, GOLD);
    R(ax - 30, gy - 5, 90, 5, '#b8a888');
    R(ax + 8, gy - 27, 30, 22, INK);
    R(ax + 9, gy - 26, 28, 20, '#ffffff');
    R(ax + 9, gy - 26, 28, 3, GOLD);
    const fl = Math.floor(a * 8) % 2;
    for (const k of [12, 32]) { R(ax + k, gy - 36, 2, 10, CREAM); R(ax + k, gy - 39 - fl, 2, 3, '#ff8a4b'); }
    drawArch(ctx, ax - 18, gy - 5);

    // chão e passadeira vermelha
    R(0, gy, v.w, v.h - gy, '#8a6a4a');
    R(0, gy + 1, ax + 14, 9, '#a8324a');
    R(0, gy + 1, ax + 14, 1, GOLD);
    R(0, gy + 9, ax + 14, 1, GOLD);

    // a família, sentada nos bancos dos convidados, virada para o altar
    const yes = t > T_YES;
    this.pews.forEach((row, r) => {
      // cabem todos: em ecrãs estreitos sentam-se mais juntinhos
      const x0 = 4 + r * 10, gap = Math.max(13, Math.min(24, Math.floor((ax - 50 - x0) / row.length)));
      const base = gy - 10 + r * 8, len = (row.length - 1) * gap + 32;
      row.forEach((g, i) => {
        const up = yes ? Math.round(Math.abs(Math.sin(a * 6 + i + r * 2)) * 3) : 0;
        ctx.drawImage(g.stand.r, x0 + 2 + i * gap, base - 40 - up, 32, 48);
      });
      // o banco tapa-os da cintura para baixo
      R(x0, base - 14, len + 4, 16, '#5a3a20');
      R(x0, base - 14, len + 4, 2, '#8a5f3a');
      R(x0, base - 4, len + 4, 1, '#3a2414');
      R(x0 + len, base - 20, 4, 22, '#6e4a2a');
    });

    // o padre, o noivo à espera e a noiva a entrar pela nave
    ctx.drawImage(this.padre.stand.l, ax + 26, gy - 53, 32, 48);
    const meet = ax - 50;
    const walk = ease((t - 0.6) / (T_YES - 1.2));
    const kiss = this.done.has('beijo') ? 5 : 0;
    const lx = Math.round(-40 + (meet + 40) * walk) + kiss;
    const hop = t > T_YES && !this.cue ? Math.round(Math.abs(Math.sin(a * 5)) * 2) : 0;
    ctx.drawImage(this.sergio.stand.l, ax - 24 - kiss, gy - 53 - hop, 32, 48);
    const frame = walk < 1 ? charFrame(this.luisa, 1, true, false, lx * 0.6 + 400) : this.luisa.stand.r;
    ctx.drawImage(frame, lx, gy - 53 - hop, 32, 48);
    if (this.cue === 'beijo') {
      // à espera do beijo: o coração por cima dos noivos pulsa
      const s = 18 + Math.round(Math.abs(Math.sin(a * 4)) * 8);
      ctx.drawImage(this.spr.heart, ax - 21 - s / 2, gy - 72 - s / 2, s, Math.round((s * 16) / 18));
    } else if (t > T_YES) ctx.drawImage(this.spr.heart, ax - 30, gy - 76 + Math.round(Math.sin(a * 3) * 2), 18, 16);

    // os meninos das alianças: a Carminho (aos saltinhos) e o Henrique, à frente da noiva
    const kw = ease((t - 0.3) / (T_YES - 1.6));
    const kx = Math.round(-30 + (meet - 34 + 30) * kw);
    const kidHop = Math.round(Math.abs(Math.sin(a * 9)) * 3);
    const hImg = kw < 1 ? charFrame(this.henrique, 1, true, false, kx * 0.5 + 300) : this.henrique.stand.r;
    const cImg = kw < 1 ? charFrame(this.carminho, 1, true, false, kx * 0.5 + 300) : this.carminho.stand.r;
    ctx.drawImage(hImg, kx - 20, gy + 6 - 32, 32, 32);
    ctx.drawImage(cImg, kx + 2, gy + 6 - 32 - kidHop, 32, 32);
    // a almofada com as duas alianças
    R(kx + 6, gy - 12, 14, 6, INK); R(kx + 7, gy - 11, 12, 4, '#ffffff'); R(kx + 9, gy - 13, 3, 3, GOLD); R(kx + 14, gy - 13, 3, 3, GOLD);

    // os convidados, de costas, nos bancos da frente
    const by = gy + 16;
    for (let x = 6, i = 0; x < v.w - 20; x += 22, i++) {
      const k = hash(i * 3.7), up = t > T_YES ? Math.round(Math.abs(Math.sin(a * 6 + i)) * 3) : 0;
      R(x + 3, by - 4 - up, 12, 12, INK);
      R(x + 4, by - 3 - up, 10, 10, ['#3b2a20', '#b07a45', '#8a8794', '#6b4a2e', '#d8b25a'][Math.floor(k * 5)]);
      R(x + 1, by + 7 - up, 16, 12, ['#3d5aa8', '#d43d51', '#3fae8a', '#7a4a9a', '#2a3358'][Math.floor(k * 37) % 5]);
    }
    R(0, by + 14, v.w, v.h - by - 14, '#5a3a20');
    R(0, by + 14, v.w, 2, '#7a5230');
  }

  // ---------- 2. A festa na Casa da Beira e 3. a subida ao céu ----------
  drawParty(ctx, v, t, a) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = Math.round(v.w / 2);
    const p = clamp((t - T_CHURCH) / (T_PARTY - T_CHURCH), 0, 1);       // a noite a avançar
    const off = Math.round(ease((t - T_PARTY) / (T_RISE - T_PARTY)) * v.h * 0.62);   // a imagem sobe ao céu
    const gy = Math.round(v.h * 0.82) + off;

    // céu: o crepúsculo dá lugar à noite e, no fim, à primeira luz da madrugada
    const n = SKY.length;
    for (let i = 0; i < n; i++) R(0, (i * v.h) / n, v.w, v.h / n + 1, SKY[i]);
    const dusk = p < 0.25 ? 0.5 * (1 - p / 0.25) : 0, dawn = p > 0.8 ? 0.45 * ((p - 0.8) / 0.2) : 0;
    const rgb = dusk ? '240,138,126' : '196,90,138', glow = Math.max(dusk, dawn);
    if (glow > 0.02) for (let k = 0; k < 5; k++) R(0, gy - 84 + k * 14, v.w, 14, `rgba(${rgb},${((glow * (k + 1)) / 5).toFixed(2)})`);
    stars(ctx, v.w, v.h * 0.9, a, 21, 80);
    disc(ctx, Math.round(v.w * (0.12 + 0.76 * p)), Math.round(v.h * 0.16 + Math.sin(p * Math.PI) * -v.h * 0.06) + Math.round(off * 0.35), 9, '#fff6d6');

    if (this.done.has('fogo')) this.fire.draw(ctx);

    // o solar, com as janelas acesas
    const bw = Math.min(v.w - 16, 230), bx = cx - bw / 2;
    R(bx - 4, gy - 76, bw + 8, 12, '#9a3f2c');
    R(bx - 4, gy - 76, bw + 8, 3, '#c2543a');
    R(bx, gy - 64, bw, 64, '#d8d2c6');
    R(bx, gy - 64, 6, 64, '#a8a4a0');
    R(bx + bw - 6, gy - 64, 6, 64, '#a8a4a0');
    for (let x = bx + 14; x < bx + bw - 20; x += 26) {
      for (const wy2 of [gy - 56, gy - 32]) {
        R(x, wy2, 12, 14, '#8e8a86');
        R(x + 2, wy2 + 2, 8, 10, Math.sin(a * 2 + x) > -0.8 ? '#ffe9a8' : '#c9a060');
      }
    }

    // a tenda, com três bicos e fios de luzes
    const tw = Math.min(v.w - 8, 210), tx = cx - tw / 2, ty = gy - 44;
    for (let k = 0; k < 3; k++) {
      const px = tx + (tw / 3) * (k + 0.5);
      for (let r = 0; r < 22; r++) {
        const half = Math.round((tw / 6 + 2) * (r / 21));
        R(px - half, ty - 22 + r, half * 2, 1, r % 6 === 5 ? '#e8e2f0' : '#ffffff');
      }
      R(px - 1, ty - 28, 2, 7, '#ffffff');
      R(px + 1, ty - 28, 5, 3, PINK);
    }
    R(tx - 2, ty, tw + 4, 4, '#ffffff');
    for (let x = tx; x < tx + tw; x += 8) R(x + 1, ty + 4, 6, 2, '#ffffff');
    for (const x of [tx, tx + tw / 3, tx + (2 * tw) / 3, tx + tw - 2]) R(x, ty, 2, 44, '#e8e2f0');
    const cols = [GOLD, PINK, '#5cf08a', '#8fd0f5'];
    for (let k = 0; k * 7 < tw - 4; k++) {
      const on = Math.sin(a * 5 + k * 1.3) > -0.3;
      R(tx + 3 + k * 7, ty + 7 + Math.round(Math.sin((k / 4) * Math.PI) * 2), 2, 2, on ? cols[k % 4] : '#6a5a4a');
    }
    // luzes de pista de dança
    for (let k = 0; k < 4; k++) {
      const al = 0.10 + 0.08 * Math.sin(a * 6 + k * 2);
      R(cx - 70 + k * 40, gy - 34, 22, 34, `rgba(${['255,93,143', '255,209,102', '123,224,176', '143,208,245'][k]},${al.toFixed(2)})`);
    }

    // relvado
    R(0, gy, v.w, v.h - gy + off, '#1f6a4a');
    R(0, gy, v.w, 3, '#3f9a66');

    // o bolo
    R(cx + 78, gy - 12, 18, 12, '#ffffff');
    R(cx + 80, gy - 22, 14, 10, '#ffffff');
    R(cx + 83, gy - 29, 8, 7, '#ffffff');
    R(cx + 80, gy - 15, 14, 1, PINK);
    R(cx + 83, gy - 24, 8, 1, PINK);
    R(cx + 86, gy - 32, 2, 3, PINK);

    // convidados a dançar (com os meninos à frente) e, ao centro, os noivos
    const spots = [-118, -98, -78, -56, 30, 52];
    this.guests.forEach((g, i) => {
      const hop = Math.round(Math.abs(Math.sin(a * 6 + i * 1.7)) * 4);
      const face = Math.floor(a * 1.5 + i) % 2 ? 'r' : 'l';
      ctx.drawImage(g.stand[face], cx + spots[i] - 16, gy - 48 - hop, 32, 48);
    });
    ctx.drawImage(this.carminho.stand[Math.floor(a * 3) % 2 ? 'r' : 'l'], cx - 100, gy - 32 - Math.round(Math.abs(Math.sin(a * 9)) * 5), 32, 32);
    ctx.drawImage(this.henrique.stand[Math.floor(a * 2) % 2 ? 'l' : 'r'], cx + 46, gy - 32 - Math.round(Math.abs(Math.sin(a * 7 + 1)) * 3), 32, 32);
    const spin = Math.floor(a * 1.2) % 2;
    const hop = Math.round(Math.abs(Math.sin(a * 5)) * 3);
    const sway = Math.round(Math.sin(a * 2.5) * 4);
    ctx.drawImage(this.luisa.stand[spin ? 'l' : 'r'], cx - 30 + sway + (spin ? 20 : 0), gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand[spin ? 'r' : 'l'], cx - 6 + sway - (spin ? 20 : 0), gy - 48 - hop, 32, 48);
    ctx.drawImage(this.spr.heart, cx - 9 + sway, gy - 70 + Math.round(Math.sin(a * 3) * 2), 18, 16);
  }

  // ---------- Fim do nível bónus: a família em frente à casa nova ----------
  drawFamily(ctx, v, t) {
    const gy = this.groundY(v), cx = Math.round(v.w / 2);
    const hz = gy - 18;                       // o relvado estende-se até aqui, lá atrás
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const n = SKY.length;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor((i * hz) / n);
      R(0, y0, v.w, i === n - 1 ? v.h - y0 : Math.ceil(hz / n) + 1, SKY[i]);
    }
    stars(ctx, v.w, hz * 0.85, t, 21, 70);
    disc(ctx, Math.round(v.w * 0.84), Math.round(hz * 0.16), 9, '#fff6d6');
    this.fire.draw(ctx);
    hills(ctx, v.w, v.h, hz, 0, 0, 26, 9, '#141a45', 2);
    this.nightAqueduct(R, v, hz);
    // o jardim: relvado ao fundo (mais escuro) e à frente, onde está a família
    R(0, hz, v.w, gy - hz, '#1a5a40');
    R(0, hz, v.w, 2, '#2f7f58');
    R(0, gy, v.w, v.h - gy, '#1f6a4a');
    R(0, gy, v.w, 3, '#3f9a66');
    for (let x = 0; x < v.w; x += 7) R(x + ((x * 3) % 5), gy + 8 + ((x * 7) % 12), 2, 1, '#17503a');

    // a casa, com as janelas acesas: em ecrãs altos desenha-se a dobrar
    const base = hz + 8;
    const S = v.w >= 244 && base - VILLA_H * 2 > v.h * 0.42 ? 2 : 1;
    const W = Math.min(120, Math.floor((v.w - 8) / (1.14 * S)));   // o telhado (o mais largo) cabe no ecrã
    const RS = (x, y, w, h, c) => R(cx + (x - cx) * S, base + (y - base) * S, w * S, h * S, c);
    drawVilla(RS, cx, base, W, true);
    // luz das janelas no relvado
    R(cx - (W * S) / 2 + 8 * S, base, (W - 16) * S, 2, 'rgba(255,217,138,0.25)');
    // oliveira e limoeiro, e a piscina ao luar (se couber ao lado da casa)
    const tree = (x, h, leaf, fruit) => {
      R(x, base - h, 2 * S, h, '#4a3524');
      R(x - 5 * S, base - h - 6 * S, 12 * S, 7 * S, leaf); R(x - 3 * S, base - h - 9 * S, 8 * S, 3 * S, leaf);
      if (fruit) { R(x - 3 * S, base - h - 3 * S, 2 * S, 2 * S, fruit); R(x + 3 * S, base - h - 5 * S, 2 * S, 2 * S, fruit); }
    };
    const half = (W * S) / 2;
    if (cx - half - 10 * S > 4) tree(cx - half - 9 * S, 16 * S, '#4a6a4a', null);
    if (cx + half + 12 * S < v.w - 4) tree(cx + half + 8 * S, 14 * S, '#2f6a3f', '#e8c84a');
    const px = cx + half + 20 * S, pw = Math.min(46, v.w - px - 6);
    if (pw >= 22) {
      R(px - 2, base + 2, pw + 4, 7, '#c8d4e0');
      R(px, base + 3, pw, 5, '#2f6fb0');
      R(px + 3 + Math.round(Math.sin(t * 1.5) * 2), base + 4, Math.round(pw * 0.4), 1, '#9fd0f5');
    }

    // a família, à frente
    const hop = Math.round(Math.abs(Math.sin(t * 4)) * 2);
    ctx.drawImage(this.luisa.stand.r, cx - 34, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand.l, cx + 2, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.spr.heart, cx - 9, gy - 70 + Math.round(Math.sin(t * 3) * 2), 18, 16);
    drawCrib(ctx, cx - 64, gy, '#8fc4ff', 2);
    drawCrib(ctx, cx + 64, gy, '#ff9fc6', 2);
  }

  // O Aqueduto das Águas Livres ao luar, no horizonte (só a pedra: os arcos deixam ver o céu).
  nightAqueduct(R, v, hz) {
    const deck = hz - 44, STONE = '#4a4f92', EDGE = '#6a70b0';
    R(0, deck - 4, v.w, 6, STONE);
    R(0, deck - 4, v.w, 1, EDGE);
    const big = Math.round(v.w * 0.2);
    let x = -8;
    while (x < v.w + 8) {
      const isBig = Math.abs(x + 17 - big) < 14;
      const span = isBig ? 34 : 18, spring = deck + (isBig ? 14 : 18), apex = isBig ? 12 : 8;
      const a = x + 5;
      R(x, deck + 2, 5, hz - deck - 2, STONE);                 // pilar
      R(x, deck + 2, 1, hz - deck - 2, EDGE);
      R(a, deck + 2, span, spring - apex - deck - 2, STONE);    // pedra por cima do arco
      for (let r = 1; r <= apex; r++) {                         // os dois lados da ogiva
        const hw = (span / 2) * Math.pow(1 - r / apex, 0.55), side = span / 2 - hw;
        R(a, spring - r, side, 1, STONE);
        R(a + span - side, spring - r, side, 1, STONE);
      }
      x = a + span;
    }
  }
}
