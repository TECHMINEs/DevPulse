import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import client from '../api/client';

// The backend has already set the httpOnly session cookie; fetch the user from
// /auth/me and continue to the dashboard. No token ever travels in the URL.
const AuthCallback = () => {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  useEffect(() => {
    const finish = async () => {
      try {
        const response = await client.get('/auth/me');
        setAuth(null, response.data.user); // token is in httpOnly cookie
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Auth callback failed:', error);
        navigate('/login?error=auth_failed', { replace: true });
      }
    };
    finish();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
        <p className="text-surface-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
