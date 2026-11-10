import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationProgress = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 animate-slide-in-right origin-left" />
    </div>
  );
};

export default NavigationProgress;
