/* Professional Store PWA — update-safe service worker */
const CACHE_NAME = 'professional-store-pwa-v3';

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache the service worker itself.
  if (url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Always check the network first for HTML/navigation so new deployments
  // are picked up without manually clearing the browser cache.
  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, copy).catch(() => {})
            );
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(r => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Keep static assets cache-first for PWA/offline performance.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy).catch(() => {});
          });
        }
        return response;
      });
    })
  );
});
