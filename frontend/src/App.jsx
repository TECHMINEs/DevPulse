import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';

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
  );
}

export default App;
