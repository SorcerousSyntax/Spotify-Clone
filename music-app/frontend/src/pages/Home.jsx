import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const Home = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Hot');

  const currentSong = usePlayerStore((s) => s.currentSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);

  useEffect(() => {
    const loadData = async () => {
      // Mock categories from image: Hot, My Voices, New
      const res = await fetch(`/api/search?q=Arijit Singh`);
      if (res.ok) {
        const data = await res.json();
        const results = (data?.results || data?.songs || []).slice(0, 10);
        setTrendingSongs(results);
      }
      setRecentSongs(recentFromStore.slice(0, 6));
    };
    loadData();
  }, [recentFromStore]);

  const playSong = (song, index, queue) => {
    setCurrentSong(song);
    setQueue(queue, index);
    navigate('/now-playing');
  };

  return (
    <div style={{ padding: '20px 20px 120px 20px', background: '#000', minHeight: '100vh', color: '#fff' }}>
      {/* Header with Circle Buttons */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <button style={{ width: 45, height: 45, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>⚙</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ width: 45, height: 45, borderRadius: '50%', background: '#5865F2', border: 'none', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.966 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/></svg>
          </button>
          <button style={{ width: 45, height: 45, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>🗑</button>
        </div>
      </header>

      {/* Pick a Song - Gradient Cards */}
      <section style={{ marginBottom: 35 }}>
        <h2 style={{ fontSize: 18, marginBottom: 20, fontWeight: 700 }}>Pick a song</h2>
        <div style={{ display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          {[
            { label: 'Recently', sub: 'Played', grad: 'linear-gradient(135deg, #fceabb 0%, #ff2d78 100%)' },
            { label: 'Top', sub: 'Charts', grad: 'linear-gradient(135deg, #a1ffce 0%, #ff2d78 100%)' },
            { label: 'New', sub: 'Releases', grad: 'linear-gradient(135deg, #89f7fe 0%, #ff2d78 100%)' },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              style={{
                minWidth: 140, height: 160, borderRadius: 24, background: card.grad,
                padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)', cursor: 'pointer', position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Folder tab look */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '60%', height: 30, background: 'rgba(255,255,255,0.2)', borderBottomRightRadius: 20 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{card.label}<br/>{card.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories - Pill Buttons */}
      <section style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 18, marginBottom: 20, fontWeight: 700 }}>Quick Selection</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 25, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['Hot', 'Recent', 'Favorites', 'New'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pill-btn ${activeCategory === cat ? 'pill-btn-active' : 'pill-btn-inactive'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Voice/Song Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
          {trendingSongs.slice(0, 6).map((song, i) => (
            <motion.div
              key={song.id}
              whileHover={{ y: -5 }}
              onClick={() => playSong(song, i, trendingSongs)}
              className="glass"
              style={{ padding: 10, textAlign: 'center', position: 'relative' }}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', marginBottom: 10, border: '2px solid rgba(255,45,120,0.2)' }}>
                <img src={song.image?.[1]?.url || song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="art" />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(song.name || song.title)}</p>
              {/* Play icon on card */}
              <div style={{ position: 'absolute', bottom: 35, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center', color: '#000', fontSize: 10 }}>▶</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Large Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', height: 65, borderRadius: 32,
          background: 'linear-gradient(to right, #ff2d78, #ff6eb4)',
          border: 'none', color: '#000', fontWeight: 800, fontSize: 16,
          boxShadow: '0 15px 30px rgba(255, 45, 120, 0.3)',
          marginTop: 20, cursor: 'pointer'
        }}
      >
        CREATE YOUR MIX
      </motion.button>
    </div>
  );
};

export default Home;
