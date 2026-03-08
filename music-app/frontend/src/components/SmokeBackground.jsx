import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SmokeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const isMobile = W < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch (err) {
      console.warn('SmokeBackground disabled (WebGL not available):', err);
      return undefined;
    }
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    mountRef.current?.appendChild(renderer.domElement);

    // Build smoke texture procedurally
    const size = 256;
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = size;
    smokeCanvas.height = size;
    const sCtx = smokeCanvas.getContext('2d');
    if (!sCtx) {
      console.warn('SmokeBackground disabled (2D canvas context unavailable).');
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      return undefined;
    }
    const smokeStops = [
      ['rgba(67,232,143,0.28)', 'rgba(67,232,143,0.10)'],
      ['rgba(87,242,161,0.24)', 'rgba(87,242,161,0.08)'],
      ['rgba(170,255,211,0.18)', 'rgba(170,255,211,0.06)'],
    ];

    for (let i = 0; i < 3; i++) {
      const g = sCtx.createRadialGradient(
        size / 2 + (Math.random() - 0.5) * 40,
        size / 2 + (Math.random() - 0.5) * 40,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      g.addColorStop(0, smokeStops[i][0]);
      g.addColorStop(0.5, smokeStops[i][1]);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      sCtx.fillStyle = g;
      sCtx.fillRect(0, 0, size, size);
    }
    const smokeTex = new THREE.CanvasTexture(smokeCanvas);

    const COUNT = isMobile ? 95 : 190;
    const particles = [];

    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: smokeTex,
        transparent: true,
        opacity: Math.random() * 0.18 + 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const geo = new THREE.PlaneGeometry(
        2 + Math.random() * 3,
        2 + Math.random() * 3
      );
      const mesh = new THREE.Mesh(geo, mat);

      // Spawn across the full screen, concentrate near bottom
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        -6 + Math.random() * 14,
        (Math.random() - 0.5) * 3 - 1
      );
      mesh.rotation.z = Math.random() * Math.PI * 2;

      mesh.userData = {
        vx: (Math.random() - 0.5) * 0.005,
        vy: 0.008 + Math.random() * 0.01,
        vr: (Math.random() - 0.5) * 0.005,
        startY: mesh.position.y,
        maxY: 8 + Math.random() * 4,
        baseOpacity: mesh.material.opacity,
        phase: Math.random() * Math.PI * 2,
      };

      scene.add(mesh);
      particles.push(mesh);
    }

    const floorLight = new THREE.PointLight(0x2fd17d, 2.5, 20);
    floorLight.position.set(0, -6, 2);
    scene.add(floorLight);

    const sideLight = new THREE.PointLight(0x57f2a1, 1.2, 16);
    sideLight.position.set(-5, 1, 1);
    scene.add(sideLight);

    const topLight = new THREE.PointLight(0x8fffc7, 0.7, 14);
    topLight.position.set(4, 3, 0);
    scene.add(topLight);

    // Subtle ambient
    scene.add(new THREE.AmbientLight(0xbff8de, 0.26));

    let frame;
    let t = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      t += 0.01;

      particles.forEach((p) => {
        const ud = p.userData;

        p.position.x += ud.vx + Math.sin(t + ud.phase) * 0.001;
        p.position.y += ud.vy;
        p.rotation.z += ud.vr;

        // Fade out as it rises
        const progress = (p.position.y - ud.startY) / (ud.maxY - ud.startY);
        p.material.opacity = ud.baseOpacity * (1 - Math.pow(progress, 2));

        // Reset when fully risen
        if (p.position.y > ud.maxY || p.material.opacity < 0.005) {
          p.position.y = -8 - Math.random() * 4;
          p.position.x = (Math.random() - 0.5) * 16;
          ud.startY = p.position.y;
          p.material.opacity = ud.baseOpacity;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      smokeTex.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
