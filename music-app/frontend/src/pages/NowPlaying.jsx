import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import PlaylistSelector from '../components/PlaylistSelector';
import useColorExtract from '../hooks/useColorExtract';

/* ── helpers ── */
const fmt = (s) => {
  if (!s || Number.isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/* ── SVG icons ── */
const IconHeart = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ff2d78' : 'none'} stroke={filled ? '#ff2d78' : 'rgba(255,255,255,0.65)'} strokeWidth="2">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

/* Correct shuffle icon — two crossing arrows */
const IconShuffle = ({ active }) => {
  const c = active ? '#ff2d78' : 'rgba(255,255,255,0.6)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <path d="M4 20L21 3" />
      <polyline points="21 16 21 21 16 21" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
};

const IconRepeat = ({ mode }) => {
  const c = mode !== 'off' ? '#ff2d78' : 'rgba(255,255,255,0.6)';
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      {mode === 'one' && (
        <text x="9.5" y="14.5" fontSize="7" fill={c} stroke="none" fontWeight="bold" fontFamily="sans-serif">1</text>
      )}
    </svg>
  );
};
const IconPrev = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
  </svg>
);
const IconNext = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>
);
const IconDots = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
);
const IconDownload = ({ done, spinning }) => {
  if (spinning) return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ width: 18, height: 18, border: '2px solid #ff2d78', borderTopColor: 'transparent', borderRadius: '50%' }} />
  );
  if (done) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
};
const IconQueue = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

