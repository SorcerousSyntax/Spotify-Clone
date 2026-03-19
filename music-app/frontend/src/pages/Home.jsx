import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';
import AlbumCard from '../components/AlbumCard';

const SEARCH_QUERIES = ['trending hindi songs', 'arijit singh', 'latest bollywood 2024'];

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
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [recentFromApi, setRecentFromApi] = useState([]);

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
      const { data, error } = await supabase.from('play_history').select('*').order('played_at', { ascending: false }).limit(20);
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
    const loadTrending = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(SEARCH_QUERIES[0])}`);
        if (!res.ok) return;
        const data = await res.json();
        const results = (Array.isArray(data?.results) ? data.results : Array.isArray(data?.songs) ? data.songs : []).map(normalizeSong).filter(isPlayableSong);
        if (mounted) setTrendingSongs(results.slice(0, 10));
      } catch { }
    };
    loadTrending();
    return () => { mounted = false; };
  }, []);

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

  const recentSongs = useMemo(() => {
    const merged = [...recentFromStore.map(normalizeSong), ...recentFromApi];
    const seen = new Set();
    const result = [];
    for (const song of merged) {
      if (!song?.id || seen.has(song.id) || !isPlayableSong(song)) continue;
      seen.add(song.id);
      result.push(song);
      if (result.length === 6) break;
    }
    return result;
  }, [recentFromStore, recentFromApi]);

  const heroSong = trendingSongs[0] || recentSongs[0];

  return (
    <div style={{ padding: '0 0 100px 0', background: '#000', color: '#fff' }}>
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        height: '70vh', 
        width: '100%', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        padding: '0 5vw',
        background: '#000'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
           <img 
            src={heroSong?.album_art_url} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(80px)' }} 
            alt="bg"
          />
        </div>
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1200, width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          >
            <span className="font-mono" style={{ color: '#ff2d78', fontSize: 12, marginBottom: 20, display: 'block' }}>FEATURED TRACK</span>
            <h1 style={{ 
              fontSize: 'clamp(3rem, 10vw, 8rem)', 
              lineHeight: 0.9, 
              fontWeight: 900, 
              marginBottom: 30,
              letterSpacing: '-0.04em'
            }}>
              {decodeSongTitle(heroSong?.title || 'RAABTA')}
            </h1>
            <div style={{ display: 'flex', gap: 20 }}>
              <button 
                onClick={() => heroSong && playSong(heroSong, 0, [heroSong])}
                className="clay" 
                style={{ padding: '20px 40px', fontSize: 16 }}
              >
                LISTEN NOW
              </button>
              <button 
                onClick={() => navigate('/search')}
                className="glass" 
                style={{ background: 'transparent', color: '#fff', padding: '20px 40px', fontSize: 16, border: '1px solid #fff' }}
              >
                BROWSE ALL
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 5vw' }}>
        
        {/* Recently Played Grid */}
        <section style={{ marginTop: -80, position: 'relative', zIndex: 20, marginBottom: 80 }}>
          <h2 className="font-mono" style={{ fontSize: 10, color: '#ff2d78', marginBottom: 20 }}>RECENTLY PLAYED</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: 25 
          }}>
            {recentSongs.map((song, idx) => (
              <AlbumCard 
                key={`recent-${song.id}`} 
                song={song} 
                index={idx} 
                onClick={() => playSong(song, idx, recentSongs)}
              />
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30 }}>
            <h2 style={{ fontSize: 40, margin: 0 }}>TRENDING<span style={{ color: '#ff2d78' }}>.</span></h2>
            <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => navigate('/search')}>VIEW ALL</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 30 }}>
            {trendingSongs.slice(1, 9).map((song, idx) => (
              <motion.div
                key={`trending-${song.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => playSong(song, idx, trendingSongs)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ 
                  aspectRatio: '1/1', 
                  borderRadius: 0, 
                  overflow: 'hidden', 
                  marginBottom: 15,
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <img 
                    src={song.album_art_url} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt={song.title} 
                  />
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 5 }}>{decodeSongTitle(song.title)}</h3>
                <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{song.artist}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories / Moods */}
        <section style={{ marginBottom: 100 }}>
           <h2 className="font-mono" style={{ fontSize: 10, color: '#ff2d78', marginBottom: 30 }}>DISCOVER BY MOOD</h2>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {['LO-FI CHILL', 'PARTY ANTHEMS', 'BOLLYWOOD CLASSICS', 'ROMANTIC HITS'].map((mood, idx) => (
                <div 
                  key={mood}
                  className="glass"
                  style={{ 
                    height: 120, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    background: idx % 2 === 0 ? 'rgba(255,45,120,0.05)' : 'rgba(255,255,255,0.02)'
                  }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(mood)}`)}
                >
                  {mood}
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
