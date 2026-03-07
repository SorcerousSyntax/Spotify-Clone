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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        marginBottom: 8,
        cursor: 'pointer',
        background: 'var(--surface)',
        border: '1px solid rgba(0,255,65,0.12)',
      }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {showIndex && (
        <span style={{
          width: 20, textAlign: 'right', flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
          fontSize: 11, color: isActive ? '#00ff6a' : 'rgba(255,255,255,0.25)',
        }}>
          {isActive ? '▶' : index + 1}
        </span>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
        border: isActive ? '1px solid rgba(0,255,65,0.45)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isActive
          ? '0 0 16px rgba(0,255,65,0.5), 0 18px 40px rgba(0,0,0,0.9)'
          : '0 10px 24px rgba(0,0,0,0.7)',
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
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 14, letterSpacing: '0.04em',
          color: isActive ? '#00ff6a' : '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1.2,
          textShadow: isActive ? '0 0 12px rgba(0,255,106,0.4)' : 'none',
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

  return (
    <motion.div
      {...tilt}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleClick}
      style={{
        width: size, flexShrink: 0, cursor: 'pointer',
        borderRadius: 10, overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--green-border)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.9)',
        willChange: 'transform',
      }}
    >
      {/* Art */}
      <div style={{ position: 'relative', width: size, height: size, overflow: 'hidden', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 10% 0%, rgba(0,255,65,0.08), transparent 55%), radial-gradient(circle at 90% 120%, rgba(0,255,65,0.06), transparent 55%)`,
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
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }} />
      </div>
      {/* Text */}
      <div style={{ padding: '7px 8px 8px' }}>
        <p style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 12, letterSpacing: '0.05em',
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
      whileTap={{ scale: 0.94 }}
      onClick={() => onClick?.(playlist)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
        background: `linear-gradient(135deg, ${palette[0]}bb, ${palette[1]}66)`,
        border: '1px solid rgba(0,255,65,0.14)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
        willChange: 'transform',
      }}
    >
      {/* Left colour block */}
      <div style={{
        width: 52, height: 52, flexShrink: 0,
        background: `radial-gradient(circle at 30% 10%, rgba(0,255,65,0.4), transparent 60%), radial-gradient(circle at 90% 120%, rgba(0,255,65,0.2), transparent 60%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20 }}>{playlist.emoji || '🎵'}</span>
      </div>
      {/* Label */}
      <p style={{
        fontFamily: "'Bebas Neue', cursive",
        fontSize: 13, letterSpacing: '0.04em',
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
