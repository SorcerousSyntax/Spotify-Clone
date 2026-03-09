import { create } from 'zustand';
import { supabase, hasSupabase } from '../lib/supabase';
import {
  cacheSongForOffline as cacheSongForOfflineAsset,
  getPreferredSongStreamUrl,
} from '../lib/offlineAudio';

export const LIKED_SONGS_PLAYLIST_ID = 'liked-songs-auto';
export const LIKED_SONGS_PLAYLIST_NAME = 'Liked Songs';

const makePlaylistId = () =>
  `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toSongMap = (songs = []) =>
  songs.reduce((acc, song) => {
    if (song?.id) {
      acc[song.id] = song;
    }
    return acc;
  }, {});

const toLikedSongsPlaylist = (likedSongIds = [], existing = {}) => ({
  id: LIKED_SONGS_PLAYLIST_ID,
  name: LIKED_SONGS_PLAYLIST_NAME,
  emoji: existing.emoji || '💚',
  songIds: [...likedSongIds],
  createdAt: existing.createdAt || Date.now(),
  isSystem: true,
});

const ensureLikedSongsPlaylist = (playlists = [], likedSongIds = []) => {
  const existing = playlists.find((playlist) => playlist.id === LIKED_SONGS_PLAYLIST_ID);
  const nextLiked = toLikedSongsPlaylist(likedSongIds, existing);
  const others = playlists.filter((playlist) => playlist.id !== LIKED_SONGS_PLAYLIST_ID);
  return [nextLiked, ...others];
};

const isUuid = (value = '') =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const toDeterministicUuid = (inputValue = '') => {
  const input = String(inputValue || '');
  if (isUuid(input)) return input;

  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  let h3 = 0x811c9dc5;
  let h4 = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + 17; h2 = Math.imul(h2, 0x01000193);
    h3 ^= c + 31; h3 = Math.imul(h3, 0x01000193);
    h4 ^= c + 47; h4 = Math.imul(h4, 0x01000193);
  }

  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const raw = `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`.slice(0, 32).split('');

  raw[12] = '4';
  const variant = parseInt(raw[16], 16);
  raw[16] = ((variant & 0x3) | 0x8).toString(16);

  const full = raw.join('');
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}-${full.slice(16, 20)}-${full.slice(20, 32)}`;
};

const normalizeSong = (song = {}) => ({
  id: toDeterministicUuid(song.id || song.song_id || song.source_id || song.url || song.title || ''),
  source_id: song.source_id || song.id || song.song_id || '',
  title: song.title || song.name || 'Unknown Title',
  artist: song.artist || song.primaryArtists || '',
  album: song.album || '',
  album_art_url: song.album_art_url || song.albumArt || song.album_art || '',
  url: song.url || song.stream_url || song.r2_url || '',
  stream_url: song.stream_url || song.url || song.r2_url || '',
  r2_url: song.r2_url || song.stream_url || song.url || '',
  duration: song.duration || 0,
  liked_by: song.liked_by || '',
});

const getCurrentLikerName = async () => {
  if (!supabase) return 'Anonymous';
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Supabase getUser for liked_by error:', error);
    return 'Anonymous';
  }

  const user = data?.user;
  if (!user) return 'Anonymous';

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    user.email ||
    'Anonymous';

  return displayName;
};

const toLikeRecord = (song) => ({
  song_id: song.id,
  title: song.title,
  artist: song.artist,
  album_art: song.album_art_url,
  url: song.url || song.stream_url,
  liked_by: song.liked_by || 'Anonymous',
  liked_at: new Date().toISOString(),
});

const toHistoryRecord = (song) => ({
  song_id: song.id,
  title: song.title,
  artist: song.artist,
  album_art: song.album_art_url,
  url: song.url || song.stream_url,
  played_at: new Date().toISOString(),
});

const ensureSongInSupabase = async (songInput) => {
  if (!supabase) return;
  const song = normalizeSong(songInput);
  if (!song.id) return;

  const { error } = await supabase
    .from('songs')
    .upsert({
      id: song.id,
      title: song.title,
      artist: song.artist || null,
      album: song.album || null,
      duration: song.duration || 0,
      r2_url: song.url || song.stream_url || song.r2_url || null,
      album_art_url: song.album_art_url || null,
    }, { onConflict: 'id' });

  if (error) {
    console.error('Supabase songs upsert error:', error);
  }
};

