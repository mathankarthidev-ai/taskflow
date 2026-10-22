'use client';

import React, { useEffect, useState } from 'react';
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
  X,
  Clock,
  ReceiptIndianRupee,
  IndianRupee,
  Bell,
  BellRing,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getNewChatMessageCount, markChannelMessagesAsRead, extractDmParticipantIds } from '@/lib/chat-db';
import { getCachedActiveSelfReminderCount, fetchSelfReminders } from '@/lib/self-reminders-store';
import { Badge } from '../ui/Badge';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const notifications = useNotificationStore((s) => s.notifications);
  const [chatDbUnreadCount, setChatDbUnreadCount] = useState(0);
  const [selfReminderCount, setSelfReminderCount] = useState(0);

  useEffect(() => {
    const refreshChatCount = () => {
      if (!currentUser) return;
      if (pathname?.startsWith('/chat')) {
        markChannelMessagesAsRead(undefined, currentUser._id);
        useNotificationStore.getState().markChatChannelRead();
        setChatDbUnreadCount(0);
        return;
      }
      const res = getNewChatMessageCount(
        currentUser.team,
        currentUser.role,
        currentUser._id,
        currentUser.name
      );
      setChatDbUnreadCount(res.total);
    };

    const refreshSelfReminders = () => {
      if (!currentUser) return;
      setSelfReminderCount(getCachedActiveSelfReminderCount(currentUser.email));
    };

    refreshChatCount();
    refreshSelfReminders();
    if (currentUser) {
      fetchSelfReminders(currentUser._id, currentUser.email, currentUser.name).then((list) => {
        setSelfReminderCount(list.filter((r) => !r.is_completed && r.is_active).length);
      });
    }

    window.addEventListener('taskflow_chat_unread_updated', refreshChatCount);
    window.addEventListener('taskflow_chat_message_sent', refreshChatCount);
    window.addEventListener('taskflow_chat_message_deleted', refreshChatCount);
    window.addEventListener('ambizcon_self_reminders_updated', refreshSelfReminders);
    window.addEventListener('storage', refreshChatCount);

    return () => {
      window.removeEventListener('taskflow_chat_unread_updated', refreshChatCount);
      window.removeEventListener('taskflow_chat_message_sent', refreshChatCount);
      window.removeEventListener('taskflow_chat_message_deleted', refreshChatCount);
      window.removeEventListener('ambizcon_self_reminders_updated', refreshSelfReminders);
      window.removeEventListener('storage', refreshChatCount);
    };
  }, [currentUser, pathname]);

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

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser.company === 'Ambizcon';
  const isTeamLead = currentUser.role === 'Team Lead' || isSuperAdmin;
  const isReception = currentUser.role === 'Reception Staff';

  const isOnChatPage = Boolean(pathname?.startsWith('/chat'));
  const notifChatUnreadCount = isOnChatPage
    ? 0
    : (Array.isArray(notifications) ? notifications : []).filter((n) => {
        if (!n || n.type !== 'chat_message' || !n.unread) return false;
        if (n.senderName === currentUser.name) return false;
        if (n.targetTeam && !isSuperAdmin && currentUser.team !== n.targetTeam) return false;
        if (
          n.channelId &&
          n.channelId.startsWith('dm_') &&
          !extractDmParticipantIds(n.channelId).includes(currentUser._id)
        ) {
          return false;
        }
        return true;
      }).length;
  const activeNewChatCount = isOnChatPage ? 0 : Math.max(chatDbUnreadCount, notifChatUnreadCount);

  const navItems: {
    label: string;
    href: string;
    icon: any;
    badge?: string;
    restricted?: boolean;
    isNewChatAlert?: boolean;
  }[] = isReception
    ? [
        { label: 'Attendance & Kiosk', href: '/attendance', icon: Clock, badge: 'Kiosk' },
        {
          label: 'Self Reminders',
          href: '/self-reminders',
          icon: BellRing,
          badge: selfReminderCount > 0 ? `${selfReminderCount} Active` : 'Simple',
        },
      ]
    : [
        { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Bizzy Board', href: '/kanban', icon: KanbanSquare },
        { label: 'Reminders', href: '/reminders', icon: Bell, badge: 'Alerts' },
        {
          label: 'Self Reminders',
          href: '/self-reminders',
          icon: BellRing,
          badge: selfReminderCount > 0 ? `${selfReminderCount} Active` : 'Simple',
        },
        {
          label: 'Team Chat',
          href: '/chat',
          icon: MessageSquare,
          badge: activeNewChatCount > 0 ? `${activeNewChatCount} New Msg` : 'Chat',
          isNewChatAlert: activeNewChatCount > 0,
        },
        {
          label: 'Incoming Queue',
          href: '/incoming',
          icon: Inbox,
          badge: isTeamLead ? 'Lead' : undefined,
          restricted: !isTeamLead,
        },
        { label: 'Attendance & Leave', href: '/attendance', icon: Clock, badge: 'New' },
        { label: 'Reimbursements', href: '/reimbursements', icon: ReceiptIndianRupee, badge: 'Claims' },
        { label: 'Reports', href: '/reports', icon: FileSpreadsheet },
        { label: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Insights' },
        {
          label: 'User Directory & Roles',
          href: '/users',
          icon: Users,
          badge: isSuperAdmin ? 'Admin' : undefined,
          restricted: !isSuperAdmin,
        },
        {
          label: 'Company Finance',
          href: '/finance',
          icon: IndianRupee,
          badge: isSuperAdmin ? 'Admin' : undefined,
          restricted: !isSuperAdmin,
        },
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
              alt={isAustralia ? "AMBIZCON Logo" : "AMBIZCON Health Logo"}
              className={cn("h-full w-full", isAustralia ? "object-contain" : "object-cover")}
            />
          </div>
          <div className="flex flex-col min-w-0">
            {isAustralia ? (
              <>
                <span className="font-extrabold text-base tracking-tight text-foreground leading-tight">
                  Bizy Hub
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Ambizcon • Brisbane HQ
                </span>
              </>
            ) : (
              <>
                <span className="font-extrabold text-base tracking-tight text-foreground leading-tight">
                  Bizy Hub<span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">Health</span>
                </span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Ambizcon Health • India
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
        <div className={cn(
          "flex items-center gap-2.5 rounded-xl border p-2.5",
          isAustralia
            ? "border-sky-500/20 bg-sky-500/5 dark:bg-sky-950/20"
            : "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20"
        )}>
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
            <span className="text-[10px] text-muted-foreground mt-1 truncate">Bizy Hub Enterprise</span>
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
                  className={cn(
                    'text-[9px] py-0.5 px-2 font-extrabold flex items-center gap-1',
                    item.isNewChatAlert
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/40 animate-pulse border border-white/30'
                      : isActive && 'bg-white/20 text-white'
                  )}
                >
                  {item.isNewChatAlert && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  )}
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
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
