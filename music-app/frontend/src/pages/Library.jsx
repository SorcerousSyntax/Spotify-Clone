import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const Library = () => {
  const location = useLocation();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const songsById = usePlayerStore((s) => s.songsById);
  const playlists = usePlayerStore((s) => s.playlists);
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
    <div style={{ padding: '40px 40px 100px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 64 }}>LIBRARY</h1>
          <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
            {selectedPlaylist ? selectedPlaylist.name.toUpperCase() : 'YOUR COLLECTIONS'}
          </p>
        </div>
        {!selectedPlaylist && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>NEW PLAYLIST</button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass"
            style={{ padding: 30, marginBottom: 40, display: 'flex', gap: 20 }}
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

      <section>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 15 }}>
                {playlistSongs.map((song, i) => (
                  <div key={song.id} className="glass" onClick={() => handlePlay(song, i, playlistSongs)} style={{
                    padding: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20
                  }}>
                    <img src={song.album_art_url} alt={song.title} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(song.title)}</h3>
                      <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="library-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}
            >
              {playlists.map((playlist, i) => (
                <div 
                  key={playlist.id} 
                  className="glass" 
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  style={{ padding: 25, cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ fontSize: 48, marginBottom: 20 }}>{playlist.emoji || '🎵'}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900 }}>{playlist.name.toUpperCase()}</h3>
                  <p className="font-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
                    {playlist.songIds.length} TRACKS
                  </p>
                  {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default Library;
