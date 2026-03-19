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

const SearchResultRow = ({ song, index, onClick }) => {
  const title = decodeSongTitle(song.title || song.name || 'Unknown Title');
  const artist = song.artist || song.primaryArtists || 'Unknown Artist';
  const albumArt = song.album_art_url || '/placeholder-album.svg';
  
  const formatDuration = (s) => {
    if (!s) return '--:--';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => onClick(song, index)}
      className="glass"
      style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: 15, cursor: 'pointer', marginBottom: 10,
      }}
    >
      <img src={albumArt} alt={title} style={{ width: 50, height: 50, objectFit: 'cover' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
        <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{artist}</p>
      </div>
      <span className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{formatDuration(song.duration)}</span>
    </motion.div>
  );
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
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
    <div style={{ padding: '40px 40px 100px 40px', maxWidth: 1000, margin: '0 auto', background: 'transparent' }}>
      <header style={{ marginBottom: 60 }}>
        <h1 style={{ fontSize: 64, marginBottom: 20 }}>SEARCH</h1>
        <div 
          className="glass"
          style={{ 
            display: 'flex', alignItems: 'center', padding: '0 25px', height: 70,
            borderColor: focused ? '#ff2d78' : 'rgba(255,45,120,0.2)'
          }}
        >
          <span style={{ fontSize: 24, marginRight: 20, color: '#ff2d78' }}>⚲</span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="TYPE ANYTHING..."
            style={{ 
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 18, fontFamily: "'Share Tech Mono', monospace"
            }}
          />
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 20, height: 20, border: '2px solid #ff2d78', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          )}
        </div>
      </header>

      <section>
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 15 }}>
                {results.map((song, i) => (
                  <SearchResultRow key={song.id} song={song} index={i} onClick={handlePlay} />
                ))}
              </div>
            </motion.div>
          ) : !loading && query ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: 100 }}
            >
              <p className="font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>NO RESULTS FOUND</p>
            </motion.div>
          ) : !loading && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: 100 }}
            >
              <p className="font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>WAITING FOR INPUT...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Search;
