import { START, FLAT, HEARTS, STEPS, GAP, PLATFORMS, SPIKES, WALKER, CHECKPOINT, END } from './chunks.js';

// Nível 2 — a vida de trabalho, na cidade.
export default {
  id: 'trabalho',
  title: 'Dias de Trabalho',
  story: 'Entre reuniões, prazos e correrias, há sempre tempo para um café a dois. Atravessem juntos a cidade!',
  outro: 'Mais um dia de trabalho superado — juntos!',
  theme: 'city',
  outfit: 'work',
  goal: 'flag',
  companion: true,      // o par acompanha o jogador
  chunks: [START, HEARTS, WALKER, STEPS, GAP, CHECKPOINT, PLATFORMS, SPIKES, WALKER, HEARTS, FLAT, END],
};
