import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import SkeletonLoader from '../components/SkeletonLoader';
import useCardTilt from '../hooks/useCardTilt';
import { decodeSongTitle } from '../lib/text';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const buildApiUrl = (path) => `${API_BASE}${path}`;

const SearchResultRow = ({ song, index, onClick }) => {
  const tilt = useCardTilt(5);
  const isChoice = Boolean(song.is_choice);
  const title = decodeSongTitle(song.title || song.name || 'Unknown Title');
  const artist = song.artist || song.primaryArtists || 'Unknown Artist';
  const safeArtist = artist.replace(/&amp;/g, '&');
  const albumArt = song.album_art_url || song.albumArt || '/placeholder-album.svg';
  const formatDuration = (s) => {
    if (!s) return '--:--';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
      onClick={() => onClick(song, index)}
      {...tilt}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
        background: 'var(--surface)', border: '1px solid var(--green-border)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        marginBottom: 8,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Album art */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
        border: '1px solid rgba(0,255,106,0.1)',
      }}>
        <img
          src={albumArt}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 17, letterSpacing: '0.04em',
          color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2,
        }}>
          {safeArtist}{song.album ? ` · ${song.album}` : ''}{song.liked_by ? ` · Liked by ${song.liked_by}` : ''}
        </p>
      </div>

      {/* Duration */}
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0,
      }}>
        {isChoice ? 'Choose' : formatDuration(song.duration)}
      </span>
    </motion.div>
  );
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTelegram, setFetchingTelegram] = useState(false);
  const [focused, setFocused] = useState(false);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const extractResults = useCallback((data) => {
    if (Array.isArray(data?.results) && data.results.length > 0) return data.results;
    if (Array.isArray(data?.songs) && data.songs.length > 0) return data.songs;
    return [];
  }, []);

  const searchSongs = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true); setFetchingTelegram(false);
    try {
      const res = await fetch(buildApiUrl(`/api/search?q=${encodeURIComponent(q)}`));
      const data = await res.json();
      const firstPassResults = extractResults(data);
      if (firstPassResults.length > 0) {
        setResults(firstPassResults); setLoading(false);
      } else if (data.fetching) {
        setFetchingTelegram(true);
        const poll = setInterval(async () => {
          try {
            const r = await fetch(buildApiUrl(`/api/search?q=${encodeURIComponent(q)}`));
            const d = await r.json();
            const pollResults = extractResults(d);
            if (pollResults.length > 0) {
              setResults(pollResults); setFetchingTelegram(false); setLoading(false); clearInterval(poll);
            }
          } catch { clearInterval(poll); setFetchingTelegram(false); setLoading(false); }
        }, 3000);
        setTimeout(() => { clearInterval(poll); setFetchingTelegram(false); setLoading(false); }, 60000);
      } else { setResults([]); setLoading(false); }
    } catch { setLoading(false); }
  }, [extractResults]);

  const handleChange = (e) => {
    const v = e.target.value; setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.trim()) { setLoading(true); debounceRef.current = setTimeout(() => searchSongs(v), 500); }
    else { setResults([]); setLoading(false); }
  };

  const handlePlay = async (song, index) => {
    if (song.is_choice && song.choice_query) {
      setQuery(song.choice_query);
      await searchSongs(song.choice_query);
      return;
    }

    const playableSong = {
      ...song,
      stream_url: song.stream_url || song.url || '',
      url: song.url || song.stream_url || '',
    };

    const normalizedQueue = results.map((item) => ({
      ...item,
      stream_url: item.stream_url || item.url || '',
      url: item.url || item.stream_url || '',
    }));

    setCurrentSong(playableSong);
    setQueue(normalizedQueue, index);
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, padding: '0 16px', paddingTop: 48, paddingBottom: 20 }}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, letterSpacing: '0.06em', color: '#ffffff', marginBottom: 20 }}
      >
        Search
      </motion.h1>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ position: 'relative', marginBottom: 24 }}
      >
        {/* Scanning line when focused */}
        <div
          className={focused ? 'scan-line' : ''}
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            background: focused ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${focused ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 50,
            boxShadow: focused ? '0 0 0 4px rgba(0,255,106,0.1), 0 0 20px rgba(0,255,106,0.08)' : 'none',
            transition: 'all 0.25s ease',
            overflow: 'hidden',
          }}
        >
          <svg width="18" height="18" fill="none" stroke={focused ? '#00ff6a' : 'rgba(255,255,255,0.25)'} viewBox="0 0 24 24" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search any song..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: "'DM Mono', monospace", fontSize: 15,
              color: '#fff', letterSpacing: '0.02em',
            }}
            autoComplete="off"
          />
          {query && (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', border: 'none', outline: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.5)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Telegram fetching state */}
      <AnimatePresence>
        {fetchingTelegram && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '48px 0' }}
          >
            <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: '0.08em', color: '#00ff6a', marginBottom: 16 }}>
              Finding Your Song
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="wave-dot" style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#00ff6a', display: 'block',
                  boxShadow: '0 0 8px #00ff6a',
                }} />
              ))}
            </div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
              Searching across Telegram sources...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeleton */}
      {loading && !fetchingTelegram && <SkeletonLoader type="row" count={6} />}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!loading && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {results.map((song, i) => (
              <SearchResultRow key={song.id} song={song} index={i} onClick={handlePlay} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      {!loading && !fetchingTelegram && query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 0' }}
        >
          <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.2)' }}>
            Nothing Found
          </p>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 8 }}>
            Try a different search
          </p>
        </motion.div>
      )}

      {/* Empty state */}
      {!query && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', padding: '60px 0' }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '1px solid rgba(0,255,106,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" fill="none" stroke="rgba(0,255,106,0.4)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.2)' }}>
            Search Any Song
          </p>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.12)', marginTop: 6 }}>
            We'll find it from anywhere
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Search;
