
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 2.2.0-stable
 */

const CACHE_NAME = 'cathedra-v2.2-stable';

// Ativos fundamentais para o app funcionar sem internet
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './constants.tsx',
  './types.ts',
  './App.tsx',
  'https://cdn.tailwindcss.com',
  'https://www.transparenttextures.com/patterns/natural-paper.png',
  'https://img.icons8.com/ios-filled/512/d4af37/cross.png'
];

// Domínios de recursos externos para estratégia Stale-While-Revalidate
const EXTERNAL_RESOURCES = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'icons8.com',
  'unsplash.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Cathedra SW] Preparando Santuário Offline...');
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

  // Ignorar APIs dinâmicas e serviços de terceiros (Stripe/Google AI)
  if (url.includes('generativelanguage.googleapis.com') || url.includes('stripe.com')) {
    return;
  }

  // Estratégia Stale-While-Revalidate para imagens e fontes
  const isExternal = EXTERNAL_RESOURCES.some(r => url.includes(r));
  if (isExternal) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Estratégia Network-First para navegação (garante que o usuário sempre veja o conteúdo novo se houver conexão)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Estratégia Cache-First para arquivos locais
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
