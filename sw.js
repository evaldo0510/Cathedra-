
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 5.0.0 - Market Ready Edition
 */

const CACHE_NAME = 'cathedra-v5.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './sw.js',
  'https://img.icons8.com/ios-filled/512/d4af37/cross.png'
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

// Estratégia Stale-While-Revalidate para ativos e Network-First para a API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar chamadas de API do Gemini para garantir dados em tempo real
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listener para notificações agendadas via background sync ou push futuro
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
