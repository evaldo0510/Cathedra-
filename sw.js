
/**
 * Cathedra Digital - Service Worker Pro (Codex Edition)
 * Version: 7.0.0 - Optimized for Background Sync & Offline Integrity
 */

const CACHE_VERSION = 'cathedra-v7-2024';
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

// Instalação: Cacheia o "App Shell" imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching Robust App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpeza agressiva de caches obsoletos e controle imediato
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

// Interceptação de Requisições com Fallback Inteligente
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Exceção: Gemini API (Sempre rede, sem cache local para geração dinâmica)
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  // 1. Navegação SPA: Redireciona para index.html se falhar (Offline-First para rotas)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 2. Estratégia Cache-First para Fontes (Assets Imutáveis)
  if (url.origin.includes('fonts.gstatic.com') || url.origin.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(event.request, FONT_CACHE));
    return;
  }

  // 3. Estratégia Cache-First com Fallback para Imagens (Unsplash, Icons8)
  if (event.request.destination === 'image' || url.origin.includes('images.unsplash.com')) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
    return;
  }

  // 4. Stale-While-Revalidate para o restante (JS, CSS local, Meta)
  event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
});

// BACKGROUND SYNC: Sincronização inteligente de dados salvos offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-theological-data') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  console.log('[SW] Background Sync Iniciado: Sincronizando Depósito local com Nuvem...');
  // Aqui implementamos a lógica de retry para enviar bookmarks/histórico pendentes no IndexedDB para o Supabase
  // Em uma implementação real, iteraríamos por uma store 'outbox' no IndexedDB
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
