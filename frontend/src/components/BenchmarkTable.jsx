import React from 'react';

const BenchmarkTable = ({ data = [], currentUser = null }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-surface-500 text-[10px] uppercase tracking-widest">
            <th className="px-4 py-2">Rank</th>
            <th className="px-4 py-2">Developer</th>
            <th className="px-4 py-2 text-right">Avg Score</th>
            <th className="px-4 py-2 text-right">Commits</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const isMe = currentUser && row.username === currentUser.username;
            return (
              <tr 
                key={row.username || i}
                className={`group transition-all duration-300 ${isMe ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}
              >
                <td className="px-4 py-3 rounded-l-xl text-sm font-mono text-surface-400">
                  #{i + 1}
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-800 border border-white/10 overflow-hidden">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt={row.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isMe ? 'text-primary-400' : 'text-surface-200'}`}>
                      {row.display_name || row.username}
                    </p>
                    {isMe && <span className="text-[10px] bg-primary-500 text-white px-1.5 rounded">YOU</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-bold ${parseFloat(row.avg_score) >= 70 ? 'text-green-400' : parseFloat(row.avg_score) >= 40 ? 'text-white' : 'text-red-400'}`}>
                    {row.avg_score}
                  </span>
                </td>
                <td className="px-4 py-3 text-right rounded-r-xl font-mono text-xs text-surface-500">
                  {row.commits_count || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BenchmarkTable;
