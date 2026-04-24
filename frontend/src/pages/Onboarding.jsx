import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import useStore from '../store/useStore';

const Onboarding = () => {
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const updateUser = useStore(s => s.updateUser);

  const handleSubmit = async () => {
    if (!focus) return;
    setLoading(true);
    try {
      await client.post('/api/user/onboarding', { focus });
      updateUser({ onboarding_completed: true, focus });
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding failed:', error);
      setLoading(false);
    }
  };

  const options = [
    { 
      id: 'balance', 
      title: 'Work/Life Balance', 
      icon: '🌿', 
      description: 'I want to maintain a healthy schedule and avoid burnout.' 
    },
    { 
      id: 'velocity', 
      title: 'Shipping Fast', 
      icon: '🚀', 
      description: 'I want to maximize my output and see my velocity grow.' 
    }
  ];

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      {/* subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">
            ⚡
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        </div>

        <p className="text-surface-400 mb-8 leading-relaxed">
          Let&apos;s personalize your DevPulse experience. What is your primary focus for this quarter?
        </p>
        
        <div className="space-y-4 mb-8">
          {options.map((opt) => (
            <div 
              key={opt.id}
              onClick={() => setFocus(opt.id)}
              className={`group block p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative ${
                focus === opt.id 
                  ? 'border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/10' 
                  : 'border-surface-800 bg-surface-900/50 hover:border-surface-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                  focus === opt.id ? 'bg-primary-500/20' : 'bg-surface-800 group-hover:bg-surface-700'
                }`}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-bold text-lg mb-0.5 ${focus === opt.id ? 'text-white' : 'text-surface-200'}`}>
                    {opt.title}
                  </div>
                  <div className="text-sm text-surface-400 leading-snug">
                    {opt.description}
                  </div>
                </div>
                {focus === opt.id && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center animate-scale-in">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!focus || loading}
          className="btn-primary w-full py-4 text-lg disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up your dashboard...
              </>
            ) : (
              <>
                Get Started
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </>
            )}
          </span>
        </button>
        
        <p className="text-center text-[10px] text-surface-600 mt-6 tracking-widest uppercase">
          DevPulse Security Layer v1.0.4
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
