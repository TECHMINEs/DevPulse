import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * CRIT-09: token is NO LONGER persisted to localStorage.
 * Auth is handled by the httpOnly cookie set by the backend.
 *
 * CRIT-13: memoryToken is kept in runtime state (not persisted) so
 * useSocket can authenticate WebSocket connections without hitting localStorage.
 */
const useStore = create(
  persist(
    (set) => ({
      // auth state — token is memory-only, never persisted
      token: null,      // kept for legacy compat but excluded from partialize
      memoryToken: null, // CRIT-13: used by useSocket for WS auth
      user: null,

      // UI state
      sidebarOpen: true,

      // sync state
      isSyncing: false,
      syncProgress: null,

      // actions
      setAuth: (token, user) => set({ token, memoryToken: token, user }),
      clearAuth: () => set({ token: null, memoryToken: null, user: null }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),


      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncProgress: (progress) => set({ syncProgress: progress }),
    }),
    {
      name: 'devpulse-store',
      partialize: (state) => ({
        // CRIT-09: token intentionally excluded — auth is via httpOnly cookie
        // CRIT-13: memoryToken intentionally excluded — runtime only, socket auth
        user: state.user,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useStore;
