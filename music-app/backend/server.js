import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Alias: /api/search → /api/songs/search (frontend calls /api/search)
app.get('/api/search', (req, res, next) => {
  req.url = '/search';
  songsRouter.handle(req, res, next);
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
