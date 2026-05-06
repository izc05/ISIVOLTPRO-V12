const CACHE_NAME = 'santa-teresa-local-secure-v34-user-photo-flow';
const APP_SHELL = [
  './',
  './index.html?v=v34-user-photo-flow',
  './styles.css?v=v29-visual-legal',
  './extras.css?v=v29-visual-legal',
  './guided-form.css?v=v29-visual-legal',
  './auth-cover.css?v=v29-visual-legal',
  './app-flow.css?v=v34-user-photo-flow',
  './db-cards.css?v=v33-card-avatars',
  './settings-simple.css?v=v29-visual-legal',
  './iphone-glass.css?v=v31-nav-premium',
  './app.js?v=v34-user-photo-flow',
  './qr-tools.js?v=v32-report-autocomplete',
  './guided-form.js?v=v32-report-autocomplete',
  './db-enhance.js?v=v33-card-avatars',
  './settings-enhance.js?v=v34-user-photo-flow',
  './report-workflow.js?v=v34-user-photo-flow',
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
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=v34-user-photo-flow') || caches.match('./index.html')))
  );
});
