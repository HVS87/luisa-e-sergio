import { START, FLAT, HEARTS, STEPS, GAP, PLATFORMS, END } from './chunks.js';

// Nível 1 — o jogador caminha sozinho até encontrar o seu par.
export default {
  id: 'encontro',
  title: 'O Primeiro Encontro',
  story: 'Há encontros que mudam tudo. Num fim de tarde como tantos outros, dois caminhos cruzaram-se... Leva {eu} até {ao_par}!',
  outro: 'Foi assim que tudo começou!',
  theme: 'park',
  outfit: 'casual',
  goal: 'partner',      // o par espera na meta
  companion: false,
  chunks: [START, HEARTS, STEPS, FLAT, GAP, HEARTS, PLATFORMS, FLAT, END],
};
