import React from 'react';
import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, isUnlocked }) => {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-500
        ${isUnlocked 
          ? 'bg-gradient-to-br from-surface-900 to-surface-800 border-primary-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
          : 'bg-surface-900/40 border-white/5 opacity-60 grayscale'
        }
      `}
    >
      {/* Background glow for unlocked */}
      {isUnlocked && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 blur-[40px] rounded-full pointer-events-none" />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`text-4xl filter drop-shadow-lg ${isUnlocked ? 'animate-float' : ''}`}>
          {achievement.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-surface-400'}`}>
              {achievement.name}
            </h4>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border 
              ${isUnlocked ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-surface-800 text-surface-500 border-surface-700'}`}>
              {achievement.points} pts
            </span>
          </div>
          
          <p className="text-xs text-surface-400 leading-relaxed">
            {achievement.description}
          </p>
          
          {isUnlocked && achievement.earned_at && (
            <p className="mt-3 text-[10px] text-primary-400/60 font-medium">
              Unlocked {new Date(achievement.earned_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementCard;
