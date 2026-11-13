import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useStore from './store/useStore';
import client from './api/client';

// Static imports to prevent Safari ChunkLoadError
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Repos from './pages/Repos';
import RepoDetail from './pages/RepoDetail';
import Achievements from './pages/Achievements';
import Goals from './pages/Goals';
import TeamDashboard from './pages/TeamDashboard';
import PublicProfile from './pages/PublicProfile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import CommandPalette from './components/CommandPalette';
import NavigationProgress from './components/NavigationProgress';
import MobileNav from './components/MobileNav';

import { useEffect } from 'react';
import BrandBar from './components/brand/BrandBar';
import BrandFooter from './components/brand/BrandFooter';

// protected route wrapper
const ProtectedRoute = ({ children }) => {
  const user = useStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * CRIT-14: AdminRoute now verifies role server-side before rendering.
 * localStorage role is trivially spoofable; an API call confirms the actual role.
 */
const AdminRoute = ({ children }) => {
  const user = useStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminVerify'],
    queryFn: () => client.get('/api/admin/verify').then(r => r.data),
    retry: false,
    staleTime: 60_000,
    enabled: !!user && user.role === 'admin',
  });

  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }
  if (isError || !data?.verified) return <Navigate to="/dashboard" replace />;

  return children;
};

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // CRIT-12: use navigate() instead of window.location.href to avoid full
    // page reload which destroys the React query cache and component state.
    const handleUnauthorized = () => {
      useStore.getState().clearAuth();
      navigate('/login', { replace: true });
    };
    window.addEventListener('devpulse:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('devpulse:unauthorized', handleUnauthorized);
  }, [navigate]);

  return (
    <>
      <BrandBar project="DevPulse — Developer Intelligence" />

      <NavigationProgress />
      <MobileNav />
      <CommandPalette />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<AuthCallback />} />
        <Route path="/profile/:username" element={<PublicProfile />} />

        {/* Protected routes */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/repos" element={<ProtectedRoute><Repos /></ProtectedRoute>} />
        <Route path="/repos/:repoId" element={<ProtectedRoute><RepoDetail /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/team/:slug" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Admin route — CRIT-14: server-side role verified before rendering */}
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPanel /></AdminRoute></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {/* Bottom padding on mobile clears the fixed MobileNav tab bar */}
      <BrandFooter className="pb-20 lg:pb-4" />
    </>
  );
}

export default App;
