import React, { Suspense, useCallback } from 'react';
import Spline from '@splinetool/react-spline';

function SplineBackground({ mode = 'pink' }) {
  const isOrange = mode === 'orange';
  
  // Pull the camera back to zoom out and tint materials
  const onLoad = useCallback((splineApp) => {
    // Try to find a camera object and zoom out
    const cam = splineApp.findObjectByName('Camera');
    if (cam) {
      cam.position.z = Math.max(cam.position.z * 2.2, cam.position.z + 800);
    }

    // Tint all mesh objects
    const tintColor = isOrange ? 0xff7700 : 0xff2d78; 
    const allObjects = splineApp.getAllObjects?.() ?? [];
    allObjects.forEach((obj) => {
      if (obj.material && obj.material.color) {
        obj.material.color.setHex(tintColor);
      }
    });
  }, [isOrange]);

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
        // Enable interactivity
        pointerEvents: 'auto',
        background: '#000',
        // CSS fallback: rotate hue for pink, none for orange
        filter: isOrange 
          ? 'saturate(1.2) brightness(0.9)' 
          : 'hue-rotate(300deg) saturate(1.8) brightness(0.85)',
      }}
    >
      <Suspense fallback={null}>
        <Spline
          scene="https://prod.spline.design/8UnqH-PAIWlxTzeN/scene.splinecode"
          onLoad={onLoad}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
}

export default SplineBackground;
