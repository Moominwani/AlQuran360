
const STATIC_CACHE_NAME = 'alquran360-static-v3';
const API_CACHE_NAME = 'alquran360-api-v3';
const FONT_CACHE_NAME = 'alquran360-fonts-v3';

// Precache the main app shell and critical third-party CSS.
// Other assets (like React from the CDN) will be cached on first use.
const STATIC_RESOURCES_TO_PRECACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap',
];

const API_ORIGINS = [
    'https://api.aladhan.com',
    'https://api.alquran.cloud',
    'https://geocoding-api.open-meteo.com',
    'https://hadithapi.com',
    'https://nominatim.openstreetmap.org'
];

// On install, precache the static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell and Static Resources...');
      return cache.addAll(STATIC_RESOURCES_TO_PRECACHE);
    }).catch(error => {
      console.error('Failed to cache static resources during install:', error);
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [STATIC_CACHE_NAME, API_CACHE_NAME, FONT_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Google Fonts (Stale-While-Revalidate)
  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const networkFetch = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }

  // Strategy 2: API Calls (Network falling back to Cache)
  if (API_ORIGINS.some(origin => url.origin === origin)) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: "Offline and data not available in cache." }), {
              status: 503,
              statusText: "Service Unavailable",
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Strategy 3: All other requests (JS, CSS from CDN, images, app shell) (Cache First)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(networkResponse => {
        return caches.open(STATIC_CACHE_NAME).then(cache => {
          if(networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
         if (request.mode === 'navigate') {
            return caches.match('/index.html');
         }
      });
    })
  );
});
