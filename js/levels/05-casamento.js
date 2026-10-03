import { START, FLAT, HEARTS, STEPS, GAP, BRIDGE, PLATFORMS, CHECKPOINT, END } from './chunks.js';

// Nível 5 (final) — o dia do casamento. Ao concluir, aparece o ecrã de vitória.
export default {
  id: 'casamento',
  title: 'O Casamento',
  story: 'Chegou o grande dia! Família, amigos e muita emoção. {Eu} só tem de chegar ao altar, onde {par} já espera.',
  outro: 'Marido e mulher!',
  theme: 'wedding',
  outfit: 'wedding',
  goal: 'altar',        // o par espera debaixo do arco de flores
  companion: false,
  final: true,
  chunks: [START, HEARTS, STEPS, HEARTS, PLATFORMS, CHECKPOINT, GAP, HEARTS, BRIDGE, STEPS, HEARTS, FLAT, END],
};
