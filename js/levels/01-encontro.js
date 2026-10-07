// Nível 1 — como se conheceram: no bloco operatório.
// Minijogo inspirado no clássico "Operação" (ver js/scenes/operation.js):
// o Sérgio (ortopedista) retira ossos ao doente; quando falha, o doente acorda
// e a Luísa (anestesista) tem de lhe dar mais anestesia. A operação tem duas partes: a meio
// (depois de `arrestAfter` ossos) o doente entra em paragem cardíaca e a Luísa reanima-o com o
// desfibrilhador; na segunda parte a zona verde já não fica quieta (`drift`).
export default {
  id: 'encontro',
  type: 'operation',
  title: 'Como se Conheceram',
  story: 'A Luísa é anestesista e o Sérgio é ortopedista. Foi a trabalhar juntos no bloco operatório, à volta de um doente cheio de ossos para tirar, que tudo começou...',
  help: 'Sérgio: toca no ecrã (ou Espaço) quando o marcador passar na zona verde do osso. Se falhares, o doente acorda! Luísa: mantém premido para injetar a anestesia e larga na zona verde. A meio, o doente entra em paragem cardíaca: carrega o desfibrilhador da mesma maneira e larga no verde para dar o choque.',
  outro: 'Operação concluída. E assim nasceu uma bela equipa!',

  // Ossos a retirar, por ordem. Cada um precisa de 3 golpes certeiros.
  //   tool:  'saw' (serrote) ou 'hammer' (martelo)
  //   shape: desenho no raio-X — 'long', 'rib' (costela) ou 'round' (rótula)
  //   size:  comprimento do osso no raio-X (píxeis, até 180)
  //   speed: travessias do marcador por segundo (maior = mais difícil)
  //   band:  largura da zona verde (menor = mais difícil)
  //   fem:   nome feminino («Costela removida!»)
  //   slot:  posição no corpo — umero, costela, femur, clavicula, rotula, tibia ou calcaneo
  //   drift: (2.ª parte) a zona verde anda de um lado para o outro, a esta velocidade (px/s)
  bones: [
    { name: 'Úmero', tool: 'saw', shape: 'long', size: 150, speed: 0.5, band: 46, slot: 'umero' },
    { name: 'Costela', fem: true, tool: 'hammer', shape: 'rib', size: 130, speed: 0.6, band: 40, slot: 'costela' },
    { name: 'Fémur', tool: 'saw', shape: 'long', size: 170, speed: 0.7, band: 34, slot: 'femur' },
    { name: 'Clavícula', fem: true, tool: 'saw', shape: 'long', size: 100, speed: 0.72, band: 36, slot: 'clavicula', drift: 10 },
    { name: 'Rótula', fem: true, tool: 'hammer', shape: 'round', size: 24, speed: 0.76, band: 30, slot: 'rotula', drift: 12 },
    { name: 'Tíbia', fem: true, tool: 'saw', shape: 'long', size: 140, speed: 0.84, band: 32, slot: 'tibia', drift: 14 },
    { name: 'Calcâneo', tool: 'hammer', shape: 'round', size: 20, speed: 0.9, band: 28, slot: 'calcaneo', drift: 16 },
  ],

  // A paragem cardíaca, depois de `arrestAfter` ossos: a Luísa carrega o desfibrilhador (manter
  // premido) e larga na zona verde; são precisos dois choques. Sem nenhuma carga falhada, vale um coração.
  arrestAfter: 3,
  alarm: 'PIIII... O monitor! O doente entrou em paragem cardíaca!',
  defibHint: 'Luísa: mantém premido para carregar o desfibrilhador e larga no verde. Afastem-se!',
  defibAgain: 'Ainda nada... Outra vez! Carrega e larga no verde.',
  defibLow: 'Carga a menos! Carrega outra vez...',
  defibHigh: 'Carga a mais! Carrega outra vez...',
  shock: 'CHOQUE!',
  revived: 'Pulso de volta! Sérgio: «Grande Luísa!»',
  resume: 'Sérgio: «Vamos lá acabar isto. Atenção: agora a zona verde não fica quieta!»',
};