const insertLikeRecord = async (songInput) => {
  if (!supabase) return;
  const liker = await getCurrentLikerName();
  const song = normalizeSong({
    ...songInput,
    liked_by: liker,
  });
  await ensureSongInSupabase(song);

  await supabase.from('liked_songs').delete().eq('song_id', song.id);

  const rich = await supabase.from('liked_songs').insert(toLikeRecord(song));
  if (!rich.error) return;

  const minimal = await supabase.from('liked_songs').insert({
    song_id: song.id,
    liked_at: new Date().toISOString(),
  });
  if (minimal.error) {
    console.error('Supabase liked_songs insert error:', minimal.error);
  }
};

const upsertPlayHistoryRecord = async (songInput) => {
  if (!supabase) return;
  const song = normalizeSong(songInput);
  await ensureSongInSupabase(song);

  await supabase.from('play_history').delete().eq('song_id', song.id);

  const rich = await supabase.from('play_history').insert(toHistoryRecord(song));
  if (!rich.error) return;

  const minimal = await supabase.from('play_history').insert({
    song_id: song.id,
    played_at: new Date().toISOString(),
  });
  if (minimal.error) {
    console.error('Supabase play_history insert error:', minimal.error);
  }
};

const OFFLINE_LIBRARY_KEY = 'raabta_offline_library_v1';

const readOfflineLibrarySnapshot = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(OFFLINE_LIBRARY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      likedSongIds: Array.isArray(parsed?.likedSongIds) ? parsed.likedSongIds : [],
      recentlyPlayed: Array.isArray(parsed?.recentlyPlayed) ? parsed.recentlyPlayed : [],
      songsById: parsed?.songsById && typeof parsed.songsById === 'object' ? parsed.songsById : {},
      playlists: Array.isArray(parsed?.playlists) ? parsed.playlists : [],
    };
  } catch (error) {
    console.warn('Offline snapshot read failed:', error?.message || error);
    return null;
  }
};

const persistOfflineLibrarySnapshot = ({ likedSongIds, recentlyPlayed, songsById, playlists }) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      OFFLINE_LIBRARY_KEY,
      JSON.stringify({
        likedSongIds: [...(likedSongIds || [])],
        recentlyPlayed: Array.isArray(recentlyPlayed) ? recentlyPlayed : [],
        songsById: songsById || {},
        playlists: Array.isArray(playlists) ? playlists : [],
      })
    );
  } catch (error) {
    console.warn('Offline snapshot write failed:', error?.message || error);
  }
};

const cacheSongForOffline = async (songInput) => {
  if (typeof window === 'undefined' || !window.caches || !navigator.onLine) return;

  const song = normalizeSong(songInput);
  if (!getPreferredSongStreamUrl(song)) return;

  try {
    await cacheSongForOfflineAsset(song);
  } catch (error) {
    console.warn('Auto cache for offline failed:', error?.message || error);
  }
};

const offlineSnapshot = readOfflineLibrarySnapshot();

