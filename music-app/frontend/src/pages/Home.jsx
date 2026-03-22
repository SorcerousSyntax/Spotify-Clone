import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';
import PlaylistFolderCard from '../components/PlaylistFolderCard';
import SplineBackground from '../components/SplineBackground';

const Home = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [userName, setUserName] = useState('');

  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);
  const playlists = usePlayerStore((s) => s.playlists);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetch(`/api/search?q=Arijit Singh`);
      if (res.ok) {
        const data = await res.json();
        const results = (data?.results || data?.songs || []).slice(0, 10);
        setTrendingSongs(results);
      }

      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
          const firstName = name.split(/[\s._@+\d]+/).filter(Boolean)[0] || '';
          setUserName(firstName.toUpperCase());
        }
      }
    };
    loadData();
  }, []);

  const playSong = (song, index, queue) => {
    setCurrentSong(song);
    setQueue(queue, index);
    navigate('/now-playing');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ padding: '100px 20px 150px 20px', position: 'relative', zIndex: 10 }}>
      {/* Hero Greeting */}
      <section style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, lineHeight: 1, color: '#fff' }}>
          HI {userName || 'YOU'}<span className="text-pink">.</span>
        </h1>
        <p className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          WELCOME TO RAABTA
        </p>
      </section>

      {/* Playlist Folders */}
      {playlists.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 15, overflowX: 'auto', paddingBottom: 15 }} className="no-scrollbar">
            {playlists.map((playlist) => (
              <PlaylistFolderCard
                key={playlist.id}
                playlist={{
                  ...playlist,
                  songs: playlist.songIds.map(id => usePlayerStore.getState().songsById[id]).filter(Boolean)
                }}
                onClick={() => {
                  const pSongs = playlist.songIds.map(id => usePlayerStore.getState().songsById[id]).filter(Boolean);
                  if (pSongs.length > 0) playSong(pSongs[0], 0, pSongs);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentFromStore.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>RECENTLY PLAYED</h2>
            <p className="font-mono" style={{ fontSize: 9, color: 'var(--pink-hot)' }}>HISTORY / {recentFromStore.length.toString().padStart(3, '0')}</p>
          </div>
          <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 15 }} className="no-scrollbar">
            {recentFromStore.slice(0, 10).map((song) => (
              <motion.div
                key={song.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => playSong(song, 0, [song])}
                style={{ minWidth: 120, cursor: 'pointer' }}
              >
                <div className="card-glass" style={{ width: 120, height: 120, borderRadius: 24, overflow: 'hidden', marginBottom: 12 }}>
                  <img src={song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
                <h3 style={{ fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{decodeSongTitle(song.title).toUpperCase()}</h3>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{song.artist.toUpperCase()}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Songs (Simplified from Pick a Mood) */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>TRENDING NOW</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15 }}>
          {trendingSongs.slice(0, 6).map((song, i) => (
            <motion.div
              key={song.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => playSong(song, i, trendingSongs)}
              className="glass"
              style={{ padding: 12, borderRadius: 24, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={song.image?.[1]?.url || song.album_art_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{decodeSongTitle(song.name || song.title).toUpperCase()}</h3>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>{song.artist?.toUpperCase() || 'UNKNOWN'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
};

export default Home;
