// Illustrative browser-only data. No account, GitHub activity, or server sync is involved.
export const isoDay = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const SAMPLE_DATA = {
  wellness: Array.from({ length: 21 }, (_, index) => ({
    score_date: isoDay(index - 20),
    score: [72, 74, 71, 76, 79, 77, 73, 75, 78, 81, 79, 76, 74, 77, 80, 82, 78, 75, 79, 83, 81][index],
    risk_flag: 'none',
    night_commit_pct: [0.08, 0.12, 0.05, 0.09, 0.04][index % 5],
    weekend_commit_pct: [0.1, 0.14, 0.08][index % 3],
    commits_count: [3, 5, 2, 4, 6, 1, 0][index % 7],
    streak_days: Math.min(index + 1, 9),
  })),
  commits: Array.from({ length: 84 }, (_, index) => ({
    date: isoDay(index - 83),
    count: [2, 4, 3, 5, 1, 0, 2, 3, 6, 4, 2, 1, 0, 3][index % 14],
  })),
  hourly: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: [0, 0, 0, 0, 0, 1, 1, 3, 6, 9, 12, 13, 10, 8, 11, 12, 10, 8, 7, 5, 4, 3, 2, 1][hour],
  })),
  languages: [
    { language: 'JavaScript', commit_count: 82 },
    { language: 'TypeScript', commit_count: 54 },
    { language: 'Python', commit_count: 38 },
    { language: 'HTML', commit_count: 24 },
    { language: 'CSS', commit_count: 18 },
  ],
  velocity: Array.from({ length: 12 }, (_, index) => ({
    week_start: isoDay((index - 11) * 7 - new Date().getDay()),
    commits: [18, 22, 17, 26, 24, 29, 21, 27, 31, 25, 33, 28][index],
    lines_added: [380, 520, 290, 680, 610, 720, 440, 590, 810, 570, 760, 630][index],
    lines_removed: [90, 130, 75, 170, 140, 210, 110, 150, 240, 135, 180, 165][index],
  })),
  repositories: [
    { id: 'relay', name: 'Relay', full_name: 'Sample/Relay', language: 'JavaScript', description: 'Routing and fallback experiments', commit_count: 34 },
    { id: 'chainproof', name: 'ChainProof', full_name: 'Sample/ChainProof', language: 'TypeScript', description: 'Evidence workflow prototype', commit_count: 28 },
    { id: 'autoline', name: 'AutoLine', full_name: 'Sample/AutoLine', language: 'JavaScript', description: 'Manufacturing dashboard', commit_count: 21 },
    { id: 'nexora', name: 'Nexora', full_name: 'Sample/Nexora', language: 'TypeScript', description: 'Facility analysis interface', commit_count: 17 },
  ],
};
