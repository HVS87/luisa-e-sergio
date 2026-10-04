// Ícones das recordações (14x14 píxeis): usados nos presentes do pedido e nas fotografias
// que se penduram na casa nova. R(x, y, w, h, cor) desenha um retângulo; t anima a aurora.
const INK = '#2b1d2e', PINK = '#ff5d8f', GOLD = '#ffd166';

export function drawMemory(R, kind, x, y, t = 0) {
  if (kind === 'osso') { R(x + 2, y + 6, 10, 3, '#b9a67e'); R(x, y + 4, 4, 7, '#b9a67e'); R(x + 10, y + 4, 4, 7, '#b9a67e'); R(x + 3, y + 6, 8, 1, '#e8dcc0'); }
  else if (kind === 'vinho') { R(x + 3, y + 1, 8, 7, '#cfe6f0'); R(x + 4, y + 3, 6, 4, '#8a1f3d'); R(x + 6, y + 8, 2, 5, '#cfe6f0'); R(x + 3, y + 13, 8, 1, '#cfe6f0'); }
  else if (kind === 'banana') { R(x + 1, y + 9, 8, 3, '#ffd84a'); R(x + 7, y + 6, 4, 4, '#ffd84a'); R(x + 10, y + 2, 2, 5, '#ffd84a'); R(x, y + 8, 2, 3, INK); R(x + 10, y + 1, 2, 2, INK); R(x + 2, y + 11, 6, 1, '#f0a93e'); }
  else if (kind === 'bicicleta') {
    for (const wx of [x, x + 8]) { R(wx + 1, y + 6, 4, 1, INK); R(wx + 1, y + 11, 4, 1, INK); R(wx, y + 7, 1, 4, INK); R(wx + 5, y + 7, 1, 4, INK); }
    R(x + 3, y + 8, 5, 1, PINK); R(x + 7, y + 4, 1, 5, PINK); R(x + 5, y + 4, 4, 1, INK); R(x + 10, y + 3, 1, 6, PINK); R(x + 9, y + 3, 4, 1, INK);
  }
  else if (kind === 'buxo') { R(x + 6, y + 11, 2, 3, '#6a4a2a'); R(x + 2, y + 6, 10, 6, '#2f7a40'); R(x + 4, y + 2, 6, 4, '#2f7a40'); R(x + 6, y, 2, 2, '#2f7a40'); R(x + 4, y + 3, 2, 6, '#4f9a55'); }
  else if (kind === 'bola') { R(x + 1, y + 4, 12, 7, INK); R(x + 2, y + 5, 10, 5, '#e0a040'); R(x + 3, y + 5, 7, 1, '#ffe0a0'); R(x + 5, y + 7, 2, 1, '#a8324a'); R(x + 8, y + 8, 2, 1, '#a8324a'); }
  else if (kind === 'binoculos') { R(x + 1, y + 4, 5, 9, INK); R(x + 8, y + 4, 5, 9, INK); R(x + 2, y + 5, 3, 7, '#5a6a7a'); R(x + 9, y + 5, 3, 7, '#5a6a7a'); R(x + 5, y + 6, 4, 3, INK); R(x + 2, y + 11, 3, 1, '#9fd3e8'); R(x + 9, y + 11, 3, 1, '#9fd3e8'); R(x + 2, y + 2, 2, 2, INK); R(x + 10, y + 2, 2, 2, INK); }
  else if (kind === 'mascara') { R(x + 2, y + 4, 10, 7, '#8fd0f5'); R(x + 2, y + 6, 10, 1, '#ffffff'); R(x + 2, y + 8, 10, 1, '#ffffff'); R(x, y + 5, 2, 1, '#ffffff'); R(x + 12, y + 5, 2, 1, '#ffffff'); R(x, y + 9, 2, 1, '#ffffff'); R(x + 12, y + 9, 2, 1, '#ffffff'); }
  else if (kind === 'aurora') {
    R(x, y, 14, 14, '#07102e');
    for (let k = 0; k < 7; k++) { const h = 4 + ((k * 5) % 4); R(x + k * 2, y + 8 - h + Math.round(Math.sin(t * 3 + k)), 2, h, 'rgba(120,255,170,0.85)'); R(x + k * 2, y + 5 - h, 2, 3, 'rgba(150,120,255,0.7)'); }
    R(x, y + 11, 14, 3, '#dfe9f7');
  }
  else if (kind === 'colar') {
    // o colar do pedido: fio de contas douradas com um coração pendurado
    for (const [dx, dy] of [[1, 2], [2, 4], [3, 6], [4, 7], [9, 7], [10, 6], [11, 4], [12, 2]]) R(x + dx, y + dy, 1, 1, GOLD);
    R(x + 5, y + 8, 4, 1, GOLD);
    R(x + 5, y + 9, 2, 2, PINK); R(x + 7, y + 9, 2, 2, PINK); R(x + 5, y + 10, 4, 2, PINK); R(x + 6, y + 12, 2, 1, PINK);
    R(x + 5, y + 9, 1, 1, '#ffffff');
  }
}
