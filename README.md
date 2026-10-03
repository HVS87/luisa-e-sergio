# Luísa ♥ Sérgio — Uma História de Amor

Jogo de plataformas em pixel art sobre a história da Luísa e do Sérgio: do primeiro
encontro ao casamento, com dois níveis bónus (o nascimento do Xavier e da pequena Luísa).
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
| Menus   | Setas + Enter           | Toque                       |

## Estrutura

```
index.html            página e ecrãs da interface (menu, como jogar, níveis, pausa, vitória)
css/style.css         estilo pixel art da interface e dos controlos táteis
js/main.js            arranque, ecrã adaptável e ciclo principal
js/config.js          constantes (física do salto, tamanho dos blocos, anos de casados)
js/input.js           teclado + ecrã tátil
js/audio.js           efeitos sonoros gerados por código
js/save.js            progresso guardado no dispositivo
js/sprites.js         personagens e objetos em pixel art (definidos em texto)
js/themes.js          cenários de cada ambiente (parque, cidade, praia, noite, casamento, quartos de bebé)
js/fx.js              partículas e fogo de artifício
js/ui.js              lógica dos menus e painéis
js/scenes/            menu, nível de plataformas, minijogos (operation.js) e ecrã de vitória
js/levels/            um ficheiro por nível + troços reutilizáveis (chunks.js)
tools/                servidor local e gerador de ícones
```

## Níveis

| # | Ficheiro | Capítulo | Ambiente |
|---|----------|----------|----------|
| 1 | `01-encontro.js` | Como se Conheceram | minijogo "Operação" no bloco operatório |
| 2 | `02-date.js` | O Primeiro Date | microjogos num restaurante |
| 3 | `03-madeira.js` | Na Madeira | plataformas: Funchal, levada, carro de cesto, Santana |
| 4 | `04-ciclismo.js` | De Bicicleta | viagem de bicicleta: serra, planície e costa |
| 5 | `05-casamento.js` | O Casamento (final) | festa de casamento |
| B1 | `b1-xavier.js` | Bem-vindo, Xavier! | quarto azul |
| B2 | `b2-luisa.js` | Bem-vinda, pequena Luísa! | quarto rosa |

Os níveis 1 a 4 estão feitos. Os restantes são esqueletos jogáveis, montados com troços genéricos,
com textos provisórios; vão ser desenhados ao pormenor um a um.

### Nível 1 — minijogo "Operação"

A Luísa (anestesista) e o Sérgio (cirurgião ortopédico) conheceram-se a trabalhar juntos.
O Sérgio retira cinco ossos ao doente, com serrote ou martelo: é preciso carregar quando o
marcador passa na zona verde do osso, três vezes por osso. Se falhar, o doente acorda a
espernear e passa a ser a vez da Luísa: manter premido para empurrar o êmbolo da seringa
e largar dentro da zona verde. Cada osso retirado sem falhas vale um coração.

Os ossos, a velocidade do marcador e a largura da zona verde definem-se em
`js/levels/01-encontro.js`; a lógica e o cenário estão em `js/scenes/operation.js`.
Um nível escolhe o tipo de jogo com `type` (`operation`, `date`, `bike`; por omissão, plataformas).

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
