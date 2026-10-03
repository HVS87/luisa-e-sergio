// Cenários: céu, camadas de fundo com paralaxe e blocos de cada ambiente.
// Tudo desenhado com retângulos, para qualquer tamanho de ecrã.
import { TILE } from './config.js';

// Pseudo-aleatório determinístico (o mesmo n dá sempre o mesmo valor entre 0 e 1).
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  const c = (i) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

// Converte uma lista de cores num degradé em faixas (estilo pixel art).
function bands(stops, n = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(f));
    out.push(mix(stops[k], stops[k + 1], f - k));
  }
  return out;
}

function sky(ctx, w, h, gy, cols) {
  const n = cols.length;
  const span = Math.max(40, gy);
  for (let i = 0; i < n; i++) {
    const y0 = Math.floor((i * span) / n);
    ctx.fillStyle = cols[i];
    ctx.fillRect(0, y0, w, i === n - 1 ? h - y0 : Math.ceil(span / n) + 1);
  }
}

export function stars(ctx, w, limit, t, seed, n) {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const tw = Math.sin(t * 2 + i * 1.7);
    if (tw < -0.7) continue;
    const x = Math.floor(hash(i + seed) * w);
    const y = Math.floor(hash(i * 3.1 + seed) * limit);
    ctx.fillRect(x, y, 1, 1);
    if (tw > 0.6 && hash(i * 7.7 + seed) > 0.8) {
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
  }
}

export function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - half, cy + dy, half * 2, 1);
  }
}

// Altura do contorno de um monte na posição wx (a mesma fórmula usada por hills).
export function hillY(wx, gy, height, amp, seed) {
  return Math.floor(gy - height - amp * (Math.sin(wx * 0.021 + seed) * 0.6 + Math.sin(wx * 0.047 + seed * 1.7) * 0.4));
}

export function hills(ctx, w, h, gy, camX, par, height, amp, color, seed) {
  ctx.fillStyle = color;
  const off = camX * par;
  for (let x = 0; x < w; x += 2) {
    const y = hillY(x + off, gy, height, amp, seed);
    ctx.fillRect(x, y, 2, h - y);
  }
}

// Casinhas brancas de telhado laranja espalhadas pela encosta (Funchal).
function hillHouses(ctx, w, gy, camX, par, height, amp, seed) {
  const off = camX * par, cell = 9;
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w; i++) {
    const r = hash(i * 1.9 + seed);
    if (r < 0.3) continue;
    const wx = i * cell + Math.floor(hash(i * 5.1 + seed) * 4);
    const x = Math.floor(wx - off), y = hillY(wx, gy, height, amp, seed) + 3 + Math.floor(hash(i * 3.3 + seed) * (height + amp - 8));
    if (y > gy - 4) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y + 1, 4, 3);
    ctx.fillStyle = r > 0.8 ? '#c2543a' : '#e8884a';
    ctx.fillRect(x - 1, y, 6, 1);
  }
}

// Teleférico: cabo com cabines a subir.
function cableCar(ctx, w, h, y, camX, par, t) {
  const off = camX * par;
  ctx.fillStyle = '#7a8698';
  ctx.fillRect(0, y, w, 1);
  for (let i = Math.floor(off / 190) - 1; i * 190 - off < w; i++) {
    const x = Math.floor(i * 190 - off);
    ctx.fillRect(x, y - 2, 1, h - y);
    ctx.fillRect(x - 2, y - 2, 5, 1);
  }
  const move = off - t * 10;
  for (let i = Math.floor(move / 70) - 1; i * 70 - move < w; i++) {
    const x = Math.floor(i * 70 - move);
    ctx.fillStyle = '#5a6478';
    ctx.fillRect(x + 3, y + 1, 1, 3);
    ctx.fillStyle = '#3d8fe0';
    ctx.fillRect(x, y + 4, 7, 6);
    ctx.fillStyle = '#d6f0ff';
    ctx.fillRect(x + 1, y + 5, 5, 2);
  }
}

