
/**
 * Cathedra Digital - Service Worker Pro
 * Version: 12.0.0 - Extreme Offline Stability
 */

const CACHE_NAME = 'cathedra-v12';
const STATIC_ASSETS = [
  './',
  './index.html',
  './metadata.json',
  'https://cdn.tailwindcss.com?plugins=typography,forms,aspect-ratio',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
  'https://www.transparenttextures.com/patterns/natural-paper.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // Estratégia: Cache First para Ativos Estáticos e Imagens
  const isStatic = STATIC_ASSETS.some(asset => event.request.url.includes(asset)) || 
                   event.request.url.includes('unsplash.com') ||
                   event.request.url.includes('icons8.com');

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        });
      })
    );
  } else {
    // Estratégia: Network First para dados dinâmicos com Fallback de Cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('Offline', { status: 503 });
        }))
    );
  }
});
