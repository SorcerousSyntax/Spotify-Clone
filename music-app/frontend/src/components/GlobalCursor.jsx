import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

const GlobalCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      if (e.target.closest('button, a, input, [role="button"]')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Main Square Dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          backgroundColor: '#fff',
          zIndex: 9999,
          pointerEvents: 'none',
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)'
        }}
      />
      
      {/* Outer Square Ring */}
      <motion.div
        animate={{
          scale: isHovered ? 2.5 : 1,
          opacity: isClicked ? 0.4 : 0.8,
          rotate: isHovered ? 45 : 0
        }}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 30,
          height: 30,
          border: '1px solid #ff2d78',
          zIndex: 9998,
          pointerEvents: 'none',
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Crosshair lines for premium feel */}
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, width: 1, height: 10, background: '#ff2d78',
          zIndex: 9997, pointerEvents: 'none', x: cursorXSpring, y: cursorYSpring,
          translateY: -25, translateX: -0.5
        }}
      />
      <motion.div
        style={{
          position: 'fixed', top: 0, left: 0, width: 1, height: 10, background: '#ff2d78',
          zIndex: 9997, pointerEvents: 'none', x: cursorXSpring, y: cursorYSpring,
          translateY: 15, translateX: -0.5
        }}
      />

      {/* Burst Animation on Click */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ scale: 0, opacity: 1, rotate: 0 }}
            animate={{ scale: 3, opacity: 0, rotate: 90 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: cursorY.get(),
              left: cursorX.get(),
              width: 30,
              height: 30,
              border: '2px solid #ff2d78',
              zIndex: 9996,
              pointerEvents: 'none',
              translateX: '-50%',
              translateY: '-50%',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalCursor;
