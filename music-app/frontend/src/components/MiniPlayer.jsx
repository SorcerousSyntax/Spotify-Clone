import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import usePlayerStore from '../store/playerStore';
import useColorExtract from '../hooks/useColorExtract';
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
          <span style={{ fontSize, letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.15 }}>
            {safeTitle}
          </span>
          <span style={{ fontSize, letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.15 }}>
            {safeTitle}
          </span>
        </motion.div>
      ) : (
        <p
          style={{
            fontSize,
            letterSpacing: '0.04em',
            color: '#ffffff',
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
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);
  const { rgbaString } = useColorExtract(currentSong?.album_art_url);
  const [beatLevel, setBeatLevel] = useState(0.25);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;

  useEffect(() => {
    if (!currentSong) {
      setBeatLevel(0.25);
      return;
    }

    const timer = window.setInterval(() => {
      const frequencyData = typeof getFrequencyData === 'function' ? getFrequencyData() : null;

      if (!frequencyData || !frequencyData.length) {
        setBeatLevel((prev) => prev * 0.88 + 0.22 * 0.12);
        return;
      }

      const sampleBins = Math.min(24, frequencyData.length);
      let total = 0;
      for (let i = 0; i < sampleBins; i += 1) {
        total += frequencyData[i] || 0;
      }

      const energy = total / (sampleBins * 255);
      const target = isPlaying ? energy : 0.18;
      setBeatLevel((prev) => prev * 0.72 + target * 0.28);
    }, 90);

    return () => window.clearInterval(timer);
  }, [currentSong?.id, isPlaying, getFrequencyData]);

  const glowAlpha = useMemo(() => {
    const normalized = Math.max(0.16, Math.min(0.95, beatLevel));
    return normalized;
  }, [beatLevel]);

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: 64,
            top: 'auto',
            right: 16,
            left: 16,
            width: 'auto',
            height: 'auto',
            zIndex: 3,
            borderRadius: 16,
            overflow: 'hidden',
          }}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {/* Glass bg */}
          <div style={{
            background: `linear-gradient(145deg, ${rgbaString(0.28)} 0%, rgba(0,0,0,0.94) 44%, rgba(0,0,0,0.96) 100%)`,
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: `1px solid ${rgbaString(0.42)}`,
            borderRadius: 16,
            boxShadow: `0 18px 44px rgba(0,0,0,0.55), 0 0 ${22 + Math.round(glowAlpha * 26)}px ${rgbaString(0.26 + glowAlpha * 0.42)}`,
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'background 560ms ease, border-color 560ms ease, box-shadow 180ms linear',
          }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `radial-gradient(circle at 15% 50%, ${rgbaString(0.20 + glowAlpha * 0.26)} 0%, transparent 58%)`,
                borderRadius: 16,
                transition: 'background 220ms linear',
              }}
            />
            {/* Top progress bar — full width green line */}
            <div style={{ position: 'relative', height: 2, background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="progress-fill"
                style={{ height: '100%', width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', cursor: 'pointer', position: 'relative', zIndex: 1,
              }}
              onClick={() => navigate('/now-playing')}
            >
              <>
                  {/* Slowly rotating album art */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    boxShadow: `0 0 ${10 + Math.round(glowAlpha * 18)}px ${rgbaString(0.28 + glowAlpha * 0.28)}`,
                    transition: 'box-shadow 180ms linear',
                  }}>
                    <img
                      src={currentSong.album_art_url || '/placeholder-album.svg'}
                      alt={decodeSongTitle(currentSong.title || '')}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: 10,
                        animation: 'none',
                      }}
                    />
                  </div>

                  {/* Song info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ScrollingTitle title={currentSong.title || ''} fontSize={18} />
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11, color: 'var(--white-mid)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2,
                    }}>
                      {(currentSong.primaryArtists || currentSong.artist || '').replace(/&amp;/g, '&')}
                    </p>
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
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.35)',
                        boxShadow: '0 0 16px rgba(255,255,255,0.2)',
                        outline: 'none',
                      }}
                    >
                      {isPlaying ? (
                        <svg width="16" height="16" fill="#ffffff" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="#ffffff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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
