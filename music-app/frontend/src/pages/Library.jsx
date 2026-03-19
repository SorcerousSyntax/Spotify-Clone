import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import PlaylistCover from '../components/PlaylistCover';

const Library = () => {
  const location = useLocation();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const songsById = usePlayerStore((s) => s.songsById);
  const playlists = usePlayerStore((s) => s.playlists);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const playlistSongs = useMemo(
    () => selectedPlaylist
      ? selectedPlaylist.songIds.map((id) => songsById[id]).filter(Boolean)
      : [],
    [selectedPlaylist, songsById]
  );

  const handlePlay = (song, index, list) => {
    setCurrentSong(song);
    setQueue(list, index);
  };

  const onCreate = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist({ name: newPlaylistName });
    setNewPlaylistName('');
    setShowCreate(false);
  };

  return (
    <div style={{ padding: '40px 20px 100px 20px', maxWidth: 1000, margin: '0 auto', background: 'transparent' }}>
      <header style={{ marginBottom: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', lineHeight: 1 }}>LIBRARY</h1>
          <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
            {selectedPlaylist ? selectedPlaylist.name.toUpperCase() : 'YOUR COLLECTIONS'}
          </p>
        </div>
        {!selectedPlaylist && (
          <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 12 }} onClick={() => setShowCreate(true)}>NEW</button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass"
            style={{ padding: 30, marginBottom: 40, margin: '0 20px 40px 20px', display: 'flex', gap: 20 }}
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="PLAYLIST NAME"
              style={{
                flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid #ff2d78',
                color: '#fff', fontSize: 18, fontFamily: "'Share Tech Mono', monospace", outline: 'none'
              }}
            />
            <button className="btn-primary" onClick={onCreate}>CREATE</button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>CANCEL</button>
          </motion.div>
        )}
      </AnimatePresence>

      <section style={{ padding: '0 20px' }}>
        <AnimatePresence mode="wait">
          {selectedPlaylist ? (
            <motion.div
              key="playlist-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button 
                onClick={() => setSelectedPlaylistId(null)}
                className="font-mono"
                style={{ background: 'none', border: 'none', color: '#ff2d78', cursor: 'pointer', marginBottom: 30, fontSize: 12 }}
              >
                ← BACK TO LIBRARY
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {playlistSongs.map((song, i) => {
                  const isOffline = usePlayerStore(s => s.isOffline(song.id));
                  const toggleOffline = usePlayerStore(s => s.toggleOffline);
                  
                  return (
                    <div key={song.id} className="glass" onClick={() => handlePlay(song, i, playlistSongs)} style={{
                      padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, height: 56, 
                      borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                      borderColor: currentSong?.id === song.id ? 'rgba(255,45,120,0.4)' : 'rgba(255,255,255,0.05)'
                    }}>
                      <img src={song.album_art_url} alt={song.title} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentSong?.id === song.id ? '#ff2d78' : '#fff' }}>
                          {decodeSongTitle(song.title)}
                        </h3>
                        <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{song.artist}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: isOffline ? 1 : 0.3 }}
                        >
                          {isOffline ? '✅' : '📥'}
                        </button>
                        {song.duration && (
                          <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                            {Math.floor(song.duration / 60)}:{String(Math.floor(song.duration % 60)).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="library-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                gap: 20 
              }}
            >
              {playlists.map((playlist, i) => (
                <motion.div 
                  key={playlist.id} 
                  whileHover={{ y: -5, boxShadow: '0 0 20px rgba(255, 45, 120, 0.2)' }}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className="clay"
                  style={{ 
                    padding: 12, 
                    cursor: 'pointer', 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: 160,
                    margin: '0 auto'
                  }}
                >
                  <PlaylistCover 
                    playlist={playlist} 
                    songsById={songsById} 
                    size={136} 
                  />
                  <div style={{ marginTop: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {playlist.name.toUpperCase()}
                    </h3>
                    <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      {playlist.songIds.length} TRACKS
                    </p>
                  </div>
                  {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 20, height: 20, borderRadius: '50%', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Library;
