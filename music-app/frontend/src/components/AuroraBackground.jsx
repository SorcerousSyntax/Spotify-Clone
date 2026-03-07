import React from 'react';

const AuroraBackground = () => {
  return (
    <>
      {/* Smoke / Fog Layer */}
      <div className="smoke-layer">
        {/* Large smoke particles */}
        <div className="smoke-particle smoke-1" />
        <div className="smoke-particle smoke-2" />
        <div className="smoke-particle smoke-3" />
        <div className="smoke-particle smoke-4" />
        <div className="smoke-particle smoke-5" />

        {/* Horizontal smoke wisps */}
        <div className="smoke-wisp" />
        <div className="smoke-wisp" />
        <div className="smoke-wisp" />

        {/* Ambient glow at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[400px] opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% -20%, rgba(29, 185, 84, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Ambient glow at bottom right */}
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-20"
          style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(29, 185, 84, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>

      {/* Floating music note particles */}
      <div className="music-particles">
        <span className="music-particle">♪</span>
        <span className="music-particle">♫</span>
        <span className="music-particle">♩</span>
        <span className="music-particle">♬</span>
        <span className="music-particle">♪</span>
        <span className="music-particle">♫</span>
        <span className="music-particle">♩</span>
        <span className="music-particle">♬</span>
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />
    </>
  );
};

export default AuroraBackground;
