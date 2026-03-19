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
      whileHover={{ y: -5 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => navigate('/now-playing')}
      style={{
        position: 'fixed',
        bottom: 85, 
        left: 20,
        right: 20,
        height: 64,
        zIndex: 85,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 0, // Sharp aesthetic
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        background: 'rgba(0,0,0,0.9)',
        border: '1px solid #ff2d78',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Progress Bar (Slightly more refined) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: 1,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
            style={{ height: '100%', background: '#ff2d78' }}
          />
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 16, 
          width: '100%',
          padding: '0 20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1, minWidth: 0 }}>
            <img
              src={currentSong.album_art_url}
              alt={currentSong.title}
              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
            />
            <div style={{ overflow: 'hidden', textAlign: 'left' }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', letterSpacing: '-0.02em' }}>
                {currentSong.title.toUpperCase()}
              </h3>
              <p className="font-mono" style={{ fontSize: 9, color: '#ff2d78', marginTop: 2, fontWeight: 700 }}>
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
                background: 'transparent', 
                border: '1px solid #ff2d78', 
                borderRadius: 0,
                width: 40, height: 40,
                cursor: 'pointer', fontSize: 12, color: '#fff', 
                fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
