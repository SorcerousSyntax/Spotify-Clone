const express = require('express');
const router = express.Router();
const axios = require('axios');
const { searchSongs, getSongById } = require('../services/jiosaavnService');
const { downloadSong } = require('../services/ytdlpService');
const cache = require('../services/cacheService');

router.get('/stream', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only http/https URLs are allowed' });
  }

  try {
    const upstream = await axios.get(parsed.toString(), {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        range: req.headers.range,
        'user-agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      validateStatus: () => true,
    });

    if (upstream.status >= 400) {
      return res.status(upstream.status).json({ error: 'Failed to stream upstream audio' });
    }

    const passHeaders = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'cache-control',
      'last-modified',
      'etag',
    ];

    passHeaders.forEach((header) => {
      const value = upstream.headers[header];
      if (value) {
        res.setHeader(header, value);
      }
    });

    res.status(upstream.status);
    upstream.data.pipe(res);
  } catch (error) {
    console.error('Audio proxy failed:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Audio proxy failed' });
    }
  }
});

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query is required' });
  }

  console.log(`Search request: "${query}"`);

  const cached = cache.getCachedSearch(query);
  if (cached) {
    return res.json({ results: cached, songs: cached, source: 'cache' });
  }

  const jiosaavnResults = await searchSongs(query);
  if (jiosaavnResults && jiosaavnResults.length > 0) {
    cache.setCachedSearch(query, jiosaavnResults);
    return res.json({ results: jiosaavnResults, songs: jiosaavnResults, source: 'jiosaavn' });
  }

  try {
    const ytResult = await downloadSong(query);
    const results = [ytResult];
    cache.setCachedSearch(query, results);
    return res.json({ results, songs: results, source: 'ytdlp' });
  } catch (err) {
    console.error('Both sources failed:', err.message);
    return res.status(404).json({
      error: 'Song not found',
      message: 'Could not find this song on JioSaavn or YouTube',
    });
  }
});

router.get('/song/:id', async (req, res) => {
  const { id } = req.params;

  const cached = cache.getCachedSong(id);
  if (cached) return res.json(cached);

  const song = await getSongById(id);
  if (!song) return res.status(404).json({ error: 'Song not found' });

  cache.setCachedSong(id, song);
  return res.json(song);
});

router.get('/trending', async (req, res) => {
  const trendingQueries = ['Arijit Singh latest', 'AP Dhillon', 'Diljit Dosanjh'];
  const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];

  const results = await searchSongs(randomQuery);
  if (!results) return res.json({ results: [], songs: [] });

  const sliced = results.slice(0, 8);
  return res.json({ results: sliced, songs: sliced });
});

// Compatibility endpoint used by frontend home/library widgets.
router.get('/songs/recent', async (req, res) => {
  return res.json({ songs: [] });
});

module.exports = router;
