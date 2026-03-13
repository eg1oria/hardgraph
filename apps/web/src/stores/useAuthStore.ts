import { create } from 'zustand';
import { setToken, removeToken } from '@/lib/auth';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUsername?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  plan?: string;
  role?: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    setToken(token);
    set({ user, token, isAuthenticated: true });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
    // Use window.location for clean navigation reset (clears all client state)
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
}));
