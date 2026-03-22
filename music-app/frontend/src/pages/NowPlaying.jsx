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
  
  // Like functionality
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const titleRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (titleRef.current) {
      setIsTitleOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [currentSong?.title]);

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  // Progress calculations
  const progressRatio = duration > 0 ? (progress / duration) : 0;
  
  // Circular progress config
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressRatio);

  // Dot position - starts at TOP (12 o'clock = -90 degrees):
  const angle = (progressRatio * 2 * Math.PI) - (Math.PI / 2);
  const dotX = centerX + radius * Math.cos(angle);
  const dotY = centerY + radius * Math.sin(angle);

  // Seek logic for circular arc
  const handleCircularSeek = (e) => {
    if (!duration) return;
    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    
    const artElement = e.currentTarget;
    const rect = artElement.getBoundingClientRect();
    const cX = rect.left + rect.width / 2;
    const cY = rect.top + rect.height / 2;
    
    const dx = clientX - cX;
    const dy = clientY - cY;
    
    let clickAngle = Math.atan2(dy, dx) + Math.PI / 2;
    if (clickAngle < 0) clickAngle += 2 * Math.PI;
    
    const pct = clickAngle / (2 * Math.PI);
    seek?.(pct * duration);
  };

  const handleDragStart = (e) => {
    isDragging.current = true;
    handleCircularSeek(e);
  };
  const handleDragMove = (e) => {
    if (isDragging.current) handleCircularSeek(e);
  };
  const handleDragEnd = () => {
    isDragging.current = false;
  };

  const offlineStatus = isOffline(currentSong.id);
  const isDownloading = downloadingIds.has(currentSong.id);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100dvh',
      touchAction: 'none'
    }}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%) }
          100% { transform: translateX(-100%) }
        }
        .marquee-animation {
          display: inline-block;
          animation: marquee 8s linear infinite;
        }
        .marquee-animation:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. TOP BAR - 60px */}
      <header style={{ 
        height: 60, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 20px',
        flexShrink: 0
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="glass flex-center"
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >
          ✕
        </motion.button>
        
        <h2 className="font-mono" style={{ fontSize: 12, letterSpacing: '0.2em', fontWeight: 900, color: 'rgba(255,255,255,0.8)' }}>NOW PLAYING</h2>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleOffline(currentSong)}
          className="glass flex-center"
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
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

      {/* 2. ALBUM ART + CIRCULAR PROGRESS - Flexible space */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        minHeight: 0,
        padding: '10px 0'
      }}>
        <div 
          style={{ 
            position: 'relative', 
            width: 'min(60vw, 260px)', 
            aspectRatio: '1/1', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            cursor: 'pointer',
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Circular SVG Progress */}
          <svg 
            viewBox={`0 0 ${size} ${size}`} 
            style={{ 
              position: 'absolute', 
              width: '145%', 
              height: '145%', 
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {/* Background Track */}
            <circle
              cx={centerX} cy={centerY} r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
            />
            {/* Progress Arc */}
            <motion.circle
              cx={centerX} cy={centerY} r={radius}
              fill="none"
              stroke="#ff2d78"
              strokeWidth="4"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
              strokeLinecap="round"
              transform={`rotate(-90 ${centerX} ${centerY})`}
              style={{ filter: 'drop-shadow(0 0 8px #ff2d78)' }}
            />
            {/* Tip Dot */}
            <motion.circle
              cx={dotX} cy={dotY} r="6"
              fill="#ffffff"
              style={{ filter: 'drop-shadow(0 0 8px #ff2d78)' }}
            />

            {/* INVISIBLE HIT AREA - Fixed Seek */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius + 40}
              fill="transparent"
              style={{ pointerEvents: 'all' }}
            />
          </svg>

          {/* Album Art Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '4px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            <img 
              src={currentSong.album_art_url} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              alt="" 
            />
          </motion.div>
        </div>
      </div>

      {/* 3. TIME DISPLAY - 30px */}
      <div style={{ height: 25, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        <span className="font-mono" style={{ fontSize: 13, fontWeight: 900, color: 'var(--pink-hot)', letterSpacing: '0.1em' }}>
          {formatTime(progress)} / {formatTime(duration)}
        </span>
      </div>

      {/* 4. WAVEFORM - 50px */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 20px' }}>
        <Waveform />
      </div>

      {/* 5. SONG INFO - 60px */}
      <div style={{ height: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 20 }}>
          <div 
            ref={titleRef}
            style={{ 
              width: '100%',
              overflow: 'hidden', 
              whiteSpace: 'nowrap',
              position: 'relative'
            }}
          >
            <h1 
              className={isTitleOverflowing ? "marquee-animation" : ""}
              style={{ 
                fontSize: 20, 
                fontWeight: 900, 
                margin: 0,
                display: isTitleOverflowing ? 'inline-block' : 'block'
              }}
            >
              {decodeSongTitle(currentSong.title).toUpperCase()}
            </h1>
          </div>
          <p style={{ 
            fontSize: 12, 
            color: 'rgba(255,255,255,0.5)', 
            margin: '2px 0 0 0', 
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {currentSong.artist.toUpperCase()}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggleLike(currentSong.id, currentSong)}
          className="glass flex-center"
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer' }}
        >
          {isLiked ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff2d78">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          )}
        </motion.button>
      </div>

      {/* 6. CONTROLS ROW - 80px */}
      <div style={{ 
        height: 70, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 20, 
        padding: '0 20px',
        flexShrink: 0 
      }}>
        <button
          onClick={toggleShuffle}
          style={{ background: 'none', border: 'none', color: shuffle ? 'var(--pink-hot)' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900, cursor: 'pointer', width: 50 }}
        >
          SHUFFLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={prevSong}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}
          >
            ⏮
          </motion.button>
          
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isPlaying && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: '2px solid var(--pink-hot)',
                  pointerEvents: 'none'
                }}
              />
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              style={{
                width: 60, 
                height: 60, 
                borderRadius: '50%', 
                background: '#ff2d78', 
                border: 'none', 
                color: '#fff', 
                fontSize: 24, 
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 25px rgba(255,45,120,0.7), 0 0 50px rgba(255,45,120,0.3)',
                zIndex: 2
              }}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </motion.button>
          </div>

          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={nextSong}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}
          >
            ⏭
          </motion.button>
        </div>

        <button
          onClick={cycleRepeat}
          style={{ background: 'none', border: 'none', color: repeat !== 'off' ? 'var(--pink-hot)' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900, cursor: 'pointer', width: 50 }}
        >
          {repeat.toUpperCase()}
        </button>
      </div>

      {/* 7. ADD TO PLAYLIST - 40px */}
      <div style={{ height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginBottom: 5 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPlaylistSelector(true)}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            padding: '6px 16px', 
            borderRadius: 20, 
            color: '#fff', 
            fontSize: 11, 
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ADD TO PLAYLIST +
        </motion.button>
      </div>

      {/* Bottom spacer for Navigation Bar */}
      <div style={{ height: 110, flexShrink: 0 }} />

      <AnimatePresence>
        {showPlaylistSelector && (
          <PlaylistSelector song={currentSong} onClose={() => setShowPlaylistSelector(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NowPlaying;
