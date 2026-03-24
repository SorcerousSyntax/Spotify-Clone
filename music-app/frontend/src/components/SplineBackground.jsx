import React from 'react';

function SplineBackground({ mode = 'pink' }) {
  const isOrange = mode === 'orange';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isOrange
            ? 'radial-gradient(120% 90% at 85% 15%, rgba(255, 119, 0, 0.25), transparent 55%), radial-gradient(100% 80% at 15% 85%, rgba(255, 45, 120, 0.2), transparent 60%), #000000'
            : 'radial-gradient(120% 90% at 85% 15%, rgba(255, 45, 120, 0.28), transparent 55%), radial-gradient(100% 80% at 15% 85%, rgba(192, 132, 252, 0.22), transparent 60%), #000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
}

export default SplineBackground;
