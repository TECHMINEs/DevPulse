import React from 'react';
import useCountUp from '../hooks/useCountUp';

const StatCard = ({ value, label, icon, trend, trendLabel, className = '' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === undefined || trend === null;
  const animatedValue = useCountUp(value ?? 0, 900);

  return (
    <div className={`stat-card glass-card-hover ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl drop-shadow-[0_0_10px_rgba(255,0,51,0.5)]">{icon}</span>
        {!isNeutral && (
          <span className={`badge uppercase tracking-wider ${isPositive ? 'badge-success' : 'badge-danger'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-4xl font-black tracking-tighter text-white drop-shadow-md tabular-nums">
          {animatedValue}
        </p>
        <p className="text-xs uppercase tracking-widest text-surface-400 mt-2 font-bold">{label}</p>
      </div>
      {trendLabel && (
        <p className="text-[10px] uppercase tracking-widest text-surface-500 mt-2">{trendLabel}</p>
      )}
    </div>
  );
};

export default StatCard;
