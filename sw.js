
const CACHE_NAME = 'cathedra-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  'https://cdn.tailwindcss.com',
  'https://www.transparenttextures.com/patterns/natural-paper.png'
];

const STALE_WHILE_REVALIDATE_URLS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'images.unsplash.com',
  'icons8.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignora chamadas da API Gemini (o app gerencia via LocalStorage/withRetry)
  if (url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // Estratégia Stale-While-Revalidate para recursos externos (fontes, imagens)
  const isExternalResource = STALE_WHILE_REVALIDATE_URLS.some(domain => url.includes(domain));

  if (isExternalResource) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Estratégia Cache-First para ativos locais do manifesto
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Fallback para navegação
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
