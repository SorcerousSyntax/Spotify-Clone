import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';
import useColorExtract from '../hooks/useColorExtract';

const ScrollingTitle = ({ title, fontSize = 14 }) => {
  const safeTitle = decodeSongTitle(title || '');
  const shouldScroll = safeTitle.length > 22;

  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
      {shouldScroll ? (
        <motion.div
          style={{ display: 'flex', width: 'max-content', gap: 32 }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
        >
          {[safeTitle, safeTitle].map((t, i) => (
            <span key={i} style={{ fontSize, letterSpacing: '-0.01em', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, lineHeight: 1.2 }}>
              {t}
            </span>
          ))}
        </motion.div>
      ) : (
        <p style={{ fontSize, letterSpacing: '-0.01em', color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {safeTitle}
        </p>
      )}
    </div>
  );
};

const MiniPlayer = () => {
  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const nextSong = usePlayerStore((s) => s.nextSong);
  const prevSong = usePlayerStore((s) => s.prevSong);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);

  const { dominantColor } = useColorExtract(currentSong?.album_art_url);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  const [dr, dg, db] = dominantColor;
  const accent = `rgb(${dr},${dg},${db})`;
  const accentA = (a) => `rgba(${dr},${dg},${db},${a})`;

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          style={{ position: 'fixed', bottom: 78, right: 12, left: 12, zIndex: 99, borderRadius: 22 }}
          initial={{ y: 110, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 110, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        >
          {/* Dynamic glass background */}
          <motion.div
            style={{ position: 'absolute', inset: 0, borderRadius: 22, overflow: 'hidden' }}
            animate={{
              background: `linear-gradient(135deg, ${accentA(0.82)} 0%, rgba(236,72,153,0.24) 38%, ${accentA(0.35)} 62%, rgba(9,0,18,0.97) 100%)`,
              boxShadow: `0 -2px 40px rgba(0,0,0,0.7), 0 0 0 1px ${accentA(0.55)}, 0 0 28px ${accentA(0.22)}, 0 0 20px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.11)`,
            }}
            transition={{ duration: 0.85, ease: 'easeInOut' }}
          >
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }} />
          </motion.div>

          {/* Left accent stripe */}
          <motion.div
            style={{ position: 'absolute', left: 0, top: 5, bottom: 5, width: 3, borderRadius: 2, zIndex: 2 }}
            animate={{ background: `linear-gradient(to bottom, #ec4899, ${accent}, #a855f7)`, boxShadow: `0 0 18px ${accentA(0.85)}, 0 0 10px rgba(236,72,153,0.65)` }}
            transition={{ duration: 0.85 }}
          />

          {/* Progress bar along top edge */}
          <div style={{ position: 'absolute', top: 0, left: 3, right: 0, height: 2.5, background: 'rgba(255,255,255,0.05)', borderRadius: '0 20px 0 0', overflow: 'hidden', zIndex: 3 }}>
            <motion.div
              style={{ height: '100%' }}
              animate={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, #ec4899, ${accent})`, boxShadow: `0 0 8px rgba(236,72,153,0.75), 0 0 5px ${accentA(0.7)}` }}
              transition={{ duration: 0.4, ease: 'linear' }}
            />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 8px 14px' }}>

            {/* Vinyl album art */}
            <div
              onClick={() => navigate('/now-playing')}
              style={{ position: 'relative', flexShrink: 0, width: 46, height: 46, cursor: 'pointer' }}
            >
              <motion.div
                style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid rgba(236,72,153,0.65)`, boxShadow: `0 0 14px rgba(236,72,153,0.45), 0 0 8px ${accentA(0.3)}` }}
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={isPlaying ? { duration: 7, ease: 'linear', repeat: Infinity } : { duration: 0.5 }}
              />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#080808' }} />
              <motion.img
                src={currentSong.album_art_url || '/placeholder-album.svg'}
                alt=""
                style={{ position: 'absolute', inset: 0, width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }}
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={isPlaying ? { duration: 7, ease: 'linear', repeat: Infinity } : { duration: 0.5 }}
                key={currentSong.id}
              />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 9, height: 9, borderRadius: '50%', background: '#050505', border: '1.5px solid rgba(255,255,255,0.13)', zIndex: 4 }} />
            </div>

            {/* Title / Artist */}
            <div onClick={() => navigate('/now-playing')} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <ScrollingTitle title={currentSong.title || ''} fontSize={14} />
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>
                {(currentSong.primaryArtists || currentSong.artist || '').replace(/&amp;/g, '&')}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              {/* Like */}
              <motion.button
                whileTap={{ scale: 0.65 }}
                onClick={() => toggleLike(currentSong.id, currentSong)}
                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                <motion.svg
                  width="16" height="16" viewBox="0 0 24 24"
                  animate={isLiked ? { scale: [1, 1.45, 1] } : {}}
                  transition={{ duration: 0.22 }}
                >
                  <path
                    d="M12 21s-6.716-4.35-9.193-8.014C1.38 10.88 2.1 7.9 4.71 6.58c2.027-1.026 4.444-.43 5.934 1.22A4.79 4.79 0 0112 9.36a4.79 4.79 0 011.356-1.56c1.49-1.65 3.907-2.246 5.934-1.22 2.61 1.32 3.33 4.3 1.903 6.406C18.716 16.65 12 21 12 21z"
                    fill={isLiked ? '#ff4f6d' : 'none'}
                    stroke={isLiked ? '#ff4f6d' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.button>

              {/* Prev */}
              <motion.button
                whileTap={{ scale: 0.78, x: -1 }}
                onClick={() => prevSong()}
                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)">
                  <path d="M11 7l-7 5 7 5V7zM20 7l-7 5 7 5V7z" />
                </svg>
              </motion.button>

              {/* Play/Pause */}
              <motion.button
                whileTap={{ scale: 0.84 }}
                onClick={togglePlay}
                style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid rgba(236,72,153,0.7)`, pointerEvents: 'none' }}
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.28, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>
                <motion.div
                  style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  animate={{
                    background: `linear-gradient(135deg, #ec4899, ${accent})`,
                    boxShadow: isPlaying ? `0 0 20px rgba(236,72,153,0.6), 0 0 14px ${accentA(0.45)}, 0 4px 14px rgba(0,0,0,0.5)` : `0 4px 14px rgba(0,0,0,0.5)`,
                  }}
                  transition={{ duration: 0.35 }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                      <motion.svg key="pause" width="14" height="14" fill="#000" viewBox="0 0 24 24"
                        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.14 }}>
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </motion.svg>
                    ) : (
                      <motion.svg key="play" width="14" height="14" fill="#000" viewBox="0 0 24 24" style={{ marginLeft: 2 }}
                        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.14 }}>
                        <path d="M8 5v14l11-7z" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.button>

              {/* Next */}
              <motion.button
                whileTap={{ scale: 0.78, x: 1 }}
                onClick={() => nextSong()}
                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)">
                  <path d="M13 7l7 5-7 5V7zM4 7l7 5-7 5V7z" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
