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
  const downloadingIds = usePlayerStore((s) => s.downloadingIds);
  
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
    <div style={{ padding: '100px 24px 150px 24px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <header style={{ marginBottom: 40 }}>
        <h1 className="page-title" style={{ marginBottom: 32 }}>
          SEARCH<span>.</span>
        </h1>
        
        {/* Search Input */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 24px', 
            height: 60,
            background: 'var(--color-bg-secondary)',
            border: focused ? '1.5px solid var(--color-accent-primary)' : '1.5px solid var(--color-border)',
            boxShadow: focused ? '0 0 0 3px var(--color-accent-glow)' : 'none',
            borderRadius: 100,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: 20, marginRight: 16, color: 'var(--color-text-muted)' }}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ARTISTS, TRACKS, ALBUMS..."
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              outline: 'none',
              color: 'var(--color-text-primary)', 
              fontSize: 14, 
              fontWeight: 600, 
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.02em'
            }}
          />
          {loading && (
            <div
              className="loading-pulse"
              style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent-primary)' }}
            />
          )}
        </div>
      </header>

      {/* Category Chips */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          overflowX: 'auto',
          marginLeft: -24,
          paddingLeft: 24,
          marginRight: -24,
          paddingRight: 24
        }} className="no-scrollbar">
          {['BOLLYWOOD', 'ENGLISH', 'TRENDING', 'POP', 'HIP-HOP', 'LO-FI'].map(cat => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setQuery(cat); searchSongs(cat); }}
              className="card-tap"
              style={{ 
                padding: '10px 20px', 
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                background: query === cat ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 100,
                color: '#fff',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat}
            </motion.button>
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
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              {results.map((song, i) => (
                <motion.div
                  key={song.id}
                  whileTap={{ scale: 0.98, background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => handlePlay(song, i)}
                  className="card-tap"
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    padding: '10px 12px',
                    borderRadius: 16, 
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-elevated)' }}>
                    <img src={song.album_art_url} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: 13, 
                      fontWeight: 600, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      color: currentPlayingId === song.id ? 'var(--color-accent-primary)' : '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {decodeSongTitle(song.title)}
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{song.artist?.toUpperCase()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)' }}
                    >
                      {downloadingIds.has(song.id) ? (
                        <div
                          className="loading-pulse"
                          style={{ width: 14, height: 14, border: '2px solid var(--color-accent-primary)', borderRadius: '50%' }}
                        />
                      ) : isOffline(song.id) ? (
                        <span style={{ color: 'var(--color-accent-primary)' }}>✓</span>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : !loading && query ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <p style={{ color: 'var(--color-accent-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>NO RESULTS FOUND</p>
            </div>
          ) : (
            <div style={{ padding: 80, textAlign: 'center', opacity: 0.3 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em' }}>READY TO DISCOVER</p>
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Search;
