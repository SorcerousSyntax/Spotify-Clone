import React, { useMemo } from 'react';

const PlaylistCover = ({ playlist, songsById = {}, size = 120 }) => {
  const covers = useMemo(() => {
    const ids = Array.isArray(playlist?.songIds) ? playlist.songIds.slice(0, 4) : [];
    return ids
      .map((id) => songsById[id]?.album_art_url)
      .filter(Boolean)
      .slice(0, 4);
  }, [playlist, songsById]);

  const showGrid = covers.length > 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'none',
        background: 'rgba(255,255,255,0.03)',
        position: 'relative',
      }}
    >
      {showGrid ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            width: '100%',
            height: '100%',
            gap: 1,
            background: 'rgba(0,0,0,0.7)',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`cover-${playlist?.id || 'playlist'}-${i}`} style={{ background: 'rgba(255,255,255,0.04)' }}>
              {covers[i] ? (
                <img
                  src={covers[i]}
                  alt={playlist?.name || 'Playlist cover'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.9))',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: '#f3fff8',
            fontSize: size > 70 ? 32 : 18,
          }}
        >
          {playlist?.emoji || '🎵'}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 36%, rgba(0,0,0,0.36) 100%)',
        }}
      />
    </div>
  );
};

export default PlaylistCover;
