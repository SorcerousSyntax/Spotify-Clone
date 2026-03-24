import React from 'react';
import { motion } from 'framer-motion';

const PlaylistFolderCard = ({ playlist, onClick, isLikedSongs = false, isOfflineCard = false }) => {
  // Get top 4 covers or placeholders
  const covers = (playlist.songs || []).slice(0, 4).map(s => s.album_art_url);
  while (covers.length < 4) covers.push('https://via.placeholder.com/150/000000/ff2d78?text=♪');

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="folder-card-wrapper"
      style={{ minWidth: 140, cursor: 'pointer' }}
    >
      <div className="folder-card clay pink-glow" style={{ 
        background: isLikedSongs 
          ? 'linear-gradient(135deg, #ff2d78 0%, rgba(0,0,0,0.6) 100%)'
          : isOfflineCard
          ? 'linear-gradient(135deg, #444 0%, rgba(0,0,0,0.6) 100%)'
          : 'linear-gradient(135deg, rgba(255,45,120,0.2) 0%, rgba(0,0,0,0.4) 100%)' 
      }}>
        <div className="folder-tab" />
        {isLikedSongs && (
          <div style={{ position: 'absolute', top: -15, right: -5, fontSize: 24, filter: 'drop-shadow(0 0 10px #ff2d78)' }}>♥</div>
        )}
        {isOfflineCard && (
          <div style={{ position: 'absolute', top: -15, right: -5, fontSize: 20, filter: 'drop-shadow(0 0 10px #fff)' }}>📥</div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 4,
          padding: 12,
          height: '100%'
        }}>
          {covers.map((url, i) => (
            <div key={i} style={{
              width: '100%',
              aspectRatio: '1/1',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.4)'
            }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 12, fontWeight: 900, textAlign: 'center' }}>{playlist.name.toUpperCase()}</h3>
        <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 2 }}>
          {playlist.songs?.length || 0} SONGS
        </p>
      </div>
    </motion.div>
  );
};

export default PlaylistFolderCard;
