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

const ScrollingTitle = ({ text, fontSize }) => {
  const safeText = decodeSongTitle(text || '');

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
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          gap: 36,
        }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 11,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <span style={{ fontSize, lineHeight: 0.95, letterSpacing: '0.03em', color: '#fff' }}>
          {safeText}
        </span>
        <span style={{ fontSize, lineHeight: 0.95, letterSpacing: '0.03em', color: '#fff' }}>
          {safeText}
        </span>
      </motion.div>
    </div>
  );
};

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
          <p style={{ fontFamily: "'Bebas Neue', system-ui", fontSize: 36, color: '#fff', letterSpacing: '0.05em' }}>
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

  return (
    <>
      {/* Full-bleed ambient background — multi-layer colour wash */}
      <motion.div
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        animate={{
          background: [
            `radial-gradient(ellipse at 30% 20%, ${accentA(0.22)} 0%, transparent 55%)`,
            `radial-gradient(ellipse at 70% 80%, ${accentA(0.18)} 0%, transparent 55%)`,
          ].join(', '),
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100dvh', paddingBottom: 32 }}>
        {/* ── Top bar ── */}
        <div style={{ position: 'relative', zIndex: 2, width: 'min(820px, calc(100vw - 24px))', margin: '0 auto', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 18 }}>
            {/* Back */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(-1)}
              style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </motion.button>

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Now Playing
            </p>

            {/* Offline + Download */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={saveOffline}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontSize: 10,
                  fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: offlineStatus === 'saved' ? `1px solid ${accentA(0.5)}` : '1px solid rgba(255,255,255,0.18)',
                  background: offlineStatus === 'saved' ? accentA(0.18) : 'rgba(255,255,255,0.06)',
                  color: offlineStatus === 'saved' ? accent : '#fff',
                }}
              >
                {offlineStatus === 'saved' ? '✓ Saved' : offlineStatus === 'saving' ? '...' : 'Offline'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={downloadToDevice}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontSize: 10,
                  fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff',
                }}
              >
                {downloadStatus === 'downloading' ? '...' : downloadStatus === 'done' ? '✓' : '↓'}
              </motion.button>
            </div>
          </div>

          {/* ── Album Art (3D tilt card) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <motion.div
              {...tiltHandlers}
              key={currentSong.id}
              initial={{ opacity: 0, scale: 0.88, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              style={{
                width: 'min(88vw, 310px)',
                aspectRatio: '1',
                borderRadius: 22,
                position: 'relative',
                willChange: 'transform',
                transformStyle: 'preserve-3d',
                marginBottom: 10,
              }}
            >
              {/* Floating ambient glow behind art */}
              <motion.div
                style={{ position: 'absolute', inset: -18, borderRadius: 38, filter: 'blur(28px)', zIndex: 0, pointerEvents: 'none' }}
                animate={{ background: accentA(0.45), opacity: isPlaying ? 1 : 0.45 }}
                transition={{ duration: 1.2 }}
              />

              {/* Playing halo ring */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    style={{ position: 'absolute', inset: -6, borderRadius: 28, border: `1.5px solid ${accentA(0.5)}`, zIndex: 1, pointerEvents: 'none' }}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.03, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </AnimatePresence>

              <img
                src={currentSong.album_art_url || '/placeholder-album.svg'}
                alt={decodeSongTitle(currentSong.title || '')}
                style={{
                  width: '100%', height: '100%', borderRadius: 22, objectFit: 'cover',
                  boxShadow: `0 28px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)`,
                  position: 'relative', zIndex: 2, display: 'block',
                }}
              />
            </motion.div>

            {/* ── Title + Artist ── */}
            <div style={{ width: 'min(88vw, 310px)', marginBottom: 4 }}>
              <ScrollingTitle text={safeTitle} fontSize={26} />
              <motion.p
                key={currentSong.id + '-artist'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.52)', marginTop: 4 }}
              >
                {currentSong.artist}
              </motion.p>
            </div>

            {/* ── Progress Bar ── */}
            <div style={{ width: 'min(88vw, 310px)', marginTop: 14, marginBottom: 6 }}>
              <div
                ref={progressBarRef}
                style={{ position: 'relative', height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
                onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                onMouseMove={(e) => isDragging && handleProgressDrag(e)}
                onMouseUp={handleProgressEnd}
                onMouseLeave={handleProgressEnd}
                onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                onTouchMove={(e) => isDragging && handleProgressDrag(e)}
                onTouchEnd={handleProgressEnd}
              >
                {/* Filled track */}
                <motion.div
                  style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 999 }}
                  animate={{ width: `${progressPercent}%`, background: accent, boxShadow: `0 0 8px ${accentA(0.7)}` }}
                  transition={{ duration: 0.35, ease: 'linear' }}
                />
                {/* Thumb */}
                <motion.div
                  style={{
                    position: 'absolute', top: '50%',
                    left: `${progressPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    width: isDragging ? 18 : 14, height: isDragging ? 18 : 14,
                    borderRadius: '50%',
                    zIndex: 2,
                    transition: 'width 0.15s, height 0.15s',
                  }}
                  animate={{ background: accent, boxShadow: `0 0 ${isDragging ? 14 : 8}px ${accentA(0.8)}` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                  {formatTime(currentProgress)}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                  -{formatTime(Math.max(0, duration - currentProgress))}
                </span>
              </div>
            </div>

            {/* ── Main Controls ── */}
            <div style={{ width: 'min(92vw, 340px)', marginTop: 8 }}>
              {/* Top row: Shuffle | Prev | Play | Next | Repeat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0 }}>

                {/* Shuffle */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={toggleShuffle}
                  title="Shuffle"
                  style={{
                    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', position: 'relative',
                  }}
                >
                  <motion.div
                    animate={{ color: shuffle ? accent : 'rgba(255,255,255,0.4)', filter: shuffle ? `drop-shadow(0 0 6px ${accentA(0.8)})` : 'none' }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 3h5v5M4 20l7-7M21 3l-8 8M4 4l5 5M16 21h5v-5" />
                      <path d="M21 16l-7-5" strokeOpacity="0.6" />
                    </svg>
                  </motion.div>
                  {shuffle && <motion.div style={{ position: 'absolute', bottom: 7, width: 4, height: 4, borderRadius: '50%' }} animate={{ background: accent }} />}
                </motion.button>

                {/* Prev */}
                <motion.button
                  whileTap={{ scale: 0.88, x: -2 }}
                  onClick={prevSong}
                  title="Previous"
                  style={{
                    width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: '50%', outline: 'none', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 7l-7 5 7 5V7zM20 7l-7 5 7 5V7z" />
                  </svg>
                </motion.button>

                {/* Play / Pause — main focal button */}
                <motion.button
                  whileTap={{ scale: 0.91 }}
                  onClick={togglePlay}
                  title={isPlaying ? 'Pause' : 'Play'}
                  style={{
                    position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {/* Outer pulsing ring */}
                  <AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1.5px solid ${accentA(0.5)}`, pointerEvents: 'none' }}
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Second ring, offset timing */}
                  <AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `1px solid ${accentA(0.3)}`, pointerEvents: 'none' }}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.18, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Button disc */}
                  <motion.div
                    style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    animate={{
                      background: accent,
                      boxShadow: isPlaying
                        ? `0 0 0 1px ${accentA(0.5)}, 0 8px 32px ${accentA(0.55)}, 0 0 60px ${accentA(0.2)}, inset 0 1px 0 rgba(255,255,255,0.25)`
                        : `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isPlaying ? (
                        <motion.svg key="pause" width="24" height="24" fill="#000" viewBox="0 0 24 24"
                          initial={{ scale: 0.4, opacity: 0, rotate: -15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0, rotate: 15 }}
                          transition={{ duration: 0.18 }}>
                          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                        </motion.svg>
                      ) : (
                        <motion.svg key="play" width="26" height="26" fill="#000" viewBox="0 0 24 24" style={{ marginLeft: 3 }}
                          initial={{ scale: 0.4, opacity: 0, rotate: 15 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0, rotate: -15 }}
                          transition={{ duration: 0.18 }}>
                          <path d="M8 5v14l11-7z" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>

                {/* Next */}
                <motion.button
                  whileTap={{ scale: 0.88, x: 2 }}
                  onClick={nextSong}
                  title="Next"
                  style={{
                    width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)',
                    borderRadius: '50%', outline: 'none', cursor: 'pointer', color: '#fff',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 7l7 5-7 5V7zM4 7l7 5-7 5V7z" />
                  </svg>
                </motion.button>

                {/* Repeat */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={cycleRepeat}
                  title={`Repeat: ${repeat}`}
                  style={{
                    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', position: 'relative',
                  }}
                >
                  <motion.div
                    animate={{ color: repeat !== 'off' ? accent : 'rgba(255,255,255,0.4)', filter: repeat !== 'off' ? `drop-shadow(0 0 6px ${accentA(0.8)})` : 'none' }}
                    transition={{ duration: 0.25 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
                    </svg>
                  </motion.div>
                  {repeat !== 'off' && <motion.div style={{ position: 'absolute', bottom: 7, width: 4, height: 4, borderRadius: '50%' }} animate={{ background: accent }} />}
                  {repeat === 'one' && (
                    <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, fontFamily: "'DM Mono', monospace", color: accent, fontWeight: 700, lineHeight: 1 }}>1</span>
                  )}
                </motion.button>
              </div>

              {/* Bottom row: Like | Waveform | Lyrics */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 8 }}>
                {/* Like */}
                <motion.button
                  whileTap={{ scale: 0.7 }}
                  onClick={() => toggleLike(currentSong.id, currentSong)}
                  title={isLiked ? 'Unlike' : 'Like'}
                  style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLiked ? 'rgba(255,79,109,0.18)' : 'rgba(255,255,255,0.07)',
                    border: isLiked ? '1px solid rgba(255,79,109,0.45)' : '1px solid rgba(255,255,255,0.12)',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  <motion.svg width="20" height="20" viewBox="0 0 24 24"
                    animate={isLiked ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.24 }}
                  >
                    <path
                      d="M12 21s-6.716-4.35-9.193-8.014C1.38 10.88 2.1 7.9 4.71 6.58c2.027-1.026 4.444-.43 5.934 1.22A4.79 4.79 0 0112 9.36a4.79 4.79 0 011.356-1.56c1.49-1.65 3.907-2.246 5.934-1.22 2.61 1.32 3.33 4.3 1.903 6.406C18.716 16.65 12 21 12 21z"
                      fill={isLiked ? '#ff4f6d' : 'none'}
                      stroke={isLiked ? '#ff4f6d' : 'rgba(255,255,255,0.5)'}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </motion.button>

                {/* Waveform — expands in the middle */}
                <div style={{ flex: 1 }}>
                  <Waveform getFrequencyData={getFrequencyData} isPlaying={isPlaying} barCount={40} />
                </div>

                {/* Lyrics */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={toggleLyricsPanel}
                  style={{
                    height: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', color: '#fff', outline: 'none',
                  }}
                >
                  Lyrics
                </motion.button>
              </div>

              {/* Add to playlist */}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  disabled={!customPlaylists.length}
                  style={{
                    flex: 1, height: 36, borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)',
                    color: '#fff', padding: '0 12px', minWidth: 140, fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {customPlaylists.length === 0 ? (
                    <option value="">No playlist found</option>
                  ) : (
                    customPlaylists.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))
                  )}
                </select>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleAddToPlaylist}
                  disabled={!selectedPlaylistId || !customPlaylists.length}
                  style={{
                    height: 36, borderRadius: 999, padding: '0 14px', cursor: selectedPlaylistId ? 'pointer' : 'default',
                    border: `1px solid ${selectedPlaylistId ? accentA(0.4) : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlaylistId ? accentA(0.15) : 'rgba(255,255,255,0.04)',
                    color: selectedPlaylistId ? accent : 'rgba(255,255,255,0.4)',
                    fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                    fontFamily: "'DM Mono', monospace", outline: 'none',
                  }}
                >
                  + Add
                </motion.button>
                {playlistAddStatus && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: accent }}
                  >
                    {playlistAddStatus}
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LyricsPanel lyrics={lyrics} onSeek={seek} />
    </>
  );
};

export default NowPlaying;
