import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import WellnessGauge from '../components/WellnessGauge';
import CommitHeatmap from '../components/CommitHeatmap';
import SparkLine from '../components/SparkLine';
import SyncProgressModal from '../components/SyncProgressModal';
import useStore from '../store/useStore';
import useSocket from '../hooks/useSocket';
import useSync from '../hooks/useSync';
import { getProfile, getWellness, getCommits, getHourly, getLanguages, getAchievements, getStreak } from '../api/analytics';
import { getTopRepos } from '../api/repos';
import { formatWellnessData, formatHourlyData, formatLanguageData } from '../utils/chartHelpers';
import { getGreeting, formatTimeAgo } from '../utils/dateUtils';
import { getScoreColor } from '../utils/scoreUtils';

const Dashboard = () => {
  const user = useStore((s) => s.user);
  const isSyncing = useStore((s) => s.isSyncing);
  useSocket(); // init real-time connection

  const { triggerSync, isTriggering } = useSync();

  // fetch all dashboard data - BUG-02: split into granular queries
  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const { data: wellnessData } = useQuery({ queryKey: ['wellness', 90], queryFn: () => getWellness(90) });
  const { data: commitData } = useQuery({ queryKey: ['commits'], queryFn: () => getCommits(365) });
  const { data: hourlyData } = useQuery({ queryKey: ['hourly'], queryFn: getHourly });
  const { data: langData } = useQuery({ queryKey: ['languages'], queryFn: getLanguages });
  const { data: topReposData } = useQuery({ queryKey: ['topRepos'], queryFn: getTopRepos });
  const { data: achievementsData } = useQuery({ queryKey: ['achievements'], queryFn: getAchievements });
  const { data: streakData } = useQuery({ queryKey: ['streak'], queryFn: getStreak });

  const dash = { profile, wellness: wellnessData, commits: commitData, hourly: hourlyData, languages: langData, repos: topReposData, achievements: achievementsData, streak: streakData };

  if (dash && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  const wellnessChart = formatWellnessData(wellnessData?.wellness || []);
  const hourlyChart = formatHourlyData(hourlyData?.hourly || []);
  const languageChart = formatLanguageData(langData?.languages || []);

  const currentScore = wellnessChart.length > 0 ? wellnessChart[wellnessChart.length - 1].score : 0;
  const streak = streakData?.current_streak || 0;

  // calculate this week's commits
  const thisWeekCommits = (commitData?.commits || []).filter((c) => {
    const d = new Date(c.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).reduce((sum, c) => sum + parseInt(c.count), 0) || 0;

  // calculate night commit %
  const nightCommitPct = wellnessChart.length > 0
    ? wellnessChart[wellnessChart.length - 1].nightPct
    : 0;

  const recentAchievements = (achievementsData?.achievements || []).slice(0, 3);

  if (profileError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="glass-card p-8 text-center">
            <p className="text-3xl mb-3">⚡</p>
            <p className="text-lg font-semibold mb-2">Something went wrong</p>
            <p className="text-sm text-surface-400 mb-5">Could not load your dashboard data.</p>
            <button className="btn-primary text-sm" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="h-16 bg-surface-800/60 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-surface-800/60 rounded-2xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-surface-800/60 rounded-2xl animate-pulse" />
            <div className="h-64 bg-surface-800/60 rounded-2xl animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-11 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-line px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {getGreeting()}, <span className="gradient-text">{profile?.display_name || user?.username || 'Developer'}</span>
              </h1>
              <p className="text-xs text-surface-500 mt-0.5">
                {profile?.last_synced_at
                  ? `Last synced ${formatTimeAgo(profile.last_synced_at)}`
                  : 'Never synced — click Sync Now to get started'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => triggerSync()}
                disabled={isTriggering || isSyncing}
                className={`btn-primary text-sm flex items-center gap-2 ${isSyncing ? 'sync-pulse' : ''}`}
              >
                {isSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>🔄 Sync Now</>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Low wellness alert */}
          {currentScore > 0 && currentScore < 40 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-slide-up">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-400">Your wellness score is low ({currentScore.toFixed(0)})</p>
                <p className="text-xs text-surface-400">Consider taking a break. Your health matters more than any commit.</p>
              </div>
              <button className="ml-auto text-surface-500 hover:text-surface-300 text-sm">✕</button>
            </div>
          )}

          {/* Row 1: Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card glass-card-hover">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Wellness Score</span>
                <span className={`badge ${currentScore >= 70 ? 'badge-success' : currentScore >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                  {currentScore >= 70 ? 'Good' : currentScore >= 40 ? 'Caution' : 'At Risk'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <WellnessGauge score={currentScore} size={80} showLabel={false} />
                <span className="text-4xl font-bold" style={{ color: getScoreColor(currentScore) }}>
                  {currentScore.toFixed(0)}
                </span>
              </div>
            </div>

            <StatCard
              value={`${streak} days`}
              label="Current Streak"
              icon="🔥"
              trend={null}
            />

            <StatCard
              value={thisWeekCommits}
              label="Commits This Week"
              icon="📝"
            />

            <StatCard
              value={`${nightCommitPct.toFixed(0)}%`}
              label="Night Commits"
              icon={nightCommitPct > 30 ? '⚠️' : '🌙'}
              className={nightCommitPct > 30 ? 'border-stroke' : ''}
            />
          </div>

          {/* Row 2: Wellness timeline + Commit heatmap */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Wellness Timeline */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">Wellness Timeline (90 days)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={wellnessChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF2626" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FF2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }}
                    labelStyle={{ color: '#A3A3A3' }}
                    formatter={(value) => [`${value.toFixed(1)}`, 'Score']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Area type="monotone" dataKey="score" stroke="#FF2626" strokeWidth={2} fill="url(#wellnessGrad)" dot={false} activeDot={{ r: 4, fill: '#FF2626' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Commit Heatmap */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">Contribution Activity</h2>
              <CommitHeatmap data={commitData?.commits || []} />
            </div>
          </div>

          {/* Row 3: Hourly + Languages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">Hourly Activity</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a1a1aa' }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }}
                    formatter={(value) => [value, 'Commits']}
                  />
                  <Bar dataKey="count" radius={0}>
                    {hourlyChart.map((entry, i) => (
                      <Cell key={i} fill={entry.hourNum >= 0 && entry.hourNum < 5 ? '#ef4444' : entry.hourNum >= 9 && entry.hourNum <= 17 ? '#FF2626' : '#F5141F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Language Distribution */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-surface-300 mb-4">Language Distribution</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={languageChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {languageChart.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF2626', borderRadius: 0, fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {languageChart.slice(0, 5).map((lang) => (
                    <div key={lang.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.fill }} />
                      <span className="text-surface-300">{lang.name}</span>
                      <span className="text-surface-500 ml-auto text-xs">{lang.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Top Repos */}
          {topReposData?.repos?.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-300 mb-3">Top Repositories This Month</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topReposData.repos.map((repo) => (
                  <div key={repo.id} className="glass-card-hover p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm truncate">{repo.name}</span>
                      {repo.language && <span className="badge badge-info text-[10px]">{repo.language}</span>}
                    </div>
                    <p className="text-xs text-surface-400 mb-3 line-clamp-1">{repo.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-surface-500">{repo.commit_count} commits</span>
                      <SparkLine
                        data={(repo.velocity || []).map(v => ({ count: parseInt(v.count) }))}
                        color="#FF2626"
                        width={80}
                        height={24}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 5: Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-surface-300 mb-3">Recent Achievements</h2>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentAchievements.map((a) => (
                  <div key={a.slug || a.id} className="glass-card p-4 flex items-center gap-3 min-w-[200px]">
                    <span className="text-3xl">{a.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-[10px] text-surface-500">{a.earned_at ? new Date(a.earned_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <SyncProgressModal />
    </div>
  );
};

export default Dashboard;
