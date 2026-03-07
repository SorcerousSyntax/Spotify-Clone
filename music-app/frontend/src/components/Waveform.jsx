import React, { useRef, useEffect } from 'react';

const Waveform = ({ getFrequencyData, isPlaying, barCount = 50 }) => {
  const barsRef = useRef([]);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.05;

      const freqData = getFrequencyData?.();

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        let h;
        if (freqData && freqData.length > 0) {
          // Map bar index to frequency bin
          const binIndex = Math.floor((i / barCount) * freqData.length * 0.7);
          h = (freqData[binIndex] / 255) * 48 + 3;
        } else {
          // Idle sine wave
          h = 4 + Math.sin(timeRef.current * 1.5 + i * 0.4) * 3
              + Math.sin(timeRef.current * 0.8 + i * 0.6) * 2;
        }

        bar.style.height = `${h}px`;

        // Per-bar glow — brighter for taller bars
        const glowIntensity = Math.min(h / 50, 1);
        bar.style.boxShadow = `0 0 ${glowIntensity * 8}px rgba(0,255,106,${glowIntensity * 0.8})`;
      });
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [getFrequencyData, barCount]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 3, height: 56, width: '100%',
    }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          className="waveform-bar"
          style={{
            flex: 1,
            minWidth: 2,
            maxWidth: 6,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(to top, #00c44f, #00ff6a)`,
            willChange: 'height, box-shadow',
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
