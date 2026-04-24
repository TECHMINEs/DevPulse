import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * NavigationProgress — a thin red top bar that animates across the viewport
 * on every route change, providing instant visual feedback for navigation.
 */
const NavigationProgress = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(0);

    // quickly animate to 80%, then wait for next render to finish
    const t1 = setTimeout(() => setProgress(30), 20);
    const t2 = setTimeout(() => setProgress(65), 80);
    const t3 = setTimeout(() => setProgress(80), 200);

    // complete and fade out
    const t4 = setTimeout(() => setProgress(100), 400);
    const t5 = setTimeout(() => setVisible(false), 700);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] pointer-events-none"
      style={{
        width: `${progress}%`,
        transition: progress === 0 ? 'none' : 'width 0.3s ease, opacity 0.3s ease',
        opacity: progress >= 100 ? 0 : 1,
        background: 'linear-gradient(90deg, #ff0033, #ff4d6d, #ff0033)',
        boxShadow: '0 0 8px 1px rgba(255,0,51,0.6)',
      }}
    />
  );
};

export default NavigationProgress;