// Cascatas ao longe e bancos de nevoeiro (levada).
function waterfalls(ctx, w, h, gy, camX, par, height, amp, seed, t) {
  const off = camX * par, cell = 70;
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w; i++) {
    if (hash(i * 2.7 + seed) < 0.45) continue;
    const wx = i * cell + Math.floor(hash(i + seed) * 40);
    const x = Math.floor(wx - off), y = hillY(wx, gy, height, amp, seed) + 6;
    ctx.fillStyle = '#eafaf6';
    ctx.fillRect(x, y, 2, gy - y + 30);
    ctx.fillStyle = '#bfe6e0';
    for (let k = 0; k < 4; k++) ctx.fillRect(x, y + ((Math.floor(t * 30) + k * 9) % 34), 2, 2);
  }
}

function mist(ctx, w, gy, camX, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let k = 0; k < 3; k++) {
    const off = camX * (0.15 + k * 0.1) + t * (4 + k * 3), gap = 130;
    for (let i = Math.floor(off / gap) - 1; i * gap - off < w; i++) {
      const x = Math.floor(i * gap + hash(i + k * 9) * 60 - off);
      ctx.fillRect(x, gy - 14 - k * 17, 74, 4);
      ctx.fillRect(x + 10, gy - 17 - k * 17, 44, 3);
    }
  }
}

// Hortênsias à beira do caminho (Santana).
function hydrangeas(ctx, w, gy, camX, par) {
  const off = camX * par, cell = 22, cols = ['#6f8ff0', '#9f7fe8', '#f08ac8', '#8fc4ff'];
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w; i++) {
    if (hash(i * 1.3) < 0.25) continue;
    const x = Math.floor(i * cell - off);
    ctx.fillStyle = '#2f7a45';
    ctx.fillRect(x, gy - 7, 15, 7);
    ctx.fillRect(x + 2, gy - 9, 11, 2);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = cols[Math.floor(hash(i * 3.1 + k) * 4)];
      ctx.fillRect(x + 1 + k * 4, gy - 8 + (k % 2) * 2, 3, 3);
    }
  }
}

function trees(ctx, w, gy, camX, par, gap, trunk, leaf, leaf2, seed) {
  const off = camX * par;
  for (let i = Math.floor(off / gap) - 1; i * gap - off < w + gap; i++) {
    const x = Math.floor(i * gap + hash(i + seed) * gap * 0.5 - off);
    const th = 16 + Math.floor(hash(i * 2.3 + seed) * 14);
    const top = gy - th;
    ctx.fillStyle = trunk;
    ctx.fillRect(x, top, 3, th + 40);
    ctx.fillStyle = leaf;
    ctx.fillRect(x - 8, top - 8, 19, 10);
    ctx.fillRect(x - 5, top - 14, 13, 6);
    ctx.fillRect(x - 10, top - 4, 23, 5);
    ctx.fillStyle = leaf2;
    ctx.fillRect(x - 4, top - 12, 6, 3);
    ctx.fillRect(x - 7, top - 6, 4, 2);
  }
}

function palms(ctx, w, gy, camX, par, gap, seed) {
  const off = camX * par;
  for (let i = Math.floor(off / gap) - 1; i * gap - off < w + gap; i++) {
    const x = Math.floor(i * gap + hash(i + seed) * gap * 0.4 - off);
    const th = 30 + Math.floor(hash(i * 2.9 + seed) * 14);
    ctx.fillStyle = '#9a6a3a';
    for (let k = -40; k < th; k += 4) ctx.fillRect(x + Math.floor(Math.max(0, k) * 0.15), gy - k - 4, 3, 4);
    const tx = x + Math.floor(th * 0.15), ty = gy - th;
    ctx.fillStyle = '#2f9a5a';
    ctx.fillRect(tx - 11, ty - 2, 12, 2);
    ctx.fillRect(tx - 13, ty, 5, 2);
    ctx.fillRect(tx + 2, ty - 2, 12, 2);
    ctx.fillRect(tx + 11, ty, 5, 2);
    ctx.fillStyle = '#4fc06a';
    ctx.fillRect(tx - 6, ty - 5, 7, 2);
    ctx.fillRect(tx + 2, ty - 5, 7, 2);
    ctx.fillRect(tx - 2, ty - 7, 6, 2);
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(tx, ty, 2, 2);
    ctx.fillRect(tx + 3, ty + 1, 2, 2);
  }
}

