import React from 'react';
import useDarkMode from '../hooks/useDarkMode';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="w-10 h-10 rounded-xl bg-surface-800 hover:bg-surface-700 flex items-center justify-center transition-all duration-300 border border-surface-700"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={`text-lg transition-transform duration-300 ${darkMode ? 'rotate-0' : 'rotate-180'}`}>
        {darkMode ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
