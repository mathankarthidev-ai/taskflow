'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserByEmailAction } from '@/actions/userActions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  useEffect(() => {
    async function initAuth() {
      // Check stored email
      const storedEmail = localStorage.getItem('taskflow_user_email') || 'alex@taskflow.company';
      try {
        const user = await getUserByEmailAction(storedEmail);
        if (user) {
          setCurrentUser(user);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }

    initAuth();
  }, [setCurrentUser]);

  return <>{children}</>;
}
