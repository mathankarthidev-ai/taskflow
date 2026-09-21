'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { getUserByEmailAction } from '@/actions/userActions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  useEffect(() => {
    async function initAuth() {
      const storedCompany = localStorage.getItem('ambizcon_selected_company') as any;
      if (storedCompany === 'Ambizcon Health - India' || storedCompany === 'Ambizcon - Australia') {
        useCompanyStore.getState().setSelectedCompany(storedCompany);
      }

      const storedEmail = localStorage.getItem('taskflow_user_email');
      if (!storedEmail) {
        return;
      }
      try {
        const user = await getUserByEmailAction(storedEmail);
        if (user) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('taskflow_user_email');
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }

    initAuth();
  }, [setCurrentUser]);

  return <>{children}</>;
}
