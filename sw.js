
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 5.2.0 - Market Ready Edition (Deep Linking & Actions)
 */

const CACHE_NAME = 'cathedra-v5.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './sw.js',
  'https://img.icons8.com/ios-filled/512/d4af37/throne.png'
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
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

// Listener para cliques em notificações com suporte a ações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let targetUrl = event.notification.data?.url || '/';

  // Lógica de ações rápidas
  if (event.action === 'read-liturgy') {
    targetUrl = '/liturgia-diaria';
  } else if (event.action === 'see-saint') {
    targetUrl = '/santos';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Procura se já existe uma aba do app aberta para focar nela
      for (const client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Se não, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Cathedra Digital', body: 'O Santuário tem novas mensagens para você.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Cathedra Digital', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: 'https://img.icons8.com/ios-filled/512/d4af37/throne.png',
    badge: 'https://img.icons8.com/ios-filled/96/d4af37/throne.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
