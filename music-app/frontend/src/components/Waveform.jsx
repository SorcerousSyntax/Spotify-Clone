import React, { useRef, useEffect } from 'react';
import usePlayerStore from '../store/playerStore';

const Waveform = () => {
  const canvasRef = useRef(null);
  const getFrequencyData = usePlayerStore((s) => s.playerControls.getFrequencyData);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;
    const dataLength = 64;
    let smoothedHighAccent = 0;

    const drawLine = (points, lineWidth = 2.8) => {
      if (!points.length) return;

      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#ff2d78';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(cpX, prev.y, curr.x, curr.y);
      }

      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ff2d78';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawIdle = () => {
      const y = canvas.height / 2;
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,45,120,0.45)';
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    };

    const drawSyncedFallback = (t) => {
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;
      const points = [];

      const seedSource = `${currentSong?.id || ''}|${currentSong?.title || ''}|${currentSong?.artist || ''}`;
      let hash = 0;
      for (let i = 0; i < seedSource.length; i += 1) {
        hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
      }

      // Song-specific tempo between ~92 and 138 BPM for deterministic pulse motion.
      const bpm = 92 + (hash % 47);
      const beat = (t * bpm) / 60;
      const beatPulse = Math.pow((Math.sin(beat * Math.PI * 2) + 1) * 0.5, 3.6);

      // Emphasize section energy by playback progress so movement feels musical, not random.
      const songProgress = duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;
      const sectionRise = Math.sin(songProgress * Math.PI);
      const sectionEnergy = 0.62 + sectionRise * 0.38;

      // Bass envelope + micro jitter gives "felt" vibration instead of simple oscillation.
      const bass = (0.24 + beatPulse * 0.56) * sectionEnergy;
      const highAccent = Math.pow((Math.sin(beat * Math.PI * 4 + (hash % 11)) + 1) * 0.5, 6.5) * 0.22;

      for (let x = 0; x <= width; x += 8) {
        const nx = x / width;

        const low = Math.sin((t * 4.3) + nx * 7.2 + (hash % 13));
        const midBand = Math.sin((t * 9.6) + nx * 18.5 + (hash % 29) * 0.21);
        const high = Math.sin((t * 16.8) + nx * 31.8 + (hash % 37) * 0.13) * (1 + highAccent);

        const body = low * bass * 0.55 + midBand * 0.24 + high * 0.11;
        const flutter = Math.sin((t * 44.0) + nx * 73.0 + (hash % 17)) * 0.04;

        const y = mid - (body + flutter) * (height * 0.58);
        points.push({ x, y });
      }

      drawLine(points, 2.7);
    };

    const drawFromFrequency = (data, t) => {
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;
      const points = [];
      const step = width / (dataLength - 1);
      const drift = (t * 0.22) % 1;

      // Split frequency space to drive low/mid/high note response.
      const lowEnd = Math.floor(dataLength * 0.25);
      const highStart = Math.floor(dataLength * 0.68);
      let highSum = 0;
      let highCount = 0;
      for (let i = highStart; i < dataLength; i += 1) {
        highSum += data[i] || 0;
        highCount += 1;
      }
      const highEnergy = highCount > 0 ? (highSum / highCount) / 255 : 0;
      smoothedHighAccent = smoothedHighAccent * 0.82 + highEnergy * 0.18;
      const highAccent = Math.min(1, Math.max(0, smoothedHighAccent));

      for (let i = 0; i < dataLength; i += 1) {
        const idx = (i + Math.floor(drift * dataLength)) % dataLength;
        const value = data[idx] / 255;
        const shaped = Math.pow(value, 1.45);
        const x = i * step;

        let bandScale = 1;
        if (i < lowEnd) bandScale = 0.78;
        else if (i >= highStart) bandScale = 1 + highAccent * 0.5;

        const y = mid - (shaped * bandScale - 0.12) * (height * 0.8);
        points.push({ x, y });
      }

      drawLine(points, 3);
    };

    const render = () => {
      const data = getFrequencyData?.() || new Uint8Array(64);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isPlaying) {
        drawIdle();
        animationId = requestAnimationFrame(render);
        return;
      }

      const timeRatio = duration > 0 ? progress / duration : 0;
      const syncedTime = progress + timeRatio;
      let hasEnergy = false;

      for (let i = 0; i < data.length; i += 1) {
        if (data[i] > 2) {
          hasEnergy = true;
          break;
        }
      }

      if (hasEnergy) {
        drawFromFrequency(data, syncedTime);
      } else {
        // Mobile fallback: keep ECG moving in sync with song progress.
        drawSyncedFallback(syncedTime);
      }
      
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData, isPlaying, progress, duration, currentSong?.id, currentSong?.title, currentSong?.artist]);

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
