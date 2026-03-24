import React from 'react';
import { motion } from 'framer-motion';
import { decodeSongTitle } from '../lib/text';

const AlbumCard = ({ song, index = 0, onClick }) => {
  const title = decodeSongTitle(song?.title || 'Unknown Title');
  const artist = song?.artist || 'Unknown Artist';
  const image = song?.album_art_url || '/placeholder-album.svg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(song)}
      className="card-tap"
      style={{ 
        width: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: 'transparent',
        cursor: 'pointer',
        gap: 12
      }}
    >
      <div style={{ 
        width: '100%',
        aspectRatio: '1/1', 
        overflow: 'hidden', 
        background: 'var(--color-bg-elevated)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        position: 'relative'
      }}>
        <img 
          src={image} 
          alt={title} 
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>
      <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h3 style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          color: '#fff', 
          letterSpacing: '0.02em',
          textTransform: 'uppercase'
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: 11, 
          color: 'var(--color-text-muted)', 
          fontWeight: 400,
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis'
        }}>
          {artist}
        </p>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
