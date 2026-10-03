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

## Controlos

| Ação    | Teclado                 | Ecrã tátil                  |
|---------|-------------------------|-----------------------------|
| Andar   | ← → ou A D              | Botões ◀ ▶ (em baixo, à esquerda) |
| Saltar  | Espaço, ↑ ou W          | Botão ▲ (em baixo, à direita)     |
| Ação (minijogos) | Espaço ou Enter | Tocar em qualquer ponto do ecrã |
| Pausa   | P ou Esc                | Botão de pausa (em cima, à direita) |
| Música on/off | M                 | Botão «Música» no menu ou na pausa |
| Menus   | Setas + Enter           | Toque                       |

A música e os efeitos sonoros ligam-se e desligam-se em separado («Música» e «Sons», no
menu principal e na pausa); a escolha fica guardada.

## Telemóvel, tablet e instalar como app

- **Ecrã**: o jogo ocupa o ecrã inteiro (respeitando o entalhe e a barra do iPhone) e
  adapta-se a qualquer tamanho, sempre com píxeis nítidos. No Safari do iOS, depois de rodar
  o telemóvel, as medidas são recalculadas várias vezes (o Safari demora a dá-las certas).
- **Orientação**: os níveis de plataformas e de bicicleta jogam-se melhor com o telemóvel
  deitado. Se estiver na vertical, aparece o aviso «Roda o telemóvel» (e, a meio do nível, o
  jogo faz pausa); dá para continuar na vertical com «Jogar na vertical». Nos tablets e nos
  minijogos não há aviso. Instalado no Android, o jogo tenta mesmo fixar a orientação.
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
js/device.js          aviso de orientação, instalar como app, ecrã inteiro, service worker
js/save.js            progresso guardado no dispositivo
js/sprites.js         personagens e objetos em pixel art (definidos em texto)
js/themes.js          cenários de cada ambiente (parque, cidade, praia, noite, casamento, quartos de bebé)
js/fx.js              partículas e fogo de artifício
js/ui.js              lógica dos menus e painéis
js/scenes/            menu, nível de plataformas, minijogos (operation.js) e ecrã de vitória
js/levels/            um ficheiro por nível + troços reutilizáveis (chunks.js)
sw.js                 service worker (jogar sem rede)
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
| 11 | `11-preparativos.js` | Os Preparativos (final) | a azáfama da véspera do casamento, no solar |
| Bónus | `b1-maternidade.js` | Na Maternidade | o Sérgio apanha o Xavier e, 2 anos depois, a Luisinha |

Os onze níveis da história e o nível bónus estão feitos.

### Nível 1 — minijogo "Operação"

A Luísa (anestesista) e o Sérgio (cirurgião ortopédico) conheceram-se a trabalhar juntos.
O Sérgio retira cinco ossos ao doente, com serrote ou martelo: é preciso carregar quando o
marcador passa na zona verde do osso, três vezes por osso. Se falhar, o doente acorda a
espernear e passa a ser a vez da Luísa: manter premido para empurrar o êmbolo da seringa
e largar dentro da zona verde. Cada osso retirado sem falhas vale um coração.

Os ossos, a velocidade do marcador e a largura da zona verde definem-se em
`js/levels/01-encontro.js`; a lógica e o cenário estão em `js/scenes/operation.js`.
Um nível escolhe o tipo de jogo com `type` (`operation`, `date`, `bike`, `tour`, `covid`, `proposal`, `prep`; por omissão, plataformas).

### Nível 2 — "O Primeiro Date"

Um jantar em oito momentos, cada um um microjogo de poucos segundos, sempre com o mesmo
botão (tocar no ecrã / Espaço):

| Momento | Como se joga |
|---------|--------------|
| Troca de olhares | manter premido só quando o par espreita por cima da ementa; olhar demais faz corar |
| Servir o vinho | manter premido e largar entre as marcas; entornar deixa a conversa seguinte "tonta" |
| Conversa de médicos | tocar para dizer os bons temas e deixar passar os maus |
| Roubar batatas fritas | tocar só quando o par olha para o lado |
| Esparguete a dois | toques a ritmo certo para manter a agulha no verde |
| Pezinho debaixo da mesa | arrastar o pé até ao do par, recuando quando passa o empregado |
| A guerra da conta | toques puxam a conta; mantê-la ao centro até ao fim dá "dividimos?" |
| O primeiro beijo | tocar quando os dois corações se encontram |

Pelo meio, o telefone do hospital toca duas vezes e é preciso silenciá-lo depressa.
Cada momento perfeito vale um coração e enche o medidor de Química; com Química igual ou
superior a `hot` (75) o nível acaba com o final alternativo "E depois do jantar...".
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
◀ ▶) e o desinfetante dispara sozinho contra os vírus que descem em direção às camas.

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
  vêem-se as cores. Mantendo uma ave na mira durante um instante, fica identificada e
  entra no **caderno de campo**, com uma curiosidade. Cada espécie vale um coração.
- São dez espécies que se vêem em Portugal: cegonha-branca (sempre no ninho), flamingo,
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
presentes num jogo de memória: são oito pares e cada par é uma recordação de um nível
anterior (o bloco operatório, o primeiro date, a Madeira, as bicicletas, o solar,
Pretarouca, a pandemia e a aurora). Um par encontrado sem andar a virar os mesmos presentes
vezes sem conta vale um coração. Quando o tapete fica vazio, há uma caixinha a brilhar na
árvore: é o colar. O Sérgio ajoelha-se, faz o pedido, e toca-se para a Luísa dizer que sim.

As recordações e as frases estão em `js/levels/10-pedido.js`; o jogo em
`js/scenes/proposal.js`.

### Nível 11 — "Os Preparativos"

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

Concluído o nível 11, corre a animação do casamento (`js/scenes/victory.js`): a cerimónia
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
depois de dois 1. No fim aparece o ecrã "Família completa!".

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
de meta (`goal`: `partner`, `flag`, `altar` ou `crib`) e se o par acompanha o jogador
(`companion`). Nos textos, `{eu}`, `{par}` e `{ao_par}` são substituídos pelos nomes
conforme a personagem escolhida no menu.
