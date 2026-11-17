import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * token is NO LONGER persisted to localStorage.
 * Auth is handled by the httpOnly cookie set by the backend.
 *
 * memoryToken is kept in runtime state (not persisted) so
 * useSocket can authenticate WebSocket connections without hitting localStorage.
 */
const useStore = create(
  persist(
    (set) => ({
      // auth state — token is memory-only, never persisted
      token: null,      // kept for legacy compat but excluded from partialize
      memoryToken: null, // used by useSocket for WS auth
      user: null,

      // UI state
      sidebarOpen: true,

      // sync state
      isSyncing: false,
      syncProgress: null,

      // actions
      setAuth: (token, user) => set({
        token: token || 'demo-token',
        memoryToken: token || 'demo-token',
        user: { ...user, onboarding_completed: user?.onboarding_completed ?? true },
      }),
      clearAuth: () => {
        try { localStorage.removeItem('devpulse_onboarded'); } catch {
          // A blocked storage API should not prevent logout.
        }
        set({ token: null, memoryToken: null, user: null });
      },
      updateUser: (updates) => set((state) => {
        const nextUser = { ...state.user, ...updates };
        if (updates.onboarding_completed !== undefined) {
          try {
            localStorage.setItem('devpulse_onboarded', updates.onboarding_completed ? 'true' : 'false');
          } catch {
            // The in-memory user state still records the preference.
          }
        }
        return { user: nextUser };
      }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),


      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncProgress: (progress) => set({ syncProgress: progress }),
    }),
    {
      name: 'devpulse-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useStore;
