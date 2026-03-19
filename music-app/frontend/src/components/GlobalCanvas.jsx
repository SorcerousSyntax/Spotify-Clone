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
  varying float vRandom;

  void main() {
    vRandom = aSize; // Use size as a seed for fragment randomness
    
    // Lerp between random initial position and target galaxy position
    vec3 mixedPos = mix(aRandomPos, aTargetPos, uMorphProgress);
    
    // Continuous slow rotation on Y axis
    float angle = uTime * 0.04;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    mixedPos.xz = rot * mixedPos.xz;

    vec4 mvPosition = modelViewMatrix * vec4(mixedPos, 1.0);
    
    vDist = length(aTargetPos.xz);
    
    // Size attenuation: core particles are slightly larger and brighter
    float sizeFactor = (1.2 - smoothstep(0.0, 35.0, vDist) * 0.8);
    gl_PointSize = aSize * sizeFactor * (500.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GALAXY_FRAGMENT_SHADER = `
  varying float vDist;
  varying float vRandom;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Enhanced Color gradient for a stunning Milky Way
    // Centre: Pure White -> White-Pink -> Hot Pink -> Deep Magenta/Purple at edges
    vec3 colorCore = vec3(1.0, 1.0, 1.0);
    vec3 colorInner = vec3(1.0, 0.85, 0.95);
    vec3 colorHotPink = vec3(1.0, 0.176, 0.471); // #ff2d78
    vec3 colorMagenta = vec3(0.5, 0.2, 0.9); // Deeper purple/magenta
    
    vec3 finalColor;
    float d = clamp(vDist / 35.0, 0.0, 1.0);
    
    if (d < 0.1) {
      finalColor = mix(colorCore, colorInner, d / 0.1);
    } else if (d < 0.4) {
      finalColor = mix(colorInner, colorHotPink, (d - 0.1) / 0.3);
    } else {
      finalColor = mix(colorHotPink, colorMagenta, (d - 0.4) / 0.6);
    }

    // Stunning glow effect
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 3.0);
    
    // Twinkle effect
    float twinkle = 0.8 + 0.2 * sin(vRandom * 100.0);
    
    // Core intensity boost
    float coreGlow = 1.0 - smoothstep(0.0, 8.0, vDist);
    
    gl_FragColor = vec4(finalColor, (strength * twinkle * 0.9) + (coreGlow * 0.3));
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
      // Wide scattered initial state
      randomPos[i * 3] = (Math.random() - 0.5) * 200;
      randomPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      randomPos[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // Milky Way Disc positions with 4 distinct spiral arms
      const radius = Math.pow(Math.random(), 0.8) * 35;
      const spinAngle = radius * 0.5;
      const branchAngle = ((i % 4) * 2 * Math.PI) / 4; // 4 spiral arms
      
      // Dispersion: tight in arms, some haze between
      const isArm = Math.random() < 0.85;
      const spread = isArm ? (0.1 + (radius / 35.0) * 0.2) : 1.5;
      
      const randomX = (Math.random() - 0.5) * spread * radius * 0.5;
      const randomZ = (Math.random() - 0.5) * spread * radius * 0.5;
      // Very flat disc with slight vertical bulge at center
      const bulge = Math.exp(-Math.pow(radius / 5.0, 2)) * 3.0;
      const randomY = (Math.random() - 0.5) * (1.0 + bulge);

      targetPos[i * 3] = Math.cos(spinAngle + branchAngle) * radius + randomX;
      targetPos[i * 3 + 1] = randomY; 
      targetPos[i * 3 + 2] = Math.sin(spinAngle + branchAngle) * radius + randomZ;

      sizeArray[i] = Math.random() * 2.5 + 0.5;
    }
    return [randomPos, targetPos, sizeArray];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (material.current) {
      material.current.uniforms.uTime.value = t;
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
