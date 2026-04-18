import React from 'react';

const AchievementCard = ({ achievement, earned = false }) => {
  return (
    <div className={`glass-card p-5 flex flex-col items-center text-center transition-all duration-300 ${
      earned
        ? 'border-primary-500/30 hover:border-primary-500/50 hover:-translate-y-1'
        : 'opacity-50 grayscale'
    }`}>
      <div className={`text-4xl mb-3 ${earned ? '' : 'filter brightness-50'}`}>
        {earned ? achievement.icon : '🔒'}
      </div>
      <h3 className="font-semibold text-sm mb-1">{achievement.name}</h3>
      <p className="text-xs text-surface-400 mb-2">{achievement.description}</p>
      <div className="flex items-center gap-2 mt-auto">
        <span className="badge badge-info">{achievement.points} pts</span>
        {earned && achievement.earned_at && (
          <span className="text-[10px] text-surface-500">
            {new Date(achievement.earned_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;
