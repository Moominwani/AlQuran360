const STATIC_CACHE = 'alquran360-static-v5';
const DYNAMIC_CACHE = 'alquran360-dynamic-v5';
const FONT_CACHE = 'alquran360-fonts-v5';

// A complete list of assets required for the app shell to function offline.
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/index.tsx', 
    '/icon-192x192.png',
    '/icon-512x512.png',
    // Dependencies from index.html
    'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
    // Dependencies from importmap
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react@^19.2.0/jsx-runtime',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
    'https://aistudiocdn.com/@google/genai@^1.27.0',
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
  console.log('Service Worker: Installing (v5)...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Service Worker: Caching app shell...');
      return cache.addAll(STATIC_ASSETS);
    }).catch(error => {
      console.error('Failed to cache static assets during install:', error);
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating (v5)...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== FONT_CACHE)
        .map(key => {
            console.log('Service Worker: Deleting old cache:', key);
            return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 1: Fonts (Stale-While-Revalidate)
  if (url.origin === 'https://fonts.gstatic.com' || url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Strategy 2: API Calls (Network first, falling back to cache)
  if (API_ORIGINS.some(origin => url.origin === origin)) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          return cache.match(event.request).then(cachedResponse => {
            // If we have a cached API response, serve it. Otherwise, fail gracefully.
            return cachedResponse || new Response(JSON.stringify({ error: "Offline: Could not fetch data." }), { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' }
            });
          });
        });
      })
    );
    return;
  }

  // Strategy 3: App Shell & everything else (Cache First)
  // This is the most robust strategy for the app itself.
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      // If the request is in our static cache, serve it immediately.
      // This guarantees the app loads offline.
      if (cacheRes) {
        return cacheRes;
      }
      
      // If it's not in our static cache, try fetching from the network.
      // And cache it for future offline use.
      return fetch(event.request).then(fetchRes => {
        return caches.open(DYNAMIC_CACHE).then(cache => {
          // We only cache successful GET requests.
          if (event.request.method === 'GET' && fetchRes.ok) {
              cache.put(event.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      }).catch(() => {
        // If the network request fails (e.g., user is offline and asset wasn't precached):
        // For page navigations, serve the main app shell as a fallback.
        // This prevents the browser's default "You are offline" page.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});