function sea(ctx, w, h, top, color, light, t, off) {
  ctx.fillStyle = color;
  ctx.fillRect(0, top, w, h - top);
  ctx.fillStyle = light;
  for (let r = 0; r < 7; r++) {
    const y = top + 2 + r * 5;
    const sh = (((Math.floor(t * (4 + r) + off) + r * 17) % 40) + 40) % 40;
    for (let x = -sh; x < w; x += 40) ctx.fillRect(x, y, 8 + r, 1);
  }
}

function clouds(ctx, w, camX, par, y0, spread, color, t, seed) {
  ctx.fillStyle = color;
  const off = camX * par + t * 2, gap = 96;
  for (let i = Math.floor(off / gap) - 1; i * gap - off < w + gap; i++) {
    const x = Math.floor(i * gap + hash(i + seed) * 50 - off);
    const y = Math.floor(y0 + hash(i * 4.1 + seed) * spread);
    ctx.fillRect(x, y, 28, 6);
    ctx.fillRect(x + 4, y - 3, 18, 3);
    ctx.fillRect(x + 9, y - 6, 9, 3);
    ctx.fillRect(x + 3, y + 6, 20, 2);
  }
}

const mod = (a, n) => ((a % n) + n) % n;

// Eólicas no cimo da serra, com as pás a rodar.
function turbines(ctx, w, gy, camX, par, height, amp, seed, t) {
  const off = camX * par, cell = 110;
  ctx.fillStyle = '#f2f6fa';
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w + 20; i++) {
    if (hash(i * 1.7 + seed) < 0.35) continue;
    const wx = i * cell + Math.floor(hash(i + seed) * 50);
    const x = Math.floor(wx - off), y = hillY(wx, gy, height, amp, seed) + 2;
    ctx.fillRect(x, y - 20, 2, 20);
    const a = t * 1.4 + i * 2;
    for (let k = 0; k < 3; k++) {
      const ang = a + k * 2.0944;
      for (let r = 1; r <= 9; r++) ctx.fillRect(Math.round(x + Math.cos(ang) * r), Math.round(y - 20 + Math.sin(ang) * r), 1, 1);
    }
  }
}

// Montes alentejanos: casas brancas com barra azul.
function farmhouses(ctx, w, gy, camX, par, height, amp, seed) {
  const off = camX * par, cell = 150;
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w + 30; i++) {
    if (hash(i * 2.3 + seed) < 0.4) continue;
    const wx = i * cell + Math.floor(hash(i + seed) * 70);
    const x = Math.floor(wx - off), y = hillY(wx, gy, height, amp, seed) + 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y - 7, 16, 7);
    ctx.fillRect(x + 11, y - 12, 3, 5);
    ctx.fillStyle = '#3d8fe0';
    ctx.fillRect(x, y - 2, 16, 2);
    ctx.fillStyle = '#c2543a';
    ctx.fillRect(x - 1, y - 9, 18, 2);
    ctx.fillStyle = '#5a3524';
    ctx.fillRect(x + 4, y - 5, 2, 3);
  }
}

