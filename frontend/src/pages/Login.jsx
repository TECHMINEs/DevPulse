import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Login = () => {
  const token = useStore((s) => s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  // generate random code rain characters
  const codeChars = useMemo(() => {
    const chars = 'const let var function return if else for while class import export async await fetch promise resolve reject console.log useState useEffect'.split(' ');
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: Math.random() * 100,
      animDuration: 5 + Math.random() * 10,
      animDelay: Math.random() * 10,
      opacity: 0.05 + Math.random() * 0.15,
    }));
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || '';

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left side — code rain animation */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-surface-900">
        {/* code rain background */}
        {codeChars.map((c) => (
          <div
            key={c.id}
            className="code-rain-char"
            style={{
              left: `${c.left}%`,
              animationDuration: `${c.animDuration}s`,
              animationDelay: `${c.animDelay}s`,
              opacity: c.opacity,
              fontSize: `${10 + Math.random() * 6}px`,
            }}
          >
            {c.char}
          </div>
        ))}

        {/* Logo overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-primary-500/30 mb-8">
            ⚡
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4">DevPulse</h1>
          <p className="text-xl text-surface-400 text-center max-w-md leading-relaxed">
            Deep analytics on your coding behavior, wellness scoring, and AI-powered insights.
          </p>

          {/* feature badges */}
          <div className="flex flex-wrap gap-2 mt-8 justify-center">
            {['Real-time Sync', 'ML Scoring', 'Team Mode', 'Achievements', 'PDF Reports'].map((feat) => (
              <span key={feat} className="badge bg-surface-800/60 text-surface-300 border border-surface-700">
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — login card */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl shadow-2xl shadow-primary-500/30 mb-4">
              ⚡
            </div>
            <h1 className="text-3xl font-bold gradient-text">DevPulse</h1>
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
              <p className="text-surface-400 text-sm">Your GitHub. Understood.</p>
            </div>

            {/* GitHub OAuth button */}
            <a
              href={`${API_URL}/auth/github`}
              className="w-full flex items-center justify-center gap-3 bg-surface-800 hover:bg-surface-700 border border-surface-600 hover:border-surface-500 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 mb-4 group"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Sign in with GitHub</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </a>

            {/* GitLab button */}
            <a
              href={`${API_URL}/auth/gitlab`}
              className="w-full flex items-center justify-center gap-3 bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700 text-surface-300 hover:text-white font-medium px-6 py-4 rounded-xl transition-all duration-200 mb-6"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z"/>
              </svg>
              <span>Sign in with GitLab</span>
              <span className="text-xs badge badge-warning ml-2">Beta</span>
            </a>

            <p className="text-xs text-surface-500 text-center leading-relaxed">
              By signing in you agree to our privacy policy. We only request read access to your public repos.
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-surface-600 mt-6">
            Built with ❤️ for developers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
