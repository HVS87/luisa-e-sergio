// Nível 6 — Pretarouca: a aldeia perto de Lamego onde o Sérgio nasceu, na serra de Montemuro.
// Primeiro um passeio pela aldeia, visto de cima (js/scenes/tour.js), com o Sérgio a guiar a Luísa;
// depois, na casa de granito das tias, faz-se bôla de Lamego no forno de lenha (js/scenes/oven.js).
//
// Legenda do mapa (além da do nível 5):
//   ,  calçada de granito   M  muro de pedra   G  parede de granito   g  janela   O  porta
//   E  espigueiro   K  capela   c  couves   V  vaca   Y Z  as tias (ver `npcs`)   x  bloco ocupado
export default {
  id: 'pretarouca',
  type: 'tour',
  then: 'oven',            // depois do passeio, o forno de lenha
  leader: 'sergio',        // aqui é o Sérgio quem guia
  title: 'Pretarouca',
  story: 'Agora é o Sérgio a mostrar as suas raízes: Pretarouca, a aldeia de granito na serra de Montemuro, perto de Lamego, onde nasceu. Há lá família, uma casa antiga e um forno de lenha à espera.',
  help: 'Leva o Sérgio a mostrar a aldeia à Luísa: passa por todos os pontos a brilhar e acaba à porta das tias. Toca e mantém o dedo no sítio para onde queres ir, ou usa as setas. Depois... mãos na massa!',
  outro: 'Bôla aprovada pelas tias. A Luísa já é de Pretarouca!',
  firstHint: 'Sérgio: «Bem-vinda a Pretarouca! Foi aqui que eu nasci. Anda, que eu mostro-te a aldeia.»',

  pois: {
    1: { text: 'Sérgio: «A fonte da aldeia. A água vem da serra, sempre gelada!»' },
    2: { text: 'Sérgio: «O espigueiro, para secar o milho. Aqui também lhe chamam canastro.»' },
    3: { text: 'Sérgio: «A capela. Em dia de festa junta-se cá a aldeia toda.»' },
    4: { text: 'Sérgio: «Daqui vê-se a serra de Montemuro e, lá em baixo, a barragem de Pretarouca.»' },
    5: { text: 'Sérgio: «A horta das tias. Destas couves sai o melhor caldo verde!»' },
    9: { final: true, text: 'Tias: «Ó Sérgio, então esta é que é a Luísa? Entrem, que o forno já está aceso!»' },
  },

  // Quem está à porta de casa (letras Y e Z no mapa; aspeto em js/sprites.js)
  npcs: { Y: 'tia1', Z: 'tia2' },

  // Segunda parte: o forno de lenha
  ovenNpcs: ['tia1', 'tia2'],
  ovenIntro: 'Tias: «Hoje há bôla de Lamego, com presunto, feita no forno de lenha. Mãos à obra!»',
  ovenGreat: 'Tias: «Está de comer e chorar por mais! Esta rapariga já é da casa.»',
  ovenGood: 'Tias: «Para primeira fornada, nada mal! Para a próxima sai ainda melhor.»',
  ovenBad: 'Tias: «Bem... amanhã faz-se outra fornada. O que conta é a companhia!»',

  start: 'aldeia',
  maps: {
    aldeia: {
      ground: 'cobble',
      rows: [
        'MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
        'M.t..........xKx.......t.4.M',
        'M....h.......,3,...........M',
        'M.RRRR.......,,,.....RRRR..M',
        'M.GgOG.......,,,.....GgGG..M',
        'M.,,,,,,,,,,,,,,,,,,,,,,,,.M',
        'M.,MMMMMMMMM,,,MMMMMMMMM,,.M',
        'M.,Mccc.cccM,V,M..xEx..M,,.M',
        'M.,M...5...,,,,,...2..hM,,.M',
        'M.,Mcc.h.ccM,,,M.......M,,.M',
        'M.,MMMMMMMMM,,,MMMMMMMMM,,.M',
        'M.,,,,,,,,,,,,,,,,,,V,,,,,.M',
        'M..t....xFx.......RRRRRR...M',
        'M.......,1,.......GgGOgG...M',
        'M..h....,,,......Y,,,9Z....M',
        'M.L,,,,,,,,,,,,,,,,,,,,,,..M',
        'M..........t.......h....t..M',
        'MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      ],
    },
  },
};
