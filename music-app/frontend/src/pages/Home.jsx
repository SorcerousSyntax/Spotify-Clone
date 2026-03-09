import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { CompactCard } from '../components/MusicCards';
import PlaylistCover from '../components/PlaylistCover';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';
import useColorExtract from '../hooks/useColorExtract';

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url);

const Header = () => <div style={{ height: 18 }} />;

const SectionTitle = ({ text }) => (
  <motion.p
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: '-20px' }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.45)',
      marginBottom: 16,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      paddingBottom: 8,
      paddingLeft: 10,
      borderLeft: '2px solid rgba(255,255,255,0.18)',
    }}
  >
    {text}
  </motion.p>
);

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

      setBannerName(String(candidate).trim() || 'there');
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
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const { dominantColor } = useColorExtract(currentSong?.album_art_url);
  const [dr, dg, db] = dominantColor;
  const accentA = (a) => `rgba(${dr},${dg},${db},${a})`;

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
    return merged.filter((song) => {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) {
        return false;
      }
      seen.add(song.id);
      return true;
    });
  }, [recentFromApi, recentlyPlayed]);

  const playSong = (song, index, list) => {
    if (!isPlayableSong(song)) {
      navigate('/search');
      return;
    }
    setCurrentSong(song);
    setQueue(list, index);
  };

  return (
    <div style={{ position: 'relative', zIndex: 2, paddingBottom: 30 }}>
      {/* Ambient floating color orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          style={{ position: 'absolute', top: '-8%', left: '-10%', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${accentA(0.14)} 0%, transparent 70%)`, filter: 'blur(50px)' }}
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ position: 'absolute', top: '28%', right: '-12%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${mood.glow} 0%, transparent 70%)`, filter: 'blur(56px)' }}
          animate={{ x: [0, -32, 0], y: [0, 24, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <motion.div
          style={{ position: 'absolute', bottom: '10%', left: '20%', width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${accentA(0.1)} 0%, transparent 70%)`, filter: 'blur(42px)' }}
          animate={{ x: [0, 16, 0], y: [0, -14, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        />
      </div>
      <Header />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          margin: '0 auto 40px',
          width: 'min(980px, calc(100vw - 24px))',
          borderRadius: 12,
          background: mood.gradient,
          border: `1px solid ${mood.glow}`,
          borderLeft: `3px solid ${mood.glowColor}`,
          overflow: 'hidden',
          padding: '28px 32px',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 16,
          alignItems: 'center',
          boxShadow: `0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 280,
            height: 280,
            background: `radial-gradient(circle, ${mood.glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <p style={{
            margin: 0,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: mood.glowColor,
            marginBottom: 8,
          }}>
            {mood.icon} FOR YOU TODAY
          </p>

          <p style={{
            margin: '8px 0 10px',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(28px, 4vw, 48px)',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            color: '#fff',
            marginBottom: 20,
          }}>
            {mood.message}
          </p>

          <button
            onClick={() => {
              if (!suggestedSong) return;
              const list = [suggestedSong, ...recentSongs.filter((song) => song.id !== suggestedSong.id)];
              playSong(suggestedSong, 0, list);
            }}
            style={{
              borderRadius: 4,
              border: `1px solid ${mood.glow}`,
              background: 'transparent',
              color: mood.glowColor,
              padding: '10px 24px',
              cursor: suggestedSong ? 'pointer' : 'default',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textAlign: 'left',
              maxWidth: 360,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={suggestedSong ? decodeSongTitle(suggestedSong.title || suggestedSong.name || '') : 'Finding recommendation...'}
          >
            NOW PLAYING {suggestedSong ? decodeSongTitle(suggestedSong.title || suggestedSong.name || '') : '...'}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: 800 }}
        >
          <div style={{ position: 'relative' }}>
            <motion.div
              style={{
                position: 'absolute',
                inset: -14,
                borderRadius: 18,
                background: mood.glow,
                filter: 'blur(22px)',
                zIndex: 0,
              }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={suggestedSong?.album_art_url || '/placeholder-album.svg'}
              alt={decodeSongTitle(suggestedSong?.title || suggestedSong?.name || 'Suggested Song')}
              style={{
                position: 'relative',
                zIndex: 1,
                width: 132,
                height: 132,
                borderRadius: 10,
                border: `1px solid ${mood.glow}`,
                objectFit: 'cover',
                boxShadow: `0 16px 40px rgba(0,0,0,0.55)`,
              }}
              whileHover={{ scale: 1.07, rotateY: 6, rotateX: -3 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.section>

      <section style={{ width: 'min(980px, calc(100vw - 24px))', margin: '0 auto' }}>
        <SectionTitle text="Recently Played" />
        {recentSongs.length > 0 ? (
          <motion.div
            style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}
            className="hide-scrollbar"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden"
            animate="show"
          >
            {recentSongs.map((song, i) => (
              <motion.div
                key={song.id}
                variants={{ hidden: { opacity: 0, y: 14, scale: 0.93 }, show: { opacity: 1, y: 0, scale: 1 } }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <CompactCard
                  song={song}
                  index={i}
                  size={98}
                  onClick={(s, idx) => playSong(s, idx, recentSongs)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '12px 4px' }}>
            No recent tracks yet. Play something from Search.
          </p>
        )}
      </section>

      <section style={{ width: 'min(980px, calc(100vw - 24px))', margin: '20px auto 0' }}>
        <SectionTitle text="Your Playlists" />
        {playlists.length > 0 ? (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
            {playlists.map((playlist) => (
              <div key={playlist.id} style={{ width: 120, flexShrink: 0 }}>
                <motion.button
                  onClick={() => navigate('/library', { state: { openPlaylistId: playlist.id } })}
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={`Open ${playlist.name}`}
                >
                  <PlaylistCover playlist={playlist} songsById={songsById} size={120} />
                </motion.button>
                <p
                  style={{
                    marginTop: 8,
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: 14,
                    letterSpacing: '0.05em',
                    color: '#fff',
                    lineHeight: 1.15,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={playlist.name}
                >
                  {playlist.name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '12px 4px' }}>
            No playlists yet. Create one in Library.
          </p>
        )}
      </section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        style={{
          width: 'min(980px, calc(100vw - 24px))',
          margin: '20px auto 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Made with love for you</span>
        <motion.span
          style={{ color: '#ff6464', fontSize: 13, display: 'inline-block' }}
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >♥</motion.span>
      </motion.div>
    </div>
  );
};

export default Home;
