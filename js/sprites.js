// Sprites em pixel art definidos em código (sem ficheiros de imagem).
// Cada letra de uma linha corresponde a uma cor da paleta; '.' é transparente.
import { hash } from './themes.js';

export function makeSprite(rows, pal) {
  const w = Math.max(...rows.map((r) => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}

export function flip(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

// ---------- Personagens ----------
export const PEOPLE = {
  luisa: { nome: 'Luísa', art: 'a', ao: 'à' },
  sergio: { nome: 'Sérgio', art: 'o', ao: 'ao' },
};
export const partnerOf = (name) => (name === 'luisa' ? 'sergio' : 'luisa');

// 16x24 píxeis, virados para a direita. Legenda:
// o contorno · h cabelo · H madeixa · v véu (cabelo, exceto no casamento) · s pele · d barba · c corado
// e olhos · m boca · q/Q touca · t roupa · T sombra da roupa · k camisa/gravata · p calças · b sapatos
const LUISA = {
  upper: [
    '................',
    '................',
    '................',
    '....oooooooo....',
    '...ovvvhhhhho...',
    '..ovvhHHhhhhho..',
    '..ovhHhhhhhhho..',
    '..ovhhhhssssho..',
    '..ovhhssssssso..',
    '..ovhsssesseso..',
    '..ovhsssesseso..',
    '..ovhsssssscso..',
    '..ovhosssmmso...',
    '..ovhooooooo....',
    '..ovotttttto....',
    '..ovottttttso...',
    '...ootttttto....',
    '....otttttto....',
    '...otttttttto...',
    '..otttttttttto..',
    '..oTTTTTTTTTTo..',
  ],
  // touca cirúrgica (substitui estas linhas do cabelo quando a roupa tem `cap`)
  cap: { 4: '...oqqqqqqqqo...', 5: '..oqqqqqqqqqqo..', 6: '..oQQQQQQQQQQo..' },
  legs: {
    stand: ['..ooossoossooo..', '....obboobbo....', '....oooooooo....'],
    a: ['..ooossoossooo..', '...obbo.obbbo...', '...oooo.ooooo...'],
    b: ['..ooooossooooo..', '.....obbbbo.....', '.....oooooo.....'],
  },
};

const SERGIO = {
  upper: [
    '................',
    '....oooooooo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhsssssso..',
    '..ohhsssssssso..',
    '..ohssssesseso..',
    '..ohssssesseso..',
    '..ohdsssssssso..',
    '...odddddmmdo...',
    '....oooooooo....',
    '....ottkktto....',
    '...otttkkttto...',
    '...osttttttso...',
    '...osttttttso...',
    '....otttttto....',
    '....oppppppo....',
  ],
  cap: { 2: '...oqqqqqqqqo...', 3: '..oqqqqqqqqqqo..', 4: '..oQQQQQQQQQQo..' },
  legs: {
    stand: ['....oppppppo....', '....oppooppo....', '....oppooppo....', '....oppooppo....', '....obboobbo....', '....oooooooo....'],
    a: ['....oppppppo....', '...oppo.oppo....', '..oppo...oppo...', '..obbo...obbo...', '..oooo...obbbo..', '.........ooooo..'],
    b: ['....oppppppo....', '.....oppppo.....', '.....oppppo.....', '.....oppppo.....', '.....obbbbo.....', '.....oooooo.....'],
  },
};

const BASE = { o: '#2b1d2e', s: '#f6c9a0', c: '#f09a8c', e: '#2b1d2e', m: '#c2544c' };

// Aspeto de cada personagem: cores base e roupa por ocasião.
// (Para ajustar cor de cabelo, pele ou roupa, basta mudar aqui.)
const LOOKS = {
  luisa: {
    def: LUISA,
    base: { h: '#b07a45', H: '#d6a468', v: '#b07a45', e: '#55703f' },   // castanho claro, olhos esverdeados
    outfits: {
      casual: { t: '#ff5d8f', T: '#d63f72', b: '#7a2e4a' },
      work: { t: '#4f7fd6', T: '#3a62ad', b: '#2b1d2e' },
      beach: { t: '#ffd166', T: '#f0a93e', b: '#f08a4b' },
      night: { t: '#d43d51', T: '#a82a43', b: '#2b1d2e' },
      wedding: { t: '#ffffff', T: '#dfe6f5', b: '#f2f2f2', v: '#f4f7ff' },
      scrubs: { t: '#4f9be0', T: '#3a78b8', b: '#ffffff', q: '#4f9be0', Q: '#3a78b8', cap: true },
    },
  },
  sergio: {
    def: SERGIO,
    base: { h: '#3b2a20', s: '#eebb8e', d: '#b98f72' },   // castanho escuro, barba curta
    outfits: {
      casual: { t: '#3fa672', k: '#3fa672', p: '#3b4a7a', b: '#2b1d2e' },
      work: { t: '#eef2f7', k: '#c2384a', p: '#3a3f55', b: '#2b1d2e' },
      beach: { t: '#ff8a4b', k: '#ff8a4b', p: '#2aa5c9', b: '#f6c9a0' },
      night: { t: '#5a6aa8', k: '#5a6aa8', p: '#2a2f4a', b: '#2b1d2e' },
      wedding: { t: '#2a3358', k: '#ffffff', p: '#2a3358', b: '#111122' },
      scrubs: { t: '#3fae8a', k: '#3fae8a', p: '#3fae8a', b: '#ffffff', q: '#3fae8a', Q: '#2f8a6c', cap: true },
    },
  },
};

// Figurante: o empregado de mesa do restaurante.
LOOKS.waiter = {
  def: SERGIO,
  base: { h: '#d8b25a', d: '#f6c9a0' },
  outfits: { casual: { t: '#2b2b3a', k: '#ffffff', p: '#2b2b3a', b: '#111122' } },
};

// Família do Sérgio na Madeira (nível 3): a irmã mais nova, Beatriz, e o pai.
// O aspeto é fácil de ajustar aqui (cabelo: h/H/v · roupa: t/T · calças: p).
LOOKS.beatriz = { def: LUISA, base: { h: '#3b2a20', H: '#5a4030', v: '#3b2a20', e: '#2b1d2e' }, outfits: { casual: { t: '#ffd166', T: '#f0a93e', b: '#3d8fe0' } } };
LOOKS.pai = { def: SERGIO, base: { h: '#8a8794', d: '#d9b08c' }, outfits: { casual: { t: '#5a7fb5', k: '#5a7fb5', p: '#4a4458', b: '#2b1d2e' } } };
// Figurante: o carreiro do carro de cesto, de branco e chapéu de palha.
LOOKS.carreiro = { def: SERGIO, base: { h: '#3b2a20', s: '#e8b088', d: '#b98f72' }, outfits: { casual: { t: '#ffffff', k: '#ffffff', p: '#f2f2f2', b: '#5a3a22', q: '#e8c878', Q: '#2b1d2e', cap: true } } };

const cache = new Map();

// Devolve os fotogramas { stand, a, b } de uma personagem, cada um com versão direita (r) e esquerda (l).
export function getCharacter(name, outfit = 'casual') {
  const key = name + ':' + outfit;
  if (cache.has(key)) return cache.get(key);
  const look = LOOKS[name] || LOOKS.luisa;
  const { cap, ...clothes } = look.outfits[outfit] || look.outfits.casual;
  const pal = { ...BASE, ...look.base, ...clothes };
  const upper = cap ? look.def.upper.map((row, i) => look.def.cap[i] || row) : look.def.upper;
  const frames = {};
  for (const leg of ['stand', 'a', 'b']) {
    const img = makeSprite([...upper, ...look.def.legs[leg]], pal);
    frames[leg] = { r: img, l: flip(img) };
  }
  cache.set(key, frames);
  return frames;
}

const CYCLE = ['a', 'stand', 'b', 'stand'];
export function charFrame(frames, facing, moving, air, dist) {
  let leg = 'stand';
  if (air) leg = 'a';
  else if (moving) leg = CYCLE[Math.floor(dist / 7) % 4];
  return frames[leg][facing < 0 ? 'l' : 'r'];
}

// ---------- Objetos ----------
const HEART = [
  '..oo.oo..',
  '.orrorro.',
  'orwrrrrro',
  'orrrrrrro',
  '.orrrrro.',
  '..orrro..',
  '...oro...',
  '....o....',
];

const WALKER = [
  '....oooooo....',
  '..ooggggggoo..',
  '.oggggggggggo.',
  'oggwwggggwwggo',
  'oggweggggweggo',
  'oggggggggggggo',
  'ogggggmmgggggo',
  '.oggggggggggo.',
  '..oooooooooo..',
  '...oo....oo...',
];

let sprites = null;
export function getSprites() {
  if (!sprites) {
    sprites = {
      heart: makeSprite(HEART, { o: '#2b1d2e', r: '#ff5d8f', w: '#ffffff' }),
      heartGold: makeSprite(HEART, { o: '#2b1d2e', r: '#ffd166', w: '#ffffff' }),
      heartOff: makeSprite(HEART, { o: '#2b1d2e', r: '#9a93ad', w: '#d8d3e6' }),
      walker: makeSprite(WALKER, { o: '#2b1d2e', g: '#8b93a7', w: '#ffffff', e: '#2b1d2e', m: '#2b1d2e' }),
    };
  }
  return sprites;
}

// Placa com bandeira: meta genérica de um nível.
export function drawSign(ctx, x, baseY, t) {
  ctx.fillStyle = '#2b1d2e';
  ctx.fillRect(x - 2, baseY - 32, 4, 32);
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(x - 1, baseY - 31, 2, 31);
  for (let c = 0; c < 14; c++) {
    const dy = Math.round(Math.sin(t * 5 + c * 0.6) * (c / 9));
    ctx.fillStyle = '#2b1d2e';
    ctx.fillRect(x + 1 + c, baseY - 32 + dy, 1, 12);
    ctx.fillStyle = c < 13 ? '#ff5d8f' : '#2b1d2e';
    ctx.fillRect(x + 1 + c, baseY - 31 + dy, 1, 10);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 5, baseY - 28, 2, 2);
  ctx.fillRect(x + 8, baseY - 28, 2, 2);
  ctx.fillRect(x + 5, baseY - 27, 5, 2);
  ctx.fillRect(x + 6, baseY - 25, 3, 1);
  ctx.fillRect(x + 7, baseY - 24, 1, 1);
}

// Posto de passagem (checkpoint): fica com o coração vermelho depois de ativado.
export function drawCheckpoint(ctx, x, baseY, on, t) {
  const s = getSprites();
  ctx.fillStyle = '#2b1d2e';
  ctx.fillRect(x - 2, baseY - 15, 4, 15);
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(x - 1, baseY - 14, 2, 14);
  const bob = on ? Math.round(Math.sin(t * 6) * 1.2) : 0;
  ctx.drawImage(on ? s.heart : s.heartOff, x - 4, baseY - 23 + bob);
}

// Arco de flores do casamento.
export function drawArch(ctx, x, baseY) {
  ctx.fillStyle = '#2b1d2e';
  ctx.fillRect(x - 18, baseY - 44, 5, 44);
  ctx.fillRect(x + 13, baseY - 44, 5, 44);
  ctx.fillRect(x - 18, baseY - 49, 36, 6);
  ctx.fillRect(x - 14, baseY - 52, 28, 4);
  ctx.fillStyle = '#fff6e6';
  ctx.fillRect(x - 17, baseY - 43, 3, 43);
  ctx.fillRect(x + 14, baseY - 43, 3, 43);
  ctx.fillStyle = '#4caf6a';
  ctx.fillRect(x - 17, baseY - 48, 34, 4);
  ctx.fillRect(x - 13, baseY - 51, 26, 3);
  const cols = ['#ff5d8f', '#ffffff', '#ffd166', '#ff9fc6'];
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = cols[i % 4];
    ctx.fillRect(x - 16 + i * 2 + (i % 2), baseY - 50 + Math.floor(hash(i * 3.3) * 5), 2, 2);
    if (i < 9) {
      ctx.fillRect(x - 17 + Math.floor(hash(i * 1.7) * 2), baseY - 42 + i * 5, 2, 2);
      ctx.fillRect(x + 14 + Math.floor(hash(i * 2.9) * 2), baseY - 40 + i * 5, 2, 2);
    }
  }
}

// Iguarias da Madeira para apanhar pelo caminho (10x10).
export function drawItem(ctx, kind, x, y) {
  const r = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
  if (kind === 'banana') {
    r(0, 5, 3, 3, '#2b1d2e'); r(1, 6, 7, 3, '#2b1d2e'); r(6, 3, 4, 4, '#2b1d2e'); r(8, 0, 2, 4, '#2b1d2e');
    r(1, 6, 6, 2, '#ffd84a'); r(6, 4, 3, 2, '#ffd84a'); r(8, 1, 1, 3, '#ffd84a'); r(2, 7, 4, 1, '#f0a93e');
  } else if (kind === 'caco') {
    r(1, 2, 8, 7, '#2b1d2e'); r(0, 3, 10, 5, '#2b1d2e');
    r(1, 3, 8, 5, '#e8c890'); r(2, 3, 6, 1, '#fff0c8'); r(1, 6, 8, 2, '#c9a060'); r(3, 4, 4, 2, '#ffe9a8');
  } else if (kind === 'poncha') {
    r(1, 2, 8, 8, '#2b1d2e'); r(5, 0, 2, 3, '#2b1d2e');
    r(2, 3, 6, 6, '#ffb347'); r(2, 3, 6, 1, '#ffe9a8'); r(2, 4, 1, 5, '#ffd08a'); r(5, 0, 1, 5, '#8a5a34'); r(6, 2, 2, 2, '#ffe84a');
  } else if (kind === 'espetada') {
    for (let i = 0; i < 10; i++) r(i, 9 - i, 1, 1, '#6b8a3a');
    r(1, 5, 4, 4, '#2b1d2e'); r(4, 2, 4, 4, '#2b1d2e');
    r(2, 6, 2, 2, '#a8553a'); r(5, 3, 2, 2, '#c2683a');
  }
}

// Casa típica de Santana: telhado de colmo até ao chão, fachada branca com vermelho e azul.
export function drawHouse(ctx, x, baseY) {
  const H = 42;
  for (let r = 0; r < H; r++) {
    const half = 3 + Math.round(r * 0.56), y = baseY - H + r;
    ctx.fillStyle = '#2b1d2e';
    ctx.fillRect(x - half - 1, y, half * 2 + 2, 1);
    ctx.fillStyle = r % 5 === 4 ? '#b8924a' : '#d9b56a';
    ctx.fillRect(x - half, y, half * 2, 1);
    const inner = half - 6;
    if (r > 9 && inner > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - inner, y, inner * 2, 1);
      ctx.fillStyle = '#d43d51';
      ctx.fillRect(x - inner, y, 1, 1);
      ctx.fillRect(x + inner - 1, y, 1, 1);
    }
  }
  ctx.fillStyle = '#d43d51';
  ctx.fillRect(x - 5, baseY - 17, 10, 17);
  ctx.fillStyle = '#8a2338';
  ctx.fillRect(x - 4, baseY - 16, 8, 16);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + 1, baseY - 8, 2, 2);
  for (const wx of [x - 15, x + 9]) {
    ctx.fillStyle = '#3d8fe0';
    ctx.fillRect(wx, baseY - 13, 7, 7);
    ctx.fillStyle = '#d6f0ff';
    ctx.fillRect(wx + 1, baseY - 12, 2, 2);
    ctx.fillRect(wx + 4, baseY - 12, 2, 2);
    ctx.fillRect(wx + 1, baseY - 9, 2, 2);
    ctx.fillRect(wx + 4, baseY - 9, 2, 2);
  }
  ctx.fillStyle = '#3d8fe0';
  ctx.fillRect(x - 2, baseY - 27, 4, 4);
}

