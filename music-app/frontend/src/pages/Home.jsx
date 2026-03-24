import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import { supabase } from '../lib/supabase';
import { decodeSongTitle } from '../lib/text';
import PlaylistFolderCard from '../components/PlaylistFolderCard';
import AlbumCard from '../components/AlbumCard';

const Home = () => {
  const navigate = useNavigate();
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [userName, setUserName] = useState('');

  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const recentFromStore = usePlayerStore((s) => s.recentlyPlayed);
  const playlists = usePlayerStore((s) => s.playlists);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`/api/search?q=Arijit Singh`);
        if (res.ok) {
          const data = await res.json();
          const results = (data?.results || data?.songs || []).slice(0, 10);
          setTrendingSongs(results);
        }
      } catch (e) {}

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
    <div style={{ position: 'relative', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ padding: '0 24px 150px 24px', position: 'relative', zIndex: 10 }}>
        
        {/* Hero Greeting */}
        <section style={{ marginBottom: 48 }}>
          <h1 className="page-title">
            HI {userName || 'YOU'}<span>.</span>
          </h1>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.1em', marginTop: 8 }}>
            WELCOME TO RAABTA
          </p>
        </section>

        {/* Playlist Folders */}
        {playlists.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 className="section-heading" style={{ fontSize: 14, marginBottom: 24 }}>PLAYLISTS</h2>
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              overflowX: 'auto', 
              paddingBottom: 8,
              marginLeft: -24,
              paddingLeft: 24,
              marginRight: -24,
              paddingRight: 24
            }} className="no-scrollbar">
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
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="section-heading" style={{ fontSize: 14 }}>RECENTLY PLAYED</h2>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent-primary)', letterSpacing: '0.05em' }}>
                VIEW ALL
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 20, 
              overflowX: 'auto', 
              paddingBottom: 8,
              marginLeft: -24,
              paddingLeft: 24,
              marginRight: -24,
              paddingRight: 24
            }} className="no-scrollbar">
              {recentFromStore.slice(0, 10).map((song, i) => (
                <AlbumCard
                  key={song.id}
                  song={song}
                  index={i}
                  onClick={() => playSong(song, 0, [song])}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Now */}
        <section>
          <h2 className="section-heading" style={{ fontSize: 14, marginBottom: 24 }}>TRENDING NOW</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {trendingSongs.slice(0, 6).map((song, i) => (
              <motion.div
                key={song.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => playSong(song, i, trendingSongs)}
                className="card-tap"
                style={{ 
                  padding: 12, 
                  borderRadius: 20, 
                  background: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-border)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12 
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-elevated)' }}>
                  <img src={song.image?.[1]?.url || song.album_art_url} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', textTransform: 'uppercase' }}>{decodeSongTitle(song.name || song.title)}</h3>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{song.artist?.toUpperCase() || 'UNKNOWN'}</p>
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
