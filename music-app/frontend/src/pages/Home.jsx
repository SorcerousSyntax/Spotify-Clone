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
  const [bannerName, setBannerName] = useState('COMMANDER');
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
    const loadBannerName = async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !mounted) return;
      const candidate = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')?.[0] || 'COMMANDER';
      setBannerName(String(candidate).toUpperCase());
    };
    loadBannerName().catch(() => {});
    return () => { mounted = false; };
  }, []);

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

  const handleStartListening = () => {
    const candidate = forYouSongs[0] || recentSongs[0] || currentSong;
    if (!candidate) { navigate('/search'); return; }
    const sourceQueue = forYouSongs.length ? forYouSongs : recentSongs;
    const idx = sourceQueue.findIndex((song) => song.id === candidate.id);
    playSong(candidate, Math.max(0, idx), sourceQueue.length ? sourceQueue : [candidate]);
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
    <div style={{ padding: '40px 40px 100px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <section style={{ marginBottom: 100 }}>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-mono" 
          style={{ fontSize: 12, color: '#ff2d78', marginBottom: 10 }}
        >
          WELCOME BACK
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          style={{ fontSize: 'clamp(48px, 10vw, 120px)', lineHeight: 0.9, marginBottom: 40 }}
        >
          {bannerName}<span style={{ color: '#ff2d78' }}>.</span>
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ display: 'flex', gap: 20 }}
        >
          <button className="btn-primary" onClick={handleStartListening}>START LISTENING</button>
          <button className="btn-secondary" onClick={() => navigate('/search')}>EXPLORE</button>
        </motion.div>
      </section>

      <section style={{ marginBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
          <h2 style={{ fontSize: 32 }}>FOR YOU</h2>
          <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>01 // RECOMMENDED</p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}
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

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
          <h2 style={{ fontSize: 32 }}>RECENTLY PLAYED</h2>
          <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>02 // HISTORY</p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}
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
  <div className="glass" onClick={onClick} style={{ padding: 10, cursor: 'pointer' }}>
    <div style={{ aspectRatio: '1/1', overflow: 'hidden', marginBottom: 15, background: '#111' }}>
      <img src={image} alt={title} style={{ width: '100%', height: '100%', objectCover: 'cover', transition: 'transform 0.5s ease' }} className="hover:scale-110" />
    </div>
    <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
    <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{subtitle}</p>
  </div>
);

const RecentRow = ({ title, subtitle, image, active, onClick }) => (
  <div className="glass" onClick={onClick} style={{ 
    padding: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
    borderColor: active ? '#ff2d78' : 'rgba(255,45,120,0.2)'
  }}>
    <img src={image} alt={title} style={{ width: 60, height: 60, objectCover: 'cover' }} />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
      <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{subtitle}</p>
    </div>
    {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff2d78', boxShadow: '0 0 10px #ff2d78' }} />}
  </div>
);

export default Home;
