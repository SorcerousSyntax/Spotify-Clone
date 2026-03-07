import { Router } from 'express';
import { fetchLyrics } from '../services/lyricsService.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

/**
 * GET /api/lyrics?title=...&artist=...
 * Fetch lyrics for a song, with caching
 */
router.get('/lyrics', cacheMiddleware(3600), async (req, res) => {
  const { title, artist } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Missing query parameter: title' });
  }

  try {
    const { supabase } = req;

    // Check Supabase cache first
    if (supabase) {
      const { data: cached } = await supabase
        .from('lyrics')
        .select('lyrics_data, is_synced, songs!inner(title)')
        .ilike('songs.title', `%${title}%`)
        .limit(1)
        .single();

      if (cached?.lyrics_data) {
        return res.json({
          lyrics: cached.lyrics_data,
          synced: cached.is_synced,
          source: 'cache',
        });
      }
    }

    // Fetch from external APIs
    const result = await fetchLyrics(title, artist || '');

    if (!result) {
      return res.json({ lyrics: [], synced: false, error: 'Lyrics not found' });
    }

    // Cache in Supabase
    if (supabase && result.lyrics.length > 0) {
      // Find the song in DB
      const { data: song } = await supabase
        .from('songs')
        .select('id')
        .ilike('title', `%${title}%`)
        .limit(1)
        .single();

      if (song) {
        await supabase
          .from('lyrics')
          .upsert({
            song_id: song.id,
            lyrics_data: result.lyrics,
            is_synced: result.synced,
          })
          .catch(() => {});
      }
    }

    res.json({
      lyrics: result.lyrics,
      synced: result.synced,
      source: result.source,
    });
  } catch (err) {
    console.error('Lyrics error:', err);
    res.status(500).json({ error: 'Failed to fetch lyrics' });
  }
});

export default router;
