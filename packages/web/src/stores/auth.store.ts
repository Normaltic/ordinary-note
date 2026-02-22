import { create } from 'zustand';
import type { AuthUser } from '@ordinary-note/shared';
import { auth } from '../lib/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: auth.getUser(),
  isAuthenticated: !!(auth.getUser() && auth.getAccessToken()),

  setAuth: (user, accessToken) => {
    auth.setUser(user);
    auth.setAccessToken(accessToken);
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    auth.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
