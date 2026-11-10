import React from 'react';
import { NavLink } from 'react-router-dom';
import useStore from '../store/useStore';

const mobileNavItems = [
  { path: '/dashboard',    label: 'Home',     icon: '📊' },
  { path: '/analytics',   label: 'Insights', icon: '📈' },
  { path: '/repos',       label: 'Repos',    icon: '📁' },
  { path: '/achievements',label: 'Badges',   icon: '🏆' },
  { path: '/goals',       label: 'Goals',    icon: '🎯' },
];

/**
 * MobileNav — fixed bottom navigation bar, only visible on small screens (< lg).
 * Mirrors the most-used Sidebar routes so the app is fully usable on mobile
 * without the sidebar taking up precious viewport space.
 */
const MobileNav = () => {
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  return (
  <nav
    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
      bg-surface-900/95 backdrop-blur-xl border-t border-surface-800
      flex items-center justify-around px-2 pb-safe"
    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
  >
    {mobileNavItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px]
          ${isActive
            ? 'text-primary-400 bg-primary-500/10'
            : 'text-surface-500 hover:text-surface-300'
          }`
        }
      >
        <span className="text-xl leading-none">{item.icon}</span>
        <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
      </NavLink>
    ))}
    {/* Opens the full sidebar drawer: Teams, Settings, Logout */}
    <button
      type="button"
      onClick={toggleSidebar}
      className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[52px] text-surface-500 hover:text-surface-300 transition-all duration-200"
      aria-label="Open menu"
    >
      <span className="text-xl leading-none">☰</span>
      <span className="text-[10px] font-semibold tracking-wide">More</span>
    </button>
  </nav>
  );
};

export default MobileNav;
