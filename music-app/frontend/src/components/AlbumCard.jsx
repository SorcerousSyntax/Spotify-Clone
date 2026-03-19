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
      style={{ 
        padding: '8px', 
        cursor: 'pointer', 
        width: '100%',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ 
        width: '100%',
        aspectRatio: '1/1', 
        overflow: 'hidden', 
        marginBottom: '10px', 
        background: '#111',
        borderRadius: '10px',
        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.05)'
      }}>
        <img 
          src={image} 
          alt={title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }} 
          className="hover:scale-110" 
        />
      </div>
      <div style={{ width: '100%', padding: '0 4px', textAlign: 'center' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, color: '#fff' }}>{title}</h3>
        <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.toUpperCase()}</p>
      </div>
    </motion.div>
  );
};

export default AlbumCard;
