
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 2.3.0-push-enabled
 */

const CACHE_NAME = 'cathedra-v2.3-push';

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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
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

// Lógica de Push Notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'Cathedra Digital',
    body: 'O Pão Espiritual do dia está pronto para você.',
    icon: 'https://img.icons8.com/ios-filled/192/d4af37/cross.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || 'https://img.icons8.com/ios-filled/192/d4af37/cross.png',
    badge: 'https://img.icons8.com/ios-filled/96/d4af37/cross.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('generativelanguage.googleapis.com') || url.includes('stripe.com')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(netRes => {
        if (netRes && netRes.status === 200 && url.includes('unsplash.com')) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRes.clone()));
        }
        return netRes;
      });
    })
  );
});
