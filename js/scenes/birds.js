// Nível 8 — birdwatching: uma manhã no observatório de aves.
// O Sérgio aponta os binóculos e a Luísa identifica as aves no guia de campo.
//
// À distância as aves são só silhuetas; dentro dos binóculos (que ampliam para o dobro)
// veem-se as cores. Mantendo uma ave na mira durante um instante, fica identificada e
// entra no caderno de campo: cada espécie vale um coração. As aves chegam uma a uma, ficam
// algum tempo e vão-se embora; as que escaparem voltam uma segunda vez no fim.
// Depois, a Luísa pinta três das aves: o pincel vai passando pela paleta e toca-se na cor certa
// para cada parte do desenho (duas por ave); sem enganos, cada aguarela vale um coração.
//
// Controlos: arrastar o dedo (ou as setas) para mover os binóculos; tocar para pintar.
// Os nomes, pistas e curiosidades estão em js/levels/08-aves.js; os desenhos estão aqui.
import { LEVELS } from '../levels/index.js';
import { getCharacter, makeSprite, flip } from '../sprites.js';
import { Particles } from '../fx.js';

const INK = '#2b1d2e', GOLD = '#ffd166', SHADE = '#4a4263';
const LENS = 28, SEP = 16;     // raio de cada lente e meia distância entre elas
// A paleta da Luísa e o tempo que o pincel fica em cada cor
const PALETTE = [
  { id: 'rosa', c: '#ff7fa5' }, { id: 'azul', c: '#2a8fe0' }, { id: 'laranja', c: '#f08a3c' }, { id: 'amarelo', c: '#ffd23e' },
  { id: 'verde', c: '#3f9e5a' }, { id: 'castanho', c: '#8a6a48' }, { id: 'preto', c: '#2b2b3a' },
];
const BRUSH_STEP = 0.5, SKETCH = '#d8d2c6', SKETCH_LINE = '#8a8494';