const usePlayerStore = create((set, get) => ({
  // Current song
  currentSong: null,
  queue: [],
  queueIndex: 0,

  // Playback state
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 1,
  isMuted: false,

  // Modes
  shuffle: false,
  repeat: 'off', // 'off' | 'all' | 'one'

  // UI state
  isNowPlayingOpen: false,
  isLyricsPanelOpen: false,
  dominantColor: [29, 185, 84],
  playerControls: {
    seek: () => {},
    getFrequencyData: () => new Uint8Array(64),
  },

  // Liked songs
  likedSongIds: new Set(offlineSnapshot?.likedSongIds || []),

  // Recently played
  recentlyPlayed: (offlineSnapshot?.recentlyPlayed || []).map(normalizeSong),

  // Song registry for library/liked/playlists
  songsById: Object.entries(offlineSnapshot?.songsById || {}).reduce((acc, [id, song]) => {
    acc[id] = normalizeSong(song);
    return acc;
  }, {}),

  // User playlists (custom)
  playlists: ensureLikedSongsPlaylist((offlineSnapshot?.playlists || []).map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    emoji: playlist.emoji || '🎵',
    songIds: Array.isArray(playlist.songIds) ? playlist.songIds : [],
    createdAt: playlist.createdAt || Date.now(),
    isSystem: Boolean(playlist.isSystem),
  })), offlineSnapshot?.likedSongIds || []),

  supabaseReady: hasSupabase,

  // Actions
  setCurrentSong: (songInput) => {
    const song = normalizeSong(songInput);
    if (!song?.id) return;

    const state = get();
    const recent = [song, ...state.recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 20);
    const nextSongsById = {
      ...state.songsById,
      [song.id]: song,
    };

    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: recent,
      songsById: nextSongsById,
      playlists: state.playlists,
    });

    set({
      currentSong: song,
      isPlaying: true,
      progress: 0,
      recentlyPlayed: recent,
      songsById: nextSongsById,
    });

    get().upsertPlayHistory(song);
  },

  setQueue: (songs, startIndex = 0) => set(() => ({
    queue: (Array.isArray(songs) ? songs : []).map(normalizeSong),
    queueIndex: startIndex,
  })),

  registerSongs: (songs) => set((state) => {
    const nextSongsById = {
      ...state.songsById,
      ...toSongMap((Array.isArray(songs) ? songs : [songs]).map(normalizeSong)),
    };

    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: nextSongsById,
      playlists: state.playlists,
    });

    return { songsById: nextSongsById };
  }),

  hydrateFromSupabase: async () => {
    if (!supabase) {
      console.warn('Supabase not configured in frontend');
      return;
    }

    const likedQuery = await supabase
      .from('liked_songs')
      .select('*')
      .order('liked_at', { ascending: false });

    if (likedQuery.error) {
      console.error('Supabase liked_songs fetch error:', likedQuery.error);
    }

    const historyQuery = await supabase
      .from('play_history')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(20);

    if (historyQuery.error) {
      console.error('Supabase play_history fetch error:', historyQuery.error);
    }

    const playlistsQuery = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false });

    if (playlistsQuery.error) {
      console.error('Supabase playlists fetch error:', playlistsQuery.error);
    }

    const likedIds = (likedQuery.data || []).map((row) => row.song_id).filter(Boolean);
    const historyIds = (historyQuery.data || []).map((row) => row.song_id).filter(Boolean);
    const allDbIds = [...new Set([...likedIds, ...historyIds])];

    let songsFromDbById = {};
    if (allDbIds.length > 0) {
      const songsQuery = await supabase
        .from('songs')
        .select('*')
        .in('id', allDbIds);

      if (songsQuery.error) {
        console.error('Supabase songs fetch error:', songsQuery.error);
      } else {
        songsFromDbById = (songsQuery.data || []).reduce((acc, row) => {
          const mapped = normalizeSong({
            id: row.id,
            title: row.title,
            artist: row.artist,
            album: row.album,
            duration: row.duration,
            r2_url: row.r2_url,
            album_art_url: row.album_art_url,
            url: row.r2_url,
            stream_url: row.r2_url,
          });
          acc[row.id] = mapped;
          return acc;
        }, {});
      }
    }

    const likedSongs = (likedQuery.data || [])
      .map((row) => songsFromDbById[row.song_id]
        ? normalizeSong({ ...songsFromDbById[row.song_id], liked_by: row.liked_by || '' })
        : normalizeSong({ id: row.song_id, title: row.title, artist: row.artist, album_art_url: row.album_art, url: row.url, stream_url: row.url, liked_by: row.liked_by || '' }))
      .filter((song) => song?.id);

    const historySongs = (historyQuery.data || [])
      .map((row) => songsFromDbById[row.song_id] || normalizeSong({ id: row.song_id, title: row.title, artist: row.artist, album_art_url: row.album_art, url: row.url, stream_url: row.url }))
      .filter((song) => song?.id);

    const loadedPlaylists = (playlistsQuery.data || []).map((row) => {
      if (row.id === LIKED_SONGS_PLAYLIST_ID || row.name === LIKED_SONGS_PLAYLIST_NAME) {
        return null;
      }

      const songs = Array.isArray(row.songs) ? row.songs.map(normalizeSong) : [];
      return {
        id: row.id,
        name: row.name,
        emoji: row.emoji || '🎵',
        songIds: songs.map((song) => song.id).filter(Boolean),
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      };
    }).filter(Boolean);

    const playlistSongs = (playlistsQuery.data || [])
      .flatMap((row) => (Array.isArray(row.songs) ? row.songs : []))
      .map(normalizeSong)
      .filter((song) => song.id);

    set((state) => {
      const likedIds = likedSongs.map((song) => song.id);
      const nextState = {
        likedSongIds: new Set(likedIds),
        recentlyPlayed: historySongs,
        playlists: ensureLikedSongsPlaylist(loadedPlaylists, likedIds),
        songsById: {
          ...state.songsById,
          ...toSongMap([...likedSongs, ...historySongs, ...playlistSongs]),
        },
      };

      persistOfflineLibrarySnapshot(nextState);
      return nextState;
    });

    if (navigator.onLine) {
      playlistSongs.slice(0, 40).forEach((song) => {
        cacheSongForOffline(song);
      });
    }
  },

  upsertPlayHistory: async (songInput) => {
    await upsertPlayHistoryRecord(songInput);
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (val) => set({ isPlaying: val }),

  setProgress: (val) => set({ progress: val }),
  setDuration: (val) => set({ duration: val }),

  setVolume: (val) => set({ volume: val, isMuted: val === 0 }),
  toggleMute: () => set((state) => ({
    isMuted: !state.isMuted,
    volume: state.isMuted ? (state.volume || 0.5) : 0,
  })),

  nextSong: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1;
    } else if (repeat === 'all') {
      nextIndex = 0;
    } else {
      return;
    }

    set({
      queueIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: true,
      progress: 0,
    });
  },

  prevSong: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current song
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    set({
      queueIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: true,
      progress: 0,
    });
  },

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeat: () => set((state) => {
    const modes = ['off', 'all', 'one'];
    const current = modes.indexOf(state.repeat);
    return { repeat: modes[(current + 1) % 3] };
  }),

  toggleNowPlaying: () => set((state) => ({
    isNowPlayingOpen: !state.isNowPlayingOpen,
  })),

  toggleLyricsPanel: () => set((state) => ({
    isLyricsPanelOpen: !state.isLyricsPanelOpen,
  })),

  setDominantColor: (color) => set({ dominantColor: color }),

  setPlayerControls: (controls) => set((state) => ({
    playerControls: {
      ...state.playerControls,
      ...controls,
    },
  })),

  toggleLike: (songId, songData) => set((state) => {
    const newLiked = new Set(state.likedSongIds);
    const rawLikedSong =
      songData?.id === songId
        ? songData
        : state.currentSong?.id === songId
          ? state.currentSong
          : state.songsById[songId];
    const likedSong = rawLikedSong ? normalizeSong(rawLikedSong) : null;

    const nextSongsById =
      likedSong?.id
        ? { ...state.songsById, [likedSong.id]: likedSong }
        : state.songsById;

    if (newLiked.has(songId)) {
      newLiked.delete(songId);
      if (supabase) {
        supabase
          .from('liked_songs')
          .delete()
          .eq('song_id', songId)
          .then(({ error }) => {
            if (error) {
              console.error('Supabase liked_songs delete error:', error);
            }
          });
      }
    } else {
      newLiked.add(songId);
      if (supabase && likedSong?.id) {
        insertLikeRecord(likedSong).catch((error) => {
          console.error('Supabase liked_songs insert exception:', error);
        });
      }
    }

    const nextPlaylists = ensureLikedSongsPlaylist(state.playlists, [...newLiked]);

    const likedSongsPlaylist = nextPlaylists.find((playlist) => playlist.id === LIKED_SONGS_PLAYLIST_ID);
    if (supabase && likedSongsPlaylist) {
      const songs = likedSongsPlaylist.songIds
        .map((id) => nextSongsById[id])
        .filter(Boolean)
        .map(normalizeSong);

      supabase
        .from('playlists')
        .upsert({
          id: likedSongsPlaylist.id,
          name: likedSongsPlaylist.name,
          emoji: likedSongsPlaylist.emoji,
          songs,
          created_at: new Date(likedSongsPlaylist.createdAt || Date.now()).toISOString(),
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase liked songs playlist upsert error:', error);
          }
        });
    }

    persistOfflineLibrarySnapshot({
      likedSongIds: newLiked,
      recentlyPlayed: state.recentlyPlayed,
      songsById: nextSongsById,
      playlists: nextPlaylists,
    });

    return {
      likedSongIds: newLiked,
      songsById: nextSongsById,
      playlists: nextPlaylists,
    };
  }),

  createPlaylist: ({ name, emoji = '🎵' }) => set((state) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return state;

    const playlist = {
      id: makePlaylistId(),
      name: cleanName,
      emoji,
      songIds: [],
      createdAt: Date.now(),
    };

    if (supabase) {
      supabase
        .from('playlists')
        .insert({
          id: playlist.id,
          name: playlist.name,
          songs: [],
          created_at: new Date(playlist.createdAt).toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase playlists insert error:', error);
          }
        });
    }

    const nextPlaylists = [playlist, ...state.playlists];
    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: state.songsById,
      playlists: nextPlaylists,
    });

    return { playlists: nextPlaylists };
  }),

  renamePlaylist: (playlistId, newName) => set((state) => {
    if (playlistId === LIKED_SONGS_PLAYLIST_ID) return state;

    const updated = state.playlists.map((playlist) =>
      playlist.id === playlistId
        ? { ...playlist, name: (newName || '').trim() || playlist.name }
        : playlist
    );

    const target = updated.find((playlist) => playlist.id === playlistId);
    if (supabase && target) {
      const songs = target.songIds
        .map((songId) => state.songsById[songId])
        .filter(Boolean)
        .map(normalizeSong);

      supabase
        .from('playlists')
        .upsert({
          id: target.id,
          name: target.name,
          songs,
          created_at: new Date(target.createdAt || Date.now()).toISOString(),
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase playlists rename upsert error:', error);
          }
        });
    }

    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: state.songsById,
      playlists: updated,
    });

    return { playlists: updated };
  }),

  deletePlaylist: (playlistId) => set((state) => {
    if (playlistId === LIKED_SONGS_PLAYLIST_ID) return state;

    if (supabase) {
      supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .then(({ error }) => {
          if (error) {
            console.error('Supabase playlists delete error:', error);
          }
        });
    }

    const nextPlaylists = state.playlists.filter((playlist) => playlist.id !== playlistId);
    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: state.songsById,
      playlists: nextPlaylists,
    });

    return { playlists: nextPlaylists };
  }),

  addSongToPlaylist: (playlistId, song) => set((state) => {
    if (!playlistId || !song?.id || playlistId === LIKED_SONGS_PLAYLIST_ID) return state;

    const normalized = normalizeSong(song);

    const nextPlaylists = state.playlists.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      if (playlist.songIds.includes(normalized.id)) return playlist;
      return {
        ...playlist,
        songIds: [...playlist.songIds, normalized.id],
      };
    });

    const target = nextPlaylists.find((playlist) => playlist.id === playlistId);
    if (supabase && target) {
      const songs = target.songIds
        .map((songId) => (songId === normalized.id ? normalized : state.songsById[songId]))
        .filter(Boolean)
        .map(normalizeSong);

      supabase
        .from('playlists')
        .upsert({
          id: target.id,
          name: target.name,
          songs,
          created_at: new Date(target.createdAt || Date.now()).toISOString(),
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase playlists add-song upsert error:', error);
          }
        });
    }

    const nextSongsById = {
      ...state.songsById,
      [normalized.id]: normalized,
    };

    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: nextSongsById,
      playlists: nextPlaylists,
    });

    cacheSongForOffline(normalized);

    return {
      songsById: nextSongsById,
      playlists: nextPlaylists,
    };
  }),

  removeSongFromPlaylist: (playlistId, songId) => set((state) => {
    const nextPlaylists = state.playlists.map((playlist) =>
      playlist.id === playlistId
        ? {
            ...playlist,
            songIds: playlist.songIds.filter((id) => id !== songId),
          }
        : playlist
    );

    const target = nextPlaylists.find((playlist) => playlist.id === playlistId);
    if (supabase && target) {
      const songs = target.songIds
        .map((id) => state.songsById[id])
        .filter(Boolean)
        .map(normalizeSong);

      supabase
        .from('playlists')
        .upsert({
          id: target.id,
          name: target.name,
          songs,
          created_at: new Date(target.createdAt || Date.now()).toISOString(),
        }, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) {
            console.error('Supabase playlists remove-song upsert error:', error);
          }
        });
    }

    persistOfflineLibrarySnapshot({
      likedSongIds: state.likedSongIds,
      recentlyPlayed: state.recentlyPlayed,
      songsById: state.songsById,
      playlists: nextPlaylists,
    });

    return { playlists: nextPlaylists };
  }),

  isLiked: (songId) => get().likedSongIds.has(songId),
}));

export default usePlayerStore;
