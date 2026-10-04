// Nível 11 — a casa nova: uma vivenda de dois andares, com jardim e piscina, em Campolide,
// mesmo junto ao Aqueduto das Águas Livres. Quem orienta a obra é o Tio Alberto, tio da
// Luísa e arquiteto (ver js/scenes/house.js). No fim penduram-se na sala as fotografias das
// memórias dos níveis anteriores: as mesmas recordações do pedido, mais o próprio pedido.
import pedido from './10-pedido.js';

export default {
  id: 'casa',
  type: 'house',
  title: 'A Nossa Casa',
  story: 'Depois do sim, um sonho a dois: uma casa só deles. Uma vivenda de dois andares, com jardim e piscina, em Campolide, mesmo junto ao Aqueduto das Águas Livres. E quem melhor para orientar a obra do que o Tio Alberto, o tio arquiteto da Luísa?',
  help: 'Toca no ecrã (ou Espaço) para largar cada peça da grua em cima da planta azul: à primeira e bem ao centro vale um coração. Na piscina, mantém premido para a encher até à linha dos azulejos. No fim, pendura as fotografias: toca quando o quadro estiver direito.',
  outro: 'Uma casa nova, cheia de memórias.',

  intro: 'Tio Alberto: «Então, prontos para a obra? Eu trago a planta, vocês trazem a vontade!»',
  // instrução de cada peça, de baixo para cima
  pieces: [
    'Tio Alberto: «Primeiro as fundações. Uma casa forte começa por baixo!» Larga a peça por cima da planta.',
    'Tio Alberto: «O rés-do-chão: a sala abre para o jardim, com janelas grandes.»',
    'Tio Alberto: «Agora a laje. Bem nivelada, que é aqui que assenta o primeiro andar.»',
    'Tio Alberto: «O primeiro andar: os quartos e uma varanda virada para o Aqueduto.»',
    'Tio Alberto: «Por fim, o telhado. Telha portuguesa, claro!»',
  ],
  perfect: 'Tio Alberto: «Ao milímetro! Assim dá gosto.»',
  near: 'Tio Alberto: «Um nadinha ao lado... eu acerto com o nível.»',
  miss: 'Tio Alberto: «Isso fica fora da planta! Volta a subir.»',
  fact: 'Tio Alberto: «Sabiam que o Aqueduto resistiu ao terramoto de 1755? E o Arco Grande tem mais de 65 metros de altura!»',
  built: 'A casa está de pé! Agora, o jardim e a piscina.',

  poolHint: 'A piscina: mantém premido para a encher e larga quando a água chegar à linha dos azulejos.',
  poolLow: 'Ainda falta um bocadinho de água!',
  poolOver: 'Transbordou! Vamos tirar um pouco de água e tentar outra vez.',
  poolDone: 'Tio Alberto: «Pronta para o primeiro mergulho!»',
  gardenLine: 'Tio Alberto: «Uma oliveira, um limoeiro e alfazema: o jardim vai cheirar a verão.»',

  photosHint: 'Falta o mais importante: as fotografias! Cada quadro balança: pendura-o quando estiver direito.',
  straight: 'Direitinho!',
  crooked: 'Ficou um pouco torto... mas tem a sua graça.',
  ending: 'Tio Alberto: «Agora sim: já não é uma obra, é a vossa casa.»',

  // As fotografias da parede: uma por cada nível anterior (as recordações do pedido e o pedido).
  photos: [
    ...pedido.memories,
    { icon: 'colar', text: 'O pedido, junto à árvore de Natal: ela disse que sim!' },
  ],
};
