'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Command, Keyboard } from 'lucide-react';

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts modal with ? (Shift + /)
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { key: '⌘ K / Ctrl K', description: 'Open Global Search Command Palette' },
    { key: 'N', description: 'Open Create Task Modal' },
    { key: '?', description: 'Toggle Keyboard Shortcuts Helper' },
    { key: 'Esc', description: 'Close any active Modal or Overlay' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Keyboard Shortcuts Cheatsheet"
      description="Supercharge your productivity with Bizy Hub hotkeys."
      maxWidth="md"
    >
      <div className="space-y-3 pt-2">
        {shortcuts.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 text-xs"
          >
            <span className="font-medium text-foreground">{s.description}</span>
            <kbd className="inline-flex h-6 items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 font-mono text-[11px] font-semibold text-primary shadow-sm">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
