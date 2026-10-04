// Service worker do jogo: permite instalá-lo como app e jogar sem rede.
// Estratégia "rede primeiro": com rede, recebe-se sempre a versão mais recente (e guarda-se
// uma cópia); sem rede, usa-se a cópia guardada. As fontes do Google ficam em cache.
// Ao mudar a lista de ficheiros, mudar também o nome da cache (a suite ?qa verifica que todos
// os módulos do jogo estão aqui).
const CACHE = 'luisa-sergio-v3';
const CORE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-180.png',
  'js/main.js',
  'js/audio.js',
  'js/config.js',
  'js/device.js',
  'js/fx.js',
  'js/input.js',
  'js/layout.js',
  'js/memories.js',
  'js/save.js',
  'js/sprites.js',
  'js/themes.js',
  'js/ui.js',
  'js/scenes/aurora.js',
  'js/scenes/bike.js',
  'js/scenes/birds.js',
  'js/scenes/birth.js',
  'js/scenes/covid.js',
  'js/scenes/date.js',
  'js/scenes/house.js',
  'js/scenes/menu.js',
  'js/scenes/operation.js',
  'js/scenes/oven.js',
  'js/scenes/play.js',
  'js/scenes/prep.js',
  'js/scenes/proposal.js',
  'js/scenes/tour.js',
  'js/scenes/victory.js',
  'js/levels/01-encontro.js',
  'js/levels/02-date.js',
  'js/levels/03-madeira.js',
  'js/levels/04-ciclismo.js',
  'js/levels/05-solar.js',
  'js/levels/06-pretarouca.js',
  'js/levels/07-covid.js',
  'js/levels/08-aves.js',
  'js/levels/09-noruega.js',
  'js/levels/10-pedido.js',
  'js/levels/11-casa.js',
  'js/levels/12-preparativos.js',
  'js/levels/b1-maternidade.js',
  'js/levels/chunks.js',
  'js/levels/index.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro, com um limite de tempo; se falhar, a cópia guardada.
function networkFirst(req) {
  return caches.open(CACHE).then((cache) => new Promise((resolve) => {
    let done = false;
    const fallback = () => cache.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit && !done) { done = true; resolve(hit); }
      return hit;
    });
    const timer = setTimeout(fallback, 4000);
    fetch(req).then((res) => {
      clearTimeout(timer);
      if (res && res.ok) cache.put(req, res.clone());
      if (!done) { done = true; resolve(res); }
    }).catch(() => {
      clearTimeout(timer);
      fallback().then((hit) => {
        if (!done) { done = true; resolve(hit || Response.error()); }
      });
    });
  }));
}

// Cache primeiro (as fontes não mudam).
function cacheFirst(req) {
  return caches.open(CACHE).then((cache) => cache.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  })));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(networkFirst(req));
  else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(cacheFirst(req));
});
