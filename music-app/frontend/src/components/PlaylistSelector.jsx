import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';

const PlaylistSelector = ({ song, onClose }) => {
  const playlists = usePlayerStore((s) => s.playlists);
  const addSongToPlaylist = usePlayerStore((s) => s.addSongToPlaylist);
  const [addedId, setAddedId] = React.useState(null);

  const handleAdd = (playlistId) => {
    addSongToPlaylist(playlistId, song);
    setAddedId(playlistId);
    // Auto close after brief delay
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: '100%', maxWidth: '500px',
          padding: '30px 20px ' + (30 + 40) + 'px', // Extra bottom for iOS & Nav bar
          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
          maxHeight: '70vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900 }}>ADD TO PLAYLIST</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {playlists.filter(p => !p.isSystem).map((playlist) => (
            <motion.button
              key={playlist.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAdd(playlist.id)}
              className="glass"
              style={{
                padding: '15px 20px', textAlign: 'left', border: 'none',
                color: addedId === playlist.id ? 'var(--pink-hot)' : '#fff', 
                fontSize: 14, fontWeight: 900, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <span>{playlist.name.toUpperCase()}</span>
              <span>{addedId === playlist.id ? 'ADDED ✓' : '+'}</span>
            </motion.button>
          ))}
          {playlists.filter(p => !p.isSystem).length === 0 && (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: 40 }}>NO PLAYLISTS FOUND</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlaylistSelector;
