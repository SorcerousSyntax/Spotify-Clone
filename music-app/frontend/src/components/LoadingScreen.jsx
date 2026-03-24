import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFinished(true);
            setTimeout(onComplete, 800);
          }, 400);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'var(--color-bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {/* Background Elements */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '20%', right: '10%', width: '60vw', height: '60vw',
              background: 'radial-gradient(circle, var(--color-accent-primary), transparent 70%)',
              opacity: 0.08, filter: 'blur(100px)'
            }} />
            <div style={{
              position: 'absolute', bottom: '10%', left: '5%', width: '50vw', height: '50vw',
              background: 'radial-gradient(circle, var(--color-accent-secondary), transparent 70%)',
              opacity: 0.05, filter: 'blur(80px)'
            }} />
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: 320, zIndex: 1 }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
              className="page-title"
              style={{
                textAlign: 'center',
                marginBottom: 32,
                color: '#fff'
              }}
            >
              RAABTA<span>.</span>
            </motion.h1>

            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: 2,
              background: 'var(--color-border)',
              position: 'relative',
              borderRadius: 100,
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  background: 'var(--color-accent-primary)',
                  boxShadow: '0 0 20px var(--color-accent-glow)'
                }}
              />
            </div>

            <div style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.15em' }}>
                INITIALIZING
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-accent-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Subtle bottom text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              position: 'absolute',
              bottom: 48,
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: 8, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>
              RAABTA AUDIO LABS // 2026
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
