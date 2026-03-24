import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import PlaylistFolderCard from '../components/PlaylistFolderCard';

const Library = () => {
  console.log('Library mounting...');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const songsById = usePlayerStore((s) => s.songsById);
  const playlists = usePlayerStore((s) => s.playlists);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const isOffline = usePlayerStore((s) => s.isOffline);
  const offlineSongIds = usePlayerStore((s) => s.offlineSongIds);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const displaySongs = useMemo(() => {
    if (selectedPlaylistId === 'offline-auto') {
      return Array.from(offlineSongIds).map(id => songsById[id]).filter(Boolean);
    }
    if (selectedPlaylist) {
      return selectedPlaylist.songIds.map(id => songsById[id]).filter(Boolean);
    }
    return Object.values(songsById);
  }, [selectedPlaylist, selectedPlaylistId, songsById, offlineSongIds]);

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

  const formatDuration = (d) => {
    if (!d) return '0:00';
    const mins = Math.floor(d / 60);
    const secs = Math.floor(d % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const offlinePlaylist = {
    id: 'offline-auto',
    name: 'OFFLINE',
    songs: Array.from(offlineSongIds).map(id => songsById[id]).filter(Boolean)
  };

  return (
    <div style={{ padding: '100px 20px 150px 20px', minHeight: '100vh', position: 'relative', zIndex: 10, background: 'transparent' }}>
      {/* Header */}
      <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 42, color: '#fff' }}>
            {selectedPlaylistId === 'offline-auto' ? 'OFFLINE' : selectedPlaylist ? selectedPlaylist.name.toUpperCase() : 'LIBRARY'}<span className="text-pink">.</span>
          </h1>
          <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            {selectedPlaylistId === 'offline-auto' ? `OFFLINE / ${offlineSongIds.size} ITEMS` : selectedPlaylist ? `COLLECTION / ${selectedPlaylist.songIds.length} ITEMS` : 'YOUR COLLECTIONS'}
          </p>
        </div>
        {!selectedPlaylist && selectedPlaylistId !== 'offline-auto' && (
          <button 
            onClick={() => setShowCreate(true)}
            className="btn-premium" 
            style={{ padding: '8px 20px', fontSize: 9 }}
          >
            + NEW
          </button>
        )}
      </header>

      {/* Create Playlist Modal (Overlay) */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', display: 'grid', placeItems: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="liquid-glass"
              style={{ width: '100%', maxWidth: 400, padding: 40, textAlign: 'center', borderRadius: 30 }}
            >
              <h2 style={{ fontSize: 24, marginBottom: 30, color: '#fff' }}>CREATE COLLECTION</h2>
              <input
                type="text"
                autoFocus
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="NAME..."
                style={{
                  width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid var(--pink-hot)',
                  color: '#fff', fontSize: 18, fontWeight: 900, textAlign: 'center', marginBottom: 30, outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onCreate} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25 }}>CREATE</button>
                <button onClick={() => setShowCreate(false)} className="btn-premium" style={{ flex: 1, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.05)' }}>CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Grid */}
      {!selectedPlaylist && selectedPlaylistId !== 'offline-auto' && (
        <section style={{ marginBottom: 60 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
            {/* Offline Special Card */}
            <PlaylistFolderCard
              playlist={offlinePlaylist}
              onClick={() => setSelectedPlaylistId('offline-auto')}
              isOfflineCard={true}
            />

            {playlists.map((playlist) => (
              <PlaylistFolderCard
                key={playlist.id}
                playlist={{
                  ...playlist,
                  songs: playlist.songIds.map(id => songsById[id]).filter(Boolean)
                }}
                isLikedSongs={playlist.id === LIKED_SONGS_PLAYLIST_ID}
                onClick={() => setSelectedPlaylistId(playlist.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Song List */}
      <section>
        {(selectedPlaylist || selectedPlaylistId === 'offline-auto') && (
          <button 
            onClick={() => setSelectedPlaylistId(null)}
            className="font-mono"
            style={{ background: 'none', border: 'none', color: 'var(--pink-hot)', fontSize: 10, cursor: 'pointer', marginBottom: 30 }}
          >
            ← BACK TO LIBRARY
          </button>
        )}
        
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>{selectedPlaylistId === 'offline-auto' ? 'OFFLINE SONGS' : selectedPlaylist ? 'SONGS' : 'ALL SONGS'}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {displaySongs.map((song, i) => {
            const offline = isOffline(song.id);
            return (
              <motion.div
                key={song.id}
                whileHover={{ background: 'var(--glass-bg)' }}
                onClick={() => handlePlay(song, i, displaySongs)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 15, padding: '10px 15px',
                  borderRadius: 12, cursor: 'pointer', height: 64,
                  borderBottom: '1px solid rgba(255,45,120,0.05)',
                  transition: 'background 0.3s ease'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentSong?.id === song.id ? 'var(--pink-hot)' : '#fff' }}>
                    {decodeSongTitle(song.title).toUpperCase()}
                  </h3>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{song.artist?.toUpperCase()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
                  >
                    {usePlayerStore.getState().downloadingIds.has(song.id) ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 14, height: 14, border: '2px solid var(--pink-hot)', borderTopColor: 'transparent', borderRadius: '50%' }}
                      />
                    ) : offline ? (
                      <span style={{ color: 'var(--pink-hot)' }}>✓</span>
                    ) : (
                      <span style={{ opacity: 0.3 }}>📥</span>
                    )}
                  </motion.button>
                  <span className="font-mono" style={{ fontSize: 10, opacity: 0.3 }}>
                    {formatDuration(song.duration)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Library;
