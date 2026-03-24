import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const MiniPlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
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
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      onClick={() => navigate('/now-playing')}
      className="glass card-tap"
      style={{
        position: 'fixed',
        bottom: 104,
        left: 12,
        right: 12,
        height: 64,
        zIndex: 900,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        overflow: 'hidden',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid var(--color-border)',
        background: 'rgba(10,10,10,0.85)'
      }}
    >
      {/* Progress Bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2,
        background: 'rgba(255,255,255,0.05)'
      }}>
        <motion.div
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          style={{ height: '100%', background: 'var(--color-accent-primary)' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ 
          width: 44, 
          height: 44, 
          borderRadius: 12, 
          overflow: 'hidden', 
          flexShrink: 0,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)'
        }}>
          <img 
            src={currentSong.album_art_url} 
            loading="lazy" 
            decoding="async" 
            alt="" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h3 style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            {decodeSongTitle(currentSong.title)}
          </h3>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {currentSong.artist?.toUpperCase()}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="card-tap"
          style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-primary)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px var(--color-accent-glow)'
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); nextSong(); }}
          className="card-tap"
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: 4 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z"/>
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MiniPlayer;
