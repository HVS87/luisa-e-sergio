import { START, FLAT, HEARTS, STEPS, GAP, BRIDGE, PLATFORMS, SPIKES, CHECKPOINT, END } from './chunks.js';

// Nível 4 — o pedido de casamento, numa noite estrelada.
export default {
  id: 'pedido',
  title: 'O Pedido',
  story: 'Uma noite estrelada, um nervoso miudinho e uma pergunta muito especial...',
  outro: 'E a resposta foi... SIM!',
  theme: 'night',
  outfit: 'night',
  goal: 'flag',
  companion: true,
  chunks: [START, PLATFORMS, HEARTS, GAP, SPIKES, CHECKPOINT, STEPS, BRIDGE, PLATFORMS, GAP, HEARTS, FLAT, END],
};
