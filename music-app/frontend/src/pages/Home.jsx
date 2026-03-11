import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { CompactCard } from '../components/MusicCards';
import PlaylistCover from '../components/PlaylistCover';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';
import useColorExtract from '../hooks/useColorExtract';
import { OFFLINE_AUDIO_CACHE_NAME, getSongAudioUrlCandidates } from '../lib/offlineAudio';

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url);

const Header = () => <div style={{ height: 8 }} />;
const getMoodConfig = (hour, userName = 'there') => {
  if (hour >= 5 && hour < 11) {
    return {
      key: 'morning',
      icon: '🌅',
      message: `Good morning, ${userName}. Start slow.`,
      query: 'peaceful morning hindi',
      gradient: 'linear-gradient(135deg, #0a1628, #0d2137)',
      glow: 'rgba(74, 146, 240, 0.35)',
      glowColor: '#4a92f0',
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      key: 'afternoon',
      icon: '☀️',
      message: `Good afternoon, ${userName}. Keep the energy up.`,
      query: 'upbeat punjabi',
      gradient: 'linear-gradient(135deg, #0a1a0a, #0d2d0d)',
      glow: 'rgba(64, 201, 112, 0.35)',
      glowColor: '#40c970',
    };
  }
  if (hour >= 15 && hour < 19) {
    return {
      key: 'evening',
      icon: '🌆',
      message: `Good evening, ${userName}. Wind it down.`,
      query: 'romantic hindi evening',
      gradient: 'linear-gradient(135deg, #1a0a0a, #2d1000)',
      glow: 'rgba(224, 122, 58, 0.35)',
      glowColor: '#e07a3a',
    };
  }
  if (hour >= 19 && hour < 23) {
    return {
      key: 'night',
      icon: '🌙',
      message: `It's night, ${userName}. Here's what fits.`,
      query: 'arijit singh night',
      gradient: 'linear-gradient(135deg, #080808, #0d0d1a)',
      glow: 'rgba(128, 126, 255, 0.35)',
      glowColor: '#807eff',
    };
  }
  return {
    key: 'late night',
    icon: '✨',
    message: `Late night, ${userName}. Just you and the music.`,
    query: 'sad lofi hindi',
    gradient: 'linear-gradient(135deg, #000000, #0a0010)',
    glow: 'rgba(190, 86, 255, 0.35)',
    glowColor: '#be56ff',
  };
};

