// This version implements a robust offline-first strategy.
const CACHE_VERSION = 'v7';
const STATIC_CACHE = `alquran30-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `alquran30-dynamic-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

// Pre-cache the essential app shell. Using relative paths is more reliable.
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// On install, pre-cache the app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching App Shell');
        // Use addAll for atomic caching. It will fail if any asset is not found.
        return cache.addAll(APP_SHELL_ASSETS);
      })
      .catch(error => {
        console.error('[SW] App Shell pre-caching failed:', error);
      })
  );
  self.skipWaiting();
});

// On activate, clean up old caches.
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => !ALL_CACHES.includes(cacheName))
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, apply appropriate caching strategies.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Strategy 1: For navigation requests (the HTML page), use Network Falling Back to Cache.
  // This is the key fix for the "start offline" issue.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // If the network is unavailable, serve the main app shell from the cache.
        // We cached './' during install, so this should always be available.
        return caches.match('./');
      })
    );
    return;
  }

  // Strategy 2: For API calls, use Network first, falling back to cache.
  // This ensures data is as fresh as possible.
  const isApiCall = [
    'api.aladhan.com',
    'api.alquran.cloud',
    'geocoding-api.open-meteo.com',
    'hadithapi.com',
    'nominatim.openstreetmap.org'
  ].includes(url.hostname);

  if (isApiCall) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails, try to serve from cache.
          return cache.match(request);
        });
      })
    );
    return;
  }

  // Strategy 3: For other requests (CDN scripts, fonts, etc.), use Cache First, then Network.
  // This is fast and efficient for static assets that don't change often.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return from cache if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network and cache it
      return fetch(request).then(networkResponse => {
        return caches.open(DYNAMIC_CACHE).then(cache => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});
