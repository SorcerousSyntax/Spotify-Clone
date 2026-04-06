const CACHE_NAME = 'music-app-v5';
const AUDIO_CACHE = 'music-audio-v5';
// User-saved offline songs — must NEVER be wiped by the activate cleanup
const SAVED_SONGS_CACHE = 'saved-songs-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
];

const ASSET_URL_REGEX = /(?:src|href)=["']([^"']+)["']/g;

async function precacheShellAndAssets() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);

  try {
    const indexResponse = await fetch('/index.html', { cache: 'no-store' });
    if (!indexResponse.ok) return;

    const html = await indexResponse.text();
    const urls = new Set(APP_SHELL);
    let match;

    while ((match = ASSET_URL_REGEX.exec(html)) !== null) {
      const rawUrl = match[1];
      if (!rawUrl || rawUrl.startsWith('http') || rawUrl.startsWith('//')) continue;

      const normalized = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
      urls.add(normalized);
    }

    await Promise.all(
      [...urls].map(async (assetUrl) => {
        try {
          const response = await fetch(assetUrl, { cache: 'no-store' });
          if (response.ok) {
            await cache.put(assetUrl, response.clone());
          }
        } catch (_err) {
          // Ignore per-asset failures so install can still complete.
        }
      })
    );
  } catch (_err) {
    // Fall back to the minimal app shell if asset discovery fails.
  }
}

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(precacheShellAndAssets());
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

/**
 * Helper to handle Range requests from the cache.
 * Safari/iOS require 206 Partial Content for audio/video.
 */
async function handleRangeRequest(request, cacheNames) {
  const rangeHeader = request.headers.get('range');
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      if (!rangeHeader) {
        return cachedResponse;
      }

      const blob = await cachedResponse.blob();
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : blob.size - 1;
        
        const slicedBlob = blob.slice(start, end + 1);
        return new Response(slicedBlob, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            ...Object.fromEntries(cachedResponse.headers.entries()),
            'Content-Range': `bytes ${start}-${end}/${blob.size}`,
            'Content-Length': slicedBlob.size,
          },
        });
      }
    }
  }
  return null;
}

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
      (async () => {
        // Try to handle range request from caches
        const rangeResponse = await handleRangeRequest(request, [SAVED_SONGS_CACHE, AUDIO_CACHE]);
        if (rangeResponse) return rangeResponse;

        // If not in cache, fetch from network
        try {
          const response = await fetch(request);
          if (response.ok && response.status !== 206) {
            const clone = response.clone();
            caches.open(AUDIO_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        } catch (err) {
          // Last resort fallback
          const fallback = await caches.match(request);
          if (fallback) return fallback;
          throw err;
        }
      })()
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

