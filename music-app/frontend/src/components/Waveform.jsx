import React, { useRef, useEffect } from 'react';

const HISTORY = 200;

const Waveform = ({ getFrequencyData, isPlaying }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bufRef = useRef(new Float32Array(HISTORY).fill(0));
  const headRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      
      const W = canvas.width;
      const H = canvas.height;
      const mid = H / 2;
      
      const freqData = getFrequencyData?.();
      let amp = 0;
      if (freqData && isPlaying) {
        const sum = freqData.slice(0, 10).reduce((a, b) => a + b, 0);
        amp = (sum / 10 / 255);
      } else {
        amp = Math.random() * 0.05;
      }

      bufRef.current[headRef.current % HISTORY] = amp;
      headRef.current++;

      ctx.clearRect(0, 0, W, H);
      
      // Neon Glow Line
      ctx.beginPath();
      ctx.strokeStyle = '#ff2d78';
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 15 * dpr;
      ctx.shadowColor = '#ff2d78';

      for (let i = 0; i < HISTORY; i++) {
        const x = (i / HISTORY) * W;
        const val = bufRef.current[(headRef.current + i) % HISTORY];
        const y = mid - (val * H * 0.4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Mirror Line
      ctx.beginPath();
      ctx.strokeStyle = '#ff2d78';
      ctx.opacity = 0.3;
      for (let i = 0; i < HISTORY; i++) {
        const x = (i / HISTORY) * W;
        const val = bufRef.current[(headRef.current + i) % HISTORY];
        const y = mid + (val * H * 0.4);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [getFrequencyData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 60, display: 'block' }}
    />
  );
};

export default Waveform;
