// Nível 12 (final) — os preparativos do casamento, no relvado da Casa da Beira: é assim que a
// família chama ao Solar dos Soares de Albergaria, a casa da família da Luísa.
// Visto de cima (js/scenes/prep.js, que estende o motor das visitas). A família toda ajuda:
//   1. a tenda            — o Pai da Luísa e o António seguram os postes
//   2. as mesas           — a Catarina trata da carrinha (toalhas e pratos); a Mãe da Luísa e a
//                           Rosarinho fazem os arranjos de flores; a Beatriz, o André e o Pai do Sérgio, as cadeiras
//   3. as luzes           — com o António
//   4. os meninos das alianças — apanhar a Carminho (sempre animada, a correr à volta da tenda),
//                           descobrir o Henrique (escondido atrás de uma japoneira) e levá-los à
//                           Avó Jose, que assiste a tudo da varanda, para o ensaio
//   5. o bolo             — devagar, até à mesa do bolo
// Tudo o que ficar pronto antes do pôr do sol vale um coração.
// Ao concluir este nível, o jogo termina com a animação do casamento (js/scenes/victory.js).
//
// Legenda do mapa (além da dos níveis 5 e 6):
//   I  poste da tenda   Q  mesa redonda   H  gancho das luzes   U  mesa do bolo
//   &  carrinha (toalhas, pratos, luzes e bolo)   J  canteiro das flores   s  regador
//   =  abertura da casa para a varanda   :  chão da varanda   e  balaustrada   D  escadaria
//   Pessoas (ver `npcs`):  @ Avó Jose · N Mãe da Luísa · p Pai da Luísa · z Rosarinho · X Catarina
//                          a António · Y Beatriz · Z Pai do Sérgio · A André (irmão do Sérgio)
export default {
  id: 'preparativos',
  type: 'prep',
  final: true,             // depois deste nível vem o final do jogo
  title: 'Casa da Beira',
  story: 'Véspera do casamento, na Casa da Beira — é assim que a família chama ao Solar dos Soares de Albergaria. Veio a família toda ajudar: há uma tenda para montar, mesas para pôr, luzes para pendurar, dois meninos das alianças para ensaiar e um bolo que tem de chegar inteiro. Que azáfama!',
  help: 'Anda pelo relvado (toca e mantém o dedo no sítio para onde queres ir, ou usa as setas) e vai aonde aparecem as setas: aos postes, à carrinha, ao canteiro, às mesas... e atrás da Carminho e do Henrique! Chega-te à família para ouvir o que têm a dizer. Tudo o que ficar pronto antes do pôr do sol vale um coração.',
  outro: 'Está tudo pronto. Amanhã é o grande dia!',
  firstHint: 'Pai da Luísa: «Bem-vindos à azáfama da Casa da Beira! Primeiro a tenda: vão a cada poste, que eu e o António ajudamos.»',
  toMesas: 'Catarina: «A tenda está de pé! Agora as mesas: toalhas e pratos na carrinha, flores com a Rosarinho, no canteiro.»',
  toLuzes: 'António: «As mesas estão lindas! Faltam as luzes: tragam-nas da carrinha.»',
  toMeninos: 'Mãe da Luísa: «Falta ensaiar os meninos das alianças... mas a Carminho fugiu com a almofada e o Henrique escondeu-se!»',
  carminho: 'Carminho: «Apanhaste-me! Outra vez, outra vez!»',
  henrique: 'Henrique: «Cucu! Estava aqui escondido!»',
  ensaio: 'Avó Jose: «Venham cá os dois, que eu ajeito-vos os laços. Que lindos meninos das alianças!»',
  toBolo: 'Pai do Sérgio: «Só falta o bolo! Devagar, que os miúdos andam por aí aos saltos...»',
  ready: 'Tenda montada, mesas postas, luzes acesas, alianças ensaiadas e o bolo no sítio. A Casa da Beira está pronta!',

  // Quem está a ajudar (letras no mapa) e o que diz quando alguém se chega ao pé, conforme a
  // fase (tenda, mesas, luzes, meninos, bolo); `any` serve para as outras fases.
  npcs: { '@': 'avojose', N: 'maeluisa', p: 'pailuisa', z: 'rosarinho', X: 'catarina', a: 'antonio', Y: 'beatriz', Z: 'pai', A: 'andre' },
  folk: {
    avojose: {
      any: 'Avó Jose (da varanda): «Daqui vejo tudo! Está a ficar uma beleza, meus queridos.»',
      meninos: 'Avó Jose (da varanda): «A Carminho passou agora a correr... e o Henrique, cheira-me que anda perto das japoneiras!»',
    },
    maeluisa: {
      tenda: 'Mãe da Luísa: «As flores são comigo e com a Rosarinho. Vocês tratem da tenda!»',
      mesas: 'Mãe da Luísa: «Um arranjo para cada mesa. São flores cá do jardim!»',
      any: 'Mãe da Luísa: «A Casa da Beira nunca esteve tão bonita!»',
    },
    pailuisa: {
      tenda: 'Pai da Luísa: «Eu seguro o poste e tu levantas. Um, dois, três!»',
      any: 'Pai da Luísa: «Amanhã é o grande dia da minha filha. Vamos lá acabar isto!»',
    },
    antonio: {
      tenda: 'António: «Quando o poste subir, eu prendo a corda. Força!»',
      luzes: 'António: «Passa-me as luzes, que eu chego lá acima!»',
      any: 'António: «Mana, isto vai ficar de arromba!»',
    },
    rosarinho: {
      mesas: 'Rosarinho: «Mais um arranjo pronto! Cuidado com a Carminho, que anda por aí a correr.»',
      any: 'Rosarinho: «Um raminho aqui, outro ali... fica um mimo!»',
    },
    catarina: {
      mesas: 'Catarina: «Toalhas e pratos, tudo contado. Leva uma coisa de cada vez!»',
      luzes: 'Catarina: «As luzes estão aqui na carrinha.»',
      bolo: 'Catarina: «O bolo! Devagarinho... nem quero olhar!»',
      any: 'Catarina: «Eu trato da carrinha: é só pedir.»',
    },
    beatriz: { any: 'Beatriz: «Eu, o André e o pai tratamos das cadeiras. Mano, despachem a tenda e as mesas!»' },
    andre: {
      meninos: 'André: «A Carminho? Passou por aqui a correr, com a almofada debaixo do braço!»',
      any: 'André: «Mano, as cadeiras são connosco. Amanhã só tens de aparecer... e dizer que sim!»',
    },
    pai: { any: 'Pai do Sérgio: «As cadeiras são connosco. Amanhã é o grande dia!»' },
  },

  // Os sobrinhos (posições em blocos): o percurso da Carminho à volta da tenda, onde o Henrique
  // espera ao princípio e a japoneira atrás da qual se esconde.
  kids: { loop: [[1, 7], [17, 7], [17, 14], [1, 14]], home: [21, 16], hide: [6, 6] },

  start: 'relvado',
  maps: {
    relvado: {
      rows: [
        'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
        'WwWWwWWwWWWWWWbWWWWWWWwWWwWWwW',
        'WWWWWwWWWWW=======WWWWWwWWWWWW',
        ':::::::::::::::::::::@m:::::::',
        'eeeeeeeeeeeeeeDeeeeeeeeeeeeeee',
        '.t...........,,,,..........t..',
        '..f.f.f......,,,,......f.f.f..',
        '...................B..........',
        '..p.I...H..H...Ia..B..........',
        '...................B..........',
        '.......Q....Q......s...Xx&x...',
        '...................B..........',
        '...................B..........',
        '.........Q..U......B..........',
        '...................s..........',
        '....I..........I...B..NzJ.....',
        '.YZA...............B....f.f...',
        '..L................B..........',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      ],
    },
  },
};
