import React from 'react';
import useCountUp from '../hooks/useCountUp';

const StatCard = ({ value, label, icon, trend, trendLabel, className = '' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === undefined || trend === null;
  // If value is a string (e.g. '12 days', '35%'), we don't animate it with useCountUp to avoid parsing issues,
  // or we just render it directly. The previous implementation just animated value ?? 0, which breaks on strings.
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
  const animatedValue = useCountUp(isNumeric ? Number(value) : 0, 900);
  
  const displayValue = isNumeric ? animatedValue : value;

  return (
    <div className={`stat-card glass-card-hover ${className}`}>
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-500/10 blur-[30px] rounded-full pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]">{icon}</span>
        {!isNeutral && (
          <span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      
      <div className="mt-4 relative z-10">
        <p className="text-4xl font-black tracking-tighter text-white drop-shadow-md tabular-nums">
          {displayValue}
        </p>
        <p className="text-xs font-bold text-surface-400 mt-2 uppercase tracking-widest">{label}</p>
      </div>
      
      {trendLabel && (
        <p className="text-[10px] uppercase tracking-widest text-surface-500 mt-2 relative z-10">{trendLabel}</p>
      )}
    </div>
  );
};

export default StatCard;
