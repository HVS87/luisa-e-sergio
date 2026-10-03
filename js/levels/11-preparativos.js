// Nível 11 (final) — os preparativos do casamento, no relvado do Solar da família da Luísa.
// Visto de cima (js/scenes/prep.js, que estende o motor das visitas): montar a tenda,
// pôr as mesas, pendurar as luzes e levar o bolo, tudo antes do pôr do sol.
// Ao concluir este nível, o jogo termina com a animação do casamento (js/scenes/victory.js).
//
// Legenda do mapa (além da dos níveis 5 e 6):
//   I  poste da tenda   Q  mesa redonda   H  gancho das luzes   U  mesa do bolo
//   &  carrinha (toalhas, pratos, luzes e bolo)   J  canteiro das flores   s  regador
//   Y Z  quem está a ajudar (ver `npcs`)   1-2  o que dizem (ver `pois`)
export default {
  id: 'preparativos',
  type: 'prep',
  final: true,             // depois deste nível vem o final do jogo
  title: 'Os Preparativos',
  story: 'Véspera do casamento, no Solar dos Soares de Albergaria. Há uma tenda para montar, mesas para pôr, luzes para pendurar e um bolo que tem de chegar inteiro. Que azáfama!',
  help: 'Anda pelo relvado (toca no sítio para onde queres ir, ou usa as setas) e vai aonde aparecem as setas: aos postes para levantar a tenda, à carrinha e ao canteiro para ir buscar as coisas, às mesas para as pousar. Tudo o que ficar pronto antes do pôr do sol vale um coração!',
  outro: 'Está tudo pronto. Amanhã é o grande dia!',
  firstHint: 'Tanta coisa para fazer! Comecem pela tenda.',
  ready: 'Tenda montada, mesas postas, luzes acesas e o bolo no sítio. Está tudo pronto!',

  pois: {
    1: { text: 'Beatriz: «Eu e o pai tratamos das cadeiras. Vocês os dois, despachem a tenda e as mesas!»' },
    2: { text: 'Pai: «Amanhã é o grande dia. Mãos à obra, que ainda há muito por fazer!»' },
  },
  npcs: { Y: 'beatriz', Z: 'pai' },

  start: 'relvado',
  maps: {
    relvado: {
      rows: [
        'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
        'WwWWwWWwWWWWWWbWWWWWWWwWWwWWwW',
        'WwWWwWWwWWWWWWDWWWWWWWwWWwWWwW',
        '.t........1Y.,,,,.Z2.......t..',
        '..f.f.f......,,,,......f.f.f..',
        '...................B..........',
        '....I...H..H...I...B..........',
        '...................B..........',
        '.......Q....Q......s....x&x...',
        '...................B..........',
        '...................B..........',
        '.........Q..U......B..........',
        '...................s..........',
        '....I..........I...B.....J....',
        '...................B....f.f...',
        '..L................B..........',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      ],
    },
  },
};
