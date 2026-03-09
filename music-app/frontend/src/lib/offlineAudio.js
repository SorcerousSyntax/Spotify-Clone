export const OFFLINE_AUDIO_CACHE_NAME = 'saved-songs-v1';

const isHttpUrl = (value = '') => /^https?:\/\//i.test(value);

const toProxyStreamUrl = (value = '') =>
  isHttpUrl(value) ? `/api/stream?url=${encodeURIComponent(value)}` : value;

const uniqueUrls = (values = []) => {
  const seen = new Set();
  const out = [];

  values.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  });

  return out;
};

export const getSongAudioUrlCandidates = (song = {}) => {
  const isInlineAudio =
    typeof song?.r2_url === 'string' && song.r2_url.startsWith('data:');

  const inferredApiStream =
    song?.id && song?.r2_url && !isInlineAudio ? `/api/songs/${song.id}/stream` : '';

  const primaryRaw = song?.stream_url || song?.url || inferredApiStream || song?.r2_url || '';

  const base = uniqueUrls([
    primaryRaw,
    song?.stream_url,
    song?.url,
    inferredApiStream,
    song?.id ? `/api/songs/${song.id}/stream` : '',
    !isInlineAudio ? song?.r2_url : '',
  ]);

  const expanded = [];
  base.forEach((url) => {
    expanded.push(url);
    if (isHttpUrl(url)) {
      expanded.push(toProxyStreamUrl(url));
    }
  });

  return uniqueUrls(expanded);
};

export const getPreferredSongStreamUrl = (song = {}) => {
  const candidates = getSongAudioUrlCandidates(song);
  if (candidates.length === 0) return '';

  const firstHttp = candidates.find((url) => isHttpUrl(url));
  if (firstHttp) return toProxyStreamUrl(firstHttp);

  return candidates[0];
};

export const cacheSongForOffline = async (song = {}) => {
  if (typeof window === 'undefined' || !window.caches) {
    return { ok: false, reason: 'cache-unavailable' };
  }

  const candidates = getSongAudioUrlCandidates(song);
  if (candidates.length === 0) {
    return { ok: false, reason: 'no-url' };
  }

  const primary = getPreferredSongStreamUrl(song);

  const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
  const existing = await Promise.any(
    candidates.map((url) => cache.match(url).then((hit) => hit || Promise.reject(new Error('miss'))))
  ).catch(() => null);

  if (existing) {
    return { ok: true, reason: 'already-cached' };
  }

  const response = await fetch(primary);
  if (!response.ok) {
    throw new Error(`Save failed (${response.status})`);
  }

  // Read the audio into memory once, then store under every candidate URL.
  // Using response.clone() for many parallel puts can fail once the body stream
  // is consumed, so we materialize it as a Blob first.
  const blob = await response.blob();

  await Promise.all(
    candidates.map((url) => {
      const storedResponse = new Response(blob, {
        status: 200,
        headers: { 'Content-Type': blob.type || 'audio/mpeg' },
      });
      return cache.put(url, storedResponse);
    })
  );
  return { ok: true, reason: 'saved' };
};
