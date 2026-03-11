import React from 'react';
import usePlayerStore from '../store/playerStore';
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
    <div
      onClick={() => onClick ? onClick(song, index) : setCurrentSong(song)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        borderRadius: 14,
        marginBottom: 6,
        cursor: 'pointer',
        background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
        border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
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
    </div>
  );
};

// Compact square card (for horizontal scroll rows)
export const CompactCard = ({ song, index = 0, size = 110, onClick }) => {
  const setCurrentSong = usePlayerStore(s => s.setCurrentSong);
  const handleClick = () => onClick ? onClick(song, index) : setCurrentSong(song);
  const safeTitle = decodeSongTitle(song?.title || '');
  const pxSize = `${Number(size) || 110}px`;

  return (
    <div
      onClick={handleClick}
      style={{
        width: pxSize,
        minWidth: pxSize,
        maxWidth: pxSize,
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 14, overflow: 'hidden',
        background: 'transparent',
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
    </div>
  );
};

// Quick-pick playlist card (rectangular, used in dashboard grid)
export const PlaylistCard = ({ playlist, index = 0, onClick }) => {
  return (
    <div
      onClick={() => onClick?.(playlist)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
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
    </div>
  );
};

export default CompactCard;
