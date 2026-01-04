
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 4.0.0 - High Performance & Offline Core
 */

const CACHE_NAME = 'cathedra-v4.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './sw.js'
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
  const url = new URL(event.request.url);

  // Ignorar chamadas de API (sempre rede primeiro para dados litúrgicos)
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  // ESTRATÉGIA CACHE-FIRST PARA IMAGENS E FONTES (Ativos Pesados)
  if (
    url.origin.includes('unsplash.com') || 
    url.origin.includes('icons8.com') || 
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('fonts.googleapis.com')
  ) {
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

  // ESTRATÉGIA NETWORK-FIRST PARA O CORE (HTML/JS/JSON)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Opcional: atualizar cache do core silenciosamente
        if (response.status === 200 && (url.pathname.endsWith('.html') || url.pathname.endsWith('.json'))) {
           const clone = response.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
