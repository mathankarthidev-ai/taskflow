'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Inbox,
  BarChart3,
  FileSpreadsheet,
  Users,
  Settings,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export function Sidebar() {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isTeamLead = currentUser.role === 'Team Lead' || isSuperAdmin;

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kanban Board', href: '/kanban', icon: KanbanSquare },
    {
      label: 'Incoming Queue',
      href: '/incoming',
      icon: Inbox,
      badge: isTeamLead ? 'Lead' : undefined,
      restricted: !isTeamLead,
    },
    { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { label: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Insights' },
    {
      label: 'User Management',
      href: '/users',
      icon: Users,
      badge: 'Admin',
      restricted: !isSuperAdmin,
    },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="sticky top-0 z-30 flex h-screen w-64 flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-background/80 backdrop-blur-xl transition-all">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </Link>
        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
          v1.0
        </Badge>
      </div>

      {/* Team Context Badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
            {currentUser.team[0]}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate leading-none">{currentUser.team} Workspace</span>
            <span className="text-[10px] text-muted-foreground mt-1 truncate">Internal Company</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-2 overflow-y-auto">
        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </div>
        {navItems.map((item) => {
          if (item.restricted) return null;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-primary-foreground' : 'text-zinc-500 dark:text-zinc-400'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={isActive ? 'secondary' : 'default'}
                  className={cn('text-[10px] py-0 px-1.5 font-normal', isActive && 'bg-white/20 text-white')}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active User Card & Quick Logout */}
      <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-3">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="md" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate leading-tight">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground truncate">{currentUser.role}</span>
          </div>
          <Link
            href="/profile"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
            title="Profile"
          >
            <UserCheck className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
