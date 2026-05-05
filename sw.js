const CACHE_NAME = 'santa-teresa-local-secure-v14-home-hero';
const APP_SHELL = [
  './',
  './index.html?v=v14-home-hero',
  './styles.css',
  './extras.css',
  './app.js',
  './qr-tools.js',
  './guided-form.js',
  './settings-enhance.js',
  './manifest.webmanifest',
  './assets/app-icon.svg',
  './assets/diputacion-jaen-logo.svg',
  './assets/residencia-santa-teresa-fachada.svg'
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
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=v14-home-hero') || caches.match('./index.html')))
  );
});
