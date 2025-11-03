const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/index.tsx',
  '/metadata.json',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/TopBar.tsx',
  '/components/BottomNav.tsx',
  '/components/LocationManager.tsx',
  '/components/LocationModal.tsx',
  '/components/FloatingAIButton.tsx',
  '/components/AIAssistant.tsx',
  '/components/VoiceCommandUI.tsx',
  '/components/AyahActions.tsx',
  '/components/AudioPlayer.tsx',
  '/components/ChatHistoryPanel.tsx',
  '/components/AIScholarModal.tsx',
  '/components/SettingsModal.tsx',
  '/components/AboutModal.tsx',
  '/components/icons/NavIcons.tsx',
  '/components/icons/MiscIcons.tsx',
  '/components/icons/PlayerIcons.tsx',
  '/components/icons/SurahDetailIcons.tsx',
  '/components/icons/QiblaIcons.tsx',
  '/contexts/ThemeContext.tsx',
  '/contexts/TimeFormatContext.tsx',
  '/hooks/useGeolocation.ts',
  '/pages/Home.tsx',
  '/pages/Quran.tsx',
  '/pages/SurahDetail.tsx',
  '/pages/Prayer.tsx',
  '/pages/Hadith.tsx',
  '/pages/Qibla.tsx',
  '/pages/Tasbeeh.tsx',
  '/pages/Settings.tsx',
  '/pages/Appearance.tsx',
  '/pages/TimeFormat.tsx',
  '/pages/About.tsx',
  '/pages/AboutAssistant.tsx',
  '/pages/Favorites.tsx',
  '/pages/AIScholar.tsx',
  '/utils/db.ts',
  '/utils/commandParser.ts',
  '/utils/surahMetadata.ts',
  '/utils/juzMetadata.ts',
  '/utils/surahNames.ts',
  '/utils/tts.ts',
  'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching App Shell');
      // Use addAll for atomic caching. If one file fails, the whole process fails,
      // preventing a partially cached and broken state.
      return cache.addAll(APP_SHELL_ASSETS).catch(error => {
        console.error('Service Worker: Failed to cache app shell.', error);
        // Propagate the error to fail the service worker installation
        throw error;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  const apiHosts = ['api.aladhan.com', 'geocoding-api.open-meteo.com', 'hadithapi.com', 'nominatim.openstreetmap.org', 'api.alquran.cloud'];

  if (apiHosts.some(host => url.hostname.includes(host))) {
     event.respondWith(
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            return fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            }).catch(() => {
                return cache.match(request);
            });
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((fetchRes) => {
        return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          if (request.method === 'GET' && fetchRes.ok) {
              cache.put(request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});