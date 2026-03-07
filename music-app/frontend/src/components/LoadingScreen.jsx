import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = ['R', 'A', 'A', 'B', 'T', 'A'];

export default function LoadingScreen({ onComplete }) {
  const [phase, setPhase] = useState('letters'); // letters → glow → smoke → done

  useEffect(() => {
    // After letters appear (0.1s delay each + 0.5s base = ~1.1s), glow
    const t1 = setTimeout(() => setPhase('glow'), 1400);
    // After glow, fade out
    const t2 = setTimeout(() => setPhase('done'), 2400);
    // Notify parent
    const t3 = setTimeout(() => onComplete?.(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
          }}
        >
          {/* Letters */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 40, scaleY: 0.3 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                transition={{
                  delay: 0.1 + i * 0.1,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 'clamp(56px, 12vw, 96px)',
                  letterSpacing: '0.08em',
                  color: '#00ff6a',
                  display: 'inline-block',
                  textShadow: phase === 'glow'
                    ? '0 0 20px #00ff6a, 0 0 50px #00ff6a, 0 0 100px rgba(0,255,106,0.5)'
                    : '0 0 10px rgba(0,255,106,0.4)',
                  transition: 'text-shadow 0.4s ease',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'glow' ? 0.4 : 0.2 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.3em',
              color: 'rgba(0,255,106,0.6)',
              marginTop: '16px',
              textTransform: 'uppercase',
            }}
          >
            Your private world of music
          </motion.p>

          {/* Bottom green glow bar */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)',
              boxShadow: '0 0 20px #00ff6a',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
