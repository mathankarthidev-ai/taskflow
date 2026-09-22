'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Bell, Sun, Moon, LogOut, Check, ChevronDown, Menu, Cake, Sparkles, Building2, Globe, Camera, QrCode, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { SEED_USERS } from '@/lib/seed-data';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

const MONTH_WISE_BIRTHDAYS = [
  {
    month: 'March',
    users: [
      { name: 'Thanikaivel Arumugam', date: '17 Mar', team: 'Development', role: 'Team Member' },
      { name: 'Mathanmk', date: '14 Mar', team: 'Development', role: 'Team Member' },
    ],
  },
  {
    month: 'April',
    users: [
      { name: 'Deva Priya D A', date: '16 Apr', team: 'Creative', role: 'Team Lead' },
    ],
  },
  {
    month: 'June',
    users: [
      { name: 'Anirudh', date: '29 Jun', team: 'Development', role: 'Super Admin (India & AU)' },
      { name: 'Kiruthikashri M', date: '07 Jun', team: 'Marketing', role: 'Team Member' },
    ],
  },
  {
    month: 'July',
    users: [{ name: 'Naraine R', date: '10 Jul', team: 'Development', role: 'Team Member' }],
  },
  {
    month: 'August',
    users: [{ name: 'Kavish TG', date: '02 Aug', team: 'Creative', role: 'Team Member' }],
  },
  {
    month: 'September',
    users: [{ name: 'B. Siddesh', date: '23 Sep', team: 'Marketing', role: 'Team Member' }],
  },
  {
    month: 'October',
    users: [
      { name: 'Kennath Franklin J', date: '14 Oct', team: 'Marketing', role: 'Team Lead' },
      { name: 'Mathan P', date: '16 Oct', team: 'Development', role: 'Super Admin' },
      { name: 'Mathi Pandian', date: '16 Oct', team: 'Marketing', role: 'Team Member' },
      { name: 'Kasthuri M', date: '28 Oct', team: 'Creative', role: 'Team Member' },
    ],
  },
  {
    month: 'November',
    users: [
      { name: 'V. Sathish Kumar', date: '16 Nov', team: 'Creative', role: 'Team Member' },
      { name: 'Ahamed', date: '15 Nov', team: 'Creative', role: 'Team Member' },
    ],
  },
  {
    month: 'December',
    users: [{ name: 'Aravind Kalaivanan', date: '30 Dec', team: 'Development', role: 'Team Lead' }],
  },
];

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const toggleSearch = useSearchStore((s) => s.toggleSearch);
  const setCreateModalOpen = useTaskStore((s) => s.setCreateModalOpen);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);

  type ActiveMenu = 'company' | 'birthday' | 'notif' | 'persona' | null;
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeAllMenus = () => setActiveMenu(null);

  // Close open dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-dropdown-menu')) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
  const isReception = currentUser.role === 'Reception Staff';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon - Australia'
    : currentUser.company === 'Ambizcon - Australia';

  // Automatically sync company store to member's assigned branch
  useEffect(() => {
    if (!currentUser) return;
    if (!isSuperAdmin) {
      if (currentUser.company === 'Ambizcon - Australia') {
        setSelectedCompany('Ambizcon - Australia');
      } else {
        setSelectedCompany('Ambizcon Health - India');
      }
    }
  }, [currentUser, isSuperAdmin, setSelectedCompany]);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-background/80 px-3 sm:px-4 md:px-6 backdrop-blur-xl">
      {/* Left: Mobile Menu Trigger, Search & Company Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          className="flex h-10 w-9 sm:w-44 md:w-56 items-center justify-center sm:justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 px-2 sm:px-3 text-xs text-muted-foreground transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 focus-ring shrink-0"
          title="Search tasks (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate hidden sm:inline">Search tasks...</span>
          </div>
          <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Company Branch Switcher: Option for Ambizcon Health - India is strictly for Admin */}
        {isSuperAdmin ? (
          <div className="relative header-dropdown-menu">
            <button
              onClick={() => toggleMenu('company')}
              className="flex h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 sm:px-3 text-xs font-bold transition-all text-foreground shadow-sm shrink-0"
              title="Switch Workspace Company Branch (Admin Only)"
            >
              {selectedCompany === 'Ambizcon - Australia' ? (
                <div className="h-5 w-5 rounded-md bg-white p-0.5 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
                </div>
              ) : (
                <img src="/ambizcon-logo.png" alt="IND" className="h-5 w-5 rounded-md object-cover border border-emerald-500/30 shrink-0" />
              )}
              <span className="hidden md:inline-flex items-center gap-1.5">
                {selectedCompany === 'Ambizcon - Australia' ? '🇦🇺 Ambizcon - Australia' : '🇮🇳 Ambizcon Health - India'}
              </span>
              <span className="md:hidden">
                {selectedCompany === 'Ambizcon - Australia' ? '🇦🇺 AUS' : '🇮🇳 IND'}
              </span>
              <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Admin
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>

            {activeMenu === 'company' && (
              <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-2.5 shadow-xl glass-panel z-50 animate-fade">
                <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 mb-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Company Branch
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Admin Portal
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCompany('Ambizcon Health - India');
                    closeAllMenus();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                    selectedCompany === 'Ambizcon Health - India'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src="/ambizcon-logo.png" alt="IND" className="h-7 w-7 rounded-lg object-cover border border-emerald-500/30 shrink-0" />
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">Ambizcon Health - India</span>
                        <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Admin
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Chennai HQ • 8:30 AM – 5:00 PM IST</span>
                    </div>
                  </div>
                  {selectedCompany === 'Ambizcon Health - India' && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedCompany('Ambizcon - Australia');
                    closeAllMenus();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors mt-1.5 ${
                    selectedCompany === 'Ambizcon - Australia'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-white p-1 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                      <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-foreground">Ambizcon - Australia</span>
                      <span className="text-[10px] text-muted-foreground block">Brisbane HQ • 8:30 AM – 5:00 PM AEST</span>
                    </div>
                  </div>
                  {selectedCompany === 'Ambizcon - Australia' && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>
              </div>
            )}
          </div>
        ) : isAustralia ? (
          <div
            className="flex h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 px-2.5 sm:px-3 text-xs font-semibold text-foreground shadow-sm select-none"
            title="Assigned Branch: Ambizcon - Australia"
          >
            <div className="h-5 w-5 rounded-md bg-white p-0.5 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5">
              🇦🇺 Ambizcon - Australia
            </span>
            <span className="md:hidden">
              🇦🇺 AUS
            </span>
          </div>
        ) : (
          <div
            className="flex h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 text-xs font-semibold text-foreground shadow-sm select-none"
            title="Assigned Branch: Ambizcon Health - India"
          >
            <img src="/ambizcon-logo.png" alt="IND" className="h-5 w-5 rounded-md object-cover border border-emerald-500/30 shrink-0" />
            <span className="hidden md:inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
              🇮🇳 Ambizcon Health - India
            </span>
            <span className="md:hidden font-bold text-emerald-700 dark:text-emerald-300">
              🇮🇳 IND
            </span>
          </div>
        )}
      </div>

      {/* Middle / Center: Attendance QR Scan Button (Prominent & Mobile Responsive) */}
      {!isReception && (
        <div className="flex-1 flex justify-center items-center px-1 sm:px-3">
          <Button
            onClick={() => {
              closeAllMenus();
              setIsQrScannerOpen(true);
            }}
            size="sm"
            className="ambizcon-gradient text-white font-extrabold text-xs gap-1.5 shadow-glow hover:opacity-95 px-3 sm:px-4 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            title="Scan Office Kiosk QR Code to Clock In / Out"
          >
            <Camera className="h-4 w-4 animate-pulse shrink-0" />
            <span className="hidden sm:inline">📷 Scan Office QR</span>
            <span className="sm:hidden text-[11px]">Scan QR</span>
          </Button>
        </div>
      )}

      {/* Right: Actions & User Dropdowns */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Create Task Button (Hidden for Reception Staff) */}
        {!isReception && (
          <Button
            onClick={() => {
              closeAllMenus();
              setCreateModalOpen(true);
            }}
            size="sm"
            className="hidden sm:inline-flex gap-1.5 ambizcon-gradient text-white shadow-glow"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        )}

        {/* Team Birthdays Dropdown */}
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('birthday')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 p-0 text-amber-500 hover:bg-amber-500/20 transition-colors"
            title="Team Birthdays"
          >
            <Cake className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </button>

          {activeMenu === 'birthday' && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">Team Birthdays</span>
                </div>
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
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('notif')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {activeMenu === 'notif' && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
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
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('persona')}
            className="flex items-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-1.5 pr-2.5 transition-colors hover:bg-accent"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <span className="text-xs font-medium max-w-[100px] truncate hidden md:inline-block">
              {currentUser.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {activeMenu === 'persona' && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3 shadow-xl glass-panel z-50 animate-fade">
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
                            if (persona.company) {
                              setSelectedCompany(persona.company);
                            }
                            await login(persona.email);
                            closeAllMenus();
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                          }`}
                        >
                          <div className="flex flex-col text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{persona.name}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                {persona.company === 'Ambizcon - Australia' ? '🇦🇺 AUS' : '🇮🇳 IND'}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-zinc-400">{persona.role} • {persona.team}</span>
                          </div>
                          {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <Link
                  href="/profile"
                  onClick={closeAllMenus}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>My Profile & Personal Details</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    closeAllMenus();
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

      {/* Member In-App Camera QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />
    </header>
  );
}
