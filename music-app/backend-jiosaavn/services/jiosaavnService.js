const axios = require('axios');

const configuredBase = process.env.JIOSAAVN_URL;
const JIOSAAVN_BASES = [
  configuredBase,
  'https://jiosavan-api2.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

async function getWithFallback(path, params = {}) {
  for (const base of JIOSAAVN_BASES) {
    try {
      const response = await axios.get(`${base}${path}`, {
        params,
        timeout: 10000,
      });
      return response;
    } catch (err) {
      console.error(`JioSaavn request failed for ${base}${path}:`, err.message);
    }
  }
  return null;
}

async function searchSongs(query) {
  try {
    const response = await getWithFallback('/api/search/songs', { query, limit: 10 });
    if (!response) return null;

    const results = response.data?.data?.results;
    if (!results || results.length === 0) return null;

    return results
      .map((song) => ({
        id: song.id,
        title: song.name,
        artist:
          song.primaryArtists ||
          song.artists?.primary?.map((artist) => artist?.name).filter(Boolean).join(', ') ||
          'Unknown Artist',
        album: song.album?.name || '',
        duration: song.duration,
        albumArt:
          song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url,
        url:
          song.downloadUrl?.[4]?.url ||
          song.downloadUrl?.[3]?.url ||
          song.downloadUrl?.[2]?.url,
        stream_url:
          song.downloadUrl?.[4]?.url ||
          song.downloadUrl?.[3]?.url ||
          song.downloadUrl?.[2]?.url,
        r2_url:
          song.downloadUrl?.[4]?.url ||
          song.downloadUrl?.[3]?.url ||
          song.downloadUrl?.[2]?.url,
        album_art_url:
          song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url,
        source: 'jiosaavn',
      }))
      .filter((song) => song.url);
  } catch (err) {
    console.error('JioSaavn error:', err.message);
    return null;
  }
}

async function getSongById(id) {
  try {
    const response = await getWithFallback(`/api/songs/${id}`);
    if (!response) return null;
    const song = response.data?.data?.[0];
    if (!song) return null;

    return {
      id: song.id,
      title: song.name,
      artist:
        song.primaryArtists ||
        song.artists?.primary?.map((artist) => artist?.name).filter(Boolean).join(', ') ||
        'Unknown Artist',
      album: song.album?.name,
      duration: song.duration,
      albumArt: song.image?.[2]?.url,
      url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[2]?.url,
      stream_url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[2]?.url,
      r2_url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[2]?.url,
      album_art_url: song.image?.[2]?.url,
      source: 'jiosaavn',
    };
  } catch (err) {
    console.error('JioSaavn getSongById error:', err.message);
    return null;
  }
}

module.exports = { searchSongs, getSongById };
