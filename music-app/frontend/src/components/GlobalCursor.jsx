import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function GlobalCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  // Hide on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  const ringX = useSpring(0, { stiffness: 220, damping: 26, mass: 0.3 });
  const ringY = useSpring(0, { stiffness: 220, damping: 26, mass: 0.3 });

  useEffect(() => {
    const handleMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setPos({ x, y });
      ringX.set(x);
      ringY.set(y);

      const el = document.elementFromPoint(x, y);
      const isClickable =
        el &&
        (el.tagName === 'BUTTON' ||
          el.tagName === 'A' ||
          el.tagName === 'INPUT' ||
          el.closest('button') ||
          el.closest('a') ||
          el.classList.contains('cursor-pointer') ||
          window.getComputedStyle(el).cursor === 'pointer');
      setHovering(Boolean(isClickable));
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [ringX, ringY]);

  const dotSize = 10;
  const ringBase = 36;
  const ringHover = 50;

  return (
    <>
      {/* Dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: 'var(--green-pure)',
          boxShadow: '0 0 8px var(--green-pure), 0 0 20px rgba(0,255,65,0.5)',
          zIndex: 99,
          pointerEvents: 'none',
          translateX: pos.x - dotSize / 2,
          translateY: pos.y - dotSize / 2,
        }}
      />

      {/* Ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: hovering ? ringHover : ringBase,
          height: hovering ? ringHover : ringBase,
          borderRadius: '50%',
          border: `1px solid rgba(0,255,65,${hovering ? 0.7 : 0.4})`,
          background: hovering ? 'rgba(0,255,65,0.08)' : 'transparent',
          zIndex: 98,
          pointerEvents: 'none',
          x: ringX.get() - (hovering ? ringHover : ringBase) / 2,
          y: ringY.get() - (hovering ? ringHover : ringBase) / 2,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      />
    </>
  );
}
