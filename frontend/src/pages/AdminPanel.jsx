import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import client from '../api/client';

const AdminPanel = () => {
  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => client.get('/api/admin/stats').then(r => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => client.get('/api/admin/users').then(r => r.data),
  });

  const { data: jobsData } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => client.get('/api/admin/sync-jobs').then(r => r.data),
  });

  const stats = statsData || {};
  const users = usersData?.users || [];
  const jobs = jobsData?.jobs || [];

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <h1 className="text-xl font-bold">🛡️ Admin Panel</h1>
          <p className="text-xs text-surface-500">Platform administration</p>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card glass-card">
              <p className="text-3xl font-bold gradient-text">{stats.users || 0}</p>
              <p className="text-xs text-surface-400">Total Users</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-3xl font-bold gradient-text">{stats.commits || 0}</p>
              <p className="text-xs text-surface-400">Total Commits</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-3xl font-bold gradient-text">{stats.active_today || 0}</p>
              <p className="text-xs text-surface-400">Active Today</p>
            </div>
            <div className="stat-card glass-card">
              <p className="text-3xl font-bold gradient-text">{stats.teams || 0}</p>
              <p className="text-xs text-surface-400">Teams</p>
            </div>
          </div>

          {/* System Health */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">System Health</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.services?.database === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.services?.redis === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-sm">Redis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.services?.ml?.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm">ML Service</span>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs text-surface-400 py-2 px-3">User</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Email</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Commits</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Role</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-surface-800 hover:bg-surface-800/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-7 h-7 rounded-full" />
                          <span className="text-sm">{u.username}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-surface-400">{u.email || '—'}</td>
                      <td className="py-3 px-3 text-xs">{u.commit_count}</td>
                      <td className="py-3 px-3"><span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-success'}`}>{u.role}</span></td>
                      <td className="py-3 px-3 text-xs text-surface-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent sync jobs */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-surface-300 mb-4">Recent Sync Jobs</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-700">
                    <th className="text-left text-xs text-surface-400 py-2 px-3">User</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Status</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Repos</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Commits</th>
                    <th className="text-left text-xs text-surface-400 py-2 px-3">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 20).map(j => (
                    <tr key={j.id} className="border-b border-surface-800">
                      <td className="py-2 px-3 text-sm">{j.username}</td>
                      <td className="py-2 px-3">
                        <span className={`badge ${j.status === 'completed' ? 'badge-success' : j.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">{j.repos_synced}</td>
                      <td className="py-2 px-3 text-xs">{j.commits_synced}</td>
                      <td className="py-2 px-3 text-xs text-surface-500">{j.started_at ? new Date(j.started_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
