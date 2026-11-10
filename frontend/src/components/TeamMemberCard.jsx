import React from 'react';

const TeamMemberCard = ({ member }) => {
  const isHighRisk = member.risk_flag === 'high';
  
  return (
    <div className={`glass-card p-4 flex items-center justify-between group transition-all duration-300 hover:-translate-y-1 ${isHighRisk ? 'border-red-500/30 bg-red-500/5' : 'hover:border-primary-500/30'}`}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} 
            alt={member.username} 
            className="w-12 h-12 rounded-xl border border-white/10"
          />
          {isHighRisk && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-surface-900 animate-pulse" />
          )}
        </div>
        
        <div>
          <h4 className="font-bold text-white text-sm">
            {member.display_name || member.username}
          </h4>
          <p className="text-xs text-surface-400">@{member.username}</p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">
            {member.role}
          </span>
          {member.latest_score && (
            <span className={`text-sm font-black ${parseFloat(member.latest_score) >= 70 ? 'text-emerald-400' : isHighRisk ? 'text-red-400' : 'text-amber-400'}`}>
              {parseFloat(member.latest_score).toFixed(0)}
            </span>
          )}
        </div>
        <p className="text-[10px] text-surface-600">
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default TeamMemberCard;
