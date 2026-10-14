'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPage from './(auth)/login/page';

export default function HomePage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  return <LoginPage />;
}
