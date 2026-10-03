// Troços reutilizáveis para construir níveis.
// Um nível é uma sequência de troços colados da esquerda para a direita.
// Cada troço é desenhado de cima para baixo e alinha pela base (as duas últimas
// linhas costumam ser chão). Linhas em falta por cima contam como vazias.
//
// Legenda:
//   .  vazio                 #  chão / parede
//   -  plataforma (dá para saltar através por baixo)
//   h  coração               ^  espinhos
//   w  nuvem cinzenta        C  ponto de passagem (checkpoint)
//   P  início do jogador     G  meta do nível
//
// Limites do salto: sobe até 2 blocos e atravessa buracos de até 3 blocos.

export const START = [
  '..........',
  '..P.......',
  '##########',
  '##########',
];

export const FLAT = [
  '........',
  '########',
  '########',
];

export const HEARTS = [
  '....h.......',
  '............',
  '..h...h..h..',
  '############',
  '############',
];

export const GAP = [
  '.....h......',
  '............',
  '............',
  '####...#####',
  '####...#####',
];

export const BRIDGE = [
  '......h.....',
  '............',
  '.....---....',
  '###......###',
  '###......###',
];

export const STEPS = [
  '......hh......',
  '......##......',
  '....######....',
  '..##########..',
  '##############',
  '##############',
];

export const PLATFORMS = [
  '.........h......',
  '................',
  '........---.....',
  '....h...........',
  '...---.......h..',
  '................',
  '################',
  '################',
];

export const SPIKES = [
  '.....h......',
  '............',
  '.....^^.....',
  '############',
  '############',
];

export const WALKER = [
  '..............',
  '.......w......',
  '##############',
  '##############',
];

export const CHECKPOINT = [
  '......',
  '..C...',
  '######',
  '######',
];

export const END = [
  '............',
  '.......G....',
  '############',
  '############',
];
