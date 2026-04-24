import React from 'react';

const SkeletonBox = ({ h = '128px', w = '100%', className = '' }) => (
  <div 
    className={`rounded-xl bg-surface-800 ${className}`}
    style={{
      height: h, width: w,
      animation: 'devpulse-shimmer 1.5s ease-in-out infinite',
    }} 
  />
);

export default SkeletonBox;
