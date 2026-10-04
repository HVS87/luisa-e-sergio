// Troços reutilizáveis para construir os níveis de plataformas (a Noruega usa-os; a Madeira usa `lift`).
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

// Sobe um troço n blocos, prolongando para baixo a sua última linha
// (o chão continua chão e os buracos continuam buracos).
export const lift = (chunk, n) => [...chunk, ...Array(n).fill(chunk[chunk.length - 1])];

export const START = [
  '..........',
  '..P.......',
  '##########',
  '##########',
];

export const HEARTS = [
  '....h.......',
  '............',
  '..h...h..h..',
  '############',
  '############',
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
