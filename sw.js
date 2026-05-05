const CACHE_NAME = 'santa-teresa-local-secure-v30-glass-polish';
const APP_SHELL = [
  './',
  './index.html?v=v30-glass-polish',
  './styles.css?v=v29-visual-legal',
  './extras.css?v=v29-visual-legal',
  './guided-form.css?v=v29-visual-legal',
  './auth-cover.css?v=v29-visual-legal',
  './app-flow.css?v=v29-visual-legal',
  './db-cards.css?v=v29-visual-legal',
  './settings-simple.css?v=v29-visual-legal',
  './iphone-glass.css?v=v30-glass-polish',
  './app.js?v=v30-glass-polish',
  './qr-tools.js?v=v30-glass-polish',
  './guided-form.js?v=v30-glass-polish',
  './db-enhance.js?v=v30-glass-polish',
  './settings-enhance.js?v=v30-glass-polish',
  './report-workflow.js?v=v30-glass-polish',
  './manifest.webmanifest',
  './assets/app-icon.svg',
  './assets/diputacion-jaen-logo.svg',
  './assets/residencia-santa-teresa-fachada.svg',
  './assets/intro-santa-teresa.mp4'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=v30-glass-polish') || caches.match('./index.html')))
  );
});
