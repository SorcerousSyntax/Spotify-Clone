import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const Home = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Hot');
  const [userName, setUserName] = useState('');

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);

  useEffect(() => {
    const loadData = async () => {
      // Load trending/hot songs
      const res = await fetch(`/api/search?q=Arijit Singh`);
      if (res.ok) {
        const data = await res.json();
        const results = (data?.results || data?.songs || []).slice(0, 10);
        setTrendingSongs(results);
      }

      // Load user session for name
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
          const firstName = name.split(/[\s._@+\d]+/).filter(Boolean)[0] || '';
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase());
        }
      }
    };
    loadData();
  }, []);

  const playSong = (song, index, queue) => {
    setCurrentSong(song);
    setQueue(queue, index);
    navigate('/now-playing');
  };

  return (
    <div style={{ padding: '100px 20px 120px 20px', background: '#000', minHeight: '100vh', color: '#fff' }}>
      {/* Personalized Header */}
      <header style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}>
              HI {userName.toUpperCase() || 'THERE'}<span style={{ color: '#ff2d78' }}>.</span>
            </h1>
            <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: '0.2em' }}>
              WELCOME TO RAABTA SYSTEM
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="glass" style={{ width: 45, height: 45, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>⚙</button>
          </div>
        </div>

        {/* Now Playing Animation Bar */}
        <AnimatePresence>
          {currentSong && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={() => navigate('/now-playing')}
              className="glass"
              style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                background: 'rgba(255, 45, 120, 0.05)',
                borderColor: 'rgba(255, 45, 120, 0.2)',
                cursor: 'pointer',
                marginTop: 10,
                overflow: 'hidden'
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isPlaying ? '#ff2d78' : '#fff', boxShadow: isPlaying ? '0 0 10px #ff2d78' : 'none' }}>
                {isPlaying && (
                  <motion.div
                    animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#ff2d78' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 20, whiteSpace: 'nowrap' }}>
                  <motion.p
                    animate={{ x: isPlaying ? [0, -200] : 0 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    style={{ fontSize: 11, fontWeight: 800, color: '#ff2d78' }}
                  >
                    NOW PLAYING: {decodeSongTitle(currentSong.title).toUpperCase()} — {currentSong.artist.toUpperCase()}
                  </motion.p>
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: 9, opacity: 0.5 }}>03 / 00</div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Recently Played - Real Data */}
      {recentFromStore.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>RECENTLY PLAYED</h2>
            <p className="font-mono" style={{ fontSize: 9, color: '#ff2d78', fontWeight: 800 }}>HISTORY / 001</p>
          </div>
          <div style={{ display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 15, scrollbarWidth: 'none' }}>
            {recentFromStore.slice(0, 10).map((song, i) => (
              <motion.div
                key={song.id}
                whileHover={{ y: -5 }}
                onClick={() => playSong(song, 0, [song])}
                style={{
                  minWidth: 120,
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: 120, height: 120, borderRadius: 24, overflow: 'hidden', background: '#111', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="art" />
                </div>
                <h3 style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(song.title).toUpperCase()}</h3>
                <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{song.artist.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Pick a Song - Categories */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 20, fontWeight: 900 }}>PICK A MOOD</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 25, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['Hot', 'Global', 'New', 'Party'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pill-btn ${activeCategory === cat ? 'pill-btn-active' : 'pill-btn-inactive'}`}
              style={{ borderRadius: 12, padding: '10px 25px' }}
            >
              {cat.toUpperCase()}
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
              style={{ padding: 15, textAlign: 'center', position: 'relative', borderRadius: 24 }}
            >
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', marginBottom: 12, border: '1px solid rgba(255,45,120,0.2)' }}>
                <img src={song.image?.[1]?.url || song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="art" />
              </div>
              <h3 style={{ fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(song.name || song.title).toUpperCase()}</h3>
              {/* Play icon on card */}
              <div style={{ position: 'absolute', bottom: 40, right: 10, width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', color: '#000', fontSize: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>▶</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Large Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary"
        style={{
          width: '100%', height: 65, borderRadius: 20,
          marginTop: 20, cursor: 'pointer', fontSize: 14, fontWeight: 900
        }}
      >
        GENERATE AI PLAYLIST
      </motion.button>
    </div>
  );
};

export default Home;

