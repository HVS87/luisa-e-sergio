// Final do jogo.
// variant 'wedding' → animação do casamento: a cerimónia na igreja, a festa no solar até de
//                     madrugada e, por fim, a imagem sobe até ao céu, onde rebenta o fogo de
//                     artifício à volta dos parabéns pelos anos de casados.
// variant 'family'  → fim do nível bónus (família completa).
import { TILE as T, WEDDING_DAY } from '../config.js';
import { stars, disc, hills, hash } from '../themes.js';
import { getCharacter, charFrame, getSprites, drawCrib, drawArch } from '../sprites.js';
import { Fireworks, Particles } from '../fx.js';

const SKY = ['#070920', '#0d1238', '#161c52', '#232a6e', '#34327f', '#4a3a8a'];
const INK = '#2b1d2e', GOLD = '#ffd166', PINK = '#ff5d8f', CREAM = '#fff6e6';
// Tempos da animação do casamento (segundos)
const T_YES = 5.6, T_CHURCH = 9.5, T_PARTY = 20, T_FIRE = 21.5, T_RISE = 24;
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
    this.guests = ['pai', 'beatriz', 'tia1', 'tia2'].map((look) => getCharacter(look));
    this.padre = getCharacter('padre');
    this.spr = getSprites();
    this.fire = new Fireworks();
    this.fx = new Particles();
    this.t = 0;
    this.lastBoom = 0;
    this.cap = -1;
    this.revealed = false;
  }

  enter() {
    if (this.variant !== 'wedding') {
      this.revealed = true;
      this.game.ui.showVictory(this.variant);
      this.game.audio.play('fanfare');
      return;
    }
    this.game.ui.startCutscene('');
    // Tocar no ecrã (ou Espaço/Enter) salta para o final da animação.
    this.skip = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter') return;
      if (this.t > 1.5 && this.t < T_PARTY) this.t = T_PARTY;
    };
    window.addEventListener('pointerdown', this.skip);
    window.addEventListener('keydown', this.skip);
  }

  exit() {
    if (this.skip) {
      window.removeEventListener('pointerdown', this.skip);
      window.removeEventListener('keydown', this.skip);
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
    this.t += dt;
    const v = this.game.view, t = this.t;
    this.fx.update(dt);

    if (this.variant !== 'wedding') {
      const gy = this.groundY(v);
      this.boom(dt, v, gy, v.h * 0.06, gy * 0.72);
      if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) this.fx.heart(v.w / 2 - 14 + Math.random() * 28, gy - 52, Math.random() < 0.3 ? GOLD : PINK);
      return;
    }

    const gy = Math.round(v.h * 0.8), cx = v.w / 2;
    if (t < T_YES) this.caption(0, `${WEDDING_DAY}. O grande dia chegou!`, 'check');
    else if (t < T_CHURCH) {
      this.caption(1, '«Sim!» — Marido e mulher!', 'fanfare');
      // pétalas a cair e corações
      if (Math.random() < dt * 22) this.fx.add({ x: Math.random() * v.w, y: -4, vx: (Math.random() - 0.5) * 16, vy: 30 + Math.random() * 25, life: 4, color: [PINK, '#ffffff', '#ffd1e0'][Math.floor(Math.random() * 3)], size: 2 });
      if (Math.random() < dt * 5) this.fx.heart(cx + 20 + Math.random() * 40, gy - 54);
    } else if (t < T_PARTY) {
      this.caption(2, 'E depois... festa no solar, até de madrugada!', 'win');
      if (Math.random() < dt * 6) this.fx.add({ x: cx - 80 + Math.random() * 160, y: gy - 40, vx: (Math.random() - 0.5) * 20, vy: -22, life: 1.6, color: [GOLD, PINK, '#7be0b0', '#8fd0f5'][Math.floor(Math.random() * 4)], size: 2 });
      if (Math.random() < dt * 3) this.fx.heart(cx - 20 + Math.random() * 40, gy - 54);
    } else {
      this.caption(3, '');
      if (t >= T_FIRE) this.boom(dt, v, v.h, v.h * 0.06, v.h * 0.52);
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
    else if (t < T_CHURCH) this.drawChurch(ctx, v, t);
    else this.drawParty(ctx, v, t);
    this.fx.draw(ctx);
  }

  // ---------- 1. A cerimónia, na igreja ----------
  drawChurch(ctx, v, t) {
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
    const fl = Math.floor(t * 8) % 2;
    for (const k of [12, 32]) { R(ax + k, gy - 36, 2, 10, CREAM); R(ax + k, gy - 39 - fl, 2, 3, '#ff8a4b'); }
    drawArch(ctx, ax - 18, gy - 5);

    // chão e passadeira vermelha
    R(0, gy, v.w, v.h - gy, '#8a6a4a');
    R(0, gy + 1, ax + 14, 9, '#a8324a');
    R(0, gy + 1, ax + 14, 1, GOLD);
    R(0, gy + 9, ax + 14, 1, GOLD);

    // o padre, o noivo à espera e a noiva a entrar pela nave
    ctx.drawImage(this.padre.stand.l, ax + 26, gy - 53, 32, 48);
    const meet = ax - 50;
    const walk = ease((t - 0.6) / (T_YES - 1.2));
    const kiss = t > T_YES + 1.2 ? 5 : 0;
    const lx = Math.round(-40 + (meet + 40) * walk) + kiss;
    const hop = t > T_YES ? Math.round(Math.abs(Math.sin(t * 5)) * 2) : 0;
    ctx.drawImage(this.sergio.stand.l, ax - 24 - kiss, gy - 53 - hop, 32, 48);
    const frame = walk < 1 ? charFrame(this.luisa, 1, true, false, lx * 0.6 + 400) : this.luisa.stand.r;
    ctx.drawImage(frame, lx, gy - 53 - hop, 32, 48);
    if (t > T_YES) ctx.drawImage(this.spr.heart, ax - 30, gy - 76 + Math.round(Math.sin(t * 3) * 2), 18, 16);

    // os convidados, de costas, nos bancos da frente
    const by = gy + 16;
    for (let x = 6, i = 0; x < v.w - 20; x += 22, i++) {
      const k = hash(i * 3.7), up = t > T_YES ? Math.round(Math.abs(Math.sin(t * 6 + i)) * 3) : 0;
      R(x + 3, by - 4 - up, 12, 12, INK);
      R(x + 4, by - 3 - up, 10, 10, ['#3b2a20', '#b07a45', '#8a8794', '#6b4a2e', '#d8b25a'][Math.floor(k * 5)]);
      R(x + 1, by + 7 - up, 16, 12, ['#3d5aa8', '#d43d51', '#3fae8a', '#7a4a9a', '#2a3358'][Math.floor(k * 37) % 5]);
    }
    R(0, by + 14, v.w, v.h - by - 14, '#5a3a20');
    R(0, by + 14, v.w, 2, '#7a5230');
  }

  // ---------- 2. A festa no solar e 3. a subida ao céu ----------
  drawParty(ctx, v, t) {
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = Math.round(v.w / 2);
    const p = clamp((t - T_CHURCH) / (T_PARTY - T_CHURCH), 0, 1);       // a noite a avançar
    const off = Math.round(ease((t - T_PARTY) / (T_RISE - T_PARTY)) * v.h * 0.62);   // a imagem sobe ao céu
    const gy = Math.round(v.h * 0.82) + off;

    // céu: o crepúsculo dá lugar à noite e, no fim, à primeira luz da madrugada
    const n = SKY.length;
    for (let i = 0; i < n; i++) R(0, (i * v.h) / n, v.w, v.h / n + 1, SKY[i]);
    const dusk = p < 0.25 ? 0.5 * (1 - p / 0.25) : 0, dawn = p > 0.8 ? 0.45 * ((p - 0.8) / 0.2) : 0;
    const rgb = dusk ? '240,138,126' : '196,90,138', a = Math.max(dusk, dawn);
    if (a > 0.02) for (let k = 0; k < 5; k++) R(0, gy - 84 + k * 14, v.w, 14, `rgba(${rgb},${((a * (k + 1)) / 5).toFixed(2)})`);
    stars(ctx, v.w, v.h * 0.9, t, 21, 80);
    disc(ctx, Math.round(v.w * (0.12 + 0.76 * p)), Math.round(v.h * 0.16 + Math.sin(p * Math.PI) * -v.h * 0.06) + Math.round(off * 0.35), 9, '#fff6d6');

    if (t >= T_FIRE) this.fire.draw(ctx);

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
        R(x + 2, wy2 + 2, 8, 10, Math.sin(t * 2 + x) > -0.8 ? '#ffe9a8' : '#c9a060');
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
      const on = Math.sin(t * 5 + k * 1.3) > -0.3;
      R(tx + 3 + k * 7, ty + 7 + Math.round(Math.sin((k / 4) * Math.PI) * 2), 2, 2, on ? cols[k % 4] : '#6a5a4a');
    }
    // luzes de pista de dança
    for (let k = 0; k < 4; k++) {
      const a = 0.10 + 0.08 * Math.sin(t * 6 + k * 2);
      R(cx - 70 + k * 40, gy - 34, 22, 34, `rgba(${['255,93,143', '255,209,102', '123,224,176', '143,208,245'][k]},${a.toFixed(2)})`);
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

    // convidados a dançar e, ao centro, os noivos
    const spots = [-88, -56, 44, 22];
    this.guests.forEach((g, i) => {
      const hop = Math.round(Math.abs(Math.sin(t * 6 + i * 1.7)) * 4);
      const face = Math.floor(t * 1.5 + i) % 2 ? 'r' : 'l';
      ctx.drawImage(g.stand[face], cx + spots[i] - 16, gy - 48 - hop, 32, 48);
    });
    const spin = Math.floor(t * 1.2) % 2;
    const hop = Math.round(Math.abs(Math.sin(t * 5)) * 3);
    const sway = Math.round(Math.sin(t * 2.5) * 4);
    ctx.drawImage(this.luisa.stand[spin ? 'l' : 'r'], cx - 30 + sway + (spin ? 20 : 0), gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand[spin ? 'r' : 'l'], cx - 6 + sway - (spin ? 20 : 0), gy - 48 - hop, 32, 48);
    ctx.drawImage(this.spr.heart, cx - 9 + sway, gy - 70 + Math.round(Math.sin(t * 3) * 2), 18, 16);
  }

  // ---------- Fim dos níveis bónus ----------
  drawFamily(ctx, v, t) {
    const gy = this.groundY(v), cx = Math.round(v.w / 2);
    const n = SKY.length;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor((i * gy) / n);
      ctx.fillStyle = SKY[i];
      ctx.fillRect(0, y0, v.w, i === n - 1 ? v.h - y0 : Math.ceil(gy / n) + 1);
    }
    stars(ctx, v.w, gy * 0.85, t, 21, 70);
    disc(ctx, Math.round(v.w * 0.84), Math.round(gy * 0.16), 9, '#fff6d6');
    this.fire.draw(ctx);
    hills(ctx, v.w, v.h, gy, 0, 0, 26, 9, '#141a45', 2);
    hills(ctx, v.w, v.h, gy, 60, 1, 10, 6, '#0f1436', 6);
    ctx.fillStyle = '#1f6a4a';
    ctx.fillRect(0, gy, v.w, v.h - gy);
    ctx.fillStyle = '#3f9a66';
    ctx.fillRect(0, gy, v.w, 3);
    ctx.fillStyle = '#17503a';
    for (let x = 0; x < v.w; x += 7) ctx.fillRect(x + ((x * 3) % 5), gy + 8 + ((x * 7) % 12), 2, 1);
    const hop = Math.round(Math.abs(Math.sin(t * 4)) * 2);
    ctx.drawImage(this.luisa.stand.r, cx - 34, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand.l, cx + 2, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.spr.heart, cx - 9, gy - 70 + Math.round(Math.sin(t * 3) * 2), 18, 16);
    drawCrib(ctx, cx - 64, gy, '#8fc4ff', 2);
    drawCrib(ctx, cx + 64, gy, '#ff9fc6', 2);
  }
}
