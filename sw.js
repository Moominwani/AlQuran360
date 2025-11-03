const CACHE_NAME = 'alquran360-cache-v1';
const API_CACHE_NAME = 'alquran360-api-cache-v1';

// Only precache the local app shell. External assets will be cached on first use by the fetch handler.
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    }).catch(error => {
      console.error('Failed to cache app shell during install:', error);
      throw error;
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

  // Strategy: Network falling back to Cache for APIs
  if (isApiUrl) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If the fetch is successful, cache the response and return it
          return caches.open(API_CACHE_NAME).then((cache) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // If the network fails (offline), try to get the response from the cache.
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy: Cache First, then Network for App Shell & other assets (including external CDNs)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // For non-API requests, cache them in the main app cache
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache opaque responses (for CDNs without CORS) and regular responses
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
