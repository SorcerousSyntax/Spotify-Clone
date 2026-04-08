import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const MiniPlayer = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying  = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong   = usePlayerStore((s) => s.nextSong);
  const prevSong   = usePlayerStore((s) => s.prevSong);
  const progress   = usePlayerStore((s) => s.progress);
  const duration   = usePlayerStore((s) => s.duration);

  const isNowPlayingRoute = location.pathname === '/now-playing';
  if (!currentSong || isNowPlayingRoute) return null;

  const progressPercent = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="mini-player"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={() => navigate('/now-playing')}
        style={{
          position: 'fixed',
          bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
          left: 10,
          right: 10,
          height: 64,
          zIndex: 900,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          overflow: 'hidden',
          borderRadius: 18,
          background: 'rgba(18,18,18,0.92)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.06)',
        }}
      >
        {/* Thin progress bar along bottom edge — uses scaleX (GPU only, no layout) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: 'rgba(255,255,255,0.06)',
          transformOrigin: 'left center',
        }}>
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(90deg, #ff2d78, #ff6ea0)',
            borderRadius: 2,
            transformOrigin: 'left center',
            transform: `scaleX(${progressPercent / 100})`,
            willChange: 'transform',
          }} />
        </div>

        {/* Album art */}
        <motion.div
          key={currentSong.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, marginRight: 12 }}
        >
          <img src={currentSong.album_art_url || '/placeholder-album.svg'} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </motion.div>

        {/* Song info */}
        <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#fff', margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {decodeSongTitle(currentSong.title || 'Unknown')}
          </p>
          <p style={{
            fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '1px 0 0',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentSong.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); prevSong(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.7)', fontSize: 16 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isPlaying
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#111"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="#111"><path d="M8 5v14l11-7z"/></svg>
            }
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); nextSong(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'rgba(255,255,255,0.7)', fontSize: 16 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniPlayer;
