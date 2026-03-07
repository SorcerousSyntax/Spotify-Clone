import React from 'react';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import useCardTilt from '../hooks/useCardTilt';
import { decodeSongTitle } from '../lib/text';

const AlbumCard = ({ song, index = 0, size = 'normal', onClick }) => {
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const tilt = useCardTilt(10);
  const safeTitle = decodeSongTitle(song?.title || '');

  const handleClick = () => {
    if (onClick) onClick(song);
    else setCurrentSong(song);
  };

  const cardWidth = size === 'small' ? '100%' : size === 'large' ? '192px' : '152px';

  return (
    <motion.div
      className="card-3d"
      style={{
        width: cardWidth,
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: index * 0.06 }}
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      {...tilt}
    >
      {/* Album art */}
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
        <img
          src={song?.album_art_url || '/placeholder-album.svg'}
          alt={safeTitle || 'Album'}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* Hover overlay with play button */}
        <motion.div
          className="group"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '10px', opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0, y: 8 }}
            whileHover={{ scale: 1, y: 0 }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00ff6a, #00c44f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,255,106,0.6)',
            }}
          >
            <svg width="16" height="16" fill="#000" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Green border glow on art */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '12px 12px 0 0',
          boxShadow: 'inset 0 0 0 1px rgba(0,255,106,0)',
          transition: 'box-shadow 0.3s',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 15,
          letterSpacing: '0.04em',
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
        }}>
          {safeTitle || 'Unknown Title'}
        </p>
        <p style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11,
          color: 'rgba(255,255,255,0.38)',
          marginTop: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {song?.artist || 'Unknown Artist'}
        </p>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
