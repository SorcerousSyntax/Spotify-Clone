import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';

function SplineBackground({ mode = 'pink' }) {
  const isOrange = mode === 'orange';
  const splineRef = useRef(null);

  const freezeSpline = useCallback((splineApp) => {
    if (!splineApp) return;

    // Keep the scene visible but stop runtime updates so it stays static.
    splineApp.stop?.();
  }, []);

  const onLoad = useCallback((splineApp) => {
    splineRef.current = splineApp;

    // Force static mode right after load and once more after first frame.
    freezeSpline(splineApp);
    requestAnimationFrame(() => freezeSpline(splineApp));
  }, [freezeSpline]);

  useEffect(() => {
    const app = splineRef.current;
    if (!app) return;

    // Re-apply freeze whenever theme mode changes.
    freezeSpline(app);
  }, [mode, freezeSpline]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '110%',
        height: '110%',
        marginLeft: '-5%',
        marginTop: '-5%',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#000',
        overflow: 'hidden',
        filter: isOrange
          ? 'saturate(1.2) brightness(0.9)'
          : 'hue-rotate(300deg) saturate(1.8) brightness(0.85)',
      }}
    >
      <Suspense fallback={null}>
        <Spline
          scene="https://prod.spline.design/8UnqH-PAIWlxTzeN/scene.splinecode"
          onLoad={onLoad}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </Suspense>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isOrange
            ? 'radial-gradient(120% 90% at 85% 15%, rgba(255, 119, 0, 0.25), transparent 55%), radial-gradient(100% 80% at 15% 85%, rgba(255, 45, 120, 0.2), transparent 60%), #000000'
            : 'radial-gradient(120% 90% at 85% 15%, rgba(255, 45, 120, 0.28), transparent 55%), radial-gradient(100% 80% at 15% 85%, rgba(192, 132, 252, 0.22), transparent 60%), #000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
}

export default SplineBackground;