// Farol a piscar.
function lighthouse(ctx, x, gy, t) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, gy - 34, 7, 34);
  ctx.fillStyle = '#d43d51';
  ctx.fillRect(x, gy - 26, 7, 4);
  ctx.fillRect(x, gy - 14, 7, 4);
  ctx.fillRect(x - 1, gy - 40, 9, 3);
  ctx.fillStyle = Math.sin(t * 3) > 0 ? '#fff3a0' : '#c9a060';
  ctx.fillRect(x + 1, gy - 37, 5, 3);
  if (Math.sin(t * 3) > 0) {
    ctx.fillStyle = 'rgba(255,243,160,0.35)';
    ctx.fillRect(x - 26, gy - 37, 26, 2);
    ctx.fillRect(x + 7, gy - 37, 26, 2);
  }
}

// Casinhas de madeira coloridas, com neve no telhado (cidades do norte da Noruega).
function nordicHouses(ctx, w, gy, camX, par, seed) {
  const off = camX * par, cell = 34, cols = ['#c2384a', '#ffd166', '#3d6fb5', '#3f8f5a', '#e8884a'];
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w + cell; i++) {
    if (hash(i * 1.9 + seed) < 0.2) continue;
    const x = Math.floor(i * cell - off), hh = 14 + Math.floor(hash(i * 2.7 + seed) * 8);
    ctx.fillStyle = cols[Math.floor(hash(i * 4.3 + seed) * cols.length)];
    ctx.fillRect(x, gy - hh, 24, hh + 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, gy - hh - 3, 28, 4);
    ctx.fillRect(x + 3, gy - hh - 6, 18, 3);
    ctx.fillRect(x + 8, gy - hh - 9, 8, 3);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(x + 4, gy - hh + 5, 5, 5);
    ctx.fillRect(x + 14, gy - hh + 5, 5, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 6, gy - hh + 5, 1, 5);
    ctx.fillRect(x + 16, gy - hh + 5, 1, 5);
  }
}

