'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal';
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const router = useRouter();

  React.useEffect(() => {
    // If not authenticated, redirect to login page
    const storedEmail = localStorage.getItem('taskflow_user_email');
    if (!currentUser && !storedEmail) {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Global Overlays & Modals */}
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <TaskCreateModal />
      <TaskDetailModal />
    </div>
  );
}
