import React, { Suspense } from 'react';
import Spline from '@splinetool/react-spline';

function SplineBackground() {
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
        background: '#000',
      }}
    >
      <Suspense fallback={null}>
        <Spline
          scene="https://prod.spline.design/8UnqH-PAIWlxTzeN/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
}

export default SplineBackground;
