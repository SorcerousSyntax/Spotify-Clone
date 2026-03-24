import React, { useEffect, useRef } from 'react';

const Background = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let running = false;
    let particles = [];
    const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 18;
      for (let i = 0; i < count; i++) {
        const driftDurationMs = 8000 + Math.random() * 4000;
        particles.push({
          baseX: Math.random() * canvas.width,
          baseY: Math.random() * canvas.height,
          radius: Math.random() * 2 + 2,
          opacity: Math.random() * 0.3 + 0.3,
          amplitudeX: 6 + Math.random() * 12,
          amplitudeY: 4 + Math.random() * 10,
          frequency: (Math.PI * 2) / driftDurationMs,
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    const paint = (time = 0) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = time * 0.00015;

      const drawRibbon = (offset, color, width, alpha) => {
        const h = canvas.height;
        const w = canvas.width;
        const yBase = h * (0.2 + offset * 0.22);

        ctx.beginPath();
        ctx.moveTo(0, yBase + Math.sin(t + offset * 2.3) * 22);
        ctx.bezierCurveTo(
          w * 0.22,
          yBase + Math.cos(t * 1.3 + offset) * 34,
          w * 0.44,
          yBase + Math.sin(t * 1.7 + offset * 1.8) * 38,
          w * 0.66,
          yBase + Math.cos(t * 1.1 + offset * 2.1) * 26
        );
        ctx.bezierCurveTo(
          w * 0.8,
          yBase + Math.sin(t * 1.8 + offset * 2.4) * 30,
          w * 0.9,
          yBase + Math.cos(t * 1.2 + offset * 1.4) * 20,
          w,
          yBase + Math.sin(t * 1.5 + offset * 2.8) * 18
        );

        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 16;
        ctx.shadowColor = color;
        ctx.stroke();
      };

      drawRibbon(0.35, 'rgba(255,45,120,0.75)', 2.8, 0.7);
      drawRibbon(0.95, 'rgba(139,92,246,0.7)', 2.2, 0.55);
      drawRibbon(1.55, 'rgba(255,216,77,0.72)', 1.7, 0.42);

      ctx.globalAlpha = 1;

      particles.forEach((p) => {
        const x = p.baseX + Math.sin(time * p.frequency + p.phase) * p.amplitudeX;
        const y = p.baseY + Math.cos(time * p.frequency + p.phase) * p.amplitudeY;

        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 45, 120, ${p.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 45, 120, 0.35)';
        ctx.fill();
      });

      ctx.shadowBlur = 0;
    };

    const draw = (time) => {
      paint(time);
      animationFrameId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      animationFrameId = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stop();
      } else {
        if (motionQuery.matches) {
          start();
        } else {
          paint();
        }
      }
    };

    const handleMotionChange = () => {
      if (motionQuery.matches && document.visibilityState === 'visible') {
        start();
      } else {
        stop();
        paint();
      }
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleMotionChange);
    
    resize();
    if (motionQuery.matches) {
      start();
    } else {
      paint();
    }

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleMotionChange);
      stop();
    };
  }, []);

  return (
    <>
      <div className="bg-layer-1" />
      <div className="bg-layer-2">
        <div className="gradient-a" />
        <div className="gradient-b" />
      </div>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: -1, 
          pointerEvents: 'none',
          opacity: 0.72,
          mixBlendMode: 'screen',
          transform: 'translateZ(0)',
          contain: 'paint layout style',
          willChange: 'auto'
        }} 
      />
    </>
  );
};

export default Background;
