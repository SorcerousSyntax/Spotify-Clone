import axios from 'axios';

const TELEGRAM_SERVICE_URL = process.env.TELEGRAM_SERVICE_URL || 'http://localhost:8001';

/**
 * Fetch a song from the Telegram microservice
 * @param {string} query - Song name to search for
 * @returns {Object|null} - { audio, title, artist, album_art, duration, source_bot } OR { choices, source_bot }
 */
export async function fetchFromTelegram(query) {
  try {
    console.log(`📡 Calling Telegram microservice for: "${query}"`);

    const response = await axios.post(
      `${TELEGRAM_SERVICE_URL}/fetch`,
      { query },
      {
        timeout: 120000, // 2 minutes overall timeout (bots can be slow)
        maxContentLength: 100 * 1024 * 1024, // 100MB max
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data && response.data.audio) {
      console.log(`✓ Telegram returned: "${response.data.title}" via ${response.data.source_bot}`);
      return response.data;
    }

    if (response.data && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
      console.log(`✓ Telegram returned ${response.data.choices.length} options via ${response.data.source_bot}`);
      return response.data;
    }

    console.log('✗ Telegram returned no audio');
    return null;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('✗ Telegram microservice not running on', TELEGRAM_SERVICE_URL);
    } else if (err.code === 'ETIMEDOUT') {
      console.error('✗ Telegram microservice timed out');
    } else {
      console.error('✗ Telegram fetch error:', err.message);
    }
    return null;
  }
}

/**
 * Check if the Telegram service is available
 * @returns {boolean}
 */
export async function isTelegramServiceAvailable() {
  try {
    const response = await axios.get(`${TELEGRAM_SERVICE_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}
