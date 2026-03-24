import React, { useMemo } from 'react';

const PlaylistCover = ({ playlist, songsById = {}, size = 120 }) => {
  const covers = useMemo(() => {
    const ids = Array.isArray(playlist?.songIds) ? playlist.songIds.slice(0, 4) : [];
    const found = ids.map((id) => songsById[id]?.album_art_url).filter(Boolean);
    return found.slice(0, 4);
  }, [playlist, songsById]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--color-border-accent)',
        background: 'var(--color-bg-secondary)',
        position: 'relative',
      }}
    >
      {covers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%', gap: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#111111', borderRadius: 8, overflow: 'hidden' }}>
              {covers[i] && <img src={covers[i]} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: size * 0.4 }}>
          {playlist?.emoji || '🎵'}
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #ff2d781a, transparent)' }} />
    </div>
  );
};

export default PlaylistCover;
