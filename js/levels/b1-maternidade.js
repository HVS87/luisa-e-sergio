// Nível bónus — na maternidade (ver js/scenes/birth.js).
// A Luísa está na maca a dar à luz, o bebé salta e o Sérgio tem de o apanhar.
// Duas rondas, com um "fade" a negro pelo meio: o Xavier e, dois anos depois, a pequena
// Luísa — já com o Xavier a andar pela sala, a meter-se à frente do pai.
export default {
  id: 'maternidade',
  type: 'birth',
  bonus: true,
  title: 'Na Maternidade',
  story: 'Um ano depois do casamento, a Luísa e o Sérgio voltam ao hospital... mas desta vez não é para trabalhar! Vem aí o Xavier — e vem com pressa.',
  help: 'Arrasta o dedo (ou usa as setas ◀ ▶) para pôr o Sérgio debaixo do bebé: a sombra no chão mostra onde ele vai cair. Apanha à primeira para ganhares mais corações!',
  outro: 'A família está completa!',
  ending: 'Luísa, Sérgio, Xavier e a pequena Luísa: a família está completa!',

  // Cada ronda: legenda do "fade", nome do bebé, cor da mantinha e frase ao apanhar.
  rounds: [
    { when: '1 ano depois...', name: 'Xavier', article: 'o', blanket: '#8fc4ff', born: 'Bem-vindo, Xavier!' },
    { when: '2 anos depois...', name: 'Luisinha', article: 'a', blanket: '#ff9fc6', born: 'Bem-vinda, pequena Luísa!', toddler: true },
  ],
};
