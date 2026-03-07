import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 4 }) => {
  if (type === 'hero') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
        <div className="shimmer" style={{ width: 260, height: 260, borderRadius: 16 }} />
        <div className="shimmer" style={{ width: 180, height: 28, borderRadius: 6 }} />
        <div className="shimmer" style={{ width: 120, height: 16, borderRadius: 4 }} />
        <div className="shimmer" style={{ width: 140, height: 48, borderRadius: 10 }} />
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <div className="shimmer" style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="shimmer" style={{ width: '60%', height: 14, borderRadius: 4 }} />
              <div className="shimmer" style={{ width: '40%', height: 10, borderRadius: 4 }} />
            </div>
            <div className="shimmer" style={{ width: 36, height: 10, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  // Default: card grid
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ width: 152, flexShrink: 0 }}>
          <div className="shimmer" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px 12px 0 0' }} />
          <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '0 0 12px 12px', border: '1px solid var(--glass-border)', borderTop: 'none' }}>
            <div className="shimmer" style={{ width: '80%', height: 14, borderRadius: 4, marginBottom: 8 }} />
            <div className="shimmer" style={{ width: '55%', height: 10, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
