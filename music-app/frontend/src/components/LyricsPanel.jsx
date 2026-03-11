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

  // Auto-scroll to active line
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
          {/* Backdrop */}
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 49,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleLyricsPanel}
          />

          {/* Panel */}
          <motion.div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'rgba(11,0,30,0.97)',
              backdropFilter: 'blur(40px)',
              borderTop: '2px solid rgba(139,92,246,0.5)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '70vh',
              boxShadow: '0 -20px 60px rgba(109,40,217,0.15)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(139,92,246,0.4)' }} />
            </div>

            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12, fontWeight: 600, letterSpacing: '0.16em',
              color: 'rgba(167,139,250,0.6)',
              textAlign: 'center', padding: '4px 0 16px', textTransform: 'uppercase',
            }}>LYRICS</p>

            {/* Lyrics list */}
            <div
              ref={listRef}
              style={{
                overflowY: 'auto', padding: '0 24px 100px',
                maxHeight: 'calc(70vh - 80px)',
                scrollbarWidth: 'none',
              }}
            >
              {lyrics.length > 0 ? (
                lyrics.map((line, i) => (
                  <motion.div
                    key={i}
                    onClick={() => onSeek?.(line.time)}
                    animate={{
                      opacity: i === activeLine ? 1 : i < activeLine ? 0.2 : 0.45,
                      scale: i === activeLine ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      padding: '10px 0',
                      cursor: 'pointer',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: i === activeLine ? 17 : 14,
                      lineHeight: 1.5,
                      color: i === activeLine ? '#c4b5fd' : '#fff',
                      textShadow: i === activeLine
                        ? '0 0 16px rgba(167,139,250,0.8)'
                        : 'none',
                      transition: 'font-size 0.3s, color 0.3s, text-shadow 0.3s',
                      borderLeft: i === activeLine ? '3px solid #a78bfa' : '3px solid transparent',
                      paddingLeft: 16,
                      marginLeft: -16,
                    }}
                  >
                    {typeof line === 'string' ? line : line.text}
                  </motion.div>
                ))
              ) : (
                <p style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 13, color: 'rgba(255,255,255,0.2)',
                  textAlign: 'center', padding: '40px 0',
                }}>No lyrics available</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LyricsPanel;
