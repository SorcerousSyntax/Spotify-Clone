import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';
import Waveform from '../components/Waveform';
import LyricsPanel from '../components/LyricsPanel';
import { decodeSongTitle } from '../lib/text';

// Ambient floating particle
const FloatOrb = ({ size, x, y, color, duration, delay }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size, borderRadius: '50%',
      background: color, filter: `blur(${size * 0.6}px)`, pointerEvents: 'none',
      left: `${x}%`, top: `${y}%`, zIndex: 0
    }}
    animate={{ y: [-20, 20, -20], x: [-15, 15, -15], opacity: [0.2, 0.4, 0.2] }}
    transition={{ duration, ease: 'easeInOut', repeat: Infinity, delay }}
  />
);

const NowPlaying = () => {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const isOffline = usePlayerStore((s) => s.isOffline(currentSong?.id));
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const playlists = usePlayerStore((s) => s.playlists);
  const addSongToPlaylist = usePlayerStore((s) => s.addSongToPlaylist);
  const seek = usePlayerStore((s) => s.playerControls.seek);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);

  const { dominantColor } = useColorExtract(currentSong?.album_art_url);
  const [dr, dg, db] = dominantColor;
  const accentColor = `rgb(${dr},${dg},${db})`;

  const [lyrics, setLyrics] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [playlistAddStatus, setPlaylistAddStatus] = useState('');
  const progressBarRef = useRef(null);

  const customPlaylists = playlists.filter((playlist) => playlist.id !== LIKED_SONGS_PLAYLIST_ID);

  useEffect(() => {
    if (customPlaylists.length && !selectedPlaylistId) {
      setSelectedPlaylistId(customPlaylists[0].id);
    }
  }, [customPlaylists, selectedPlaylistId]);

  useEffect(() => {
    if (!currentSong) return;
    setLyrics([]);
    fetch(`/api/lyrics?title=${encodeURIComponent(currentSong.title)}&artist=${encodeURIComponent(currentSong.artist || '')}`)
      .then((r) => r.json())
      .then((d) => { if (d.lyrics) setLyrics(d.lyrics); })
      .catch(() => {});
  }, [currentSong?.id]);

  const handleProgressDrag = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    setDragProgress(Math.max(0, Math.min(1, x / rect.width)) * duration);
  }, [duration]);

  const handleProgressEnd = useCallback(() => {
    if (isDragging) { seek(dragProgress); setIsDragging(false); }
  }, [isDragging, dragProgress, seek]);

  const handleAddToPlaylist = () => {
    if (!currentSong || !selectedPlaylistId) return;
    addSongToPlaylist(selectedPlaylistId, currentSong);
    setPlaylistAddStatus('ADDED!');
    setTimeout(() => setPlaylistAddStatus(''), 2000);
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };

  if (!currentSong) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#000' }}>
        <button className="btn-primary" onClick={() => navigate('/search')}>FIND MUSIC</button>
      </div>
    );
  }

  const currentProgress = isDragging ? dragProgress : progress;
  const progressPercent = duration > 0 ? (currentProgress / duration) * 100 : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', overflow: 'hidden' }}>
      {/* High Contrast Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 50% 50%, #ff2d78 0%, transparent 70%)`,
            filter: 'blur(120px)'
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', opacity: 0.05 }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '40px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <motion.button 
            whileHover={{ scale: 1.1, background: '#fff', color: '#000' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            style={{ background: 'transparent', border: '1px solid #fff', borderRadius: 0, width: 44, height: 44, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all 0.3s ease' }}
          >
            ✕
          </motion.button>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#ff2d78', fontWeight: 700 }}>
            TRACK ID: {currentSong.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleLike(currentSong.id, currentSong)}
              style={{ background: 'transparent', border: '1px solid #fff', borderRadius: 0, width: 44, height: 44, color: likedSongIds.has(currentSong.id) ? '#ff2d78' : '#fff', fontSize: 18, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              {likedSongIds.has(currentSong.id) ? '★' : '☆'}
            </motion.button>
          </div>
        </header>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            key={currentSong.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            style={{ width: 'min(400px, 80vw)', aspectRatio: '1/1', marginBottom: 60, position: 'relative' }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: 0, overflow: 'hidden',
              boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(255, 45, 120, 0.2)`,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <img 
                src={currentSong.album_art_url} 
                alt={currentSong.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            {isPlaying && (
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, border: '1px solid #ff2d78', zIndex: -1 }}
              />
            )}
          </motion.div>

          <div style={{ textAlign: 'left', width: '100%', maxWidth: 400 }}>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 0.9, marginBottom: 15, fontWeight: 900, letterSpacing: '-0.04em' }}
            >
              {decodeSongTitle(currentSong.title).toUpperCase()}
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-mono" style={{ fontSize: 14, color: '#ff2d78', letterSpacing: '0.2em', fontWeight: 800 }}
            >
              {currentSong.artist.toUpperCase()}
            </motion.p>
          </div>
        </div>

        {/* Footer Controls */}
        <footer style={{ marginTop: 'auto', width: '100%', maxWidth: 600, margin: '0 auto' }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: 40 }}>
            <div 
              ref={progressBarRef}
              onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onMouseMove={(e) => isDragging && handleProgressDrag(e)}
              onMouseUp={handleProgressEnd}
              style={{ height: 2, background: 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative' }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                style={{ height: '100%', background: '#ff2d78', boxShadow: '0 0 15px rgba(255, 45, 120, 0.5)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }} className="font-mono text-[10px] text-white/60 tracking-widest">
              <span>{formatTime(currentProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50 }}>
            <motion.button whileTap={{ scale: 0.8 }} onClick={toggleShuffle} style={{ background: 'none', border: 'none', color: shuffle ? '#ff2d78' : '#fff', opacity: shuffle ? 1 : 0.3, cursor: 'pointer' }}>
              SHUFFLE
            </motion.button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
              <motion.button whileTap={{ scale: 0.8 }} onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24, fontWeight: 900 }}>
                PREV
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay} 
                style={{ 
                  width: 80, height: 80, borderRadius: 0, background: '#fff', border: 'none', color: '#000', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900
                }}
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </motion.button>

              <motion.button whileTap={{ scale: 0.8 }} onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 24, fontWeight: 900 }}>
                NEXT
              </motion.button>
            </div>

            <motion.button whileTap={{ scale: 0.8 }} onClick={cycleRepeat} style={{ background: 'none', border: 'none', color: repeat !== 'off' ? '#ff2d78' : '#fff', opacity: repeat !== 'off' ? 1 : 0.3, cursor: 'pointer' }}>
              {repeat === 'one' ? 'REPEAT:1' : 'REPEAT:ALL'}
            </motion.button>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
             <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToPlaylist}
                className="clay"
                style={{ flex: 1, height: 44, fontSize: 12, borderRadius: 0 }}
              >
                {playlistAddStatus || 'ADD TO COLLECTION'}
              </motion.button>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={toggleLyricsPanel} 
              style={{ background: 'transparent', border: '1px solid #ff2d78', color: '#ff2d78', height: 44, padding: '0 25px', fontSize: 12, fontWeight: 800 }}
            >
              LYRICS
            </motion.button>
          </div>
        </footer>
      </div>

      <LyricsPanel lyrics={lyrics} onSeek={seek} />
    </div>
  );
};

export default NowPlaying;