// ---------- As aguarelas da Luísa: desenhos maiores e com sombreado, só para a pintura ----------
// Cada letra é uma cor (ver `pal`); 'o' é o contorno a lápis e 'w' o branco do papel. Enquanto não
// se pinta, as outras letras ficam em cinzento-claro (esboço). `wash` são as manchas de aguarela
// que aparecem por trás quando se pinta a primeira parte.
const PAINT_ART = {
  guardarios: {
    pal: { o: INK, b: '#1f7ad0', B: '#5ec8f0', d: '#155a9a', r: '#f08a3c', R: '#ffb070', w: '#ffffff', k: '#2b2b3a', e: INK, l: '#8a6a48' },
    wash: ['#a8dcf7', '#ffd9b8'],
    rows: [
      '.........oooooo.............',
      '.......ooBBbbbboo...........',
      '......oBbbbBbbbbbo..........',
      '.....obbBbbbbbbbbbo.........',
      '.....obbbbbbbewbbbboooooooo.',
      '....obbbwwbbbbbbbbokkkkkkkko',
      '....obbwwrrbbbbbbbbokkkkkko.',
      '....obbwwrrbbbbbbbbbooooo...',
      '....obbbwwbbbbbbbbbbo.......',
      '...oBBbbbbbbbbbbbbbbo.......',
      '...oBbbbbbdbbbbRRrrro.......',
      '...oBbbbbddbbbRRrrrro.......',
      '...obbbbbdddbbRrrrrrro......',
      '...obbbbddddbbRrrrrrro......',
      '...obbbddddddbrrrrrrro......',
      '....oddddddddrrrrrrro.......',
      '....oddddddddrrrrrro........',
      '.....ooddddddrrrrro.........',
      '.......oooodddrroo..........',
      '..........oooooo............',
      '...........orro.............',
      '...........orro.............',
      '......lllllorrollllllll.....',
      '....llllllllllllllllllllll..',
      '......llllllllllllllllll....',
    ],
  },
  flamingo: {
    pal: { o: INK, p: '#ffb3c7', P: '#ffd1de', d: '#e86a8a', r: '#e86a8a', k: '#2b2b3a', w: '#ffffff', e: INK, a: '#8fd0f5' },
    wash: ['#ffd1de', '#cfeeff'],
    rows: [
      '..........oooo............',
      '........ooPPppoo..........',
      '.......oPPppppppo.........',
      '.......oPpppewpppo........',
      '.......oPppppppppoo.......',
      '........oppppppokkkko.....',
      '........opppppo.okkko.....',
      '.........oppo....ooo......',
      '.........oppo.............',
      '........oppo..............',
      '........oppo..............',
      '.......oppo...............',
      '.......oppo...............',
      '......oppo................',
      '......oppo................',
      '.....oppo.................',
      '....ooppoooo..............',
      '...oPPpppppppooo..........',
      '..oPPPpppppppppppo........',
      '.oPPPPPpppddddppppo.......',
      '.oPPPPPppdddddddpppo......',
      '.oPPPPpppddddddddpppo.....',
      '..oPPppppppdddddddkkko....',
      '...opppppppppppdddkkko....',
      '....oppppppppppppppoo.....',
      '.....ooppppppppppoo.......',
      '.......ooooppoooo.........',
      '..........rr..............',
      '..........rr..............',
      '..........rr..............',
      '..........rr..............',
      '.aaaaaaaaarraaaaaaaaaaaa..',
      '..aaaaaaaarraaaaaaaaaaa...',
      '....aaaaarrrraaaaaaaa.....',
    ],
  },
  poupa: {
    pal: { o: INK, n: '#e8a060', N: '#f5c48a', k: '#2b2b3a', w: '#ffffff', l: '#8a7a6a', e: INK },
    wash: ['#ffe0b8', '#d8f0c8'],
    rows: [
      '...k..k..k..k...............',
      '..nk.nk.nk.nk...............',
      '..NnnnnnnnnnN...............',
      '...onnnnnnnno...............',
      '..onnNNnnnnnnoo.............',
      '..onnnnewnnnnnokkkkkkkkkkk..',
      '..onnnnnnnnnnnnokkkkkkkkk...',
      '...onnnnnnnnnnnoooooooo.....',
      '...onnNNnnnnnnno............',
      '..okkkwwwkkknnnno...........',
      '..okwwwkkkwwwnnnno..........',
      '.okkkwwwkkkwwwnnnno.........',
      '.okwwwkkkwwwkkknnnno........',
      '.okkkwwwkkkwwwkkknnno.......',
      '..okwwwkkkwwwkkkwwnno.......',
      '..okkkwwwkkkwwwkkknno.......',
      '...okkwwwkkkwwwkkkkno.......',
      '....okkkkwwwkkkwwkkko.......',
      '.....ooookkkkkkkkkkoo.......',
      '.........ooooooooo..........',
      '..........l...l.............',
      '..........l...l.............',
      '.........ll..ll.............',
    ],
  },
  abelharuco: {
    pal: { o: INK, n: '#b5562a', N: '#d4784a', y: '#ffd23e', t: '#3cc9c0', T: '#2aa89e', g: '#3f9e5a', k: '#2b2b3a', e: '#c2384a', w: '#ffffff', l: '#8a6a48' },
    wash: ['#ffe9a8', '#c8f0ec'],
    rows: [
      '..........oooooo............',
      '........ooNNnnnnoo..........',
      '.......oNNnnnnnnnno.........',
      '......oNnnnnnnnnnnnoooooooo.',
      '......onkkkkkewkkkkkkkkkkkko',
      '.....onnkkkkkkkkkkokkkkkkko.',
      '.....onnyyyyyyyyynooooooo...',
      '.....onnyyyyyyyyyyo.........',
      '....onnnnyyyyyyyyyo.........',
      '....onnnnnttttttttto........',
      '...onNnnnntttttttttto.......',
      '...onNnnnnnttttttttTo.......',
      '...onnnnnnnnttttttttTo......',
      '...onnnnnnnnnttttttttTo.....',
      '....onnnnnnnnnttttttttTo....',
      '....ogggnnnnnnnttttttTTo....',
      '.....ogggnnnnnnnttttTTTo....',
      '......ogggggnnnnnnTTTTo.....',
      '.......ogggggggnnnTTTTo.....',
      '........oggggggggnTTTo......',
      '.........ooggggggggoo.......',
      '...........ooggggo..........',
      '.............oggo...........',
      '..............oo............',
      '..llllllllllllllllllll......',
      '...lllllllllllllllllll......',
    ],
  },
  mocho: {
    pal: { o: INK, n: '#8a6a48', N: '#b08a60', y: '#ffd23e', k: '#2b2b3a', w: '#e8dcc8', l: '#6b5238' },
    wash: ['#e8dcc8', '#d8e8d0'],
    rows: [
      '......oooooooooo........',
      '....oonNNNnnNNNnoo......',
      '...onnwnnnnnnnnwnno.....',
      '..onnnnnyyynnyyynnno....',
      '..onnnnyyyyyyyyyynnno...',
      '.onnnnyykyyyyyykyynnno..',
      '.onnnnyykyyyyyykyynnno..',
      '.onnnnnyyyynnyyyynnnnno.',
      '.onnwnnnyynkknyynnwnnno.',
      '.onnnnnnnnnkknnnnnnnnno.',
      '.oNnwnnwnnnnnnnnwnnwnNo.',
      '.oNnnnnnnwnnnnwnnnnnnNo.',
      '..onnwnnnnnwwnnnnnwnno..',
      '..onnnnwnnnnnnnnwnnnno..',
      '..onnnnnnnwnnwnnnnnnno..',
      '...onnwnnnnnnnnnnwnno...',
      '...onnnnnwnnnnwnnnnno...',
      '....onnnnnnwwnnnnnno....',
      '.....oonnnnnnnnnnoo.....',
      '.......ooooooooo........',
      '........ll....ll........',
      '.......lll....lll.......',
      '..llllllllllllllllllll..',
      '...lllllllllllllllllll..',
    ],
  },
  cegonha: {
    pal: { o: INK, w: '#ffffff', k: '#2b2b3a', K: '#4a4a5e', r: '#e0523f', e: INK, l: '#8a6a48', L: '#b08a54' },
    wash: ['#cfeeff', '#ffe9a8'],
    rows: [
      '.........oooo.............',
      '.......oowwwwoo...........',
      '......owwwwwwwwo..........',
      '......owwwewwwwwoooooooo..',
      '......owwwwwwwwwrrrrrrrrro',
      '.......owwwwwwwworrrrrrro.',
      '........owwwwwwooooooooo..',
      '.........owwwo............',
      '.........owwwo............',
      '.........owwwo............',
      '........owwwo.............',
      '........owwwo.............',
      '......oowwwwoooo..........',
      '....oowwwwwwwwwwoo........',
      '...owwwwwwwwwwwwwwoo......',
      '..owwwwwwwwwwwwwwwwwo.....',
      '..owwwwwkkkkwwwwwwwwwo....',
      '..owwwwkkKKkkkwwwwwwwwo...',
      '..owwwwkkKKKkkkkwwwwwwo...',
      '..owwwwwkkKKkkkkkkwwwwo...',
      '...owwwwwkkkkkkkkkkkwwo...',
      '...owwwwwwkkkkkkkkkkkko...',
      '....owwwwwwwkkkkkkkkkkko..',
      '.....oowwwwwwwkkkkkkkkko..',
      '.......oowwwwwwkkkkkkko...',
      '.........ooooooookkkkoo...',
      '...........rr....oooo.....',
      '...........rr.............',
      '.....lLllllllLllllllll....',
      '...llllLllllllllLllllllll.',
      '..lllllllllLlllllllllllll.',
      '..oooooooooooooooooooooo..',
    ],
  },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Desenhos das aves (viradas para a direita) ----------
const ART = {
  cegonha: {
    pal: { o: INK, w: '#ffffff', k: '#2b2b3a', r: '#e0523f', e: INK },
    frames: [[
      '.....oo',
      '....owwo',
      '....owewrrrr',
      '....owwo',
      '.....owo',
      '.....owo',
      '.oooowwo',
      'okkwwwwwo',
      'okkkwwwwo',
      '.okkkwwo',
      '..ooooo',
      '...r.r',
      '...r.r',
      '...r.r',
    ]],
  },
  flamingo: {
    pal: { o: INK, p: '#ffb3c7', P: '#ff7fa5', r: '#e86a8a', k: '#2b2b3a', e: INK },
    frames: [[
      '........ooo',
      '.......opppoo',
      '.......opeppko',
      '.......oppookk',
      '........opo.k',
      '........opo',
      '.......opo',
      '.......opo',
      '..ooooopo',
      '.opppppppo',
      'opPPPPpppo',
      'opPPPPPppo',
      '.oppppppo',
      '..oooooo',
      '...r..r',
      '...r..r',
      '...r..r',
      '...r..r',
      '...r..r',
      '..rr.rr',
    ]],
  },
  garca: {
    pal: { o: INK, g: '#d3d6e0', G: '#7d8799', y: '#e8b83a', k: '#2b2b3a', e: INK },
    frames: [[
      '......kkk',
      '.....oggoo',
      '....kogegyyyy',
      '.....oggo',
      '......ogo',
      '.....ogo',
      '.....ogo',
      '.oooooggo',
      'oGGGGGggo',
      'oGGGGgggo',
      '.oGGggoo',
      '..oooo',
      '...y.y',
      '...y.y',
      '...y.y',
      '..yy.yy',
    ]],
  },
  poupa: {
    pal: { o: INK, n: '#e8a060', k: '#2b2b3a', w: '#ffffff', l: '#8a7a6a', e: INK },
    frames: [[
      '.k.k.k',
      '.nknknk',
      '.onnnno',
      'onnnenokkkk',
      'onnnnno...k',
      '.onnnno',
      'okwkwnno',
      'owkwknno',
      'okwkwnno',
      '.okwkoo',
      '..ooo',
      '..l.l',
    ]],
  },
  pernilongo: {
    pal: { o: INK, w: '#ffffff', k: '#2b2b3a', r: '#f2889a', e: INK },
    frames: [[
      '.....ooo',
      '....okkwo',
      '....owwewkkkk',
      '.....owwo',
      '.oooooww',
      'okkkkkwwo',
      'okkkkwwwo',
      '.ooowwwo',
      '....ooo',
      '....r.r',
      '....r.r',
      '....r.r',
      '....r.r',
      '....r.r',
      '....r.r',
      '...rr.rr',
    ]],
  },
  guardarios: {
    pal: { o: INK, b: '#2a8fe0', c: '#59d0f0', r: '#f08a3c', w: '#ffffff', k: '#2b2b3a', e: INK },
    frames: [[
      '..oooo',
      '.obbbbo',
      'obbbebokkkk',
      'obcwbbo',
      'obcbrro',
      '.obbrrro',
      '.obbrro',
      '..oooo',
      '...r',
    ]],
  },
  abelharuco: {
    pal: { o: INK, n: '#b5562a', y: '#ffd23e', t: '#3cc9c0', g: '#3f9e5a', k: '#2b2b3a', e: '#c2384a' },
    frames: [[
      '...oooo',
      '..onnnno',
      '.onkkekokkk',
      '.onyyyyo..k',
      '.ontttto',
      'onntttto',
      'onnnttto',
      '.onggtto',
      '..onggo',
      '...oggo',
      '....ogo',
      '.....oo',
    ]],
  },
  colhereiro: {
    pal: { o: INK, w: '#ffffff', k: '#2b2b3a', y: '#f0c040', e: INK },
    frames: [[
      '....ww',
      '...wwoo',
      '...owwwo',
      '...owewokkkkyy',
      '...owwo....yy',
      '....owo',
      '....owo',
      '.oooowwo',
      'owwwwwwwo',
      'owwwwwwwo',
      '.owwwwwo',
      '..ooooo',
      '...k.k',
      '...k.k',
      '...k.k',
      '..kk.kk',
    ]],
  },
  aguia: {
    pal: { o: INK, d: '#5a4030', w: '#f4f0e6', k: '#2b2b3a', e: '#ffd23e', y: '#3a3a44' },
    frames: [[
      '.........dddd',
      '........ddddd',
      '.......ddddd',
      '......ddddd',
      'dddddwwdddwwwkko',
      '...wwwwwwwwwwwey',
      '......wwwwwww',
      '',
      '',
    ], [
      '',
      '',
      '',
      '',
      'dddddwwwwwwwwkko',
      '...wwwdddddwwwey',
      '......ddddd',
      '.......ddddd',
      '........dddd',
    ]],
  },
  mocho: {
    pal: { o: INK, n: '#8a6a48', w: '#e8dcc8', y: '#ffd23e', k: '#2b2b3a', l: '#8a7a6a' },
    frames: [[
      '..oooooo',
      '.onnwnnno',
      'onyynnyyno',
      'onkynnkyno',
      'onnnyynnno',
      'onwnnnnwno',
      'onnwnnwnno',
      'onwnnnnwno',
      '.onnwwnno',
      '..oooooo',
      '...l..l',
    ]],
  },
  pardal: {
    pal: { o: INK, n: '#9a6a40', g: '#8a8a94', k: '#2b2b3a', w: '#e8dcc8', y: '#3a3a44', l: '#8a7a6a', e: INK },
    frames: [[
      '..oooo',
      '.oggggo',
      '.onnkeoy',
      '.onwkwo',
      'onnwwwo',
      'onnnwwo',
      '.ooooo',
      '..l.l',
    ]],
  },
  // só para o bando do final
  voo: {
    pal: { p: '#ffb3c7', P: '#ff7fa5', r: '#e86a8a', k: '#2b2b3a', o: INK },
    frames: [[
      '........kPP',
      '.......PPP',
      '......PPP',
      'rrrrrppppppppppo',
      '.....pppp.....pk',
      '',
      '',
    ], [
      '',
      '',
      '',
      'rrrrrppppppppppo',
      '.....pPPp.....pk',
      '......PPP',
      '.......PPk',
    ]],
  },
};

// Onde pousa e como se porta cada ave. `spot` devolve o sítio dos pés, em função da paisagem.
const WAYS = {
  cegonha: { type: 'perch', resident: true, spot: (G) => [G.nestX, G.nestY - 3] },
  flamingo: { type: 'wade', stay: 16, spot: (G) => [G.w * 0.33, G.hy + G.wh * 0.5] },
  garca: { type: 'wade', calm: true, stay: 16, spot: (G) => [G.w * 0.6, G.hy + G.wh * 0.82] },
  poupa: { type: 'perch', stay: 14, spot: (G) => [G.w * 0.5, G.shore + 12] },
  pernilongo: { type: 'wade', stay: 14, spot: (G) => [G.w * 0.44, G.hy + G.wh * 0.95] },
  guardarios: { type: 'dive', stay: 16, spot: (G) => [G.postX, G.postY] },
  abelharuco: { type: 'perch', stay: 14, spot: (G) => [G.treeX - 22, G.branchY] },
  colhereiro: { type: 'wade', stay: 14, spot: (G) => [G.w * 0.7, G.hy + G.wh * 0.45] },
  aguia: { type: 'fly', spot: (G) => [0, G.hy * 0.5] },
  mocho: { type: 'peek', stay: 17, spot: (G) => [G.treeX, G.holeY] },
  pardal: { type: 'perch', stay: 9, joke: true, spot: (G) => [G.signX, G.signY] },
};

let art = null;
function getArt() {
  if (art) return art;
  art = {};
  for (const id of Object.keys(ART)) {
    const a = ART[id], dark = {};
    art[id] = a.frames.map((rows) => {
      for (const ch of rows.join('')) if (ch !== '.') dark[ch] = SHADE;
      const c = makeSprite(rows, a.pal), s = makeSprite(rows, dark);
      return { r: c, l: flip(c), sr: s, sl: flip(s) };
    });
  }
  return art;
}

export class BirdsScene {
  constructor(game, index) {
    this.game = game;
    this.index = index;
    this.level = LEVELS[index];
    this.species = this.level.species;
    this.art = getArt();
    this.sergio = getCharacter('sergio', 'campo');
    this.luisa = getCharacter('luisa', 'campo');
    this.sheets = new Map();
    this.total = this.species.length + (this.level.painting ? 3 : 0);   // as espécies e as três aguarelas
    this.t = 0;
    this.paused = false;
    this.setup();
  }

  setup() {
    this.state = 'intro';      // intro → play → end → paint → gallery → done
    this.paint = null;
    this.got = 0;
    this.found = new Set();
    this.birds = [];
    this.queue = this.level.order.slice();
    this.missed = [];
    this.pass = 1;
    this.spawnT = 0;
    this.timer = 0;
    this.hintT = 0;
    this.jokes = 0;
    this.flash = 0;
    this.joy = 0;
    this.notes = [];
    this.lx = null;
    this.ly = 0;
    this.fx = new Particles();
  }

  enter() { this.game.ui.showStory(this.index); }

  exit() {
    this.game.ui.setLevelMode(false, false);
  }

  begin() {
    this.paused = false;
    this.game.input.reset();
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.ui.setLevelMode(true, true);
    this.state = 'play';
    this.spawn(this.species[0].id);       // a cegonha mora cá: está sempre no ninho
    this.idleHint();
  }

  restart() {
    this.setup();
    this.begin();
  }

  togglePause() {
    if (this.state !== 'play' && this.state !== 'paint') return;
    this.paused = !this.paused;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, !this.paused);
    this.game.ui.show(this.paused ? 'pause' : null);
  }

  autoPause() { if (!this.paused) this.togglePause(); }

  // Medidas da paisagem, em função do ecrã.
  geo(v) {
    const hy = Math.round(v.h * (v.portrait ? 0.5 : 0.42));        // horizonte
    const wh = Math.round(v.h * (v.portrait ? 0.2 : 0.3));         // altura da água
    const shore = hy + wh;
    return {
      w: v.w, h: v.h, hy, wh, shore,
      treeX: Math.round(v.w * 0.88), branchY: hy + 4, holeY: shore - 14,
      nestX: Math.round(v.w * 0.1), nestY: hy - 28,
      postX: Math.round(v.w * 0.2), postY: Math.round(hy + wh * 0.5),
      signX: Math.round(v.w * 0.76), signY: shore - 8,
      baseY: v.portrait ? shore + 66 : v.h - 2,
    };
  }

  info(id) { return this.species.find((s) => s.id === id); }

  say(text, hold = 4) {
    this.game.ui.setHint(text);
    this.hintT = hold;
  }

  // Sem nada de novo para dizer: a pista da ave mais recente que ainda falta identificar.
  idleHint() {
    this.hintT = 0;
    const b = [...this.birds].reverse().find((x) => !x.found && !x.way.joke && x.state !== 'out');
    this.game.ui.setHint(b ? this.info(b.id).clue : this.level.baseHint);
  }

  spawn(id) {
    if (this.birds.some((b) => b.id === id)) return;
    const way = WAYS[id];
    const b = { id, way, state: way.type === 'fly' || way.type === 'peek' || way.resident ? 'here' : 'in', t: 0, age: 0, x: -99, y: -99, face: 1, frame: 0, focus: 0, found: false, foundT: 0, hidden: false, note: 0.6, side: Math.random() < 0.5 ? -1 : 1, ph: Math.random() * 6 };
    if (way.type === 'fly') { b.dir = this.pass === 1 ? 1 : -1; b.fx = b.dir > 0 ? -20 : this.game.view.w + 20; b.face = b.dir; }
    this.birds.push(b);
    if (!way.resident) this.game.audio.play('chirp');
    if (this.hintT <= 0) this.idleHint();
  }

  // ---------- Lógica ----------
  update(dt) {
    this.t += dt;
    if (this.paused || this.state === 'intro' || this.state === 'done') return;
    const v = this.game.view, G = this.geo(v), I = this.game.input;
    this.fx.update(dt);
    this.timer += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.joy > 0) this.joy -= dt;
    if (this.lx === null) { this.lx = v.w / 2; this.ly = G.hy + G.wh * 0.4; }

    // Binóculos: seguem o dedo (um pouco acima, para não ficarem tapados) ou as setas
    if (this.state === 'play') {
      if (I.pointerX >= 0) {
        const tx = I.pointerX * v.w, ty = I.pointerY * v.h - (I.touch ? 26 : 0);
        const dx = tx - this.lx, dy = ty - this.ly, d = Math.hypot(dx, dy), m = 420 * dt;
        if (d <= m) { this.lx = tx; this.ly = ty; } else { this.lx += (dx / d) * m; this.ly += (dy / d) * m; }
      } else {
        this.lx += ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 130 * dt;
        this.ly += ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * 130 * dt;
      }
    }
    this.lx = clamp(this.lx, 8, v.w - 8);
    this.ly = clamp(this.ly, 14, G.shore + 14);

    for (const b of this.birds) this.stepBird(b, dt, G);
    this.birds = this.birds.filter((b) => !b.gone);
    for (const n of this.notes) { n.life -= dt; n.y -= 14 * dt; n.x += Math.sin(n.life * 7) * 8 * dt; }
    this.notes = this.notes.filter((n) => n.life > 0);

    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0 && this.state === 'play') this.idleHint();
      else if (this.hintT <= 0 && this.state === 'paint' && this.paint.showT <= 0) this.stepHint();
    }

    if (this.state === 'play') {
      // As aves vão chegando: mais depressa se já não houver nenhuma por identificar
      this.spawnT += dt;
      const visitors = this.birds.filter((b) => !b.way.resident);
      const waiting = visitors.some((b) => !b.found && !b.way.joke);
      if (this.queue.length) {
        if (this.spawnT >= 7 || (!waiting && this.spawnT >= 1.6)) { this.spawn(this.queue.shift()); this.spawnT = 0; }
      } else if (!visitors.length) {
        if (this.pass === 1 && this.missed.length) {
          this.pass = 2;
          this.queue = this.missed;
          this.missed = [];
          this.spawnT = 0;
          this.say(this.level.again);
        } else this.finale();
      }
    } else if (this.state === 'end' && this.timer > 5.5) {
      if (this.level.painting) this.startPainting(); else this.finish();
    } else if (this.state === 'paint') this.stepPaint(dt, I);
    else if (this.state === 'gallery' && this.timer > 3.2) this.finish();
  }

  // ---------- A pintura ----------
  // Três aves, primeiro as que ficaram no caderno; em cada uma, duas partes a pintar.
  startPainting() {
    const P = this.level.painting;
    const pick = P.priority.filter((id) => this.found.has(id)).concat(P.priority.filter((id) => !this.found.has(id))).slice(0, 3);
    this.paint = { birds: pick, k: 0, step: 0, brush: 0, t: 0, clean: true, showT: 0, lock: 0.6, painted: pick.map(() => '') };
    this.state = 'paint';
    this.timer = 0;
    this.game.input.reset();
    this.game.ui.setLevelMode(true, true);
    this.game.audio.play('check');
    this.say(P.intro, 3.5);
  }

  curStep() { const p = this.paint; return this.level.painting.birds[p.birds[p.k]][p.step]; }

  // O pincel está na cor certa para a parte da vez? (usado também pela suite de testes)
  brushOk() { const p = this.paint; return !!p && p.k < p.birds.length && p.showT <= 0 && PALETTE[p.brush].id === this.curStep().color; }

  stepHint() {
    const p = this.paint, s = this.curStep(), sp = this.info(p.birds[p.k]);
    this.hintT = 0;
    this.game.ui.setHint(this.level.painting.step.replace('[ave]', `${sp.art === 'uma' ? 'a' : 'o'} ${sp.name}`).replace('[parte]', s.part).replace('[cor]', s.color));
  }

  stepPaint(dt, I) {
    const p = this.paint, P = this.level.painting;
    if (p.lock > 0) p.lock -= dt;
    if (p.showT > 0) {
      // a aguarela acabada fica um instante à vista
      p.showT -= dt;
      if (p.showT > 0) return;
      p.k++;
      p.step = 0;
      p.clean = true;
      if (p.k >= p.birds.length) {
        this.state = 'gallery';
        this.timer = 0;
        this.joy = 3;
        this.game.ui.setLevelMode(true, false);
        this.game.audio.play('fanfare');
        this.game.ui.setHint(P.done);
      } else this.stepHint();
      return;
    }
    p.t += dt;
    p.brush = Math.floor(p.t / BRUSH_STEP) % PALETTE.length;
    if (!I.actionPressed || p.lock > 0) return;
    const st = this.curStep();
    if (PALETTE[p.brush].id !== st.color) {
      p.clean = false;
      p.lock = 0.5;
      this.game.audio.play('buzz');
      this.say(P.wrong, 1.5);
      return;
    }
    p.painted[p.k] += st.keys;
    p.step++;
    p.lock = 0.4;
    this.game.audio.play('pop');
    if (p.step < this.level.painting.birds[p.birds[p.k]].length) { this.stepHint(); return; }
    // aguarela acabada
    p.showT = 1.7;
    if (p.clean) {
      this.got++;
      this.joy = 1.2;
      this.game.ui.setHud(this.got, this.total, this.level.title);
      this.game.audio.play('heart');
      this.fx.heart(this.game.view.w / 2, 40);
    } else this.game.audio.play('check');
    this.say(P.right, 2);
  }

  // O desenho de uma ave na folha (ver PAINT_ART): só as partes já pintadas têm cor; o resto é um
  // esboço a lápis, e o branco das penas é o do papel.
  sheetImg(id, keys) {
    const key = id + ':' + keys;
    if (this.sheets.has(key)) return this.sheets.get(key);
    const a = PAINT_ART[id], pal = {};
    for (const ch of a.rows.join('')) if (ch !== '.') pal[ch] = keys.includes(ch) || ch === 'w' ? a.pal[ch] : ch === 'o' ? SKETCH_LINE : SKETCH;
    const img = makeSprite(a.rows, pal);
    this.sheets.set(key, img);
    return img;
  }

  stepBird(b, dt, G) {
    const way = b.way, [x0, y0] = way.spot(G), img = this.art[b.id][0].r;
    b.age += dt;
    b.t += dt;
    if (b.found) b.foundT += dt;

    if (b.state === 'in' || b.state === 'out') {
      // chega (ou parte) a voar, na diagonal
      const p = clamp(b.t / 0.8, 0, 1), k = b.state === 'in' ? 1 - p * (2 - p) : p * p;
      b.x = x0 + b.side * 70 * k;
      b.y = y0 - 90 * k;
      b.face = b.state === 'in' ? -b.side : b.side;
      if (p >= 1) {
        if (b.state === 'in') { b.state = 'here'; b.t = 0; } else b.gone = true;
      }
      return;
    }

    b.hidden = false;
    if (way.type === 'wade') {
      const sp = way.calm ? 0.25 : 0.6;
      b.x = x0 + Math.sin(b.t * sp + b.ph) * (way.calm ? 3 : 8);
      b.y = y0;
      b.face = Math.cos(b.t * sp + b.ph) >= 0 ? 1 : -1;
    } else if (way.type === 'fly') {
      b.fx += b.dir * ((G.w + 40) / 8.5) * dt;
      b.x = b.fx;
      b.y = y0 + Math.sin(b.t * 1.6) * 6;
      b.frame = Math.floor(b.t * 5) % 2;
      if (b.x < -24 || b.x > G.w + 24) return this.leave(b, true);
    } else if (way.type === 'peek') {
      b.x = x0; b.y = y0;
      b.hidden = !b.found && b.t % 4.4 < 1.3;        // esconde-se no buraco de vez em quando
    } else if (way.type === 'dive') {
      const c = b.t % 5.5;                              // de tempos a tempos mergulha
      const d = c > 4.3 ? Math.sin(((c - 4.3) / 1.2) * Math.PI) : 0;
      b.x = x0 + d * 10; b.y = y0 + d * 15;
      if (c > 4.3 && c - dt <= 4.9 && c > 4.9) this.fx.burst(b.x, b.y, 8, ['#ffffff', '#cfeeff'], 40);
    } else {
      b.x = x0; b.y = y0;
      if (Math.floor(b.t / 2.7) % 2) b.face = -1; else b.face = 1;
    }

    // Na mira dos binóculos?
    const cy = b.y - img.height / 2;
    if (!b.found && !b.hidden && this.state === 'play') {
      if (Math.abs(b.x - this.lx) < 15 && Math.abs(cy - this.ly) < 11) {
        b.focus += dt / (way.type === 'fly' ? 0.7 : 1);
        if (b.focus >= 1) this.identify(b);
      } else b.focus = Math.max(0, b.focus - dt * 1.5);
      // as notas do canto denunciam onde ela está
      b.note -= dt;
      if (b.note <= 0) { b.note = 1.5; this.notes.push({ x: b.x + 4, y: b.y - img.height - 2, life: 1.3 }); }
    }

    if (!way.resident && way.type !== 'fly' && ((b.found && b.foundT > 2.6) || b.t > way.stay)) this.leave(b, false);
  }

  leave(b, now) {
    if (!b.found && !b.way.joke && this.pass === 1) this.missed.push(b.id);
    if (now) b.gone = true;
    else { b.state = 'out'; b.t = 0; b.hidden = false; }
  }

  identify(b) {
    b.found = true;
    b.focus = 0;
    this.flash = 0.25;
    if (b.way.joke) {
      this.game.audio.play('click');
      this.say(this.level.jokes[Math.min(this.jokes++, this.level.jokes.length - 1)]);
      return;
    }
    const s = this.info(b.id);
    this.found.add(b.id);
    this.got++;
    this.joy = 1.2;
    this.game.ui.setHud(this.got, this.total, this.level.title);
    this.game.audio.play('heart');
    this.fx.burst(b.x, b.y - 8, 12, [GOLD, '#ffffff', '#ff5d8f'], 60);
    this.fx.heart(b.x, b.y - 14);
    this.say(`Luísa: «Olha, ${s.art} ${s.name}!» ${s.fact}`, 5);
  }

  finale() {
    this.state = 'end';
    this.timer = 0;
    this.game.ui.setLevelMode(true, false);
    this.game.audio.play('fanfare');
    this.joy = 5;
    this.game.ui.setHint(this.got >= this.total ? this.level.endingAll : this.level.ending);
  }

  finish() {
    this.state = 'done';
    this.game.save.complete(this.level.id, this.got, this.total);
    this.game.ui.setLevelMode(false, false);
    this.game.ui.showComplete(this.index, this.got, this.total);
  }

  // ---------- Desenho ----------
  draw(ctx, v) {
    const G = this.geo(v), t = this.t;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const playing = this.state === 'play';
    const lx = Math.round(this.lx === null ? v.w / 2 : this.lx), ly = Math.round(this.lx === null ? G.hy : this.ly);

    this.paintWorld(ctx, v, G, false);

    // notas do canto das aves por identificar
    for (const n of this.notes) {
      const x = Math.round(n.x), y = Math.round(n.y);
      R(x + 2, y, 1, 5, INK); R(x + 2, y, 3, 1, INK); R(x, y + 3, 3, 2, INK);
    }
    this.fx.draw(ctx);

    // o bando de flamingos do final
    if (this.state === 'end' || this.state === 'done') {
      const f = this.art.voo;
      for (let i = 0; i < 7; i++) {
        const k = Math.abs(i - 3);
        const x = -30 - k * 14 + this.timer * (v.w + 160) / 5.5, y = G.hy * 0.62 + (i - 3) * 6 + Math.sin(t * 3 + i) * 2;
        ctx.drawImage(f[Math.floor(t * 5 + i) % 2].r, Math.round(x), Math.round(y));
      }
    }

    if (this.state === 'paint' || this.state === 'gallery') this.drawPainting(ctx, v, G, R);

    // Os binóculos: contorno, e lá dentro a paisagem ampliada para o dobro, a cores
    if (playing) {
      this.lensPath(ctx, lx, ly, LENS + 2);
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.save();
      this.lensPath(ctx, lx, ly, LENS);
      ctx.clip();
      ctx.translate(lx, ly);
      ctx.scale(2, 2);
      ctx.translate(-lx, -ly);
      this.paintWorld(ctx, v, G, true);
      ctx.restore();
      ctx.save();
      this.lensPath(ctx, lx, ly, LENS);
      ctx.clip();
      R(lx - SEP - LENS, ly - LENS, 2 * (SEP + LENS), 2 * LENS, this.flash > 0 ? 'rgba(255,255,255,0.75)' : 'rgba(190,225,255,0.07)');
      R(lx - 3, ly, 7, 1, 'rgba(43,29,46,0.45)');      // mira
      R(lx, ly - 3, 1, 7, 'rgba(43,29,46,0.45)');
      ctx.restore();
      const f = Math.max(0, ...this.birds.map((b) => b.focus));
      if (f > 0) {
        R(lx - 15, ly + LENS + 4, 30, 5, INK);
        R(lx - 14, ly + LENS + 5, 28 * Math.min(1, f), 3, GOLD);
      }
    }

    // O casal, de binóculos e guia de campo na mão, e o telescópio no tripé
    const by = G.baseY, hop = this.joy > 0 ? Math.round(Math.abs(Math.sin(t * 9)) * 3) : 0;
    R(74, by - 30, 14, 5, INK); R(75, by - 29, 12, 3, '#5a6a7a'); R(86, by - 31, 4, 7, INK);
    R(79, by - 25, 1, 25, INK); R(75, by - 14, 1, 14, INK); R(84, by - 14, 1, 14, INK);
    R(76, by - 16, 2, 2, INK); R(82, by - 16, 2, 2, INK);
    ctx.drawImage(this.sergio.stand.r, 6, by - 48, 32, 48);
    R(26, by - 34, 11, 6, INK); R(27, by - 33, 9, 4, '#3a3a44'); R(35, by - 33, 2, 4, '#9fd3e8');
    ctx.drawImage(this.luisa.stand.r, 38, by - 48 - hop, 32, 48);
    R(57, by - 20 - hop, 11, 9, INK); R(58, by - 19 - hop, 9, 7, '#c2384a'); R(59, by - 18 - hop, 7, 2, '#ffffff');

    this.drawNotebook(ctx, v, G, R);
  }

  // A folha de aguarela com a ave da vez, a paleta e o pincel; no fim, as três aguarelas lado a lado.
  drawPainting(ctx, v, G, R) {
    const p = this.paint, cx = Math.round(v.w / 2);
    const sheet = (x, y, w, h, id, keys, done) => {
      R(x + 2, y + 3, w, h, 'rgba(43,29,46,0.25)');
      R(x - 1, y - 1, w + 2, h + 2, INK); R(x, y, w, h, '#fffaf0'); R(x, y, w, 2, '#e8dcc0');
      const img = this.sheetImg(id, keys), a = PAINT_ART[id];
      const scale = Math.max(1, Math.floor(Math.min((w - 10) / img.width, (h - 8) / img.height)));
      const ix = Math.round(x + (w - img.width * scale) / 2), iy = Math.round(y + (h - img.height * scale) / 2);
      if (keys) {
        // manchas de aguarela por trás do desenho, como num caderno de campo
        ctx.globalAlpha = 0.45;
        R(ix - 6, iy + Math.round(img.height * scale * 0.15), img.width * scale + 12, Math.round(img.height * scale * 0.3), a.wash[0]);
        R(ix - 3, iy + Math.round(img.height * scale * 0.55), img.width * scale + 6, Math.round(img.height * scale * 0.3), a.wash[1]);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(img, ix, iy, img.width * scale, img.height * scale);
      if (done) {   // a assinatura da Luísa: um «L» e um ponto, ao canto
        R(x + w - 9, y + h - 8, 1, 5, INK); R(x + w - 9, y + h - 4, 3, 1, INK); R(x + w - 4, y + h - 4, 1, 1, INK);
      }
    };
    if (this.state === 'gallery') {
      const w = 60, h = 50, gap = 8, x0 = cx - Math.round((p.birds.length * (w + gap) - gap) / 2), y = Math.round(G.hy - 20);
      p.birds.forEach((id, i) => sheet(x0 + i * (w + gap), y + Math.round(Math.sin(this.t * 3 + i) * 2), w, h, id, p.painted[i], true));
      return;
    }
    const w = 120, h = 84, x = cx - 60, y = v.portrait ? 44 : 30;
    sheet(x, y, w, h, p.birds[p.k], p.painted[p.k], p.showT > 0);
    // a paleta e o pincel a passar pelas cores
    const n = PALETTE.length, bw = 14, px0 = cx - Math.round((n * bw) / 2), py = y + h + 10;
    R(px0 - 3, py - 3, n * bw + 6, 16, INK); R(px0 - 2, py - 2, n * bw + 4, 14, '#e8dcc0');
    PALETTE.forEach((c, i) => {
      R(px0 + i * bw + 2, py, 10, 10, c.c);
      if (i === p.brush && p.showT <= 0) {
        const b = Math.round(Math.abs(Math.sin(this.t * 8)) * 2), hx = px0 + i * bw + 5;
        R(hx + 1, py - 16 - b, 2, 10, '#c98f52'); R(hx, py - 6 - b, 4, 3, '#8a93a7'); R(hx + 1, py - 3 - b, 2, 2, c.c);
      }
    });
  }

  // As duas lentes: reunião de dois círculos, linha a linha, para ficar bem "pixelizado".
  lensPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let dy = -r; dy < r; dy++) {
      const hw = Math.round(Math.sqrt(r * r - (dy + 0.5) * (dy + 0.5)));
      ctx.rect(cx - SEP - hw, cy + dy, 2 * hw, 1);
      ctx.rect(cx + SEP - hw, cy + dy, 2 * hw, 1);
    }
  }

  // O caderno de campo: uma casa por espécie, que ganha cor quando é identificada.
  drawNotebook(ctx, v, G, R) {
    const n = this.species.length, cw = 15, w = n * cw + 5;
    const x = v.portrait ? Math.round((v.w - w) / 2) : v.w - w - 6, y = v.portrait ? G.baseY + 10 : v.h - 24;
    R(x - 1, y - 1, w + 2, 22, INK);
    R(x, y, w, 20, '#f6ecd2');
    R(x, y, w, 2, '#c2384a');
    this.species.forEach((s, i) => {
      const f = this.art[s.id][0], ok = this.found.has(s.id), img = ok ? f.r : f.sr;
      const k = Math.min(12 / img.width, 14 / img.height, 1);
      const dw = Math.max(1, Math.round(img.width * k)), dh = Math.max(1, Math.round(img.height * k));
      const cx = x + 3 + i * cw;
      if (ok) R(cx, y + 3, cw - 1, 16, '#fff7c9');
      ctx.globalAlpha = ok ? 1 : 0.35;
      ctx.drawImage(img, cx + Math.floor((cw - 1 - dw) / 2), y + 18 - dh, dw, dh);
      ctx.globalAlpha = 1;
    });
  }

  // A paisagem. Com `reveal` (dentro dos binóculos) as aves aparecem a cores.
  paintWorld(ctx, v, G, reveal) {
    const t = this.t, hy = G.hy, shore = G.shore;
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const disc = (cx, cy, r, c) => {
      for (let dy = -r; dy < r; dy++) {
        const hw = Math.round(Math.sqrt(r * r - (dy + 0.5) * (dy + 0.5)));
        R(cx - hw, cy + dy, 2 * hw, 1, c);
      }
    };

    // céu da manhã, sol e nuvens
    ['#7cc4ee', '#96d2f2', '#b4e0f5', '#d6eef5', '#fbe9c8'].forEach((c, i) => R(0, Math.floor((hy * i) / 5), v.w, Math.ceil(hy / 5) + 1, c));
    disc(Math.round(v.w * 0.66), Math.round(hy * 0.55), 9, '#fff6c4');
    for (let i = 0; i < 3; i++) {
      const cx = ((i * 131 + t * 2.5) % (v.w + 70)) - 35, cy = Math.round(hy * (0.22 + i * 0.17));
      R(cx - 12, cy, 24, 5, '#ffffff'); R(cx - 7, cy - 3, 12, 3, '#ffffff'); R(cx - 16, cy + 2, 32, 3, '#ffffff');
    }
    // colinas ao longe
    for (let x = 0; x < v.w; x += 2) {
      const a = Math.round(8 + 5 * Math.sin(x * 0.035 + 1) + 4 * Math.sin(x * 0.013));
      R(x, hy - a, 2, a, '#a9cdb4');
      const b = Math.round(3 + 3 * Math.sin(x * 0.05 + 3) + 2 * Math.sin(x * 0.02));
      R(x, hy - b, 2, b, '#86b592');
    }
    // a lagoa
    R(0, hy, v.w, G.wh, '#6bb4d8');
    R(0, hy, v.w, 3, '#a6d8ea');
    R(0, hy + 3, v.w, 4, '#86c6e2');
    R(v.w * 0.46, hy + 6, v.w * 0.3, 2, '#d8c79a');
    for (let j = 0, y = hy + 10; y < shore - 2; y += 6, j++) for (let i = 0; i < 6; i++) {
      if ((i + j + Math.floor(t * 1.5)) % 3 === 0) R((i * 97 + j * 57) % v.w, y, 7, 1, '#a6d8ea');
    }
    // a margem e a relva
    R(0, shore, v.w, v.h - shore, '#86c06c');
    R(0, shore, v.w, 2, '#b99f6c');
    R(0, shore + 2, v.w, 2, '#a5d67e');
    for (let i = 0; i < 40; i++) {
      const x = (i * 71) % v.w, y = shore + 8 + ((i * 37) % Math.max(10, v.h - shore - 10));
      R(x, y, 1, 3, '#5fa052'); R(x + 2, y + 1, 1, 2, '#5fa052');
      if (i % 5 === 0) R(x + 5, y, 2, 2, i % 10 ? '#fff3a8' : '#ffffff');
    }
    // o poste com o ninho da cegonha
    R(G.nestX - 1, G.nestY, 3, shore + 4 - G.nestY, '#6b5238');
    R(G.nestX - 9, G.nestY - 4, 19, 5, '#8a6a40');
    R(G.nestX - 8, G.nestY - 5, 17, 1, '#b08a54');
    R(G.nestX - 10, G.nestY - 2, 21, 1, '#6b5238');
    // a estaca do guarda-rios
    R(G.postX - 1, G.postY, 3, 16, '#6b5238');
    R(G.postX - 3, G.postY + 15, 7, 1, '#a6d8ea');
    // a tabuleta do observatório
    R(G.signX - 1, G.signY, 2, 16, '#6b5238');
    R(G.signX - 8, G.signY + 3, 16, 7, INK);
    R(G.signX - 7, G.signY + 4, 14, 5, '#e8d8a8');
    R(G.signX - 5, G.signY + 6, 10, 1, '#8a6a40');
    // a árvore: tronco com um buraco, um ramo seco e a copa
    R(G.treeX - 8, hy - 12, 16, shore + 8 - (hy - 12), '#7a5a3c');
    R(G.treeX - 8, hy - 12, 3, shore + 8 - (hy - 12), '#8f6c48');
    R(G.treeX + 3, hy + 14, 2, 14, '#65492f');
    R(G.treeX - 32, G.branchY, 26, 2, '#7a5a3c');
    R(G.treeX - 34, G.branchY - 3, 2, 4, '#7a5a3c');
    R(G.treeX - 6, G.holeY - 13, 12, 14, '#3a2a22');
    disc(G.treeX, hy - 28, 21, '#4f8a4a');
    disc(G.treeX - 17, hy - 19, 13, '#4f8a4a');
    disc(G.treeX + 15, hy - 19, 13, '#4f8a4a');
    disc(G.treeX - 6, hy - 34, 10, '#6aa85a');
    disc(G.treeX - 19, hy - 23, 6, '#6aa85a');
    // caniços nas pontas da margem
    for (let i = 0; i < 26; i++) {
      const left = i % 2 === 0, x = left ? (i * 5) % Math.round(v.w * 0.17) : v.w - 1 - ((i * 7) % Math.round(v.w * 0.07));
      const h = 12 + ((i * 13) % 12), sway = Math.round(Math.sin(t * 1.4 + i) * 1);
      R(x, shore + 3 - h, 1, h, i % 3 ? '#6f8f3e' : '#8aa64a');
      if (i % 3 === 0) R(x + sway, shore - h - 1, 2, 4, '#7a5a34');
    }

    // as aves: silhuetas ao longe, a cores nos binóculos (e depois de identificadas)
    for (const b of this.birds) {
      if (b.hidden || b.gone) continue;
      const f = this.art[b.id][b.frame], show = reveal || b.found;
      const img = b.face < 0 ? (show ? f.l : f.sl) : (show ? f.r : f.sr);
      const x = Math.round(b.x - img.width / 2), y = Math.round(b.y - img.height);
      ctx.drawImage(img, x, y);
      if (b.way.type === 'wade' && b.state === 'here') R(b.x - 6, b.y - 1, 12, 1, '#a6d8ea');
    }
  }
}
