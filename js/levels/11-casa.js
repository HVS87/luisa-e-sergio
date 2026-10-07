// Nível 11 — a casa nova: uma vivenda de dois andares, com jardim e piscina, em Campolide,
// mesmo junto ao Aqueduto das Águas Livres. Quem orienta a obra é o Tio Alberto, tio da
// Luísa e arquiteto (ver js/scenes/house.js). No fim penduram-se na sala as fotografias das
// memórias dos níveis anteriores (as mesmas recordações do pedido, mais o próprio pedido) e a
// aguarela do guarda-rios que a Luísa pintou no observatório (nível 8).
import pedido from './10-pedido.js';

export default {
  id: 'casa',
  type: 'house',
  title: 'A Nossa Casa',
  story: 'Depois do sim, um sonho a dois: uma casa só deles. Uma vivenda de dois andares, com jardim e piscina, em Campolide, mesmo junto ao Aqueduto das Águas Livres. E quem melhor para orientar a obra do que o Tio Alberto, o tio arquiteto da Luísa?',
  help: 'Toca no ecrã (ou Espaço) para largar cada peça da grua em cima da planta azul: à primeira e bem ao centro vale um coração. Depois escolhe a tinta (toca quando a seta estiver na lata de azul-claro), enche a piscina (mantém premido até à linha dos azulejos) e planta o jardim com o Sérgio (toca quando ele passar pela estaca). No fim, pendura as fotografias: toca quando o quadro estiver direito.',
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
  built: 'A casa está de pé! Falta a tinta, a piscina e o jardim.',

  // A tinta: a Luísa escolhe a cor (só uma lata é a certa; ver PAINTS em js/scenes/house.js)
  paintHint: 'Luísa: «A cor é comigo!» Toca quando a seta estiver na lata de azul-claro.',
  paintWrong: 'Tio Alberto: «[cor]?! Hã... não era bem isto. Outra vez.»',   // [cor] = o nome da lata escolhida
  paintRight: 'Tio Alberto: «Azul-claro, tal como no desenho! Que linda.»',

  poolHint: 'A piscina: mantém premido para a encher e larga quando a água chegar à linha dos azulejos.',
  poolLow: 'Ainda falta um bocadinho de água!',
  poolOver: 'Transbordou! Vamos tirar um pouco de água e tentar outra vez.',
  poolDone: 'Tio Alberto: «Pronta para o primeiro mergulho!»',

  // O jardim: o Sérgio planta cada planta na estaca certa e a Luísa rega
  plantHint: 'Sérgio: «O jardim é comigo!» Toca quando ele passar pela estaca para plantar.',
  plants: [
    { kind: 'oliveira', line: 'Tio Alberto: «A oliveira à esquerda da casa, que gosta de sol a tarde toda.»' },
    { kind: 'limoeiro', line: 'Tio Alberto: «O limoeiro ao pé da piscina: limonada à mão de semear!»' },
    { kind: 'alfazema', line: 'Tio Alberto: «E a alfazema à frente da sala, para o jardim cheirar a verão.»' },
  ],
  plantMiss: 'Sérgio: «Aqui não... aqui passa a canalização!»',
  plantGood: 'Luísa: «Boa! Eu rego.»',
  plantPerfect: 'Tio Alberto: «Mesmo na estaca! Tens jeito para isto, Sérgio.»',
  gardenLine: 'Tio Alberto: «Oliveira, limoeiro e alfazema: agora é deixá-los crescer.»',

  photosHint: 'Falta o mais importante: as fotografias! Cada quadro balança: pendura-o quando estiver direito.',
  straight: 'Direitinho!',
  crooked: 'Ficou um pouco torto... mas tem a sua graça.',
  ending: 'Tio Alberto: «Agora sim: já não é uma obra, é a vossa casa.»',

  // Os quadros da parede: uma fotografia por cada nível anterior (as recordações do pedido e o
  // pedido) e, a seguir à das aves, a aguarela do guarda-rios pintada pela Luísa.
  photos: pedido.memories.flatMap((m) => (m.icon === 'binoculos' ? [m, { icon: 'aguarela', text: 'A aguarela do guarda-rios, pintada pela Luísa no observatório.' }] : [m]))
    .concat([{ icon: 'colar', text: 'O pedido, junto à árvore de Natal: ela disse que sim!' }]),
};
