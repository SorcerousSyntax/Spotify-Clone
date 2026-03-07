/**
 * useCardTilt — returns onMouseMove / onMouseLeave handlers
 * that apply a 3D perspective tilt to the element.
 *
 * Usage:
 *   const tiltHandlers = useCardTilt(12); // 12 = max tilt degrees
 *   <div {...tiltHandlers}>...</div>
 */
export default function useCardTilt(maxDeg = 12) {
  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to +0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;  // -0.5 to +0.5
    el.style.transform = `perspective(1000px) rotateX(${-y * maxDeg}deg) rotateY(${x * maxDeg}deg) translateZ(20px)`;
    el.style.transition = 'transform 0.05s linear';
  };

  const handleMouseLeave = (e) => {
    const el = e.currentTarget;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    el.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
  };

  return { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}
