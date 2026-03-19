import React, { useEffect } from 'react';
import Lenis from 'lenis';
import usePlayerStore from '../store/playerStore';

const SmoothScroll = ({ children }) => {
  const setScrollProgress = usePlayerStore((state) => state.setScrollProgress);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    const onScroll = ({ scroll, limit, progress }) => {
      setScrollProgress(progress);
    };

    lenis.on('scroll', onScroll);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [setScrollProgress]);

  return <>{children}</>;
};

export default SmoothScroll;
