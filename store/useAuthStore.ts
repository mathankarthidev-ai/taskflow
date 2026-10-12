import { create } from 'zustand';
import { User } from '@/types';
import { getUserByEmailAction } from '@/actions/userActions';
import { getCustomUserAvatar } from '@/lib/avatar-store';

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
        const customAvatar = getCustomUserAvatar({
          userId: user._id,
          email: user.email,
          name: user.name,
          fallbackSrc: user.avatar,
        });
        const mergedUser: User = {
          ...user,
          avatar: customAvatar || user.avatar,
        };
        set({ currentUser: mergedUser, isLoading: false });
        if (typeof window !== 'undefined') {
          localStorage.setItem('taskflow_user_email', email);
          // Avoid storing huge base64 strings inside cookie; keep lightweight user in cookie
          const cookieUser = { ...mergedUser, avatar: user.avatar };
          document.cookie = `taskflow_user=${encodeURIComponent(JSON.stringify(cookieUser))}; path=/; max-age=864000`;
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
    if (user) {
      const customAvatar = getCustomUserAvatar({
        userId: user._id,
        email: user.email,
        name: user.name,
        fallbackSrc: user.avatar,
      });
      set({ currentUser: { ...user, avatar: customAvatar || user.avatar } });
    } else {
      set({ currentUser: null });
    }
  },
}));
