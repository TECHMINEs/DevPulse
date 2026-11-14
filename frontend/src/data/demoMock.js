import { SAMPLE_DATA } from './sampleData';

const getOnboardedState = () => {
  try {
    return localStorage.getItem('devpulse_onboarded') !== 'false';
  } catch {
    return true;
  }
};

const getDemoUser = () => ({
  id: '32c0b8ac235c37e1f444449e71c3febf',
  username: 'TECHMINEs',
  display_name: 'Pranav J',
  avatar_url: 'https://github.com/TECHMINEs.png',
  email: 'pranavjmit@gmail.com',
  role: 'admin',
  created_at: '2026-04-12T00:54:26Z',
  onboarding_completed: getOnboardedState(),
});

export const demoMock = {
  get user() {
    return getDemoUser();
  },

  getMe() {
    return { user: getDemoUser(), token: 'demo-session-token' };
  },

  getDashboardData() {
    return {
      wellnessScore: 78.7,
      wellnessCategory: 'Good',
      streak: 14,
      totalCommits: 342,
      burnoutRisk: 'Low',
      velocityTrend: '+12.4%',
      activeRepos: 5,
      recentActivity: [
        { id: 1, type: 'commit', repo: 'Relay', message: 'feat: add prometheus metric counters', time: '2 hours ago' },
        { id: 2, type: 'pr', repo: 'ChainProof', message: 'audit: verify zero-knowledge snark circuits', time: '6 hours ago' },
        { id: 3, type: 'commit', repo: 'AutoLine', message: 'perf: optimize sqlite query execution plan', time: '1 day ago' },
      ],
    };
  },

  getWellness() {
    return {
      score: 78.7,
      status: 'Sustainable Rhythm',
      metrics: {
        night_commit_pct: 4.2,
        weekend_commit_pct: 12.0,
        avg_commit_hour: 14.5,
        avg_message_length: 32.4,
        streak_days: 14,
      },
      history: (SAMPLE_DATA.wellness_scores || []).map((w, idx) => ({
        date: w.date || `2026-04-${10 + idx}`,
        score: w.score || 78.67,
      })),
    };
  },

  getCommits() {
    return (SAMPLE_DATA.commit_snapshots || []).map((c, i) => ({
      id: c.id || `c-${i}`,
      date: c.date || `2026-04-${(i % 28) + 1}`,
      count: c.count || Math.floor(Math.random() * 8) + 1,
    }));
  },

  getHourly() {
    return [0, 0, 0, 0, 1, 3, 8, 16, 24, 38, 42, 36, 31, 28, 25, 20, 15, 9, 5, 2, 1, 0, 0, 0];
  },

  getLanguages() {
    return [
      { name: 'TypeScript', percentage: 46.2, color: '#3178c6' },
      { name: 'Go', percentage: 26.8, color: '#00add8' },
      { name: 'Python', percentage: 15.4, color: '#3572A5' },
      { name: 'Rust', percentage: 7.2, color: '#dea584' },
      { name: 'HTML/CSS', percentage: 4.4, color: '#FF2626' },
    ];
  },

  getStreak() {
    return { current: 14, longest: 38, total_active_days: 184 };
  },

  getVelocity() {
    return [
      { week: 'W1', velocity: 42, target: 40 },
      { week: 'W2', velocity: 48, target: 40 },
      { week: 'W3', velocity: 39, target: 40 },
      { week: 'W4', velocity: 52, target: 40 },
      { week: 'W5', velocity: 45, target: 40 },
      { week: 'W6', velocity: 58, target: 40 },
    ];
  },

  getRadar() {
    return [
      { metric: 'Consistency', value: 88, benchmark: 75 },
      { metric: 'Recovery Time', value: 82, benchmark: 70 },
      { metric: 'Code Review', value: 74, benchmark: 65 },
      { metric: 'Deep Work', value: 91, benchmark: 80 },
      { metric: 'Balance', value: 80, benchmark: 72 },
    ];
  },

  getBenchmark() {
    return {
      tier: 'Top 10%',
      percentile: 91.5,
      category: 'Consistent Contributor',
      summary: 'Well-distributed working hours with below-average late-night commit density.',
    };
  },

  getPredictions() {
    return {
      pattern: 'Stable High Output',
      risk: 'Low (12% index)',
      recommendation: 'Current commit distribution indicates sustainable coding rhythms.',
    };
  },

  getRepos() {
    return (SAMPLE_DATA.repositories || []).map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description || 'Public software engineering repository',
      language: r.language || 'TypeScript',
      stars: r.stargazers_count || 12,
      forks: r.forks_count || 3,
      open_issues: 0,
      updated_at: r.updated_at || '2026-11-14T10:00:00Z',
    }));
  },

  getTopRepos() {
    return this.getRepos().slice(0, 3);
  },

  getRepoDetail(id) {
    const found = this.getRepos().find((r) => r.id === id) || this.getRepos()[0];
    return {
      ...found,
      commits_count: 148,
      branches_count: 3,
      contributors_count: 2,
    };
  },

  getAchievements() {
    return (SAMPLE_DATA.achievements || []).map((a) => ({
      ...a,
      unlocked: true,
      unlocked_at: '2026-04-18T12:00:00Z',
    }));
  },

  getEarnedAchievements() {
    return this.getAchievements().slice(0, 5);
  },

  getGoals() {
    return [
      { id: 1, title: 'Keep late night commits under 5%', current: 4.2, target: 5.0, unit: '%', status: 'On Track' },
      { id: 2, title: 'Maintain 14+ day consistency streak', current: 14, target: 14, unit: 'days', status: 'Completed' },
      { id: 3, title: 'Zero unreviewed open PRs over 48h', current: 0, target: 0, unit: 'prs', status: 'Achieved' },
    ];
  },
};
