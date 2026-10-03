// Nível 1 — como se conheceram: no bloco operatório.
// Minijogo inspirado no clássico "Operação" (ver js/scenes/operation.js):
// o Sérgio (ortopedista) retira ossos ao doente; quando falha, o doente acorda
// e a Luísa (anestesista) tem de lhe dar mais anestesia.
export default {
  id: 'encontro',
  type: 'operation',
  title: 'Como se Conheceram',
  story: 'A Luísa é anestesista e o Sérgio é cirurgião ortopédico. Foi a trabalhar juntos no bloco operatório, à volta de um doente cheio de ossos para tirar, que tudo começou...',
  help: 'Sérgio: toca no ecrã (ou Espaço) quando o marcador passar na zona verde do osso. Se falhares, o doente acorda! Luísa: mantém premido para injetar a anestesia e larga na zona verde.',
  outro: 'Operação concluída. E assim nasceu uma bela equipa!',

  // Ossos a retirar, por ordem. Cada um precisa de 3 golpes certeiros.
  //   tool:  'saw' (serrote) ou 'hammer' (martelo)
  //   shape: desenho no raio-X — 'long', 'rib' (costela) ou 'round' (rótula)
  //   size:  comprimento do osso no raio-X (píxeis, até 180)
  //   speed: travessias do marcador por segundo (maior = mais difícil)
  //   band:  largura da zona verde (menor = mais difícil)
  //   slot:  posição no corpo — umero, costela, femur, rotula ou tibia
  bones: [
    { name: 'Úmero', tool: 'saw', shape: 'long', size: 150, speed: 0.5, band: 46, slot: 'umero' },
    { name: 'Costela', tool: 'hammer', shape: 'rib', size: 130, speed: 0.6, band: 40, slot: 'costela' },
    { name: 'Fémur', tool: 'saw', shape: 'long', size: 170, speed: 0.7, band: 34, slot: 'femur' },
    { name: 'Rótula', tool: 'hammer', shape: 'round', size: 24, speed: 0.72, band: 28, slot: 'rotula' },
    { name: 'Tíbia', tool: 'saw', shape: 'long', size: 140, speed: 0.82, band: 32, slot: 'tibia' },
  ],
};