/* ── Queue Panel ── */
const QueuePanel = ({ queue, queueIndex, onClose, onPlay }) => (
  <motion.div
    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(5,5,8,0.97)', backdropFilter: 'blur(30px)',
      display: 'flex', flexDirection: 'column',
    }}
  >
    <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>QUEUE</h2>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer' }}>✕</button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 40px' }}>
      {queue.map((song, i) => {
        const isCurrent = i === queueIndex;
        return (
          <motion.button key={`${song.id}-${i}`} whileTap={{ scale: 0.97 }}
            onClick={() => { onPlay(i); onClose(); }}
            style={{
              width: '100%', background: isCurrent ? 'rgba(255,45,120,0.15)' : 'transparent',
              border: isCurrent ? '1px solid rgba(255,45,120,0.3)' : '1px solid transparent',
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 4,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              <img src={song.album_art_url || '/placeholder-album.svg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? '#ff2d78' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {decodeSongTitle(song.title || 'Unknown')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {song.artist || 'Unknown Artist'}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN NOW PLAYING COMPONENT
══════════════════════════════════════════════════════════════ */
const NowPlaying = () => {
  const navigate = useNavigate();

  const currentSong    = usePlayerStore((s) => s.currentSong);
  const isPlaying      = usePlayerStore((s) => s.isPlaying);
  const progress       = usePlayerStore((s) => s.progress);
  const duration       = usePlayerStore((s) => s.duration);
  const shuffle        = usePlayerStore((s) => s.shuffle);
  const repeat         = usePlayerStore((s) => s.repeat);
  const queue          = usePlayerStore((s) => s.queue);
  const queueIndex     = usePlayerStore((s) => s.queueIndex);
  const likedSongIds   = usePlayerStore((s) => s.likedSongIds);
  const offlineSongIds = usePlayerStore((s) => s.offlineSongIds);
  const downloadingIds = usePlayerStore((s) => s.downloadingIds);
  const setDominantColorInStore = usePlayerStore((s) => s.setDominantColor);
  const togglePlay     = usePlayerStore((s) => s.togglePlay);
  const nextSong       = usePlayerStore((s) => s.nextSong);
  const prevSong       = usePlayerStore((s) => s.prevSong);
  const toggleShuffle  = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat    = usePlayerStore((s) => s.cycleRepeat);
  const toggleLike     = usePlayerStore((s) => s.toggleLike);
  const toggleOffline  = usePlayerStore((s) => s.toggleOffline);
  const seek           = usePlayerStore((s) => s.playerControls?.seek);
  const setQueue       = usePlayerStore((s) => s.setQueue);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);

  const isLiked      = currentSong ? likedSongIds.has(currentSong.id) : false;
  const isOffline    = currentSong ? offlineSongIds.has(currentSong.id) : false;
  const isDownloading = currentSong ? downloadingIds?.has(currentSong.id) : false;

  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  /* ── Live color extraction from album art ── */
  const { dominantColor } = useColorExtract(currentSong?.album_art_url || null);

  // Push extracted color into the global store so other components can use it
  useEffect(() => {
    if (dominantColor && setDominantColorInStore) {
      setDominantColorInStore(dominantColor);
    }
  }, [dominantColor, setDominantColorInStore]);

  /* Darken color so white text stays readable */
  const [r, g, b] = dominantColor || [29, 29, 40];
  // Scale down brightness to at most 60% so background is never blinding
  const maxBrightness = 0.55;
  const total = r + g + b;
  const scale = total > 0 ? Math.min(1, (255 * 3 * maxBrightness) / total) : 1;
  const dr = Math.round(r * scale);
  const dg = Math.round(g * scale);
  const db = Math.round(b * scale);

  /* ── Swipe down to dismiss ── */
  const dragY  = useMotionValue(0);
  const bgOpacity = useTransform(dragY, [0, 220], [1, 0]);
  const contentScale = useTransform(dragY, [0, 220], [1, 0.91]);

  /* ── Seek bar ── */
  const seekBarRef = useRef(null);
  const isSeeking  = useRef(false);
  const progressRatio = duration > 0 ? Math.min(progress / duration, 1) : 0;

  const handleSeekBar = useCallback((e) => {
    if (!duration || !seekBarRef.current) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seek?.(ratio * duration);
  }, [duration, seek]);

  /* queue jump */
  const jumpToQueueIndex = (i) => {
    const song = queue[i];
    if (!song) return;
    setCurrentSong(song);
    setQueue(queue, i);
  };

  if (!currentSong) return null;

  const title  = decodeSongTitle(currentSong.title || 'Unknown Title');
  const artist = currentSong.artist || 'Unknown Artist';

  return (
    <>
      {/* ── animated background gradient — reacts to album art colour ── */}
      <motion.div
        style={{
          position: 'fixed', inset: 0, zIndex: 1999,
          background: `linear-gradient(160deg, rgb(${dr},${dg},${db}) 0%, rgb(${Math.round(dr*0.4)},${Math.round(dg*0.4)},${Math.round(db*0.4)}) 45%, rgb(8,8,12) 100%)`,
          transition: 'background 0.8s ease',
          opacity: bgOpacity,
        }}
      />

      <motion.div
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          color: '#fff',
          display: 'flex', flexDirection: 'column',
          height: '100dvh',
          overflow: 'hidden', /* ← NO scroll */
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          y: dragY,
          scale: contentScale,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.35 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 450) {
            navigate(-1);
          } else {
            dragY.set(0);
          }
        }}
      >
        {/* ── TOP BAR ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 20px 0', flexShrink: 0, position: 'relative',
        }}>
          {/* drag handle */}
          <div style={{
            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
            width: 34, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.28)',
          }} />

          <motion.button whileTap={{ scale: 0.82 }} onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 10px 10px 4px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </motion.button>

          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.16em', margin: 0 }}>
            NOW PLAYING
          </p>

          <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowPlaylistSelector(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px 10px 10px' }}>
            <IconDots />
          </motion.button>
        </div>

        {/* ── ALBUM ART — fills available space, never overflows ── */}
        <div style={{
          flex: '1 1 0', minHeight: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 32px',
        }}>
          <motion.div
            key={currentSong.id}
            initial={{ opacity: 0, scale: 0.91, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              /* Square but capped so it never pushes layout */
              width: '100%', maxWidth: 300,
              aspectRatio: '1 / 1',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: `0 24px 64px rgba(${dr},${dg},${db},0.55), 0 8px 24px rgba(0,0,0,0.6)`,
              transition: 'box-shadow 0.8s ease',
            }}
          >
            <img src={currentSong.album_art_url || '/placeholder-album.svg'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
          </motion.div>
        </div>

        {/* ── SONG INFO + LIKE ── */}
        <div style={{ padding: '0 26px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 20, fontWeight: 900, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.02em',
            }}>
              {title}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {artist}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.72 }}
            onClick={() => toggleLike(currentSong.id, currentSong)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 4 }}>
            <IconHeart filled={isLiked} />
          </motion.button>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div style={{ padding: '12px 26px 0', flexShrink: 0 }}>
          <div
            ref={seekBarRef}
            onMouseDown={(e) => { isSeeking.current = true; handleSeekBar(e); }}
            onMouseMove={(e) => { if (isSeeking.current) handleSeekBar(e); }}
            onMouseUp={() => { isSeeking.current = false; }}
            onMouseLeave={() => { isSeeking.current = false; }}
            onTouchStart={(e) => { isSeeking.current = true; handleSeekBar(e); }}
            onTouchMove={(e) => { if (isSeeking.current) handleSeekBar(e); }}
            onTouchEnd={() => { isSeeking.current = false; }}
            style={{ width: '100%', position: 'relative', cursor: 'pointer', paddingTop: 10, paddingBottom: 10, marginTop: -10, marginBottom: -10, boxSizing: 'content-box' }}
          >
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.18)', borderRadius: 3, position: 'relative' }}>
              <div style={{
                width: `${progressRatio * 100}%`, height: '100%',
                background: '#fff', borderRadius: 3, position: 'relative',
                transition: 'width 0.1s linear',
              }}>
                <div style={{
                  position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                  width: 11, height: 11, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 0 5px rgba(0,0,0,0.4)',
                }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{fmt(progress)}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* ── CONTROLS ── */}
        <div style={{
          padding: '8px 26px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <motion.button whileTap={{ scale: 0.82 }} onClick={toggleShuffle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, position: 'relative' }}>
            <IconShuffle active={shuffle} />
            {shuffle && <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#ff2d78' }} />}
          </motion.button>

          <motion.button whileTap={{ scale: 0.82 }} onClick={prevSong}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <IconPrev />
          </motion.button>

          <motion.button whileTap={{ scale: 0.93 }} onClick={togglePlay}
            style={{
              width: 62, height: 62, borderRadius: '50%',
              background: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
            }}>
            {isPlaying
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="#111"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="#111"><path d="M8 5v14l11-7z"/></svg>
            }
          </motion.button>

          <motion.button whileTap={{ scale: 0.82 }} onClick={nextSong}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <IconNext />
          </motion.button>

          <motion.button whileTap={{ scale: 0.82 }} onClick={cycleRepeat}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, position: 'relative' }}>
            <IconRepeat mode={repeat} />
            {repeat !== 'off' && <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#ff2d78' }} />}
          </motion.button>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div style={{
          padding: '4px 26px 6px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <motion.button whileTap={{ scale: 0.82 }} onClick={() => toggleOffline(currentSong)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <IconDownload done={isOffline} spinning={isDownloading} />
          </motion.button>

          <motion.button whileTap={{ scale: 0.82 }} onClick={() => setShowQueue(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <IconQueue />
          </motion.button>
        </div>
      </motion.div>

      {/* ── QUEUE PANEL ── */}
      <AnimatePresence>
        {showQueue && (
          <QueuePanel queue={queue} queueIndex={queueIndex}
            onClose={() => setShowQueue(false)} onPlay={jumpToQueueIndex} />
        )}
      </AnimatePresence>

      {/* ── PLAYLIST SELECTOR ── */}
      <AnimatePresence>
        {showPlaylistSelector && (
          <PlaylistSelector song={currentSong} onClose={() => setShowPlaylistSelector(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default NowPlaying;
