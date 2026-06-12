import { create } from 'zustand';
import { authApi } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      const res = await authApi.getMe();
      set({ user: res.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    set({ user: res.data.user });
  },

  register: async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    set({ user: res.data.user });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));

export default useAuthStore;
