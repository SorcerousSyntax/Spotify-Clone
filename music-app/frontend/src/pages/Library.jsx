import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { SongRow } from '../components/MusicCards';
import PlaylistCover from '../components/PlaylistCover';
import { OFFLINE_AUDIO_CACHE_NAME, getSongAudioUrlCandidates } from '../lib/offlineAudio';

const FILTERS = ['All', 'Liked Songs', 'Playlists', 'Downloads'];

const PLAYLIST_EMOJIS = ['🎵', '🔥', '🌙', '💚', '🎧', '⚡', '🎹'];

const isPlayableSong = (song) => Boolean(song?.stream_url || song?.r2_url);

const PlaylistCard = ({ playlist, songsById, index, onOpen, onRename, onDelete, canManage }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 16px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.09)',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.07)',
      marginBottom: 8,
      transition: 'all 0.2s ease',
    }}
    whileHover={{ y: -2, boxShadow: '0 10px 36px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)', background: 'rgba(139,92,246,0.1)' }}
  >
    <button
      onClick={onOpen}
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <PlaylistCover playlist={playlist} songsById={songsById} size={48} />
    </button>

    <button
      onClick={onOpen}
      style={{
        flex: 1,
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 15,
        fontWeight: 600,
        color: '#fff',
      }}>
        {playlist.name}
      </p>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
      }}>
        {playlist.songIds.length} songs
      </p>
    </button>

    {canManage && (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onRename}
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            borderRadius: 2,
            padding: '6px 12px',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            border: '1px solid rgba(255,100,100,0.3)',
            background: 'transparent',
            color: 'rgba(255,80,80,0.5)',
            borderRadius: 2,
            padding: '6px 12px',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    )}
  </motion.div>
);

