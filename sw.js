
/**
 * Cathedra Digital - Service Worker v16.1 (Pro)
 * Optimized for Raw Content Caching
 */

const CACHE_NAME = 'cathedra-v16.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './metadata.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Excluir requisições de IA do cache
  if (url.hostname.includes('googleapis.com')) return;

  // Cache para dados estáticos do GitHub e internos
  if (url.hostname.includes('raw.githubusercontent.com') || url.pathname.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        });
      })
    );
    return;
  }

  // Padrão Cache First para ativos locais
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
