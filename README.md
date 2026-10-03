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
js/scenes/            menu, nível de jogo e ecrã de vitória
js/levels/            um ficheiro por nível + troços reutilizáveis (chunks.js)
tools/                servidor local e gerador de ícones
```

## Níveis

| # | Ficheiro | Capítulo | Ambiente |
|---|----------|----------|----------|
| 1 | `01-encontro.js` | O Primeiro Encontro | parque ao pôr do sol |
| 2 | `02-trabalho.js` | Dias de Trabalho | cidade |
| 3 | `03-ferias.js` | Férias a Dois | praia |
| 4 | `04-pedido.js` | O Pedido | noite estrelada |
| 5 | `05-casamento.js` | O Casamento (final) | festa de casamento |
| B1 | `b1-xavier.js` | Bem-vindo, Xavier! | quarto azul |
| B2 | `b2-luisa.js` | Bem-vinda, pequena Luísa! | quarto rosa |

Os níveis atuais são esqueletos jogáveis, montados com troços genéricos; os textos da
história são provisórios. Cada nível vai ser desenhado ao pormenor a seguir.

### Como se desenha um nível

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
