import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { getPublicProfile } from '../api/analytics';
import toast from 'react-hot-toast';

const PublicProfile = () => {
  const { username } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['publicProfile', username], queryFn: () => getPublicProfile(username) });

  const profile = data?.profile;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">🔒</span>
          <p className="text-surface-400 mt-4 text-lg">Profile not found or is private</p>
        </div>
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-900/30 to-surface-950 pt-12 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
            alt={username}
            className="w-24 h-24 rounded-full border-4 border-surface-700 mx-auto mb-4 shadow-xl"
          />
          <h1 className="text-3xl font-bold mb-1">{profile.display_name || username}</h1>
          <p className="text-surface-400">@{username}</p>
          {profile.bio && <p className="text-surface-300 mt-3 max-w-lg mx-auto">{profile.bio}</p>}
          {profile.location && <p className="text-surface-500 text-sm mt-2">📍 {profile.location}</p>}
          <button onClick={copyLink} className="btn-secondary mt-4 text-sm">
            🔗 Share Profile
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-3xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{profile.total_commits || 0}</p>
            <p className="text-xs text-surface-400">Total Commits</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{profile.longest_streak || 0}</p>
            <p className="text-xs text-surface-400">Longest Streak</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{profile.total_achievements || 0}</p>
            <p className="text-xs text-surface-400">Achievements</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{profile.top_language || '—'}</p>
            <p className="text-xs text-surface-400">Top Language</p>
          </div>
        </div>

        {/* Wellness chart */}
        {profile.wellness_history?.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Wellness History (30 days)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={profile.wellness_history.map(w => ({ date: w.score_date, score: parseFloat(w.score) }))}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #FF0000', borderRadius: 0, fontSize: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#FF0000" fill="#FF000033" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements?.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Achievements</h2>
            <div className="flex flex-wrap gap-3">
              {profile.achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2">
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-sm">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-surface-500">
            Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-xs text-surface-600 mt-2">Powered by DevPulse ⚡</p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
