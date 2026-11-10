import React from 'react';
import SparkLine from './SparkLine';
import { useNavigate } from 'react-router-dom';

const RepoCard = ({ repo }) => {
  const navigate = useNavigate();
  const healthColor = repo.night_pct > 0.3 ? '#ef4444' : repo.night_pct > 0.15 ? '#f59e0b' : '#39FF14';

  return (
    <div
      className="glass-card-hover p-5 cursor-pointer"
      onClick={() => navigate(`/repos/${repo.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: healthColor }} />
            <h3 className="font-semibold text-sm truncate">{repo.name}</h3>
          </div>
          {repo.description && (
            <p className="text-xs text-surface-400 mt-1 line-clamp-2">{repo.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {repo.language && (
          <span className="badge badge-info">{repo.language}</span>
        )}
        {repo.stars > 0 && (
          <span className="text-xs text-surface-400">⭐ {repo.stars}</span>
        )}
        <span className="text-xs text-surface-400">{repo.commit_count || 0} commits</span>
      </div>

      <div className="flex items-center justify-between">
        <SparkLine
          data={(repo.velocity || []).map(v => ({ count: parseInt(v.count) || parseInt(v.commits) || 0 }))}
          color="#FF0000"
          width={100}
          height={28}
        />
        <div className="text-right">
          <p className="text-xs text-surface-400">
            {repo.night_pct ? `${(parseFloat(repo.night_pct) * 100).toFixed(0)}% night` : ''}
          </p>
          {repo.last_commit_at && (
            <p className="text-[10px] text-surface-500">
              Last: {new Date(repo.last_commit_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
