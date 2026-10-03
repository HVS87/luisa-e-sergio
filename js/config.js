// Constantes globais do jogo.
export const TILE = 16;          // tamanho de um bloco, em píxeis de jogo
export const LEVEL_ROWS = 11;    // altura normal de um nível, em blocos

// Altura (deitado) / largura (ao alto) aproximada da área de jogo, em píxeis de jogo.
export const VIEW_LANDSCAPE_H = 180;
export const VIEW_LANDSCAPE_MIN_W = 300;   // largura mínima, deitado, nos ecrãs quase quadrados
export const VIEW_PORTRAIT_W = 250;

export const PHYS = {
  speed: 90,       // px/s
  accel: 900,
  friction: 1100,
  gravity: 900,
  jump: 285,       // velocidade inicial do salto (~2,8 blocos de altura)
  cut: 0.45,       // fração da velocidade mantida ao largar o salto
  maxFall: 320,
  coyote: 0.09,    // tolerância para saltar depois de sair de uma plataforma
  buffer: 0.12,    // tolerância para carregar no salto antes de aterrar
};

export const SAVE_KEY = 'luisa-sergio-v1';
export const ANOS_CASADOS = 4;
export const WEDDING_DATE = '08-10-22';            // mostrada no ecrã final
export const WEDDING_DAY = '8 de outubro de 2022'; // usada na animação do casamento
