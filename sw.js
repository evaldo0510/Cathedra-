
/**
 * Cathedra Digital - Service Worker Pro
 * Version: 11.0.0 - Enhanced PWA Stability
 */

const CACHE_NAME = 'cathedra-v11';
const STATIC_ASSETS = [
  './',
  './index.html',
  './metadata.json',
  'https://cdn.tailwindcss.com?plugins=typography,forms,aspect-ratio',
  'https://www.transparenttextures.com/patterns/natural-paper.png',
  'https://img.icons8.com/ios-filled/192/d4af37/throne.png'
];

// Instalação: Pre-cache de ativos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching ativos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== 'cathedra-ai-cache' && key !== 'cathedra-media-cache') {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Estratégia de Fetch: Network with Cache Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requisições de extensões ou esquemas não suportados
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida, clonamos e guardamos no cache dinâmico
        if (response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
        }
        return response;
      })
      .catch(() => {
        // Se falhar a rede, tentamos o cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          // Se for navegação de página e não houver cache, retorna o index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline content not available', { status: 503 });
        });
      })
  );
});

// Background Sync para favoritos
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    console.log('[SW] Sincronizando favoritos pendentes...');
  }
});
