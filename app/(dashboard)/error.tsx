'use client';

import React, { useEffect } from 'react';
import { RefreshCw, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard section error caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-6 shadow-lg text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-foreground">
            Section Ready to Reload
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We caught a temporary rendering glitch in this section. Click below to restore the view immediately without losing any data.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Section
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-foreground transition-all cursor-pointer"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Full Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
