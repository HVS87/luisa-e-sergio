// Arranque do jogo: ecrã, ciclo principal e gestão de cenas.
import { VIEW_LANDSCAPE_H, VIEW_LANDSCAPE_MIN_W, VIEW_PORTRAIT_W } from './config.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { save } from './save.js';
import { UI } from './ui.js';
import { LEVELS } from './levels/index.js';
import { MenuScene } from './scenes/menu.js';
import { PlayScene } from './scenes/play.js';
import { OperationScene } from './scenes/operation.js';
import { DateScene } from './scenes/date.js';
import { BikeScene } from './scenes/bike.js';
import { TourScene } from './scenes/tour.js';
import { CovidScene } from './scenes/covid.js';
import { ProposalScene } from './scenes/proposal.js';
import { PrepScene } from './scenes/prep.js';
import { BirthScene } from './scenes/birth.js';
import { BirdsScene } from './scenes/birds.js';
import { VictoryScene } from './scenes/victory.js';
import { Installer, registerServiceWorker, isMobile, safeInsets } from './device.js';
import { computeLayout } from './layout.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// w, h: tamanho do ecrã em píxeis de jogo · k: píxeis reais por píxel de jogo
// portrait: a área de jogo é mais alta do que larga (as cenas têm uma disposição para cada caso)
const view = { w: 320, h: 180, k: 1, portrait: false };

// Tipos de nível: plataformas (por omissão) e minijogos.
const SCENES = { platform: PlayScene, operation: OperationScene, date: DateScene, bike: BikeScene, tour: TourScene, covid: CovidScene, proposal: ProposalScene, prep: PrepScene, birth: BirthScene, birds: BirdsScene };

const game = {
  view, input, audio, save,
  scenes: SCENES,
  ui: null,
  scene: null,
  // Com ?debug no endereço, todos os níveis ficam desbloqueados (para testar).
  debug: new URLSearchParams(location.search).has('debug'),

  setScene(scene) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = scene;
    // música: a da cena, a do nível, ou a dos níveis por omissão
    audio.setTrack(scene.music || (scene.level && scene.level.music) || 'play');
    resize();
    if (scene.enter) scene.enter();
  },

  goMenu() {
    this.setScene(new MenuScene(this));
    this.ui.setLevelMode(false, false);
    this.ui.refreshMenu();
    this.ui.show('menu');
  },

  startLevel(index) {
    if (index < 0 || index >= LEVELS.length) return this.goMenu();
    const Scene = SCENES[LEVELS[index].type] || PlayScene;
    this.setScene(new Scene(this, index));
  },

  showVictory(variant) { this.setScene(new VictoryScene(this, variant)); },

  // O que acontece depois de concluir o nível `index`.
  afterLevel(index) {
    if (LEVELS[index].final) this.showVictory('wedding');
    else if (index === LEVELS.length - 1) this.showVictory('family');
    else this.startLevel(index + 1);
  },

  isUnlocked(index) {
    return this.debug || index === 0 || save.isDone(LEVELS[index - 1].id);
  },

  // Próximo nível por concluir (ou -1 se já estiver tudo feito).
  nextLevel() {
    return LEVELS.findIndex((L) => !save.isDone(L.id));
  },
};

// A área de jogo (ver js/layout.js) ocupa o ecrã todo ou deixa espaço para os botões táteis.
// A resolução interna adapta-se para que cada píxel de jogo corresponda a um número inteiro
// de píxeis reais (pixel art sempre nítida). A orientação é detetada aqui, a cada mudança de
// tamanho: `view.portrait` diz às cenas qual das duas disposições (ao alto / deitada) usar.
function resize() {
  const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight);
  const dpr = window.devicePixelRatio || 1;
  const usesPad = !!(game.scene && game.scene.usesPad);   // cenas jogadas com os botões ◀ ▶ ▲
  const L = computeLayout({ W, H, mobile: isMobile(), controls: input.touch && usesPad, safe: safeInsets() });
  const portrait = L.h > L.w;
  // Arredonda-se (quase sempre) para baixo. Ao alto, manda a largura (nunca muito abaixo de
  // 250 px de jogo); deitado, manda a altura (o nível cabe inteiro), mas sem deixar a largura
  // ficar abaixo de 300 px de jogo nos ecrãs quase quadrados (tablets).
  const k = Math.max(1, Math.floor(portrait
    ? (L.w * dpr) / VIEW_PORTRAIT_W + 0.25
    : Math.min((L.h * dpr) / VIEW_LANDSCAPE_H, (L.w * dpr) / VIEW_LANDSCAPE_MIN_W) + 0.2));
  const w = Math.ceil((L.w * dpr) / k), h = Math.ceil((L.h * dpr) / k);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.left = L.x + 'px';
  canvas.style.top = L.y + 'px';
  canvas.style.width = (w * k) / dpr + 'px';
  canvas.style.height = (h * k) / dpr + 'px';
  ctx.imageSmoothingEnabled = false;

  view.w = w; view.h = h; view.k = k; view.portrait = portrait;
  game.layout = L;

  // A interface (HUD, instruções, botões) alinha-se pela área de jogo.
  const root = document.documentElement.style, px = (n) => n + 'px';
  root.setProperty('--u', Math.max(9, Math.min(26, L.w / 26, L.h / 24)).toFixed(2) + 'px');
  root.setProperty('--gx', px(L.x));
  root.setProperty('--gy', px(L.y));
  root.setProperty('--gw', px(L.w));
  root.setProperty('--gh', px(L.h));
  // nas faixas laterais, os corações e a pausa ficam por cima das faixas (fora do jogo)
  root.setProperty('--hud-l', px(L.mode === 'side' ? 0 : L.x));
  root.setProperty('--hud-r', px(L.mode === 'side' ? 0 : W - L.x - L.w));
  root.setProperty('--bar-h', px(L.bar));
  if (L.tb) root.setProperty('--tb', px(L.tb)); else root.removeProperty('--tb');
  document.body.classList.toggle('wide', !portrait);
  document.body.classList.toggle('ctl-bar', L.mode === 'bar');
  document.body.classList.toggle('ctl-side', L.mode === 'side');

  if (game.scene && game.scene.onResize) game.scene.onResize();
}

save.load();
audio.setMuted(save.data.muted);
audio.setMusicMuted(save.data.musicMuted);
game.ui = new UI(game);
game.installer = new Installer(game.ui);
registerServiceWorker();
input.init({
  onEscape: () => game.ui.escape(),
  onPause: () => { if (game.scene && game.scene.togglePause) game.scene.togglePause(); },
  onModeChange: resize,
});

window.addEventListener('resize', resize);
// Depois de rodar, o Safari do iOS demora um pouco a dar as medidas certas: medir várias vezes.
const settle = () => [60, 200, 450, 900].forEach((ms) => setTimeout(resize, ms));
window.addEventListener('orientationchange', settle);
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', settle);
window.addEventListener('pageshow', settle);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  audio.visibility(document.hidden);
  if (document.hidden && game.scene && game.scene.autoPause) game.scene.autoPause();
});

game.goMenu();

// Ciclo principal: lógica a passo fixo (60 por segundo), desenho a cada fotograma.
const STEP = 1 / 60;
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= STEP) {
    game.scene.update(STEP);
    input.endFrame();
    acc -= STEP;
  }
  game.scene.draw(ctx, view);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Útil para depuração na consola do browser.
window.__game = game;

// Com ?qa no endereço, corre a suite de testes automáticos (tests/qa.js).
if (new URLSearchParams(location.search).has('qa')) import('../tests/qa.js').then((m) => m.run(game));
