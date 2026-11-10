import React from 'react';

const SkeletonBox = ({ h = '128px', w = '100%', className = '' }) => (
  <div 
    className={`rounded-2xl bg-surface-900/60 animate-pulse ${className}`}
    style={{ height: h, width: w }} 
  />
);

export default SkeletonBox;
