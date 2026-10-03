// Partículas (corações, brilhos) e fogo de artifício.

export class Particles {
  constructor() { this.list = []; }

  add(p) {
    this.list.push(Object.assign({ vx: 0, vy: 0, g: 0, life: 1, size: 1, color: '#fff', heart: false }, p, { max: p.life || 1 }));
  }

  // Explosão de pequenos quadrados coloridos.
  burst(x, y, n, colors, speed = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, g: 160, life: 0.4 + Math.random() * 0.4, color: colors[i % colors.length], size: 1 + (i % 2) });
    }
  }

  // Coraçãozinho que sobe a flutuar.
  heart(x, y, color = '#ff5d8f') {
    this.add({ x, y, vx: (Math.random() - 0.5) * 16, vy: -18 - Math.random() * 14, life: 1 + Math.random() * 0.6, color, heart: true });
  }

  update(dt) {
    const l = this.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.life -= dt;
      if (p.life <= 0) { l.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx, ox = 0, oy = 0) {
    for (const p of this.list) {
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy);
      if (p.heart && p.life < 0.25 && Math.floor(p.life * 30) % 2) continue;
      ctx.fillStyle = p.color;
      if (p.heart) {
        ctx.fillRect(x - 2, y - 2, 2, 1);
        ctx.fillRect(x + 1, y - 2, 2, 1);
        ctx.fillRect(x - 2, y - 1, 5, 2);
        ctx.fillRect(x - 1, y + 1, 3, 1);
        ctx.fillRect(x, y + 2, 1, 1);
      } else {
        ctx.fillRect(x, y, p.size, p.size);
      }
    }
  }
}

const FIRE_COLORS = [
  ['#ff5d8f', '#ffd1e0'], ['#ffd166', '#fff3c4'], ['#7be0b0', '#d6fff0'],
  ['#6fb0f0', '#d6ecff'], ['#c79bff', '#eedcff'], ['#ff8a4b', '#ffe0c8'],
];

export class Fireworks {
  constructor() {
    this.rockets = [];
    this.parts = [];
    this.timer = 0.2;
  }

  launch(w, h, top, bottom) {
    const [color, light] = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
    this.rockets.push({
      x: 10 + Math.random() * (w - 20),
      y: h,
      vy: -(150 + Math.random() * 70),
      target: top + Math.random() * (bottom - top),
      color, light,
    });
  }

  explode(r) {
    const n = 34 + Math.floor(Math.random() * 14);
    const ring = Math.random() < 0.4;
    const base = 38 + Math.random() * 30;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2;
      const s = ring ? base : base * (0.35 + Math.random() * 0.75);
      const life = 0.9 + Math.random() * 0.7;
      this.parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color: i % 3 === 0 ? r.light : r.color });
    }
  }

  // top/bottom: faixa vertical (em píxeis de jogo) onde os foguetes rebentam.
  update(dt, w, h, top, bottom, onBoom) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.launch(w, h, top, bottom);
      if (Math.random() < 0.3) this.launch(w, h, top, bottom);
      this.timer = 0.25 + Math.random() * 0.55;
    }
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.y += r.vy * dt;
      if (Math.random() < 0.6) this.parts.push({ x: r.x, y: r.y + 2, vx: 0, vy: 12, life: 0.25, max: 0.25, color: '#ffe9b0' });
      if (r.y <= r.target) {
        this.explode(r);
        this.rockets.splice(i, 1);
        if (onBoom) onBoom();
      }
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      const drag = Math.max(0, 1 - 1.6 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + 34 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    for (const r of this.rockets) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, 3);
    }
    for (const p of this.parts) {
      const f = p.life / p.max;
      if (f < 0.35 && Math.floor(p.life * 40) % 2) continue;   // cintila antes de apagar
      ctx.globalAlpha = f > 0.5 ? 1 : 0.65;
      ctx.fillStyle = p.color;
      const s = f > 0.6 ? 2 : 1;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }
    ctx.globalAlpha = 1;
  }
}
