import axios from 'axios';

const GENIUS_API_KEY = process.env.GENIUS_API_KEY;

/**
 * Fetch lyrics from external APIs
 * Chain: lyrics.ovh → Genius API
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Object|null} - { lyrics: [{ time, text }], synced, source }
 */
export async function fetchLyrics(title, artist) {
  // Try lyrics.ovh first (free, no API key)
  const ovhResult = await tryLyricsOvh(title, artist);
  if (ovhResult) return ovhResult;

  // Try Genius API
  if (GENIUS_API_KEY) {
    const geniusResult = await tryGenius(title, artist);
    if (geniusResult) return geniusResult;
  }

  return null;
}

/**
 * Try lyrics.ovh API
 */
async function tryLyricsOvh(title, artist) {
  if (!artist) return null;

  try {
    const response = await axios.get(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { timeout: 10000 }
    );

    if (response.data?.lyrics) {
      const lines = response.data.lyrics
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.trim());

      // Generate approximate timestamps (3 seconds per line)
      const lyrics = lines.map((text, i) => ({
        time: i * 3,
        text,
      }));

      return {
        lyrics,
        synced: false, // lyrics.ovh doesn't provide timestamps
        source: 'lyrics.ovh',
      };
    }
  } catch (err) {
    if (err.response?.status !== 404) {
      console.warn('lyrics.ovh error:', err.message);
    }
  }

  return null;
}

/**
 * Try Genius API
 */
async function tryGenius(title, artist) {
  try {
    // Search for the song
    const searchQuery = `${title} ${artist}`.trim();
    const searchResponse = await axios.get(
      `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${GENIUS_API_KEY}` },
        timeout: 10000,
      }
    );

    const hits = searchResponse.data?.response?.hits;
    if (!hits || hits.length === 0) return null;

    // Get the first result
    const songId = hits[0].result.id;
    const songUrl = hits[0].result.url;

    // Genius API doesn't directly return lyrics in the API
    // We'll return the URL and a simplified version
    const songResponse = await axios.get(
      `https://api.genius.com/songs/${songId}`,
      {
        headers: { Authorization: `Bearer ${GENIUS_API_KEY}` },
        timeout: 10000,
      }
    );

    const songData = songResponse.data?.response?.song;
    if (!songData) return null;

    // Since Genius doesn't provide plain text lyrics via API,
    // we return basic info. The frontend can use the lyrics path.
    // For a real implementation, you'd scrape the lyrics page.
    return {
      lyrics: [
        { time: 0, text: `♪ ${songData.full_title} ♪` },
        { time: 3, text: 'Lyrics available on Genius' },
        { time: 6, text: songUrl },
      ],
      synced: false,
      source: 'genius',
    };
  } catch (err) {
    console.warn('Genius API error:', err.message);
  }

  return null;
}
