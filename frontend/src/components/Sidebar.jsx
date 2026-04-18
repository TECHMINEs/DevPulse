import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getScoreColor } from '../utils/scoreUtils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/repos', label: 'Repositories', icon: '📁' },
  { path: '/achievements', label: 'Achievements', icon: '🏆' },
  { path: '/goals', label: 'Goals', icon: '🎯' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = () => {
  const user = useStore((s) => s.user);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useNavigate();

  return (
    <>
      {/* mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen bg-surface-900/95 backdrop-blur-xl
        border-r border-surface-800 flex flex-col transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'}
        lg:relative lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-surface-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            ⚡
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg gradient-text">DevPulse</h1>
              <p className="text-xs text-surface-500">Your GitHub. Understood.</p>
            </div>
          )}
        </div>

        {/* User info */}
        {user && (
          <div className={`px-4 py-4 border-b border-surface-800 ${sidebarOpen ? '' : 'flex justify-center'}`}>
            <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'flex-col'}`}>
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                alt={user.username}
                className="w-10 h-10 rounded-full border-2 border-surface-700 flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="min-w-0 animate-fade-in">
                  <p className="text-sm font-medium truncate">{user.display_name || user.username}</p>
                  <p className="text-xs text-surface-500">@{user.username}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-3'}`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm animate-fade-in">{item.label}</span>}
            </NavLink>
          ))}

          {/* Admin link — only show for admins */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-3'}`
              }
            >
              <span className="text-lg flex-shrink-0">🛡️</span>
              {sidebarOpen && <span className="text-sm animate-fade-in">Admin</span>}
            </NavLink>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-surface-800">
          <button
            onClick={toggleSidebar}
            className="btn-ghost w-full flex items-center justify-center gap-2"
          >
            <span className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
              ◀
            </span>
            {sidebarOpen && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
