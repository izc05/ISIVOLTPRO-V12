const CACHE_NAME = 'santa-teresa-local-secure-v32-report-autocomplete';
const APP_SHELL = [
  './',
  './index.html?v=v32-report-autocomplete',
  './styles.css?v=v29-visual-legal',
  './extras.css?v=v29-visual-legal',
  './guided-form.css?v=v29-visual-legal',
  './auth-cover.css?v=v29-visual-legal',
  './app-flow.css?v=v32-report-autocomplete',
  './db-cards.css?v=v29-visual-legal',
  './settings-simple.css?v=v29-visual-legal',
  './iphone-glass.css?v=v31-nav-premium',
  './app.js?v=v32-report-autocomplete',
  './qr-tools.js?v=v32-report-autocomplete',
  './guided-form.js?v=v32-report-autocomplete',
  './db-enhance.js?v=v32-report-autocomplete',
  './settings-enhance.js?v=v32-report-autocomplete',
  './report-workflow.js?v=v32-report-autocomplete',
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
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=v32-report-autocomplete') || caches.match('./index.html')))
  );
});
