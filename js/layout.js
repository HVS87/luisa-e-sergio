// Onde fica a área de jogo no ecrã e onde ficam os botões táteis.
//
// - Telemóvel/tablet, nos níveis jogados com os botões ◀ ▶ ▲ (plataformas e bicicleta): os
//   botões ficam sempre FORA da área de jogo, no espaço que sobra do ecrã:
//     · ao alto: numa barra por baixo do jogo;
//     · deitado: em duas faixas laterais (◀ ▶ à esquerda, ▲ à direita), se o ecrã for largo
//       que chegue (telemóveis); senão (tablets, quase quadrados), numa barra por baixo.
// - Telemóvel/tablet, nos minijogos (sem botões): o jogo ocupa o ecrã todo, em qualquer posição.
// - Computador: sempre a versão horizontal. Uma janela mais alta do que larga mostra o jogo
//   numa moldura 16:9, com faixas escuras por cima e por baixo.
//
// Tudo em píxeis CSS. Função pura, para poder ser testada com qualquer tamanho de ecrã.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const MARGIN = 10;          // folga à volta dos botões
export const SIDE_MIN_ASPECT = 1.2; // proporção mínima do jogo para usar as faixas laterais
export const PC_MIN_ASPECT = 4 / 3, PC_MAX_ASPECT = 2.4;

// W, H: janela · mobile: telemóvel ou tablet · controls: mostrar os botões ◀ ▶ ▲
// safe: margens seguras do ecrã (entalhe, cantos redondos, barra do sistema) { t, r, b, l }
// Devolve { x, y, w, h } (área de jogo), mode ('none' | 'bar' | 'side'), tb (tamanho de um
// botão) e bar (altura da barra de botões, no modo 'bar').
export function computeLayout({ W, H, mobile, controls, safe = { t: 0, r: 0, b: 0, l: 0 } }) {
  const full = { x: 0, y: 0, w: W, h: H, mode: 'none', tb: 0, bar: 0 };

  if (controls) {
    if (H >= W) {
      // ao alto: barra por baixo do jogo, à altura dos polegares
      const tb = Math.round(clamp(Math.min(W * 0.21, H * 0.12), 56, 96));
      const bar = Math.round(Math.min(H * 0.3, tb * 2.1 + safe.b));
      return { ...full, h: H - bar, mode: 'bar', tb, bar };
    }
    // deitado: faixas laterais, se ainda sobrar um jogo com boa proporção
    const tb = Math.round(clamp(H * 0.15, 52, 68));
    const left = safe.l + MARGIN + 2 * tb + Math.round(tb * 0.14) + MARGIN;
    const right = safe.r + MARGIN + tb + MARGIN;
    if ((W - left - right) / H >= SIDE_MIN_ASPECT) return { x: left, y: 0, w: W - left - right, h: H, mode: 'side', tb, bar: 0 };
    // ecrã quase quadrado (tablet deitado): barra por baixo
    const tb2 = Math.round(clamp(H * 0.13, 56, 96));
    const bar = Math.round(tb2 * 1.5 + safe.b);
    return { ...full, h: H - bar, mode: 'bar', tb: tb2, bar };
  }

  if (!mobile) {
    const a = W / H;
    if (a < PC_MIN_ASPECT) {
      const h = Math.round((W * 9) / 16);
      return { ...full, y: Math.round((H - h) / 2), h };
    }
    if (a > PC_MAX_ASPECT) {
      const w = Math.round(H * PC_MAX_ASPECT);
      return { ...full, x: Math.round((W - w) / 2), w };
    }
  }
  return full;
}
