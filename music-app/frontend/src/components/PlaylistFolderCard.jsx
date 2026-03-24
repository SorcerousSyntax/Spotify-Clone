import React from 'react';
import { motion } from 'framer-motion';

const PlaylistFolderCard = ({ playlist, onClick, isLikedSongs = false, isOfflineCard = false }) => {
  // Get top 4 covers or placeholders
  const covers = (playlist.songs || []).slice(0, 4).map(s => s.album_art_url);
  const placeholder = '/placeholder-album.svg';
  while (covers.length < 4) covers.push(placeholder);

  return (
    <motion.div
      whileHover={{
        borderColor: 'var(--color-border-accent)',
        boxShadow: '0 0 24px var(--color-accent-glow)'
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="card-tap"
      style={{ 
        minWidth: 160, 
        cursor: 'pointer',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 160ms var(--ease-main)',
        position: 'relative'
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 3,
        aspectRatio: '1/1',
        width: '100%'
      }}>
        {covers.map((url, i) => (
          <div key={i} style={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--color-bg-elevated)'
          }}>
            <img 
              src={url} 
              alt="" 
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h3 style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: 'var(--color-text-primary)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {playlist.name}
        </h3>
        <p className="song-count">
          {playlist.songs?.length || 0} SONGS
        </p>
      </div>

      {(isLikedSongs || isOfflineCard) && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: isLikedSongs ? 'var(--color-accent-primary)' : 'var(--color-bg-elevated)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          boxShadow: isLikedSongs ? '0 0 12px var(--color-accent-glow)' : 'none',
          border: '1px solid var(--color-border)'
        }}>
          {isLikedSongs ? '♥' : '📥'}
        </div>
      )}
    </motion.div>
  );
};

export default PlaylistFolderCard;
