import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if it's already in standalone mode (installed)
    const isStandalone = window.navigator.standalone === true || 
                       window.matchMedia('(display-mode: standalone)').matches;

    // Check if we've already shown it this session
    const hasBeenShown = sessionStorage.getItem('ios-prompt-shown');

    if (isIOS && !isStandalone && !hasBeenShown) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('ios-prompt-shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          bottom: 100, // Above bottom nav
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(350px, 90%)',
          zIndex: 2000,
          pointerEvents: 'auto',
        }}
      >
        <div className="liquid-glass" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 40px #00000066',
          borderRadius: '30px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                color: '#fff',
                fontFamily: "'Space Grotesk', sans-serif" 
              }}>
                Install Raabta App
              </h3>
              <p style={{ 
                margin: '5px 0 0 0', 
                fontSize: '12px', 
                color: 'var(--color-text-secondary)',
                lineHeight: '1.4'
              }}>
                Enjoy a full-screen experience and better performance.
              </p>
            </div>
            <button 
              onClick={() => setShowPrompt(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '12px',
            background: '#ffffff12',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '4px',
                  color: '#000'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
                <span>Tap the <strong>Share</strong> button below</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  background: '#fff',
                  borderRadius: '4px',
                  color: '#000'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>
                <span>Select <strong>Add to Home Screen</strong></span>
              </div>
            </div>
          </div>

          <button 
            className="btn-premium" 
            onClick={() => setShowPrompt(false)}
            style={{ 
              padding: '12px', 
              fontSize: '10px',
              width: '100%'
            }}
          >
            GOT IT
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IOSInstallPrompt;
