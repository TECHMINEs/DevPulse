import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

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

  const API_URL = import.meta.env.VITE_API_URL || '';

  return (
    <div className="min-h-screen bg-surface-950 flex selection:bg-primary-500/30">
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
            <img src="/techmines-logo.jpg" alt="TECHMINES logo" className="w-24 h-24 object-cover border-2 border-[#FF0000] shadow-[0_0_24px_rgba(255,0,0,0.6)] mb-10 animate-float" />
            <h1 className="text-7xl font-black tracking-tighter mb-6 leading-none">
              Build <span className="gradient-text">Better.</span><br />
              Live <span className="text-white">Well.</span>
            </h1>
            <p className="text-xl text-surface-400 leading-relaxed mb-10">
              DevPulse analyzes your GitHub patterns to help you optimize productivity 
              without sacrificing mental health. Insights for humans, by AI.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Mental Wellness', 'Burnout Detection', 'Team Insights', 'PDF Reporting'].map(feat => (
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
              <img src="/techmines-logo.jpg" alt="TECHMINES logo" className="w-16 h-16 mx-auto object-cover border-2 border-[#FF0000] shadow-[0_0_18px_rgba(255,0,0,0.6)] mb-4" />
              <h1 className="text-4xl font-black text-white">DevPulse</h1>
            </div>

            <div className="glass-card p-10 border-t-white/20">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-surface-500">Sign in to access your developer intelligence.</p>
              </div>

              <div className="space-y-4">
                <a
                  href={`${API_URL}/auth/github`}
                  className="btn-primary w-full py-4 text-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </a>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-surface-600 leading-relaxed">
                  By connecting your account, you agree to our <br />
                  <span className="text-surface-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span> and <span className="text-surface-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-surface-600">
              Loved by <span className="text-white font-semibold">1,000+</span> developers worldwide.
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
