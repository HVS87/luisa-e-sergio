// Nível 5 — o solar da família da Luísa: Solar dos Soares de Albergaria,
// em Oliveira do Conde (distrito de Viseu), com os seus jardins históricos de buxo.
// Visita guiada vista de cima (ver js/scenes/tour.js): a Luísa mostra a casa ao Sérgio.
//
// Legenda dos mapas:
//   L  início da Luísa        D  porta para o outro mapa     1-9  ponto de interesse (ver `pois`)
//   h  coração                S  onde o Sérgio se perde (jardim)
// Dentro de casa:
//   _  soalho   :  chão de pedra   r  passadeira   W  parede   P  retrato   d  porta da rua
//   C  lareira  A  altar   k  estante   m  mesa   o  piano   n  banco   v  jarrão
// No jardim:
//   .  relva   ,  saibro   B  sebe de buxo   T  buxo talhado   f  japoneira   t  árvore
//   F  fonte (x = borda da fonte)   s  regador   R  telhado   W  fachada   w  janela   b  brasão
export default {
  id: 'solar',
  type: 'tour',
  title: 'O Solar da Família',
  story: 'É a vez de a Luísa mostrar as suas raízes: o Solar dos Soares de Albergaria, em Oliveira do Conde, há centenas de anos na família, com os seus jardins históricos de buxo.',
  help: 'Leva a Luísa a mostrar a casa e o jardim ao Sérgio: passa por todos os pontos a brilhar. No ecrã tátil, toca e mantém o dedo no sítio para onde queres ir; no teclado, usa as setas.',
  outro: 'Visita concluída. O Sérgio ficou rendido ao solar... e à guia!',
  firstHint: 'Luísa: «Bem-vindo ao Solar dos Soares de Albergaria! Anda, vou mostrar-te tudo.»',
  lostText: 'Então e o Sérgio? Perdeu-se no meio dos buxos! Vai buscá-lo.',
  foundText: 'Sérgio: «Isto é um labirinto!» — Encontrado. Agora não largues a mão da guia!',

  // O que a Luísa conta em cada ponto. O ponto com `final` só conta depois de todos os outros.
  pois: {
    1: { text: 'Luísa: «A cozinha velha. Nesta lareira já se cozinhou para muitas gerações.»' },
    2: { text: 'Luísa: «A capela de Nossa Senhora da Conceição, fundada pela família em 1688.»' },
    3: { text: 'Luísa: «Os retratos dos antepassados. Parece que estão todos a olhar para ti, Sérgio!»' },
    4: { text: 'Luísa: «A biblioteca: há aqui livros com mais anos do que nós os dois juntos.»' },
    5: { text: 'Luísa: «O brasão dos Soares de Albergaria, em granito, por cima da porta.»' },
    6: { text: 'Luísa: «O jardim de buxo tem centenas de anos. Não te percas!»' },
    7: { text: 'Luísa: «As japoneiras dão flor em pleno inverno, quando tudo o resto dorme.»' },
    8: { text: 'Luísa: «Um recanto sossegado, perfeito para ler à sombra dos buxos.»' },
    9: { final: true, text: 'Luísa: «E a fonte, no coração do jardim. Bem-vindo à casa da minha família!»' },
  },

  start: 'casa',
  maps: {
    // Interior: entra-se pela porta da rua (em cima) e sai-se para o jardim (em baixo).
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
        'WPWPWPWW____r____WWWWWWWW',
        'W______W____r____WkkkkkkW',
        'W_3____W____r____W__4___W',
        'W____o______r_______h___W',
        'W_h____W____r____W___m__W',
        'W______W____r____W______W',
        'W__v___W____r____W____v_W',
        'W______W____r____W______W',
        'WWWWWWWWWWWWDWWWWWWWWWWWW',
      ],
    },
    // Jardim de buxo: sebes em anéis, com a fonte ao centro.
    jardim: {
      door: 'casa',
      rows: [
        'RRRRRRRRRRRRRRRRRRRRRRRRRRR',
        'WwWWwWWwWWWWWbWWWWWwWWwWWwW',
        'WwWWwWWwWWWWWDWWWWWwWWwWWwW',
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
        'B,B,B,h,,,,,,8,,,,,,h,B,B,B',
        'B,B,BBBBBBBBBBBBBBBBBBB,B,B',
        'B,B,h,,,,,,,,,,,,,,,,,S,B,B',
        'B,BBBBBBBBBB,,,BBBBBBBBBB,B',
        'B,7,,,,,s,,,,,,,,,s,,,,h,,B',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBB',
      ],
    },
  },
};
