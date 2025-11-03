// Bump versions to ensure the new service worker activates and caches are updated.
const STATIC_CACHE_NAME = 'alquran360-static-v4';
const API_CACHE_NAME = 'alquran360-api-v4';
const FONT_CACHE_NAME = 'alquran360-fonts-v4';

// A robust list of all critical files needed for the app to load.
// This now includes the main TSX file and all JS dependencies from the CDN.
const STATIC_RESOURCES_TO_PRECACHE = [
    // Core App Shell
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/index.tsx', // CRITICAL: Main application script

    // Third-party CSS
    'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
    
    // Google Fonts CSS (the font files themselves are handled by the stale-while-revalidate strategy)
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap',
    
    // CRITICAL: JS dependencies from importmap
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react@^19.2.0/jsx-runtime', // For JSX transforms
    'https://aistudiocdn.com/react-dom@^19.2.0/client', // For ReactDOM.createRoot
    'https://aistudiocdn.com/@google/genai@^1.27.0', // For AI features
];

const API_ORIGINS = [
    'https://api.aladhan.com',
    'https://api.alquran.cloud',
    'https://geocoding-api.open-meteo.com',
    'https://hadithapi.com',
    'https://nominatim.openstreetmap.org'
];

// On install, precache all critical static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing (v4)...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching critical app shell and dependencies...');
      // Use no-cache to ensure we get the latest versions from the network upon install.
      const requests = STATIC_RESOURCES_TO_PRECACHE.map(
          url => new Request(url, { cache: 'no-cache' })
      );
      return cache.addAll(requests);
    }).catch(error => {
      console.error('Failed to cache static resources during install:', error);
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating (v4)...');
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

  // Strategy 3: App Shell & static assets (Cache First, falling back to network)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // If we have a match in the cache, return it. This is the primary path for all our pre-cached assets.
      return cachedResponse || fetch(request).catch(() => {
         // If the network fails for a page navigation, serve the main app shell from the cache.
         if (request.mode === 'navigate') {
            return caches.match('/index.html');
         }
         // For other failed requests (e.g., images not in cache), let them fail.
      });
    })
  );
});
