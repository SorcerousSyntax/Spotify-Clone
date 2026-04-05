import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const PUBLIC_JIOSAAVN_SEARCH = 'https://jiosavan-api2.vercel.app/api/search/songs';
const LAST_SEARCH_KEY = 'raabta_last_search_v1';
const RECENT_SEARCHES_KEY = 'raabta_recent_searches_v1';
const RECENT_SEARCHES_LIMIT = 10;

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

const dedupeById = (songs = []) => {
  const seen = new Set();
  return songs.filter((song) => {
    const id = song?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const readJsonArray = (key) => {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch (_error) {
    return [];
  }
};

const persistSearchMemory = (term) => {
  const clean = String(term || '').trim();
  if (!clean) return;

  try {
    localStorage.setItem(LAST_SEARCH_KEY, clean);
    const existing = readJsonArray(RECENT_SEARCHES_KEY);
    const next = [clean, ...existing.filter((item) => item.toLowerCase() !== clean.toLowerCase())]
      .slice(0, RECENT_SEARCHES_LIMIT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch (_error) {
    // Ignore storage errors to avoid breaking search on private mode/storage limits.
  }
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const isOffline = usePlayerStore((s) => s.isOffline);
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const currentPlayingId = usePlayerStore((s) => s.currentSong?.id);
  
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const requestRef = useRef(0);
  const cacheRef = useRef(new Map());
  const restoredSearchRanRef = useRef(false);

  useEffect(() => {
    const last = (localStorage.getItem(LAST_SEARCH_KEY) || '').trim();
    const recent = readJsonArray(RECENT_SEARCHES_KEY);
    setRecentSearches(recent);
    if (last) {
      setQuery(last);
    }

    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (restoredSearchRanRef.current) return;
    const restored = String(query || '').trim();
    if (!restored) return;

    restoredSearchRanRef.current = true;
    searchSongs(restored, { skipMemory: true });
  }, [query, searchSongs]);

  const suggestionWords = useMemo(() => {
    const q = query.trim().toLowerCase();

    const fromResults = results
      .flatMap((song) => [song?.title, song?.artist])
      .filter(Boolean)
      .flatMap((value) => String(value).split(/[^a-zA-Z0-9]+/))
      .map((word) => word.trim())
      .filter((word) => word.length >= 3);

    const pool = [...recentSearches, ...fromResults];
    const seen = new Set();
    const filtered = [];

    for (const item of pool) {
      const value = String(item || '').trim();
      if (!value) continue;
      const lower = value.toLowerCase();
      if (q && lower === q) continue;
      if (q && !lower.includes(q)) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);
      filtered.push(value);
      if (filtered.length >= 8) break;
    }

    return filtered;
  }, [query, results, recentSearches]);

  const searchSongs = useCallback(async (q, options = {}) => {
    const normalized = String(q || '').trim();
    if (!normalized) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    const cacheKey = normalized.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      setResults(cached);
      setLoading(false);
      if (!options.skipMemory) {
        persistSearchMemory(normalized);
        setRecentSearches(readJsonArray(RECENT_SEARCHES_KEY));
      }
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestRef.current;
    setLoading(true);

    let finalResults = [];
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        const extracted = Array.isArray(data?.results) ? data.results : Array.isArray(data?.songs) ? data.songs : [];
        if (extracted.length > 0) {
          finalResults = dedupeById(extracted);
        }
      }

      if (finalResults.length === 0) {
        const directRes = await fetch(`${PUBLIC_JIOSAAVN_SEARCH}?query=${encodeURIComponent(normalized)}&limit=20`, { signal: controller.signal });
        if (directRes.ok) {
          const directData = await directRes.json();
          finalResults = dedupeById((directData?.data?.results || []).map(mapJioSongToAppSong));
        }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      if (requestId !== requestRef.current) {
        return;
      }

      setResults(finalResults);
      cacheRef.current.set(cacheKey, finalResults);

      if (!options.skipMemory) {
        persistSearchMemory(normalized);
        setRecentSearches(readJsonArray(RECENT_SEARCHES_KEY));
      }

      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (v.trim()) {
      debounceRef.current = setTimeout(() => searchSongs(v), 350);
    } else {
      abortRef.current?.abort();
      setResults([]);
    }
  };

  const handlePlay = (song) => {
    if (!song?.id) return;

    setQueue([song], 0);
    setCurrentSong(song);

    // Build next queue from similar tracks instead of current search list.
    (async () => {
      const queryWords = String(query || '')
        .split(/[^a-zA-Z0-9]+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 3)
        .slice(0, 3);

      const queries = [
        song.artist,
        `${song.artist || ''} ${song.title || ''}`.trim(),
        song.title,
        ...queryWords,
      ].filter(Boolean);

      const collected = [];

      for (const q of queries) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            const extracted = Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data?.songs)
                ? data.songs
                : [];
            collected.push(...extracted);
          }
        } catch (err) {
          // keep trying remaining queries/fallbacks
        }

        if (collected.length >= 25) break;
      }

      if (collected.length === 0) {
        for (const q of queries) {
          try {
            const res = await fetch(`${PUBLIC_JIOSAAVN_SEARCH}?query=${encodeURIComponent(q)}&limit=20`);
            if (res.ok) {
              const data = await res.json();
              collected.push(...(data?.data?.results || []).map(mapJioSongToAppSong));
            }
          } catch (err) {
            // keep trying remaining queries
          }

          if (collected.length >= 25) break;
        }
      }

      const fallbackFromVisibleResults = (results || []).filter((item) => item?.id && item.id !== song.id);
      const similar = dedupeById([...collected, ...fallbackFromVisibleResults])
        .filter((item) => item?.id && item.id !== song.id)
        .slice(0, 30);
      const queue = [song, ...similar];
      setQueue(queue, 0);
    })();
  };

  const handleSuggestionClick = (value) => {
    const next = String(value || '').trim();
    if (!next) return;
    setQuery(next);
    searchSongs(next);
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
          {suggestionWords.map((suggestion) => (
            <button
              key={`sugg-${suggestion}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="btn-premium"
              style={{ padding: '8px 20px', fontSize: 9 }}
            >
              {suggestion.toUpperCase()}
            </button>
          ))}
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
                  onClick={() => handlePlay(song)}
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
