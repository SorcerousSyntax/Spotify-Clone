import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import Waveform from '../components/Waveform';
import PlaylistSelector from '../components/PlaylistSelector';

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
  const toggleOffline = usePlayerStore((s) => s.toggleOffline);
  const downloadingIds = usePlayerStore((s) => s.downloadingIds);
  const seek = usePlayerStore((s) => s.playerControls.seek);
  
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      setIsTitleOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [currentSong?.title]);

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const isDownloading = downloadingIds.has(currentSong.id);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100dvh',
      touchAction: 'none'
    }}>
      {/* Ambient Background Blur */}
      <div style={{
        position: 'absolute',
        inset: '-50%',
        zIndex: 0,
        backgroundImage: `url(${currentSong.album_art_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(120px) saturate(150%)',
        opacity: 0.15,
        transform: 'scale(1.5)',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%) }
          100% { transform: translateX(-100%) }
        }
        .marquee-animation {
          display: inline-block;
          animation: marquee 8s linear infinite;
        }
      `}</style>

      {/* TOP BAR */}
      <header style={{ 
        height: 70, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 24px',
        position: 'relative',
        zIndex: 10,
        marginTop: 'env(safe-area-inset-top, 0px)'
      }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="card-tap"
          style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </motion.button>
        
        <h2 style={{ fontSize: 10, letterSpacing: '0.15em', fontWeight: 800, color: 'var(--color-text-muted)' }}>NOW PLAYING</h2>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleOffline(currentSong)}
          className="card-tap"
          style={{ width: 40, height: 40, border: 'none', background: 'transparent', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDownloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 18, height: 18, border: '2px solid var(--color-accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          )}
        </motion.button>
      </header>

      {/* ALBUM ART CONTAINER */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        zIndex: 5
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={isPlaying ? "animate-disc" : "animate-disc animate-disc-paused"}
          style={{ 
            width: '58vw', 
            maxWidth: '320px',
            aspectRatio: '1/1',
            borderRadius: '50%', 
            overflow: 'hidden', 
            border: '3px solid var(--color-border-accent)',
            boxShadow: '0 0 60px var(--color-accent-glow)',
            position: 'relative',
            background: 'var(--color-bg-elevated)'
          }}
        >
          <img 
            src={currentSong.album_art_url} 
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            alt="" 
          />
        </motion.div>
      </div>

      {/* WAVEFORM */}
      <div style={{ height: 60, padding: '0 32px', position: 'relative', zIndex: 10 }}>
        <Waveform />
      </div>

      {/* TIME DISPLAY */}
      <div style={{ 
        height: 30, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '0 32px',
        position: 'relative', 
        zIndex: 10 
      }}>
        <span style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: 'var(--color-accent-primary)', 
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.05em'
        }}>
          {formatTime(progress)} / {formatTime(duration)}
        </span>
      </div>

      {/* SONG INFO */}
      <div style={{ 
        height: 80, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 32px', 
        position: 'relative',
        zIndex: 10 
      }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 24 }}>
          <div ref={titleRef} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <h1 className={isTitleOverflowing ? "marquee-animation" : ""} style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              {decodeSongTitle(currentSong.title).toUpperCase()}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0 0', fontWeight: 400 }}>
            {currentSong.artist.toUpperCase()}
          </p>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggleLike(currentSong.id, currentSong)}
          className="card-tap"
          style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg 
            className={isLiked ? "animate-heart" : ""} 
            width="28" height="28" 
            viewBox="0 0 24 24" 
            fill={isLiked ? "var(--color-accent-primary)" : "none"} 
            stroke={isLiked ? "var(--color-accent-primary)" : "rgba(255,255,255,0.4)"} 
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </motion.button>
      </div>

      {/* CONTROLS */}
      <div style={{ 
        height: 100, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 32px',
        position: 'relative',
        zIndex: 10
      }}>
        <button
          onClick={toggleShuffle}
          className="card-tap"
          style={{ background: 'none', border: 'none', color: shuffle ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          SHUFFLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6L18 18V6z"/>
            </svg>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className="card-tap"
            style={{
              width: 72, 
              height: 72, 
              borderRadius: '50%', 
              background: 'var(--color-accent-primary)', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 0 32px rgba(255,45,120,0.6)',
            }}
          >
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4 }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z"/>
            </svg>
          </motion.button>
        </div>

        <button
          onClick={cycleRepeat}
          className="card-tap"
          style={{ background: 'none', border: 'none', color: repeat !== 'off' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', fontSize: 10, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          {repeat.toUpperCase()}
        </button>
      </div>

      {/* ADD TO PLAYLIST */}
      <div style={{ height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 10, marginBottom: 40 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowPlaylistSelector(true)}
          style={{ 
            padding: '12px 28px', 
            fontSize: 10,
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            color: 'white',
            borderRadius: 100,
            letterSpacing: '0.1em',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ADD TO PLAYLIST +
        </motion.button>
      </div>

      <AnimatePresence>
        {showPlaylistSelector && (
          <PlaylistSelector song={currentSong} onClose={() => setShowPlaylistSelector(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NowPlaying;
