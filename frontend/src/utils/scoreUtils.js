// score color + label helpers
// not 100% sure about the exact color thresholds but these look good visually

export const getScoreColor = (score) => {
  if (score >= 80) return '#39FF14'; // emerald
  if (score >= 70) return '#39FF14'; // green
  if (score >= 60) return '#84cc16'; // lime
  if (score >= 50) return '#eab308'; // yellow
  if (score >= 40) return '#f97316'; // orange
  if (score >= 30) return '#ef4444'; // red
  return '#F5141F'; // dark red
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
    case 'none': return '#39FF14';
    case 'caution': return '#f59e0b';
    case 'high': return '#ef4444';
    default: return '#a1a1aa';
  }
};

export const getHeatmapColor = (count, max) => {
  if (count === 0) return '#000000';
  const intensity = Math.min(count / Math.max(max, 1), 1);
  if (intensity < 0.25) return '#312e81';
  if (intensity < 0.5) return '#F5141F';
  if (intensity < 0.75) return '#FF2626';
  return '#818cf8';
};

export const getWellnessHeatmapColor = (score) => {
  if (score === null || score === undefined) return '#000000';
  if (score >= 80) return '#059669';
  if (score >= 60) return '#16a34a';
  if (score >= 40) return '#ca8a04';
  if (score >= 20) return '#ea580c';
  return '#F5141F';
};
