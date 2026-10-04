// Nível 5 — o solar da família da Luísa: Solar dos Soares de Albergaria,
// em Oliveira do Conde (distrito de Viseu), com os seus jardins históricos de buxo.
// Visita guiada vista de cima (ver js/scenes/tour.js): a Luísa mostra a casa ao Sérgio.
//
// A casa tem duas alas, ligadas por uma ponte coberta: na ala norte ficam a entrada, a
// cozinha velha e a capela; na ala sul, o salão dos retratos, o quarto da cama de dossel e a
// grande varanda sobre o jardim, o lugar preferido da Avó Jose (a avó da Luísa, que mora cá).
//
// Legenda dos mapas:
//   L  início da Luísa        D  porta/escada para o outro mapa   0-9  ponto de interesse (ver `pois`)
//   h  coração                S  onde o Sérgio se perde (jardim)  Y    pessoa (ver `npcs`)
// Dentro de casa:
//   _  soalho   :  chão de pedra   r  passadeira   W  parede   w  janela   P  retrato   d  porta da rua
//   C  lareira  A  altar   m  mesa   o  piano   n  banco   v  jarrão
//   q  cama de dossel (x = resto da cama)   j  parede envidraçada da ponte   e  balaustrada
//   u  o que se vê lá em baixo, fora de casa (pátio, jardim)
// No jardim:
//   .  relva   ,  saibro   B  sebe de buxo   T  buxo talhado   f  japoneira   t  árvore
//   F  fonte (x = borda da fonte)   s  regador   R  telhado   W  fachada   w  janela   b  brasão
//   =  abertura da casa para a varanda   :  chão da varanda   e  balaustrada (D = escadaria)
export default {
  id: 'solar',
  type: 'tour',
  title: 'O Solar da Família',
  story: 'É a vez de a Luísa mostrar as suas raízes: o Solar dos Soares de Albergaria, em Oliveira do Conde, há centenas de anos na família, com os seus jardins históricos de buxo. A família chama-lhe simplesmente a Casa da Beira, e é lá que mora a Avó Jose, a avó da Luísa.',
  help: 'Leva a Luísa a mostrar a casa e o jardim ao Sérgio: passa por todos os pontos a brilhar. No ecrã tátil, toca e mantém o dedo no sítio para onde queres ir; no teclado, usa as setas.',
  outro: 'Visita concluída. O Sérgio ficou rendido à Casa da Beira, à Avó Jose... e à guia!',
  firstHint: 'Luísa: «Bem-vindo à Casa da Beira! É assim que chamamos ao Solar dos Soares de Albergaria. Anda, vou apresentar-te à Avó Jose.»',
  lostText: 'Então e o Sérgio? Perdeu-se no meio dos buxos! Vai buscá-lo.',
  foundText: 'Sérgio: «Isto é um labirinto!» — Encontrado. Agora não largues a mão da guia!',

  // Quem está na casa (letras Y/Z nos mapas): aspeto definido em js/sprites.js.
  npcs: { Y: 'avojose' },

  // O que se conta em cada ponto. O ponto com `final` só conta depois de todos os outros.
  pois: {
    1: { text: 'Luísa: «A cozinha velha. Nesta lareira já se cozinhou para muitas gerações.»' },
    2: { text: 'Luísa: «A capela de Nossa Senhora da Conceição, fundada pela família em 1688.»' },
    0: { text: 'Luísa: «A ponte coberta: é por aqui que se passa da ala norte para a ala sul, sem apanhar chuva!»' },
    3: { text: 'Luísa: «Os retratos dos antepassados. Parece que estão todos a olhar para ti, Sérgio!»' },
    4: { text: 'Luísa: «O quarto da cama de dossel: antiga, de madeira esculpida, com cortinas e tudo!»' },
    8: { text: 'Avó Jose: «Então este é que é o Sérgio! Chega-te cá, filho. Desta varanda vê-se o jardim todo: é o meu lugar preferido.»' },
    5: { text: 'Luísa: «O brasão dos Soares de Albergaria, em granito, por cima da porta.»' },
    6: { text: 'Luísa: «O jardim de buxo tem centenas de anos. Não te percas!»' },
    7: { text: 'Luísa: «As japoneiras dão flor em pleno inverno, quando tudo o resto dorme.»' },
    9: { final: true, text: 'Luísa: «E a fonte, no coração do jardim. Bem-vindo à Casa da Beira!»' },
  },

  start: 'casa',
  maps: {
    // Interior: entra-se pela porta da rua (em cima, na ala norte), atravessa-se a ponte coberta
    // para a ala sul e desce-se da varanda para o jardim (em baixo).
    casa: {
      indoor: true,
      door: 'jardim',
      rows: [
        'WWWWWWWWWWWWdWWWWWWWWWWWW',
        'WC:::::W____L____W::A:::W',
        'W:1::m:W____r____W::2:::W',
        'W::::m:W____r____Wn::::nW',
        'W:h::::_____r_____::::h:W',
        'W::::::W____r____Wn::::nW',
        'WWWWWWWWWWW_r_WWWWWWWWWWW',
        'uuuuuuuuuuj_r_juuuuuuuuuu',
        'uuuuuuuuuuj0r_juuuuuuuuuu',
        'uuuuuuuuuuj_r_juuuuuuuuuu',
        'WPWPWPWWWWW_r_WWWWWWWWWWW',
        'W______W____r____W_xqx__W',
        'W_3____W____r____W_xxx4_W',
        'W____o______r________h__W',
        'W_h____W____r____W_m___vW',
        'W__v___W____r____W______W',
        'WWWWwWWWW___r___WWWWwWWWW',
        'W::h:::::::::::::::mY:::W',
        'W:::::::::::::::::::8:h:W',
        'eeeeeeeeeeeeDeeeeeeeeeeee',
        'uuuuuuuuuuuuuuuuuuuuuuuuu',
      ],
    },
    // Jardim de buxo: sebes em anéis, com a fonte ao centro. Ao fundo, a casa tal como é por
    // dentro: a abertura larga para a varanda, a varanda com a Avó Jose, a balaustrada e a escadaria.
    jardim: {
      door: 'casa',
      rows: [
        'RRRRRRRRRRRRRRRRRRRRRRRRRRR',
        'WwWWwWWwWWWWWbWWWWWwWWwWWwW',
        'WWWWWwWWWW=======WWWWwWWWWW',
        '::::::::::::::::::::Ym:::::',
        'eeeeeeeeeeeeeDeeeeeeeeeeeee',
        '.t.........,,,,5.........t.',
        '...f.f.f...,,,,,...f.f.f...',
        'BBBBBBBBBBBB,,,BBBBBBBBBBBB',
        'B,,,,h,,,,,,,6,,,,,,,h,,,,B',
        'B,BBBBBBBBBBBBBBBBBBBBBBB,B',
        'B,B,,,,,,s,,,,,,,s,,,,,,B,B',
        'B,B,BBBBBBBB,,,BBBBBBBB,B,B',
        'B,B,B,,,,h,,,,,,,h,,,,B,B,B',
        'B,B,B,BBBBBBBBBBBBBBB,B,B,B',
        'B,B,B,BT,,,,,,,,,,,TB,B,B,B',
        'B,B,B,,,,h,,xFx,,h,,B,B,B,B',
        'B,B,B,BT,,,,,9,,,,,TB,B,B,B',
        'B,B,B,BBBBBBBBBBBBBBB,B,B,B',
        'B,B,B,h,,,,,,,,,,,,,h,B,B,B',
        'B,B,BBBBBBBBBBBBBBBBBBB,B,B',
        'B,B,h,,,,,,,,,,,,,,,,,S,B,B',
        'B,BBBBBBBBBB,,,BBBBBBBBBB,B',
        'B,7,,,,,s,,,,,,,,,s,,,,h,,B',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBB',
      ],
    },
  },
};
