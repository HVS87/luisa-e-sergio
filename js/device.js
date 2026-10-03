// Integração com o dispositivo: aviso de orientação, instalar como app (PWA),
// ecrã inteiro e service worker (para o jogo abrir mesmo sem rede).

const ua = navigator.userAgent || '';
// O iPad com iPadOS identifica-se como um Mac, mas tem ecrã tátil.
export const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/.test(ua);
const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(ua);

// Já está a correr como app instalada (ecrã principal)?
export function isStandalone() {
  return !!(navigator.standalone ||
    (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)));
}

// Telemóvel (e não tablet): o lado mais curto do ecrã tem menos de 600 px.
export function isPhone() {
  const touch = navigator.maxTouchPoints > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  return touch && Math.min(screen.width, screen.height) < 600;
}

// ---------- Ecrã inteiro (com os prefixos do Safari) ----------
const docEl = document.documentElement;
export const fullscreen = {
  supported: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!(docEl.requestFullscreen || docEl.webkitRequestFullscreen),
  active: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
  toggle() {
    if (this.active()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const p = (docEl.requestFullscreen || docEl.webkitRequestFullscreen).call(docEl);
      if (p && p.catch) p.catch(() => {});
    }
  },
};

// ---------- Orientação ----------
// Os níveis jogados com os botões ◀ ▶ ▲ (plataformas e bicicleta) ficam muito melhores com o
// telemóvel deitado: nesses, se estiver na vertical, aparece um aviso e o jogo faz pausa.
export class Orientation {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('rotate');
    this.dismissed = false;     // o jogador escolheu jogar na vertical (até fechar o jogo)
    this.shown = false;
    document.getElementById('rotate-ok').addEventListener('click', () => {
      this.dismissed = true;
      this.check();
    });
    const mq = window.matchMedia && matchMedia('(orientation: portrait)');
    if (mq && mq.addEventListener) mq.addEventListener('change', () => this.check());
    else if (mq && mq.addListener) mq.addListener(() => this.check());
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => this.check());
  }

  portrait() { return window.innerHeight > window.innerWidth; }

  check() {
    const scene = this.game.scene;
    const want = !!(scene && scene.usesPad) && isPhone();
    const show = want && this.portrait() && !this.dismissed;
    document.body.classList.toggle('want-landscape', want);
    if (show === this.shown) return;
    this.shown = show;
    this.el.hidden = !show;
    // a meio de um nível, roda-se o telemóvel para a vertical: pausa
    if (show && document.body.classList.contains('playing') && scene.autoPause) scene.autoPause();
  }

  // Ao entrar numa cena: em ecrã inteiro (Android), tenta mesmo fixar a orientação.
  sceneChanged() {
    const scene = this.game.scene, so = screen.orientation;
    if (so && so.lock && isPhone() && (fullscreen.active() || isStandalone())) {
      if (scene && scene.usesPad) so.lock('landscape').catch(() => {});
      else if (so.unlock) try { so.unlock(); } catch (err) { /* ignora */ }
    }
    this.check();
  }
}

// ---------- Instalar como app ----------
// Chrome/Edge/Samsung (Android e computador) oferecem o pedido de instalação; no iPhone/iPad
// (Safari) e noutros browsers mostram-se as instruções para adicionar ao ecrã principal.
export class Installer {
  constructor(ui) {
    this.ui = ui;
    this.prompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.prompt = e;
      this.refresh();
    });
    window.addEventListener('appinstalled', () => { this.prompt = null; this.refresh(); });
    this.refresh();
  }

  // O botão aparece sempre que ainda não estiver instalada (há sempre instruções para dar).
  available() { return !isStandalone(); }

  refresh() {
    const b = document.getElementById('btn-install');
    if (b) b.hidden = !this.available();
  }

  async install() {
    if (this.prompt) {
      const p = this.prompt;
      this.prompt = null;
      try {
        p.prompt();
        await p.userChoice;
      } catch (err) { /* cancelado */ }
      this.refresh();
      return;
    }
    this.ui.showInstallHelp(this.steps());
  }

  // Passos para instalar, conforme o sistema e o browser.
  steps() {
    if (isIOS) {
      return {
        lead: isSafari ? 'No iPhone e no iPad, no Safari:' : 'No iPhone e no iPad, abre esta página no Safari e depois:',
        steps: ['Toca no botão Partilhar (o quadrado com uma seta para cima).', 'Escolhe «Adicionar ao ecrã principal».', 'Toca em «Adicionar». O jogo fica com ícone próprio e abre em ecrã inteiro.'],
      };
    }
    if (isAndroid) {
      return {
        lead: 'No Android:',
        steps: ['Abre o menu do browser (os três pontos ⋮).', 'Escolhe «Instalar aplicação» ou «Adicionar ao ecrã principal».', 'Confirma. O jogo fica com ícone próprio e funciona sem rede.'],
      };
    }
    if (isSafari) {
      return { lead: 'No Safari do Mac:', steps: ['Menu Ficheiro → «Adicionar à Dock».', 'Confirma em «Adicionar».'] };
    }
    return {
      lead: 'No computador (Chrome ou Edge):',
      steps: ['Clica no ícone de instalar, à direita na barra de endereço (ou no menu ⋮ → «Instalar»).', 'Confirma em «Instalar».'],
    };
  }
}

// Service worker: guarda os ficheiros do jogo para abrir sem rede e permitir a instalação.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem modo offline */ });
  });
}
