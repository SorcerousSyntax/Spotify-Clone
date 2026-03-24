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
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(255,45,120,0.2)',
        background: 'rgba(255,255,255,0.03)',
        position: 'relative',
      }}
    >
      {covers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#111' }}>
              {covers[i] && <img src={covers[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: size * 0.4 }}>
          {playlist?.emoji || '🎵'}
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,45,120,0.1), transparent)' }} />
    </div>
  );
};

export default PlaylistCover;
