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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000000', overflow: 'hidden' }}>
      {/* Immersive Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <FloatOrb size={400} x={-10} y={-10} color={`rgba(${dr},${dg},${db}, 0.15)`} duration={10} delay={0} />
        <FloatOrb size={300} x={80} y={20} color="rgba(255, 45, 120, 0.1)" duration={12} delay={2} />
        <FloatOrb size={350} x={20} y={70} color="rgba(224, 64, 251, 0.1)" duration={15} delay={1} />
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 50% 50%, rgba(${dr},${dg},${db}, 0.2) 0%, transparent 80%)`,
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '30px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 24, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            ↓
          </motion.button>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)' }}>
            NOW PLAYING
          </div>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleLike(currentSong.id, currentSong)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 44, height: 44, color: likedSongIds.has(currentSong.id) ? '#ff2d78' : '#fff', fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
          >
            {likedSongIds.has(currentSong.id) ? '♥' : '♡'}
          </motion.button>
        </header>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            key={currentSong.id}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            style={{ width: 'min(320px, 70vw)', aspectRatio: '1/1', marginBottom: 40, position: 'relative' }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden',
              boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${dr},${dg},${db}, 0.3)`,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <img 
                src={currentSong.album_art_url} 
                alt={currentSong.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.15, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  style={{ position: 'absolute', inset: -10, border: `2px solid #ff2d78`, borderRadius: '25px', zIndex: -1 }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          <div style={{ textAlign: 'center', width: '100%', maxWidth: 600, padding: '0 20px' }}>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 48px)', lineHeight: 1.1, marginBottom: 8, fontWeight: 900 }}>
              {decodeSongTitle(currentSong.title).toUpperCase()}
            </h1>
            <p className="font-mono" style={{ fontSize: 12, color: '#ff2d78', letterSpacing: '0.15em', fontWeight: 500 }}>
              {currentSong.artist.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Footer Controls */}
        <footer style={{ marginTop: 'auto', width: '100%', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginBottom: 30 }}>
            <Waveform getFrequencyData={getFrequencyData} isPlaying={isPlaying} barCount={50} height={30} />
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 25 }}>
            <div 
              ref={progressBarRef}
              onMouseDown={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onMouseMove={(e) => isDragging && handleProgressDrag(e)}
              onMouseUp={handleProgressEnd}
              onTouchStart={(e) => { setIsDragging(true); handleProgressDrag(e); }}
              onTouchMove={(e) => isDragging && handleProgressDrag(e)}
              onTouchEnd={handleProgressEnd}
              style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', position: 'relative' }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #ff2d78, #e040fb)', borderRadius: '3px', boxShadow: '0 0 15px rgba(255, 45, 120, 0.5)' }}
              />
              <motion.div 
                style={{ position: 'absolute', left: `${progressPercent}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #ff2d78' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }} className="font-mono text-[10px] text-white/40">
              <span>{formatTime(currentProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, padding: '0 20px' }}>
            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={toggleShuffle} 
              style={{ background: 'none', border: 'none', color: shuffle ? '#ff2d78' : '#fff', opacity: shuffle ? 1 : 0.4, cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
            </motion.button>
            
            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={prevSong} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"></line></svg>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay} 
              className="glass"
              style={{ 
                width: 80, height: 80, borderRadius: '50%', background: '#ff2d78', border: 'none', color: '#000', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 4px 4px 10px rgba(255,255,255,0.4), 0 15px 30px rgba(255, 45, 120, 0.4)'
              }}
            >
              {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4 }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              )}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={nextSong} 
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"></line></svg>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={cycleRepeat} 
              style={{ background: 'none', border: 'none', color: repeat !== 'off' ? '#ff2d78' : '#fff', opacity: repeat !== 'off' ? 1 : 0.4, cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>{repeat === 'one' && <text x="12" y="15" fontSize="8" fill="currentColor" stroke="none" textAnchor="middle">1</text>}</svg>
            </motion.button>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                disabled={!customPlaylists.length}
                className="glass"
                style={{
                  flex: 1, height: 36, borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '0 10px', fontSize: 11,
                  fontFamily: "'Share Tech Mono', monospace", border: '1px solid rgba(255,255,255,0.1)', outline: 'none'
                }}
              >
                {customPlaylists.length === 0 ? <option>NO PLAYLISTS</option> : customPlaylists.map(pl => <option key={pl.id} value={pl.id}>{pl.name.toUpperCase()}</option>)}
              </select>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToPlaylist}
                className="btn-primary"
                style={{ height: 36, padding: '0 15px', fontSize: 10, borderRadius: '8px' }}
              >
                {playlistAddStatus || '+ ADD'}
              </motion.button>
            </div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={toggleLyricsPanel} 
              className="glass"
              style={{ padding: '8px 15px', borderRadius: '8px', fontSize: 10, color: '#ff2d78', border: '1px solid #ff2d78' }}
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
