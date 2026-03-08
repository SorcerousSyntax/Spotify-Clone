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
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(72,246,203,0.28)',
        boxShadow: '0 12px 26px rgba(0,0,0,0.42)',
        background: 'linear-gradient(145deg, rgba(13,36,29,0.9), rgba(7,14,12,0.96))',
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
            background: 'rgba(0,0,0,0.38)',
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
                    background: 'linear-gradient(135deg, rgba(72,246,203,0.12), rgba(9,20,16,0.9))',
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
          background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 36%, rgba(0,0,0,0.28) 100%)',
        }}
      />
    </div>
  );
};

export default PlaylistCover;
