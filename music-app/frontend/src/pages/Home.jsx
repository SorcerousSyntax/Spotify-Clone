import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const SEARCH_QUERIES = ['trending hindi songs', 'arijit singh', 'romantic bollywood'];

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url || song?.url);

const normalizeSong = (song = {}) => ({
  ...song,
  id: song.id || song.song_id || `${song.title || song.name || 'song'}-${song.artist || song.primaryArtists || 'artist'}`,
  title: song.title || song.name || 'Unknown Title',
  artist: song.artist || song.primaryArtists || 'Unknown Artist',
  album_art_url: song.album_art_url || song.albumArt || song.album_art || '/placeholder-album.svg',
  stream_url: song.stream_url || song.url || song.r2_url || '',
  url: song.url || song.stream_url || song.r2_url || '',
  r2_url: song.r2_url || song.stream_url || song.url || '',
});

const Home = () => {
  const navigate = useNavigate();
  const [recentFromApi, setRecentFromApi] = useState([]);
  const [suggestedSong, setSuggestedSong] = useState(null);

  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const songsById = usePlayerStore((s) => s.songsById);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);

  useEffect(() => {
    let mounted = true;
    const loadRecent = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('play_history').select('*').order('played_at', { ascending: false }).limit(12);
      if (error) return;
      if (mounted && Array.isArray(data)) {
        setRecentFromApi(data.map((row) => normalizeSong({
          id: row.song_id, title: row.title, artist: row.artist, album_art_url: row.album_art, url: row.url, stream_url: row.url, r2_url: row.url,
        })));
      }
    };
    loadRecent().catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadSuggestion = async () => {
      for (const query of SEARCH_QUERIES) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (!res.ok) continue;
          const data = await res.json();
          const results = Array.isArray(data?.results) ? data.results : Array.isArray(data?.songs) ? data.songs : [];
          const playable = results.map(normalizeSong).find(isPlayableSong);
          if (playable && mounted) {
            setSuggestedSong(playable);
            return;
          }
        } catch { }
      }
    };
    loadSuggestion();
    return () => { mounted = false; };
  }, []);

  const likedSongs = useMemo(() => {
    return [...likedSongIds].map((id) => songsById[id]).filter(Boolean).map(normalizeSong).filter(isPlayableSong);
  }, [likedSongIds, songsById]);

  const recentSongs = useMemo(() => {
    const merged = [...recentFromApi, ...recentFromStore.map(normalizeSong), ...likedSongs];
    const seen = new Set();
    const result = [];
    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 8) break;
    }
    return result;
  }, [recentFromApi, recentFromStore, likedSongs]);

  const forYouSongs = useMemo(() => {
    const merged = [suggestedSong, ...recentSongs].filter(Boolean);
    const seen = new Set();
    const result = [];
    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 8) break;
    }
    return result;
  }, [suggestedSong, recentSongs]);

  const mostPlayedSongs = useMemo(() => {
    // Basic frequency counting from the recentFromApi history
    const counts = {};
    for (const song of recentFromApi) {
      if (!song.id) continue;
      counts[song.id] = (counts[song.id] || 0) + 1;
    }
    const merged = [...recentFromApi, ...recentFromStore.map(normalizeSong)].filter(isPlayableSong);
    const unique = [];
    const seen = new Set();
    for (const song of merged) {
      if (!song.id || seen.has(song.id)) continue;
      seen.add(song.id);
      unique.push(song);
    }
    // Sort by count, then take top 5
    return unique
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .slice(0, 5);
  }, [recentFromApi, recentFromStore]);

  const recentlyPlayedTop5 = useMemo(() => recentSongs.slice(0, 5), [recentSongs]);

  const playSong = (song, index, queue) => {
    const normalized = normalizeSong(song);
    if (!isPlayableSong(normalized)) {
      navigate('/search');
      return;
    }
    const normalizedQueue = queue.map(normalizeSong);
    setCurrentSong(normalized);
    setQueue(normalizedQueue, index);
    navigate('/now-playing');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }
  };

  return (
    <div style={{ padding: '40px 20px 100px 20px', maxWidth: 800, margin: '0 auto', background: 'transparent' }}>
      <header style={{ marginBottom: 40, padding: '0 20px' }}>
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.5, x: 0 }}
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#ffffff', marginBottom: 4, letterSpacing: '0.02em' }}
        >
          Hi, Harsh 👋
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1, marginBottom: 20 }}
        >
          RAABTA<span style={{ color: '#ff2d78' }}>.</span>
        </motion.h1>
      </header>

      {/* RECENTLY PLAYED SECTION */}
      <section style={{ marginBottom: 40, padding: '0 20px' }}>
        <h2 className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 20, letterSpacing: '0.1em' }}>RECENTLY PLAYED</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentlyPlayedTop5.map((song, index) => (
            <SongRow 
              key={`recent-${song.id}`}
              song={song}
              index={index}
              queue={recentlyPlayedTop5}
              playSong={playSong}
              active={currentSong?.id === song.id}
            />
          ))}
        </div>
      </section>

      {/* MOST PLAYED SECTION */}
      <section style={{ marginBottom: 60, padding: '0 20px' }}>
        <h2 className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 20, letterSpacing: '0.1em' }}>MOST PLAYED</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mostPlayedSongs.map((song, index) => (
            <SongRow 
              key={`most-${song.id}`}
              song={song}
              index={index}
              queue={mostPlayedSongs}
              playSong={playSong}
              active={currentSong?.id === song.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const SongRow = ({ song, index, queue, playSong, active }) => {
  const isOffline = usePlayerStore(s => s.isOffline(song.id));
  const toggleOffline = usePlayerStore(s => s.toggleOffline);

  return (
    <motion.div 
      whileHover={{ x: 4, backgroundColor: 'rgba(255, 45, 120, 0.05)' }}
      onClick={() => playSong(song, index, queue)}
      className="glass"
      style={{ 
        padding: '8px 16px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16,
        height: 64,
        background: 'rgba(255,255,255,0.03)',
        borderColor: active ? 'rgba(255,45,120,0.4)' : 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <img src={song.album_art_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: active ? '#ff2d78' : '#fff' }}>
          {decodeSongTitle(song.title)}
        </h3>
        <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.artist}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: isOffline ? 1 : 0.3 }}
        >
          {isOffline ? '✅' : '📥'}
        </button>
        <div className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
          {song.duration ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}` : '--:--'}
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
