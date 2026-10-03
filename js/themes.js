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

export function hills(ctx, w, h, gy, camX, par, height, amp, color, seed) {
  ctx.fillStyle = color;
  const off = camX * par;
  for (let x = 0; x < w; x += 2) {
    const wx = x + off;
    const y = Math.floor(gy - height - amp * (Math.sin(wx * 0.021 + seed) * 0.6 + Math.sin(wx * 0.047 + seed * 1.7) * 0.4));
    ctx.fillRect(x, y, 2, h - y);
  }
}

function city(ctx, w, h, gy, camX, par, color, win, seed, minH, maxH) {
  const off = camX * par, cell = 26;
  for (let i = Math.floor(off / cell) - 1; i * cell - off < w; i++) {
    const bx = Math.floor(i * cell - off);
    const bh = Math.floor(minH + hash(i + seed) * (maxH - minH));
    const bw = 18 + Math.floor(hash(i * 3.3 + seed) * 9);
    ctx.fillStyle = color;
    ctx.fillRect(bx, gy - bh, bw, h - (gy - bh));
    ctx.fillStyle = win;
    for (let r = 0; r * 7 + 5 < bh - 4; r++) {
      for (let c = 0; c * 5 + 3 < bw - 3; c++) {
        if (hash(i * 13.7 + r * 5.3 + c * 9.1 + seed) > 0.45) ctx.fillRect(bx + 3 + c * 5, gy - bh + 5 + r * 7, 2, 3);
      }
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

const FLAGS = ['#ff5d8f', '#ffd166', '#7be0b0', '#6fb0f0', '#ffffff'];
const mod = (a, n) => ((a % n) + n) % n;

// Bandeirinhas de festa presas a postes.
function bunting(ctx, w, h, y, camX, par) {
  const off = camX * par;
  for (let i = Math.floor(off / 10) - 1; i * 10 - off < w; i++) {
    const x = Math.floor(i * 10 - off);
    const sag = Math.round(Math.sin((mod(i, 12) / 12) * Math.PI) * 6);
    if (mod(i, 12) === 0) {
      ctx.fillStyle = '#fff6e6';
      ctx.fillRect(x, y - 2, 2, h - y);
    }
    ctx.fillStyle = '#fff6e6';
    ctx.fillRect(x, y + sag, 10, 1);
    ctx.fillStyle = FLAGS[mod(i, 5)];
    ctx.fillRect(x + 2, y + sag + 1, 6, 2);
    ctx.fillRect(x + 3, y + sag + 3, 4, 2);
    ctx.fillRect(x + 4, y + sag + 5, 2, 2);
  }
}

// Fio de luzinhas a piscar.
function lights(ctx, w, h, y, camX, par, t) {
  const off = camX * par;
  for (let i = Math.floor(off / 8) - 1; i * 8 - off < w; i++) {
    const x = Math.floor(i * 8 - off);
    const sag = Math.round(Math.sin((mod(i, 14) / 14) * Math.PI) * 7);
    if (mod(i, 14) === 0) {
      ctx.fillStyle = '#2a2140';
      ctx.fillRect(x, y - 2, 2, h - y);
    }
    ctx.fillStyle = '#2a2140';
    ctx.fillRect(x, y + sag, 8, 1);
    const lit = Math.sin(t * 3 + i * 2.1) > -0.3;
    ctx.fillStyle = lit ? '#ffe28a' : '#b8862e';
    ctx.fillRect(x + 3, y + sag + 1, 2, 2);
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

  city: {
    sky: ['#3d8fe0', '#8fd0f5', '#e6f6ff'],
    ground: { top: '#c9ced9', topLight: '#eef1f6', body: '#7a8094', bodyDark: '#5e6478', style: 'brick' },
    plank: ['#d6604a', '#f08a6e', '#9a3a2e'],
    paint(ctx, w, h, camX, gy, t) {
      clouds(ctx, w, camX, 0.05, gy * 0.12, gy * 0.2, '#ffffff', t, 1);
      city(ctx, w, h, gy, camX, 0.12, '#9fc3e6', '#cfe6fa', 3, 46, 92);
      city(ctx, w, h, gy, camX, 0.3, '#5f7fae', '#ffe28a', 9, 22, 56);
    },
  },

  beach: {
    sky: ['#1f9be8', '#7fd4f7', '#fff1c9'],
    ground: { top: '#f7e2a0', topLight: '#fff5cc', body: '#e0bd72', bodyDark: '#c39c52' },
    plank: ['#c98f52', '#e8b878', '#8a5a34'],
    paint(ctx, w, h, camX, gy, t) {
      disc(ctx, Math.round(w * 0.2), Math.round(gy * 0.24), 12, '#fff3a0');
      clouds(ctx, w, camX, 0.05, gy * 0.14, gy * 0.18, '#ffffff', t, 5);
      sea(ctx, w, h, gy - 26, '#1f7fc4', '#8fdcf5', t, camX * 0.1);
      palms(ctx, w, gy, camX, 0.5, 110, 7);
    },
  },

  night: {
    sky: ['#0b0e33', '#1d2666', '#46408f'],
    ground: { top: '#3f9a66', topLight: '#6fd08f', body: '#5a4a5e', bodyDark: '#44364a' },
    plank: ['#8a6a9a', '#b08fc0', '#5a4268'],
    paint(ctx, w, h, camX, gy, t) {
      stars(ctx, w, gy * 0.8, t, 11, 60);
      disc(ctx, Math.round(w * 0.78), Math.round(gy * 0.26), 11, '#fff6d6');
      hills(ctx, w, h, gy, camX, 0.08, 34, 10, '#1a2058', 2);
      trees(ctx, w, gy, camX, 0.3, 90, '#141736', '#152a4a', '#1f3a5e', 6);
      lights(ctx, w, h, gy - 46, camX, 0.6, t);
    },
  },

  wedding: {
    sky: ['#4aaef0', '#a8e0ff', '#fff6dc'],
    ground: { top: '#62c25a', topLight: '#a4ec8a', body: '#9a6a44', bodyDark: '#7a5034' },
    plank: ['#f0f0f5', '#ffffff', '#b8b8c8'],
    paint(ctx, w, h, camX, gy, t) {
      disc(ctx, Math.round(w * 0.8), Math.round(gy * 0.22), 12, '#fff3a0');
      clouds(ctx, w, camX, 0.05, gy * 0.12, gy * 0.2, '#ffffff', t, 2);
      hills(ctx, w, h, gy, camX, 0.08, 36, 10, '#a8e0a0', 3);
      hills(ctx, w, h, gy, camX, 0.2, 18, 8, '#7fcf82', 8);
      bunting(ctx, w, h, gy - 58, camX, 0.6);
    },
  },

  nurseryBlue: {
    sky: ['#7fb8ff', '#c4e2ff', '#ffffff'],
    ground: { top: '#6fb0f0', topLight: '#b8dcff', body: '#f3ecd8', bodyDark: '#ddd2b4', style: 'brick' },
    plank: ['#ffd166', '#ffe9a8', '#d9a53e'],
    paint(ctx, w, h, camX, gy, t) {
      clouds(ctx, w, camX, 0.06, gy * 0.12, gy * 0.3, '#ffffff', t, 4);
      hills(ctx, w, h, gy, camX, 0.1, 30, 12, '#b8dcff', 2);
      hills(ctx, w, h, gy, camX, 0.22, 14, 8, '#9fd0ff', 7);
    },
  },

  nurseryPink: {
    sky: ['#ff9fc6', '#ffd3e6', '#ffffff'],
    ground: { top: '#f078ae', topLight: '#ffc0dc', body: '#f3ecd8', bodyDark: '#ddd2b4', style: 'brick' },
    plank: ['#ffd166', '#ffe9a8', '#d9a53e'],
    paint(ctx, w, h, camX, gy, t) {
      clouds(ctx, w, camX, 0.06, gy * 0.12, gy * 0.3, '#ffffff', t, 9);
      hills(ctx, w, h, gy, camX, 0.1, 30, 12, '#ffd0e4', 5);
      hills(ctx, w, h, gy, camX, 0.22, 14, 8, '#ffb8d6', 1);
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
  if (g.style === 'brick') {
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
  if (g.style === 'brick') {
    x.fillStyle = g.bodyDark;
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
  for (let k = 0; k < 4; k++) {
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
