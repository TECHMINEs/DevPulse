// score color + label helpers
// not 100% sure about the exact color thresholds but these look good visually

export const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'; // emerald
  if (score >= 70) return '#22c55e'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 50) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  if (score >= 30) return '#ef4444'; // red
  return '#dc2626'; // dark red
};

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Moderate';
  if (score >= 40) return 'Caution';
  return 'At Risk';
};

export const getScoreBadgeClass = (score) => {
  if (score >= 70) return 'badge-success';
  if (score >= 40) return 'badge-warning';
  return 'badge-danger';
};

export const getRiskColor = (riskFlag) => {
  switch (riskFlag) {
    case 'none': return '#10b981';
    case 'caution': return '#f59e0b';
    case 'high': return '#ef4444';
    default: return '#64748b';
  }
};

export const getHeatmapColor = (count, max) => {
  if (count === 0) return '#1e293b';
  const intensity = Math.min(count / Math.max(max, 1), 1);
  if (intensity < 0.25) return '#312e81';
  if (intensity < 0.5) return '#4338ca';
  if (intensity < 0.75) return '#6366f1';
  return '#818cf8';
};

export const getWellnessHeatmapColor = (score) => {
  if (score === null || score === undefined) return '#1e293b';
  if (score >= 80) return '#059669';
  if (score >= 60) return '#16a34a';
  if (score >= 40) return '#ca8a04';
  if (score >= 20) return '#ea580c';
  return '#dc2626';
};
