import { SAMPLE_DATA, isoDay } from './sampleData';

const demoPreference = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export const getDemoUser = () => ({
  id: 'illustrative-developer',
  username: 'sample_developer',
  display_name: 'Sample Developer',
  avatar_url: `${import.meta.env.BASE_URL}logo-mark.svg`,
  role: 'user',
  onboarding_completed: demoPreference('devpulse_onboarded') === 'true',
  focus: demoPreference('devpulse_focus') || 'balance',
});

const repos = SAMPLE_DATA.repositories.map((repo, index) => ({
  ...repo,
  provider: 'demo',
  stars: 0,
  forks: 0,
  open_issues: 0,
  weekly_commits: [8, 7, 5, 4][index],
  night_pct: [0.07, 0.11, 0.06, 0.09][index],
  updated_at: `${isoDay(-index)}T12:00:00Z`,
  velocity: SAMPLE_DATA.velocity.slice(-6).map((week, offset) => ({
    week: week.week_start,
    count: [3, 5, 4, 6, 5, 7][offset] - index % 2,
  })),
}));

export const demoMock = {
  get user() { return getDemoUser(); },
  getWellness() { return { wellness: SAMPLE_DATA.wellness }; },
  getCommits() { return { commits: SAMPLE_DATA.commits }; },
  getHourly() { return { hourly: SAMPLE_DATA.hourly }; },
  getLanguages() { return { languages: SAMPLE_DATA.languages }; },
  getStreak() { return { current_streak: 9, longest_streak: 14, calendar: SAMPLE_DATA.commits }; },
  getVelocity() { return { velocity: SAMPLE_DATA.velocity }; },
  getRadar() { return { radar: { consistency: 76, volume: 68, timing: 82, diversity: 80, quality: 74, wellness: 79 } }; },
  getBenchmark() {
    return {
      user: { commits_per_week: 28, avg_commit_message_length: 43, night_commit_pct: 0.08, weekend_commit_pct: 0.11, repos_active: 4, avg_wellness_score: 79, avg_streak: 9, languages_used: 5 },
      industry: { commits_per_week: 25, avg_commit_message_length: 35, night_commit_pct: 0.12, weekend_commit_pct: 0.15, repos_active: 3, avg_wellness_score: 72, avg_streak: 5, languages_used: 3 },
    };
  },
  getPredictions() {
    return {
      actual: SAMPLE_DATA.wellness.slice(-14),
      predictions: [80, 79, 81, 82, 80, 83, 82].map((score, index) => ({ date: isoDay(index + 1), score })),
    };
  },
  getRepos() { return { repos }; },
  getTopRepos() { return { repos: repos.slice(0, 3) }; },
  getRepoDetail(id) {
    const repo = repos.find((entry) => entry.id === id);
    return repo ? {
      repo,
      timeline: SAMPLE_DATA.commits.slice(-30).map((day) => ({ ...day, count: Math.max(0, day.count - 1) })),
      hourly: SAMPLE_DATA.hourly.map((entry) => ({ ...entry, count: Math.floor(entry.count / 3) })),
      quality: { total_commits: repo.commit_count, avg_change_size: 42, avg_message_length: 38, conventional_pct: 68 },
    } : { error: 'Repository unavailable in sample data' };
  },
  getAchievements() { return { totalPoints: 30, achievements: [
    { id: 'first-week', slug: 'first-week', name: 'First Week', icon: '⚡', category: 'onboarding', points: 5, earned_at: `${isoDay(-12)}T12:00:00Z`, description: 'Completed a sample week of activity.' },
    { id: 'steady-pace', slug: 'steady-pace', name: 'Steady Pace', icon: '🌿', category: 'wellness', points: 15, earned_at: `${isoDay(-5)}T12:00:00Z`, description: 'Kept a balanced sample schedule.' },
    { id: 'four-projects', slug: 'four-projects', name: 'Four Projects', icon: '📁', category: 'diversity', points: 10, earned_at: `${isoDay(-2)}T12:00:00Z`, description: 'Worked across four sample repositories.' },
  ] }; },
  getEarnedAchievements() { return this.getAchievements(); },
  getGoals() { return {
    active: [{ id: 'pace', title: 'Maintain a 10-day streak', goal_type: 'wellness_score', current_value: 9, target_value: 10, start_date: isoDay(-9), end_date: isoDay(7), is_completed: false }],
    completed: [{ id: 'week', title: 'Complete the first week', goal_type: 'weekly_commits', current_value: 21, target_value: 20, start_date: isoDay(-14), end_date: isoDay(-7), is_completed: true }],
    stats: { completionRate: 50 },
  }; },
};
