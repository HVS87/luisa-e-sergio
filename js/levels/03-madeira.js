// Nível 3 — Madeira: o Sérgio apresenta a Luísa à família.
// Nível de plataformas em quatro zonas: Funchal (mercado), levada na serra,
// descida de carro de cesto desde o Monte e, por fim, a casa da família em Santana.
// A família do Sérgio na Madeira: o pai e a irmã mais nova, Beatriz.
import { lift } from './chunks.js';

// Legenda extra deste nível:
//   N  pessoa (pela ordem de `npcs`)     1-4  iguaria (pela ordem de `items`)
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
const ENCONTRO = [
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
  help: 'A Beatriz, a irmã mais nova do Sérgio, vai aparecendo pelo caminho, e o pai espera em casa. Apanha os corações e as quatro iguarias da ilha. No carro de cesto não há travões: ele anda sozinho e tu só saltas!',
  outro: 'Aprovada pelo pai e pela Beatriz. Bem-vinda à Madeira, Luísa!',
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

  // Quem se encontra pelo caminho (letras N no mapa, da esquerda para a direita).
  // look: aspeto definido em js/sprites.js · family: junta-se à porta de casa no final
  // rides: conduz o carro de cesto
  // Na Madeira vivem o pai do Sérgio e a irmã mais nova, Beatriz.
  npcs: [
    { look: 'beatriz', family: true, line: 'Beatriz: «Mano! Então esta é que é a Luísa? Finalmente! O pai está à vossa espera em casa.»' },
    { look: 'beatriz', family: true, line: 'Beatriz: «Apanhei um atalho! A levada é sempre a direito... cuidado é com o nevoeiro.»' },
    { look: 'carreiro', rides: true, line: 'Carreiro: «Saltem para o carro de cesto! Travões? São as minhas botas!»' },
  ],
  sledEnd: 'Chegámos ao fundo da ladeira! Obrigado pela boleia!',
  // Quem recebe o casal à porta de casa
  host: { look: 'pai', line: 'Pai: «Entrem, entrem! Há espetada e milho frito, e ninguém sai sem repetir!»' },

  // { zone, base } muda o cenário a partir desse ponto (base = altura do chão da zona, em blocos).
  chunks: [
    { zone: 'funchal', base: 0 },
    INICIO, MERCADO, ENCONTRO, CORACOES,
    lift(SUBIDA, 1), lift(SUBIDA, 2),
    { zone: 'levada', base: 4 },
    lift(PONTE, 3), lift(NEVOEIRO, 4), lift(MIRADOURO, 5), lift(ENCONTRO, 6), lift(PEDRAS, 7), lift(MONTE, 8),
    { zone: 'funchal', base: 3 },
    lift(D_CORACOES, 8), lift(D_PEDRA, 7), lift(D_BURACO, 6), lift(D_CORACOES, 5),
    lift(D_PASSAGEM, 4), lift(D_DUAS, 3), lift(D_BURACO, 2), lift(D_CORACOES, 1),
    CHEGADA,
    { zone: 'santana', base: 0 },
    HORTENSIAS, CORACOES, CASA,
  ],
};
