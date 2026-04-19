import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';

// lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Repos = lazy(() => import('./pages/Repos'));
const RepoDetail = lazy(() => import('./pages/RepoDetail'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Goals = lazy(() => import('./pages/Goals'));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// loading spinner component
const LoadingScreen = () => (
  <div className="min-h-screen bg-surface-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-surface-700 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
      </div>
      <p className="text-surface-400 text-sm animate-pulse">Loading DevPulse...</p>
    </div>
  </div>
);

// protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = useStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// admin route wrapper
const AdminRoute = ({ children }) => {
  const user = useStore((s) => s.user);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<AuthCallback />} />
        <Route path="/profile/:username" element={<PublicProfile />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/repos" element={<ProtectedRoute><Repos /></ProtectedRoute>} />
        <Route path="/repos/:repoId" element={<ProtectedRoute><RepoDetail /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/team/:slug" element={<ProtectedRoute><TeamDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Admin route */}
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminPanel /></AdminRoute></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
