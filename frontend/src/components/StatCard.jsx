import React from 'react';

const StatCard = ({ value, label, icon, trend, trendLabel, className = '' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0 || trend === undefined || trend === null;

  return (
    <div className={`stat-card glass-card-hover ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {!isNeutral && (
          <span className={`badge ${isPositive ? 'badge-success' : 'badge-danger'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm text-surface-400 mt-1">{label}</p>
      </div>
      {trendLabel && (
        <p className="text-xs text-surface-500 mt-1">{trendLabel}</p>
      )}
    </div>
  );
};

export default StatCard;
