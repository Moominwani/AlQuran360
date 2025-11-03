
const CACHE_NAME = 'alquran360-cache-v2';
const API_CACHE_NAME = 'alquran360-api-cache-v2';

const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    // Scripts
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/constants.ts',
    '/TopBar.tsx',
    // Components
    '/components/BottomNav.tsx',
    '/components/AyahActions.tsx',
    '/components/AudioPlayer.tsx',
    '/components/LocationModal.tsx',
    '/components/AboutModal.tsx',
    '/components/AIAssistant.tsx',
    '/components/VoiceCommandUI.tsx',
    '/components/FloatingAIButton.tsx',
    '/components/ChatHistoryPanel.tsx',
    '/components/LocationManager.tsx',
    '/components/SettingsModal.tsx',
    '/components/AIScholarModal.tsx',
    // Icons
    '/components/icons/NavIcons.tsx',
    '/components/icons/PlayerIcons.tsx',
    '/components/icons/SurahDetailIcons.tsx',
    '/components/icons/QiblaIcons.tsx',
    '/components/icons/MiscIcons.tsx',
    // Contexts
    '/contexts/ThemeContext.tsx',
    '/contexts/TimeFormatContext.tsx',
    // Hooks
    '/hooks/useGeolocation.ts',
    // Pages
    '/pages/Home.tsx',
    '/pages/Quran.tsx',
    '/pages/SurahDetail.tsx',
    '/pages/Prayer.tsx',
    '/pages/Hadith.tsx',
    '/pages/Settings.tsx',
    '/pages/Qibla.tsx',
    '/pages/Tasbeeh.tsx',
    '/pages/Favorites.tsx',
    '/pages/About.tsx',
    '/pages/Appearance.tsx',
    '/pages/TimeFormat.tsx',
    '/pages/AIScholar.tsx',
    '/pages/AboutAssistant.tsx',
    // Utils
    '/utils/db.ts',
    '/utils/surahMetadata.ts',
    '/utils/surahNames.ts',
    '/utils/juzMetadata.ts',
    '/utils/commandParser.ts',
    '/utils/tts.ts'
];

const API_ORIGINS = [
    'https://api.aladhan.com',
    'https://api.alquran.cloud',
    'https://geocoding-api.open-meteo.com',
    'https://hadithapi.com',
    'https://nominatim.openstreetmap.org'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    }).catch(error => {
      console.error('Failed to cache app shell during install:', error);
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
    }).then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  const isApiUrl = API_ORIGINS.some(origin => requestUrl.origin === origin);
  const isNavigation = request.mode === 'navigate';

  // Strategy for API calls: Network falling back to Cache, with a final fallback.
  if (isApiUrl) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Successful network response. Cache it and return it.
          return caches.open(API_CACHE_NAME).then(cache => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Network failed. Try to serve from cache.
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache either, return a custom error Response.
            // This prevents the browser's generic offline page.
            const errorResponse = { error: "You are offline and this data isn't cached." };
            return new Response(JSON.stringify(errorResponse), {
              status: 408, // Request Timeout
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // Strategy for non-API calls (app shell, assets, etc.): Cache first.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // If we have a response in cache, serve it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, go to the network.
        return fetch(request)
          .then(networkResponse => {
            // Cache the new response for future use.
            return caches.open(CACHE_NAME).then(cache => {
              if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
                 cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            });
          })
          .catch(() => {
            // If network fails AND it's a page navigation, show the offline fallback page.
            if (isNavigation) {
              return caches.match('/');
            }
            // For other assets (images, etc.), just let it fail. It won't crash the app.
          });
      })
  );
});
