'use client';

import React, { useEffect } from 'react';
import { RefreshCw, ShieldCheck, Home } from 'lucide-react';

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TaskFlow Workspace Error Boundary caught:', error);
  }, [error]);

  const handleSafeRecover = () => {
    try {
      reset();
    } catch (_) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Refreshing Workspace View
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            A temporary synchronization state was detected while loading this view. Your tasks, attendance, and messages are safe.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleSafeRecover}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload View
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
          >
            <Home className="h-3.5 w-3.5" />
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
