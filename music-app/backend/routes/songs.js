import { Router } from 'express';
import axios from 'axios';
import { fetchFromTelegram } from '../services/telegramService.js';
import { uploadSong, getSongStream } from '../services/r2Service.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = Router();

async function fetchCoverArtUrl(title, artist) {
  const query = `${title || ''} ${artist || ''}`.trim();
  if (!query) return '';

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        entity: 'song',
        limit: 1,
      },
      timeout: 8000,
    });

    const artwork = response.data?.results?.[0]?.artworkUrl100;
    if (!artwork) return '';

    // Use higher resolution image when available.
    return artwork.replace(/100x100bb/g, '600x600bb');
  } catch (err) {
    console.warn('Cover art lookup failed:', err?.message || err);
    return '';
  }
}

/**
 * GET /api/songs/recent
 * Returns last 20 played songs
 */
router.get('/recent', cacheMiddleware(60), async (req, res) => {
  try {
    const { supabase } = req;
    if (!supabase) {
      return res.json({ songs: [] });
    }

    const { data, error } = await supabase
      .from('play_history')
      .select(`
        played_at,
        songs (*)
      `)
      .order('played_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const songs = data?.map((entry) => ({
      ...entry.songs,
      played_at: entry.played_at,
      stream_url: `/api/songs/${entry.songs.id}/stream`,
    })) || [];

    res.json({ songs });
  } catch (err) {
    console.error('Error fetching recent songs:', err);
    res.json({ songs: [] });
  }
});

/**
 * GET /api/songs/search?q=songname (also accessible as /api/search?q=)
 * 1. Check Supabase cache
 * 2. If not found, call Telegram microservice
 * 3. Upload to R2
 * 4. Save metadata to Supabase
 * 5. Return song URL + metadata
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  try {
    const { supabase } = req;

    // Step 1: Check Supabase cache
    if (supabase) {
      const { data: cached } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
        .limit(20);

      if (cached && cached.length > 0) {
        const songsWithArt = await Promise.all(cached.map(async (song) => {
          if (song.album_art_url) {
            return song;
          }

          const coverArtUrl = await fetchCoverArtUrl(song.title, song.artist);
          if (!coverArtUrl) {
            return song;
          }

          try {
            await supabase
              .from('songs')
              .update({ album_art_url: coverArtUrl })
              .eq('id', song.id);
          } catch {
            // Non-blocking: response still returns enriched URL even if DB update fails.
          }

          return {
            ...song,
            album_art_url: coverArtUrl,
          };
        }));

        return res.json({
          songs: songsWithArt.map((song) => ({
            ...song,
            stream_url: `/api/songs/${song.id}/stream`,
          })),
          source: 'cache',
        });
      }
    }

    // Step 2: Fetch from Telegram microservice
    console.log(`🔍 Searching Telegram for: "${query}"`);
    const telegramResult = await fetchFromTelegram(query);

    if (!telegramResult) {
      return res.json({ songs: [], error: 'Song not found' });
    }

    if (Array.isArray(telegramResult.choices) && telegramResult.choices.length > 0) {
      const choiceSongs = telegramResult.choices.slice(0, 10).map((choice, idx) => ({
        id: `choice-${Date.now()}-${idx}`,
        title: choice,
        artist: 'Telegram option',
        album: 'Tap to fetch this option',
        duration: 0,
        album_art_url: '',
        is_choice: true,
        choice_query: choice,
      }));

      return res.json({
        songs: choiceSongs,
        source: telegramResult.source_bot,
        isChoiceList: true,
      });
    }

    // Step 3: Upload audio to R2
    const filename = `${Date.now()}-${telegramResult.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
    let r2Url = '';
    const inlineAudioUrl = `data:audio/mpeg;base64,${telegramResult.audio}`;

    try {
      const audioBuffer = Buffer.from(telegramResult.audio, 'base64');
      r2Url = await uploadSong(audioBuffer, filename);
    } catch (uploadErr) {
      console.error('R2 upload error:', uploadErr.message);
      // Continue without R2 and fall back to inline audio URL
    }

    // Upload album art to R2 if available
    let albumArtUrl = telegramResult.album_art
      ? `data:image/jpeg;base64,${telegramResult.album_art}`
      : '';
    if (telegramResult.album_art) {
      try {
        const artBuffer = Buffer.from(telegramResult.album_art, 'base64');
        const artFilename = `art-${filename.replace('.mp3', '.jpg')}`;
        albumArtUrl = await uploadSong(artBuffer, artFilename);
      } catch {
        // Keep inline image as fallback
      }
    }

    if (!albumArtUrl) {
      albumArtUrl = await fetchCoverArtUrl(telegramResult.title, telegramResult.artist);
    }

    // Step 4: Save to Supabase
    let savedSong = {
      id: crypto.randomUUID(),
      title: telegramResult.title,
      artist: telegramResult.artist || 'Unknown Artist',
      album: telegramResult.album || '',
      duration: telegramResult.duration || 0,
      r2_url: r2Url || inlineAudioUrl,
      album_art_url: albumArtUrl,
      play_count: 0,
    };

    if (supabase && r2Url) {
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: savedSong.title,
          artist: savedSong.artist,
          album: savedSong.album,
          duration: savedSong.duration,
          r2_url: r2Url,
          album_art_url: albumArtUrl,
        })
        .select()
        .single();

      if (data) savedSong = data;
      if (error) console.error('Supabase insert error:', error.message);
    }

    if (r2Url && savedSong.id) {
      savedSong.stream_url = `/api/songs/${savedSong.id}/stream`;
    }

    console.log(`✓ Song found: "${savedSong.title}" by ${savedSong.artist} (via ${telegramResult.source_bot})`);

    res.json({ songs: [savedSong], source: telegramResult.source_bot });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

/**
 * GET /api/songs/:id/stream
 * Stream audio from R2 with range request support
 */
router.get('/:id/stream', async (req, res) => {
  try {
    const { supabase } = req;
    const { id } = req.params;

    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Get song URL from Supabase
    const { data: song, error } = await supabase
      .from('songs')
      .select('r2_url, title')
      .eq('id', id)
      .single();

    if (error || !song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Update stats, but never block audio streaming if analytics fails.
    try {
      await supabase.rpc('increment_play_count', { song_id: id });
    } catch (statsErr) {
      console.warn('Play count update failed:', statsErr?.message || statsErr);
    }

    try {
      await supabase
        .from('play_history')
        .insert({ song_id: id });
    } catch (historyErr) {
      console.warn('Play history insert failed:', historyErr?.message || historyErr);
    }

    // Stream from R2
    const stream = await getSongStream(song.r2_url, req.headers.range);

    if (stream.statusCode === 206) {
      res.writeHead(206, {
        'Content-Type': 'audio/mpeg',
        'Content-Range': stream.contentRange,
        'Accept-Ranges': 'bytes',
        'Content-Length': stream.contentLength,
      });
    } else {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stream.contentLength,
        'Accept-Ranges': 'bytes',
      });
    }

    stream.body.pipe(res);
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

/**
 * POST /api/songs/:id/like
 * Toggle like for a song
 */
router.post('/:id/like', async (req, res) => {
  try {
    const { supabase } = req;
    const { id } = req.params;

    if (!supabase) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('liked_songs')
      .select('id')
      .eq('song_id', id)
      .single();

    if (existing) {
      // Unlike
      await supabase.from('liked_songs').delete().eq('song_id', id);
      res.json({ liked: false });
    } else {
      // Like
      await supabase.from('liked_songs').insert({ song_id: id });
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
