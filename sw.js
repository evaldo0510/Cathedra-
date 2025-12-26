
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 3.2.0-typography-fix
 */

const CACHE_NAME = 'cathedra-v3.2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  'https://cdn.tailwindcss.com'
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
          if (key !== CACHE_NAME) {
            console.log('[Cathedra SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Ignorar chamadas de API da IA para não cachear respostas erradas
  if (url.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(netRes => {
        // Cachear imagens dinâmicas (Santos, etc)
        if (netRes.ok && (url.includes('unsplash.com') || url.includes('wikimedia.org'))) {
          const resClone = netRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return netRes;
      });
    })
  );
});
