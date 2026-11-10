import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const commands = [
  { id: 'dash', label: 'Go to Dashboard', icon: '📊', path: '/dashboard', shortcut: 'G D' },
  { id: 'anal', label: 'View Analytics', icon: '📈', path: '/analytics', shortcut: 'G A' },
  { id: 'repo', label: 'Browse Repositories', icon: '📁', path: '/repos', shortcut: 'G R' },
  { id: 'team', label: 'Manage Teams', icon: '👥', path: '/teams', shortcut: 'G T' },
  { id: 'achv', label: 'View Achievements', icon: '🏆', path: '/achievements', shortcut: 'G C' },
  { id: 'sett', label: 'Account Settings', icon: '⚙️', path: '/settings', shortcut: 'G S' },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl glass-card border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <span className="text-xl">🔍</span>
              <input
                autoFocus
                className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder:text-surface-600"
                placeholder="Search commands or pages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="text-[10px] text-surface-500 bg-surface-800 px-1.5 py-0.5 rounded border border-white/5 font-mono">
                ESC
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.path)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary-500/10 hover:text-primary-400 text-surface-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cmd.icon}</span>
                      <span className="font-medium">{cmd.label}</span>
                    </div>
                    <div className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {cmd.shortcut}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-surface-500 italic text-sm">
                  No commands found matching &ldquo;{query}&rdquo;
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5 bg-white/5 flex items-center justify-between text-[10px] text-surface-600 uppercase tracking-widest font-bold">
              <span>Navigate with arrows</span>
              <span>Select with enter</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
