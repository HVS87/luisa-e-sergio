// Service worker do jogo: permite instalá-lo como app e jogar sem rede.
// Estratégia "rede primeiro": com rede, recebe-se sempre a versão mais recente (e guarda-se
// uma cópia); sem rede, usa-se a cópia guardada. As fontes do Google ficam em cache.
const CACHE = 'luisa-sergio-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'js/main.js', 'manifest.webmanifest', 'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-180.png'];

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
