'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  LogOut,
  Check,
  ChevronDown,
  Menu,
  Cake,
  Sparkles,
  Building2,
  Globe,
  Camera,
  QrCode,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
  CheckCheck,
  HeartPulse,
  Activity,
  Droplets,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { isUserInCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import { HEALTH_CHECKLIST, INTERVAL_OPTIONS } from '@/components/attendance/HealthCheckModal';
import { playNotificationChime } from '@/lib/audio-chime';
import {
  getChatBroadcastChannel,
  getNewChatMessageCount,
  isUserReceiverForChatMessage,
  markChannelMessagesAsRead,
  syncMessagesFromServer,
} from '@/lib/chat-db';
import { toast } from 'sonner';

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
    month: 'May',
    users: [],
  },
  {
    month: 'June',
    users: [
      { name: 'Kiruthikashri M', date: '07 Jun', team: 'Marketing', role: 'Team Member' },
      { name: 'Adriana Ruju', date: '12 Jun', team: 'Marketing', role: 'Team Member (Australia)' },
      { name: 'Anirudh', date: '29 Jun', team: 'Development', role: 'Super Admin (India & AU)' },
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const toggleSearch = useSearchStore((s) => s.toggleSearch);
  const setCreateModalOpen = useTaskStore((s) => s.setCreateModalOpen);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);

  type ActiveMenu = 'company' | 'birthday' | 'health' | 'notif' | 'persona' | null;
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Health Check Dropdown State
  const [healthCompletedItems, setHealthCompletedItems] = useState<number[]>([]);
  const [healthGifMode, setHealthGifMode] = useState<'stretch' | 'water'>('stretch');
  const [healthIntervalMins, setHealthIntervalMins] = useState<number>(60);
  const [selectedHealthCheckpoint, setSelectedHealthCheckpoint] = useState<string>('all');

  // System Notifications State (Includes Role-Targeted Reimbursement Note Alerts)
  const rawNotificationsList = useNotificationStore((s) => s.notifications);
  const markAllReadStore = useNotificationStore((s) => s.markAllRead);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);

  // Filter notifications: show general notifications + notifications targeted at currentUser.role (and for chat_message, only receivers, never the sender)
  const notificationsList = rawNotificationsList.filter((n) => {
    if (!currentUser) return true;
    const isAdminUser = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

    // For chat messages: ONLY show to receivers (mem, team, all) — NEVER to the sender!
    if (n.type === 'chat_message') {
      if (n.senderName === currentUser.name) return false;
      if (n.targetTeam && !isAdminUser && currentUser.team !== n.targetTeam) return false;
      if (n.channelId && n.channelId.startsWith('dm_') && !n.channelId.includes(currentUser._id)) {
        return false;
      }
      return true;
    }

    if (!n.targetRoles || n.targetRoles.length === 0) return true;
    if (isAdminUser && (n.targetRoles.includes('Super Admin') || n.targetRoles.includes('Admin'))) {
      return true;
    }
    if (n.targetRoles.includes(currentUser.role as any)) {
      return true;
    }
    // Allow reimbursement note sender to see confirmation entry
    if (n.senderName === currentUser.name) {
      return true;
    }
    return false;
  });

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeAllMenus = () => setActiveMenu(null);

  // Group & Team Chat Notification & Audio Chime Listener (Same-Tab, Cross-Tab BroadcastChannel, & Server Sync)
  useEffect(() => {
    if (!currentUser) return;

    const triggerTeamChatAlert = (message: any, channelId: string) => {
      if (!message || !message.id) return;

      // Strictly verify currentUser is a RECEIVER (in Direct/Member, Team, or All-in-One) and NOT the sender!
      if (!isUserReceiverForChatMessage(message, channelId, currentUser)) {
        window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
        return;
      }

      const isAllInOne = channelId === 'channel_all';
      const channelLabel = isAllInOne
        ? '🌐 All-in-One Company Group'
        : channelId === 'channel_creative'
        ? '🎨 Creative Team Group'
        : channelId === 'channel_marketing'
        ? '📈 Marketing Team Group'
        : channelId === 'channel_development'
        ? '💻 Development Team Group'
        : 'Direct Chat';

      const targetTeam =
        channelId === 'channel_creative'
          ? 'Creative'
          : channelId === 'channel_marketing'
          ? 'Marketing'
          : channelId === 'channel_development'
          ? 'Development'
          : undefined;

      // Ensure notification exists in store for targeted receivers
      const existingNotifs = useNotificationStore.getState().notifications;
      const alreadyExists = existingNotifs.some(
        (n) => n.messageId === message.id || (n.type === 'chat_message' && n.text.includes(message.text) && n.senderName === message.senderName)
      );

      if (!alreadyExists) {
        useNotificationStore.getState().addNotification({
          type: 'chat_message',
          category: isAllInOne ? 'All-in-One Chat (All Teams)' : channelLabel,
          title: isAllInOne
            ? `💬 ${message.senderName} (${message.senderRole}) in All-in-One Chat`
            : `💬 ${message.senderName} posted in ${channelLabel}`,
          text: `${message.senderName}: "${
            message.text || (message.fileAttachment ? `Attached: ${message.fileAttachment.name}` : 'Shared a link')
          }"`,
          color: 'bg-teal-500',
          link: '/chat',
          channelId,
          messageId: message.id,
          targetTeam,
          senderName: message.senderName,
          senderRole: message.senderRole,
          targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
        });
      }

      // Play sound and show toast ONLY for the receiver
      playNotificationChime();
      toast.info(
        `💬 New Message from ${message.senderName} (${message.senderRole})`,
        {
          description: `${channelLabel}: "${
            message.text ? message.text.slice(0, 60) : 'Check Team Chat'
          }"`,
        }
      );
      window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
    };

    const handleChatNotify = (e: any) => {
      const { message, channelId } = e.detail || {};
      if (!message) return;
      triggerTeamChatAlert(message, channelId || message.channelId || 'channel_all');
    };

    // Check existing unread messages in All-in-One / Team / Direct Chat for RECEIVERS only (e.g., when switching persona)
    const unreadInfo = getNewChatMessageCount(
      currentUser.team,
      currentUser.role,
      currentUser._id,
      currentUser.name
    );
    if (unreadInfo.total > 0 && unreadInfo.latestMessage) {
      const msg = unreadInfo.latestMessage;
      const msgChannelId = msg.channelId || 'channel_all';
      if (isUserReceiverForChatMessage(msg, msgChannelId, currentUser)) {
        const existingNotifs = useNotificationStore.getState().notifications;
        const hasNotif = existingNotifs.some(
          (n) => n.messageId === msg.id || (n.type === 'chat_message' && n.text.includes(msg.text))
        );
        if (!hasNotif) {
          useNotificationStore.getState().addNotification({
            type: 'chat_message',
            category: msgChannelId === 'channel_all' ? 'All-in-One Chat (All Teams)' : 'Team Chat',
            title: `💬 ${msg.senderName} (${msg.senderRole}) sent a message`,
            text: `${msg.senderName}: "${msg.text}"`,
            color: 'bg-teal-500',
            link: '/chat',
            channelId: msgChannelId,
            messageId: msg.id,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
          });
        }

        // Play sound once per receiver session for the latest unread message
        const alertKey = `ambizcon_chat_chime_${currentUser._id}_${msg.id}`;
        if (!sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, '1');
          playNotificationChime();
          toast.info(`💬 ${unreadInfo.total} New Message(s) in Chat`, {
            description: `${msg.senderName} (${msg.senderRole}): "${msg.text}"`,
          });
        }
      }
    }

    // Listen to BroadcastChannel for instant cross-tab notifications
    const bc = getChatBroadcastChannel();
    const handleBroadcast = (ev: MessageEvent) => {
      if (ev.data?.type === 'CHAT_MESSAGE_SENT' && ev.data?.message) {
        triggerTeamChatAlert(ev.data.message, ev.data.channelId || 'channel_all');
      }
    };
    if (bc) {
      bc.addEventListener('message', handleBroadcast);
    }

    // Poll server /api/chat every 4 seconds for cross-browser / cross-device team messages
    const pollServer = async () => {
      const { newMessages } = await syncMessagesFromServer();
      for (const item of newMessages) {
        triggerTeamChatAlert(item.message, item.channelId);
      }
    };
    pollServer();
    const pollInterval = setInterval(pollServer, 4000);

    window.addEventListener('taskflow_chat_message_sent', handleChatNotify);
    return () => {
      window.removeEventListener('taskflow_chat_message_sent', handleChatNotify);
      if (bc) {
        bc.removeEventListener('message', handleBroadcast);
      }
      clearInterval(pollInterval);
    };
  }, [currentUser?._id, currentUser?.team, currentUser?.role]);

  // 1-Click Manual Workspace Refresh for All Users
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Workspace refreshed & data synced!');
    }, 600);
  };

  const handleMarkAllRead = () => {
    markAllReadStore();
    markChannelMessagesAsRead();
    toast.info('All notifications marked as read');
  };

  const handleNotificationClick = (notif: any) => {
    markAsReadStore(notif.id);
    closeAllMenus();

    if (notif.type === 'chat_message') {
      if (notif.channelId) {
        markChannelMessagesAsRead(notif.channelId);
      } else {
        markChannelMessagesAsRead();
      }
      router.push('/chat');
      return;
    }

    if (notif.type === 'reimbursement_note' || notif.link === '/reimbursements' || notif.claimId) {
      router.push('/reimbursements');
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('ambizcon_open_claim_note', {
              detail: { claimId: notif.claimId, claimNo: notif.claimNo },
            })
          );
        }, 150);
      }
      toast.info(`Opening Reimbursement Claim ${notif.claimNo || ''}`);
      return;
    }

    if (notif.link && notif.link !== '/kanban') {
      router.push(notif.link);
      return;
    }

    const allTasks = useTaskStore.getState().tasks;

    if (notif.taskId) {
      const found = allTasks.find((t) => t._id === notif.taskId);
      if (found) {
        useTaskStore.getState().setSelectedTask(found);
        useTaskStore.getState().setDetailModalOpen(true);
        toast.info(`Opening task: "${found.title}"`);
        return;
      }
    }

    const textToSearch = `${notif.title} ${notif.text}`.toLowerCase();
    const matchedTask = allTasks.find((t) =>
      textToSearch.includes(t.title.toLowerCase()) ||
      t.title.split(' ').some((word) => word.length > 3 && textToSearch.includes(word.toLowerCase()))
    );

    if (matchedTask) {
      useTaskStore.getState().setSelectedTask(matchedTask);
      useTaskStore.getState().setDetailModalOpen(true);
      toast.info(`Opening task: "${matchedTask.title}"`);
    } else if (allTasks.length > 0) {
      useTaskStore.getState().setSelectedTask(allTasks[0]);
      useTaskStore.getState().setDetailModalOpen(true);
      toast.info(`Opening task: "${allTasks[0].title}"`);
    } else {
      router.push(notif.link || '/kanban');
    }
  };

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
    ? selectedCompany === 'Ambizcon'
    : currentUser.company === 'Ambizcon';

  // Automatically sync company store to member's assigned branch
  useEffect(() => {
    if (!currentUser) return;
    if (!isSuperAdmin) {
      if (currentUser.company === 'Ambizcon') {
        setSelectedCompany('Ambizcon');
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

        {/* Company Branch Switcher: Admin Only */}
        {isSuperAdmin ? (
          <div className="relative header-dropdown-menu">
            <button
              onClick={() => toggleMenu('company')}
              className={`flex h-10 items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-all text-foreground shadow-sm shrink-0 ${
                selectedCompany === 'Ambizcon'
                  ? 'border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20'
                  : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
              title="Switch Workspace Company Branch (Admin Only)"
            >
              {selectedCompany === 'Ambizcon' ? (
                <div className="h-5 w-5 rounded-md bg-white p-0.5 border border-sky-500/40 flex items-center justify-center shrink-0">
                  <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
                </div>
              ) : (
                <img src="/ambizcon-logo.png" alt="IND" className="h-5 w-5 rounded-md object-cover border border-emerald-500/30 shrink-0" />
              )}
              <span className="hidden md:inline-flex items-center gap-1.5">
                {selectedCompany === 'Ambizcon' ? '🇦🇺 Ambizcon' : '🇮🇳 Ambizcon Health - India'}
              </span>
              <span className="md:hidden">
                {selectedCompany === 'Ambizcon' ? '🇦🇺 AUS' : '🇮🇳 IND'}
              </span>
              <span className={`hidden lg:inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                selectedCompany === 'Ambizcon'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}>
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
                        <span className="text-[9px] font-extrabold px-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Chennai HQ • 8:30 AM – 5:00 PM IST</span>
                    </div>
                  </div>
                  {selectedCompany === 'Ambizcon Health - India' && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedCompany('Ambizcon');
                    closeAllMenus();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors mt-1.5 ${
                    selectedCompany === 'Ambizcon'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/40'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-white p-1 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">Ambizcon</span>
                        <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          Active
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Brisbane HQ • 8:30 AM – 5:00 PM AEST</span>
                    </div>
                  </div>
                  {selectedCompany === 'Ambizcon' && <Check className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
                </button>
              </div>
            )}
          </div>
        ) : isAustralia ? (
          <div
            className="flex h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-2.5 sm:px-3 text-xs font-semibold text-foreground shadow-sm select-none"
            title="Assigned Branch: Ambizcon"
          >
            <div className="h-5 w-5 rounded-md bg-white p-0.5 border border-sky-500/30 flex items-center justify-center shrink-0">
              <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-300">
              🇦🇺 Ambizcon
            </span>
            <span className="md:hidden font-bold text-sky-700 dark:text-sky-300">
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

      {/* Middle / Center: Attendance QR Scan Button */}
      {!isReception && (
        <div className="flex-1 flex justify-center items-center px-1 sm:px-3 mx-auto max-w-[280px]">
          <Button
            onClick={() => {
              closeAllMenus();
              setIsQrScannerOpen(true);
            }}
            size="sm"
            className="ambizcon-gradient text-white font-extrabold text-[11px] sm:text-xs gap-1.5 shadow-glow hover:opacity-95 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            title="Scan Office Kiosk QR Code to Clock In / Out"
          >
            <Camera className="h-4 w-4 animate-pulse shrink-0" />
            <span className="inline">📷 Scan Office QR</span>
          </Button>
        </div>
      )}

      {/* Right: Actions & User Dropdowns */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Create Task Button */}
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

        {/* 1-Click Manual Refresh Button for All Users */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95"
          title="1-Click Refresh Workspace & Sync Data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

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
                  <span className="text-xs font-bold text-foreground">
                    Team Birthdays ({isAustralia ? 'Ambizcon AU' : 'Ambizcon Health'})
                  </span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pt-3 pr-1">
                {MONTH_WISE_BIRTHDAYS.map((m) => {
                  const branchUsers = m.users.filter((u) =>
                    isUserInCompany(u, isAustralia ? 'Ambizcon' : 'Ambizcon Health - India')
                  );
                  if (branchUsers.length === 0) return null;
                  return (
                    <div key={m.month} className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-zinc-200/40 dark:border-zinc-800/40 pb-0.5">
                        {m.month}
                      </span>
                      {branchUsers.map((u) => (
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
                  );
                })}
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

        {/* Quick Health & Ergonomics Check Dropdown */}
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('health')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors relative group"
            title="👨‍💻 Quick Health Check (Hourly Workspace Wellness)"
          >
            <HeartPulse className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {activeMenu === 'health' && (
            <div className="absolute right-0 mt-2 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-2xl glass-panel z-50 animate-fade space-y-3.5">
              {/* Top Header */}
              <div className="space-y-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <HeartPulse className="h-3 w-3 text-emerald-500 animate-pulse" />
                    Hourly Workspace Wellness
                  </Badge>
                  <select
                    value={healthIntervalMins}
                    onChange={(e) => {
                      const mins = Number(e.target.value);
                      setHealthIntervalMins(mins);
                      toast.info(`Wellness reminder set to every ${mins} minutes`);
                    }}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-bold text-foreground cursor-pointer focus:outline-none"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.minutes} value={opt.minutes}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <h3 className="text-base font-black text-foreground flex items-center gap-1.5">
                    👨‍💻 Quick Health Check
                  </h3>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => setHealthGifMode('stretch')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        healthGifMode === 'stretch'
                          ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Activity className="h-3 w-3 text-emerald-500" />
                      Stretches
                    </button>
                    <button
                      type="button"
                      onClick={() => setHealthGifMode('water')}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        healthGifMode === 'water'
                          ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Droplets className="h-3 w-3 text-blue-500" />
                      Hydration
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Take 60 seconds to reset your posture, stretch muscles, and rest your eyes before continuing your tasks.
                </p>
              </div>

              {/* Ergonomic Habit Builder Banner */}
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-emerald-500/5 via-brand-500/5 to-purple-500/5 p-3 flex items-center gap-3">
                <img
                  src={healthGifMode === 'stretch' ? '/health-stretch.gif' : '/drink-water.gif'}
                  alt={healthGifMode === 'stretch' ? 'Office Stretch Demonstration' : 'Drink Water Reminder'}
                  className="h-16 w-20 rounded-lg object-cover border border-zinc-200/60 dark:border-zinc-700/60 shrink-0 bg-zinc-900"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    <span>Ergonomic Habit Builder</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {healthGifMode === 'stretch'
                      ? 'Relieve Spine & Shoulder Tension'
                      : 'Keep Brain Hydrated & Clear'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {healthGifMode === 'stretch'
                      ? 'Micro-breaks boost overall coding stamina by up to 28% and relieve musculoskeletal strain from sitting.'
                      : 'Even mild dehydration reduces mental concentration by 15%. Grab your water bottle and take a sip now!'}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      Goal: 60 sec pause
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHealthCompletedItems(HEALTH_CHECKLIST.map((h) => h.id));
                        toast.success('All 10 health checkpoints marked as done!');
                      }}
                      className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Mark all done
                    </button>
                  </div>
                </div>
              </div>

              {/* Dropdown Selector to Choose from 10 Health Checkpoints */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">10 Health Checkpoints</span>
                  <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {healthCompletedItems.length} of {HEALTH_CHECKLIST.length} completed
                  </span>
                </div>

                {/* Select Dropdown to Choose Checkpoint */}
                <select
                  value={selectedHealthCheckpoint}
                  onChange={(e) => setSelectedHealthCheckpoint(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">📋 Show All 10 Health Checkpoints (Choose below)</option>
                  {HEALTH_CHECKLIST.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.id}. {item.emoji} {item.title} {healthCompletedItems.includes(item.id) ? '✓' : ''}
                    </option>
                  ))}
                </select>

                {/* Filtered Checkpoint List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {HEALTH_CHECKLIST.filter(
                    (item) => selectedHealthCheckpoint === 'all' || String(item.id) === selectedHealthCheckpoint
                  ).map((item) => {
                    const isChecked = healthCompletedItems.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          setHealthCompletedItems((prev) =>
                            prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                          )
                        }
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-500/5 text-foreground'
                            : 'border-zinc-200/70 dark:border-zinc-800/70 bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <span className="text-base shrink-0 pt-0.5">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              {item.id}.
                            </span>
                            <h4
                              className={`text-xs font-bold ${
                                isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                            {item.description}
                          </p>
                        </div>
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border mt-0.5 ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-zinc-300 dark:border-zinc-700 bg-background'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-brand-500" />
                    Next automatic alert in <strong>{healthIntervalMins} minutes</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      closeAllMenus();
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('ambizcon_trigger_health_check'));
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Expand Popup
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeAllMenus}
                    className="text-xs flex-1"
                  >
                    Remind Later
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (currentUser) {
                        localStorage.setItem(
                          `ambizcon_last_health_check_${currentUser._id}`,
                          Date.now().toString()
                        );
                      }
                      closeAllMenus();
                      toast.success('Health Check Complete! 🎉', {
                        description: `Awesome job refreshing your body and eyes. Next check in ${healthIntervalMins} minutes.`,
                      });
                    }}
                    className="flex-[2] ambizcon-gradient text-white font-extrabold text-xs shadow-glow gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Done (I&apos;m Refreshed &amp; Ready)</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown (Silent - No Audio Chime - Live Numeric Count Badge) */}
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('notif')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="System Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full ambizcon-gradient text-white font-mono text-[9px] font-extrabold flex items-center justify-center border border-background shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {activeMenu === 'notif' && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-xl glass-panel z-50 animate-fade">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-emerald-500" />
                  System Notifications
                </span>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 ? (
                    <Badge variant="default" className="text-[10px] bg-emerald-600 text-white font-mono font-bold">
                      {unreadCount} New
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono">All Read</Badge>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-muted-foreground hover:text-foreground ml-1 p-0.5 rounded hover:bg-accent"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-3 max-h-72 overflow-y-auto pr-1">
                {notificationsList.map((notif) => {
                  const isChatBroadcast = notif.type === 'chat_message';
                  const isForAdmin =
                    !isChatBroadcast &&
                    (notif.targetRoles?.includes('Super Admin') || notif.targetRoles?.includes('Admin'));
                  const isForMemAndTL =
                    !isChatBroadcast &&
                    notif.targetRoles?.includes('Team Member') &&
                    notif.targetRoles?.includes('Team Lead');

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                        notif.unread
                          ? 'border-emerald-500/40 bg-emerald-500/10 font-medium hover:border-emerald-500/70'
                          : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${notif.color} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-foreground text-xs truncate">{notif.title}</p>
                          <span className="text-[10px] text-zinc-400 font-mono shrink-0">{notif.time}</span>
                        </div>
                        {(notif.targetRoles || isChatBroadcast) && (
                          <div className="mt-0.5">
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                isChatBroadcast
                                  ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                                  : isForAdmin
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : isForMemAndTL
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isChatBroadcast
                                ? '🔔 Sent to All Teams (TL, Member & Admin)'
                                : isForAdmin
                                ? '🔔 Notify Admin'
                                : isForMemAndTL
                                ? '🔔 Notify Member & TL'
                                : `🔔 ${notif.category}`}
                            </span>
                          </div>
                        )}
                        <p className="text-muted-foreground text-[11px] mt-1 leading-snug">{notif.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu (Nav Team Member Name + Profile Picture Option) */}
        <div className="relative header-dropdown-menu">
          <button
            onClick={() => toggleMenu('persona')}
            className="flex items-center gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-1.5 pr-3 transition-colors hover:bg-accent"
            title="Account & Profile Picture Options"
          >
            <div className="relative">
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                userId={currentUser._id}
                email={currentUser.email}
                size="md"
                className="ring-2 ring-emerald-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-foreground max-w-[120px] truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline-block leading-tight">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {activeMenu === 'persona' && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3.5 shadow-xl glass-panel z-50 animate-fade">
              {/* Current User Header with Profile Picture & Upload Shortcut */}
              <div className="flex items-center gap-3 px-2 py-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-2">
                <Link href="/profile" onClick={closeAllMenus} className="relative group shrink-0" title="Upload or change profile picture in My Profile">
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    userId={currentUser._id}
                    email={currentUser.email}
                    size="lg"
                    className="h-12 w-12 ring-2 ring-emerald-500/40"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ambizcon-gradient text-white shadow-sm border border-background">
                    <Camera className="h-2.5 w-2.5" />
                  </span>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {currentUser.role} • {currentUser.team}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Persona Switcher List - Restricted ONLY to Super Admin */}
              {isSuperAdmin && (
                <>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Super Admin Persona Switcher ({isAustralia ? 'Ambizcon AU' : 'Ambizcon Health'})
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 my-1 pr-0.5">
                    {SEED_USERS.filter((persona) =>
                      isUserInCompany(persona, isAustralia ? 'Ambizcon' : 'Ambizcon Health - India')
                    ).map((persona) => {
                      const isCurrent = persona.email === currentUser.email;
                      return (
                        <button
                          key={persona.email}
                          onClick={async () => {
                            if (persona.company && persona.company !== 'India & Australia') {
                              setSelectedCompany(persona.company as any);
                            }
                            await login(persona.email);
                            closeAllMenus();
                          }}
                          className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Avatar
                              src={persona.avatar}
                              name={persona.name}
                              userId={(persona as any)._id}
                              email={persona.email}
                              size="sm"
                              className="h-7 w-7 shrink-0"
                            />
                            <div className="flex flex-col text-left min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold text-foreground">{persona.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">
                                  {persona.company === 'India & Australia' ? '🌐 IND & AUS' : persona.company === 'Ambizcon' ? '🇦🇺 AUS' : '🇮🇳 IND'}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-zinc-400 truncate">{persona.role} • {persona.team}</span>
                            </div>
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
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Upload Profile Pic (My Profile)</span>
                  </span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Edit Photo
                  </Badge>
                </Link>

                <Link
                  href="/profile"
                  onClick={closeAllMenus}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>My Profile &amp; Personal Details</span>
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
