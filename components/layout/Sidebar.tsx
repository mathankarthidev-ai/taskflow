'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Inbox,
  BarChart3,
  FileSpreadsheet,
  Users,
  Settings,
  UserCheck,
  X,
  Clock,
  Receipt,
  DollarSign,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);

  const handleLogout = () => {
    logout();
    if (onMobileClose) {
      onMobileClose();
    }
    router.push('/login');
  };

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  if (!currentUser) return null;

  const isAustralia = currentUser.company === 'Ambizcon - Australia' || selectedCompany === 'Ambizcon - Australia';
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isTeamLead = currentUser.role === 'Team Lead' || isSuperAdmin;
  const isReception = currentUser.role === 'Reception Staff';

  const navItems = isReception
    ? [
        { label: 'Attendance & Kiosk', href: '/attendance', icon: Clock, badge: 'Kiosk' },
        { label: 'My Profile', href: '/profile', icon: User },
      ]
    : [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Bizzy Board', href: '/kanban', icon: KanbanSquare },
        {
          label: 'Incoming Queue',
          href: '/incoming',
          icon: Inbox,
          badge: isTeamLead ? 'Lead' : undefined,
          restricted: !isTeamLead,
        },
        { label: 'Attendance & Leave', href: '/attendance', icon: Clock, badge: 'New' },
        { label: 'Reimbursements', href: '/reimbursements', icon: Receipt, badge: 'Claims' },
        { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
        { label: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Insights' },
        {
          label: 'User Directory',
          href: '/users',
          icon: Users,
          badge: isSuperAdmin ? 'Admin' : undefined,
          restricted: !isSuperAdmin,
        },
        {
          label: 'Role Approvals',
          href: '/users#approvals',
          icon: UserCheck,
          badge: isSuperAdmin ? 'Admin' : undefined,
          restricted: !isSuperAdmin,
        },
        {
          label: 'Company Finance',
          href: '/finance',
          icon: DollarSign,
          badge: isSuperAdmin ? 'Admin' : undefined,
          restricted: !isSuperAdmin,
        },
        { label: 'My Profile', href: '/profile', icon: User },
        { label: 'Settings', href: '/settings', icon: Settings },
      ];

  const sidebarContent = (
    <aside
      className={cn(
        'sticky top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-background/95 backdrop-blur-xl transition-all shrink-0',
        isMobileOpen
          ? 'fixed inset-y-0 left-0 z-50 flex w-72 shadow-2xl animate-fade'
          : 'hidden md:flex'
      )}
    >
      {/* AMBIZCON Brand Header (Branch aware: Australia vs Health India) */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <Link href={isReception ? '/attendance' : '/dashboard'} onClick={onMobileClose} className="flex items-center gap-3 group">
          {/* Logo Image */}
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-105 overflow-hidden",
            isAustralia ? "bg-white p-1 border-amber-500/30" : "border-emerald-500/30"
          )}>
            <img
              src={isAustralia ? "/ambizcon-australia-icon.png" : "/ambizcon-logo.png"}
              alt={isAustralia ? "AMBIZCON Australia Logo" : "AMBIZCON Health Logo"}
              className={cn("h-full w-full", isAustralia ? "object-contain" : "object-cover")}
            />
          </div>
          <div className="flex flex-col min-w-0">
            {isAustralia ? (
              <>
                <span className="font-extrabold text-base tracking-tight text-foreground leading-tight">
                  AMBIZCON<span className="text-amber-500 dark:text-amber-400 font-bold ml-1">Australia</span>
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Brisbane HQ • Global
                </span>
              </>
            ) : (
              <>
                <span className="font-extrabold text-base tracking-tight text-foreground leading-tight">
                  AMBIZCON<span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">Health</span>
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Beyond Marketing • Healthcare
                </span>
              </>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 text-muted-foreground hover:text-foreground rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Team Context Badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-2.5">
          <div className={cn(
            "h-7 w-7 rounded-lg shadow-xs border flex items-center justify-center overflow-hidden",
            isAustralia ? "bg-white p-0.5 border-amber-500/30" : "border-emerald-500/30"
          )}>
            <img
              src={isAustralia ? "/ambizcon-australia-icon.png" : "/ambizcon-logo.png"}
              alt="Logo"
              className={cn("h-full w-full", isAustralia ? "object-contain" : "object-cover")}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate leading-none text-foreground">
              {currentUser.team} Team
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 truncate">TaskFlow Enterprise</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Main Workspace
        </div>
        {navItems.map((item) => {
          if (item.restricted) return null;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold transition-all group',
                isActive
                  ? 'ambizcon-gradient text-white shadow-md shadow-brand-500/20'
                  : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={isActive ? 'secondary' : 'default'}
                  className={cn('text-[9px] py-0 px-1.5 font-bold', isActive && 'bg-white/20 text-white')}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Active User Card & Logout Area */}
      <div className="p-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-2.5">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="md" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold truncate leading-tight text-foreground">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground truncate">{currentUser.role}</span>
          </div>
          <Link
            href="/profile"
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
            title="My Profile"
          >
            <UserCheck className="h-4 w-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Log Out Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 py-1.5 text-xs font-bold transition-all active:scale-98"
          title="Sign Out of TaskFlow"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
      {sidebarContent}
    </>
  );
}
