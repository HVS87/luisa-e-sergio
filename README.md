# Luísa ♥ Sérgio — Uma História de Amor

Jogo de plataformas em pixel art sobre a história da Luísa e do Sérgio: do primeiro
encontro ao casamento, com um nível bónus na maternidade (o nascimento do Xavier e da pequena Luísa).
O jogo termina com uma mensagem de parabéns pelos 4 anos de casados, rodeada de fogo de artifício.

Feito em HTML5 + JavaScript puro (sem dependências nem passo de compilação). Funciona em
telemóveis e tablets (iPhone, Android) com ecrã tátil e em computadores com teclado
(Chrome, Safari, Firefox, Edge).

## Como correr

```bash
npm start
```

Depois abre <http://localhost:8080>. O servidor também mostra o endereço na rede local,
para abrir o jogo num telemóvel ligado ao mesmo Wi-Fi.

Acrescentar `?debug` ao endereço desbloqueia todos os níveis (útil para testar).

## Testes automáticos

Abrir o jogo com `?qa` no endereço (por exemplo <http://localhost:8080/?qa>) corre a suite de
QA de `tests/qa.js`, com o resultado num painel por cima do jogo (demora cerca de um minuto).
Com `?qa&touch` simula um ecrã tátil, para correr num telemóvel. **A suite apaga o progresso
guardado nesse browser.** Verifica, entre outras coisas:

- os dados dos níveis (ids, etiquetas, textos sem marcadores por substituir, sem formas do
  português do Brasil, nenhum tema proibido) e os cruzamentos entre níveis (uma
  recordação do pedido por cada nível anterior, as aves, as rondas da maternidade);
- que todos os corações e pontos de interesse das visitas são alcançáveis;
- o jogo completo, com robôs que jogam cada nível: introdução, pausa, fim do nível, gravação,
  desbloqueio, casamento, nível bónus e final da família;
- recomeçar e repetir, opções (personagem, música, sons, tecla M), gravações antigas ou
  estragadas, navegação por teclado, a API de som e o desenho de todas as cenas em nove
  tamanhos de ecrã (de um telemóvel muito estreito a um ecrã largo);
- a disposição do ecrã: botões táteis sempre fora da área de jogo (em centenas de tamanhos
  de ecrã), computador sempre em horizontal, toques medidos em relação à área de jogo e todos
  os botões dos menus à vista no ecrã em que a suite corre.

- interações reais (toques, cliques e teclas como os do browser) e o modo offline;
- um teste aleatório («monkey»): em cada cena, 45 s de toques e teclas ao acaso, pausas,
  recomeços e mudanças de tamanho do ecrã, à procura de exceções e estados incoerentes.

Opções: `?qa&only=monkey` corre só os testes com essa palavra no nome e `&seed=7` muda a
sequência aleatória do monkey.

Para rever as disposições à vista, `sheet()` desenha todas as cenas lado a lado num dado
tamanho: na consola, `(await import('/tests/qa.js')).sheet(__game, { w: 422, h: 195, portrait: false })`.

## Controlos

| Ação    | Teclado                 | Ecrã tátil                  |
|---------|-------------------------|-----------------------------|
| Andar   | ← → ou A D              | Botões ◀ ▶ (à esquerda, fora da área de jogo) |
| Saltar  | Espaço, ↑ ou W          | Botão ▲ (à direita, fora da área de jogo)     |
| Ação (minijogos) | Espaço ou Enter | Tocar em qualquer ponto da área de jogo |
| Pausa   | P ou Esc                | Botão de pausa (em cima, à direita) |
| Ligar/desligar a música | M       | Botão «Música» no menu ou na pausa |
| Menus   | Setas + Enter           | Toque                       |

A música e os efeitos sonoros ligam-se e desligam-se em separado («Música» e «Sons», no
menu principal e na pausa); a escolha fica guardada.

## Telemóvel, tablet e instalar como app

- **Ecrã**: o jogo ocupa o ecrã inteiro (menos o espaço dos botões táteis, nos níveis que
  os usam), respeita o entalhe e a barra do iPhone e adapta-se a qualquer tamanho, sempre com
  píxeis nítidos. No Safari do iOS, depois de rodar
  o telemóvel, as medidas são recalculadas várias vezes (o Safari demora a acertá-las).
- **Orientação**: detetada automaticamente. Joga-se ao alto ou deitado, em telemóvel
  e em tablet: os minijogos têm uma disposição para cada posição (`view.portrait`) e os
  níveis de plataformas e de bicicleta seguem o jogador numa área de qualquer formato.
  Rodar o aparelho a meio de um nível rearruma tudo na hora.
- **Botões táteis fora do jogo** (`js/layout.js`): nos níveis jogados com ◀ ▶ ▲ (plataformas
  e bicicleta), os botões nunca ficam por cima da área de jogo. Ao alto, ficam numa barra por
  baixo do jogo; com o telemóvel deitado, em duas faixas laterais (◀ ▶ à esquerda, ▲ à
  direita), com os corações e a pausa por cima das faixas; num tablet deitado, que é quase
  quadrado, ficam numa barra por baixo. Os minijogos, que se jogam a tocar e a arrastar,
  ocupam o ecrã todo.
- **Computador**: usa-se sempre a versão horizontal (pensada para 16:9). Entre 4:3 e 2,4:1 o
  jogo ocupa a janela toda; numa janela mais estreita aparece numa moldura 4:3 centrada e num
  ecrã ultralargo fica limitado a 2,4:1.
- Para experimentar num computador: `?device=mobile` (ou `?device=pc`) no endereço força o
  tipo de dispositivo.
- **Instalar como app**: o botão «Instalar app» no menu abre o pedido de instalação no
  Android e no Chrome/Edge; no iPhone e no iPad mostra os passos (Partilhar → «Adicionar ao
  ecrã principal»). Instalado, abre em ecrã inteiro, com ícone próprio, e funciona sem rede
  graças ao service worker (`sw.js`, que vai sempre buscar a versão mais recente quando há
  rede). O manifesto está em `manifest.webmanifest`.
- **Som no iPhone**: o som só começa depois do primeiro toque (regra dos browsers) e, no
  iPhone, segue o botão de silêncio lateral.

## Estrutura

```
index.html            página e ecrãs da interface (menu, como jogar, níveis, pausa, vitória)
css/style.css         estilo pixel art da interface e dos controlos táteis
js/main.js            arranque, ecrã adaptável e ciclo principal
js/config.js          constantes (física do salto, tamanho dos blocos, anos de casados)
js/input.js           teclado + ecrã tátil
js/audio.js           música e efeitos sonoros gerados por código (melodias originais)
js/device.js          tipo de dispositivo, margens seguras, instalar como app, ecrã inteiro, service worker
js/layout.js          onde fica a área de jogo e onde ficam os botões táteis, em cada tipo de ecrã
js/save.js            progresso guardado no dispositivo
js/sprites.js         personagens e objetos em pixel art (definidos em texto)
js/themes.js          cenários dos níveis de plataformas (parque, Funchal, levada, Santana, Tromsø, Ártico, ...)
js/fx.js              partículas e fogo de artifício
js/ui.js              lógica dos menus e painéis
js/scenes/            uma cena por tipo de nível (play, operation, date, bike, tour, oven, covid, birds,
                      aurora, proposal, house, prep, birth), o menu e a vitória (casamento e família)
js/memories.js        ícones das recordações (presentes do pedido e fotografias da casa nova)
js/levels/            um ficheiro por nível + troços reutilizáveis (chunks.js)
sw.js                 service worker (jogar sem rede)
tests/qa.js           suite de testes automáticos (abrir o jogo com ?qa)
tools/                servidor local e gerador de ícones
```

## Níveis

| # | Ficheiro | Capítulo | Ambiente |
|---|----------|----------|----------|
| 1 | `01-encontro.js` | Como se Conheceram | minijogo "Operação" no bloco operatório |
| 2 | `02-date.js` | O Primeiro Date | microjogos num restaurante |
| 3 | `03-madeira.js` | Na Madeira | plataformas: Funchal, levada, carro de cesto, Santana |
| 4 | `04-ciclismo.js` | De Bicicleta | viagem de bicicleta: serra, planície e costa |
| 5 | `05-solar.js` | O Solar da Família | visita vista de cima: interior do solar e jardim de buxo |
| 6 | `06-pretarouca.js` | Pretarouca | passeio pela aldeia de granito + forno de lenha |
| 7 | `07-covid.js` | Na Linha da Frente | arcada por vagas numa enfermaria, durante a pandemia |
| 8 | `08-aves.js` | Birdwatching | binóculos e caderno de campo num observatório de aves |
| 9 | `09-noruega.js` | Aurora Boreal | cidade nevada, trenó de huskies e a aurora |
| 10 | `10-pedido.js` | O Pedido | Natal: jogo de memória com os presentes e o pedido de casamento |
| 11 | `11-casa.js` | A Nossa Casa | a obra da vivenda junto ao Aqueduto e as fotografias na parede |
| 12 | `12-preparativos.js` | Os Preparativos (final) | a azáfama da véspera do casamento, no solar |
| Bónus | `b1-maternidade.js` | Na Maternidade | o Sérgio apanha o Xavier e, 2 anos depois, a Luisinha |

Os doze níveis da história e o nível bónus estão feitos.

### Nível 1 — minijogo "Operação"

A Luísa (anestesista) e o Sérgio (cirurgião ortopédico) conheceram-se a trabalhar juntos.
O Sérgio retira cinco ossos ao doente, com serrote ou martelo: é preciso carregar quando o
marcador passa na zona verde do osso, três vezes por osso. Se falhar, o doente acorda a
espernear e passa a ser a vez da Luísa: manter premido para empurrar o êmbolo da seringa
e largar dentro da zona verde. Cada osso retirado sem falhas vale um coração.

Os ossos, a velocidade do marcador e a largura da zona verde definem-se em
`js/levels/01-encontro.js`; a lógica e o cenário estão em `js/scenes/operation.js`.
Um nível escolhe o tipo de jogo com `type` (`operation`, `date`, `bike`, `tour`, `covid`, `birds`, `proposal`, `house`, `prep`, `birth`; por omissão, plataformas).

### Nível 2 — "O Primeiro Date"

Um jantar em oito momentos, cada um um microjogo de poucos segundos, sempre com o mesmo
botão (tocar no ecrã / Espaço):

| Momento | Como se joga |
|---------|--------------|
| Troca de olhares | manter premido só quando o par espreita por cima da ementa; olhar de mais faz corar |
| Servir o vinho | manter premido e largar entre as marcas; entornar deixa a conversa seguinte "tonta" |
| Conversa de médicos | tocar para dizer os bons temas e deixar passar os maus |
| Roubar batatas fritas | tocar só quando o par olha para o lado |
| Esparguete a dois | toques a ritmo certo para manter a agulha no verde |
| Pezinho debaixo da mesa | arrastar o pé até ao do par, recuando quando passa o empregado |
| A guerra da conta | toques puxam a conta; mantê-la ao centro até ao fim dá "dividimos?" |
| O primeiro beijo | tocar quando os dois corações se encontram |

Pelo meio, o telefone do hospital toca duas vezes e é preciso silenciá-lo depressa.
Cada momento perfeito vale um coração e enche o medidor de Química; com Química igual ou
superior a `hot` (68) o nível acaba com o final alternativo "E depois do jantar...".
A ordem dos momentos define-se em `js/levels/02-date.js`; os microjogos estão em
`js/scenes/date.js`. O jogador controla a personagem escolhida no menu.

### Nível 3 — "Na Madeira"

O Sérgio apresenta a Luísa à família. É um nível de plataformas em quatro zonas, cada uma
com o seu cenário: o Funchal (mercado, teleférico, calçada portuguesa), uma levada na serra
(cascatas e nevoeiro), a descida do Monte de carro de cesto (o carro anda sozinho, só se
salta) e Santana (socalcos, hortênsias e a casa típica onde o pai do Sérgio espera).

Pelo caminho aparece a Beatriz, a irmã mais nova do Sérgio, que cumprimenta e serve de
ponto de passagem (o carreiro do carro de cesto é um figurante), e há
quatro iguarias para apanhar (banana, bolo do caco, poncha e espetada). Tudo isto se define
em `js/levels/03-madeira.js`: `npcs` (quem se encontra), `host` (quem recebe em casa), `items`
(iguarias) e marcadores `{ zone, base }` na lista de troços para mudar de cenário.
`lift(troço, n)` sobe um troço n blocos, para construir encostas.

### Nível 4 — "De Bicicleta"

Uma etapa de cicloturismo a dois, com alforges, da serra até ao mar. A estrada sobe e
desce e os dois pedalam em fila: quem vai à frente cansa-se (mais ainda a subir e com
vento de frente) e quem vai na roda recupera, por isso é preciso revezarem-se.

| Botão | Teclado | Ação |
|-------|---------|------|
| ▶ (manter) | seta direita / D | pedalar |
| ▲ | Espaço | saltar buracos e ovelhas |
| ◀ | seta esquerda / A | trocar quem vai à frente |

Pelo caminho há bidões (energia), um furo (toques rápidos para encher o pneu) e a paragem
sagrada no café. Se a energia de quem puxa chega a zero, "bate o homem da marreta" e a
velocidade cai até trocarem. O percurso define-se troço a troço em `route`, no ficheiro
`js/levels/04-ciclismo.js`; a lógica e o desenho estão em `js/scenes/bike.js`.

### Nível 5 — "O Solar da Família"

A Luísa mostra ao Sérgio o Solar dos Soares de Albergaria, em Oliveira do Conde. É uma
visita guiada vista de cima, em dois mapas ligados por uma porta: o interior da casa
(cozinha velha, capela, salão dos retratos, biblioteca) e o jardim histórico de buxo, com
sebes em anéis à volta da fonte. O jogador conduz a Luísa (setas, ou tocar no sítio para
onde quer ir) e o Sérgio segue-a; em cada ponto a brilhar ela conta-lhe qualquer coisa.
No jardim o Sérgio perde-se nos buxos e é preciso ir buscá-lo, e há regadores que só
deixam passar quando param. A visita acaba na fonte, depois de mostrados todos os pontos.

Os mapas (em texto) e as frases de cada ponto estão em `js/levels/05-solar.js`; o motor
está em `js/scenes/tour.js`.

### Nível 6 — "Pretarouca"

O Sérgio mostra à Luísa a aldeia onde nasceu, perto de Lamego, na serra de Montemuro.
Tem duas partes:

1. **Passeio pela aldeia** (o mesmo motor do nível 5, agora com o Sérgio a guiar): calçada
   e muros de granito, a fonte, o espigueiro, a capela, a horta das tias, e vacas que
   atravessam o caminho e têm sempre prioridade. Acaba à porta da casa de granito, onde as
   tias estão à espera.
2. **O forno de lenha** (`js/scenes/oven.js`): fazer bôla de Lamego com as tias, em três
   passos — rachar a lenha (tocar com a força no máximo), amassar (tocar à esquerda e à
   direita, à vez) e cozer (tirar cada bôla quando está dourada).

Um nível de visita passa para uma segunda cena com `then` (aqui, `then: 'oven'`) e escolhe
quem guia com `leader`. Mapa, frases e figurantes estão em `js/levels/06-pretarouca.js`.

### Nível 7 — "Na Linha da Frente"

A pandemia de COVID-19 vivida por dois médicos. É um jogo de arcada por vagas: a Luísa e
o Sérgio, de bata, touca e máscara, andam lado a lado pela enfermaria (arrastar o dedo ou
setas) e o desinfetante dispara sozinho contra os vírus que descem em direção às camas.

- Cada vírus que passa aumenta a **pressão sobre o hospital**; se chegar ao máximo, a vaga
  recomeça (bem mais fácil a cada tentativa e, à segunda, segue-se em frente).
- O **cansaço** dos turnos faz disparar mais devagar; os cafés que caem recuperam energia e
  as caixas de equipamento de proteção criam uma barreira temporária.
- Os vírus dourados largam corações, que é preciso apanhar.
- Entre vagas há momentos do confinamento: as palmas à janela às 22h, a videochamada com a
  família e a chegada da vacina. Na última vaga os tiros são vacinas que atravessam tudo.

As vagas e os textos definem-se em `js/levels/07-covid.js`; o jogo está em
`js/scenes/covid.js`.

### Nível 8 — "Birdwatching"

Uma manhã num observatório de aves (`js/scenes/birds.js`). O Sérgio aponta os binóculos
(arrastar o dedo ou setas) e a Luísa identifica as aves no guia de campo.

- Ao longe as aves são só **silhuetas**; dentro dos binóculos, que ampliam para o dobro,
  veem-se as cores. Mantendo uma ave na mira durante um instante, fica identificada e
  entra no **caderno de campo**, com uma curiosidade. Cada espécie vale um coração.
- São dez espécies que se veem em Portugal: cegonha-branca (sempre no ninho), flamingo,
  garça-real, poupa, pernilongo, guarda-rios (que mergulha), abelharuco, colhereiro,
  águia-pesqueira (atravessa o céu: é preciso segui-la) e mocho-galego (espreita de um
  buraco na árvore). As notas de música denunciam onde está cada uma.
- As aves chegam uma a uma e vão-se embora ao fim de algum tempo; as que escaparem voltam
  uma segunda vez. De vez em quando aparece um pardal, que não conta.

Os nomes, pistas, curiosidades e a ordem de chegada estão em `js/levels/08-aves.js`; os
desenhos e o comportamento de cada ave, em `js/scenes/birds.js`.

### Nível 9 — "Aurora Boreal"

A viagem à Noruega para ver a aurora boreal, em duas partes:

1. **Plataformas**: atravessar a cidade nevada (casas de madeira coloridas, neve a cair),
   apanhar o chocolate quente e subir para o trenó puxado por huskies — anda sozinho, só
   se salta por cima de pedras e riachos gelados — até ao acampamento com a tenda sami.
2. **A aurora** (`js/scenes/aurora.js`): uma luz atravessa o céu e, seguindo-a com o dedo
   (ou com as setas), a aurora vai-se desenhando atrás dela, em três véus de cores
   diferentes. No fim tira-se a fotografia quando o céu está no máximo de brilho.

Um nível de plataformas passa para uma segunda cena com `then` (aqui, `then: 'aurora'`);
`sledStyle: 'husky'` troca o carro de cesto pelo trenó de cães.

### Nível 10 — "O Pedido"

É Natal e o Sérgio escondeu um colar na árvore, junto dos presentes. A Luísa abre os
presentes num jogo de memória: são nove pares e cada par é uma recordação de um nível
anterior (o bloco operatório, o primeiro date, a Madeira, as bicicletas, o solar,
Pretarouca, a pandemia, o birdwatching e a aurora). Um par encontrado sem andar a virar os mesmos presentes
vezes sem conta vale um coração. Quando o tapete fica vazio, há uma caixinha a brilhar na
árvore: é o colar. O Sérgio ajoelha-se, faz o pedido, e toca-se para a Luísa dizer que sim.

As recordações e as frases estão em `js/levels/10-pedido.js`; o jogo em
`js/scenes/proposal.js`.

### Nível 11 — "A Nossa Casa"

A Luísa e o Sérgio constroem a casa deles: uma vivenda de dois andares, com jardim e
piscina, em Campolide, mesmo junto ao Aqueduto das Águas Livres, que se vê ao fundo com os
arcos em ogiva e o Arco Grande. Quem orienta a obra é o Tio Alberto, o tio arquiteto da Luísa
(`js/scenes/house.js`):

1. **A obra**: a grua passa de um lado para o outro com cada peça (fundações, rés-do-chão,
   laje, primeiro andar com varanda e telhado de telha; por fora a casa é azul-clara, com
   caixilhos brancos) e toca-se para a largar em cima da
   planta azul. À primeira e bem ao centro vale um coração; fora da planta, a peça volta a
   subir. A grua vai ficando mais rápida. A meio, o Tio Alberto conta que o Aqueduto resistiu
   ao terramoto de 1755 e que o Arco Grande tem mais de 65 metros.
2. **A piscina**: mantém-se premido para a encher e larga-se com a água na linha dos
   azulejos (se transbordar, perde-se o coração e tenta-se outra vez). Depois o jardim cresce:
   uma oliveira, um limoeiro e alfazema.
3. **As fotografias**: dentro de casa, penduram-se na sala as fotografias dos momentos dos
   níveis anteriores (as mesmas recordações do pedido, mais o próprio pedido). Cada quadro
   balança; tocar quando está direito vale um coração, e os outros ficam um pouco tortos.

As fotografias vêm de `js/levels/10-pedido.js` (a suite de testes confirma que há uma por cada
nível anterior); os textos estão em `js/levels/11-casa.js`.

### Nível 12 — "Os Preparativos"

A véspera do casamento, no relvado do solar. É um corre-corre visto de cima
(`js/scenes/prep.js`, que estende o motor das visitas):

1. **Montar a tenda**: ir a cada um dos quatro postes para os levantar.
2. **Pôr as mesas**: em cada mesa, primeiro a toalha e os pratos (da carrinha), depois as
   flores (do canteiro). Leva-se uma coisa de cada vez.
3. **Pendurar as luzes** nos dois ganchos da tenda.
4. **Levar o bolo**: anda-se mais devagar, e há regadores no caminho.

Uma seta indica sempre onde ir a seguir. O dia vai passando (a luz fica dourada e depois
azul); cada tarefa acabada antes do pôr do sol vale um coração, e depois disso continua-se
à luz das lanternas, mas sem corações.

### O final do jogo

Concluído o nível 12, corre a animação do casamento (`js/scenes/victory.js`): a cerimónia
na igreja, a festa no solar até de madrugada e, por fim, a imagem sobe até ao céu, onde
rebenta o fogo de artifício à volta de "Parabéns! pelos 4 anos de Casados" e da data
08-10-22. Um toque salta a animação. A data e o número de anos estão em `js/config.js`.

### Nível bónus — "Na Maternidade"

Depois do casamento há um nível bónus (`js/scenes/birth.js`, textos em
`js/levels/b1-maternidade.js`), em duas rondas separadas por um "fade" a negro:

1. **"1 ano depois..."** — a Luísa está na maca a dar à luz, a parteira conta até três e o
   Xavier salta pelo ar: o Sérgio tem de se pôr debaixo dele (a sombra no chão mostra onde
   vai cair) e apanhá-lo.
2. **"2 anos depois..."** — a mesma coisa com a Luisinha, mais rápida, enquanto o Xavier,
   que já anda, passeia pela sala: se o pai lhe tropeça, perde um instante.

O chão é todo almofadado: se o bebé cair, ressalta e há nova oportunidade (à terceira, é a
parteira que o apanha). Apanhar à primeira vale 3 corações, depois de um ressalto 2, e
depois de dois 1. No fim aparece o ecrã "Família completa!": a família, à noite, em frente à
casa que construíram no nível 11 (azul-clara, de janelas acesas), com o Aqueduto ao luar no
horizonte e fogo de artifício. O desenho da vivenda é partilhado (`drawVilla` em
`js/scenes/house.js`).

### Dificuldade

O objetivo é ser desafiante mas nunca impedir ninguém de chegar ao fim:

- **Nenhum nível se perde.** Os corações contam para a pontuação (e para o «Perfeito!»),
  mas não são precisos para desbloquear o nível seguinte.
- Nas plataformas não há vidas: quem cai volta ao último ponto de passagem. Os carros de
  cesto e o trenó andam a 125 px/s, e há pontos de passagem antes da ponte da levada e a
  meio do trenó da Noruega.
- Na pandemia, se o hospital chegar ao limite, a vaga recomeça 40% mais lenta; à segunda
  vez, segue-se em frente.
- Os minijogos repetem as tentativas falhadas sem castigo (a anestesia, os pratos do date,
  as aves que voltam, o bebé que ressalta no chão almofadado).

As constantes principais: `SLED_SPEED` em `js/scenes/play.js`, a velocidade e a zona verde
de cada osso em `js/levels/01-encontro.js`, `hot` em `js/levels/02-date.js`, a pressão e
as falhas em `js/scenes/covid.js`, `DAY` em `js/scenes/prep.js`.

### Como se desenha um nível de plataformas

Um nível é uma lista de troços colados da esquerda para a direita. Cada troço é um
pequeno mapa em texto (ver `js/levels/chunks.js`):

```
.  vazio              #  chão / parede         -  plataforma
h  coração            ^  espinhos              w  nuvem cinzenta (inimigo)
C  ponto de passagem  P  início do jogador     G  meta
```

Cada nível define ainda o ambiente (`theme`), a roupa das personagens (`outfit`), o tipo
de meta (`goal`: `house`, `camp` ou, por omissão, uma placa com bandeira) e se o par acompanha o jogador
(`companion`). Nos textos, `{eu}`, `{par}` e `{ao_par}` são substituídos pelos nomes
conforme a personagem escolhida no menu.
