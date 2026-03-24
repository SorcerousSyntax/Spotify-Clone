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
    const barCount = 42;
    let smoothedBars = new Array(barCount).fill(0.12);
    let beatPulse = 0;
    let lowEnergyAvg = 0;
    let lowEnergyVar = 0;
    let lastBeatAt = 0;

    const drawBars = (levels = [], accent = 0) => {
      const width = canvas.width;
      const height = canvas.height;
      const baseline = height / 2;
      const gap = 4;
      const barWidth = Math.max(4, (width - gap * (barCount - 1)) / barCount);

      ctx.shadowBlur = 12 + accent * 10;
      ctx.shadowColor = '#ff2d78';

      for (let i = 0; i < barCount; i += 1) {
        const level = Math.min(1, Math.max(0.05, levels[i] || 0.05));
        const x = i * (barWidth + gap);
        const fullH = Math.max(4, level * (height * 0.92));
        const y = baseline - fullH / 2;
        const radius = Math.min(5, barWidth * 0.45);

        const gradient = ctx.createLinearGradient(0, y, 0, y + fullH);
        gradient.addColorStop(0, `rgba(255,160,200,${0.85 + accent * 0.1})`);
        gradient.addColorStop(0.45, `rgba(255,45,120,${0.95})`);
        gradient.addColorStop(1, `rgba(140,90,255,${0.72 + accent * 0.18})`);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + fullH - radius);
        ctx.quadraticCurveTo(x + barWidth, y + fullH, x + barWidth - radius, y + fullH);
        ctx.lineTo(x + radius, y + fullH);
        ctx.quadraticCurveTo(x, y + fullH, x, y + fullH - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    };

    const drawIdle = () => {
      const levels = new Array(barCount).fill(0.08);
      drawBars(levels, 0);
    };

    const drawSyncedFallback = (t) => {
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

      // Bass envelope + micro jitter for deterministic music-like bar motion.
      const bass = (0.24 + beatPulse * 0.56) * sectionEnergy;
      const highAccent = Math.pow((Math.sin(beat * Math.PI * 4 + (hash % 11)) + 1) * 0.5, 6.5) * 0.22;

      const levels = [];
      for (let i = 0; i < barCount; i += 1) {
        const nx = i / Math.max(1, barCount - 1);

        const low = Math.sin((t * 4.3) + nx * 7.2 + (hash % 13));
        const midBand = Math.sin((t * 9.6) + nx * 18.5 + (hash % 29) * 0.21);
        const high = Math.sin((t * 16.8) + nx * 31.8 + (hash % 37) * 0.13) * (1 + highAccent);

        const body = low * bass * 0.55 + midBand * 0.24 + high * 0.11;
        const flutter = Math.sin((t * 44.0) + nx * 73.0 + (hash % 17)) * 0.04;

        const target = 0.12 + Math.abs(body + flutter) * 0.78;
        const prev = smoothedBars[i] ?? 0.12;
        const smooth = prev * 0.72 + target * 0.28;
        smoothedBars[i] = smooth;
        levels.push(smooth);
      }

      drawBars(levels, highAccent);
    };

    const drawFromFrequency = (data, t) => {
      const drift = (t * 0.22) % 1;
      const nowMs = performance.now();

      // Split frequency space to drive low/mid/high note response.
      const lowEnd = Math.floor(dataLength * 0.25);
      const highStart = Math.floor(dataLength * 0.68);
      let lowSum = 0;
      let lowCount = 0;
      let highSum = 0;
      let highCount = 0;
      for (let i = 0; i < lowEnd; i += 1) {
        lowSum += data[i] || 0;
        lowCount += 1;
      }
      for (let i = highStart; i < dataLength; i += 1) {
        highSum += data[i] || 0;
        highCount += 1;
      }

      const lowEnergy = lowCount > 0 ? (lowSum / lowCount) / 255 : 0;
      const highEnergy = highCount > 0 ? (highSum / highCount) / 255 : 0;

      // Adaptive beat detector based on low-band onset against moving average.
      lowEnergyAvg = lowEnergyAvg * 0.92 + lowEnergy * 0.08;
      const delta = Math.max(0, lowEnergy - lowEnergyAvg);
      lowEnergyVar = lowEnergyVar * 0.9 + delta * 0.1;
      const adaptiveThreshold = 0.035 + lowEnergyVar * 1.35;
      const beatCooldownMs = 95;

      if (delta > adaptiveThreshold && nowMs - lastBeatAt > beatCooldownMs) {
        beatPulse = 1;
        lastBeatAt = nowMs;
      } else {
        beatPulse *= 0.86;
      }

      smoothedHighAccent = smoothedHighAccent * 0.82 + highEnergy * 0.18;
      const highAccent = Math.min(1, Math.max(0, smoothedHighAccent));

      const levels = [];
      const stride = Math.max(1, Math.floor(dataLength / barCount));

      for (let i = 0; i < barCount; i += 1) {
        const base = (i * stride + Math.floor(drift * dataLength)) % dataLength;
        let sum = 0;
        let count = 0;

        for (let k = 0; k < stride; k += 1) {
          const idx = (base + k) % dataLength;
          sum += data[idx] || 0;
          count += 1;
        }

        const value = count > 0 ? (sum / count) / 255 : 0;
        const shaped = Math.pow(value, 1.42);

        const bandPos = i / Math.max(1, barCount - 1);
        let bandScale = 1;
        if (bandPos < 0.25) bandScale = 0.86;
        else if (bandPos > 0.68) bandScale = 1 + highAccent * 0.58;

        // Beat punch: stronger in low-mid bars, slight lift everywhere.
        const bassWeight = Math.max(0, 1 - bandPos * 1.35);
        const beatBoost = beatPulse * (0.22 + bassWeight * 0.42);

        const target = 0.08 + shaped * bandScale * 0.96 + beatBoost;
        const prev = smoothedBars[i] ?? 0.08;
        const smooth = prev * 0.74 + target * 0.26;
        smoothedBars[i] = smooth;
        levels.push(smooth);
      }

      drawBars(levels, Math.max(highAccent, beatPulse * 0.8));
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
