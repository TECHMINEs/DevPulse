import { useEffect } from 'react';
import useStore from '../store/useStore';

export const useDarkMode = () => {
  const { darkMode, toggleDarkMode, setDarkMode } = useStore();

  useEffect(() => {
    // initialize from store on mount
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return { darkMode, toggleDarkMode, setDarkMode };
};

export default useDarkMode;
