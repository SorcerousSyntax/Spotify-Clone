import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePlayerStore from '../store/playerStore';
import useLyricsSync from '../hooks/useLyricsSync';

const LyricsPanel = ({ lyrics, onSeek }) => {
  const isOpen = usePlayerStore((s) => s.isLyricsPanelOpen);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const progress = usePlayerStore((s) => s.progress);
  const activeLine = useLyricsSync(lyrics, progress);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && activeLine >= 0) {
      const activeEl = listRef.current.children[activeLine];
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleLyricsPanel}
            style={{
              position: 'fixed', inset: 0, zIndex: 110,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
            }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 120,
              background: 'rgba(0,0,0,0.95)',
              borderTop: '1px solid #ff2d78',
              borderRadius: '30px 30px 0 0',
              maxHeight: '80vh',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 32 }}>LYRICS</h2>
              <button onClick={toggleLyricsPanel} style={{ background: 'none', border: 'none', color: '#ff2d78', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </header>

            <div
              ref={listRef}
              style={{
                flex: 1, overflowY: 'auto',
                paddingBottom: 60,
                scrollbarWidth: 'none'
              }}
            >
              {lyrics.length > 0 ? (
                lyrics.map((line, i) => (
                  <motion.div
                    key={i}
                    onClick={() => onSeek?.(line.time)}
                    animate={{
                      opacity: i === activeLine ? 1 : 0.2,
                      scale: i === activeLine ? 1.1 : 1,
                      x: i === activeLine ? 20 : 0
                    }}
                    style={{
                      padding: '15px 0',
                      cursor: 'pointer',
                      fontSize: 'clamp(24px, 4vw, 48px)',
                      fontWeight: 900,
                      color: i === activeLine ? '#ff2d78' : '#fff',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {typeof line === 'string' ? line : line.text}
                  </motion.div>
                ))
              ) : (
                <p className="font-mono" style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: 100 }}>NO LYRICS DETECTED</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LyricsPanel;
