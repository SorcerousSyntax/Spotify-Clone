import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';

const PUBLIC_JIOSAAVN_SEARCH = 'https://jiosavan-api2.vercel.app/api/search/songs';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const SongRow = ({ song, isPlaying, isCurrent, onClick }) => (
  <motion.div
    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px',
      borderRadius: 14, cursor: 'pointer', transition: 'background 0.2s ease',
    }}
  >
    <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <img src={song.album_art_url || '/placeholder-album.svg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
      {isCurrent && isPlaying && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,45,120,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14 }}>▶</span>
        </div>
      )}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, margin: 0, color: isCurrent ? '#ff2d78' : '#fff',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {decodeSongTitle(song.title || song.name || 'Unknown')}
      </h3>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {song.artist || 'Unknown Artist'}
      </p>
    </div>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [userName, setUserName] = useState('');
  const [loadingTrending, setLoadingTrending] = useState(true);

  const currentSong   = usePlayerStore((s) => s.currentSong);
  const isPlaying     = usePlayerStore((s) => s.isPlaying);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue      = usePlayerStore((s) => s.setQueue);
  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);

  const greeting = getGreeting();

  useEffect(() => {
    const loadData = async () => {
      setLoadingTrending(true);

      /* ── user name ── */
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
            const first = name.split(/[\s._@+\d]+/).filter(Boolean)[0] || '';
            setUserName(first);
          }
        } catch (_e) {}
      }

      /* ── helper: fetch a list from JioSaavn ── */
      const fetchJioList = async (query) => {
        try {
          const res = await fetch(`${PUBLIC_JIOSAAVN_SEARCH}?query=${encodeURIComponent(query)}&limit=20`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data?.data?.results || []).map((s) => ({
            id: s.id,
            title: s.name,
            name: s.name,
            artist: s.primaryArtists || s.artists?.primary?.map((a) => a?.name).filter(Boolean).join(', ') || 'Unknown',
            album_art_url: s.image?.[2]?.url || s.image?.[1]?.url || s.image?.[0]?.url || '/placeholder-album.svg',
            image: s.image,
            stream_url: s.downloadUrl?.[4]?.url || s.downloadUrl?.[3]?.url || s.downloadUrl?.[2]?.url || '',
            url:        s.downloadUrl?.[4]?.url || s.downloadUrl?.[3]?.url || s.downloadUrl?.[2]?.url || '',
            r2_url:     s.downloadUrl?.[4]?.url || s.downloadUrl?.[3]?.url || s.downloadUrl?.[2]?.url || '',
            duration: s.duration || 0,
          })).filter((s) => s.id);
        } catch (_e) { return []; }
      };

      /* trending */
      let trending = [];
      for (const q of ['Top Songs This Week India', 'Most Listened Songs This Week', 'Weekly Top Hindi Songs']) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const d = await res.json();
            const r = d?.results || d?.songs || [];
            if (r.length > 0) { trending = r; break; }
          }
        } catch (_e) {}
      }
      if (trending.length === 0) {
        trending = await fetchJioList('Top Songs This Week India');
      }
      setTrendingSongs(trending.slice(0, 12));
      setLoadingTrending(false);

      /* new releases */
      const releases = await fetchJioList('New Bollywood Songs 2025');
      setNewReleases(releases.slice(0, 10));
    };

    loadData();
  }, []);

  const playSong = (song, index, queue) => {
    setCurrentSong(song);
    setQueue(queue, index);
    navigate('/now-playing');
  };

  /* 2×N quick-resume grid items */
  const quickResume = recentFromStore.slice(0, 6);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ padding: '100px 20px 160px', position: 'relative', zIndex: 10 }}>

        {/* ── GREETING ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4, fontWeight: 600 }}>
            {greeting}
          </p>
          <h1 style={{ fontSize: 36, lineHeight: 1.05, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            {userName ? `${userName.charAt(0).toUpperCase()}${userName.slice(1).toLowerCase()}` : 'Welcome'}
            <span style={{ color: '#ff2d78' }}>.</span>
          </h1>
        </motion.section>

        {/* ── QUICK RESUME 2×3 GRID ── */}
        {quickResume.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {quickResume.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => playSong(song, i, quickResume)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    ...(currentSong?.id === song.id ? { borderColor: 'rgba(255,45,120,0.4)', background: 'rgba(255,45,120,0.1)' } : {}),
                  }}
                >
                  <img
                    src={song.album_art_url || '/placeholder-album.svg'}
                    style={{ width: 52, height: 52, objectFit: 'cover', flexShrink: 0 }}
                    alt=""
                  />
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: currentSong?.id === song.id ? '#ff2d78' : '#fff',
                    flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    paddingRight: 8,
                  }}>
                    {decodeSongTitle(song.title || 'Unknown')}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── TRENDING CAROUSEL ── */}
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>Trending Now</h2>
            <span style={{ fontSize: 11, color: '#ff2d78', fontFamily: 'monospace' }}>
              {trendingSongs.length > 0 ? `${trendingSongs.length} tracks` : ''}
            </span>
          </div>
          {loadingTrending ? (
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {[1,2,3,4].map(i => (
                <div key={i} className="shimmer" style={{ minWidth: 140, height: 170, borderRadius: 16, flexShrink: 0 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {trendingSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => playSong(song, i, trendingSongs)}
                  style={{ minWidth: 140, cursor: 'pointer', flexShrink: 0 }}
                >
                  <div style={{
                    width: 140, height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: currentSong?.id === song.id ? '2px solid #ff2d78' : '2px solid transparent',
                  }}>
                    <img src={song.image?.[1]?.url || song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: currentSong?.id === song.id ? '#ff2d78' : '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {decodeSongTitle(song.name || song.title || 'Unknown')}
                  </h3>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.artist || 'Unknown'}
                  </p>
                </motion.div>
              ))}
              {trendingSongs.length === 0 && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', padding: '20px 0' }}>Unable to load right now.</p>
              )}
            </div>
          )}
        </section>

        {/* ── NEW RELEASES CAROUSEL ── */}
        {newReleases.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>New Releases</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {newReleases.slice(0, 6).map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  isCurrent={currentSong?.id === song.id}
                  isPlaying={isPlaying}
                  onClick={() => playSong(song, i, newReleases)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── RECENTLY PLAYED (full list if > 6) ── */}
        {recentFromStore.length > 6 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Recently Played</h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {recentFromStore.slice(6, 16).map((song, i) => (
                <motion.div
                  key={song.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => playSong(song, i + 6, recentFromStore)}
                  style={{ minWidth: 96, cursor: 'pointer', flexShrink: 0 }}
                >
                  <div style={{ width: 96, height: 96, borderRadius: 14, overflow: 'hidden', marginBottom: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                    <img src={song.album_art_url || '/placeholder-album.svg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {decodeSongTitle(song.title || 'Unknown')}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default Home;
