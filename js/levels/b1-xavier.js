import { START, FLAT, HEARTS, STEPS, GAP, PLATFORMS, CHECKPOINT, END } from './chunks.js';

// Bónus 1 — o nascimento do primeiro filho, o Xavier.
export default {
  id: 'xavier',
  bonus: true,
  title: 'Bem-vindo, Xavier!',
  story: 'Um novo capítulo: a família vai crescer! Preparem tudo para receber o Xavier.',
  outro: 'Nasceu o Xavier!',
  theme: 'nurseryBlue',
  outfit: 'casual',
  goal: 'crib',
  baby: '#8fc4ff',      // cor da mantinha do berço
  companion: true,
  chunks: [START, HEARTS, PLATFORMS, STEPS, CHECKPOINT, GAP, HEARTS, PLATFORMS, FLAT, END],
};
