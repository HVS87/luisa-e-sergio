// Nível 10 — o pedido de casamento, no Natal (ver js/scenes/proposal.js).
// O Sérgio escondeu o colar na árvore de Natal, junto dos presentes. A Luísa abre os
// presentes (jogo de memória em que cada par é uma recordação dos níveis anteriores),
// encontra a caixinha na árvore, e o Sérgio ajoelha-se e faz o pedido. Ela diz que sim.
export default {
  id: 'pedido',
  type: 'proposal',
  music: 'menu',
  title: 'O Pedido',
  story: 'É Natal. Junto à árvore há presentes para abrir... e, escondido entre os ramos, o Sérgio guardou o mais importante de todos.',
  help: 'Toca nos presentes para os abrir e encontra os pares (ou usa as setas e o Espaço). Quem tem boa memória ganha mais corações!',
  outro: 'Ela disse que sim!',

  memoryHint: 'A Luísa abre os presentes: encontra os pares! Cada par guarda uma recordação.',
  nervous: 'O Sérgio está cada vez mais nervoso... porque será?',
  treeHint: 'Já não há presentes no tapete... mas há qualquer coisa a brilhar na árvore. Toca-lhe!',
  question: 'Sérgio, de joelhos: «Luísa... queres casar comigo?» — Toca para responder!',
  answer: 'Luísa: «SIM!»',

  // Os pares do jogo de memória: um ícone (desenhado em proposal.js) e a frase da recordação.
  memories: [
    { icon: 'osso', text: 'O bloco operatório, onde tudo começou.' },
    { icon: 'vinho', text: 'O primeiro date... e o esparguete a dois.' },
    { icon: 'banana', text: 'A Madeira e a descida de carro de cesto.' },
    { icon: 'bicicleta', text: 'Tantos quilómetros de bicicleta, sempre a par.' },
    { icon: 'buxo', text: 'A Casa da Beira e o seu jardim de buxo.' },
    { icon: 'bola', text: 'A bôla das tias, em Pretarouca.' },
    { icon: 'mascara', text: 'Os dias difíceis, vividos lado a lado.' },
    { icon: 'binoculos', text: 'Madrugadas de binóculos ao pescoço, à espera das aves.' },
    { icon: 'aurora', text: 'A aurora boreal, na Noruega.' },
  ],
};
