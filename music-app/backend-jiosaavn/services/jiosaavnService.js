const axios = require('axios');

const JIOSAAVN_BASE = process.env.JIOSAAVN_URL || 'http://localhost:3000';

async function searchSongs(query) {
  try {
    const response = await axios.get(`${JIOSAAVN_BASE}/api/search/songs`, {
      params: { query, limit: 10 },
      timeout: 10000,
    });

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
    const response = await axios.get(`${JIOSAAVN_BASE}/api/songs/${id}`, {
      timeout: 10000,
    });
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
