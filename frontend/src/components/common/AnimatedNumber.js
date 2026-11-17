import React, { useState, useEffect } from 'react';

export default function AnimatedNumber({ value = 0, suffix = '', prefix = '', duration = 1000 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const t0 = performance.now();
    let frameId;

    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * ease));
      if (p < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

