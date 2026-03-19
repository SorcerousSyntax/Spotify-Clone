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
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => navigate('/now-playing')}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 70,
        zIndex: 80,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.8)',
        borderTop: '1px solid rgba(255,45,120,0.2)'
      }}
    >
      {/* Progress Bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
        background: 'rgba(255,255,255,0.05)'
      }}>
        <motion.div
          animate={{ width: `${progressPercent}%` }}
          style={{ height: '100%', background: '#ff2d78', boxShadow: '0 0 10px #ff2d78' }}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 24, 
        width: '100%',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <img
            src={currentSong.album_art_url}
            alt={currentSong.title}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
          />
          <div style={{ overflow: 'hidden', textAlign: 'left' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
              {currentSong.title}
            </h3>
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {currentSong.artist}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0, justifyContent: 'center' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, display: 'none', md: { display: 'block' } }}>
          {/* Spacer to help centering on larger screens if needed */}
        </div>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
