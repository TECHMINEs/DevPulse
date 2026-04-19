import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Sidebar from '../components/Sidebar';
import TeamMemberCard from '../components/TeamMemberCard';
import { getTeam, getLeaderboard } from '../api/teams';

const TeamDashboard = () => {
  const { slug } = useParams();
  const { data: teamData } = useQuery({ queryKey: ['team', slug], queryFn: () => getTeam(slug) });
  const { data: leaderboardData } = useQuery({ queryKey: ['leaderboard', slug], queryFn: () => getLeaderboard(slug) });

  const team = teamData?.team;
  const members = teamData?.members || [];
  const aggregateWellness = (teamData?.aggregate_wellness || []).map(d => ({
    date: d.score_date,
    score: parseFloat(d.avg_score),
  }));
  const leaderboard = leaderboardData?.leaderboard || [];

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{team?.name || 'Team'}</h1>
              <p className="text-xs text-surface-500">{team?.description || ''} · {members.length} members</p>
            </div>
            <button className="btn-secondary text-sm">📧 Invite Member</button>
          </div>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Team wellness timeline */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Team Wellness (30 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aggregateWellness}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#ff0033" strokeWidth={2} dot={false} name="Team Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((member, i) => (
                <TeamMemberCard key={member.username} member={member} rank={i + 1} />
              ))}
            </div>
            {leaderboard.length === 0 && (
              <p className="text-center text-surface-500 py-4">No leaderboard data yet</p>
            )}
          </div>

          {/* At risk members */}
          {members.filter(m => m.risk_flag === 'high').length > 0 && (
            <div className="glass-card p-6 border-red-500/20">
              <h2 className="text-sm font-semibold text-red-400 mb-4">⚠️ At Risk Members</h2>
              <div className="space-y-2">
                {members.filter(m => m.risk_flag === 'high').map(m => (
                  <div key={m.id} className="flex items-center gap-3 bg-red-500/5 rounded-lg p-3">
                    <img src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-sm">{m.display_name || m.username}</span>
                    <span className="badge badge-danger ml-auto">Score: {parseFloat(m.latest_score).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamDashboard;
