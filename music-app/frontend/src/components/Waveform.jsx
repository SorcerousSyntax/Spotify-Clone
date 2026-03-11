import React, { useRef, useEffect } from 'react';

const HISTORY = 220; // number of data points kept in the rolling buffer

const Waveform = ({ getFrequencyData, isPlaying }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bufRef = useRef(new Float32Array(HISTORY).fill(0.5)); // normalised 0-1
  const headRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      timeRef.current += 1;

      const W = canvas.width;
      const H = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d');

      // --- compute new amplitude sample ---
      const freqData = getFrequencyData?.();
      let amp = 0;

      if (freqData && freqData.length > 0 && isPlaying) {
        // Bass-weighted average: first 30 % of bins carry the beat energy
        const bassEnd = Math.max(1, Math.floor(freqData.length * 0.3));
        let sum = 0;
        for (let i = 0; i < bassEnd; i++) sum += freqData[i];
        amp = sum / bassEnd / 255; // 0 – 1
      } else if (!isPlaying) {
        // flat baseline with a tiny idle flutter
        amp = 0.04 * Math.abs(Math.sin(timeRef.current * 0.04));
      }

      // Push into circular buffer (normalised value)
      bufRef.current[headRef.current % HISTORY] = amp;
      headRef.current += 1;

      // --- draw ---
      ctx.clearRect(0, 0, W, H);

      const mid = H * 0.5;
      const maxSwing = H * 0.40; // max deflection from centre

      // Glow pass (thick, blurred)
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.55)';
      ctx.shadowBlur = 8 * dpr;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const bufIdx = ((headRef.current - HISTORY + Math.round((px / W) * HISTORY)) % HISTORY + HISTORY) % HISTORY;
        const v = bufRef.current[bufIdx];
        // ECG-style: deflect upward proportional to amplitude
        const y = mid - v * maxSwing;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.restore();

      // Sharp white pass (thin, crisp)
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 1.6 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const bufIdx = ((headRef.current - HISTORY + Math.round((px / W) * HISTORY)) % HISTORY + HISTORY) % HISTORY;
        const v = bufRef.current[bufIdx];
        const y = mid - v * maxSwing;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.restore();

      // Moving scan-head: a subtle bright dot at the leading edge
      const leadX = W - 1;
      const leadBuf = bufRef.current[(headRef.current - 1 + HISTORY) % HISTORY];
      const leadY = mid - leadBuf * maxSwing;
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 12 * dpr;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(leadX, leadY, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [getFrequencyData, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 56, display: 'block' }}
    />
  );
};

export default Waveform;
