
/**
 * Cathedra Digital - Service Worker Pro
 * Version: 14.0.0 - Production Safe
 */

const CACHE_NAME = 'cathedra-v14';
const STATIC_ASSETS = [
  './',
  './index.html',
  './metadata.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap'
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
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NUNCA CACHEAR CHAMADAS DE API DO GOOGLE/GEMINI
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('generativelanguage')) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachear apenas ativos estáticos de sucesso
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      }).catch(() => {
        // Fallback para navegação offline
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
