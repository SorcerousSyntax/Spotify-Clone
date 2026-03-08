import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import { decodeSongTitle } from '../lib/text';

const ScrollingTitle = ({ title, fontSize = 18 }) => {
  const safeTitle = decodeSongTitle(title || '');
  const shouldScroll = safeTitle.length > 22;

  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
      {shouldScroll ? (
        <motion.div
          style={{ display: 'flex', width: 'max-content', gap: 28 }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
        >
          <span style={{ fontSize, letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.15, fontFamily: "'Bebas Neue', cursive", fontWeight: 700 }}>
            {safeTitle}
          </span>
          <span style={{ fontSize, letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.15, fontFamily: "'Bebas Neue', cursive", fontWeight: 700 }}>
            {safeTitle}
          </span>
        </motion.div>
      ) : (
        <p
          style={{
            fontSize,
            letterSpacing: '0.04em',
            color: '#ffffff',
            fontFamily: "'Bebas Neue', cursive",
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.15,
            margin: 0,
          }}
        >
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
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: 64,
            top: 'auto',
            right: 8,
            left: 8,
            width: 'auto',
            height: 'auto',
            zIndex: 99,
            borderRadius: 8,
            overflow: 'hidden',
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,255,65,0.12), rgba(0,0,0,0.95) 38%, rgba(0,0,0,0.98) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,255,65,0.22)',
            borderRadius: 8,
            boxShadow: '0 -4px 40px rgba(0,0,0,0.8), 0 0 26px rgba(0,255,65,0.16)',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.2s ease',
          }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                borderRadius: 8,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 38%, rgba(0,0,0,0.22) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 2,
                background: '#00ff41',
                borderRadius: '8px 0 0 8px',
                boxShadow: '0 0 10px rgba(0,255,65,0.5)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', cursor: 'pointer', position: 'relative', zIndex: 1,
              }}
              onClick={() => navigate('/now-playing')}
            >
              <>
                  <div style={{
                    width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                  }}>
                    <img
                      src={currentSong.album_art_url || '/placeholder-album.svg'}
                      alt={decodeSongTitle(currentSong.title || '')}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: 4,
                        animation: 'none',
                      }}
                    />
                  </div>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ScrollingTitle title={currentSong.title || ''} fontSize={15} />
                    <p style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10, color: 'rgba(255,255,255,0.3)',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2,
                    }}>
                      {(currentSong.primaryArtists || currentSong.artist || '').replace(/&amp;/g, '&')}
                    </p>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 1, marginTop: 6 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${progressPercent}%`,
                          background: '#00ff41',
                          boxShadow: '0 0 4px rgba(0,255,65,0.6)',
                          transition: 'width 1s linear',
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {/* Heart */}
                    <motion.button
                      whileTap={{ scale: 0.75 }}
                      onClick={(e) => { e.stopPropagation(); toggleLike(currentSong.id, currentSong); }}
                      style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: 'transparent', border: 'none', outline: 'none',
                      }}
                    >
                      <svg
                        width="18" height="18"
                        fill={isLiked ? '#ffffff' : 'none'}
                        stroke={isLiked ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </motion.button>

                    {/* Play/Pause */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#00ff41',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none',
                        boxShadow: '0 0 16px rgba(0,255,65,0.4)',
                        outline: 'none',
                      }}
                    >
                      {isPlaying ? (
                        <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="#000" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </motion.button>
                  </div>
              </>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
