import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import Waveform from '../components/Waveform';
import PlaylistSelector from '../components/PlaylistSelector';

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
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const isOffline = usePlayerStore((s) => s.isOffline);
  const downloadingIds = usePlayerStore((s) => s.downloadingIds);
  const seek = usePlayerStore((s) => s.playerControls.seek);

  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const progressBarRef = useRef(null);

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // Seek logic
  const handleSeek = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    let clientX;
    if (e.type === 'touchstart' || e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = x / rect.width;
    seek?.(pct * duration);
  };

  // Long press logic
  const longPressTimer = useRef(null);
  const handleLongPressStart = (type) => {
    longPressTimer.current = setInterval(() => {
      if (type === 'next') {
        seek?.(Math.min(progress + 10, duration));
      } else {
        seek?.(Math.max(progress - 10, 0));
      }
    }, 200);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const offlineStatus = isOffline(currentSong.id);
  const isDownloading = downloadingIds.has(currentSong.id);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      color: '#fff',
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="glass flex-center"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </motion.button>
        
        <h2 className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.5 }}>NOW PLAYING</h2>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleOffline(currentSong)}
          className="glass flex-center"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >
          {isDownloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 16, height: 16, border: '2px solid var(--pink-hot)', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          ) : offlineStatus ? (
            <span style={{ color: 'var(--pink-hot)' }}>✓</span>
          ) : (
            <span>📥</span>
          )}
        </motion.button>
      </header>

      {/* Album Art Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'relative', width: 'min(280px, 70vw)', aspectRatio: '1/1' }}
        >
          {/* Rotating Vinyl Background */}
          <div className={`animate-vinyl ${!isPlaying ? 'animate-vinyl-paused' : ''}`} style={{
            position: 'absolute',
            inset: -15,
            background: 'conic-gradient(#111, #000, #111, #000, #111)',
            borderRadius: '50%',
            zIndex: -1,
            boxShadow: '0 0 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{ position: 'absolute', inset: '30%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          </div>

          {/* Main Circular Art */}
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #000',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <img src={currentSong.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          </div>
        </motion.div>

        {/* Waveform */}
        <Waveform />
      </div>

      {/* Song Info */}
      <div style={{ padding: '0 10px', marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {decodeSongTitle(currentSong.title).toUpperCase()}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {currentSong.artist.toUpperCase()}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowPlaylistSelector(true)}
            className="glass flex-center"
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}
          >
            +
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: '0 10px', marginBottom: 40 }}>
        <div
          ref={progressBarRef}
          onMouseDown={handleSeek}
          onTouchStart={handleSeek}
          onTouchMove={handleSeek}
          style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, cursor: 'pointer' }}
        >
          <motion.div
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              background: 'var(--pink-hot)', borderRadius: 3,
              width: `${progressPercent}%`
            }}
          />
          <motion.div
            style={{
              position: 'absolute', top: '50%', left: `${progressPercent}%`,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transform: 'translate(-50%, -50%)', boxShadow: '0 0 15px rgba(255,45,120,0.8)'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span className="font-mono" style={{ fontSize: 10, opacity: 0.5 }}>{formatTime(progress)}</span>
          <span className="font-mono" style={{ fontSize: 10, opacity: 0.5 }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'env(safe-area-inset-bottom, 20px)' }}>
        <button
          onClick={toggleShuffle}
          style={{ background: 'none', border: 'none', color: shuffle ? 'var(--pink-hot)' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
        >
          SHUFFLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={prevSong}
            onMouseDown={() => handleLongPressStart('prev')}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart('prev')}
            onTouchEnd={handleLongPressEnd}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}
          >
            ⏮
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className="flex-center pink-glow"
            style={{
              width: 74, height: 74, borderRadius: '50%', background: 'var(--pink-hot)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={nextSong}
            onMouseDown={() => handleLongPressStart('next')}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart('next')}
            onTouchEnd={handleLongPressEnd}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}
          >
            ⏭
          </motion.button>
        </div>

        <button
          onClick={cycleRepeat}
          style={{ background: 'none', border: 'none', color: repeat !== 'off' ? 'var(--pink-hot)' : 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 900, cursor: 'pointer' }}
        >
          {repeat.toUpperCase()}
        </button>
      </div>

      <AnimatePresence>
        {showPlaylistSelector && (
          <PlaylistSelector song={currentSong} onClose={() => setShowPlaylistSelector(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NowPlaying;
