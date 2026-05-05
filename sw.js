const CACHE_NAME = 'santa-teresa-local-secure-v28-report-search-qr';
const APP_SHELL = [
  './',
  './index.html?v=v28-report-search-qr',
  './styles.css?v=v28-report-search-qr',
  './extras.css?v=v28-report-search-qr',
  './guided-form.css?v=v28-report-search-qr',
  './auth-cover.css?v=v28-report-search-qr',
  './app-flow.css?v=v28-report-search-qr',
  './db-cards.css?v=v28-report-search-qr',
  './settings-simple.css?v=v28-report-search-qr',
  './app.js?v=v28-report-search-qr',
  './qr-tools.js?v=v28-report-search-qr',
  './guided-form.js?v=v28-report-search-qr',
  './db-enhance.js?v=v28-report-search-qr',
  './settings-enhance.js?v=v28-report-search-qr',
  './report-workflow.js?v=v28-report-search-qr',
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
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=v28-report-search-qr') || caches.match('./index.html')))
  );
});
