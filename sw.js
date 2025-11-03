// A new, more robust version to guarantee offline functionality.
const CACHE_VERSION = 'v6';
const STATIC_CACHE = `alquran360-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `alquran360-dynamic-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

// Pre-cache only the essential, same-origin app shell files.
// This is more reliable than trying to pre-cache third-party assets.
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// On install, pre-cache the app shell.
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching App Shell');
        // Use individual add requests to see if a specific asset fails
        return Promise.all(
            APP_SHELL_ASSETS.map(asset => {
                return cache.add(asset).catch(reason => {
                    console.error(`[SW] Failed to cache ${asset}:`, reason);
                });
            })
        );
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
  
  // Strategy for same-origin app shell files: Cache First.
  // This ensures the core app loads instantly offline.
  if (url.origin === self.location.origin && APP_SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request));
    return;
  }
  
  // Strategy for APIs: Network first, falling back to cache.
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
          return cache.match(request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({ error: "You are offline." }), {
              status: 503, headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }

  // Strategy for everything else (CDNs for React, Tailwind, Fonts): Stale-While-Revalidate.
  // This is the key fix: it caches the exact CDN URLs as they are requested.
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // If network fails, and we don't have it in cache, we can't do anything for this asset.
            // The browser will show a resource load error, but the app shell itself will have loaded.
            console.warn('[SW] Network request failed for:', request.url, err);
        });

        // Return from cache immediately if available, otherwise wait for network.
        // This makes the app fast and offline-capable after the first visit.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
