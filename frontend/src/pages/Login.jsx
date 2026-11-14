import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getDemoUser } from '../data/demoMock';
import { isStaticDemo } from '../api/client';

const Login = () => {
  const token = useStore((s) => s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const codeChars = useMemo(() => {
    const chars = 'const let var function return if else for while class import export async await fetch promise resolve reject console.log useState useEffect'.split(' ');
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      char: chars[Math.floor(Math.random() * chars.length)],
      left: Math.random() * 100,
      animDuration: 8 + Math.random() * 15,
      animDelay: Math.random() * -20,
      opacity: 0.03 + Math.random() * 0.1,
      fontSize: `${10 + Math.random() * 8}px`,
    }));
  }, []);

  const base = import.meta.env.BASE_URL || '/';
  const API_URL = import.meta.env.VITE_API_URL || '';

  return (
    <div className="min-h-screen flex selection:bg-primary-500/30">
      {/* Animated Background Layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-800/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
        
        {codeChars.map((c) => (
          <div
            key={c.id}
            className="absolute font-mono whitespace-nowrap text-primary-500/15"
            style={{
              left: `${c.left}%`,
              top: '-20px',
              animation: `codeRainFall ${c.animDuration}s linear infinite`,
              animationDelay: `${c.animDelay}s`,
              opacity: c.opacity,
              fontSize: c.fontSize,
            }}
          >
            {c.char}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row">
        {/* Branding Section */}
        <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12">
          <div className="max-w-xl">
            <img src={`${base}logo-mark.svg`} alt="DevPulse logo" width={96} height={96} className="w-24 h-24 mb-10 animate-float" />
            <h1 className="text-7xl font-black tracking-tighter mb-6 leading-none">
              Build <span className="gradient-text">Better.</span><br />
              Live <span className="text-white">Well.</span>
            </h1>
            <p className="text-xl text-surface-400 leading-relaxed mb-10">
              DevPulse analyzes your GitHub patterns to help you optimize productivity 
              without sacrificing mental health. Insights for humans, by AI.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Mental Wellness', 'Work Pattern Analysis', 'Team Insights', 'PDF Reporting'].map(feat => (
                <span key={feat} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-surface-300">
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-10">
              <img src={`${base}logo-mark.svg`} alt="DevPulse logo" width={64} height={64} className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl font-black text-white">DevPulse</h1>
            </div>

            <div className="glass-card p-10 border-t-white/20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-surface-500">Sign in to access your developer intelligence.</p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!isStaticDemo) {
                      window.location.assign(`${API_URL}/auth/github`);
                      return;
                    }
                    const demoUser = getDemoUser();
                    useStore.getState().setAuth('demo-token', demoUser);
                    navigate(isStaticDemo && !demoUser.onboarding_completed ? '/onboarding' : '/dashboard');
                  }}
                  className="btn-primary w-full py-4 text-base font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary-500/20"
                >
                  <span>{isStaticDemo ? '✦ Explore Interactive Browser Demo' : 'Connect with GitHub'}</span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-surface-600 leading-relaxed">
                  {isStaticDemo ? 'Illustrative developer data generated for this browser demo.' : 'Connect your GitHub account to analyze your activity.'}<br />
                  {isStaticDemo && <span className="text-surface-400">No GitHub connection, live sync, or server analysis.</span>}
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-surface-600">
              An open-source project by <span className="text-white font-semibold">TECHMINES</span>.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes codeRainFall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default Login;
