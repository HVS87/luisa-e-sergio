// Integração com o dispositivo: tipo de dispositivo e margens seguras do ecrã, instalar como
// app (PWA), ecrã inteiro e service worker (para o jogo abrir mesmo sem rede).

const ua = navigator.userAgent || '';
// O iPad com iPadOS identifica-se como um Mac, mas tem ecrã tátil.
// Ecrã sempre aceso enquanto o jogo está à vista (Screen Wake Lock API: Chrome/Android, Safari 16.4+,
// app instalada no iPhone desde o iOS 18.4). O sistema larga o pedido quando a página fica escondida,
// por isso volta a pedir-se ao regressar e a cada toque. Em poupança de energia alguns telemóveis
// recusam o pedido: por isso as animações longas também pedem toques pelo meio (ver victory.js).
export const Awake = {
  lock: null,
  pending: false,
  async request() {
    if (!('wakeLock' in navigator) || this.lock || this.pending || document.visibilityState !== 'visible') return;
    this.pending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      this.lock = lock;
      lock.addEventListener('release', () => { if (this.lock === lock) this.lock = null; });
    } catch (e) {
      this.lock = null;          // recusado (poupança de energia, página escondida...): tenta-se no próximo toque
    }
    this.pending = false;
  },
  init() {
    const again = () => { this.request(); };
    for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, again, { passive: true, capture: true });
    document.addEventListener('visibilitychange', again);
    again();
  },
};

const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(ua);

// Já está a correr como app instalada (ecrã principal)?
export function isStandalone() {
  return !!(navigator.standalone ||
    (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)));
}

// Telemóvel ou tablet (ecrã tátil como entrada principal)? Um portátil com ecrã tátil conta
// como computador. Para testar: ?device=mobile ou ?device=pc no endereço.
export function isMobile() {
  const q = new URLSearchParams(location.search).get('device');
  if (q === 'mobile' || q === 'pc') return q === 'mobile';
  return isIOS || isAndroid || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
}

// Margens seguras do ecrã (entalhe, cantos redondos, barra do sistema), em píxeis CSS.
let probe = null;
export function safeInsets() {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;' +
      'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.append(probe);
  }
  const cs = getComputedStyle(probe), n = (v) => parseFloat(v) || 0;
  return { t: n(cs.paddingTop), r: n(cs.paddingRight), b: n(cs.paddingBottom), l: n(cs.paddingLeft) };
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
