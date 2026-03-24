import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import PlaylistFolderCard from '../components/PlaylistFolderCard';

const Library = () => {
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
  const downloadingIds = usePlayerStore((s) => s.downloadingIds);

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
    <div style={{ padding: '100px 24px 150px 24px', minHeight: '100vh', position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            {selectedPlaylistId === 'offline-auto' ? 'OFFLINE' : selectedPlaylist ? selectedPlaylist.name.toUpperCase() : 'LIBRARY'}<span>.</span>
          </h1>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 8 }}>
            {selectedPlaylistId === 'offline-auto' ? `OFFLINE / ${offlineSongIds.size} ITEMS` : selectedPlaylist ? `COLLECTION / ${selectedPlaylist.songIds.length} ITEMS` : 'YOUR COLLECTIONS'}
          </p>
        </div>
        {!selectedPlaylist && selectedPlaylistId !== 'offline-auto' && (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreate(true)}
            style={{ 
              padding: '10px 20px', 
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--color-accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 100,
              letterSpacing: '0.05em',
              boxShadow: '0 0 20px var(--color-accent-glow)'
            }}
          >
            + NEW
          </motion.button>
        )}
      </header>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', display: 'grid', placeItems: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass"
              style={{ width: '100%', maxWidth: 400, padding: 48, textAlign: 'center', borderRadius: 32 }}
            >
              <h2 className="section-heading" style={{ fontSize: 18, marginBottom: 32 }}>CREATE COLLECTION</h2>
              <input
                type="text"
                autoFocus
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="NAME..."
                style={{
                  width: '100%', background: 'transparent', border: 'none', borderBottom: '2.5px solid var(--color-accent-primary)',
                  color: '#fff', fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 40, outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={onCreate} style={{ flex: 1, height: 52, borderRadius: 100, background: 'var(--color-accent-primary)', border: 'none', color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>CREATE</button>
                <button onClick={() => setShowCreate(false)} style={{ flex: 1, height: 52, borderRadius: 100, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff', fontWeight: 700, letterSpacing: '0.05em' }}>CANCEL</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Grid */}
      {!selectedPlaylist && selectedPlaylistId !== 'offline-auto' && (
        <section style={{ marginBottom: 60 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
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
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedPlaylistId(null)}
            style={{ 
              background: 'var(--color-bg-elevated)', 
              border: '1px solid var(--color-border)', 
              color: '#fff', 
              fontSize: 10, 
              fontWeight: 700,
              letterSpacing: '0.1em',
              padding: '8px 16px',
              borderRadius: 100,
              cursor: 'pointer', 
              marginBottom: 40 
            }}
          >
            ← BACK TO LIBRARY
          </motion.button>
        )}
        
        <h2 className="section-heading" style={{ fontSize: 14, marginBottom: 24 }}>{selectedPlaylistId === 'offline-auto' ? 'OFFLINE SONGS' : selectedPlaylist ? 'SONGS' : 'ALL SONGS'}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displaySongs.map((song, i) => {
            const offline = isOffline(song.id);
            return (
              <motion.div
                key={song.id}
                whileTap={{ scale: 0.98, background: 'rgba(255,255,255,0.03)' }}
                onClick={() => handlePlay(song, i, displaySongs)}
                className="card-tap tile-surface"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '10px 12px',
                  borderRadius: 16, cursor: 'pointer', height: 64,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-elevated)' }}>
                  <img src={song.album_art_url} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: 13, 
                    fontWeight: 600, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    color: currentSong?.id === song.id ? 'var(--color-accent-primary)' : '#fff',
                    textTransform: 'uppercase'
                  }}>
                    {decodeSongTitle(song.title)}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{song.artist?.toUpperCase()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); toggleOffline(song); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)' }}
                  >
                    {downloadingIds.has(song.id) ? (
                      <div
                        className="loading-pulse"
                        style={{ width: 14, height: 14, border: '2px solid var(--color-accent-primary)', borderRadius: '50%' }}
                      />
                    ) : offline ? (
                      <span style={{ color: 'var(--color-accent-primary)' }}>✓</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                    )}
                  </motion.button>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
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
