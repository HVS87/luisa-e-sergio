// Nível 4 — ciclismo: uma viagem de bicicleta a dois, com alforges (ver js/scenes/bike.js).
// Os dois pedalam em fila: quem vai à frente cansa-se, quem vai na roda recupera.
export default {
  id: 'ciclismo',
  type: 'bike',
  title: 'De Bicicleta',
  story: 'A Luísa e o Sérgio adoram ciclismo e fazem viagens inteiras só de bicicleta, com os alforges atrás. A etapa de hoje é das boas: da serra até ao mar!',
  help: '▶ (manter) pedalar · ▲ saltar · ◀ trocar quem vai à frente. No teclado: seta direita, Espaço e seta esquerda. Quem puxa cansa-se e quem vai na roda recupera: revezem-se, como uma boa equipa!',
  controls: '▶ pedala · ▲ salta · ◀ troca quem vai à frente',
  arrival: 'Chegada à costa, mesmo a tempo de um pôr do sol romântico sobre o mar!',
  outro: 'Mais uma viagem para a coleção. Juntos vão a todo o lado!',

  // O percurso, troço a troço:
  //   { zone }     muda o cenário (serra, planicie, costa — definidos em js/themes.js)
  //   len          comprimento do troço, em píxeis
  //   grade        inclinação: positivo sobe, negativo desce (0.15 já é uma boa subida)
  //   hearts       número de corações · air: alguns ficam no ar (é preciso saltar)
  //   obstacles    'buraco' ou 'ovelha' — saltam-se com ▲
  //   wind         vento de frente (cansa mais quem vai à frente)
  //   bidon        um bidão a meio do troço (dá energia aos dois)
  //   event        'furo' (encher o pneu com toques) ou 'cafe' (paragem que recupera tudo)
  //   tip          frase mostrada ao entrar no troço
  route: [
    { zone: 'serra' },
    { len: 520, grade: 0, hearts: 3 },
    { len: 900, grade: 0.15, hearts: 5, tip: 'A subir, quem vai à frente cansa-se depressa. Troca com ◀ e deixa recuperar!' },
    { len: 320, grade: 0, bidon: true },
    { len: 900, grade: -0.16, hearts: 5, obstacles: ['buraco', 'buraco', 'buraco'], tip: 'Descida! Larga os pedais para descansar e salta os buracos (▲).' },
    { zone: 'planicie' },
    { len: 700, grade: 0, hearts: 4, obstacles: ['ovelha', 'ovelha'], tip: 'Ovelhas na estrada!' },
    { len: 500, grade: 0, hearts: 2, event: 'furo' },
    { len: 1300, grade: 0, hearts: 6, wind: true, air: true },
    { len: 500, grade: 0, hearts: 2, event: 'cafe' },
    { len: 500, grade: 0.1, hearts: 3 },
    { len: 500, grade: -0.1, hearts: 3, obstacles: ['buraco', 'ovelha'] },
    { zone: 'costa' },
    { len: 850, grade: 0.18, hearts: 5, bidon: true, tip: 'A última subida, a mais dura. Já cheira a mar!' },
    { len: 1000, grade: -0.15, hearts: 6, obstacles: ['buraco', 'buraco', 'buraco'], air: true },
    { len: 450, grade: 0, hearts: 2 },
  ],
};
