'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Sun, Moon, LogOut, Check, ChevronDown, Menu, Cake, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { SEED_USERS } from '@/lib/seed-data';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

const MONTH_WISE_BIRTHDAYS = [
  { month: 'January', users: [{ name: 'Thanikaivel', date: '09 Jan', team: 'Development', role: 'Team Member' }] },
  { month: 'February', users: [{ name: 'Sathish', date: '25 Feb', team: 'Creative', role: 'Team Member' }] },
  {
    month: 'March',
    users: [
      { name: 'Anirudh', date: '14 Mar', team: 'Development', role: 'Super Admin (CEO)' },
      { name: 'Mathan', date: '14 Mar', team: 'Development', role: 'Super Admin (AI PM)' },
      { name: 'Mathanmk', date: '14 Mar', team: 'Development', role: 'Team Member' },
    ],
  },
  { month: 'April', users: [{ name: 'Mathi', date: '12 Apr', team: 'Marketing', role: 'Team Member' }] },
  { month: 'May', users: [{ name: 'Deva', date: '18 May', team: 'Creative', role: 'Team Lead' }] },
  { month: 'July', users: [{ name: 'Aravind', date: '22 Jul', team: 'Development', role: 'Team Lead' }] },
  {
    month: 'August',
    users: [
      { name: 'Siddesh', date: '16 Aug', team: 'Marketing', role: 'Team Member' },
      { name: 'Kavish', date: '27 Aug', team: 'Creative', role: 'Team Member' },
    ],
  },
  { month: 'September', users: [{ name: 'Naraine', date: '27 Sep', team: 'Development', role: 'Team Member' }] },
  { month: 'October', users: [{ name: 'Kasthuri', date: '11 Oct', team: 'Creative', role: 'Team Member' }] },
  {
    month: 'November',
    users: [
      { name: 'Kenneth', date: '02 Nov', team: 'Marketing', role: 'Team Lead' },
      { name: 'Ahamed', date: '15 Nov', team: 'Creative', role: 'Team Member' },
    ],
  },
  { month: 'December', users: [{ name: 'Krithika Shri', date: '03 Dec', team: 'Marketing', role: 'Team Member' }] },
];

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const toggleSearch = useSearchStore((s) => s.toggleSearch);
  const setCreateModalOpen = useTaskStore((s) => s.setCreateModalOpen);

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBirthdayDropdownOpen, setIsBirthdayDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'Super Admin';

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-background/80 px-4 md:px-6 backdrop-blur-xl">
      {/* Left: Mobile Menu Trigger & Global Search */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={toggleSearch}
          className="flex h-10 w-48 sm:w-72 items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 px-3.5 text-xs text-muted-foreground transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-ring"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Search tasks, users...</span>
          </div>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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
          className="gap-1.5 ambizcon-gradient text-white shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>

        {/* Month-Wise Birthdays Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsBirthdayDropdownOpen(!isBirthdayDropdownOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-0 text-amber-500 hover:bg-amber-500/20 transition-colors"
            title="Team Birthdays Month-Wise"
          >
            <Cake className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </button>

          {isBirthdayDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">Team Birthdays (Month-Wise)</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[9px]">
                  15 Roster
                </Badge>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pt-3 pr-1">
                {MONTH_WISE_BIRTHDAYS.map((m) => (
                  <div key={m.month} className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-zinc-200/40 dark:border-zinc-800/40 pb-0.5">
                      {m.month}
                    </span>
                    {m.users.map((u) => (
                      <div key={u.name} className="flex items-center justify-between p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs">
                        <div>
                          <span className="font-bold text-foreground block">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">{u.role} • {u.team}</span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] text-amber-600 border-amber-500/30">
                          {u.date}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-xs font-semibold">Notifications</span>
                <Badge variant="default" className="text-[10px] bg-emerald-600 text-white">2 New</Badge>
              </div>
              <div className="space-y-3 pt-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground font-semibold">Task Assigned to You</p>
                    <p className="text-muted-foreground text-[11px]">Deva assigned "Redesign SaaS Dashboard".</p>
                    <span className="text-[10px] text-zinc-400">10m ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground font-semibold">Cross-Team Request</p>
                    <p className="text-muted-foreground text-[11px]">Aravind raised a task for Development.</p>
                    <span className="text-[10px] text-zinc-400">1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu (Persona Switcher restricted to Super Admin ONLY) */}
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
                <p className="text-xs font-bold text-foreground">{currentUser.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{currentUser.email}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px]">
                  {currentUser.role} • {currentUser.team}
                </Badge>
              </div>

              {/* Persona Switcher List - Restricted ONLY to Super Admin */}
              {isSuperAdmin && (
                <>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1">
                    Super Admin Persona Switcher
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
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                          }`}
                        >
                          <div className="flex flex-col text-left min-w-0">
                            <span className="truncate">{persona.name}</span>
                            <span className="text-[10px] text-zinc-400">{persona.role}</span>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

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
