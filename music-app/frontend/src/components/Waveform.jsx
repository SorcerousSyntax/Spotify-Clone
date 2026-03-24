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
      
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ff2d78';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // ECG / Waveform style
      const width = canvas.width;
      const height = canvas.height;
      const step = width / (data.length - 1);
      
      ctx.moveTo(0, height / 2);
      
      for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const amplitude = (data[i] / 255.0) * (height / 1.5);
        const y = height / 2 + (i % 2 === 0 ? -amplitude : amplitude);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth the line a bit
          const prevX = (i - 1) * step;
          const prevAmplitude = (data[i - 1] / 255.0) * (height / 1.5);
          const prevY = height / 2 + ((i - 1) % 2 === 0 ? -prevAmplitude : prevAmplitude);
          
          const cpX = prevX + (x - prevX) / 2;
          ctx.quadraticCurveTo(cpX, prevY, x, y);
        }
      }
      
      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff2d78';
      ctx.stroke();
      
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData]);

  return (
    <div style={{ width: '100%', height: 60, marginTop: 20, marginBottom: 20 }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={60}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

export default Waveform;
