import React from 'react';

const BenchmarkTable = ({ user, industry }) => {
  const metrics = [
    { key: 'commits_per_week', label: 'Commits / Week', format: (v) => Math.round(v) },
    { key: 'avg_commit_message_length', label: 'Avg Message Length', format: (v) => `${Math.round(v)} chars` },
    { key: 'night_commit_pct', label: 'Night Commits', format: (v) => `${(v * 100).toFixed(1)}%`, reverse: true },
    { key: 'weekend_commit_pct', label: 'Weekend Commits', format: (v) => `${(v * 100).toFixed(1)}%`, reverse: true },
    { key: 'repos_active', label: 'Active Repos', format: (v) => Math.round(v) },
    { key: 'avg_wellness_score', label: 'Wellness Score', format: (v) => v?.toFixed(1) || '0' },
    { key: 'avg_streak', label: 'Best Streak', format: (v) => `${v} days` },
    { key: 'languages_used', label: 'Languages', format: (v) => v },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-700">
            <th className="text-left text-xs text-surface-400 font-medium py-3 px-4">Metric</th>
            <th className="text-center text-xs text-primary-400 font-medium py-3 px-4">You</th>
            <th className="text-center text-xs text-surface-400 font-medium py-3 px-4">Industry Avg</th>
            <th className="text-center text-xs text-surface-400 font-medium py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const userVal = user?.[metric.key] || 0;
            const indVal = industry?.[metric.key] || 0;
            const isBetter = metric.reverse
              ? userVal < indVal
              : userVal > indVal;
            const isEqual = Math.abs(userVal - indVal) / Math.max(indVal, 1) < 0.1;

            return (
              <tr key={metric.key} className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors">
                <td className="py-3 px-4 text-sm text-surface-300">{metric.label}</td>
                <td className="py-3 px-4 text-center text-sm font-medium">{metric.format(userVal)}</td>
                <td className="py-3 px-4 text-center text-sm text-surface-400">{metric.format(indVal)}</td>
                <td className="py-3 px-4 text-center">
                  {isEqual ? (
                    <span className="badge badge-info">≈ On par</span>
                  ) : isBetter ? (
                    <span className="badge badge-success">↑ Above</span>
                  ) : (
                    <span className="badge badge-warning">↓ Below</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BenchmarkTable;
