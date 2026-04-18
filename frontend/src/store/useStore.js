import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // auth state
      token: null,
      user: null,

      // UI state
      sidebarOpen: true,
      darkMode: true,

      // sync state
      isSyncing: false,
      syncProgress: null,

      // actions
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setDarkMode: (dark) => {
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: dark });
      },
      toggleDarkMode: () => {
        const newMode = !get().darkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: newMode });
      },

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncProgress: (progress) => set({ syncProgress: progress }),
    }),
    {
      name: 'devpulse-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useStore;
