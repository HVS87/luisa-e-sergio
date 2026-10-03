// Lista ordenada de níveis. Para acrescentar um capítulo novo, cria um ficheiro
// nesta pasta e junta-o aqui, na posição certa da história.
import { LEVEL_ROWS } from '../config.js';
import encontro from './01-encontro.js';
import trabalho from './02-trabalho.js';
import ferias from './03-ferias.js';
import pedido from './04-pedido.js';
import casamento from './05-casamento.js';
import xavier from './b1-xavier.js';
import luisinha from './b2-luisa.js';

// Os níveis da história vêm primeiro (o último tem `final: true`), seguidos dos bónus.
export const LEVELS = [encontro, trabalho, ferias, pedido, casamento, xavier, luisinha];

// Etiqueta de cada nível: "Nível 3", "Bónus 1", ...
export function levelLabel(index) {
  const L = LEVELS[index];
  const n = LEVELS.slice(0, index + 1).filter((x) => !!x.bonus === !!L.bonus).length;
  return (L.bonus ? 'Bónus ' : 'Nível ') + n;
}

// Cola os troços de um nível numa grelha [linha][coluna] de caracteres.
export function buildGrid(chunks, rows = LEVEL_ROWS) {
  const grid = Array.from({ length: rows }, () => []);
  for (const chunk of chunks) {
    const w = Math.max(...chunk.map((r) => r.length));
    const padTop = rows - chunk.length;
    for (let y = 0; y < rows; y++) {
      const src = y >= padTop ? chunk[y - padTop] : '';
      for (let x = 0; x < w; x++) grid[y].push(src[x] || '.');
    }
  }
  return grid;
}
