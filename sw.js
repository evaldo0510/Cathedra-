
/**
 * Cathedra Digital - Service Worker Pro (Codex Edition)
 * Version: 9.0.0 - Background Sync & Robust Offline Integrity
 */

const CACHE_VERSION = 'cathedra-v9-2024';
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
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpeza de caches obsoletos
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

  // Gemini API: Sempre rede (dados vivos e dinâmicos)
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  // Navegação SPA: Fallback para index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Estratégia Cache-First para Fontes
  if (url.origin.includes('fonts.gstatic.com') || url.origin.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // Estratégia Cache-First para Imagens (Unsplash, etc)
  if (event.request.destination === 'image' || url.origin.includes('images.unsplash.com')) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // Stale-While-Revalidate para o restante
  event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
});

// BACKGROUND SYNC: Sincronização de dados marcados offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-theological-data') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  console.log('[SW] Iniciando Sincronização de Segundo Plano...');
  // Simulação de processamento de fila pendente no IndexedDB
  return Promise.resolve();
}

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
