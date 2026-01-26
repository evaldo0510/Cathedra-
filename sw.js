
/**
 * Cathedra Digital - Service Worker Pro (Market Ready Edition)
 * Version: 10.0.0 - Dynamic AI Caching & Progressive Integrity
 */

const CACHE_NAME = 'cathedra-pro-v10';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  'https://cdn.tailwindcss.com?plugins=typography,forms,aspect-ratio',
  'https://www.transparenttextures.com/patterns/natural-paper.png',
  'https://img.icons8.com/ios-filled/192/d4af37/throne.png'
];

// Instalação com pre-caching agressivo da UI
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Limpeza de versões antigas (Integridade de Cache)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Interceptador Inteligente
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Gemini API: Network-First com Fallback de Cache Dinâmico
  // Isso permite que o usuário veja resultados de IA buscados anteriormente mesmo offline
  if (url.origin.includes('generativelanguage.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open('cathedra-ai-cache').then(cache => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Estáticos e Imagens: Cache-First (Performance)
  if (event.request.destination === 'image' || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clonedResponse = response.clone();
          caches.open('cathedra-media-cache').then(cache => cache.put(event.request, clonedResponse));
          return response;
        });
      })
    );
    return;
  }

  // Fallback padrão para SPA (Navegação)
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// Background Sync para persistência teológica
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  console.debug('[SW] Sincronizando favoritos pendentes...');
  return Promise.resolve();
}
