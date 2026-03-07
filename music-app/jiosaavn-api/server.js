const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const UPSTREAM_BASE = process.env.UPSTREAM_BASE || 'https://jiosavan-api2.vercel.app';

app.use(cors());

const upstream = axios.create({
  baseURL: UPSTREAM_BASE,
  timeout: 15000,
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'jiosaavn-api-proxy',
    upstream: UPSTREAM_BASE,
  });
});

app.get('/api/search/songs', async (req, res) => {
  const query = String(req.query.query || '').trim();
  const limit = Number(req.query.limit || 10);

  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    const response = await upstream.get('/api/search/songs', {
      params: { query, limit },
    });

    // Keep shape expected by backend-jiosaavn: { data: { results: [...] } }
    const results = Array.isArray(response.data?.data?.results)
      ? response.data.data.results
      : [];

    return res.json({ data: { results } });
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({
      error: 'upstream_search_failed',
      message: error.message,
    });
  }
});

app.get('/api/songs/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  try {
    const response = await upstream.get(`/api/songs/${encodeURIComponent(id)}`);
    const songs = Array.isArray(response.data?.data) ? response.data.data : [];

    // Keep shape expected by backend-jiosaavn: { data: [song] }
    return res.json({ data: songs });
  } catch (error) {
    const status = error.response?.status || 502;
    return res.status(status).json({
      error: 'upstream_song_failed',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`jiosaavn-api running on http://localhost:${PORT}`);
  console.log(`proxying upstream: ${UPSTREAM_BASE}`);
});
