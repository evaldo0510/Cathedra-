
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 3.5.0 - Market Ready
 */

const CACHE_NAME = 'cathedra-v3.5';
const ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v3.5...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando e limpando caches antigos...');
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

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Ignorar Gemini API
  if (url.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Cachear imagens dinâmicas para performance
        if (res.ok && (url.includes('unsplash.com') || url.includes('icons8.com'))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
