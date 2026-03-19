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
      r: Math.random() * 1.2 + 0.2, // Smaller dots: 0.2 to 1.4 range (previously 0.4 to 2.6)
      dx: (Math.random() - 0.5) * 0.35,
      dy: -(Math.random() * 0.5 + 0.15),
      theta: Math.random() * Math.PI * 2, // Initial angle for rotation
      rotationSpeed: (Math.random() - 0.5) * 0.02, // Individual rotation speed
      orbitRadius: Math.random() * 15 + 5, // Radius for the "swirl"
      alpha: Math.random() * 0.42 + 0.14,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
      color: ['87,242,161', '67,232,143', '216,255,236'][Math.floor(Math.random() * 3)],
    }));

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        // Update theta for rotation
        p.theta += p.rotationSpeed;
        
        // Base movement
        p.x += p.dx;
        p.y += p.dy;
        
        // Calculate swirling position
        const swirlX = p.x + Math.cos(p.theta) * p.orbitRadius;
        const swirlY = p.y + Math.sin(p.theta) * p.orbitRadius;

        p.alpha += p.fadeDir * 0.003;
        if (p.alpha > 0.58) p.fadeDir = -1;
        if (p.alpha < 0.08) p.fadeDir = 1;
        
        // Wrap around logic using base position
        if (p.y < -50) { p.y = height + 50; p.x = Math.random() * width; }
        if (p.x < -50 || p.x > width + 50) p.x = Math.random() * width;

        ctx.beginPath();
        ctx.arc(swirlX, swirlY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        // Extra ambient glow for green accent particles
        if ((p.color === '87,242,161' || p.color === '67,232,143') && p.alpha > 0.22) {
          ctx.beginPath();
          ctx.arc(swirlX, swirlY, p.r * 2.5, 0, Math.PI * 2);
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
