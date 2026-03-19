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
            setTimeout(onComplete, 1000);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          exit={{ y: '-100%' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <motion.h1
              initial={{ opacity: 0, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, letterSpacing: '-0.05em' }}
              transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
              style={{
                fontSize: 48,
                textAlign: 'center',
                marginBottom: 20,
                color: '#fff',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900
              }}
            >
              RAABTA<span style={{ color: '#ff2d78' }}>.</span>
            </motion.h1>

            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: 2,
              background: 'rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Progress Bar Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  background: '#ff2d78',
                  boxShadow: '0 0 15px #ff2d78'
                }}
              />
            </div>

            <div style={{
              marginTop: 15,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span className="font-mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                SYSTEM INITIALIZING...
              </span>
              <span className="font-mono" style={{ fontSize: 9, color: '#ff2d78' }}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Subtle bottom text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              right: 0,
              textAlign: 'center'
            }}
          >
            <p className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              &copy; 2026 RAABTA AUDIO LABS // ALL RIGHTS RESERVED
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
