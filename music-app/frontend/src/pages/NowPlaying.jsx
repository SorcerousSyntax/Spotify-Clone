import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

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
  const seek = usePlayerStore((s) => s.playerControls.seek);

  const [activeTab, setActiveTab] = useState('PLAY'); // PLAY or LYRICS
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: '#000',
      color: '#fff',
      padding: '25px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="glass flex-center"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </motion.button>
        
        <div className="glass" style={{ padding: 4, display: 'flex', gap: 4, borderRadius: 30 }}>
          {['PLAY', 'LYRICS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                borderRadius: 25,
                border: 'none',
                fontSize: 10,
                fontWeight: 900,
                background: activeTab === tab ? 'var(--pink-hot)' : 'transparent',
                color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s var(--ease-main)',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="glass flex-center"
          style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}
        >
          ⋮
        </motion.button>
      </header>

      {/* Album Art Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'PLAY' ? (
            <motion.div
              key="art"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ position: 'relative', width: 'min(320px, 80vw)', aspectRatio: '1/1' }}
            >
              {/* Rotating Vinyl Background */}
              <div className={`animate-vinyl ${!isPlaying ? 'animate-vinyl-paused' : ''}`} style={{
                position: 'absolute',
                inset: -20,
                background: 'conic-gradient(#111, #000, #111, #000, #111)',
                borderRadius: '50%',
                zIndex: -1,
                boxShadow: '0 0 50px rgba(0,0,0,0.8)'
              }}>
                <div style={{ position: 'absolute', inset: '30%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: '45%', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              </div>

              {/* Progress Arc */}
              <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: -10, width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', transform: 'rotate(-90deg)' }}>
                <circle
                  cx="50" cy="50" r={radius}
                  fill="none"
                  stroke="var(--pink-hot)"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>

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

              {/* Time Label */}
              <div style={{
                position: 'absolute',
                bottom: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 14,
                fontWeight: 900,
                color: 'rgba(255,255,255,0.5)'
              }}>
                {formatTime(progress)}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="lyrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ width: '100%', height: '100%', overflowY: 'auto' }}
              className="no-scrollbar"
            >
              <p style={{ fontSize: 24, fontWeight: 900, textAlign: 'center', lineHeight: 1.5, color: 'rgba(255,255,255,0.3)' }}>
                {/* Placeholder for lyrics integration */}
                LYRICS ARE COMING SOON...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
            onClick={() => toggleLike(currentSong.id, currentSong)}
            style={{ background: 'none', border: 'none', color: isLiked ? 'var(--pink-hot)' : '#fff', fontSize: 28, cursor: 'pointer' }}
          >
            {isLiked ? '♥' : '♡'}
          </motion.button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 40 }}>
        <button
          onClick={() => toggleLike(currentSong.id, currentSong)}
          className="glass flex-center"
          style={{
            flex: 1, height: 44, fontSize: 9, fontWeight: 900, border: 'none',
            background: isLiked ? 'var(--pink-hot)' : 'var(--glass-bg)',
            color: isLiked ? '#000' : '#fff'
          }}
        >
          {isLiked ? 'SAVED' : 'SAVE'}
        </button>
        <button 
          onClick={() => toggleOffline(currentSong)}
          className="glass flex-center" 
          disabled={usePlayerStore.getState().downloadingIds.has(currentSong.id)}
          style={{ 
            flex: 1, height: 44, fontSize: 9, fontWeight: 900, border: 'none',
            background: usePlayerStore((s) => s.offlineSongIds).has(currentSong.id) ? 'var(--pink-hot)' : 'var(--glass-bg)',
            color: usePlayerStore((s) => s.offlineSongIds).has(currentSong.id) ? '#000' : '#fff'
          }}
        >
          {usePlayerStore((s) => s.downloadingIds).has(currentSong.id) ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          ) : usePlayerStore((s) => s.offlineSongIds).has(currentSong.id) ? 'SAVED' : 'DOWNLOAD'}
        </button>
        <button className="glass flex-center" style={{ flex: 1, height: 44, fontSize: 9, fontWeight: 900, border: 'none' }}>
          SHARE
        </button>
      </div>

      {/* Playback Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <button
          onClick={toggleShuffle}
          className="font-mono"
          style={{ background: 'none', border: 'none', color: shuffle ? 'var(--pink-hot)' : 'rgba(255,255,255,0.5)', fontSize: 10, cursor: 'pointer' }}
        >
          SHUFFLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>⏮</motion.button>
          
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

          <motion.button whileTap={{ scale: 0.8 }} onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>⏭</motion.button>
        </div>

        <button
          onClick={cycleRepeat}
          className="font-mono"
          style={{ background: 'none', border: 'none', color: repeat !== 'off' ? 'var(--pink-hot)' : 'rgba(255,255,255,0.5)', fontSize: 10, cursor: 'pointer' }}
        >
          {repeat.toUpperCase()}
        </button>
      </div>

      {/* Progress Bar (Bottom) */}
      <div style={{ padding: '0 10px' }}>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            seek?.(pct * duration);
          }}
          style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer' }}
        >
          <motion.div
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              background: 'var(--pink-hot)', borderRadius: 2,
              width: `${progressPercent}%`
            }}
          />
          <motion.div
            style={{
              position: 'absolute', top: '50%', left: `${progressPercent}%`,
              width: 12, height: 12, borderRadius: '50%', background: '#fff',
              transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px rgba(255,45,120,0.5)'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span className="font-mono" style={{ fontSize: 9, opacity: 0.5 }}>{formatTime(progress)}</span>
          <span className="font-mono" style={{ fontSize: 9, opacity: 0.5 }}>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
