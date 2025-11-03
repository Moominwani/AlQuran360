// This version implements a robust offline-first strategy by pre-caching all critical assets.
const CACHE_VERSION = 'v8';
const STATIC_CACHE = `alquran360-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `alquran360-dynamic-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE];

// Pre-cache the essential app shell AND all its critical dependencies.
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/@google/genai@^1.27.0'
];

// Helper to correctly cache Google Fonts and the font files they link to.
const cacheGoogleFonts = (cache) => {
  const fontCssUrl = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap';
  
  // 1. Fetch the CSS file
  return fetch(fontCssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }})
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch font CSS');
      // 2. Clone the response to cache the CSS file itself
      cache.put(fontCssUrl, response.clone());
      // 3. Extract font URLs from the CSS text
      return response.text();
    })
    .then(cssText => {
      const fontUrls = cssText.match(/url\((https:\/\/[^)]+)\)/g) || [];
      const urlsToCache = fontUrls.map(urlString => urlString.replace(/url\(['"]?/, '').replace(/['"]?\)/, ''));
      // 4. Cache all the actual font files (.woff2)
      if (urlsToCache.length > 0) {
        return cache.addAll(urlsToCache);
      }
    }).catch(err => {
        console.error("[SW] Could not cache Google Fonts. App may not have custom fonts offline.", err);
    });
};

// On install, pre-cache everything needed for a true offline-first launch.
self.addEventListener('install', event => {
  console.log(`[SW] Install (${CACHE_VERSION})`);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching core assets and fonts.');
        const coreAssetsPromise = cache.addAll(APP_SHELL_ASSETS);
        const fontsPromise = cacheGoogleFonts(cache);
        return Promise.all([coreAssetsPromise, fontsPromise]);
      })
      .catch(error => {
        console.error('[SW] Caching failed during install:', error);
      })
  );
  self.skipWaiting();
});

// On activate, clean up old caches.
self.addEventListener('activate', event => {
  console.log(`[SW] Activate (${CACHE_VERSION})`);
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

  if (request.method !== 'GET') return;
  
  // Strategy 1: Network Falling Back to Cache for navigation requests.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        console.log('[SW] Network failed for navigation. Serving app shell from cache.');
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Strategy 2: Network first, falling back to cache for API calls.
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
        }).catch(() => cache.match(request));
      })
    );
    return;
  }

  // Strategy 3: Cache First for all other assets (pre-cached or dynamically cached).
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
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
