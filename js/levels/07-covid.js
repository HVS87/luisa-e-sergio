// Nível 7 — a pandemia de COVID-19: o Sérgio e a Luísa, médicos, na linha da frente.
// Jogo de arcada por vagas (ver js/scenes/covid.js), com momentos do confinamento pelo meio.
// Datas: primeiros casos em Portugal a 2 de março de 2020, estado de emergência a 18 de março,
// primeira vacina a 27 de dezembro de 2020, pico da terceira vaga no fim de janeiro de 2021.
export default {
  id: 'covid',
  type: 'covid',
  music: 'calm',
  title: 'Na Linha da Frente',
  story: 'Março de 2020. Uma pandemia fecha o mundo em casa, mas não quem trabalha num hospital. Para a Luísa e o Sérgio começam os turnos sem fim, de máscara e viseira, lado a lado.',
  help: 'Arrasta o dedo (ou usa as setas) para mover os dois pela enfermaria. O desinfetante dispara sozinho: não deixes os vírus chegar às camas! Apanha os cafés para aguentar o cansaço e os corações que caem.',
  outro: 'Foram tempos duros, vividos lado a lado. E ficou tudo bem.',

  // Vagas, por ordem:
  //   n      número de vírus · every: segundos entre cada um
  //   mix    proporção de tipos: n (normal), fast (rápido), big (variante: grande, aguenta 3 golpes)
  //   hearts corações escondidos nos vírus dourados
  //   before momento mostrado antes da vaga (ver `moments`) · vaccine: tiros de vacina
  waves: [
    { name: '1.ª vaga', when: 'março de 2020', tip: 'Não deixes os vírus chegar às camas!', n: 18, every: 1.05, mix: { n: 1 }, hearts: 3 },
    { name: '2.ª vaga', when: 'outono de 2020', tip: 'Os vermelhos são mais rápidos.', n: 26, every: 0.85, mix: { n: 3, fast: 1 }, hearts: 3, before: 'palmas' },
    { name: '3.ª vaga', when: 'janeiro de 2021', tip: 'A mais dura de todas. As variantes roxas aguentam três golpes.', n: 34, every: 0.68, mix: { n: 3, fast: 2, big: 1 }, hearts: 4, before: 'video' },
    { name: 'A vacinação', when: '2021', tip: 'Agora sim: cada vacina atravessa tudo o que apanha!', n: 36, every: 0.36, mix: { n: 2, fast: 1, big: 1 }, hearts: 4, before: 'vacina', vaccine: true },
  ],

  // Momentos entre vagas
  moments: {
    palmas: '22h00. O país inteiro vem à janela bater palmas a quem está na linha da frente. Toca para bater palmas também!',
    video: 'Confinamento: as saudades matam-se por videochamada. O pai e a Beatriz na Madeira, as tias em Pretarouca, o solar em Oliveira do Conde. (Toca para continuar.)',
    vacina: 'Desde 27 de dezembro de 2020, as vacinas chegam primeiro a quem está na linha da frente. A esperança tem agora a forma de uma seringa! (Toca para continuar.)',
    fim: 'O pior já passou. Máscaras fora, um abraço apertado... e a certeza de que juntos aguentam tudo.',
  },
};
