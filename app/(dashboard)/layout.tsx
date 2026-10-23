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
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('taskflow_user_email') : null;
    if (!currentUser && !storedEmail) {
      router.push('/login');
    }
    // Clean up any legacy announcement storage on mount
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ambizcon_announcements_v1');
        localStorage.removeItem('ambizcon_announcements_v2');
      } catch {}
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Authenticating Ambizcon Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />
        <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full min-w-0">{children}</main>
      </div>

      {/* Global Overlays & Modals */}
      <GlobalSearchModal />
      <KeyboardShortcutsModal />
      <TaskCreateModal />
      <TaskDetailModal />
    </div>
  );
}
