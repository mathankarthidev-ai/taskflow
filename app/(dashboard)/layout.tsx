'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import { TaskCreateModal } from '@/features/tasks/TaskCreateModal';
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal';
import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  React.useEffect(() => {
    // If not authenticated, redirect to login page
    const storedEmail = localStorage.getItem('taskflow_user_email');
    if (!currentUser && !storedEmail) {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">{children}</main>
      </div>

      {/* Global Overlays & Modals */}
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <TaskCreateModal />
      <TaskDetailModal />
    </div>
  );
}
