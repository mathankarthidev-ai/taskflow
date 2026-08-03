'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Sun, Moon, Laptop, LogOut, Check, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { SEED_USERS } from '@/lib/seed-data';

export function Header() {
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const toggleSearch = useSearchStore((s) => s.toggleSearch);
  const setCreateModalOpen = useTaskStore((s) => s.setCreateModalOpen);

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: Global Search Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSearch}
          className="flex h-10 w-72 items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 px-3.5 text-xs text-muted-foreground transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-ring"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span>Search tasks, users, teams...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right: Actions & User Dropdowns */}
      <div className="flex items-center gap-3">
        {/* Create Task Button */}
        <Button
          onClick={() => setCreateModalOpen(true)}
          size="sm"
          className="gap-1.5 shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-xs font-semibold">Notifications</span>
                <Badge variant="default" className="text-[10px]">2 New</Badge>
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Task Assigned to You</p>
                    <p className="text-muted-foreground text-[11px]">Maya assigned "Redesign SaaS Dashboard".</p>
                    <span className="text-[10px] text-zinc-400">10m ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Cross-Team Request</p>
                    <p className="text-muted-foreground text-[11px]">Ava Stone raised a task for Development.</p>
                    <span className="text-[10px] text-zinc-400">1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-1.5 pr-2.5 transition-colors hover:bg-accent"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <span className="text-xs font-medium max-w-[100px] truncate hidden md:inline-block">
              {currentUser.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {isPersonaMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3 shadow-xl glass-panel z-50 animate-fade">
              <div className="px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-2">
                <p className="text-xs font-semibold text-foreground">{currentUser.name}</p>
                <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px]">
                  {currentUser.role} • {currentUser.team}
                </Badge>
              </div>

              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                Switch Seed Persona
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                {SEED_USERS.map((persona) => {
                  const isCurrent = persona.email === currentUser.email;
                  return (
                    <button
                      key={persona.email}
                      onClick={async () => {
                        await login(persona.email);
                        setIsPersonaMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs transition-colors ${
                        isCurrent
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                      }`}
                    >
                      <div className="flex flex-col text-left min-w-0">
                        <span className="truncate">{persona.name}</span>
                        <span className="text-[10px] text-zinc-400">{persona.role}</span>
                      </div>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <button
                  onClick={() => {
                    logout();
                    setIsPersonaMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
