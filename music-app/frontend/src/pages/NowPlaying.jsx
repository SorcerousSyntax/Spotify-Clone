import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';
import useCardTilt from '../hooks/useCardTilt';
import Waveform from '../components/Waveform';
import LyricsPanel from '../components/LyricsPanel';
import { decodeSongTitle } from '../lib/text';
import {
  OFFLINE_AUDIO_CACHE_NAME,
  cacheSongForOffline,
  getPreferredSongStreamUrl,
  getSongAudioUrlCandidates,
} from '../lib/offlineAudio';

const ScrollingTitle = ({ text, fontSize, accentColor }) => {
  const safeText = decodeSongTitle(text || '');
  const isLong = safeText.length > 18;
  const titleGrad = `linear-gradient(135deg, #fff 0%, ${accentColor || '#d946ef'} 50%, #f472b6 80%, #fda4af 100%)`;
  const spanStyle = {
    fontSize, lineHeight: 0.95, letterSpacing: '-0.02em', fontWeight: 800,
    background: titleGrad,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  };

  return (
    <div
      style={{
        overflow: 'hidden',
        minWidth: 0,
        width: '100%',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        marginBottom: 2,
      }}
    >
      {isLong ? (
        <motion.div
          style={{ display: 'flex', alignItems: 'center', width: 'max-content', gap: 48 }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 13, ease: 'linear', repeat: Infinity }}
        >
          <span style={spanStyle}>{safeText}</span>
          <span style={spanStyle}>{safeText}</span>
        </motion.div>
      ) : (
        <span style={{ ...spanStyle, display: 'block' }}>{safeText}</span>
      )}
    </div>
  );
};

// Ambient floating particle
const FloatOrb = ({ size, x, y, color, duration, delay }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: color, filter: `blur(${size * 0.6}px)`, pointerEvents: 'none',
      left: `${x}%`, top: `${y}%`,
    }}
    animate={{ y: [-12, 12, -12], x: [-8, 8, -8], opacity: [0.3, 0.55, 0.3] }}
    transition={{ duration, ease: 'easeInOut', repeat: Infinity, delay }}
  />
);