const Library = () => {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [offlineSongIds, setOfflineSongIds] = useState([]);

  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const songsById = usePlayerStore((s) => s.songsById);
  const playlists = usePlayerStore((s) => s.playlists);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const renamePlaylist = usePlayerStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);
  const addSongToPlaylist = usePlayerStore((s) => s.addSongToPlaylist);
  const removeSongFromPlaylist = usePlayerStore((s) => s.removeSongFromPlaylist);

  useEffect(() => {
    const requestedPlaylistId = location.state?.openPlaylistId;
    if (!requestedPlaylistId) return;

    const exists = playlists.some((playlist) => playlist.id === requestedPlaylistId);
    if (!exists) return;

    setActiveFilter('Playlists');
    setSelectedPlaylistId(requestedPlaylistId);
  }, [location.state, playlists]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const savedSongIds = useMemo(() => {
    const ids = new Set(likedSongIds);
    playlists.forEach((playlist) => {
      playlist.songIds.forEach((songId) => ids.add(songId));
    });
    return ids;
  }, [likedSongIds, playlists]);

  const allSongs = useMemo(
    () => [...savedSongIds]
      .map((id) => songsById[id])
      .filter((song) => song && isPlayableSong(song)),
    [savedSongIds, songsById]
  );

  const offlineSongs = useMemo(() => {
    const set = new Set(offlineSongIds);
    return allSongs.filter((song) => set.has(song.id));
  }, [allSongs, offlineSongIds]);

  useEffect(() => {
    let cancelled = false;

    if (!window.caches || allSongs.length === 0) {
      setOfflineSongIds([]);
      return () => {
        cancelled = true;
      };
    }

    const detectOfflineSongs = async () => {
      try {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
        const checks = await Promise.all(
          allSongs.map(async (song) => {
            const candidates = getSongAudioUrlCandidates(song);
            for (const url of candidates) {
              const hit = await cache.match(url);
              if (hit) return song.id;
            }
            return null;
          })
        );

        if (!cancelled) {
          setOfflineSongIds(checks.filter(Boolean));
        }
      } catch {
        if (!cancelled) {
          setOfflineSongIds([]);
        }
      }
    };

    detectOfflineSongs();

    return () => {
      cancelled = true;
    };
  }, [allSongs]);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;
  const showingOffline = offlineOpen && !selectedPlaylist;

  const playlistSongs = useMemo(
    () => selectedPlaylist
      ? selectedPlaylist.songIds
          .map((songId) => songsById[songId])
          .filter((song) => song && isPlayableSong(song))
      : [],
    [selectedPlaylist, songsById]
  );

  const addableSongs = useMemo(() => {
    if (!selectedPlaylist) return [];
    const set = new Set(selectedPlaylist.songIds);
    return allSongs.filter((song) => !set.has(song.id));
  }, [selectedPlaylist, allSongs]);

  const playSong = (song, index, list) => {
    if (!isPlayableSong(song)) return;
    setCurrentSong(song);
    setQueue(list, index);
  };

  const shufflePlayPlaylist = () => {
    if (!playlistSongs.length) return;
    const randomIndex = Math.floor(Math.random() * playlistSongs.length);
    const randomSong = playlistSongs[randomIndex];
    setCurrentSong(randomSong);
    setQueue(playlistSongs, randomIndex);
  };

  const onCreatePlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;

    createPlaylist({
      name,
      emoji: PLAYLIST_EMOJIS[Math.floor(Math.random() * PLAYLIST_EMOJIS.length)],
    });
    setNewPlaylistName('');
    setShowCreate(false);
    setActiveFilter('Playlists');
  };

  const onRenamePlaylist = (playlist) => {
    const nextName = window.prompt('Rename playlist', playlist.name);
    if (!nextName) return;
    renamePlaylist(playlist.id, nextName);
  };

  const onDeletePlaylist = (playlist) => {
    const ok = window.confirm(`Delete playlist "${playlist.name}"?`);
    if (!ok) return;
    deletePlaylist(playlist.id);
    if (selectedPlaylistId === playlist.id) {
      setSelectedPlaylistId(null);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, paddingTop: 44, paddingBottom: 24 }}>
      <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', paddingLeft: 4 }}
        >
          Your Library
        </motion.h1>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreate((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 999, background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 600,
          }}
        >
          + New Playlist
        </motion.button>
      </div>

      {showCreate && (
        <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8 }}>
          <input
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 999,
              color: '#fff',
              padding: '10px 16px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={onCreatePlaylist}
            style={{
              border: 'none',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              padding: '10px 18px',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
            }}
          >
            Create
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', marginBottom: 20 }}
        className="hide-scrollbar"
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => {
                setActiveFilter(f);
                setSelectedPlaylistId(null);
                if (f === 'Downloads') {
                  setOfflineOpen(true);
                } else {
                  setOfflineOpen(false);
                }
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 50,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13, fontWeight: 500,
                background: isActive ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(139,92,246,0.4)' : 'none',
              }}
            >
              {f}
            </button>
          );
        })}
      </motion.div>

      <section style={{ padding: '0 16px' }}>
      {/* All Songs view */}
        {!selectedPlaylist && !showingOffline && activeFilter === 'All' && (
          <div>
            {allSongs.length === 0 ? (
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '30px 0' }}>No saved songs yet.</p>
            ) : allSongs.map((song, i) => (
              <div key={song.id} style={{ marginBottom: 4 }}>
                <SongRow song={song} index={i} showIndex onClick={(s, idx) => playSong(s, idx, allSongs)} />
              </div>
            ))}
          </div>
        )}

        {/* Liked Songs view */}
        {!selectedPlaylist && !showingOffline && activeFilter === 'Liked Songs' && (
          <div>
            {(() => {
              const likedPlaylist = playlists.find((p) => p.id === LIKED_SONGS_PLAYLIST_ID);
              const likedSongs = likedPlaylist
                ? likedPlaylist.songIds.map((id) => songsById[id]).filter((s) => s && isPlayableSong(s))
                : [];
              return likedSongs.length === 0 ? (
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '30px 0' }}>No liked songs yet.</p>
              ) : likedSongs.map((song, i) => (
                <div key={song.id} style={{ marginBottom: 4 }}>
                  <SongRow song={song} index={i} showIndex onClick={(s, idx) => playSong(s, idx, likedSongs)} />
                </div>
              ));
            })()}
          </div>
        )}

        {/* Playlist list view */}
        {!selectedPlaylist && !showingOffline && activeFilter === 'Playlists' && (
          <>
            {/* Pinned Offline Playlist Card */}
            <motion.button
              onClick={() => setOfflineOpen(true)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 16px',
                borderRadius: 14,
                background: offlineSongs.length > 0
                  ? 'rgba(109,40,217,0.18)'
                  : 'rgba(255,255,255,0.03)',
                border: offlineSongs.length > 0
                  ? '1px solid rgba(167,139,250,0.38)'
                  : '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                width: '100%', cursor: 'pointer', marginBottom: 8, textAlign: 'left',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                background: offlineSongs.length > 0
                  ? 'linear-gradient(135deg, #a78bfa, #6d28d9)'
                  : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                📥
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Saved Offline</p>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 500, color: offlineSongs.length > 0 ? 'rgba(167,139,250,0.8)' : 'rgba(255,255,255,0.28)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {offlineSongs.length} song{offlineSongs.length !== 1 ? 's' : ''} • Pinned
                </p>
              </div>
              <span style={{ color: 'rgba(167,139,250,0.6)', fontSize: 18, flexShrink: 0 }}>›</span>
            </motion.button>

            {/* Small online status pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999,
              background: isOnline ? 'rgba(0,255,106,0.08)' : 'rgba(255,166,0,0.08)',
              border: isOnline ? '1px solid rgba(0,255,106,0.2)' : '1px solid rgba(255,166,0,0.25)',
              marginBottom: 16,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#00ff6a' : '#ffa600', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 500, color: isOnline ? '#7effb6' : '#ffcf7e' }}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>

            {playlists.map((playlist, i) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                songsById={songsById}
                index={i}
                onOpen={() => setSelectedPlaylistId(playlist.id)}
                onRename={() => onRenamePlaylist(playlist)}
                onDelete={() => onDeletePlaylist(playlist)}
                canManage={playlist.id !== LIKED_SONGS_PLAYLIST_ID}
              />
            ))}

            {playlists.length === 0 && (
              <p style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 13,
                color: 'rgba(255,255,255,0.35)',
                textAlign: 'center',
                padding: '30px 0',
              }}>
                No playlists yet. Create one from the button above.
              </p>
            )}
          </>
        )}

        {/* Offline Songs view */}
        {showingOffline && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                onClick={() => setOfflineOpen(false)}
                style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 500 }}
              >
                ← Back
              </button>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>Saved Offline</p>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{offlineSongs.length} songs</span>
            </div>
            {offlineSongs.length === 0 ? (
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '30px 0' }}>
                No offline songs yet. Save songs from the Now Playing screen.
              </p>
            ) : offlineSongs.map((song, i) => (
              <div key={`offline-${song.id}`} style={{ marginBottom: 8 }}>
                <SongRow song={song} index={i} showIndex onClick={(s, idx) => playSong(s, idx, offlineSongs)} />
              </div>
            ))}
          </>
        )}

        {selectedPlaylist && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button
                onClick={() => setSelectedPlaylistId(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>
                {selectedPlaylist.name}
              </p>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                {playlistSongs.length} songs
              </span>
            </div>

            <button
              onClick={shufflePlayPlaylist}
              disabled={!playlistSongs.length}
              style={{
                marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 999,
                background: playlistSongs.length ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                color: playlistSongs.length ? '#fff' : 'rgba(255,255,255,0.45)',
                padding: '8px 14px',
                cursor: playlistSongs.length ? 'pointer' : 'default',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Shuffle Play Playlist
            </button>

            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 8 }}>
              Playlist Songs
            </p>
            {playlistSongs.length > 0 ? playlistSongs.map((song, i) => (
              <div
                key={song.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: selectedPlaylist.id !== LIKED_SONGS_PLAYLIST_ID ? 'minmax(0,1fr) auto' : 'minmax(0,1fr)',
                  alignItems: 'center',
                  columnGap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <SongRow song={song} index={i} showIndex onClick={(s, idx) => playSong(s, idx, playlistSongs)} />
                </div>
                {selectedPlaylist.id !== LIKED_SONGS_PLAYLIST_ID && (
                  <button
                    onClick={() => removeSongFromPlaylist(selectedPlaylist.id, song.id)}
                    style={{
                      border: '1px solid rgba(255,90,90,0.35)',
                      background: 'transparent',
                      color: 'rgba(255,120,120,0.9)',
                      borderRadius: 999,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 11,
                      height: 32,
                      minWidth: 74,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )) : (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 16 }}>
                No songs in this playlist yet.
              </p>
            )}

            {selectedPlaylist.id !== LIKED_SONGS_PLAYLIST_ID && (
              <>
                <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', margin: '16px 0 8px' }}>
                  Add Songs
                </p>
                {addableSongs.slice(0, 20).map((song) => (
                  <div
                    key={`add-${song.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) auto',
                      alignItems: 'center',
                      columnGap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <SongRow song={song} />
                    </div>
                    <button
                      onClick={() => addSongToPlaylist(selectedPlaylist.id, song)}
                      style={{
                        border: '1px solid rgba(139,92,246,0.35)',
                        background: 'rgba(139,92,246,0.1)',
                        color: '#a78bfa',
                        borderRadius: 999,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: 11,
                        height: 32,
                        minWidth: 64,
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </section>

    </div>
  );
};

export default Library;
