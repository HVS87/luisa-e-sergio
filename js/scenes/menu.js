// Cena de fundo do menu principal: o casal ao pôr do sol.
import { TILE as T } from '../config.js';
import { THEMES, drawBackground, getTiles } from '../themes.js';
import { getCharacter, getSprites } from '../sprites.js';
import { Particles } from '../fx.js';

export class MenuScene {
  constructor(game) {
    this.game = game;
    this.music = 'menu';
    this.theme = THEMES.park;
    this.tiles = getTiles(this.theme);
    this.luisa = getCharacter('luisa', 'casual');
    this.sergio = getCharacter('sergio', 'casual');
    this.heart = getSprites().heart;
    this.fx = new Particles();
    this.t = 0;
    this.next = 0.5;
  }

  // Posição do casal: à esquerda em paisagem (os botões ficam à direita), ao centro em retrato.
  layout(v) {
    return {
      gy: v.h - 2 * T - (v.portrait ? Math.floor(v.h * 0.06) : 0),
      cx: Math.round(v.portrait ? v.w / 2 : v.w * 0.26),
    };
  }

  update(dt) {
    this.t += dt;
    this.fx.update(dt);
    this.next -= dt;
    if (this.next <= 0) {
      const { gy, cx } = this.layout(this.game.view);
      this.fx.heart(cx - 10 + Math.random() * 20, gy - 50, Math.random() < 0.25 ? '#ffd166' : '#ff5d8f');
      this.next = 0.5 + Math.random() * 0.6;
    }
  }

  draw(ctx, v) {
    const { gy, cx } = this.layout(v);
    drawBackground(this.theme, ctx, v.w, v.h, 0, gy, this.t);
    for (let x = 0; x < v.w; x += T) {
      ctx.drawImage(this.tiles.top, x, gy);
      for (let y = gy + T; y < v.h; y += T) ctx.drawImage(this.tiles.body, x, y);
    }

    // Casal em tamanho duplo, frente a frente; a personagem escolhida dá uns saltinhos.
    const me = this.game.save.data.character;
    const hop = Math.round(Math.abs(Math.sin(this.t * 5)) * 3);
    ctx.drawImage(this.luisa.stand.r, cx - 36, gy - 48 - (me === 'luisa' ? hop : 0), 32, 48);
    ctx.drawImage(this.sergio.stand.l, cx + 4, gy - 48 - (me === 'sergio' ? hop : 0), 32, 48);
    const bob = Math.round(Math.sin(this.t * 3) * 2);
    ctx.drawImage(this.heart, cx - 9, gy - 68 + bob, 18, 16);

    this.fx.draw(ctx);
  }
}
