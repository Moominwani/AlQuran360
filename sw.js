const CACHE_NAME = 'alquran360-cache-v2';

// URLs for network-first, cache-fallback strategy (for dynamic content)
const API_URLS = [
    'https://api.aladhan.com/v1/',
    'https://geocoding-api.open-meteo.com/v1/',
    'https://nominatim.openstreetmap.org/',
    'https://hadithapi.com/api/',
    'https://api.alquran.cloud/v1/' // For audio and fallback text
];

// Install event: precache app shell and critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precaching core assets. Others will be cached on the fly.
      return cache.addAll([
          '/',
          '/index.html',
          'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css'
      ]);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve from cache or network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Strategy 1: Network-first for APIs
    if (API_URLS.some(apiUrl => url.href.startsWith(apiUrl))) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        // If we get a valid response, clone it and cache it for offline use.
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // If the network fails, try to get it from the cache.
                        return cache.match(event.request).then(response => {
                            return response || Promise.reject('no-match');
                        });
                    });
            })
        );
        return;
    }

    // Strategy 2: Cache-first for all other requests (app shell, static assets, fonts, etc.)
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Not in cache - fetch from network, then cache it for next time.
            return fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response before caching
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // We need to clone the response because it's a one-time use stream.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    // Cache the fetched resource.
                    // We only cache GET requests.
                    if (event.request.method === 'GET') {
                         cache.put(event.request, responseToCache);
                    }
                });

                return networkResponse;
            });
        })
    );
});
