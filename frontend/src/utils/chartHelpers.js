// data transformation helpers for Recharts
// these massage the API responses into the format Recharts expects

export const formatWellnessData = (data) => {
  if (!data || !data.length) return [];
  return data.map(d => ({
    date: d.score_date,
    score: parseFloat(d.score),
    riskFlag: d.risk_flag,
    nightPct: parseFloat(d.night_commit_pct) * 100,
    weekendPct: parseFloat(d.weekend_commit_pct) * 100,
    commits: d.commits_count,
    streak: d.streak_days,
  }));
};

export const formatHourlyData = (data) => {
  if (!data || !data.length) return [];
  return data.map(d => ({
    hour: `${d.hour}:00`,
    hourNum: d.hour,
    count: parseInt(d.count),
    label: d.hour < 12 ? `${d.hour || 12}am` : `${d.hour === 12 ? 12 : d.hour - 12}pm`,
  }));
};

export const formatLanguageData = (data) => {
  if (!data || !data.length) return [];
  const colors = ['#FF2626', '#A9A9A9', '#FFFFFF', '#A9A9A9', '#f43f5e', '#f97316', '#eab308', '#39FF14', '#14b8a6', '#06b6d4'];
  return data.map((d, i) => ({
    name: d.language,
    value: parseInt(d.commit_count),
    fill: colors[i % colors.length],
  }));
};

export const formatVelocityData = (data) => {
  if (!data || !data.length) return [];
  return data.map(d => ({
    week: new Date(d.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    commits: parseInt(d.commits),
    linesAdded: parseInt(d.lines_added) || 0,
    linesRemoved: parseInt(d.lines_removed) || 0,
  }));
};

export const formatRadarData = (userRadar, benchmarkRadar) => {
  const dimensions = [
    { key: 'consistency', label: 'Consistency' },
    { key: 'volume', label: 'Volume' },
    { key: 'timing', label: 'Timing' },
    { key: 'diversity', label: 'Diversity' },
    { key: 'quality', label: 'Quality' },
    { key: 'wellness', label: 'Wellness' },
  ];

  return dimensions.map(d => ({
    dimension: d.label,
    user: Math.round(userRadar?.[d.key] || 0),
    benchmark: benchmarkRadar?.[d.key] || 50,
    fullMark: 100,
  }));
};
