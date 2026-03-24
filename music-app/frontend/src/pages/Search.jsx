import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const PUBLIC_JIOSAAVN_SEARCH = 'https://jiosavan-api2.vercel.app/api/search/songs';

const mapJioSongToAppSong = (song = {}) => ({
  id: song.id,
  title: song.name,
  artist:
    song.primaryArtists ||
    song.artists?.primary?.map((artist) => artist?.name).filter(Boolean).join(', ') ||
    'Unknown Artist',
  album: song.album?.name || '',
  duration: song.duration || 0,
  album_art_url: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || '/placeholder-album.svg',
  url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.downloadUrl?.[2]?.url || '',
  stream_url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.downloadUrl?.[2]?.url || '',
  r2_url: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.downloadUrl?.[2]?.url || '',
  source: 'jiosaavn-public-fallback',
});

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const isOffline = usePlayerStore((s) => s.isOffline);
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const currentPlayingId = usePlayerStore((s) => s.currentSong?.id);
  
  const debounceRef = useRef(null);

  const searchSongs = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const extracted = Array.isArray(data?.results) ? data.results : Array.isArray(data?.songs) ? data.songs : [];
        if (extracted.length > 0) {
          setResults(extracted);
          setLoading(false);
          return;
        }
      }

      const directRes = await fetch(`${PUBLIC_JIOSAAVN_SEARCH}?query=${encodeURIComponent(q)}&limit=20`);
      if (directRes.ok) {
        const directData = await directRes.json();
        setResults((directData?.data?.results || []).map(mapJioSongToAppSong));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.trim()) {
      debounceRef.current = setTimeout(() => searchSongs(v), 500);
    } else {
      setResults([]);
    }
  };

  const handlePlay = (song, index) => {
    setCurrentSong(song);
    setQueue(results, index);
  };

  return (
    <div style={{ padding: '100px 20px 150px 20px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, color: '#fff', marginBottom: 30 }}>
          SEARCH<span className="text-pink">.</span>
        </h1>
        
        {/* Search Input */}
        <div 
          className="liquid-glass"
          style={{ 
            display: 'flex', alignItems: 'center', padding: '0 20px', height: 60,
            border: focused ? '1px solid var(--pink-hot)' : '1px solid rgba(255,255,255,0.2)',
            boxShadow: focused ? '0 0 20px rgba(255,45,120,0.3)' : '0 10px 40px rgba(0,0,0,0.5)',
            transition: 'all 0.4s var(--ease-main)',
            borderRadius: 30
          }}
        >
          <span style={{ fontSize: 20, marginRight: 15, opacity: 0.8, color: '#fff' }}>⚲</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ARTISTS, TRACKS, ALBUMS..."
            style={{ 
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 16, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif"
            }}
          />
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              style={{ width: 20, height: 20, border: '2px solid var(--pink-hot)', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          )}
        </div>
      </header>

      {/* Category Chips */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }} className="no-scrollbar">
          {['BOLLYWOOD', 'ENGLISH', 'TRENDING', 'POP', 'HIP-HOP', 'LO-FI'].map(cat => (
            <button
              key={cat}
              onClick={() => { setQuery(cat); searchSongs(cat); }}
              className="btn-premium"
              style={{ padding: '8px 20px', fontSize: 9 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section>
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {results.map((song, i) => (
                <motion.div
                  key={song.id}
                  whileHover={{ background: 'var(--glass-bg)' }}
                  onClick={() => handlePlay(song, i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 15, padding: '10px 15px',
                    borderRadius: 12, cursor: 'pointer', height: 64,
                    borderBottom: '1px solid rgba(255,45,120,0.05)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentPlayingId === song.id ? 'var(--pink-hot)' : '#fff' }}>
                      {decodeSongTitle(song.title).toUpperCase()}
                    </h3>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{song.artist?.toUpperCase()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                    >
                      {usePlayerStore.getState().downloadingIds.has(song.id) ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ width: 14, height: 14, border: '2px solid var(--pink-hot)', borderTopColor: 'transparent', borderRadius: '50%' }}
                        />
                      ) : isOffline(song.id) ? (
                        <span style={{ color: 'var(--pink-hot)' }}>✓</span>
                      ) : (
                        <span style={{ opacity: 0.3 }}>📥</span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : !loading && query ? (
            <p className="font-mono" style={{ color: 'var(--pink-hot)', fontSize: 10, textAlign: 'center', padding: 40 }}>NO MATCHING DATA FOUND</p>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.2 }}>
              <p className="font-mono" style={{ fontSize: 10 }}>READY TO SEARCH...</p>
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Search;
