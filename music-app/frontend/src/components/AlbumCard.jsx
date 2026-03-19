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
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => onClick?.(song)}
      style={{ 
        padding: '0', 
        cursor: 'pointer', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        background: 'transparent',
        transition: 'transform 0.4s ease'
      }}
      whileHover={{ y: -5 }}
    >
      <div style={{ 
        width: '100%',
        aspectRatio: '1/1', 
        overflow: 'hidden', 
        marginBottom: '15px', 
        background: '#111',
        borderRadius: 0, // Sharp aesthetic
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        <img 
          src={image} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: '#ff2d78', transform: 'scaleX(0)', transition: 'transform 0.4s ease', transformOrigin: 'left' }} className="hover-bar" />
      </div>
      <div style={{ width: '100%', textAlign: 'left' }}>
        <h3 style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4, color: '#fff', letterSpacing: '-0.02em' }}>{title.toUpperCase()}</h3>
        <p className="font-mono" style={{ fontSize: 9, color: '#ff2d78', fontWeight: 700 }}>{artist.toUpperCase()}</p>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
