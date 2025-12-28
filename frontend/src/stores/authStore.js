import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(persist((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  isFetchingUser: false,

  setHasHydrated: (value) => set({ hasHydrated: value }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true, user: data.user };
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: e.response?.data?.error || 'Erreur' };
    }
  },

  register: async (email, password, name, language) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/register', { email, password, name, language });
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true, user: data.user };
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: e.response?.data?.error || 'Erreur' };
    }
  },

  logout: () => {
    try { localStorage.removeItem('faketect-auth'); } catch {}
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (data) => set((s) => ({ user: { ...s.user, ...data } })),

  fetchUser: async () => {
    set({ isFetchingUser: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isFetchingUser: false });
    } catch {
      set({ isFetchingUser: false });
      get().logout();
    }
  }
}), {
  name: 'faketect-auth',
  partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
  onRehydrateStorage: () => (state, error) => {
    // Never block the UI on hydration: even if storage fails, we should render.
    state?.setHasHydrated?.(true);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('Auth store hydration error:', error);
    }
  }
}));

export default useAuthStore;
