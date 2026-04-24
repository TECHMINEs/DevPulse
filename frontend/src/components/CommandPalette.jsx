import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { name: 'Go to Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'View Repositories', path: '/repos', icon: '📂' },
    { name: 'View Achievements', path: '/achievements', icon: '🏆' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const filteredCommands = commands.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-[20vh] animate-fade-in" onClick={() => setIsOpen(false)}>
      <div className="bg-surface-900 border border-surface-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-surface-800">
          <input
            autoFocus
            type="text"
            className="w-full bg-transparent text-xl outline-none placeholder-surface-500"
            placeholder="Search commands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.path}
                onClick={() => handleSelect(cmd.path)}
                className="w-full text-left p-3 flex items-center gap-3 hover:bg-surface-800 rounded-lg transition-colors"
              >
                <span className="text-xl">{cmd.icon}</span>
                <span>{cmd.name}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-surface-500">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
