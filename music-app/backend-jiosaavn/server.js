require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const songsRouter = require('./routes/songs');

const app = express();
const PORT = process.env.PORT || 3001;
const MUSIC_DIR = process.env.MUSIC_DIR || 'C:/music';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (!fs.existsSync(MUSIC_DIR)) {
  fs.mkdirSync(MUSIC_DIR, { recursive: true });
}

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use('/songs', express.static(MUSIC_DIR));
app.use('/api', songsRouter);

// Art-proxy — proxies album art images server-side so the frontend can do
// cross-origin colour extraction without canvas CORS taint errors.
app.get('/api/art-proxy', (req, res) => {
  const raw = req.query.url;
  if (!raw) return res.status(400).json({ error: 'url param required' });

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return res.status(400).json({ error: 'invalid url' });
  }

  // Only allow http/https image fetches (no SSRF via file:// etc.)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'unsupported protocol' });
  }

  const lib = parsed.protocol === 'https:' ? https : http;
  const request = lib.get(raw, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (upstream) => {
    const ct = upstream.headers['content-type'] || 'image/jpeg';
    if (!ct.startsWith('image/')) {
      upstream.resume();
      return res.status(400).json({ error: 'not an image' });
    }
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    upstream.pipe(res);
  });
  request.on('error', () => res.status(502).json({ error: 'upstream error' }));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Raabta backend running' });
});

app.listen(PORT, () => {
  console.log(`Raabta backend running on http://localhost:${PORT}`);
  console.log(`Music directory: ${MUSIC_DIR}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
