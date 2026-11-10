import React from 'react';

const GoalCard = ({ goal, onDelete }) => {
  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
  const isOverdue = daysLeft === 0 && !goal.is_completed;

  return (
    <div className={`glass-card p-5 ${goal.is_completed ? 'border-emerald-500/30' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{goal.title}</h3>
          <span className="badge badge-info text-[10px] mt-1">{goal.goal_type.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex gap-1">
          {!goal.is_completed && (
            <button
              onClick={() => onDelete?.(goal.id)}
              className="text-surface-500 hover:text-red-400 text-sm transition-colors"
              title="Delete goal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-surface-400 mb-1">
          <span>{goal.current_value} / {goal.target_value}</span>
          <span>{Math.min(100, Math.round(progress))}%</span>
        </div>
        <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goal.is_completed
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-primary-500 to-primary-400'
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-surface-500">
        {goal.is_completed ? (
          <span className="text-emerald-400">✅ Completed</span>
        ) : isOverdue ? (
          <span className="text-red-400">⚠️ Overdue</span>
        ) : (
          <span>{daysLeft} days remaining</span>
        )}
        <span>{new Date(goal.start_date).toLocaleDateString()} → {new Date(goal.end_date).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default GoalCard;
