import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import { getRepoDetail } from '../api/repos';

const RepoDetail = () => {
  const { repoId } = useParams();
  const { data, isLoading } = useQuery({ queryKey: ['repo', repoId], queryFn: () => getRepoDetail(repoId) });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-surface-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        </main>
      </div>
    );
  }

  const { repo, timeline, hourly, quality } = data || {};

  const hourlyFull = Array.from({ length: 24 }, (_, i) => {
    const found = (hourly || []).find(h => parseInt(h.hour) === i);
    return { hour: i, count: found ? parseInt(found.count) : 0, label: i < 12 ? `${i || 12}am` : `${i === 12 ? 12 : i - 12}pm` };
  });

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-11 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <h1 className="text-xl font-bold">{repo?.name || 'Repository'}</h1>
          <p className="text-xs text-surface-500">{repo?.full_name}</p>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Repo header */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {repo?.language && <span className="badge badge-info">{repo.language}</span>}
              <span className="text-xs text-surface-400">⭐ {repo?.stars || 0}</span>
              <span className="text-xs text-surface-400">🍴 {repo?.forks || 0}</span>
              {repo?.is_private && <span className="badge badge-warning">Private</span>}
            </div>
            {repo?.description && <p className="text-sm text-surface-300">{repo.description}</p>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card glass-card">
              <p className="text-2xl font-bold">{quality?.total_commits || 0}</p>
              <p className="text-xs text-surface-400">Total Commits</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-2xl font-bold">{parseFloat(quality?.avg_change_size || 0).toFixed(0)}</p>
              <p className="text-xs text-surface-400">Avg Change Size</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-2xl font-bold">{parseFloat(quality?.avg_message_length || 0).toFixed(0)}</p>
              <p className="text-xs text-surface-400">Avg Msg Length</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-2xl font-bold">{parseFloat(quality?.conventional_pct || 0).toFixed(0)}%</p>
              <p className="text-xs text-surface-400">Conventional Commits</p>
            </div>
          </div>

          {/* Commit timeline */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Commit Timeline (90 days)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline || []} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF0000" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF0000', borderRadius: 0, fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#FF0000" fill="url(#timelineGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Most active hours */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Most Active Hours</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyFull} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a1a1aa' }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF0000', borderRadius: 0, fontSize: '12px' }} />
                <Bar dataKey="count" radius={0}>
                  {hourlyFull.map((_, i) => (
                    <Cell key={i} fill={i >= 0 && i < 5 ? '#ef4444' : '#FF0000'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepoDetail;
