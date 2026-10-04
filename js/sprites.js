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
    // de joelhos (para o pedido de casamento): o sprite fica mais baixo
    kneel: ['....oppppppoo...', '..oppooopppppo..', '..obbbo..obbbo..', '..ooooo..ooooo..'],
  },
};

// Crianças (mais pequenas do que os adultos). k = laços do cabelo (menina) / gola (menino).
const MENINA = {
  upper: [
    '................',
    '....oooooo......',
    '...ohhhhhho.....',
    '.kohhhhhhhhok...',
    '.kohhssssshok...',
    '..ohsssesseo....',
    '..ohssssscso....',
    '...ossssmmo.....',
    '....oooooo......',
    '...otttttto.....',
    '..osttttttso....',
    '...otttttto.....',
    '..oTTTTTTTTo....',
  ],
  legs: {
    stand: ['....oso.oso.....', '....obo.obo.....', '....ooo.ooo.....'],
    a: ['...oso...oso....', '...obo...obbo...', '...ooo...oooo...'],
    b: ['.....ososo......', '.....obbbo......', '.....ooooo......'],
  },
};
const MENINO = {
  upper: [
    '................',
    '................',
    '....oooooo......',
    '...ohhhhhho.....',
    '..ohhhhhhhho....',
    '..ohhsssssso....',
    '..ohssesseso....',
    '..ohsssssscso...',
    '...ossssmmo.....',
    '....oooooo......',
    '...ottkktto.....',
    '..osttttttso....',
    '...otttttto.....',
  ],
  legs: {
    stand: ['....opo.opo.....', '....obo.obo.....', '....ooo.ooo.....'],
    a: ['...opo...opo....', '...obo...obbo...', '...ooo...oooo...'],
    b: ['.....opopo......', '.....obbbo......', '.....ooooo......'],
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
      night: { t: '#d43d51', T: '#a82a43', b: '#2b1d2e' },
      wedding: { t: '#ffffff', T: '#dfe6f5', b: '#f2f2f2', v: '#f4f7ff' },
      scrubs: { t: '#4f9be0', T: '#3a78b8', b: '#ffffff', q: '#4f9be0', Q: '#3a78b8', cap: true },
      ppe: { t: '#cfe6f5', T: '#a8cfe6', b: '#ffffff', q: '#7fb8e0', Q: '#5a9ad0', cap: true },
      winter: { t: '#d43d51', T: '#a82a43', b: '#5a3a22', q: '#fff6e6', Q: '#d43d51', cap: true },
      xmas: { t: '#c2384a', T: '#ffffff', b: '#7a2e4a' },
      campo: { t: '#9aa86a', T: '#7d8a52', b: '#5a3a22', q: '#e8d8a8', Q: '#c9b57a', cap: true },   // colete caqui e chapéu
      obra: { t: '#ff8a3a', T: '#d96a20', b: '#5a3a22', q: '#ffffff', Q: '#d8dce6', cap: true },     // colete refletor e capacete
    },
  },
  sergio: {
    def: SERGIO,
    base: { h: '#3b2a20', s: '#eebb8e', d: '#b98f72' },   // castanho escuro, barba curta
    outfits: {
      casual: { t: '#3fa672', k: '#3fa672', p: '#3b4a7a', b: '#2b1d2e' },
      night: { t: '#5a6aa8', k: '#5a6aa8', p: '#2a2f4a', b: '#2b1d2e' },
      wedding: { t: '#2a3358', k: '#ffffff', p: '#2a3358', b: '#111122' },
      scrubs: { t: '#3fae8a', k: '#3fae8a', p: '#3fae8a', b: '#ffffff', q: '#3fae8a', Q: '#2f8a6c', cap: true },
      ppe: { t: '#cfe6f5', k: '#cfe6f5', p: '#a8cfe6', b: '#ffffff', q: '#7fb8e0', Q: '#5a9ad0', cap: true },
      winter: { t: '#3d5aa8', k: '#ffd166', p: '#2b2b3a', b: '#5a3a22', q: '#3fae8a', Q: '#2f8a6c', cap: true },
      xmas: { t: '#2f7a45', k: '#c2384a', p: '#3b4a7a', b: '#2b1d2e' },
      campo: { t: '#7d8a52', k: '#e8d8a8', p: '#6b5a3e', b: '#5a3a22', q: '#e8d8a8', Q: '#c9b57a', cap: true },
      obra: { t: '#ff8a3a', k: '#ffd23e', p: '#3b4a7a', b: '#5a3a22', q: '#ffffff', Q: '#d8dce6', cap: true },
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
// A Avó Jose, avó da Luísa, que mora no solar (nível 5): cabelo branco e xaile.
LOOKS.avojose = { def: LUISA, base: { h: '#eceaf2', H: '#ffffff', v: '#eceaf2', e: '#55703f' }, outfits: { casual: { t: '#6a5a8a', T: '#b8a8d8', b: '#2b1d2e' } } };
// A família da Luísa, na Casa da Beira (preparativos e casamento): os pais, as irmãs Rosarinho
// e Catarina, o irmão António e os sobrinhos Carminho e Henrique (os meninos das alianças).
LOOKS.maeluisa = { def: LUISA, base: { h: '#9a7a52', H: '#c9a878', v: '#9a7a52', e: '#55703f' }, outfits: { casual: { t: '#2f7f8a', T: '#256670', b: '#2b1d2e' } } };
LOOKS.pailuisa = { def: SERGIO, base: { h: '#a8a4ac', d: '#f6c9a0' }, outfits: { casual: { t: '#f2f2f7', k: '#f2f2f7', p: '#b09a6e', b: '#5a3a22' } } };
LOOKS.rosarinho = { def: LUISA, base: { h: '#7a4f2e', H: '#a87446', v: '#7a4f2e', e: '#2b1d2e' }, outfits: { casual: { t: '#4f9a5a', T: '#3f7f48', b: '#2b1d2e' } } };
LOOKS.catarina = { def: LUISA, base: { h: '#c9985a', H: '#e8c088', v: '#c9985a', e: '#55703f' }, outfits: { casual: { t: '#ff8a6a', T: '#e06a4a', b: '#7a2e2a' } } };
LOOKS.antonio = { def: SERGIO, base: { h: '#8a5f3a', d: '#f6c9a0' }, outfits: { casual: { t: '#5a8fd0', k: '#5a8fd0', p: '#3b4a7a', b: '#2b1d2e' } } };
LOOKS.carminho = { def: MENINA, base: { h: '#b07a45', e: '#2b1d2e', k: '#ff5d8f' }, outfits: { casual: { t: '#ffb3d1', T: '#ff8ab8', b: '#ffffff' } } };
LOOKS.henrique = { def: MENINO, base: { h: '#8a5f3a', e: '#2b1d2e' }, outfits: { casual: { t: '#ffffff', k: '#5a8fd0', p: '#5a8fd0', b: '#2b1d2e' } } };
// As tias do Sérgio, em Pretarouca (nível 6): uma de cabelo grisalho, outra de lenço na cabeça.
LOOKS.tia1 = { def: LUISA, base: { h: '#b8b4c0', H: '#d8d4e0', v: '#b8b4c0', e: '#2b1d2e' }, outfits: { casual: { t: '#4a5a8a', T: '#ffffff', b: '#2b1d2e' } } };
LOOKS.tia2 = { def: LUISA, base: { h: '#5a4030', H: '#5a4030', v: '#5a4030', e: '#2b1d2e' }, outfits: { casual: { t: '#7a3a4a', T: '#ffffff', b: '#2b1d2e', q: '#3a3550', Q: '#55507a', cap: true } } };
// Figurante: o padre, na animação do casamento.
LOOKS.padre = { def: SERGIO, base: { h: '#8a8794', d: '#f6c9a0' }, outfits: { casual: { t: '#1c1c28', k: '#ffffff', p: '#1c1c28', b: '#111122' } } };
// Figurante: o guia dos trenós de huskies, na Noruega (nível 9).
LOOKS.guia = { def: SERGIO, base: { h: '#d8b25a', d: '#f6c9a0' }, outfits: { casual: { t: '#ff8a4b', k: '#ff8a4b', p: '#2b2b3a', b: '#2b1d2e', q: '#2b2b3a', Q: '#ff8a4b', cap: true } } };
// Figurante: o carreiro do carro de cesto, de branco e chapéu de palha.
LOOKS.carreiro = { def: SERGIO, base: { h: '#3b2a20', s: '#e8b088', d: '#b98f72' }, outfits: { casual: { t: '#ffffff', k: '#ffffff', p: '#f2f2f2', b: '#5a3a22', q: '#e8c878', Q: '#2b1d2e', cap: true } } };
// O Tio Alberto, tio da Luísa e arquiteto, na casa nova (nível 11): capacete amarelo na obra, sem ele já dentro de casa.
LOOKS.alberto = { def: SERGIO, base: { h: '#9a96a2', d: '#c8c4cc' }, outfits: { casual: { t: '#5a6a8a', k: '#ffffff', p: '#4a4458', b: '#2b1d2e', q: '#ffd23e', Q: '#e0a820', cap: true }, casa: { t: '#5a6a8a', k: '#ffffff', p: '#4a4458', b: '#2b1d2e' } } };
// Nível bónus, na maternidade: a parteira (figurante) e o Xavier já a andar (desenhado a metade do tamanho dos pais).
LOOKS.parteira = { def: LUISA, base: { h: '#2b2b3a', H: '#4a4a5e', v: '#2b2b3a', e: '#2b1d2e' }, outfits: { casual: { t: '#f29ac0', T: '#d877a3', b: '#ffffff', q: '#f29ac0', Q: '#d877a3', cap: true } } };
LOOKS.xavier = { def: SERGIO, base: { h: '#6b4a2e', s: '#f6c9a0', d: '#f6c9a0' }, outfits: { casual: { t: '#8fc4ff', k: '#ffffff', p: '#5a8fd0', b: '#ffffff' } } };

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
  for (const leg of Object.keys(look.def.legs)) {
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

const HUSKY = [
  ['.............ww.', 'w...........wggw', 'ww.........ggkgp', '.ggggggggggggww.', '.gggggggggggw...', '.wwwwwwwwwww....', '.gg......gg.....', 'gg........gg....'],
  ['.............ww.', 'w...........wggw', 'ww.........ggkgp', '.ggggggggggggww.', '.gggggggggggw...', '.wwwwwwwwwww....', '..gg....gg......', '..gg....gg......'],
];
let huskies = null;
// Os dois fotogramas de um husky a correr.
export function getHuskies() {
  if (!huskies) huskies = HUSKY.map((rows) => makeSprite(rows, { g: '#8a93a7', w: '#ffffff', k: '#2b1d2e', p: '#2b1d2e' }));
  return huskies;
}

// Acampamento no Ártico: tenda sami (lavvu) e fogueira.
export function drawCamp(ctx, x, baseY, t) {
  const r = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx, baseY + dy, w, h); };
  for (let i = 0; i < 38; i++) {
    const half = 2 + Math.round(i * 0.52), y = -38 + i;
    r(-half - 1, y, half * 2 + 2, 1, '#2b1d2e');
    r(-half, y, half * 2, 1, i % 9 === 8 ? '#b8924a' : '#e8d9b8');
  }
  r(-1, -46, 1, 9, '#5a3524');
  r(1, -45, 1, 8, '#5a3524');
  r(-4, -43, 1, 6, '#5a3524');
  r(4, -42, 1, 5, '#5a3524');
  for (let i = 0; i < 14; i++) r(-Math.round(i * 0.35) - 1, -14 + i, Math.round(i * 0.7) + 2, 1, '#3a2414');
  r(-2, -6, 4, 6, '#ffd166');
  // fogueira
  const f = Math.floor(t * 9) % 2;
  r(-36, -3, 14, 3, '#5a3524');
  r(-34, -5, 10, 2, '#6a4424');
  r(-33, -12 - f, 8, 8 + f, '#ff8a4b');
  r(-31, -15 + f, 4, 7, '#ffd166');
  r(-30, -18 - f, 2, 3, '#fff3c4');
  r(-38, -1, 18, 1, 'rgba(255,138,75,0.35)');
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
  } else if (kind === 'cacau') {          // caneca de chocolate quente
    r(1, 2, 8, 8, '#2b1d2e'); r(8, 4, 2, 4, '#2b1d2e');
    r(2, 3, 6, 6, '#ffffff'); r(2, 3, 6, 2, '#6a4424'); r(2, 7, 6, 1, '#d43d51');
    r(3, 0, 1, 2, '#ffffff'); r(6, 0, 1, 2, '#ffffff');
  } else if (kind === 'camera') {         // máquina fotográfica
    r(0, 2, 10, 8, '#2b1d2e'); r(2, 0, 4, 3, '#2b1d2e');
    r(1, 3, 8, 6, '#3a3550'); r(3, 4, 4, 4, '#8fd0f5'); r(4, 5, 2, 2, '#ffffff'); r(7, 3, 2, 1, '#ffd166');
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

// Berço com bebé (final da família, depois do nível bónus).
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
