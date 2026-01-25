
/**
 * Cathedra Digital - Service Worker Pro (Codex Edition)
 * Version: 6.0.0
 */

const CACHE_VERSION = 'cathedra-v6-2024';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  'https://cdn.tailwindcss.com?plugins=typography,forms,aspect-ratio',
  'https://www.transparenttextures.com/patterns/natural-paper.png'
];

// Instalação: Cacheia o "App Shell"
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, IMAGE_CACHE, FONT_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Não interferir com a API do Google Gemini
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  // 2. Navegação SPA: Retorna index.html para qualquer rota não encontrada
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 3. Estratégia Cache-First para Fontes
  if (url.origin.includes('fonts.gstatic.com') || url.origin.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // 4. Estratégia Cache-First para Imagens (Unsplash e Icons)
  if (event.request.destination === 'image' || url.origin.includes('images.unsplash.com') || url.origin.includes('icons8.com')) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // 5. Stale-While-Revalidate para o restante (JS/CSS/Assets Locais)
  event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.status === 200) cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fresh = fetch(request).then(response => {
    if (response.status === 200) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached || fresh;
}

// Notificações e Background Sync (Placeholder para expansão)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
