import { START, FLAT, HEARTS, STEPS, GAP, BRIDGE, PLATFORMS, SPIKES, WALKER, CHECKPOINT, END } from './chunks.js';

// Nível 3 — as férias juntos, na praia.
export default {
  id: 'ferias',
  title: 'Férias a Dois',
  story: 'Malas feitas, protetor solar e boa disposição: chegaram as primeiras férias juntos!',
  outro: 'Umas férias inesquecíveis!',
  theme: 'beach',
  outfit: 'beach',
  goal: 'flag',
  companion: true,
  chunks: [START, HEARTS, BRIDGE, PLATFORMS, SPIKES, CHECKPOINT, GAP, STEPS, WALKER, BRIDGE, HEARTS, FLAT, END],
};
