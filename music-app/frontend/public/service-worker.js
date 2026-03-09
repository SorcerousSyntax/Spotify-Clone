const CACHE_NAME = 'music-app-v5';
const AUDIO_CACHE = 'music-audio-v5';
// User-saved offline songs — must NEVER be wiped by the activate cleanup
const SAVED_SONGS_CACHE = 'saved-songs-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== AUDIO_CACHE && key !== SAVED_SONGS_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always try network first for HTML navigations so new deploys are picked up.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          return cachedIndex || caches.match('/');
        })
    );
    return;
  }

  // Audio files: cache first for proxy streams, song files, and audio requests.
  const isAudioRequest =
    request.destination === 'audio' ||
    url.pathname === '/api/stream' ||
    (url.pathname.includes('/api/songs/') && url.pathname.endsWith('/stream')) ||
    url.pathname.startsWith('/songs/');

  if (isAudioRequest) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (audioCache) => {
        const cached = await audioCache.match(request);
        if (cached) return cached;

        // Also check the explicit user-saved songs cache
        const savedCache = await caches.open(SAVED_SONGS_CACHE);
        const savedCached = await savedCache.match(request);
        if (savedCached) return savedCached;

        try {
          const response = await fetch(request);
          if (response.ok) {
            audioCache.put(request, response.clone());
          }
          return response;
        } catch {
          // Last resort: try both caches with any matching URL
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          throw new Error('Audio unavailable offline');
        }
      })
    );
    return;
  }

  // API calls: network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          return new Response(
            JSON.stringify({ error: 'Offline and no cached data available.' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // Static assets and app shell fallback: network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.destination === 'document') {
          const indexHtml = await caches.match('/index.html');
          if (indexHtml) return indexHtml;
        }

        return new Response('Offline resource unavailable.', { status: 503 });
      })
  );
});
