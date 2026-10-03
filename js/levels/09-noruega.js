// Nível 9 — Noruega: a viagem para ver a aurora boreal.
// Primeiro um percurso de plataformas (js/scenes/play.js): a cidade nevada e, depois,
// um trenó puxado por huskies até a um acampamento longe das luzes. No acampamento
// começa a segunda parte (js/scenes/aurora.js): seguir a luz para fazer dançar a aurora.
import { lift, START, HEARTS, PLATFORMS } from './chunks.js';

// Legenda extra: N pessoa (ver `npcs`) · 1-2 objeto (ver `items`) · S/F início e fim do trenó
const GUIA = [
  '................',
  '..1....N.....S..',
  '################',
  '################',
];
const T_CORACOES = [
  '..........',
  '..h..h..h.',
  '##########',
  '##########',
];
const T_PEDRA = [
  '......h.....',
  '............',
  '......^^....',
  '############',
  '############',
];
const T_RIACHO = [       // um riacho gelado para saltar
  '.....hh.....',
  '............',
  '............',
  '####...#####',
  '####...#####',
];
const T_DUAS = [
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
const NEVE = [
  '......2.......',
  '..............',
  '.....---......',
  '..h........h..',
  '##############',
  '##############',
];
const ACAMPAMENTO = [
  '....................',
  '.......G............',
  '####################',
  '####################',
];

export default {
  id: 'noruega',
  then: 'aurora',          // depois de chegar ao acampamento, a aurora
  title: 'Aurora Boreal',
  story: 'Uma viagem ao norte da Noruega, para lá do Círculo Polar Ártico, com um sonho: ver a aurora boreal. Mas primeiro é preciso fugir às luzes da cidade...',
  help: 'Atravessa a cidade nevada e salta para o trenó dos huskies: ele anda sozinho, tu só saltas! No acampamento, mantém o dedo no ecrã (ou usa as setas) e segue a luz para a aurora dançar.',
  outro: 'Há noites que ficam para sempre. Esta foi uma delas.',
  theme: 'tromso',
  outfit: 'winter',
  goal: 'camp',
  companion: true,
  rows: 12,
  sledStyle: 'husky',

  items: [
    { kind: 'cacau', name: 'Chocolate quente, para aquecer as mãos!' },
    { kind: 'camera', name: 'A máquina fotográfica: vai fazer falta mais logo.' },
  ],
  npcs: [
    { look: 'guia', rides: true, line: 'Guia: «Velkommen! Os huskies estão prontos. Agarrem-se bem!»' },
  ],
  sledEnd: 'Chegada ao acampamento, longe das luzes da cidade. Agora é esperar...',

  // Segunda parte: a aurora
  auroraIntro: 'A noite está limpa e gelada. E de repente... uma luz no céu! Mantém o dedo no ecrã e segue-a (ou usa as setas).',
  auroraEnd: 'A aurora boreal, vista a dois.',

  chunks: [
    { zone: 'tromso', base: 3 },
    lift(START, 3), lift(HEARTS, 3), lift(PLATFORMS, 3), lift(HEARTS, 3), lift(GUIA, 3),
    { zone: 'artico', base: 1 },
    lift(T_CORACOES, 3), lift(T_PEDRA, 3), lift(T_RIACHO, 2), lift(T_CORACOES, 2),
    lift(T_DUAS, 1), lift(T_RIACHO, 1), T_PEDRA, T_CORACOES, CHEGADA,
    NEVE, ACAMPAMENTO,
  ],
};
