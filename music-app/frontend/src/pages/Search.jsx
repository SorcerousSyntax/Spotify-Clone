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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => onClick(song, index)}
      style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: 12, cursor: 'pointer', marginBottom: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      whileHover={{ background: 'rgba(255,45,120,0.1)', borderColor: '#ff2d78', x: 10 }}
    >
      <div style={{ width: 50, height: 50, flexShrink: 0, background: '#111' }}>
        <img src={albumArt} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{title.toUpperCase()}</h3>
        <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{artist.toUpperCase()}</p>
      </div>
      <span className="font-mono" style={{ fontSize: 10, color: '#ff2d78', fontWeight: 700 }}>{formatDuration(song.duration)}</span>
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
    <div style={{ padding: '40px 5vw 120px 5vw', maxWidth: 1400, margin: '0 auto', background: '#000', minHeight: '100vh' }}>
      <header style={{ marginBottom: 80 }}>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', lineHeight: 0.8, marginBottom: 40, letterSpacing: '-0.05em' }}
        >
          SEARCH<span style={{ color: '#ff2d78' }}>.</span>
        </motion.h1>
        <div 
          style={{ 
            display: 'flex', alignItems: 'center', padding: '0 30px', height: 80,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? '#ff2d78' : 'rgba(255,255,255,0.1)'}`,
            transition: 'all 0.4s ease',
            borderRadius: 0
          }}
        >
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ENTER ARTIST, TRACK OR ALBUM..."
            style={{ 
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 20, fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, letterSpacing: '-0.02em'
            }}
          />
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              style={{ width: 24, height: 24, border: '2px solid #ff2d78', borderTopColor: 'transparent' }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 10 }}>
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
              style={{ textAlign: 'left', padding: '20px 0' }}
            >
              <p className="font-mono" style={{ color: '#ff2d78', fontSize: 12 }}>ERROR: NO MATCHING DATA FOUND</p>
            </motion.div>
          ) : !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 40, opacity: 0.2 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ height: 60, background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Search;