// Neve a cair.
function snowfall(ctx, w, h, camX, t) {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 46; i++) {
    const x = mod(hash(i * 1.3) * w * 1.7 - camX * 0.3 + Math.sin(t + i) * 6, w);
    const y = mod(hash(i * 5.7) * h + t * (14 + (i % 5) * 5), h);
    ctx.fillRect(Math.floor(x), Math.floor(y), i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
}

// ---------- Ambientes ----------
// sky: cores do céu de cima para baixo · ground: cores do chão · plank: cores das plataformas
// paint(ctx, w, h, camX, gy, t): desenha as camadas de fundo; gy é a linha do chão no ecrã.
export const THEMES = {
  park: {
    sky: ['#2d2b6b', '#7a4d9a', '#f08a7e', '#ffd08a'],
    ground: { top: '#4fae5a', topLight: '#8fdc7a', body: '#8a5a3c', bodyDark: '#6e442c' },
    plank: ['#c98f52', '#e8b878', '#8a5a34'],
    paint(ctx, w, h, camX, gy, t) {
      stars(ctx, w, gy * 0.45, t, 3, 22);
      disc(ctx, Math.round(w * 0.72), gy - 34, 15, '#ffe9b0');
      hills(ctx, w, h, gy, camX, 0.08, 40, 10, '#8a5aa0', 1);
      hills(ctx, w, h, gy, camX, 0.18, 22, 8, '#5f4585', 4);
      trees(ctx, w, gy, camX, 0.45, 74, '#3a2a40', '#2f5f55', '#3f7f66', 2);
    },
  },

  // ---- Noruega ----
  tromso: {
    sky: ['#1a2a5e', '#3a5a9a', '#8fb0d8', '#f0c8b0'],
    ground: { top: '#ffffff', topLight: '#ffffff', body: '#b8cfe6', bodyDark: '#9ab4d2' },
    plank: ['#8a5a34', '#ffffff', '#5a3a22'],
    hazard: 'rocks',
    paint(ctx, w, h, camX, gy, t) {
      stars(ctx, w, gy * 0.35, t, 9, 18);
      hills(ctx, w, h, gy, camX, 0.04, 58, 22, '#dfe9f7', 3);
      hills(ctx, w, h, gy, camX, 0.08, 38, 16, '#a8bedc', 8);
      nordicHouses(ctx, w, gy, camX, 0.4, 2);
      snowfall(ctx, w, gy, camX, t);
    },
  },

  artico: {
    sky: ['#050a24', '#0d1a45', '#1a3a5e'],
    ground: { top: '#dfe9f7', topLight: '#ffffff', body: '#7f96b8', bodyDark: '#647ba0' },
    plank: ['#8a5a34', '#ffffff', '#5a3a22'],
    hazard: 'rocks',
    paint(ctx, w, h, camX, gy, t) {
      stars(ctx, w, gy * 0.85, t, 14, 70);
      // um primeiro vislumbre de verde no céu
      ctx.fillStyle = 'rgba(120,255,170,0.10)';
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, Math.round(gy * 0.2 + Math.sin((x + camX * 0.05) * 0.03 + t * 0.4) * 10), 4, 16);
      hills(ctx, w, h, gy, camX, 0.04, 52, 22, '#3a4a7a', 5);
      hills(ctx, w, h, gy, camX, 0.04, 40, 22, '#2a3862', 5);
      hills(ctx, w, h, gy, camX, 0.1, 18, 12, '#1f2c52', 2);
      trees(ctx, w, gy, camX, 0.45, 58, '#1a1626', '#1f3a4a', '#e8f0fa', 7);
      snowfall(ctx, w, gy, camX, t);
    },
  },

  // ---- Viagem de bicicleta ---- (só o fundo e road: cores da berma e da terra por baixo da estrada)
  serra: {
    sky: ['#4a9be0', '#a8d8f5', '#eaf6ff'],
    road: { grass: '#4f9a4a', earth: '#6b4a36', earthDark: '#55392a' },
    paint(ctx, w, h, camX, gy, t) {
      clouds(ctx, w, camX, 0.04, gy * 0.12, gy * 0.2, '#ffffff', t, 8);
      hills(ctx, w, h, gy, camX, 0.04, 66, 24, '#8fb4cc', 2);
      hills(ctx, w, h, gy, camX, 0.08, 44, 18, '#6f9f8a', 6);
      turbines(ctx, w, gy, camX, 0.08, 44, 18, 6, t);
      hills(ctx, w, h, gy, camX, 0.16, 20, 12, '#4f8a5f', 3);
      trees(ctx, w, gy, camX, 0.4, 84, '#3a2a22', '#2a5f3f', '#3a7f52', 5);
    },
  },

  planicie: {
    sky: ['#58a8e8', '#bfe2f7', '#fff2c9'],
    road: { grass: '#d9c05a', earth: '#b8894a', earthDark: '#9a6f38' },
    paint(ctx, w, h, camX, gy, t) {
      disc(ctx, Math.round(w * 0.78), Math.round(gy * 0.24), 13, '#fff3a0');
      clouds(ctx, w, camX, 0.03, gy * 0.14, gy * 0.14, '#ffffff', t, 12);
      hills(ctx, w, h, gy, camX, 0.05, 18, 6, '#e8c860', 3);
      farmhouses(ctx, w, gy, camX, 0.05, 18, 6, 3);
      hills(ctx, w, h, gy, camX, 0.12, 8, 4, '#d9b04a', 9);
      trees(ctx, w, gy, camX, 0.35, 150, '#6a3a22', '#3f6a3a', '#5a8a4a', 14);
    },
  },

  costa: {
    sky: ['#3a3f8f', '#c45a8a', '#ff9a5a', '#ffd08a'],
    road: { grass: '#7a9a5a', earth: '#8a6a5a', earthDark: '#6e5246' },
    paint(ctx, w, h, camX, gy, t) {
      stars(ctx, w, gy * 0.3, t, 5, 14);
      disc(ctx, Math.round(w * 0.62), gy - 34, 14, '#ffe9b0');
      sea(ctx, w, h, gy - 30, '#3a4f9a', '#ffb88a', t, camX * 0.04);
      hills(ctx, w, h, gy, camX, 0.1, 10, 10, '#5a4a6e', 7);
      lighthouse(ctx, Math.round(w * 0.86 - ((camX * 0.1) % (w + 60))) + 30, gy - 8, t);
      trees(ctx, w, gy, camX, 0.4, 120, '#2a2030', '#3a3558', '#4a4570', 3);
    },
  },

  // ---- Madeira ----
  funchal: {
    sky: ['#2f9be8', '#8fd4f7', '#e6f6ff'],
    ground: { top: '#e8e8ee', topLight: '#ffffff', body: '#5a5f70', bodyDark: '#44485a', style: 'calcada' },
    hazard: 'rocks',
    plank: ['#d43d51', '#ff8a9a', '#8a2338'],
    paint(ctx, w, h, camX, gy, t) {
      disc(ctx, Math.round(w * 0.82), Math.round(gy * 0.2), 11, '#fff3a0');
      clouds(ctx, w, camX, 0.04, gy * 0.1, gy * 0.18, '#ffffff', t, 3);
      hills(ctx, w, h, gy, camX, 0.06, 62, 14, '#6fae7a', 2);
      hills(ctx, w, h, gy, camX, 0.12, 40, 12, '#4f9a5a', 5);
      hillHouses(ctx, w, gy, camX, 0.12, 40, 12, 5);
      cableCar(ctx, w, h, gy - 78, camX, 0.3, t);
      palms(ctx, w, gy, camX, 0.5, 120, 4);
    },
  },

  levada: {
    sky: ['#8fcfc6', '#c6ebe2', '#f2fbf6'],
    ground: { top: '#4f9a4a', topLight: '#8fd47a', body: '#5a4636', bodyDark: '#463628' },
    hazard: 'rocks',
    plank: ['#8a6a4a', '#b08f68', '#5a4230'],
    paint(ctx, w, h, camX, gy, t) {
      hills(ctx, w, h, gy, camX, 0.05, 70, 26, '#8fc4a8', 3);
      hills(ctx, w, h, gy, camX, 0.1, 46, 22, '#5fa585', 7);
      waterfalls(ctx, w, h, gy, camX, 0.1, 46, 22, 7, t);
      hills(ctx, w, h, gy, camX, 0.2, 22, 16, '#3a8060', 1);
      mist(ctx, w, gy, camX, t);
      trees(ctx, w, gy, camX, 0.5, 64, '#3a2a22', '#1f5a3a', '#2f7a4a', 9);
    },
  },

  santana: {
    sky: ['#5fb4f0', '#b8e4ff', '#fff1d0'],
    ground: { top: '#62c25a', topLight: '#a4ec8a', body: '#9a6a44', bodyDark: '#7a5034' },
    plank: ['#c98f52', '#e8b878', '#8a5a34'],
    paint(ctx, w, h, camX, gy, t) {
      disc(ctx, Math.round(w * 0.25), Math.round(gy * 0.22), 12, '#fff3a0');
      clouds(ctx, w, camX, 0.05, gy * 0.1, gy * 0.2, '#ffffff', t, 6);
      sea(ctx, w, h, gy - 44, '#2f8fd0', '#9fdcf5', t, camX * 0.05);
      // socalcos: o mesmo contorno em degraus de cores diferentes
      hills(ctx, w, h, gy, camX, 0.12, 30, 12, '#4f9a5a', 4);
      hills(ctx, w, h, gy, camX, 0.12, 24, 12, '#6fbf6a', 4);
      hills(ctx, w, h, gy, camX, 0.12, 18, 12, '#4f9a5a', 4);
      hills(ctx, w, h, gy, camX, 0.12, 12, 12, '#7fcf72', 4);
      palms(ctx, w, gy, camX, 0.4, 130, 11);
      hydrangeas(ctx, w, gy, camX, 0.8);
    },
  },

};

