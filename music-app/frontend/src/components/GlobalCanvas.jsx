import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import usePlayerStore from '../store/playerStore';

const Galaxy = () => {
  const points = useRef();
  const scrollProgress = usePlayerStore((state) => state.scrollProgress);

  const particleCount = 30000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const colorCore = new THREE.Color('#ffffff');
    const colorMid = new THREE.Color('#ff2d78');
    const colorEdge = new THREE.Color('#e040fb');

    for (let i = 0; i < particleCount; i++) {
      // Scattered initial positions
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const mixedColor = colorCore.clone();
      const dist = Math.sqrt(x * x + z * z);
      mixedColor.lerp(colorMid, dist / 25);
      mixedColor.lerp(colorEdge, dist / 50);
      
      cols[i * 3] = mixedColor.r;
      cols[i * 3 + 1] = mixedColor.g;
      cols[i * 3 + 2] = mixedColor.b;
    }
    return [pos, cols];
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    
    const time = state.clock.getElapsedTime();
    const p = points.current.geometry.attributes.position.array;
    
    // Smooth transition between states based on scrollProgress
    // 0.0 - 0.05: Invisible
    // 0.05 - 0.4: Appear scattered
    // 0.4 - 0.7: Assemble into disc
    // > 0.7: Rotating galaxy
    
    const opacity = THREE.MathUtils.smoothstep(scrollProgress, 0.05, 0.2);
    points.current.material.opacity = opacity;
    
    if (scrollProgress > 0.05) {
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = posOriginal[i3];
        const y = posOriginal[i3 + 1];
        const z = posOriginal[i3 + 2];
        
        // Milky Way Disc logic
        const angle = Math.atan2(z, x) + time * 0.05;
        const radius = Math.sqrt(x * x + z * z);
        const spiralOffset = radius * 0.2;
        
        const discX = Math.cos(angle + spiralOffset) * radius;
        const discZ = Math.sin(angle + spiralOffset) * radius;
        const discY = y * 0.1; // Flatten
        
        // Lerp between scattered and disc
        const assembleFactor = THREE.MathUtils.smoothstep(scrollProgress, 0.4, 0.7);
        
        p[i3] = THREE.MathUtils.lerp(x, discX, assembleFactor);
        p[i3 + 1] = THREE.MathUtils.lerp(y, discY, assembleFactor);
        p[i3 + 2] = THREE.MathUtils.lerp(z, discZ, assembleFactor);
      }
      points.current.geometry.attributes.position.needsUpdate = true;
      points.current.rotation.y += 0.001;
      points.current.rotation.x = THREE.MathUtils.lerp(0, Math.PI * 0.15, assembleFactor);
    }
  });

  const posOriginal = useMemo(() => new Float32Array(positions), [positions]);

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const FloatingShapes = () => {
  return (
    <group>
      {[...Array(6)].map((_, i) => (
        <Float
          key={i}
          speed={1.5} 
          rotationIntensity={2} 
          floatIntensity={2}
          position={[
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10 - 5
          ]}
        >
          <mesh>
            {i % 3 === 0 ? <octahedronGeometry args={[1, 0]} /> : i % 3 === 1 ? <torusGeometry args={[0.8, 0.2, 16, 32]} /> : <icosahedronGeometry args={[1, 0]} />}
            <meshBasicMaterial color="#ff2d78" wireframe transparent opacity={0.15} />
          </mesh>
        </Float>
      ))}
    </group>
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
      zIndex: 0,
      pointerEvents: 'none',
      background: '#000'
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 20], fov: 45 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Galaxy />
          <FloatingShapes />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobalCanvas;
