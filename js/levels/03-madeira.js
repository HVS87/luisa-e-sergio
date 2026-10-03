// Nível 3 — Madeira: o Sérgio apresenta a Luísa à família.
// Nível de plataformas em quatro zonas: Funchal (mercado), levada na serra,
// descida de carro de cesto desde o Monte e, por fim, a casa da família em Santana.
import { lift } from './chunks.js';

// Legenda extra deste nível:
//   N  familiar (pela ordem de `npcs`)   1-4  iguaria (pela ordem de `items`)
//   S  início do carro de cesto           F    fim do carro de cesto
const INICIO = [
  '..........',
  '..P.......',
  '##########',
  '##########',
];
const MERCADO = [
  '....h...........',
  '...........1....',
  '...---....---...',
  '..h.....h.......',
  '################',
  '################',
];
const FAMILIAR = [
  '........',
  '....N...',
  '########',
  '########',
];
const CORACOES = [
  '....h.......',
  '............',
  '..h...h..h..',
  '############',
  '############',
];
const SUBIDA = [
  '..........',
  '....h.....',
  '##########',
  '##########',
];
const PONTE = [
  '......h.....',
  '............',
  '.....---....',
  '###......###',
  '###......###',
];
const NEVOEIRO = [
  '......h.......',
  '..............',
  '.......w......',
  '##############',
  '##############',
];
const MIRADOURO = [
  '.........2......',
  '................',
  '........---.....',
  '....h...........',
  '...---.......h..',
  '................',
  '################',
  '################',
];
const PEDRAS = [
  '.....h......',
  '............',
  '.....^^.....',
  '############',
  '############',
];
const MONTE = [
  '................',
  '..3....N.....S..',
  '################',
  '################',
];
// Descida de carro de cesto: o carro anda sozinho, só se salta.
const D_CORACOES = [
  '..........',
  '..h..h..h.',
  '##########',
  '##########',
];
const D_PEDRA = [
  '......h.....',
  '............',
  '......^^....',
  '############',
  '############',
];
const D_BURACO = [
  '.....hh.....',
  '............',
  '............',
  '####...#####',
  '####...#####',
];
const D_PASSAGEM = [
  '............',
  '.C....^^....',
  '############',
  '############',
];
const D_DUAS = [
  '...h.......h....',
  '................',
  '...^.......^^...',
  '################',
  '################',
];
const CHEGADA = [
  '..........',
  '..F..C....',
  '##########',
  '##########',
];
const HORTENSIAS = [
  '......4.......',
  '..............',
  '.....---......',
  '..h........h..',
  '##############',
  '##############',
];
const CASA = [
  '......................',
  '.......G..............',
  '######################',
  '######################',
];

export default {
  id: 'madeira',
  title: 'Na Madeira',
  story: 'O Sérgio cresceu na Madeira e chegou a hora de apresentar a Luísa à família! Depois de uma aterragem de cortar a respiração, esperam-nos o mercado, uma levada na serra e uma descida de carro de cesto até casa.',
  help: 'A família vai aparecendo pelo caminho. Apanha os corações e as quatro iguarias da ilha. No carro de cesto não há travões: ele anda sozinho e tu só saltas!',
  outro: 'Aprovada por toda a família. Bem-vinda à Madeira, Luísa!',
  theme: 'funchal',
  outfit: 'casual',
  goal: 'house',
  companion: true,
  rows: 15,

  // Iguarias (números 1 a 4 no mapa)
  items: [
    { kind: 'banana', name: 'Banana da Madeira: pequenina e doce!' },
    { kind: 'caco', name: 'Bolo do caco com manteiga de alho!' },
    { kind: 'poncha', name: 'Uma poncha, para dar coragem!' },
    { kind: 'espetada', name: 'Espetada em pau de louro!' },
  ],

  // Família pelo caminho (letras N no mapa, da esquerda para a direita).
  // look: aspeto definido em js/sprites.js · rides: conduz o carro de cesto
  npcs: [
    { look: 'tia', line: 'Tia: «Então esta é que é a Luísa? Ai que linda! Levem fruta do mercado!»' },
    { look: 'primo', line: 'Primo: «A levada é sempre a direito... Cuidado é com o nevoeiro!»' },
    { look: 'tio', rides: true, line: 'Tio: «Saltem para o carro de cesto! Travões? São as minhas botas!»' },
  ],
  sledEnd: 'Chegámos ao fundo da ladeira! Obrigado, tio!',
  // Quem recebe o casal à porta de casa
  host: { look: 'avo', line: 'Avó: «Entrem, entrem! Há espetada e milho frito, e ninguém sai sem repetir!»' },

  // { zone, base } muda o cenário a partir desse ponto (base = altura do chão da zona, em blocos).
  chunks: [
    { zone: 'funchal', base: 0 },
    INICIO, MERCADO, FAMILIAR, CORACOES,
    lift(SUBIDA, 1), lift(SUBIDA, 2),
    { zone: 'levada', base: 4 },
    lift(PONTE, 3), lift(NEVOEIRO, 4), lift(MIRADOURO, 5), lift(FAMILIAR, 6), lift(PEDRAS, 7), lift(MONTE, 8),
    { zone: 'funchal', base: 3 },
    lift(D_CORACOES, 8), lift(D_PEDRA, 7), lift(D_BURACO, 6), lift(D_CORACOES, 5),
    lift(D_PASSAGEM, 4), lift(D_DUAS, 3), lift(D_BURACO, 2), lift(D_CORACOES, 1),
    CHEGADA,
    { zone: 'santana', base: 0 },
    HORTENSIAS, CORACOES, CASA,
  ],
};
