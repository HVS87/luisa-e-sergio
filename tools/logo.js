// Desenha o logótipo do jogo com os próprios bonecos e a fonte do jogo (ver logo.html):
//   - a imagem de partilha (1200x630): o pôr do sol, a Luísa e o Sérgio de mãos dadas, o
//     título e o subtítulo; e a versão quadrada (512x512, igual ao ícone), que o WhatsApp mostra
//     como ícone ao lado do título;
//   - os ícones da app (512, 192 e 180): o mesmo cenário sem texto, com o casal ao centro
//     dentro da zona segura dos ícones «maskable».
// Tudo é desenhado em píxeis de jogo e ampliado sem suavização, para ficar bem pixelizado;
// só o texto é desenhado à resolução final. `window.logos()` devolve as imagens em PNG (data URL).
import { getCharacter, getSprites } from '../js/sprites.js';

const INK = '#2b1d2e';
const SKY = ['#2a2358', '#4a2f78', '#8a3f84', '#c8527a', '#ee8a66', '#f8c27a'];

// O cenário do pôr do sol, em píxeis de jogo, numa tela w x h com o chão em gy.
function scenery(ctx, w, h, gy, seed = 3) {
  const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); };
  const n = SKY.length;
  for (let i = 0; i < n; i++) R(0, Math.floor((gy * i) / n), w, Math.ceil(gy / n) + 1, SKY[i]);
  // estrelas no alto e o sol a pôr-se
  for (let i = 0; i < 40; i++) { const k = ((i * 7919 + seed * 131) % 1000) / 1000, k2 = ((i * 104729 + seed * 17) % 1000) / 1000; if (k2 < 0.75) R(k * w, k2 * gy * 0.42, i % 5 ? 1 : 2, i % 5 ? 1 : 2, i % 3 ? '#fff6e6' : '#ffd1e0'); }
  const sr = Math.round(gy * 0.16), sx = Math.round(w * 0.72), sy = Math.round(gy * 0.74);
  for (let dy = -sr; dy < sr; dy++) { const hw = Math.round(Math.sqrt(sr * sr - (dy + 0.5) ** 2)); R(sx - hw, sy + dy, hw * 2, 1, dy % 4 === 0 ? '#ffe9a8' : '#fff3c4'); }
  // colinas, duas camadas
  for (let x = 0; x < w; x += 2) {
    const a = Math.round(gy * 0.16 + gy * 0.07 * Math.sin(x * 0.02 + 1) + gy * 0.04 * Math.sin(x * 0.051 + seed));
    R(x, gy - a, 2, a, '#4a2f78');
    const b = Math.round(gy * 0.08 + gy * 0.05 * Math.sin(x * 0.034 + 2.5) + gy * 0.02 * Math.sin(x * 0.09));
    R(x, gy - b, 2, b, '#2a2358');
  }
  // o chão: relva com alguns tufos e flores
  R(0, gy, w, h - gy, '#3f8a4a'); R(0, gy, w, 2, '#6fbf5f');
  for (let i = 0; i < w / 6; i++) { const x = (i * 37 + seed * 11) % w, y = gy + 4 + ((i * 13) % Math.max(4, h - gy - 6)); R(x, y, 1, 2, '#2f6a38'); if (i % 7 === 0) R(x + 2, y, 2, 2, i % 14 ? '#ffd166' : '#fff6e6'); }
}

// O casal de mãos dadas, com o coração por cima, centrado em cx e assente em gy.
function couple(ctx, cx, gy, scale, heartScale) {
  ctx.imageSmoothingEnabled = false;
  const luisa = getCharacter('luisa', 'casual').stand.r, sergio = getCharacter('sergio', 'casual').stand.l, heart = getSprites().heart;
  const w = luisa.width * scale, h = luisa.height * scale;
  ctx.drawImage(luisa, Math.round(cx - w + 2 * scale), gy - h, w, h);
  ctx.drawImage(sergio, Math.round(cx - 2 * scale), gy - h, w, h);
  // as mãos dadas
  ctx.fillStyle = '#f6c9a0';
  ctx.fillRect(Math.round(cx - 2 * scale), Math.round(gy - h * 0.46), 4 * scale, 2 * scale);
  if (!heartScale) return;                                  // (na imagem de partilha o coração está no título)
  const hw = heart.width * heartScale, hh = heart.height * heartScale;
  ctx.drawImage(heart, Math.round(cx - hw / 2), Math.round(gy - h - hh - 4 * scale), hw, hh);
}

