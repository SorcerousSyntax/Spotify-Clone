import React, { useState, useRef, useCallback, useEffect } from 'react';
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

  const [activeTab, setActiveTab] = useState('Play'); // Play or Lyrics

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', overflow: 'hidden', color: '#fff', padding: 25 }}>
      {/* Top Toggle & Close */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 30, padding: 4, display: 'flex', gap: 5 }}>
          {['Play', 'Lyrics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 25px', borderRadius: 25, border: 'none', fontSize: 13, fontWeight: 600,
                background: activeTab === tab ? '#ff2d78' : 'transparent',
                color: activeTab === tab ? '#000' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease', cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>⋮</button>
      </header>

      {/* Circular Art with Progress Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 50, position: 'relative' }}>
        <div style={{ width: 'min(300px, 80vw)', aspectRatio: '1/1', position: 'relative' }}>
          {/* Progress SVG Ring */}
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: -15, transform: 'rotate(-90deg)', width: 'calc(100% + 30px)', height: 'calc(100% + 30px)' }}>
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
            <motion.circle
              cx="50" cy="50" r="48" fill="none" stroke="#ff2d78" strokeWidth="1.5"
              strokeDasharray="301.59"
              animate={{ strokeDashoffset: 301.59 - (301.59 * progressPercent) / 100 }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Main Art */}
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '10px solid #111', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <img src={currentSong.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="art" />
          </div>

          {/* Time Badge */}
          <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', background: '#000', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, fontWeight: 700 }}>
            {formatTime(progress)}
          </div>
        </div>
      </div>

      {/* Song Info */}
      <div style={{ marginBottom: 40, padding: '0 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(currentSong.title)}</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{currentSong.artist}</p>
          </div>
          <button 
            onClick={() => toggleLike(currentSong.id, currentSong)}
            style={{ background: 'none', border: 'none', fontSize: 28, color: likedSongIds.has(currentSong.id) ? '#ff2d78' : '#fff', cursor: 'pointer' }}
          >
            {likedSongIds.has(currentSong.id) ? '♥' : '♡'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 50 }}>
        <button 
          onClick={() => toggleLike(currentSong.id, currentSong)}
          className="pill-btn glass" 
          style={{ 
            flex: 1, height: 50, 
            background: likedSongIds.has(currentSong.id) ? '#ff2d78' : 'rgba(255,255,255,0.05)', 
            color: likedSongIds.has(currentSong.id) ? '#000' : '#fff', 
            fontSize: 10, fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' 
          }}
        >
          {likedSongIds.has(currentSong.id) ? 'SAVED' : 'SAVE'}
        </button>
        <button className="pill-btn glass" style={{ flex: 1, height: 50, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 10, fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>DOWNLOAD</button>
        <button className="pill-btn glass" style={{ flex: 1, height: 50, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 10, fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>SHARE</button>
      </div>

      {/* Playback Controls */}
      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
        <button onClick={toggleShuffle} style={{ background: 'none', border: 'none', color: shuffle ? '#ff2d78' : '#fff', opacity: 0.8, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>SHUFFLE</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}>⏮</motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            style={{ 
              width: 85, height: 85, borderRadius: '50%', 
              background: '#fff', 
              border: 'none', display: 'grid', placeItems: 'center', 
              color: '#000', fontSize: 24, 
              boxShadow: '0 15px 40px rgba(255, 45, 120, 0.3)',
              border: '4px solid #ff2d78'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>

          <motion.button whileTap={{ scale: 0.8 }} onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}>⏭</motion.button>
        </div>

        <button onClick={cycleRepeat} style={{ background: 'none', border: 'none', color: repeat !== 'off' ? '#ff2d78' : '#fff', opacity: 0.8, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>REPEAT</button>
      </footer>
    </div>
  );
};

export default NowPlaying;