// Desenha o fundo completo de um ambiente.
export function drawBackground(theme, ctx, w, h, camX, gy, t) {
  if (!theme.bands) theme.bands = bands(theme.sky);
  sky(ctx, w, h, gy, theme.bands);
  theme.paint(ctx, w, h, camX, gy, t);
}

// Gera (uma vez por ambiente) os blocos: topo, interior, plataforma e espinhos.
export function getTiles(theme) {
  if (theme.tiles) return theme.tiles;
  const g = theme.ground, [plank, plankLight, plankDark] = theme.plank;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = TILE;
    return c;
  };

  const body = mk();
  let x = body.getContext('2d');
  x.fillStyle = g.body;
  x.fillRect(0, 0, TILE, TILE);
  x.fillStyle = g.bodyDark;
  if (g.style === 'calcada') {
    x.fillRect(0, 7, 16, 1);
    x.fillRect(0, 15, 16, 1);
    x.fillRect(4, 0, 1, 7);
    x.fillRect(12, 8, 1, 7);
  } else {
    for (let i = 0; i < 7; i++) x.fillRect(Math.floor(hash(i * 2.1) * 14), Math.floor(hash(i * 5.3) * 14), 2, 1 + (i % 2));
  }

  const top = mk();
  x = top.getContext('2d');
  x.drawImage(body, 0, 0);
  x.fillStyle = g.top;
  x.fillRect(0, 0, TILE, 4);
  if (g.style === 'calcada') {
    // calçada portuguesa: onda preta sobre pedra branca
    x.fillStyle = '#2b2b3a';
    for (let i = 0; i < TILE; i++) x.fillRect(i, 1 + (Math.floor(i / 4) % 2), 1, 2);
    x.fillRect(0, 4, TILE, 1);
  } else {
    for (let i = 0; i < TILE; i++) {
      const d = hash(i * 3.7);
      if (d > 0.4) x.fillRect(i, 4, 1, d > 0.75 ? 2 : 1);
    }
  }
  x.fillStyle = g.topLight;
  x.fillRect(0, 0, TILE, 1);
  for (let i = 0; i < TILE; i++) if (hash(i * 6.1) > 0.7) x.fillRect(i, 1, 1, 1);

  const platform = mk();
  x = platform.getContext('2d');
  x.fillStyle = plank;
  x.fillRect(0, 0, TILE, 5);
  x.fillStyle = plankLight;
  x.fillRect(0, 0, TILE, 1);
  x.fillStyle = plankDark;
  x.fillRect(0, 4, TILE, 1);
  x.fillRect(7, 1, 1, 3);
  x.fillRect(15, 1, 1, 3);

  const hazard = mk();
  x = hazard.getContext('2d');
  if (theme.hazard === 'rocks') {
    // pedregulhos de basalto
    const rock = (bx, by, w, h) => {
      x.fillStyle = '#2b1d2e';
      x.fillRect(bx + 1, by, w - 2, h);
      x.fillRect(bx, by + 2, w, h - 2);
      x.fillStyle = '#6a6478';
      x.fillRect(bx + 1, by + 1, w - 2, h - 1);
      x.fillStyle = '#9a94a8';
      x.fillRect(bx + 2, by + 1, w - 5, 2);
      x.fillStyle = '#4a4458';
      x.fillRect(bx + 1, by + h - 3, w - 2, 3);
    };
    rock(0, 8, 10, 8);
    rock(8, 5, 8, 11);
  } else for (let k = 0; k < 4; k++) {
    const bx = k * 4;
    x.fillStyle = '#2b1d2e';
    x.fillRect(bx + 1, 7, 2, 1);
    x.fillRect(bx, 11, 4, 5);
    x.fillStyle = '#e8ecf5';
    x.fillRect(bx + 1, 8, 1, 8);
    x.fillRect(bx, 12, 1, 4);
    x.fillStyle = '#aab2c5';
    x.fillRect(bx + 2, 8, 1, 8);
    x.fillRect(bx + 3, 12, 1, 4);
  }

  theme.tiles = { top, body, platform, hazard };
  return theme.tiles;
}
