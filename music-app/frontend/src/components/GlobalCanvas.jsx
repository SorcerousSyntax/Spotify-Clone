import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import usePlayerStore from '../store/playerStore';

const Galaxy = () => {
  const points = useRef();
  const scrollProgress = usePlayerStore((state) => state.scrollProgress);

  const particleCount = 30000;
  
  const [positions, colors, randomValues] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount);
    
    const colorCore = new THREE.Color('#ffffff');
    const colorMid = new THREE.Color('#ff2d78');
    const colorEdge = new THREE.Color('#ff71ce'); // Brighter pink for the edge

    for (let i = 0; i < particleCount; i++) {
      // Create spiral arms pattern
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 25 + 2;
      const armIndex = Math.floor(Math.random() * 3);
      const armAngle = (armIndex / 3) * Math.PI * 2;
      const spiralFactor = radius * 0.5;
      
      const x = Math.cos(angle + armAngle + spiralFactor) * radius + (Math.random() - 0.5) * 4;
      const y = (Math.random() - 0.5) * 2;
      const z = Math.sin(angle + armAngle + spiralFactor) * radius + (Math.random() - 0.5) * 4;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      randoms[i] = Math.random();

      const mixedColor = colorCore.clone();
      const distPercent = radius / 25;
      mixedColor.lerp(colorMid, Math.min(distPercent * 1.5, 0.8));
      mixedColor.lerp(colorEdge, Math.max(0, distPercent - 0.5) * 2);
      
      cols[i * 3] = mixedColor.r;
      cols[i * 3 + 1] = mixedColor.g;
      cols[i * 3 + 2] = mixedColor.b;
    }
    return [pos, cols, randoms];
  }, []);

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    
    const time = state.clock.getElapsedTime();
    const p = points.current.geometry.attributes.position.array;
    
    // Always slightly visible, but fades in more as we scroll
    const opacity = THREE.MathUtils.smoothstep(scrollProgress, -0.2, 0.4) * 0.8 + 0.1;
    points.current.material.opacity = opacity;
    
    const assembleFactor = THREE.MathUtils.smoothstep(scrollProgress, 0.1, 0.8);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Target position (Galaxy Disc)
      const targetX = positions[i3];
      const targetY = positions[i3 + 1];
      const targetZ = positions[i3 + 2];
      
      // Starting position (Scattered)
      const startX = initialPositions[i3];
      const startY = initialPositions[i3 + 1];
      const startZ = initialPositions[i3 + 2];
      
      // Transition with some noise/turbulence
      const noise = Math.sin(time * 0.5 + randomValues[i] * 10) * 0.15;
      
      p[i3] = THREE.MathUtils.lerp(startX, targetX, assembleFactor) + noise;
      p[i3 + 1] = THREE.MathUtils.lerp(startY, targetY, assembleFactor) + noise;
      p[i3 + 2] = THREE.MathUtils.lerp(startZ, targetZ, assembleFactor) + noise;
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
    
    // Very slow rotation
    points.current.rotation.y += 0.0008;
    // Tilted disc
    points.current.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.05, Math.PI * 0.12, assembleFactor);
    points.current.rotation.z = Math.sin(time * 0.1) * 0.02;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0}
      />
    </points>
  );
};

const GlobalCanvas = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      pointerEvents: 'none',
      background: '#000000'
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 35], fov: 45 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Galaxy />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobalCanvas;
