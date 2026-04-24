import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp — animates a number from 0 to `end` over `duration` ms.
 * Returns the current display value as a string.
 * Works with integers and floats; handles strings like "72 days" gracefully.
 */
const useCountUp = (end, duration = 1000) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    // parse numeric part from value (e.g. "72 days" → 72)
    const rawStr = String(end);
    const match = rawStr.match(/^([\d.]+)(.*)/);
    if (!match) {
      setDisplay(end);
      return;
    }

    const target = parseFloat(match[1]);
    const suffix = match[2]; // e.g. " days" or "%"
    const isFloat = String(target).includes('.');
    const decimals = isFloat ? (String(target).split('.')[1]?.length || 1) : 0;

    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(current.toFixed(decimals) + suffix);

      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(rawStr); // snap to exact end value
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration]);

  return display;
};

export default useCountUp;
