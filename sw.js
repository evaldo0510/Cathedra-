
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 5.1.0 - Market Ready Edition (Notificações Ativas)
 */

const CACHE_NAME = 'cathedra-v5.1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './sw.js',
  'https://img.icons8.com/ios-filled/512/d4af37/cross.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
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

// Estratégia Stale-While-Revalidate para ativos e Network-First para a API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar chamadas de API do Gemini para garantir dados em tempo real
  if (url.origin.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listener para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Suporte a Push real (futuro)
self.addEventListener('push', (event) => {
  let data = { title: 'Lumen Diei', body: 'Nova meditação disponível.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Lumen Diei', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: 'https://img.icons8.com/ios-filled/512/d4af37/cross.png',
    badge: 'https://img.icons8.com/ios-filled/96/d4af37/cross.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
