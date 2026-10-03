// Nível 2 — o primeiro date, num restaurante.
// Um jantar em vários "pratos": cada um é um microjogo (ver js/scenes/date.js).
// Todos enchem o medidor de Química; a partir de `hot` desbloqueia-se o final alternativo.
export default {
  id: 'date',
  type: 'date',
  title: 'O Primeiro Date',
  story: 'Depois do bloco operatório, um jantar a dois. Velas, vinho e muitos nervos... Será que há química?',
  help: 'O jantar tem vários momentos, cada um com o seu pequeno jogo, explicado no topo do ecrã. Joga-se sempre a tocar no ecrã (ou com o Espaço): às vezes um toque, às vezes manter premido. Enche o medidor de Química!',
  outro: 'Um belo primeiro date! Ficou prometido um segundo.',
  outroHot: 'Química explosiva! O resto da noite... fica entre os dois.',
  hot: 75,   // Química mínima (0 a 100) para o final alternativo

  // Ordem do jantar. 'phone' é a interrupção do telefone do hospital (não dá coração).
  // Química: 11 por momento perfeito, 6 com deslizes; telefone silenciado a tempo dá 6.
  courses: ['olhares', 'vinho', 'conversa', 'phone', 'batatas', 'esparguete', 'pezinho', 'phone', 'conta', 'beijo'],
};
