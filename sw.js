
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 3.6.0 - High Performance
 */

const CACHE_NAME = 'cathedra-v3.6';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorar chamadas de API (sempre rede)
  if (url.includes('generativelanguage.googleapis.com')) return;

  // ESTRATÉGIA CACHE-FIRST PARA IMAGENS E ASSETS EXTERNOS
  if (url.includes('unsplash.com') || url.includes('icons8.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return networkResponse;
        });
      })
    );
    return;
  }

  // ESTRATÉGIA NETWORK-FIRST PARA O RESTO (HTML/JS)
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
