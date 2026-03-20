import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  attribute vec3 aRandomPos;
  varying vec3 vColor;
  varying float vDistance;

  void main() {
    vec3 pos = mix(aRandomPos, position, clamp(uMorphProgress, 0.0, 1.0));
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float dist = length(position.xyz);
    vDistance = dist;
    
    // Size based on distance and perspective
    gl_PointSize = (10.0 / -mvPosition.z) * (1.0 + (1.0 - clamp(uMorphProgress, 0.0, 1.0)) * 2.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vDistance;
  uniform vec3 uColorCore;
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform vec3 uColorEdge;

  void main() {
    float dist = vDistance;
    vec3 color = uColorCore;
    
    if (dist > 0.5) color = mix(uColorCore, uColorInner, clamp((dist - 0.5) / 1.5, 0.0, 1.0));
    if (dist > 2.0) color = mix(uColorInner, uColorOuter, clamp((dist - 2.0) / 2.0, 0.0, 1.0));
    if (dist > 4.0) color = mix(uColorOuter, uColorEdge, clamp((dist - 4.0) / 3.0, 0.0, 1.0));

    // Circular point
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 3.0);

    gl_FragColor = vec4(color, strength * 0.8);
  }
`;

function Galaxy() {
  const pointsRef = useRef();
  const count = 30000;
  
  const [positions, randomPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const randPos = new Float32Array(count * 3);
    
    const radius = 8;
    const branches = 2;
    const spin = 1.5;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random initial scatter
      randPos[i3] = (Math.random() - 0.5) * 40;
      randPos[i3 + 1] = (Math.random() - 0.5) * 40;
      randPos[i3 + 2] = (Math.random() - 0.5) * 40;
      
      // Galaxy shape
      const r = Math.random() * radius;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;
      const spinAngle = r * spin;
      
      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * r;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.1 * r;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * r;
      
      pos[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
      pos[i3 + 1] = randomY;
      pos[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;
    }
    
    return [pos, randPos];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphProgress: { value: 0 },
    uColorCore: { value: new THREE.Color('#ffffff') },
    uColorInner: { value: new THREE.Color('#ffb6c1') },
    uColorOuter: { value: new THREE.Color('#ff2d78') },
    uColorEdge: { value: new THREE.Color('#4b0082') }
  }), []);

  useFrame((state) => {
    const { clock, mouse } = state;
    const elapsedTime = clock.getElapsedTime();
    
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = elapsedTime;
      // Morph over 2 seconds
      pointsRef.current.material.uniforms.uMorphProgress.value = Math.min(elapsedTime / 2.0, 1.0);
      
      // Rotation after morph
      if (elapsedTime > 2.0) {
        pointsRef.current.rotation.y += 0.001;
      }
      
      // Mouse parallax
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, (Math.PI / 12) + (mouse.y * 0.05), 0.05);
      pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, (mouse.x * 0.05), 0.05);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomPos"
          count={count}
          array={randomPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingShapes() {
  const shapes = useMemo(() => [
    { Geo: THREE.IcosahedronGeometry, pos: [-4, 2, -2], scale: 0.5 },
    { Geo: THREE.TorusGeometry, pos: [5, -3, -4], scale: 0.3 },
    { Geo: THREE.OctahedronGeometry, pos: [-2, -4, -3], scale: 0.4 },
    { Geo: THREE.IcosahedronGeometry, pos: [6, 4, -5], scale: 0.6 },
  ], []);

  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={1} rotationIntensity={1} floatIntensity={1}>
          <mesh position={s.pos} scale={s.scale}>
            <primitive object={new s.Geo(1, 1)} attach="geometry" />
            <meshBasicMaterial color="#ff2d78" wireframe={true} transparent={true} opacity={0.1} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function GlobalCanvas() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      background: '#000',
      pointerEvents: 'none'
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
        <Galaxy />
        <FloatingShapes />
      </Canvas>
    </div>
  );
}