const Home = () => {
  const navigate = useNavigate();
  const [recentFromApi, setRecentFromApi] = useState([]);
  const [suggestedSong, setSuggestedSong] = useState(null);
  const [bannerName, setBannerName] = useState('there');

  useEffect(() => {
    let mounted = true;

    const loadBannerName = async () => {
      if (!supabase) return;

      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !mounted) return;

      const candidate =
        user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')?.[0]
        || 'there';

      // Use first name only — strip numbers/dots/underscores
      const firstName = String(candidate).trim().split(/[\s._@+\d]+/).filter(Boolean)[0] || 'there';
      const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      setBannerName(capitalized);
    };

    loadBannerName().catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const mood = useMemo(() => getMoodConfig(new Date().getHours(), bannerName), [bannerName]);

  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const playlists = usePlayerStore((s) => s.playlists);
  const songsById = usePlayerStore((s) => s.songsById);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { dominantColor } = useColorExtract(currentSong?.album_art_url);
  const [dr, dg, db] = dominantColor;
  const accentA = (a) => `rgba(${dr},${dg},${db},${a})`;

  // Offline songs detection
  const [offlineSongIds, setOfflineSongIds] = useState([]);
  const savedSongIds = useMemo(() => {
    const ids = new Set(likedSongIds);
    playlists.forEach((p) => p.songIds.forEach((id) => ids.add(id)));
    return ids;
  }, [likedSongIds, playlists]);
  const allSongsForOffline = useMemo(
    () => [...savedSongIds].map((id) => songsById[id]).filter(Boolean),
    [savedSongIds, songsById]
  );

  useEffect(() => {
    let cancelled = false;
    if (!window.caches || allSongsForOffline.length === 0) { setOfflineSongIds([]); return; }
    caches.open(OFFLINE_AUDIO_CACHE_NAME).then((cache) =>
      Promise.all(allSongsForOffline.map(async (song) => {
        for (const url of getSongAudioUrlCandidates(song)) {
          if (await cache.match(url)) return song.id;
        }
        return null;
      }))
    ).then((ids) => {
      if (!cancelled) setOfflineSongIds(ids.filter(Boolean));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [allSongsForOffline]);

  useEffect(() => {
    let mounted = true;

    const loadRecent = async () => {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from('play_history')
        .select('*')
        .order('played_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase play_history Home fetch error:', error);
      }

      if (mounted && Array.isArray(data)) {
        setRecentFromApi(
          data.map((row) => ({
            id: row.song_id,
            title: row.title,
            artist: row.artist,
            album_art_url: row.album_art,
            url: row.url,
            stream_url: row.url,
            r2_url: row.url,
          }))
        );
      }

    };

    loadRecent().catch((err) => {
      console.error('Supabase play_history Home fetch exception:', err);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadMoodSuggestion = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(mood.query)}`);
        const data = await res.json();
        const list = Array.isArray(data?.results) && data.results.length > 0
          ? data.results
          : Array.isArray(data?.songs)
            ? data.songs
            : [];

        if (mounted && list.length > 0) {
          setSuggestedSong(list[0]);
        }
      } catch (err) {
        console.warn('Mood suggestion fetch failed:', err?.message || err);
      }
    };

    loadMoodSuggestion();
    return () => {
      mounted = false;
    };
  }, [mood.query]);

  const recentSongs = useMemo(() => {
    const merged = [...recentFromApi, ...recentlyPlayed];
    const seen = new Set();
    const result = [];
    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 5) break;
    }
    return result;
  }, [recentFromApi, recentlyPlayed]);

  const playSong = (song, index, list) => {
    if (!isPlayableSong(song)) {
      navigate('/search');
      return;
    }
    setCurrentSong(song);
    setQueue(list, index);
  };

  const formatDuration = (s) => {
    if (!s) return '';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'New Artists', 'Hot Tracks', 'Editor\'s Picks'];

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 30 }}>
      {/* Ambient violet orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <motion.div
          style={{ position: 'absolute', top: '-5%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }}
          animate={{ x: [0, 40, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'absolute', top: '25%', right: '-10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(55px)' }}
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          style={{ position: 'absolute', bottom: '8%', left: '15%', width: 350, height: 350, borderRadius: '50%', background: `radial-gradient(circle, ${accentA(0.18)} 0%, transparent 65%)`, filter: 'blur(50px)' }}
          animate={{ x: [0, 20, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
      </div>
      <Header />

      {/* ── Greeting Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ padding: '8px 20px 0', maxWidth: 680, margin: '0 auto' }}
      >
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13, fontWeight: 500,
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 4, letterSpacing: '0.01em',
        }}>
          {mood.icon} {mood.key.charAt(0).toUpperCase() + mood.key.slice(1)} vibes
        </p>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(30px, 7vw, 44px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: 20,
        }}>
          Hello, <span style={{
            background: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>{bannerName}</span>
        </h1>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
          {filters.map((f) => (
            <motion.button
              key={f}
              onClick={() => setActiveFilter(f)}
              whileTap={{ scale: 0.92 }}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 500,
                letterSpacing: '0.01em',
                background: activeFilter === f
                  ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                  : 'rgba(255,255,255,0.05)',
                color: activeFilter === f ? '#fff' : 'rgba(255,255,255,0.45)',
                border: activeFilter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                boxShadow: activeFilter === f ? '0 4px 16px rgba(139,92,246,0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── For You Hero Card ── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          margin: '20px auto',
          width: 'min(680px, calc(100vw - 24px))',
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(109,40,217,0.55) 0%, rgba(76,29,149,0.45) 50%, rgba(11,0,21,0.7) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(167,139,250,0.2)',
          overflow: 'hidden',
          padding: '24px 22px',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 16,
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
        }}
      >
        {/* Background glow */}
        <motion.div
          style={{ position: 'absolute', top: 0, right: 0, width: 280, height: 280, background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.8)', marginBottom: 8 }}>
            For You Today
          </p>
          <motion.p
            key={suggestedSong?.title || 'default'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800,
              color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15,
              marginBottom: 6, maxWidth: 260,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}
          >
            {suggestedSong ? decodeSongTitle(suggestedSong.title || suggestedSong.name || '') : 'Feel the Beat'}
          </motion.p>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>
            {suggestedSong ? (suggestedSong.artist || '').replace(/&amp;/g, '&') : 'Explore trending tracks curated for you.'}
          </p>
          <motion.button
            onClick={() => {
              if (currentSong) { navigate('/now-playing'); return; }
              if (!suggestedSong) return;
              const list = [suggestedSong, ...recentSongs.filter((s) => s.id !== suggestedSong.id)];
              playSong(suggestedSong, 0, list);
            }}
            whileHover={{ scale: 1.04, boxShadow: '0 8px 28px rgba(139,92,246,0.6)' }}
            whileTap={{ scale: 0.96 }}
            style={{
              borderRadius: 999,
              border: 'none',
              background: '#fff',
              color: '#6d28d9',
              padding: '11px 22px',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 700,
              letterSpacing: '0.01em',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {currentSong && isPlaying ? (
              <>
                <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                  {[0,1,2].map((i) => (
                    <motion.span key={i} style={{ display: 'block', width: 3, background: '#6d28d9', borderRadius: 2 }}
                      animate={{ height: ['4px','12px','4px'] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i*0.15, ease: 'easeInOut' }} />
                  ))}
                </span>
                Now Playing
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Start Listening
              </>
            )}
          </motion.button>
        </div>

        {/* Right album art */}
        {(suggestedSong?.album_art_url || currentSong?.album_art_url) && (
          <motion.div
            style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}
            initial={{ opacity: 0, x: 18, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 24 }}
          >
            {/* Spinning halo ring when playing */}
            {isPlaying && (
              <motion.div
                style={{ position: 'absolute', inset: -6, borderRadius: 18, border: '2px solid rgba(196,181,253,0.45)', zIndex: 2 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              />
            )}
            {/* Glow bloom */}
            <motion.div
              style={{ position: 'absolute', inset: -14, borderRadius: 22, filter: 'blur(22px)', background: 'rgba(139,92,246,0.5)', zIndex: 0 }}
              animate={{ opacity: isPlaying ? [0.5, 1, 0.5] : 0.35 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              key={suggestedSong?.id || currentSong?.id}
              src={currentSong?.album_art_url || suggestedSong?.album_art_url}
              alt=""
              style={{ width: 110, height: 110, borderRadius: 14, objectFit: 'cover', position: 'relative', zIndex: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}
              animate={isPlaying ? { y: [0, -5, 0] } : { y: 0 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </motion.section>

      {/* ── Popular / Recently Played ── */}
      <section style={{ width: 'min(680px, calc(100vw - 24px))', margin: '0 auto 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}
          >
            {recentSongs.length > 0 ? 'Recently Played' : 'Popular'}
          </motion.h2>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/search')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500,
              color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            Show all
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </motion.button>
        </div>

        {recentSongs.length > 0 ? (
          <div>
            {recentSongs.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 320, damping: 28 }}
                onClick={() => playSong(song, i, recentSongs)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 12px', borderRadius: 14,
                  cursor: 'pointer',
                  background: currentSong?.id === song.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                  border: currentSong?.id === song.id ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                  transition: 'background 0.2s, border 0.2s',
                  marginBottom: 4,
                }}
                whileHover={{ background: 'rgba(255,255,255,0.04)', scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Album art */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <motion.img
                    src={song.album_art_url || '/placeholder-album.svg'}
                    alt=""
                    style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', display: 'block' }}
                    animate={currentSong?.id === song.id && isPlaying ? { boxShadow: [`0 0 0 2px rgba(139,92,246,0.4)`, `0 0 0 4px rgba(139,92,246,0.2)`, `0 0 0 2px rgba(139,92,246,0.4)`] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Playing indicator overlay */}
                  {currentSong?.id === song.id && (
                    <motion.div
                      style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(109,40,217,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {isPlaying ? (
                        <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 14 }}>
                          {[0,1,2].map((j) => (
                            <motion.span key={j} style={{ display: 'block', width: 3, background: '#fff', borderRadius: 2 }}
                              animate={{ height: ['3px','10px','3px'] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: j*0.12, ease: 'easeInOut' }} />
                          ))}
                        </span>
                      ) : (
                        <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Title / artist */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600,
                    color: currentSong?.id === song.id ? '#c4b5fd' : '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, lineHeight: 1.3,
                  }}>
                    {decodeSongTitle(song.title || song.name || '')}
                  </p>
                  <p style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 400,
                    color: 'rgba(255,255,255,0.38)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0',
                  }}>
                    {(song.artist || song.primaryArtists || '').replace(/&amp;/g, '&')}
                    {song.album ? ` · ${song.album}` : ''}
                  </p>
                </div>

                {/* Duration */}
                {song.duration ? (
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                    {formatDuration(song.duration)}
                  </span>
                ) : null}

                {/* Play button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: currentSong?.id === song.id
                      ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                      : 'rgba(255,255,255,0.08)',
                    border: currentSong?.id === song.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: currentSong?.id === song.id ? '0 4px 16px rgba(139,92,246,0.45)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#fff' }}>
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style={{ color: currentSong?.id === song.id ? '#fff' : 'rgba(255,255,255,0.6)', marginLeft: 2 }}>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: '32px 16px', borderRadius: 20,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: 36 }}>🎵</div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
              No recent tracks yet
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/search')}
              style={{
                borderRadius: 999, border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff', padding: '10px 22px',
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
              }}
            >
              Browse Songs
            </motion.button>
          </motion.div>
        )}
      </section>

      {/* ── Playlists ── */}
      {playlists.length > 0 && (
        <section style={{ width: 'min(680px, calc(100vw - 24px))', margin: '0 auto 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}
            >
              Your Playlists
            </motion.h2>
          </div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
            {playlists.map((playlist, idx) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 300, damping: 26 }}
                style={{ width: 120, flexShrink: 0 }}
              >
                <motion.button
                  onClick={() => navigate('/library', { state: { openPlaylistId: playlist.id } })}
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  style={{ width: 120, height: 120, borderRadius: 14, background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <PlaylistCover playlist={playlist} songsById={songsById} size={120} />
                </motion.button>
                <p style={{
                  marginTop: 8, fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
                }}>
                  {playlist.name}
                </p>
                <p style={{ margin: '2px 0 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {playlist.songIds.length} songs
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
