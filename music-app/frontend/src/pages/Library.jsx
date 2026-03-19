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
    <div style={{ padding: '40px 5vw 120px 5vw', maxWidth: 1400, margin: '0 auto', background: '#000', minHeight: '100vh' }}>
      <header style={{ marginBottom: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(4rem, 12vw, 10rem)', lineHeight: 0.8, letterSpacing: '-0.05em' }}>
            LIBRARY<span style={{ color: '#ff2d78' }}>.</span>
          </h1>
          <p className="font-mono" style={{ fontSize: 10, color: '#ff2d78', marginTop: 30, letterSpacing: '0.3em', fontWeight: 800 }}>
            {selectedPlaylist ? `COLLECTION / ${selectedPlaylist.name.toUpperCase()}` : 'USER / COLLECTIONS'}
          </p>
        </div>
        {!selectedPlaylist && (
          <button className="clay" style={{ padding: '15px 30px', fontSize: 14, borderRadius: 0 }} onClick={() => setShowCreate(true)}>NEW COLLECTION</button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              padding: 40, marginBottom: 60, background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 30,
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="ENTER COLLECTION NAME..."
              style={{
                flex: 1, background: 'transparent', border: 'none', borderBottom: '2px solid #ff2d78',
                color: '#fff', fontSize: 24, fontFamily: "'Space Grotesk', sans-serif", outline: 'none',
                fontWeight: 800
              }}
            />
            <button className="clay" style={{ borderRadius: 0, height: 50, padding: '0 40px' }} onClick={onCreate}>CREATE</button>
            <button className="glass" style={{ borderRadius: 0, height: 50, padding: '0 40px', background: 'transparent', color: '#fff', border: '1px solid #fff' }} onClick={() => setShowCreate(false)}>CANCEL</button>
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
                style={{ background: 'none', border: 'none', color: '#ff2d78', cursor: 'pointer', marginBottom: 40, fontSize: 12, fontWeight: 800, letterSpacing: '0.2em' }}
              >
                ← BACK TO COLLECTIONS
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
                {playlistSongs.map((song, i) => {
                  const isOffline = usePlayerStore(s => s.isOffline(song.id));
                  const toggleOffline = usePlayerStore(s => s.toggleOffline);
                  
                  return (
                    <div key={song.id} onClick={() => handlePlay(song, i, playlistSongs)} style={{
                      padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20, height: 70, 
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{ width: 45, height: 45, background: '#111', flexShrink: 0 }}>
                        <img src={song.album_art_url} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentSong?.id === song.id ? '#ff2d78' : '#fff' }}>
                          {decodeSongTitle(song.title).toUpperCase()}
                        </h3>
                        <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{song.artist.toUpperCase()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: isOffline ? 1 : 0.3 }}
                        >
                          {isOffline ? '✅' : '📥'}
                        </button>
                        {song.duration && (
                          <span className="font-mono" style={{ fontSize: 10, color: '#ff2d78', fontWeight: 800 }}>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                gap: 25 
              }}
            >
              {playlists.map((playlist, i) => (
                <motion.div 
                  key={playlist.id} 
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative'
                  }}
                >
                  <div className="glass" style={{ 
                    aspectRatio: '1/1', 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 15,
                    overflow: 'hidden',
                    borderRadius: 24
                  }}>
                    <PlaylistCover 
                      playlist={playlist} 
                      songsById={songsById} 
                      size={140} 
                    />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 900, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {playlist.name.toUpperCase()}
                    </h3>
                    <p className="font-mono" style={{ fontSize: 8, color: '#ff2d78', fontWeight: 800 }}>
                      {playlist.songIds.length} ITEMS
                    </p>
                  </div>
                  {playlist.id !== LIKED_SONGS_PLAYLIST_ID && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id); }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: 24, height: 24, borderRadius: '50%', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
