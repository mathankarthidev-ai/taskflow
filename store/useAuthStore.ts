import { create } from 'zustand';
import { User } from '@/types';
import { getUserByEmailAction } from '@/actions/userActions';

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,

  login: async (email: string) => {
    set({ isLoading: true });
    try {
      const user = await getUserByEmailAction(email);
      if (user) {
        set({ currentUser: user, isLoading: false });
        if (typeof window !== 'undefined') {
          localStorage.setItem('taskflow_user_email', email);
          document.cookie = `taskflow_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=864000`;
        }
        return true;
      }
    } catch (e) {
      console.error('Login failed:', e);
    }
    set({ isLoading: false });
    return false;
  },

  logout: () => {
    set({ currentUser: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskflow_user_email');
      document.cookie = 'taskflow_user=; path=/; max-age=0';
    }
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },
}));
