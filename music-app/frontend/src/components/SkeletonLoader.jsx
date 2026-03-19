import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 4 }) => {
  const shimmerStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,45,120,0.05) 50%, rgba(255,255,255,0.03) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: 4
  };

  if (type === 'row') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 15 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass" style={{ padding: 15, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ ...shimmerStyle, width: 50, height: 50 }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...shimmerStyle, width: '60%', height: 14, marginBottom: 8 }} />
              <div style={{ ...shimmerStyle, width: '40%', height: 10 }} />
            </div>
            <div style={{ ...shimmerStyle, width: 40, height: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  // Default: card grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass" style={{ padding: 10 }}>
          <div style={{ ...shimmerStyle, aspectRatio: '1/1', marginBottom: 15 }} />
          <div style={{ ...shimmerStyle, width: '80%', height: 14, marginBottom: 8 }} />
          <div style={{ ...shimmerStyle, width: '50%', height: 10 }} />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
