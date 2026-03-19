import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';

const MiniPlayer = () => {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  if (!currentSong) return null;

  const progressPercent = (progress / duration) * 100 || 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => navigate('/now-playing')}
      style={{
        position: 'fixed',
        bottom: 82, // Floating above BottomNav (70px height + 12px margin)
        left: 12,
        right: 12,
        height: 64,
        zIndex: 85,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '16px',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Dynamic Floating Animation Wrapper */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {/* Progress Bar (Slightly more refined) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
            style={{ height: '100%', background: '#ff2d78', boxShadow: '0 0 10px #ff2d78' }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 16, 
          width: '100%',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <motion.img
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              src={currentSong.album_art_url}
              alt={currentSong.title}
              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(255,45,120,0.3)', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden', textAlign: 'left' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                {currentSong.title}
              </h3>
              <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: '0.05em' }}>
                {currentSong.artist?.toUpperCase()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, justifyContent: 'center' }}>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              style={{ 
                background: 'rgba(255,45,120,0.1)', 
                border: '1px solid rgba(255,45,120,0.3)', 
                borderRadius: '50%',
                width: 38, height: 38,
                cursor: 'pointer', fontSize: 18, color: '#fff', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255,45,120,0.2)'
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MiniPlayer;