// Berço com bebé (níveis bónus).
export function drawCrib(ctx, x, baseY, blanket, scale = 1) {
  const r = (dx, dy, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + dx * scale, baseY + dy * scale, w * scale, h * scale);
  };
  r(-13, -13, 26, 11, '#2b1d2e');
  r(-13, -19, 5, 7, '#2b1d2e');
  r(-12, -3, 4, 3, '#2b1d2e');
  r(8, -3, 4, 3, '#2b1d2e');
  r(-12, -18, 3, 6, '#c98f52');
  r(-12, -12, 24, 9, '#c98f52');
  r(-11, -2, 2, 2, '#8a5a34');
  r(9, -2, 2, 2, '#8a5a34');
  r(-9, -11, 20, 6, blanket);
  r(-9, -6, 20, 1, 'rgba(0,0,0,0.18)');
  r(-8, -17, 7, 7, '#2b1d2e');
  r(-7, -16, 5, 5, '#f6c9a0');
  r(-7, -16, 4, 1, '#7a4526');
  r(-4, -14, 1, 1, '#2b1d2e');
  r(-6, -12, 2, 1, '#f09a8c');
  for (let i = 0; i < 5; i++) r(-7 + i * 4, -11, 1, 6, 'rgba(138,90,52,0.55)');
}
