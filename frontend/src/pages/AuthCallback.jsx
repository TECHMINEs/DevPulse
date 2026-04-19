import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../store/useStore';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const setAuth = useStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // decode JWT to get basic user info
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        const payload = JSON.parse(window.atob(base64 + padding));

        setAuth(token, {
          id: payload.userId,
          username: payload.username,
          role: payload.role,
        });
        navigate('/dashboard');
      } catch (e) {
        console.error('Failed to parse token', e);
        navigate('/login?error=invalid_token');
      }
    } else {
      navigate('/login?error=no_token');
    }
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        <p className="text-surface-400">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
