import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { CompactCard, SongRow } from '../components/MusicCards';
import SkeletonLoader from '../components/SkeletonLoader';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url);

const Header = () => <div style={{ height: 18 }} />;

const SectionTitle = ({ text }) => (
  <p
    style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.55)',
      marginBottom: 10,
    }}
  >
    {text}
  </p>
);

const getMoodConfig = (hour) => {
  if (hour >= 5 && hour < 11) {
    return {
      key: 'morning',
      icon: '🌅',
      message: 'Good morning, Harsh. Start slow.',
      query: 'peaceful morning hindi',
      gradient: 'linear-gradient(135deg, #0a1628, #0d2137)',
      glow: 'rgba(74, 146, 240, 0.35)',
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      key: 'afternoon',
      icon: '☀️',
      message: 'Good afternoon, Harsh. Keep the energy up.',
      query: 'upbeat punjabi',
      gradient: 'linear-gradient(135deg, #0a1a0a, #0d2d0d)',
      glow: 'rgba(64, 201, 112, 0.35)',
    };
  }
  if (hour >= 15 && hour < 19) {
    return {
      key: 'evening',
      icon: '🌆',
      message: 'Good evening, Harsh. Wind it down.',
      query: 'romantic hindi evening',
      gradient: 'linear-gradient(135deg, #1a0a0a, #2d1000)',
      glow: 'rgba(224, 122, 58, 0.35)',
    };
  }
  if (hour >= 19 && hour < 23) {
    return {
      key: 'night',
      icon: '🌙',
      message: "It's night, Harsh. Here's what fits.",
      query: 'arijit singh night',
      gradient: 'linear-gradient(135deg, #080808, #0d0d1a)',
      glow: 'rgba(128, 126, 255, 0.35)',
    };
  }
  return {
    key: 'late night',
    icon: '✨',
    message: 'Late night, Harsh. Just you and the music.',
    query: 'sad lofi hindi',
    gradient: 'linear-gradient(135deg, #000000, #0a0010)',
    glow: 'rgba(190, 86, 255, 0.35)',
  };
};

const HOME_PLAYLISTS = [
  { id: 'liked', name: 'Liked Songs', icon: '💚', gradient: 'linear-gradient(135deg, #0f3f1f, #1db954)' },
  { id: 'punjabi', name: 'Punjabi Hits', icon: '🎵', gradient: 'linear-gradient(135deg, #1b1230, #4a2f8a)' },
  { id: 'late-night', name: 'Late Night', icon: '🌙', gradient: 'linear-gradient(135deg, #0b1f36, #1f4f7a)' },
  { id: 'chill', name: 'Chill Vibes', icon: '✨', gradient: 'linear-gradient(135deg, #10261f, #2d6a4f)' },
];

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentFromApi, setRecentFromApi] = useState([]);
  const [suggestedSong, setSuggestedSong] = useState(null);

  const mood = useMemo(() => getMoodConfig(new Date().getHours()), []);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const playlists = usePlayerStore((s) => s.playlists);
  const songsById = usePlayerStore((s) => s.songsById);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  useEffect(() => {
    let mounted = true;

    const loadRecent = async () => {
      if (!supabase) {
        setLoading(false);
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

      if (mounted) {
        setLoading(false);
      }
    };

    loadRecent().catch((err) => {
      console.error('Supabase play_history Home fetch exception:', err);
      if (mounted) {
        setLoading(false);
      }
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

  const savedSongIds = useMemo(() => {
    const ids = new Set(likedSongIds);
    playlists.forEach((playlist) => {
      playlist.songIds.forEach((songId) => ids.add(songId));
    });
    return ids;
  }, [likedSongIds, playlists]);

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

  const libraryFiles = useMemo(
    () => [...savedSongIds]
      .map((id) => songsById[id])
      .filter((song) => song && isPlayableSong(song))
      .slice(0, 12),
    [savedSongIds, songsById]
  );

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
      <Header />

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          margin: '0 auto 22px',
          width: 'min(980px, calc(100vw - 24px))',
          height: 180,
          borderRadius: 20,
          background: mood.gradient,
          border: '1px solid rgba(0,255,65,0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
          padding: 18,
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 12,
          alignItems: 'center',
        }}
      >
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
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(0,255,65,0.7)',
          }}>
            {mood.icon} FOR YOU TODAY
          </p>

          <p style={{
            margin: '8px 0 10px',
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 32,
            letterSpacing: '0.04em',
            lineHeight: 1,
            color: '#fff',
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
              borderRadius: 999,
              border: '1px solid rgba(0,255,65,0.3)',
              background: 'rgba(0,255,65,0.1)',
              color: '#c8ffd9',
              padding: '9px 12px',
              cursor: suggestedSong ? 'pointer' : 'default',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
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
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <motion.img
            src={suggestedSong?.album_art_url || '/placeholder-album.svg'}
            alt={decodeSongTitle(suggestedSong?.title || suggestedSong?.name || 'Suggested Song')}
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              objectFit: 'cover',
              boxShadow: `0 0 28px ${mood.glow}`,
            }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.section>

      <section style={{ width: 'min(980px, calc(100vw - 24px))', margin: '0 auto' }}>
        <SectionTitle text="Recently Played" />
        {loading ? (
          <SkeletonLoader type="card" count={4} />
        ) : recentSongs.length > 0 ? (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
            {recentSongs.map((song, i) => (
              <CompactCard
                key={song.id}
                song={song}
                index={i}
                size={128}
                onClick={(s, idx) => playSong(s, idx, recentSongs)}
              />
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '12px 4px' }}>
            No recent tracks yet. Play something from Search.
          </p>
        )}
      </section>

      <section style={{ width: 'min(980px, calc(100vw - 24px))', margin: '20px auto 0' }}>
        <SectionTitle text="Your Playlists" />
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
          {HOME_PLAYLISTS.map((playlist) => (
            <div key={playlist.id} style={{ width: 120, flexShrink: 0 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  background: playlist.gradient,
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                }}
              >
                {playlist.icon}
              </div>
              <p
                style={{
                  marginTop: 8,
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 14,
                  letterSpacing: '0.05em',
                  color: '#fff',
                  lineHeight: 1.15,
                }}
              >
                {playlist.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ width: 'min(980px, calc(100vw - 24px))', margin: '20px auto 0', padding: '0 16px', boxSizing: 'border-box' }}>
        <SectionTitle text="Library Files" />
        {libraryFiles.length > 0 ? (
          libraryFiles.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              index={i}
              showIndex
              onClick={(s, idx) => playSong(s, idx, libraryFiles)}
            />
          ))
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '12px 4px' }}>
            Library is empty. Download songs from Now Playing or search and play tracks.
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
        <span style={{ color: '#ff6464', fontSize: 13 }}>♥</span>
      </motion.div>
    </div>
  );
};

export default Home;
