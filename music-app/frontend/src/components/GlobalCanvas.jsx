import React, { useMemo, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import usePlayerStore from '../store/playerStore';

const GALAXY_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uMorphProgress;
  attribute float aSize;
  attribute vec3 aRandomPos;
  attribute vec3 aTargetPos;
  varying float vDist;

  void main() {
    // Lerp between random initial position and target galaxy position
    vec3 mixedPos = mix(aRandomPos, aTargetPos, uMorphProgress);
    
    // Continuous slow rotation on Y axis
    float angle = uTime * 0.08;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    mixedPos.xz = rot * mixedPos.xz;

    vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
    
    vDist = length(aTargetPos.xz);
    // Core particles slightly larger, edge particles tiny
    float sizeFactor = (1.0 - smoothstep(0.0, 25.0, vDist) * 0.7);
    gl_PointSize = aSize * sizeFactor * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GALAXY_FRAGMENT_SHADER = `
  varying float vDist;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Color gradient: White -> Light Pink -> Hot Pink (#ff2d78) -> Deep Magenta (#c084fc)
    vec3 colorCore = vec3(1.0, 1.0, 1.0);
    vec3 colorLightPink = vec3(1.0, 0.7, 0.85);
    vec3 colorHotPink = vec3(1.0, 0.176, 0.471); // #ff2d78
    vec3 colorMagenta = vec3(0.753, 0.518, 0.988); // #c084fc
    
    vec3 finalColor;
    float d = clamp(vDist / 25.0, 0.0, 1.0);
    
    if (d < 0.15) {
      finalColor = mix(colorCore, colorLightPink, d / 0.15);
    } else if (d < 0.5) {
      finalColor = mix(colorLightPink, colorHotPink, (d - 0.15) / 0.35);
    } else {
      finalColor = mix(colorHotPink, colorMagenta, (d - 0.5) / 0.5);
    }

    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 2.5);
    
    // Core glow intensity
    float coreGlow = 1.0 - smoothstep(0.0, 5.0, vDist);
    gl_FragColor = vec4(finalColor, (strength * 0.9) + (coreGlow * 0.2));
  }
`;

const Galaxy = () => {
  const points = useRef();
  const material = useRef();
  const particleCount = 30000;

  const [randomPositions, targetPositions, sizes] = useMemo(() => {
    const randomPos = new Float32Array(particleCount * 3);
    const targetPos = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Random initial positions scattered everywhere
      randomPos[i * 3] = (Math.random() - 0.5) * 150;
      randomPos[i * 3 + 1] = (Math.random() - 0.5) * 150;
      randomPos[i * 3 + 2] = (Math.random() - 0.5) * 150;

      // Milky Way Disc positions
      const radius = Math.random() * 25;
      const spinAngle = radius * 0.6;
      const branchAngle = ((i % 3) * 2 * Math.PI) / 3; // 3 spiral arms
      
      const spread = (1.0 - radius / 25.0) * 0.5 + 0.1;
      const randomX = (Math.random() - 0.5) * 2.0 * spread * radius;
      const randomZ = (Math.random() - 0.5) * 2.0 * spread * radius;
      const randomY = (Math.random() - 0.5) * 1.5 * (1.0 - radius / 25.0);

      targetPos[i * 3] = Math.cos(spinAngle + branchAngle) * radius + randomX;
      targetPos[i * 3 + 1] = randomY; 
      targetPos[i * 3 + 2] = Math.sin(spinAngle + branchAngle) * radius + randomZ;

      sizeArray[i] = Math.random() * 3 + 0.5;
    }
    return [randomPos, targetPos, sizeArray];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (material.current) {
      material.current.uniforms.uTime.value = t;
      // Morph over 2 seconds
      material.current.uniforms.uMorphProgress.value = Math.min(t / 2.0, 1.0);
    }
  });

  return (
    <points ref={points} rotation={[Math.PI * (15/180), 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={randomPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomPos"
          count={particleCount}
          array={randomPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={particleCount}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        depthWrite={false}
        transparent={true}
        blending={THREE.AdditiveBlending}
        vertexShader={GALAXY_VERTEX_SHADER}
        fragmentShader={GALAXY_FRAGMENT_SHADER}
        uniforms={{
          uTime: { value: 0 },
          uMorphProgress: { value: 0 }
        }}
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
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 40], fov: 45 }}
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
