// Arranque do jogo: ecrã, ciclo principal e gestão de cenas.
import { VIEW_LANDSCAPE_H, VIEW_PORTRAIT_W } from './config.js';
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
import { VictoryScene } from './scenes/victory.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// w, h: tamanho do ecrã em píxeis de jogo · k: píxeis reais por píxel de jogo
// pad: faixa inferior reservada aos botões táteis (só em retrato, durante um nível)
const view = { w: 320, h: 180, k: 1, pad: 0, portrait: false };

// Tipos de nível: plataformas (por omissão) e minijogos.
const SCENES = { platform: PlayScene, operation: OperationScene, date: DateScene, bike: BikeScene, tour: TourScene, covid: CovidScene, proposal: ProposalScene };

const game = {
  view, input, audio, save,
  ui: null,
  scene: null,
  // Com ?debug no endereço, todos os níveis ficam desbloqueados (para testar).
  debug: new URLSearchParams(location.search).has('debug'),

  setScene(scene) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = scene;
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

// O canvas ocupa o ecrã inteiro. A resolução interna adapta-se para que cada píxel
// de jogo corresponda a um número inteiro de píxeis reais (pixel art sempre nítida).
function resize() {
  const W = Math.max(1, window.innerWidth), H = Math.max(1, window.innerHeight);
  const dpr = window.devicePixelRatio || 1;
  const portrait = H > W;
  // Em paisagem arredonda-se (quase sempre) para baixo, para o nível caber inteiro em altura.
  const k = Math.max(1, portrait
    ? Math.round((W * dpr) / VIEW_PORTRAIT_W)
    : Math.floor((H * dpr) / VIEW_LANDSCAPE_H + 0.2));
  const w = Math.ceil((W * dpr) / k), h = Math.ceil((H * dpr) / k);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.width = (w * k) / dpr + 'px';
  canvas.style.height = (h * k) / dpr + 'px';
  ctx.imageSmoothingEnabled = false;

  view.w = w; view.h = h; view.k = k; view.portrait = portrait;
  const usesPad = !!(game.scene && game.scene.usesPad);   // cenas jogadas com os botões ◀ ▶ ▲
  view.pad = portrait && input.touch && usesPad ? Math.round(h * 0.3) : 0;

  const root = document.documentElement.style;
  root.setProperty('--u', Math.max(9, Math.min(26, W / 26, H / 24)).toFixed(2) + 'px');
  root.setProperty('--pad-h', (portrait ? (view.pad * k) / dpr : Math.min(H * 0.55, 200)) + 'px');

  if (game.scene && game.scene.onResize) game.scene.onResize();
}

save.load();
audio.setMuted(save.data.muted);
game.ui = new UI(game);
input.init({
  onEscape: () => game.ui.escape(),
  onPause: () => { if (game.scene && game.scene.togglePause) game.scene.togglePause(); },
  onModeChange: resize,
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
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
