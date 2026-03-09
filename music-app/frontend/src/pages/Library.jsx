import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import { SongRow } from '../components/MusicCards';
import PlaylistCover from '../components/PlaylistCover';
import { OFFLINE_AUDIO_CACHE_NAME, getSongAudioUrlCandidates } from '../lib/offlineAudio';

const FILTERS = ['Playlists'];

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
      padding: '16px 20px',
      borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: 2,
    }}
    onHoverStart={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      e.currentTarget.style.borderColor = 'rgba(0,255,65,0.2)';
    }}
    onHoverEnd={(e) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
    }}
  >
    <button
      onClick={onOpen}
      style={{
        width: 48,
        height: 48,
        borderRadius: 4,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
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
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 16,
        letterSpacing: '0.04em',
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
  const [activeFilter, setActiveFilter] = useState('Playlists');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
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
          style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, letterSpacing: '0.06em', color: '#fff', paddingLeft: 16 }}
        >
          YOUR LIBRARY
        </motion.h1>

        <button
          onClick={() => setShowCreate((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 4, background: 'transparent',
            border: '1px solid rgba(0,255,106,0.2)', color: '#00ff6a', cursor: 'pointer',
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          New Playlist
        </button>
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
              border: '1px solid rgba(0,255,65,0.2)',
              borderRadius: 999,
              color: '#fff',
              padding: '10px 14px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
            }}
          />
          <button
            onClick={onCreatePlaylist}
            style={{
              border: '1px solid rgba(0,255,65,0.25)',
              borderRadius: 999,
              background: 'rgba(0,255,65,0.12)',
              color: '#00ff6a',
              padding: '10px 14px',
              cursor: 'pointer',
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
                if (f !== 'Playlists') {
                  setSelectedPlaylistId(null);
                }
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 50,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: isActive ? 'linear-gradient(135deg, #00ff6a, #00c44f)' : 'var(--surface)',
                color: isActive ? '#000' : 'rgba(255,255,255,0.45)',
                border: isActive ? 'none' : '1px solid rgba(0,255,106,0.12)',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          );
        })}
      </motion.div>

      <section style={{ padding: '0 16px' }}>
        {!selectedPlaylist && (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 12,
              border: isOnline ? '1px solid rgba(0,255,106,0.25)' : '1px solid rgba(255,166,0,0.35)',
              background: isOnline ? 'rgba(0,255,106,0.08)' : 'rgba(255,166,0,0.08)',
              padding: '10px 12px',
            }}
          >
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isOnline ? '#7effb6' : '#ffcf7e',
                marginBottom: 4,
              }}
            >
              {isOnline ? 'Online' : 'Offline Mode Active'}
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {offlineSongs.length} saved offline song{offlineSongs.length === 1 ? '' : 's'} ready to play.
            </p>
          </div>
        )}

        {!selectedPlaylist && offlineSongs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(0,255,65,0.6)', marginBottom: 8 }}>
              Saved Offline
            </p>
            {offlineSongs.slice(0, 20).map((song, i) => (
              <div key={`offline-${song.id}`} style={{ marginBottom: 8 }}>
                <SongRow song={song} index={i} showIndex onClick={(s, idx) => playSong(s, idx, offlineSongs)} />
              </div>
            ))}
          </div>
        )}

        {!selectedPlaylist && playlists.map((playlist, i) => (
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

        {!selectedPlaylist && playlists.length === 0 && (
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            padding: '30px 0',
          }}>
            No playlists yet. Create one from the button above.
          </p>
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
              <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: '#fff' }}>
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

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(0,255,65,0.6)', marginBottom: 8 }}>
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
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(0,255,65,0.6)', margin: '16px 0 8px' }}>
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
                        border: '1px solid rgba(0,255,65,0.3)',
                        background: 'rgba(0,255,65,0.08)',
                        color: '#00ff6a',
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
