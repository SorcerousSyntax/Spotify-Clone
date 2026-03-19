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
    <div style={{ padding: '40px 20px 100px 20px', maxWidth: 1200, margin: '0 auto', background: 'transparent' }}>
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
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, marginBottom: 20 }}
        >
          FOR YOU<span style={{ color: '#ff2d78' }}>.</span>
        </motion.h1>
      </header>

      <section style={{ marginBottom: 60, padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>RECOMMENDED</h2>
          <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>01 // CURATED</p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: 20 
          }}
        >
          {forYouSongs.map((song, index) => (
            <motion.div key={song.id} variants={item}>
              <AlbumCard
                title={decodeSongTitle(song.title)}
                subtitle={song.artist}
                image={song.album_art_url}
                onClick={() => playSong(song, index, forYouSongs)}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>RECENTLY PLAYED</h2>
          <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>02 // HISTORY</p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
        >
          {recentSongs.slice(0, 6).map((song, index) => (
            <motion.div key={song.id} variants={item}>
              <RecentRow
                title={decodeSongTitle(song.title)}
                subtitle={song.artist}
                image={song.album_art_url}
                active={currentSong?.id === song.id}
                onClick={() => playSong(song, index, recentSongs)}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

const AlbumCard = ({ title, subtitle, image, onClick }) => (
  <div className="glass" onClick={onClick} style={{ 
    padding: '8px', 
    cursor: 'pointer',
    width: '100%',
    maxWidth: '156px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 auto'
  }}>
    <div style={{ 
      width: '140px', 
      height: '140px', 
      overflow: 'hidden', 
      marginBottom: '12px', 
      background: '#111',
      borderRadius: '10px',
      /* Claymorphism inner shadow for image container */
      boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.05)'
    }}>
      <img 
        src={image} 
        alt={title} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }} 
        className="hover:scale-110" 
      />
    </div>
    <div style={{ width: '100%', padding: '0 4px', textAlign: 'center' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, color: '#fff' }}>{title}</h3>
      <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
    </div>
  </div>
);

const RecentRow = ({ title, subtitle, image, active, onClick }) => (
  <div className="glass" onClick={onClick} style={{ 
    padding: '12px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16,
    borderRadius: '12px',
    borderColor: active ? '#ff2d78' : 'rgba(255,45,120,0.15)'
  }}>
    <img src={image} alt={title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '6px' }} />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
      <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{subtitle}</p>
    </div>
    {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff2d78', boxShadow: '0 0 10px #ff2d78' }} />}
  </div>
);

export default Home;
