import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const MiniPlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  const isNowPlayingRoute = location.pathname === '/now-playing';

  if (!currentSong || isNowPlayingRoute) return null;

  const progressPercent = (progress / duration) * 100 || 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => navigate('/now-playing')}
      className="glass"
      style={{
        position: 'fixed',
        bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        left: 10,
        right: 10,
        height: 64,
        zIndex: 900,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        overflow: 'hidden',
        borderRadius: 32, // Pill shape
        background: 'rgba(15,15,15,0.85)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}
    >
      {/* Progress Line at Top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
        background: 'rgba(255,255,255,0.05)'
      }}>
        <motion.div
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          style={{ height: '100%', background: 'var(--pink-hot)' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <img src={currentSong.album_art_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h3 style={{ fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
            {decodeSongTitle(currentSong.title).toUpperCase()}
          </h3>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            {currentSong.artist?.toUpperCase()}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); prevSong(); }}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >
          ⏮
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="flex-center pink-glow"
          style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--pink-hot)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer'
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => { e.stopPropagation(); nextSong(); }}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >
          ⏭
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
