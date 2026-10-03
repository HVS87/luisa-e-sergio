// Ecrã de vitória: fogo de artifício à volta da mensagem de parabéns.
// variant 'wedding' → fim da história (4 anos de casados);
// variant 'family'  → fim dos níveis bónus (família completa).
import { TILE as T } from '../config.js';
import { stars, disc, hills } from '../themes.js';
import { getCharacter, getSprites, drawCrib } from '../sprites.js';
import { Fireworks, Particles } from '../fx.js';

const SKY = ['#070920', '#0d1238', '#161c52', '#232a6e', '#34327f', '#4a3a8a'];

export class VictoryScene {
  constructor(game, variant = 'wedding') {
    this.game = game;
    this.variant = variant;
    const outfit = variant === 'family' ? 'casual' : 'wedding';
    this.luisa = getCharacter('luisa', outfit);
    this.sergio = getCharacter('sergio', outfit);
    this.heart = getSprites().heart;
    this.fire = new Fireworks();
    this.fx = new Particles();
    this.t = 0;
    this.lastBoom = 0;
  }

  enter() {
    this.game.ui.showVictory(this.variant);
    this.game.audio.play('fanfare');
  }

  groundY(v) {
    return v.h - 2 * T - (v.portrait ? Math.floor(v.h * 0.12) : 0);
  }

  update(dt) {
    this.t += dt;
    const v = this.game.view, gy = this.groundY(v);
    this.fire.update(dt, v.w, gy, v.h * 0.06, gy * 0.72, () => {
      if (this.t - this.lastBoom > 0.35) {
        this.lastBoom = this.t;
        this.game.audio.play('boom');
      }
    });
    this.fx.update(dt);
    if (Math.floor(this.t * 3) !== Math.floor((this.t - dt) * 3)) {
      this.fx.heart(v.w / 2 - 14 + Math.random() * 28, gy - 52, Math.random() < 0.3 ? '#ffd166' : '#ff5d8f');
    }
  }

  draw(ctx, v) {
    const gy = this.groundY(v), cx = Math.round(v.w / 2);

    // Céu noturno
    const n = SKY.length;
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor((i * gy) / n);
      ctx.fillStyle = SKY[i];
      ctx.fillRect(0, y0, v.w, i === n - 1 ? v.h - y0 : Math.ceil(gy / n) + 1);
    }
    stars(ctx, v.w, gy * 0.85, this.t, 21, 70);
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

    // O casal, em tamanho duplo
    const hop = Math.round(Math.abs(Math.sin(this.t * 4)) * 2);
    ctx.drawImage(this.luisa.stand.r, cx - 34, gy - 48 - hop, 32, 48);
    ctx.drawImage(this.sergio.stand.l, cx + 2, gy - 48 - hop, 32, 48);
    const bob = Math.round(Math.sin(this.t * 3) * 2);
    ctx.drawImage(this.heart, cx - 9, gy - 70 + bob, 18, 16);

    // Depois dos bónus: os dois berços ao lado dos pais
    if (this.variant === 'family') {
      drawCrib(ctx, cx - 64, gy, '#8fc4ff', 2);
      drawCrib(ctx, cx + 64, gy, '#ff9fc6', 2);
    }

    this.fx.draw(ctx);
  }
}
