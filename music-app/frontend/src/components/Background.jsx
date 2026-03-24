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
          opacity: 0.6,
          transform: 'translateZ(0)',
          contain: 'paint layout style',
          willChange: 'auto'
        }} 
      />
    </>
  );
};

export default Background;
