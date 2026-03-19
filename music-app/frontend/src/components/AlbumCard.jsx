import React from 'react';
import { motion } from 'framer-motion';
import { decodeSongTitle } from '../lib/text';

const AlbumCard = ({ song, index = 0, onClick }) => {
  const title = decodeSongTitle(song?.title || 'Unknown Title');
  const artist = song?.artist || 'Unknown Artist';
  const image = song?.album_art_url || '/placeholder-album.svg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.76, 0, 0.24, 1] }}
      onClick={() => onClick?.(song)}
      className="glass"
      style={{ padding: 10, cursor: 'pointer', width: '100%' }}
    >
      <div style={{ aspectRatio: '1/1', overflow: 'hidden', marginBottom: 15, background: '#111' }}>
        <img 
          src={image} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
          className="hover:scale-110" 
        />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
      <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{artist.toUpperCase()}</p>
    </motion.div>
  );
};

export default AlbumCard;
