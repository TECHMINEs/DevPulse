import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import AchievementCard from '../components/AchievementCard';
import { getAchievements } from '../api/analytics';

const categories = ['All', 'onboarding', 'pattern', 'streak', 'wellness', 'volume', 'diversity', 'social'];

const Achievements = () => {
  const [activeTab, setActiveTab] = useState('All');
  const { data } = useQuery({ queryKey: ['achievements'], queryFn: getAchievements });

  const achievements = data?.achievements || [];
  const totalPoints = data?.totalPoints || 0;

  const filtered = activeTab === 'All'
    ? achievements
    : achievements.filter(a => a.category === activeTab);

  const earned = achievements.filter(a => a.earned_at);

  return (
    <div className="flex min-h-screen bg-surface-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-xl border-b border-surface-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Achievements</h1>
              <p className="text-xs text-surface-500">{earned.length} / {achievements.length} unlocked</p>
            </div>
            <div className="glass-card px-5 py-2 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-lg font-bold gradient-text">{totalPoints}</p>
                <p className="text-[10px] text-surface-500">Total Points</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 animate-fade-in">
          {/* Category tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === cat
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-surface-800 text-surface-400 hover:text-surface-200 border border-transparent'
                }`}
              >
                {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Achievement grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(a => (
              <AchievementCard key={a.id || a.slug} achievement={a} earned={!!a.earned_at} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl">🔒</span>
              <p className="text-surface-400 mt-4">No achievements in this category yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Achievements;
