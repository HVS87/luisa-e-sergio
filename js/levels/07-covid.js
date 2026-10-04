// Nível 7 — a pandemia de COVID-19: o Sérgio e a Luísa, médicos, na linha da frente.
// Jogo de arcada por vagas (ver js/scenes/covid.js), com momentos do confinamento pelo meio.
// Datas: primeiros casos em Portugal a 2 de março de 2020, estado de emergência a 18 de março,
// primeira vacina a 27 de dezembro de 2020, pico da terceira vaga no fim de janeiro de 2021,
// variante Delta dominante no verão de 2021 e Ómicron no inverno de 2021/22.
export default {
  id: 'covid',
  type: 'covid',
  music: 'calm',
  title: 'Na Linha da Frente',
  story: 'Março de 2020. Uma pandemia fecha o mundo em casa, mas não quem trabalha num hospital. Para a Luísa e o Sérgio começam os turnos sem fim, de máscara e viseira, lado a lado.',
  help: 'Arrasta o dedo (ou usa as setas) para mover os dois pela enfermaria. O desinfetante dispara sozinho: não deixes os vírus chegar às camas, senão a pressão sobre o hospital sobe! Apanha os cafés para aguentar o cansaço, a caixa de proteção e os corações que caem.',
  outro: 'Foram tempos duros, vividos lado a lado. E ficou tudo bem.',

  // Vagas, por ordem:
  //   n      número de vírus · every: segundos entre cada um · burst: de vez em quando chegam vários de uma vez
  //   speed  quanto mais depressa descem os vírus nesta vaga (1 = velocidade base de cada tipo)
  //   mix    proporção de tipos (ver TYPES em js/scenes/covid.js): n normal, fast rápido, big variante
  //          grande (aguenta 3 golpes), zig Delta (aos ziguezagues), mini Ómicron (pequeno e rápido),
  //          split (grande; ao rebentar desfaz-se em dois pequenos)
  //   hearts corações escondidos nos vírus dourados
  //   before momento mostrado antes da vaga (ver `moments`) · vaccine: tiros de vacina (atravessam os vírus)
  waves: [
    { name: '1.ª vaga', when: 'março de 2020', tip: 'Não deixes os vírus chegar às camas!', n: 40, every: 0.6, speed: 1.8, mix: { n: 1 }, hearts: 3 },
    { name: '2.ª vaga', when: 'outono de 2020', tip: 'Os cor de laranja são mais rápidos.', n: 60, every: 0.44, speed: 2.2, burst: 2, mix: { n: 3, fast: 2 }, hearts: 3, before: 'palmas' },
    { name: '3.ª vaga', when: 'janeiro de 2021', tip: 'A mais dura de todas. As variantes roxas aguentam três golpes.', n: 84, every: 0.36, speed: 2.4, burst: 3, mix: { n: 3, fast: 2, big: 1 }, hearts: 4, before: 'video' },
    { name: 'A vacinação', when: 'primavera de 2021', tip: 'Agora sim: cada vacina atravessa tudo o que apanha!', n: 100, every: 0.22, speed: 2.6, burst: 3, mix: { n: 2, fast: 1, big: 1 }, hearts: 3, before: 'vacina', vaccine: true },
    { name: 'Variante Delta', when: 'verão de 2021', tip: 'A Delta não desce a direito: anda aos ziguezagues!', n: 100, every: 0.24, speed: 2.6, burst: 3, mix: { zig: 3, fast: 1, big: 1 }, hearts: 3, vaccine: true },
    { name: 'Variante Ómicron', when: 'dezembro de 2021', tip: 'Pequenos, rápidos e muitos... e os grandes desfazem-se em dois!', n: 130, every: 0.18, speed: 2.4, burst: 4, mix: { mini: 4, split: 1, zig: 1 }, hearts: 4, vaccine: true },
  ],

  // Momentos entre vagas
  moments: {
    palmas: '22h00. O país inteiro vem à janela bater palmas a quem está na linha da frente. Toca para bater palmas também!',
    video: 'Confinamento: as saudades matam-se por videochamada. O pai e a Beatriz na Madeira, as tias em Pretarouca, a Avó Jose na Casa da Beira. (Toca para continuar.)',
    vacina: 'Desde 27 de dezembro de 2020, as vacinas chegam primeiro a quem está na linha da frente. A esperança tem agora a forma de uma seringa! (Toca para continuar.)',
    fim: 'Seis vagas depois, o pior já passou. Máscaras fora, um abraço apertado... e a certeza de que juntos aguentam tudo.',
  },
};