function pixelText(ctx, text, x, y, size, color, align = 'center') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  const o = Math.max(2, Math.round(size / 10));
  for (const [dx, dy] of [[o, o], [o, 0], [0, o], [-o, 0], [0, -o]]) ctx.fillText(text, x + dx, y + dy);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// A imagem de partilha: cenário em 300x158 píxeis de jogo, ampliado 4x, com o texto por cima.
export function shareImage() {
  const W = 1200, H = 630, k = 4, w = W / k, h = Math.ceil(H / k);
  const base = document.createElement('canvas');
  base.width = w; base.height = h;
  const b = base.getContext('2d');
  const gy = Math.round(h * 0.84);
  scenery(b, w, h, gy);
  couple(b, Math.round(w * 0.5), gy, 3, 0);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, w * k, h * k);
  pixelText(ctx, 'Luísa', W * 0.5 - 180, 112, 56, '#ffd166', 'right');
  pixelText(ctx, 'Sérgio', W * 0.5 + 180, 112, 56, '#ffd166', 'left');
  ctx.imageSmoothingEnabled = false;
  const heart = getSprites().heart;
  ctx.drawImage(heart, Math.round(W * 0.5 - 36), 56, 72, 64);
  pixelText(ctx, 'Uma história de amor em pixel art', W * 0.5, 184, 24, '#fff6e6');
  pixelText(ctx, 'Do primeiro encontro ao casamento, nível a nível', W * 0.5, 232, 16, '#ffd1e0');
  return c;
}

// Um ícone: cenário em `base` píxeis de jogo com o casal ao centro, ampliado `k` vezes.
export function iconImage(base, k, spriteScale) {
  const c0 = document.createElement('canvas');
  c0.width = base; c0.height = base;
  const b = c0.getContext('2d');
  const gy = Math.round(base * 0.9);
  scenery(b, base, base, gy, 5);
  couple(b, Math.round(base / 2), gy, spriteScale, spriteScale > 2 ? 2 : 1);
  const c = document.createElement('canvas');
  c.width = base * k; c.height = base * k;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c0, 0, 0, base * k, base * k);
  return c;
}

export async function logos() {
  await document.fonts.load('56px "Press Start 2P"');
  await document.fonts.load('16px "Press Start 2P"');
  return {
    'share.png': shareImage().toDataURL('image/png'),
    'share-square.png': iconImage(128, 4, 3).toDataURL('image/png'),   // a primeira og:image: o WhatsApp mostra-a como ícone
    'icon-512.png': iconImage(128, 4, 3).toDataURL('image/png'),
    'icon-192.png': iconImage(96, 2, 2).toDataURL('image/png'),
    'icon-180.png': iconImage(90, 2, 2).toDataURL('image/png'),
  };
}
window.logos = logos;

// Guarda as quatro imagens em assets/, através do servidor local (ver tools/serve.mjs).
export async function saveAll() {
  const imgs = await logos(), done = [];
  for (const [name, url] of Object.entries(imgs)) {
    const blob = await (await fetch(url)).blob();
    const r = await fetch('/__guardar/' + name, { method: 'POST', body: blob });
    done.push(name + ': ' + (await r.text()));
  }
  return done;
}
window.saveAll = saveAll;

// Na página: mostra as imagens, um botão para as guardar todas em assets/ e, para cada uma,
// a transferência direta.
logos().then((imgs) => {
  const out = document.getElementById('out');
  if (!out) return;
  const all = document.createElement('a');
  all.className = 'btn'; all.href = '#'; all.textContent = 'Guardar todas em assets/ (servidor local)';
  all.onclick = async (e) => { e.preventDefault(); all.textContent = 'A guardar...'; all.textContent = (await saveAll()).join(' · '); };
  out.append(all);
  for (const [name, url] of Object.entries(imgs)) {
    const a = document.createElement('a');
    a.className = 'btn'; a.href = url; a.download = name; a.textContent = 'Transferir ' + name;
    const img = new Image(); img.src = url; img.style.maxWidth = '100%'; img.style.imageRendering = 'pixelated'; img.style.display = 'block';
    out.append(a, img);
  }
});
