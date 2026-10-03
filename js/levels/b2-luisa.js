import { START, FLAT, HEARTS, STEPS, GAP, BRIDGE, PLATFORMS, CHECKPOINT, END } from './chunks.js';

// Bónus 2 — o nascimento da segunda filha, a pequena Luísa
// (não confundir com a mãe, também Luísa: o id deste nível é 'luisinha').
export default {
  id: 'luisinha',
  bonus: true,
  title: 'Bem-vinda, pequena Luísa!',
  story: 'E quando parecia que o coração já estava cheio... chega a pequena Luísa, para completar a família!',
  outro: 'Nasceu a pequena Luísa!',
  theme: 'nurseryPink',
  outfit: 'casual',
  goal: 'crib',
  baby: '#ff9fc6',
  companion: true,
  chunks: [START, HEARTS, STEPS, BRIDGE, CHECKPOINT, PLATFORMS, HEARTS, GAP, HEARTS, FLAT, END],
};
