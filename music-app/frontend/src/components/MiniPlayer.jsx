import React, { useEffect, useState } from 'react';
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
  const computeDesktopMode = () => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia) {
      return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches;
    }
    return window.innerWidth >= 1024;
  };

  const [isDesktop, setIsDesktop] = useState(
    computeDesktopMode()
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(computeDesktopMode());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navigate = useNavigate();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const likedSongIds = usePlayerStore((s) => s.likedSongIds);
  const recentlyPlayed = usePlayerStore((s) => s.recentlyPlayed);

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const isLiked = currentSong ? likedSongIds.has(currentSong.id) : false;
  const related = recentlyPlayed
    .filter((song) => song?.id && song.id !== currentSong?.id)
    .slice(0, 3);

  return (
    <AnimatePresence>
      {currentSong && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: isDesktop ? 'auto' : 64,
            top: isDesktop ? 16 : 'auto',
            right: 16,
            left: isDesktop ? 'auto' : 16,
            width: isDesktop ? 344 : 'auto',
            height: isDesktop ? 'calc(100dvh - 32px)' : 'auto',
            zIndex: 3,
            borderRadius: 16,
            overflow: 'hidden',
          }}
          initial={isDesktop ? { x: 60, opacity: 0 } : { y: 80, opacity: 0 }}
          animate={isDesktop ? { x: 0, opacity: 1 } : { y: 0, opacity: 1 }}
          exit={isDesktop ? { x: 60, opacity: 0 } : { y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          {/* Glass bg */}
          <div style={{
            background: isDesktop ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 16,
            boxShadow: '0 18px 44px rgba(0,0,0,0.5)',
            height: isDesktop ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
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
                padding: isDesktop ? '16px' : '10px 14px', cursor: 'pointer',
              }}
              onClick={() => navigate('/now-playing')}
            >
              {isDesktop ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Now Playing
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/now-playing'); }}
                      style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.72)', cursor: 'pointer' }}
                    >
                      ↗
                    </button>
                  </div>

                  <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <img
                      src={currentSong.album_art_url || '/placeholder-album.svg'}
                      alt={decodeSongTitle(currentSong.title || '')}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <ScrollingTitle title={currentSong.title || ''} fontSize={34} />
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 6 }}>
                      {(currentSong.primaryArtists || currentSong.artist || '').replace(/&amp;/g, '&')}
                    </p>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                      <motion.div style={{ width: `${progressPercent}%`, height: '100%', background: '#fff' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleLike(currentSong.id, currentSong); }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: isLiked ? 'rgba(255,255,255,0.22)' : 'transparent',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                        <path d="M12 21s-6.716-4.35-9.193-8.014C1.38 10.88 2.1 7.9 4.71 6.58c2.027-1.026 4.444-.43 5.934 1.22A4.79 4.79 0 0112 9.36a4.79 4.79 0 011.356-1.56c1.49-1.65 3.907-2.246 5.934-1.22 2.61 1.32 3.33 4.3 1.903 6.406C18.716 16.65 12 21 12 21z" strokeWidth="1.8" />
                      </svg>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.22)',
                        background: '#fff',
                        color: '#000',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {isPlaying ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </motion.button>

                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/library'); }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'transparent',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      ≡
                    </button>
                  </div>

                  <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
                    <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: '#fff', letterSpacing: '0.03em' }}>
                      Related Music
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                      {related.length > 0 ? related.map((song) => (
                        <button
                          key={song.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            usePlayerStore.getState().setCurrentSong(song);
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '44px 1fr',
                            gap: 10,
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)',
                            padding: 6,
                            color: '#fff',
                            textAlign: 'left',
                          }}
                        >
                          <img src={song.album_art_url || '/placeholder-album.svg'} alt={decodeSongTitle(song.title || '')} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{decodeSongTitle(song.title || '')}</p>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(song.primaryArtists || song.artist || '').replace(/&amp;/g, '&')}</p>
                          </div>
                        </button>
                      )) : (
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Play more songs to see recommendations.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Slowly rotating album art */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    boxShadow: '0 0 16px rgba(0,255,65,0.25)',
                  }}>
                    <img
                      src={currentSong.album_art_url || '/placeholder-album.svg'}
                      alt={decodeSongTitle(currentSong.title || '')}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        borderRadius: 10,
                        animation: isPlaying ? 'vinylSpin 20s linear infinite' : 'none',
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
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MiniPlayer;
