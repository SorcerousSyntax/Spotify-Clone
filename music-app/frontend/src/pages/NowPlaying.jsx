import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';
import Waveform from '../components/Waveform';
import LyricsPanel from '../components/LyricsPanel';
import { decodeSongTitle } from '../lib/text';

const ScrollingTitle = ({ text, fontSize }) => {
  const safeText = decodeSongTitle(text || '');

  return (
    <div
      style={{
        overflow: 'hidden',
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
  const seek = usePlayerStore((s) => s.playerControls.seek);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);

  const { rgbaString } = useColorExtract(currentSong?.album_art_url);

  const [lyrics, setLyrics] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [offlineStatus, setOfflineStatus] = useState('idle'); // idle | saving | saved | error
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle | downloading | done | error
  const progressBarRef = useRef(null);
  const isCompact = typeof window !== 'undefined' && window.innerWidth < 900;

  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

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

  const streamUrl = currentSong?.stream_url
    || (currentSong?.id ? `/api/songs/${currentSong.id}/stream` : currentSong?.r2_url)
    || '';

  useEffect(() => {
    let cancelled = false;

    if (!streamUrl || !window.caches) {
      setOfflineStatus('idle');
      return;
    }

    (async () => {
      try {
        const cache = await caches.open('saved-songs-v1');
        const hit = await cache.match(streamUrl);
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
  }, [streamUrl, currentSong?.id]);

  const saveOffline = async () => {
    if (!streamUrl || offlineStatus === 'saving') return;

    if (!window.caches) {
      setOfflineStatus('error');
      return;
    }

    try {
      setOfflineStatus('saving');
      const cache = await caches.open('saved-songs-v1');
      const response = await fetch(streamUrl);
      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }
      await cache.put(streamUrl, response.clone());
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
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100dvh', paddingBottom: 24 }}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 18%, ${rgbaString(0.18)} 0%, transparent 58%)`,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, width: 'min(820px, calc(100vw - 24px))', margin: '0 auto', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ←
            </button>

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase' }}>
              Now Playing
            </p>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={saveOffline}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  minWidth: 88,
                  height: 36,
                  padding: '0 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
                title="Save for offline play"
              >
                {offlineStatus === 'saved' ? 'Saved' : offlineStatus === 'saving' ? 'Saving...' : 'Offline'}
              </button>
              <button
                onClick={downloadToDevice}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  minWidth: 88,
                  height: 36,
                  padding: '0 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
                title="Download to your device"
              >
                {downloadStatus === 'downloading' ? 'Downloading...' : downloadStatus === 'done' ? 'Done' : 'Download'}
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              padding: 18,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'minmax(240px, 360px) 1fr', gap: 20, alignItems: 'center' }}>
              <div style={{ margin: '0 auto', width: '100%', maxWidth: 340 }}>
                <img
                  src={currentSong.album_art_url || '/placeholder-album.svg'}
                  alt={decodeSongTitle(currentSong.title || '')}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 18,
                    objectFit: 'cover',
                    boxShadow: '0 20px 70px rgba(0,0,0,0.55)',
                  }}
                />
              </div>

              <div>
                <ScrollingTitle text={safeTitle} fontSize={isCompact ? 56 : 52} />
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'rgba(255,255,255,0.66)', marginTop: 8 }}>
                  {currentSong.artist}
                </p>

                <div style={{ marginTop: 16, marginBottom: 10 }}>
                  <div
                    ref={progressBarRef}
                    style={{
                      position: 'relative',
                      height: 6,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.14)',
                      cursor: 'pointer',
                    }}
                    onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                    onMouseMove={(e) => isDragging && handleProgressDrag(e)}
                    onMouseUp={handleProgressEnd}
                    onMouseLeave={handleProgressEnd}
                    onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e); }}
                    onTouchMove={(e) => isDragging && handleProgressDrag(e)}
                    onTouchEnd={handleProgressEnd}
                  >
                    <div style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 999, background: '#fff' }} />
                    {isDragging && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          left: `calc(${progressPercent}% - 14px)`,
                          top: -13,
                          width: 28,
                          height: 12,
                          borderTop: '2px solid rgba(255,255,255,0.85)',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: `calc(${progressPercent}% - 7px)`,
                        transform: 'translateY(-50%)',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#fff',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{formatTime(currentProgress)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>-{formatTime(Math.max(0, duration - currentProgress))}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <motion.button
                    onClick={toggleShuffle}
                    title="Shuffle"
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: shuffle ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ display: 'block' }}>
                      <path d="M16 3h5v5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 20l7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 3l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 4l5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 21h5v-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={prevSong}
                    title="Previous"
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                      <path d="M11 7l-7 5 7 5V7zM20 7l-7 5 7 5V7z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={togglePlay}
                    title={isPlaying ? 'Pause' : 'Play'}
                    whileHover={{ y: -2, scale: 1.04 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isPlaying ? { boxShadow: '0 12px 30px rgba(255,255,255,0.22)' } : { boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: '#fff',
                      color: '#000',
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    {isPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={nextSong}
                    title="Next"
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                      <path d="M13 7l7 5-7 5V7zM4 7l7 5-7 5V7z" />
                    </svg>
                  </motion.button>

                  <motion.button
                    onClick={cycleRepeat}
                    title={`Repeat: ${repeat}`}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: repeat !== 'off' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ display: 'block' }}>
                      <path d="M17 1l4 4-4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 11V9a4 4 0 014-4h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 23l-4-4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 13v2a4 4 0 01-4 4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {repeat === 'one' && (
                      <span style={{ position: 'absolute', top: 1, right: 3, fontSize: 10, color: '#fff' }}>1</span>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => toggleLike(currentSong.id, currentSong)}
                    title={isLiked ? 'Unlike' : 'Like'}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: isLiked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                      <path d="M12 21s-6.716-4.35-9.193-8.014C1.38 10.88 2.1 7.9 4.71 6.58c2.027-1.026 4.444-.43 5.934 1.22A4.79 4.79 0 0112 9.36a4.79 4.79 0 011.356-1.56c1.49-1.65 3.907-2.246 5.934-1.22 2.61 1.32 3.33 4.3 1.903 6.406C18.716 16.65 12 21 12 21z" strokeWidth="1.8" />
                    </svg>
                  </motion.button>
                </div>

                <div style={{ marginTop: 16 }}>
                  <Waveform getFrequencyData={getFrequencyData} isPlaying={isPlaying} barCount={44} />
                </div>

                <button
                  onClick={toggleLyricsPanel}
                  style={{
                    marginTop: 12,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Lyrics
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <LyricsPanel lyrics={lyrics} onSeek={seek} />
    </>
  );
};

export default NowPlaying;
