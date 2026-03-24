import React, { useRef, useEffect } from 'react';
import usePlayerStore from '../store/playerStore';

const Waveform = () => {
  const canvasRef = useRef(null);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      const data = getFrequencyData?.() || new Uint8Array(64);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const step = width / (data.length - 1);
      
      // Draw inactive portion (re-purposed as background/static wave)
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff22';
      ctx.moveTo(0, height / 2);
      for (let i = 0; i < width; i += 10) {
        ctx.lineTo(i, height / 2 + Math.sin(i * 0.05) * 5);
      }
      ctx.stroke();

      // Draw active portion
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ff2d78'; // var(--color-accent-primary)
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const amplitude = (data[i] / 255.0) * (height / 2);
        const y = height / 2 + (i % 2 === 0 ? -amplitude : amplitude);
        
        if (i === 0) {
          ctx.moveTo(x, height / 2);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      // Glow effect
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff2d78';
      ctx.stroke();
      
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData]);

  return (
    <div style={{ width: '100%', height: 60 }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={60}
        style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
      />
    </div>
  );
};

export default Waveform;
