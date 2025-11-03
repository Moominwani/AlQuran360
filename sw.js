const CACHE_NAME = 'alquran360-cache-v1';
const API_CACHE_NAME = 'alquran360-api-cache-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/index.tsx', // This represents the main app logic file
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap'
];

const API_ORIGINS = [
    'https://api.aladhan.com',
    'https://api.alquran.cloud',
    'https://geocoding-api.open-meteo.com',
    'https://hadithapi.com',
    'https://nominatim.openstreetmap.org'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  const isApiUrl = API_ORIGINS.some(origin => requestUrl.origin === origin);
  
  // Strategy: Stale-While-Revalidate for APIs
  if (isApiUrl) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
            // This catch is for when fetch itself fails (e.g. offline)
            // if we have a cached response, we've already returned it.
        });

        // Return cached response immediately if available, otherwise wait for fetch.
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy: Cache First, then Network for App Shell & other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // For non-API requests, cache them in the main app cache
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache opaque responses (for CDNs) and regular responses
          if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(error => {
      // If everything fails, and it's a navigation request, show the root file (which should be cached)
      console.log('Fetch failed; returning offline page instead.', error);
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
