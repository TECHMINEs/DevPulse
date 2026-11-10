import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/repos', label: 'Repositories', icon: '📁' },
  { path: '/achievements', label: 'Achievements', icon: '🏆' },
  { path: '/goals', label: 'Goals', icon: '🎯' },
  { path: '/team/default', label: 'Teams', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = () => {
  const user = useStore((s) => s.user);
  const clearAuth = useStore((s) => s.clearAuth);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  // Below lg the sidebar is an off-canvas drawer: start closed, close after navigating
  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
  useEffect(() => {
    if (isMobile()) setSidebarOpen(false);
  }, [setSidebarOpen]);
  const closeOnMobile = () => {
    if (isMobile()) setSidebarOpen(false);
  };
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (_) {
      // best-effort
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden rounded-none"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-11 left-0 z-50 h-[calc(100dvh-2.75rem)] bg-[#000000]
        border-r border-red-900/50 flex flex-col transition-all duration-300 ease-in-out rounded-none
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-11 lg:z-auto
      `}>
        {/* Brand Header with TECHMINES Plasma Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-red-900/40 bg-black">
          <div className="w-10 h-10 bg-black border border-[#FF0000] flex items-center justify-center p-1 shadow-[0_0_12px_rgba(255,0,0,0.5)] flex-shrink-0">
            <img src="/techmines-logo.jpg" alt="TECHMINES logo" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider text-white uppercase font-mono">Dev<span className="text-[#FF0000]">Pulse</span></span>
                <span className="bg-[#FF0000] text-black text-[9px] font-black px-1 py-0.5 tracking-widest uppercase">PLASMA</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight">Intelligence Engine</span>
            </motion.div>
          )}
        </div>

        {/* User Profile Summary */}
        <div className={`p-3 border-b border-red-950/40 bg-neutral-950/60 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center gap-3 p-2 bg-black border border-red-900/30 ${sidebarOpen ? '' : 'w-12 h-12 justify-center'}`}>
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'dev'}`}
              alt={user?.username}
              className="w-8 h-8 rounded-none border border-red-600/40 object-cover"
            />
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate font-mono">{user?.display_name || user?.username || 'Engineer'}</p>
                <p className="text-[10px] text-[#00FFFF] truncate font-mono">@{user?.username || 'techmine'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `nav-item group ${isActive ? 'active' : ''} ${sidebarOpen ? '' : 'justify-center px-0'}`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-xs font-bold tracking-wider uppercase font-mono">{item.label}</span>}
              {!sidebarOpen && (
                <div className="absolute left-16 px-2 py-1 bg-black border border-red-600 text-white text-[10px] uppercase font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-red-950/60 bg-black space-y-2">
          {/* Quick Nav Hint */}
          {sidebarOpen && (
            <div className="px-2.5 py-1.5 bg-neutral-950 border border-red-900/30 text-[10px] text-neutral-400 font-mono flex items-center justify-between">
              <span>PALETTE</span>
              <span className="font-mono bg-red-950/40 text-red-400 border border-red-800/50 px-1">⌘K</span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-transparent hover:border-red-600/50 transition-all font-mono text-xs uppercase ${sidebarOpen ? '' : 'justify-center'}`}
          >
            <span>↩</span>
            {sidebarOpen && <span className="font-bold">Logout</span>}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center h-8 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 border border-transparent hover:border-red-900/50 transition-all"
            aria-label="Toggle Sidebar"
          >
            <span className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
              ◀
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
