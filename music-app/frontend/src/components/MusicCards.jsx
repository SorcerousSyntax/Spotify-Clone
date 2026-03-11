import React from 'react';
import { motion } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import useCardTilt from '../hooks/useCardTilt';
import { decodeSongTitle } from '../lib/text';

// Green/void palette only (no off-palette colours)
const GRADIENT_PALETTES = [
  ['#060d06', '#111f11'],
  ['#030803', '#0c160c'],
  ['#020402', '#060d06'],
  ['#050b05', '#111f11'],
  ['#040804', '#0c160c'],
  ['#020302', '#060d06'],
  ['#030703', '#101b10'],
  ['#050a05', '#0f1a0f'],
];

// Compact horizontal song row (used in Recently Played / Liked Songs)
export const SongRow = ({ song, index = 0, showIndex = false, onClick }) => {
  const setCurrentSong = usePlayerStore(s => s.setCurrentSong);
  const currentSong = usePlayerStore(s => s.currentSong);
  const isActive = currentSong?.id === song?.id;
  const safeTitle = decodeSongTitle(song?.title || '');

  const formatDuration = (s) => {
    if (!s) return '';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 28 }}
      onClick={() => onClick ? onClick(song, index) : setCurrentSong(song)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        borderRadius: 14,
        marginBottom: 6,
        cursor: 'pointer',
        background: isActive ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isActive ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.09)',
        boxShadow: isActive
          ? '0 6px 28px rgba(139,92,246,0.28), inset 0 1px 0 rgba(167,139,250,0.12)'
          : '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
        transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
      }}
      whileHover={{ y: -2, boxShadow: '0 10px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      whileTap={{ scale: 0.97 }}
    >
      {showIndex && (
        <span style={{
          width: 20, textAlign: 'right', flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: isActive ? '#00ff41' : 'rgba(255,255,255,0.2)',
        }}>
          {isActive ? '▶' : index + 1}
        </span>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
        border: isActive ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive
          ? '0 0 18px rgba(139,92,246,0.5), 0 8px 20px rgba(0,0,0,0.6)'
          : '0 6px 18px rgba(0,0,0,0.55)',
        transition: 'box-shadow 0.3s, border-color 0.3s',
        background: GRADIENT_PALETTES[index % GRADIENT_PALETTES.length][0],
      }}>
        <img
          src={song?.album_art_url || '/placeholder-album.svg'}
          alt={safeTitle}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15, fontWeight: 600,
          color: isActive ? '#c4b5fd' : '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.25,
          textShadow: 'none',
        }}>
          {safeTitle}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10, color: 'rgba(255,255,255,0.32)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2,
        }}>
          {(song?.primaryArtists || song?.artist || '').replace(/&amp;/g, '&')}
          {song?.liked_by ? ` · Liked by ${song.liked_by}` : ''}
        </p>
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0,
      }}>
        {formatDuration(song?.duration)}
      </span>
    </motion.div>
  );
};

// Compact square card (for horizontal scroll rows)
export const CompactCard = ({ song, index = 0, size = 110, onClick }) => {
  const setCurrentSong = usePlayerStore(s => s.setCurrentSong);
  const tilt = useCardTilt(8);
  const palette = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];

  const handleClick = () => onClick ? onClick(song, index) : setCurrentSong(song);
  const safeTitle = decodeSongTitle(song?.title || '');
  const pxSize = `${Number(size) || 110}px`;

  return (
    <motion.div
      {...tilt}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      style={{
        width: pxSize,
        minWidth: pxSize,
        maxWidth: pxSize,
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        willChange: 'transform',
      }}
    >
      {/* Art */}
      <div style={{ position: 'relative', width: pxSize, height: pxSize, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'transparent',
        }} />
        <img
          src={song?.album_art_url || '/placeholder-album.svg'}
          alt={safeTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
          onError={e => { e.target.style.opacity = '0'; }}
        />
        {/* Shine overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
        }} />
      </div>
      {/* Text */}
      <div style={{ padding: '7px 8px 8px' }}>
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11, fontWeight: 600,
          color: '#fff', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {safeTitle}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: 'rgba(255,255,255,0.3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2,
        }}>
          {song?.artist}
        </p>
      </div>
    </motion.div>
  );
};

// Quick-pick playlist card (rectangular, used in dashboard grid)
export const PlaylistCard = ({ playlist, index = 0, onClick }) => {
  const palette = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
  const tilt = useCardTilt(7);

  return (
    <motion.div
      {...tilt}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 + index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.14)' }}
      whileTap={{ scale: 0.94 }}
      onClick={() => onClick?.(playlist)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        willChange: 'transform',
      }}
    >
      {/* Left colour block */}
      <div style={{
        width: 52, height: 52, flexShrink: 0,
        background: `radial-gradient(circle at 30% 10%, rgba(139,92,246,0.4), transparent 60%), radial-gradient(circle at 90% 120%, rgba(109,40,217,0.2), transparent 60%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20 }}>{playlist.emoji || '🎵'}</span>
      </div>
      {/* Label */}
      <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12, fontWeight: 600,
        color: '#fff', paddingRight: 10,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {playlist.name}
      </p>
    </motion.div>
  );
};

export default CompactCard;
