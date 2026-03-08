import React, { useRef, useEffect } from 'react';

// Floating neon particles (canvas-based, 60fps, lightweight)
export default function FloatingParticles({ count = 30 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.2 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: -(Math.random() * 0.5 + 0.15),
      alpha: Math.random() * 0.42 + 0.14,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
      color: ['87,242,161', '67,232,143', '216,255,236'][Math.floor(Math.random() * 3)],
    }));

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha += p.fadeDir * 0.003;
        if (p.alpha > 0.58) p.fadeDir = -1;
        if (p.alpha < 0.08) p.fadeDir = 1;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10 || p.x > width + 10) p.x = Math.random() * width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        // Extra ambient glow for green accent particles
        if ((p.color === '87,242,161' || p.color === '67,232,143') && p.alpha > 0.22) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${p.alpha * 0.11})`;
          ctx.fill();
        }
      });
    };
    draw();

    const onResize = () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 1,
        pointerEvents: 'none', opacity: 0.76,
      }}
    />
  );
}
