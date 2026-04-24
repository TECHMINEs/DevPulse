import React from 'react';
import useStore from '../store/useStore';

const SyncProgressModal = () => {
  const isSyncing = useStore((s) => s.isSyncing);
  const syncProgress = useStore((s) => s.syncProgress);

  if (!isSyncing || !syncProgress) return null;

  const progress = syncProgress.totalRepos
    ? Math.round((syncProgress.reposScanned || 0) / syncProgress.totalRepos * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in">
      <div className="glass-card p-8 max-w-md w-full mx-4 animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="w-16 h-16 border-4 border-surface-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
          </div>
          <h2 className="text-xl font-bold mb-1">Syncing your data</h2>
          <p className="text-sm text-surface-400">{syncProgress.message || 'Starting...'}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-surface-400 mb-2">
            <span>
              {syncProgress.reposScanned || 0} / {syncProgress.totalRepos || '?'} repositories
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(10, progress)}%` }}
            />
          </div>
        </div>

        {/* Current repo */}
        {syncProgress.currentRepo && (
          <div className="text-center">
            <p className="text-xs text-surface-500">Currently scanning:</p>
            <p className="text-sm font-mono text-primary-400">{syncProgress.currentRepo}</p>
          </div>
        )}

        {/* Commits found */}
        {syncProgress.commitsFound > 0 && (
          <div className="text-center mt-3">
            <p className="text-xs text-surface-500">
              Found <span className="text-emerald-400 font-semibold">{syncProgress.commitsFound}</span> commits so far
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncProgressModal;
