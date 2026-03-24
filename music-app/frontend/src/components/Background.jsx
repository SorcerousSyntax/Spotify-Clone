import React, { useEffect, useRef } from 'react';

const Background = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 20;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 2,
          opacity: Math.random() * 0.3 + 0.3,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          offset: Math.random() * Math.PI * 2
        });
      }
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        // Drift movement using Math.sin()
        const driftX = Math.sin(time * 0.0005 + p.offset) * 0.5;
        const driftY = Math.cos(time * 0.0005 + p.offset) * 0.5;
        
        p.x += p.speedX + driftX;
        p.y += p.speedY + driftY;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 45, 120, ${p.opacity})`;
        ctx.filter = 'blur(4px)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    resize();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
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
          opacity: 0.6
        }} 
      />
    </>
  );
};

export default Background;
