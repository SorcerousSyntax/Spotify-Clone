import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import songsRouter from './routes/songs.js';
import lyricsRouter from './routes/lyrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✓ Supabase client initialized');
} else {
  console.warn('⚠ Supabase credentials not set — running without database');
}

// Middleware
// Allow all origins — the app is a public music player and audio streaming
// must never be blocked by CORS, especially on iOS Safari which is very strict.
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Pass supabase to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Routes
app.use('/api/songs', songsRouter);
app.use('/api', lyricsRouter);

// Audio stream proxy used by the frontend (/api/stream?url=...)
// Keeps a single backend hop for iOS PWA and follows upstream redirects
// server-side while preserving range semantics.
app.get('/api/stream', async (req, res) => {
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
      maxRedirects: 5,
      headers: {
        ...(req.headers.range ? { Range: req.headers.range } : {}),
        'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (compatible; RaabtaAudioProxy/1.0)',
        accept: 'audio/mpeg, audio/*, */*',
      },
      validateStatus: () => true,
    });

    if (upstream.status >= 400) {
      return res.status(upstream.status).json({ error: 'Upstream audio fetch failed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    const forward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control', 'last-modified', 'etag'];
    forward.forEach((h) => {
      const v = upstream.headers[h];
      if (v) res.setHeader(h, v);
    });

    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'audio/mpeg');
    if (!res.getHeader('Accept-Ranges')) res.setHeader('Accept-Ranges', 'bytes');

    res.status(upstream.status);
    upstream.data.pipe(res);
  } catch (err) {
    console.error('Audio proxy error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Audio proxy failed' });
    }
  }
});

// Alias: /api/search → /api/songs/search (frontend calls /api/search)
app.get('/api/search', (req, res, next) => {
  req.url = '/search';
  songsRouter.handle(req, res, next);
});

// Art-proxy — allows the frontend to fetch album-art images through the server
// (many CDNs don't send CORS headers, so the browser can't read pixels for colour extraction)
// Security: only forward HTTPS requests, only return image/* content.
app.get('/api/art-proxy', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).end();

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).end(); }

  // Only allow HTTPS to public internet (block http, file, data, etc.)
  if (parsed.protocol !== 'https:') return res.status(403).end();

  // Block requests to private/loopback IP ranges (basic SSRF protection)
  const hostname = parsed.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.16.') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) return res.status(403).end();

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RaabtaArtProxy/1.0)' },
      redirect: 'follow',
    });
    if (!upstream.ok) return res.status(upstream.status).end();
    const ct = upstream.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return res.status(415).end();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).end();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: !!supabase,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`\n🎵 Music App Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
