import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import RepoCard from '../components/RepoCard';
import EmptyState from '../components/EmptyState';
import { getRepos } from '../api/repos';

const Repos = () => {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [sortBy, setSortBy] = useState('activity');

  const { data, isLoading } = useQuery({ queryKey: ['repos'], queryFn: getRepos });
  const repos = data?.repos || [];

  // get unique languages
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];

  // filter and sort
  let filtered = repos
    .filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    .filter(r => langFilter === 'all' || r.language === langFilter);

  if (sortBy === 'activity') {
    filtered.sort((a, b) => (b.weekly_commits || 0) - (a.weekly_commits || 0));
  } else if (sortBy === 'commits') {
    filtered.sort((a, b) => (b.commit_count || 0) - (a.commit_count || 0));
  } else if (sortBy === 'health') {
    filtered.sort((a, b) => (parseFloat(b.night_pct) || 0) - (parseFloat(a.night_pct) || 0));
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-11 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-line px-6 py-4">
          <h1 className="text-xl font-bold">Repositories</h1>
          <p className="text-xs text-surface-500">{repos.length} repositories tracked</p>
        </header>

        <div className="p-6 animate-fade-in">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              placeholder="Search repos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field flex-1 min-w-[200px]"
            />
            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="input-field">
              <option value="all">All Languages</option>
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
              <option value="activity">Most Active</option>
              <option value="commits">Most Commits</option>
              <option value="health">Worst Health</option>
            </select>
          </div>

          {/* Repo grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="h-4 bg-surface-700 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-surface-700 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-surface-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="mt-8">
              <EmptyState 
                title="No repositories found"
                description={search || langFilter !== 'all' 
                  ? "We couldn't find any repositories matching your criteria. Try adjusting your filters." 
                  : "You haven't synced any repositories yet. Connect your GitHub account to get started."}
                actionLabel={search || langFilter !== 'all' ? "Clear Filters" : "Sync Now"}
                onAction={() => {
                  if (search || langFilter !== 'all') {
                    setSearch('');
                    setLangFilter('all');
                  } else {
                    // navigate to dashboard to sync or trigger sync here
                    window.dispatchEvent(new CustomEvent('devpulse:trigger-sync'));
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Repos;
