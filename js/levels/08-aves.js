// Nível 8 — birdwatching (ver js/scenes/birds.js).
// Uma manhã no observatório de aves: o Sérgio aponta os binóculos e a Luísa identifica
// as aves no guia de campo. Cada espécie registada no caderno vale um coração.
export default {
  id: 'aves',
  type: 'birds',
  title: 'Birdwatching',
  story: 'Despertador antes do nascer do sol, binóculos ao pescoço e guia de campo na mochila: a Luísa e o Sérgio adoram observar aves. Quantas espécies conseguem registar esta manhã?',
  help: 'Arrasta o dedo (ou usa as setas) para apontar os binóculos. Ao longe as aves são só silhuetas: mantém uma na mira até a Luísa a identificar. As notas de música denunciam onde elas estão!',
  outro: 'Que bela manhã de passarada!',

  baseHint: 'Aponta os binóculos às silhuetas e mantém-nas na mira. Segue as notas de música!',
  again: 'Algumas escaparam... mas costumam voltar. Segunda oportunidade!',
  ending: 'Fim da manhã! As que faltaram ficam para a próxima... Olha, um bando de flamingos!',
  endingAll: 'Caderno de campo completo! E, para acabar em beleza, passa um bando de flamingos.',
  jokes: ['Luísa: «Sérgio... isso é um pardal.»', 'Luísa: «Outra vez o pardal?! Esse não conta!»'],

  // As espécies do caderno de campo (a primeira, a cegonha, está sempre no ninho).
  // art: artigo para a frase «Olha, um/uma ...!» · clue: pista enquanto anda por lá · fact: curiosidade.
  species: [
    { id: 'cegonha', name: 'cegonha-branca', art: 'uma', clue: 'Para começar: quem é que mora no ninho, em cima do poste?', fact: 'Bate o bico como umas castanholas e volta ao mesmo ninho todos os anos.' },
    { id: 'flamingo', name: 'flamingo', art: 'um', clue: 'Pousou qualquer coisa de pescoço comprido no meio da lagoa...', fact: 'É cor-de-rosa por causa dos pequenos crustáceos que come.' },
    { id: 'garca', name: 'garça-real', art: 'uma', clue: 'Há uma ave alta, imóvel como uma estátua, dentro de água...', fact: 'Fica parada, parada, parada... até passar um peixe.' },
    { id: 'poupa', name: 'poupa', art: 'uma', clue: 'Ouve-se um «pu-pu-pu» na relva, junto à margem...', fact: 'Abre a crista em leque e canta o próprio nome: «pu-pu-pu».' },
    { id: 'pernilongo', name: 'pernilongo', art: 'um', clue: 'Umas pernas compridíssimas andam a passear pela água...', fact: 'As pernas cor-de-rosa são tão compridas que parece andar de andas.' },
    { id: 'guardarios', name: 'guarda-rios', art: 'um', clue: 'Um relâmpago azul pousou na estaca!', fact: 'Uma flecha azul e laranja que mergulha de cabeça para pescar.' },
    { id: 'abelharuco', name: 'abelharuco', art: 'um', clue: 'Há um vulto no ramo seco da árvore...', fact: 'Chega de África na primavera e come abelhas — depois de lhes tirar o ferrão.' },
    { id: 'colhereiro', name: 'colhereiro', art: 'um', clue: 'Alguém anda a varrer a água com o bico, lá ao fundo...', fact: 'Tem o bico em forma de colher e varre a água de um lado para o outro.' },
    { id: 'aguia', name: 'águia-pesqueira', art: 'uma', clue: 'Olha para o céu! Vem aí uma ave de rapina: segue-a!', fact: 'Mergulha de garras para a frente e levanta voo com um peixe.' },
    { id: 'mocho', name: 'mocho-galego', art: 'um', clue: 'Há qualquer coisa a espreitar do buraco da árvore...', fact: 'Pequenino e de olhos amarelos, é dos poucos mochos que se deixam ver de dia.' },
  ],

  // Ordem de chegada das visitas (o pardal é só para atrapalhar: não conta).
  order: ['flamingo', 'garca', 'poupa', 'pardal', 'pernilongo', 'guardarios', 'abelharuco', 'colhereiro', 'pardal', 'aguia', 'mocho'],
};
