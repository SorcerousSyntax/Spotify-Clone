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
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(500px, 95%)',
        height: 70,
        zIndex: 80,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        overflow: 'hidden'
      }}
      className="glass"
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

      <div className="flex items-center w-full justify-center md:justify-between overflow-hidden">
        <div className="flex items-center flex-1 min-w-0 md:flex-initial">
          <img
            src={currentSong.album_art_url}
            alt={currentSong.title}
            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
            style={{ width: 40, height: 40 }}
          />
          <div className="ml-4 overflow-hidden text-center md:text-left">
            <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentSong.title}
            </h3>
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {currentSong.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-10 h-10 flex items-center justify-center text-white"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24 }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
