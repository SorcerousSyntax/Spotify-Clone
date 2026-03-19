import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore, { LIKED_SONGS_PLAYLIST_ID } from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';
import Waveform from '../components/Waveform';
import LyricsPanel from '../components/LyricsPanel';
import { decodeSongTitle } from '../lib/text';

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
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const seek = usePlayerStore((s) => s.playerControls.seek);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);

  const { dominantColor } = useColorExtract(currentSong?.album_art_url);
  const [dr, dg, db] = dominantColor;
  const accentColor = `rgb(${dr},${dg},${db})`;

  const [lyrics, setLyrics] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const progressBarRef = useRef(null);

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
      {/* Immersive Background */}
      <motion.div
        key={currentSong.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(${dr},${dg},${db}, 0.3) 0%, transparent 70%)`,
          filter: 'blur(100px)'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '40px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}
          >
            ↓
          </button>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>
            NOW PLAYING
          </div>
          <button 
            onClick={() => toggleLike(currentSong.id, currentSong)}
            style={{ background: 'none', border: 'none', color: likedSongIds.has(currentSong.id) ? '#ff2d78' : '#fff', fontSize: 24, cursor: 'pointer' }}
          >
            {likedSongIds.has(currentSong.id) ? '♥' : '♡'}
          </button>
        </header>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            key={currentSong.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ width: 'min(400px, 80vw)', aspectRatio: '1/1', marginBottom: 60, position: 'relative' }}
          >
            <img 
              src={currentSong.album_art_url} 
              alt={currentSong.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 40px rgba(${dr},${dg},${db}, 0.4)` }} 
            />
            {isPlaying && (
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', inset: -20, border: `2px solid ${accentColor}`, opacity: 0.3, zIndex: -1 }}
              />
            )}
          </motion.div>

          <div style={{ textAlign: 'center', width: '100%', maxWidth: 800 }}>
            <h1 style={{ fontSize: 'clamp(32px, 6vw, 80px)', lineHeight: 1, marginBottom: 10 }}>{decodeSongTitle(currentSong.title).toUpperCase()}</h1>
            <p className="font-mono" style={{ fontSize: 14, color: '#ff2d78', letterSpacing: '0.1em' }}>{currentSong.artist.toUpperCase()}</p>
          </div>
        </div>

        {/* Footer Controls */}
        <footer style={{ marginTop: 'auto' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 40 }}>
              <Waveform getFrequencyData={getFrequencyData} isPlaying={isPlaying} barCount={60} height={40} color="#ff2d78" />
            </div>

            <div 
              ref={progressBarRef}
              onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onMouseMove={(e) => isDragging && handleProgressDrag(e)}
              onMouseUp={handleProgressEnd}
              style={{ height: 4, background: 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', marginBottom: 15 }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                style={{ height: '100%', background: '#ff2d78', boxShadow: '0 0 15px #ff2d78' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }} className="font-mono text-[10px] text-white/30">
              <span>{formatTime(currentProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={toggleShuffle} style={{ background: 'none', border: 'none', color: shuffle ? '#ff2d78' : '#fff', opacity: shuffle ? 1 : 0.3, cursor: 'pointer', fontSize: 20 }}>⇄</button>
              <button onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 32 }}>«</button>
              <button 
                onClick={togglePlay} 
                style={{ 
                  width: 80, height: 80, borderRadius: '50%', background: '#ff2d78', border: 'none', color: '#000', 
                  fontSize: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 32 }}>»</button>
              <button onClick={cycleRepeat} style={{ background: 'none', border: 'none', color: repeat !== 'off' ? '#ff2d78' : '#fff', opacity: repeat !== 'off' ? 1 : 0.3, cursor: 'pointer', fontSize: 20 }}>↻</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <button onClick={toggleLyricsPanel} className="btn-secondary" style={{ fontSize: 10 }}>VIEW LYRICS</button>
            </div>
          </div>
        </footer>
      </div>

      <LyricsPanel lyrics={lyrics} onSeek={seek} />
    </div>
  );
};

export default NowPlaying;
