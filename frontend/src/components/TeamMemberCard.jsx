import React from 'react';

const TeamMemberCard = ({ member, rank }) => {
  const scoreColor = member.latest_score >= 70 ? 'text-emerald-400' : member.latest_score >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="text-lg font-bold text-surface-500 w-8 text-center">#{rank}</div>
      <img
        src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
        alt={member.username}
        className="w-10 h-10 rounded-full border-2 border-surface-700"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{member.display_name || member.username}</p>
        <p className="text-xs text-surface-500">@{member.username}</p>
      </div>
      <div className="text-right">
        <p className={`text-lg font-bold ${scoreColor}`}>
          {member.latest_score ? parseFloat(member.latest_score).toFixed(0) : '—'}
        </p>
        <p className="text-[10px] text-surface-500">wellness</p>
      </div>
    </div>
  );
};

export default TeamMemberCard;