const NowPlaying = () => {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const playlists = usePlayerStore((s) => s.playlists);
  const addSongToPlaylist = usePlayerStore((s) => s.addSongToPlaylist);
  const seek = usePlayerStore((s) => s.playerControls.seek);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);

  const { rgbaString, dominantColor } = useColorExtract(currentSong?.album_art_url);
  const tiltHandlers = useCardTilt(8);
  const [dr, dg, db] = dominantColor;
  const accent = `rgb(${dr},${dg},${db})`;
  const accentA = (a) => `rgba(${dr},${dg},${db},${a})`;

  const [lyrics, setLyrics] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [offlineStatus, setOfflineStatus] = useState('idle'); // idle | saving | saved | error
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle | downloading | done | error
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [playlistAddStatus, setPlaylistAddStatus] = useState('');
  const progressBarRef = useRef(null);
  const [isCompact, setIsCompact] = useState(true);

  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;
  const customPlaylists = playlists.filter((playlist) => playlist.id !== LIKED_SONGS_PLAYLIST_ID);

  useEffect(() => {
    if (!customPlaylists.length) {
      setSelectedPlaylistId('');
      return;
    }

    const exists = customPlaylists.some((playlist) => playlist.id === selectedPlaylistId);
    if (!exists) {
      setSelectedPlaylistId(customPlaylists[0].id);
    }
  }, [customPlaylists, selectedPlaylistId]);

  useEffect(() => {
    const onResize = () => setIsCompact(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!currentSong) return;
    setLyrics([]);
    fetch(`/api/lyrics?title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist || '')}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.lyrics) setLyrics(d.lyrics);
      })
      .catch(() => {});
  }, [currentSong?.id, currentSong?.title, currentSong?.artist]);

  const streamUrl = getPreferredSongStreamUrl(currentSong);
  const streamCandidates = getSongAudioUrlCandidates(currentSong);

  useEffect(() => {
    let cancelled = false;

    if (!streamUrl || !window.caches) {
      setOfflineStatus('idle');
      return;
    }

    (async () => {
      try {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
        let hit = null;
        for (const url of streamCandidates) {
          const match = await cache.match(url);
          if (match) {
            hit = match;
            break;
          }
        }
        if (!cancelled) {
          setOfflineStatus(hit ? 'saved' : 'idle');
        }
      } catch {
        if (!cancelled) {
          setOfflineStatus('idle');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [streamUrl, currentSong?.id, currentSong?.url, currentSong?.stream_url, currentSong?.r2_url]);

  const saveOffline = async () => {
    if (!streamUrl || offlineStatus === 'saving') return;

    if (!window.caches) {
      setOfflineStatus('error');
      return;
    }

    try {
      setOfflineStatus('saving');
      await cacheSongForOffline(currentSong);
      setOfflineStatus('saved');
    } catch (err) {
      console.warn('Offline save failed:', err?.message || err);
      setOfflineStatus('error');
    }
  };

  const downloadToDevice = async () => {
    if (!streamUrl || downloadStatus === 'downloading') return;

    try {
      setDownloadStatus('downloading');
      const response = await fetch(streamUrl);
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentSong?.title || 'song').replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp3`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus('done');
      setTimeout(() => setDownloadStatus('idle'), 1600);
    } catch (err) {
      console.warn('Device download failed:', err?.message || err);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 1600);
    }
  };

  const handleAddToPlaylist = () => {
    if (!currentSong || !selectedPlaylistId) return;
    addSongToPlaylist(selectedPlaylistId, currentSong);
    setPlaylistAddStatus('Added');
    setTimeout(() => setPlaylistAddStatus(''), 1400);
  };

  const handleProgressDrag = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    setDragProgress(Math.max(0, Math.min(1, x / rect.width)) * duration);
  }, [duration]);

  const handleProgressEnd = useCallback(() => {
    if (isDragging) {
      seek(dragProgress);
      setIsDragging(false);
    }
  }, [isDragging, dragProgress, seek]);

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  const currentProgress = isDragging ? dragProgress : progress;
  const progressPercent = duration > 0 ? (currentProgress / duration) * 100 : 0;
  const safeTitle = decodeSongTitle(currentSong.title || '');

  if (!currentSong) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
            No song playing
          </p>
          <button
            onClick={() => navigate('/search')}
            style={{
              marginTop: 14,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Search Songs
          </button>
        </div>
      </div>
    );
  }

  // Blend album accent with violet — 70% album so colour clearly shifts per song
  const mixR = Math.round(dr * 0.7 + 139 * 0.3);
  const mixG = Math.round(dg * 0.7 + 92 * 0.3);
  const mixB = Math.round(db * 0.7 + 246 * 0.3);
  const blendAccent = `rgb(${mixR},${mixG},${mixB})`;
  const blendA = (a) => `rgba(${mixR},${mixG},${mixB},${a})`;

  return (
    <>
      {/* ── Background layers ── */}
      {/* Base dark */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'var(--bg)' }} />

      {/* Violet + pink constant orbs — always present regardless of album */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <FloatOrb size={320} x={-8} y={-10} color="rgba(139,92,246,0.18)" duration={8} delay={0} />
        <FloatOrb size={260} x={72} y={5} color="rgba(167,139,250,0.12)" duration={11} delay={2} />
        <FloatOrb size={200} x={15} y={68} color="rgba(99,102,241,0.14)" duration={9} delay={1.5} />
        <FloatOrb size={180} x={80} y={70} color="rgba(167,139,250,0.08)" duration={12} delay={3} />
        <FloatOrb size={280} x={83} y={14} color="rgba(236,72,153,0.14)" duration={10} delay={1} />
        <FloatOrb size={160} x={7} y={42} color="rgba(244,114,182,0.10)" duration={13} delay={4.5} />
        <FloatOrb size={220} x={46} y={83} color="rgba(219,39,119,0.09)" duration={7} delay={2.5} />
      </div>

      {/* Album-tinted orbs — blended with violet, softer */}
      <motion.div
        key={currentSong.id + '-bg'}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      >
        <motion.div
          style={{ position: 'absolute', inset: 0 }}
          animate={{
            background: [
              `radial-gradient(ellipse 70% 60% at 25% 15%, ${blendA(0.28)} 0%, transparent 65%)`,
              `radial-gradient(ellipse 70% 60% at 75% 85%, ${blendA(0.22)} 0%, transparent 65%)`,
              `radial-gradient(ellipse 70% 60% at 25% 15%, ${blendA(0.28)} 0%, transparent 65%)`,
            ],
          }}
          transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100dvh', paddingBottom: 36 }}>

        {/* ── Top bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ width: 'min(820px, calc(100vw - 24px))', margin: '0 auto', paddingTop: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 22 }}>
            {/* Back */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(-1)}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                border: '1px solid rgba(236,72,153,0.38)',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(236,72,153,0.12) 100%)',
                color: '#f472b6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </motion.button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', margin: 0 }}>
                Now Playing
              </p>
              <motion.div
                style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(236,72,153,0.7), rgba(167,139,250,0.85), rgba(236,72,153,0.7), transparent)' }}
                animate={{ width: ['20px', '72px', '20px'] }}
                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>

            {/* Offline + Download */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={saveOffline}
                style={{
                  height: 34, padding: '0 12px', borderRadius: 999, cursor: 'pointer', fontSize: 10,
                  fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: offlineStatus === 'saved' ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  background: offlineStatus === 'saved' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
                  color: offlineStatus === 'saved' ? '#34d399' : 'rgba(255,255,255,0.7)',
                }}
              >
                {offlineStatus === 'saved' ? '✓ Saved' : offlineStatus === 'saving' ? '…' : 'Offline'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={downloadToDevice}
                style={{
                  width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: downloadStatus === 'done' ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  background: downloadStatus === 'done' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
                  color: downloadStatus === 'done' ? '#34d399' : 'rgba(255,255,255,0.7)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {downloadStatus === 'done' ? <path d="M20 6L9 17l-5-5" /> : <><path d="M12 3v13M5 16l7 5 7-5" /></>}
                </svg>
              </motion.button>
            </div>
          </div>

          {/* ── Album Art ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              {...tiltHandlers}
              key={currentSong.id}
              initial={{ opacity: 0, scale: 0.82, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.08 }}
              style={{
                width: 'min(86vw, 300px)',
                aspectRatio: '1',
                borderRadius: 24,
                position: 'relative',
                willChange: 'transform',
                transformStyle: 'preserve-3d',
                marginBottom: 14,
              }}
            >
              {/* Deep glow blob */}
              <motion.div
                style={{ position: 'absolute', inset: -26, borderRadius: 50, zIndex: 0, pointerEvents: 'none' }}
                animate={{
                  background: [blendA(0.55), `rgba(236,72,153,0.38)`, blendA(0.55)],
                  filter: `blur(${isPlaying ? 40 : 22}px)`,
                  opacity: isPlaying ? 0.95 : 0.5,
                }}
                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
              />

              {/* Pink + violet corner accent glow */}
              <motion.div
                style={{
                  position: 'absolute', inset: -12, borderRadius: 36, zIndex: 0, pointerEvents: 'none',
                  background: 'radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.45) 0%, rgba(167,139,250,0.28) 40%, transparent 65%)',
                }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
              />

              {/* Pulse ring when playing */}
              <AnimatePresence>
                {isPlaying && (
                  <>
                    <motion.div
                      style={{ position: 'absolute', inset: -8, borderRadius: 32, border: `1.5px solid ${blendA(0.5)}`, zIndex: 1, pointerEvents: 'none' }}
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.08 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                      style={{ position: 'absolute', inset: -4, borderRadius: 28, border: '1px solid rgba(236,72,153,0.55)', zIndex: 1, pointerEvents: 'none' }}
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.05 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                    />
                  </>
                )}
              </AnimatePresence>

              <img
                src={currentSong.album_art_url || '/placeholder-album.svg'}
                alt={decodeSongTitle(currentSong.title || '')}
                style={{
                  width: '100%', height: '100%', borderRadius: 24, objectFit: 'cover',
                  boxShadow: `0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.09)`,
                  position: 'relative', zIndex: 2, display: 'block',
                }}
              />

              {/* Overlay shimmer when playing */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 24, zIndex: 3, pointerEvents: 'none',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(236,72,153,0.08) 35%, transparent 55%, rgba(167,139,250,0.09) 100%)',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Title + Artist ── */}
            <motion.div
              key={currentSong.id + '-meta'}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ width: 'min(86vw, 300px)', marginBottom: 6 }}
            >
              <ScrollingTitle text={safeTitle} fontSize={28} accentColor={blendAccent} />
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 500,
                color: 'rgba(253,164,175,0.65)', marginTop: 5, letterSpacing: '0.01em',
              }}>
                {currentSong.artist}
              </p>
            </motion.div>

            {/* ── Progress Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              style={{ width: 'min(86vw, 300px)', marginTop: 16, marginBottom: 4 }}
            >
              <div
                ref={progressBarRef}
                style={{ position: 'relative', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                onMouseMove={(e) => isDragging && handleProgressDrag(e)}
                onMouseUp={handleProgressEnd}
                onMouseLeave={handleProgressEnd}
                onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                onTouchMove={(e) => isDragging && handleProgressDrag(e)}
                onTouchEnd={handleProgressEnd}
              >
                {/* Track fill — gradient */}
                <motion.div
                  style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 999 }}
                  animate={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, #ec4899, #a855f7, ${blendAccent})`,
                    boxShadow: `0 0 14px rgba(236,72,153,0.6), 0 0 6px ${blendA(0.5)}`,
                  }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
                {/* Glowing thumb */}
                <motion.div
                  style={{
                    position: 'absolute', top: '50%',
                    left: `${progressPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%', zIndex: 2,
                    width: isDragging ? 18 : 13, height: isDragging ? 18 : 13,
                    transition: 'width 0.15s, height 0.15s',
                    background: '#fff',
                  }}
                  animate={{ boxShadow: `0 0 ${isDragging ? 18 : 10}px ${blendA(0.9)}` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {formatTime(currentProgress)}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  -{formatTime(Math.max(0, duration - currentProgress))}
                </span>
              </div>
            </motion.div>

            {/* ── Controls ── */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              style={{ width: 'min(92vw, 320px)', marginTop: 10 }}
            >
              {/* Shuffle | Prev | Play | Next | Repeat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Shuffle */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={toggleShuffle}
                  style={{
                    width: 42, height: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', gap: 3,
                  }}
                >
                  <motion.div animate={{
                    color: shuffle ? '#fbbf24' : 'rgba(255,255,255,0.38)',
                    filter: shuffle ? 'drop-shadow(0 0 7px rgba(251,191,36,0.85))' : 'none',
                  }} transition={{ duration: 0.2 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5M4 20l7-7M21 3l-8 8M4 4l5 5M16 21h5v-5" />
                      <path d="M21 16l-7-5" strokeOpacity="0.5" />
                    </svg>
                  </motion.div>
                  {shuffle && <motion.div layoutId="shuffle-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: '#fbbf24' }} />}
                </motion.button>

                {/* Prev */}
                <motion.button
                  whileTap={{ scale: 0.86, x: -3 }}
                  onClick={prevSong}
                  style={{
                    width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: '50%', outline: 'none', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 7l-7 5 7 5V7zM20 7l-7 5 7 5V7z" />
                  </svg>
                </motion.button>

                {/* Play / Pause */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  style={{ position: 'relative', width: 76, height: 76, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {/* Outer pulse rings */}
                  <AnimatePresence>
                    {isPlaying && (
                      <>
                        <motion.div
                          style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${blendA(0.45)}`, pointerEvents: 'none' }}
                          initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 1.35, opacity: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                        />
                        <motion.div
                          style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1.5px solid rgba(236,72,153,0.5)', pointerEvents: 'none' }}
                          initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 1.2, opacity: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                        />
                      </>
                    )}
                  </AnimatePresence>

                  {/* Disc */}
                  <motion.div
                    style={{ width: 76, height: 76, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    animate={{
                      background: isPlaying
                        ? `linear-gradient(135deg, #ec4899 0%, ${blendAccent} 50%, #8b5cf6 100%)`
                        : `linear-gradient(135deg, #9d174d, #6d28d9)`,
                      boxShadow: isPlaying
                        ? `0 0 0 1px rgba(236,72,153,0.4), 0 10px 40px ${blendA(0.5)}, 0 0 55px rgba(236,72,153,0.32), 0 0 80px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.25)`
                        : `0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }}
                    transition={{ duration: 0.45 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isPlaying ? (
                        <motion.svg key="pause" width="24" height="24" fill="#fff" viewBox="0 0 24 24"
                          initial={{ scale: 0.3, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0, rotate: 20 }}
                          transition={{ duration: 0.16 }}>
                          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                        </motion.svg>
                      ) : (
                        <motion.svg key="play" width="26" height="26" fill="#fff" viewBox="0 0 24 24" style={{ marginLeft: 3 }}
                          initial={{ scale: 0.3, opacity: 0, rotate: 20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.3, opacity: 0, rotate: -20 }}
                          transition={{ duration: 0.16 }}>
                          <path d="M8 5v14l11-7z" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>

                {/* Next */}
                <motion.button
                  whileTap={{ scale: 0.86, x: 3 }}
                  onClick={nextSong}
                  style={{
                    width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: '50%', outline: 'none', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 7l7 5-7 5V7zM4 7l7 5-7 5V7z" />
                  </svg>
                </motion.button>

                {/* Repeat */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={cycleRepeat}
                  style={{
                    width: 42, height: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', gap: 3, position: 'relative',
                  }}
                >
                  <motion.div animate={{
                    color: repeat !== 'off' ? '#e879f9' : 'rgba(255,255,255,0.38)',
                    filter: repeat !== 'off' ? 'drop-shadow(0 0 8px rgba(232,121,249,0.9))' : 'none',
                  }} transition={{ duration: 0.2 }}>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
                    </svg>
                  </motion.div>
                  {repeat !== 'off' && <motion.div style={{ width: 4, height: 4, borderRadius: '50%', background: 'linear-gradient(135deg, #e879f9, #f472b6)' }} />}
                  {repeat === 'one' && (
                    <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 8, fontFamily: "'DM Mono', monospace", color: '#e879f9', fontWeight: 700 }}>1</span>
                  )}
                </motion.button>
              </div>

              {/* ── Like | Waveform | Lyrics ── */}
              <motion.div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, gap: 8 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}
              >
                {/* Like button */}
                <motion.button
                  whileTap={{ scale: 0.65 }}
                  onClick={() => toggleLike(currentSong.id, currentSong)}
                  style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLiked ? 'rgba(244,114,182,0.18)' : 'rgba(255,255,255,0.07)',
                    border: isLiked ? '1px solid rgba(244,114,182,0.5)' : '1px solid rgba(255,255,255,0.12)',
                    outline: 'none', cursor: 'pointer',
                    boxShadow: isLiked ? '0 0 18px rgba(244,114,182,0.3)' : 'none',
                  }}
                >
                  <motion.svg width="20" height="20" viewBox="0 0 24 24"
                    animate={isLiked ? { scale: [1, 1.6, 1], rotate: [0, -12, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <path
                      d="M12 21s-6.716-4.35-9.193-8.014C1.38 10.88 2.1 7.9 4.71 6.58c2.027-1.026 4.444-.43 5.934 1.22A4.79 4.79 0 0112 9.36a4.79 4.79 0 011.356-1.56c1.49-1.65 3.907-2.246 5.934-1.22 2.61 1.32 3.33 4.3 1.903 6.406C18.716 16.65 12 21 12 21z"
                      fill={isLiked ? '#f472b6' : 'none'}
                      stroke={isLiked ? '#f472b6' : 'rgba(255,255,255,0.45)'}
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </motion.svg>
                </motion.button>

                {/* Waveform */}
                <div style={{ flex: 1 }}>
                  <Waveform getFrequencyData={getFrequencyData} isPlaying={isPlaying} barCount={38} />
                </div>

                {/* Heartbeat EKG button — opens lyrics */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleLyricsPanel}
                  title="Lyrics"
                  style={{
                    width: 88, height: 44, borderRadius: 999, cursor: 'pointer',
                    border: '1px solid rgba(236,72,153,0.5)',
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.18) 100%)',
                    outline: 'none', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 18px rgba(236,72,153,0.3), 0 0 28px rgba(139,92,246,0.18)',
                  }}
                >
                  <svg viewBox="0 0 88 28" width="76" height="26">
                    {/* glow layer */}
                    <motion.path
                      d="M0,14 L20,14 L26,11 L31,5 L36,23 L39,1 L44,27 L49,14 L88,14"
                      fill="none" stroke="rgba(236,72,153,0.6)" strokeWidth="5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ filter: 'blur(4px)' }}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: [0, 1, 1, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.44, 0.66, 1] }}
                    />
                    {/* sharp line */}
                    <motion.path
                      d="M0,14 L20,14 L26,11 L31,5 L36,23 L39,1 L44,27 L49,14 L88,14"
                      fill="none" stroke="#f472b6" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: [0, 1, 1, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.44, 0.66, 1] }}
                    />
                  </svg>
                </motion.button>
              </motion.div>

              {/* ── Add to playlist ── */}
              <motion.div
                style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
              >
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  disabled={!customPlaylists.length}
                  style={{
                    flex: 1, height: 36, borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
                    color: customPlaylists.length ? '#fff' : 'rgba(255,255,255,0.35)', padding: '0 12px', minWidth: 140, fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {customPlaylists.length === 0 ? (
                    <option value="">No playlist</option>
                  ) : (
                    customPlaylists.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))
                  )}
                </select>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToPlaylist}
                  disabled={!selectedPlaylistId || !customPlaylists.length}
                  style={{
                    height: 36, borderRadius: 999, padding: '0 16px', cursor: selectedPlaylistId ? 'pointer' : 'default',
                    border: `1px solid ${selectedPlaylistId ? 'rgba(236,72,153,0.48)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlaylistId ? 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(236,72,153,0.18) 100%)' : 'rgba(255,255,255,0.04)',
                    color: selectedPlaylistId ? '#f472b6' : 'rgba(255,255,255,0.3)',
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontFamily: "'DM Mono', monospace", outline: 'none',
                  }}
                >
                  + Add
                </motion.button>
                <AnimatePresence>
                  {playlistAddStatus && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#34d399' }}
                    >
                      {playlistAddStatus}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <LyricsPanel lyrics={lyrics} onSeek={seek} />
    </>
  );
};

export default NowPlaying;
