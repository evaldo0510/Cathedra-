
/**
 * Cathedra Digital - Service Worker Pro
 * Versão: 3.1.0-force-update
 */

const CACHE_NAME = 'cathedra-v3.1';

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
  // Força o Service Worker a se tornar ativo imediatamente
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
  // Garante que o SW controle a página imediatamente
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('generativelanguage.googleapis.com') || url.includes('stripe.com')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(netRes => {
        if (netRes && netRes.status === 200 && (url.includes('unsplash.com') || url.includes('wikimedia.org'))) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRes.clone()));
        }
        return netRes;
      });
    })
  );
});
