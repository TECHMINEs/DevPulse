import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import GoalCard from '../components/GoalCard';
import { getGoals, createGoal, deleteGoal } from '../api/analytics';
import toast from 'react-hot-toast';
import SkeletonBox from '../components/SkeletonBox';

const Goals = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['goals'], queryFn: getGoals });
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [form, setForm] = useState({
    title: '', goal_type: 'daily_commits', target_value: '', start_date: '', end_date: '',
  });

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      setShowForm(false);
      setForm({ title: '', goal_type: 'daily_commits', target_value: '', start_date: '', end_date: '' });
      toast.success('Goal created!');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create goal'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('Goal deleted');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const active = data?.active || [];
  const completed = data?.completed || [];
  const stats = data?.stats || {};

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Goals</h1>
              <p className="text-xs text-surface-500">{stats.completionRate || 0}% completion rate</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
              {showForm ? '✕ Cancel' : '+ New Goal'}
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonBox h="150px" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonBox h="120px" /><SkeletonBox h="120px" />
              </div>
            </div>
          ) : (
            <>
          {/* Create goal form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="glass-card p-6 animate-slide-up">
              <h3 className="font-semibold mb-4">Create New Goal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Goal title..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  required
                />
                <select
                  value={form.goal_type}
                  onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
                  className="input-field"
                >
                  <option value="daily_commits">Daily Commits</option>
                  <option value="weekly_commits">Weekly Commits</option>
                  <option value="wellness_score">Wellness Score</option>
                  <option value="no_night_commits">No Night Commits Streak</option>
                </select>
                <input
                  type="number"
                  placeholder="Target value"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                  className="input-field"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary mt-4 text-sm" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          )}

          {/* Active goals */}
          <div>
            <h2 className="text-sm font-semibold text-surface-300 mb-3">Active Goals ({active.length})</h2>
            {active.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center">
                <span className="text-6xl mb-4 drop-shadow-2xl">🎯</span>
                <h3 className="text-xl font-bold text-surface-200 mb-2">No active goals</h3>
                <p className="text-surface-400 max-w-sm mb-6">Create a goal to start tracking your progress and improve your developer wellness.</p>
                <button className="btn-primary" onClick={() => setShowForm(true)}>+ Create Your First Goal</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onDelete={(id) => deleteMutation.mutate(id)} />
                ))}
              </div>
            )}
          </div>

          {/* Completed goals */}
          {completed.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="text-sm font-semibold text-surface-400 hover:text-surface-200 flex items-center gap-2 mb-3"
              >
                <span className={`transition-transform ${showCompleted ? 'rotate-90' : ''}`}>▶</span>
                Completed Goals ({completed.length})
              </button>
              {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completed.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Goals;
