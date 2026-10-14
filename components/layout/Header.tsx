'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  X,
  BellRing,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchTasksAction } from '@/actions/taskActions';
import { supabase } from '@/lib/supabase';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { isUserInCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import {
  HEALTH_CHECKLIST,
  INTERVAL_OPTIONS,
  DAILY_WELLNESS_HABITS,
  getDailyHabitIndex,
  getDailyShuffledCheckpoints,
  HealthQuote,
} from '@/components/attendance/HealthCheckModal';
import { playNotificationChime } from '@/lib/audio-chime';
import { fetchSelfReminders } from '@/lib/self-reminders-store';
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
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const toggleSearch = useSearchStore((s) => s.toggleSearch);
  const setCreateModalOpen = useTaskStore((s) => s.setCreateModalOpen);

  // When user is on /chat route, immediately erase all chat notifications and right-side popups
  useEffect(() => {
    if (pathname?.startsWith('/chat') && currentUser) {
      markChannelMessagesAsRead(undefined, currentUser._id);
      useNotificationStore.getState().markChatChannelRead();
      toast.dismiss();
    }
  }, [pathname, currentUser?._id]);

  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);

  type ActiveMenu = 'company' | 'birthday' | 'health' | 'notif' | 'persona' | null;
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [showBirthdaysInProfile, setShowBirthdaysInProfile] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Health Check Dropdown State with Daily Shuffle
  const [healthCompletedItems, setHealthCompletedItems] = useState<number[]>([]);
  const [healthIntervalMins, setHealthIntervalMins] = useState<number>(60);
  const [selectedHealthCheckpoint, setSelectedHealthCheckpoint] = useState<string>('all');
  const [currentHabitIndex, setCurrentHabitIndex] = useState<number>(() => getDailyHabitIndex());
  const [shuffledCheckpoints, setShuffledCheckpoints] = useState<HealthQuote[]>(() => getDailyShuffledCheckpoints());

  const currentHabit = DAILY_WELLNESS_HABITS[currentHabitIndex] || DAILY_WELLNESS_HABITS[0];

  const handleShuffleHabit = () => {
    setCurrentHabitIndex((prev) => (prev + 1) % DAILY_WELLNESS_HABITS.length);
    setShuffledCheckpoints((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
    toast.success('🔀 Shuffled daily wellness task & exercises!');
  };

  // System Notifications State (Includes Role-Targeted Reimbursement Note Alerts & Persistent Right-Side Pop-up Alerts)
  const rawNotificationsList = useNotificationStore((s) => s.notifications);
  const rawPopupAlerts = useNotificationStore((s) => s.popupAlerts);
  const markAllReadStore = useNotificationStore((s) => s.markAllRead);
  const markAsReadStore = useNotificationStore((s) => s.markAsRead);
  const dismissPopupAlert = useNotificationStore((s) => s.dismissPopupAlert);
  const dismissAllPopupAlerts = useNotificationStore((s) => s.dismissAllPopupAlerts);

  const isNotificationVisibleForUser = (n: any) => {
    if (!n) return false;
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
    if (n.senderName === currentUser.name) {
      return true;
    }
    return false;
  };

  // Filter notifications: show general notifications + notifications targeted at currentUser.role
  const notificationsList = (Array.isArray(rawNotificationsList) ? rawNotificationsList : []).filter(
    isNotificationVisibleForUser
  );

  const visiblePopupAlerts = (Array.isArray(rawPopupAlerts) ? rawPopupAlerts : []).filter(
    isNotificationVisibleForUser
  );

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const toggleMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const closeAllMenus = () => setActiveMenu(null);

  // Hourly Wellness Check Trigger — opens ONLY inside the navbar dropdown itself
  useEffect(() => {
    if (!currentUser) return;

    const handleOpenDropdown = () => {
      setActiveMenu('health');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('ambizcon_trigger_health_check', handleOpenDropdown);

    const INTERVAL_MS = healthIntervalMins * 60 * 1000;
    const storageKeyLast = `ambizcon_last_health_check_${currentUser._id}`;

    const checkWellnessAlert = () => {
      const now = Date.now();
      const lastCheckStr = localStorage.getItem(storageKeyLast);
      if (lastCheckStr) {
        const elapsed = now - Number(lastCheckStr);
        if (elapsed >= INTERVAL_MS) {
          localStorage.setItem(storageKeyLast, now.toString());
          // Open ONLY in navbar dropdown itself
          setActiveMenu('health');
          playNotificationChime('reminder');
          toast.info('🧘 Time for your Hourly Wellness Check!', {
            description: 'Take 60 seconds to reset posture, stretch, and hydrate in the navbar.',
          });
        }
      } else {
        localStorage.setItem(storageKeyLast, now.toString());
      }
    };

    const timer = setInterval(checkWellnessAlert, 20000);
    return () => {
      window.removeEventListener('ambizcon_trigger_health_check', handleOpenDropdown);
      clearInterval(timer);
    };
  }, [currentUser, healthIntervalMins]);

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

      // If user is currently inside /chat, mark read immediately, remove popups & notifications, and do NOT show popup/toast
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/chat')) {
        markChannelMessagesAsRead(undefined, currentUser._id);
        useNotificationStore.getState().markChatChannelRead();
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
      const existingNotifs = Array.isArray(useNotificationStore.getState().notifications)
        ? useNotificationStore.getState().notifications
        : [];
      const msgTextStr = String(message.text || '');
      const alreadyExists = existingNotifs.some(
        (n) =>
          n &&
          (n.messageId === message.id ||
            (n.type === 'chat_message' &&
              msgTextStr.length > 0 &&
              String(n.text || '').includes(msgTextStr) &&
              n.senderName === message.senderName))
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

      // Play distinct chat sound and show toast ONLY for the receiver (when not already in /chat)
      playNotificationChime('chat');
      toast.info(
        `💬 New Message from ${message.senderName} (${message.senderRole})`,
        {
          description: `${channelLabel}: "${
            message.text ? String(message.text).slice(0, 60) : 'Check Team Chat'
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
    try {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/chat')) {
        markChannelMessagesAsRead(undefined, currentUser._id);
        useNotificationStore.getState().markChatChannelRead();
      } else {
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
            const existingNotifs = Array.isArray(useNotificationStore.getState().notifications)
              ? useNotificationStore.getState().notifications
              : [];
            const msgText = String(msg.text || '');
            const hasNotif = existingNotifs.some(
              (n) =>
                n &&
                (n.messageId === msg.id ||
                  (n.type === 'chat_message' && msgText.length > 0 && String(n.text || '').includes(msgText)))
            );
            if (!hasNotif) {
              useNotificationStore.getState().addNotification({
                type: 'chat_message',
                category: msgChannelId === 'channel_all' ? 'All-in-One Chat (All Teams)' : 'Team Chat',
                title: `💬 ${msg.senderName} (${msg.senderRole}) sent a message`,
                text: `${msg.senderName}: "${msg.text || ''}"`,
                color: 'bg-teal-500',
                link: '/chat',
                channelId: msgChannelId,
                messageId: msg.id,
                senderName: msg.senderName,
                senderRole: msg.senderRole,
                targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
              });
            }

            // Play distinct chat sound once per receiver session for the latest unread message
            const alertKey = `ambizcon_chat_chime_${currentUser._id}_${msg.id}`;
            if (!sessionStorage.getItem(alertKey)) {
              sessionStorage.setItem(alertKey, '1');
              playNotificationChime('chat');
              toast.info(`💬 ${unreadInfo.total} New Message(s) in Chat`, {
                description: `${msg.senderName} (${msg.senderRole}): "${msg.text || ''}"`,
              });
            }
          }
        }
      }
    } catch (_) {}

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

    let lastTaskHash = '';
    // Poll server /api/chat & live Supabase team data every 5 seconds (plus Supabase Realtime)
    const pollServer = async () => {
      try {
        const { newMessages } = await syncMessagesFromServer();
        for (const item of newMessages) {
          triggerTeamChatAlert(item.message, item.channelId);
        }
      } catch (_) {}

      try {
        const freshTasks = await fetchTasksAction();
        if (Array.isArray(freshTasks)) {
          const nextHash = freshTasks.map((t) => `${t._id}:${t.status}:${t.updatedAt}`).join('|');
          if (lastTaskHash && nextHash !== lastTaskHash) {
            useTaskStore.getState().setTasks(freshTasks);
            window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
            window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
          } else if (!lastTaskHash) {
            useTaskStore.getState().setTasks(freshTasks);
          }
          lastTaskHash = nextHash;

          // Sync already-completed tasks (status === 'Done') into System Notifications & Right-Side Pop-up once per user
          const isAdminUser = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
          const completedTasksForUser = freshTasks
            .filter(
              (t) =>
                t &&
                t.status === 'Done' &&
                (isAdminUser ||
                  t.assignedTo === currentUser._id ||
                  t.createdBy === currentUser._id ||
                  t.team === currentUser.team)
            )
            .slice(0, 3);

          for (const doneTask of completedTasksForUser) {
            const syncKey = `ambizcon_done_alert_v2_${currentUser._id}_${doneTask._id}`;
            if (!localStorage.getItem(syncKey)) {
              localStorage.setItem(syncKey, '1');
              useNotificationStore.getState().addNotification({
                type: 'task_update',
                category: doneTask.reminderSettings?.enabled ? 'Reminder Completed' : 'Task Completed',
                title: `✅ Completed: ${doneTask.title}`,
                text: `"${doneTask.title}" (${doneTask.clientName || doneTask.team}) is marked as Completed (Done).`,
                color: 'bg-emerald-500',
                link: doneTask.reminderSettings?.enabled ? '/reminders' : '/kanban',
                taskId: doneTask._id,
                targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
              });
            }
          }

          // Also check Due Reminders with editable Trigger Time (t.reminderSettings?.enabled)
          const nowObj = new Date();
          const todayIsoStr = nowObj.toISOString().split('T')[0];
          const now24Str = `${String(nowObj.getHours()).padStart(2, '0')}:${String(nowObj.getMinutes()).padStart(2, '0')}`;
          const dueReminderTasks = freshTasks.filter(
            (t) =>
              t &&
              t.reminderSettings?.enabled &&
              t.status !== 'Done' &&
              (isAdminUser ||
                t.assignedTo === currentUser._id ||
                t.createdBy === currentUser._id ||
                t.team === currentUser.team)
          );
          for (const remTask of dueReminderTasks) {
            const rTime = remTask.reminderSettings?.reminderTime || '09:30 AM';
            const m = rTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            let r24 = rTime;
            if (m) {
              let h = parseInt(m[1], 10);
              const mins = m[2];
              const p = m[3].toUpperCase();
              if (p === 'PM' && h < 12) h += 12;
              if (p === 'AM' && h === 12) h = 0;
              r24 = `${String(h).padStart(2, '0')}:${mins}`;
            }
            const rDate = remTask.reminderSettings?.reminderDate || todayIsoStr;
            const isDueNow =
              (remTask.reminderSettings?.frequency === 'Daily' || rDate <= todayIsoStr) &&
              r24 <= now24Str;
            if (isDueNow) {
              const dueKey = `ambizcon_duerem_alert_v1_${currentUser._id}_${remTask._id}_${todayIsoStr}_${r24}`;
              if (!localStorage.getItem(dueKey)) {
                localStorage.setItem(dueKey, '1');
                useNotificationStore.getState().addNotification({
                  type: 'due_date_reminder',
                  category: 'Due Reminder Triggered',
                  title: `🔔 Reminder Alert: ${remTask.title}`,
                  text: `Scheduled ${remTask.reminderSettings?.frequency || 'Daily'} alert for ${remTask.clientName || remTask.team} at ${rTime}.`,
                  color: 'bg-amber-500',
                  link: '/reminders',
                  taskId: remTask._id,
                  targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
                });
              }
            }
          }
        }
      } catch (_) {}

      // Also check Self Reminders globally so due or already-completed reminders alert on any page
      try {
        const selfRems = await fetchSelfReminders(
          currentUser._id,
          currentUser.email,
          currentUser.name
        );
        if (Array.isArray(selfRems) && selfRems.length > 0) {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const nowTime24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          for (const rem of selfRems) {
            const to24 = (tStr: string) => {
              const m = (tStr || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
              if (!m) return tStr;
              let h = parseInt(m[1], 10);
              const mins = m[2];
              const p = m[3].toUpperCase();
              if (p === 'PM' && h < 12) h += 12;
              if (p === 'AM' && h === 12) h = 0;
              return `${String(h).padStart(2, '0')}:${mins}`;
            };
            const rem24 = to24(rem.reminder_time);
            const isDueToday = rem.reminder_date === todayStr && rem24 <= nowTime24;

            if (rem.is_completed || isDueToday) {
              const stateTag = rem.is_completed ? 'done' : 'due';
              const remSyncKey = `ambizcon_selfrem_alert_v2_${currentUser._id}_${rem.id}_${todayStr}_${stateTag}`;
              if (!localStorage.getItem(remSyncKey)) {
                localStorage.setItem(remSyncKey, '1');
                useNotificationStore.getState().addNotification({
                  type: 'system',
                  category: rem.is_completed ? 'Self Reminder Completed' : 'Self Reminder Alert',
                  title: rem.is_completed
                    ? `✅ Self Reminder Completed: ${rem.title}`
                    : `🔔 Self Reminder Due: ${rem.title}`,
                  text: `${rem.note || rem.title} • Scheduled at ${rem.reminder_time} (${rem.repeat_type})`,
                  color: rem.is_completed ? 'bg-emerald-500' : 'bg-amber-500',
                  link: '/self-reminders',
                  senderName: currentUser.name,
                  senderRole: currentUser.role,
                  targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member', 'Reception Staff'],
                });
              }
            }
          }
        }
      } catch (_) {}
    };
    pollServer();
    const pollInterval = setInterval(pollServer, 5000);

    // Instant Supabase Realtime listener across chat_messages, tasks, work_logs, attendance
    const realtimeChannel = supabase
      .channel('ambizcon_global_team_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          syncMessagesFromServer().then(({ newMessages }) => {
            for (const item of newMessages) {
              triggerTeamChatAlert(item.message, item.channelId);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasksAction().then((freshTasks) => {
            useTaskStore.getState().setTasks(freshTasks);
            window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_logs' },
        () => {
          window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reimbursements' },
        () => {
          window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
        }
      )
      .subscribe();

    window.addEventListener('taskflow_chat_message_sent', handleChatNotify);
    return () => {
      window.removeEventListener('taskflow_chat_message_sent', handleChatNotify);
      if (bc) {
        bc.removeEventListener('message', handleBroadcast);
      }
      clearInterval(pollInterval);
      supabase.removeChannel(realtimeChannel);
    };
  }, [currentUser?._id, currentUser?.team, currentUser?.role]);

  // 1-Click Manual Workspace Refresh for All Users
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear cached work_logs in localStorage so fresh Supabase data loads
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('ambizcon_work_logs_')) {
            localStorage.removeItem(k);
          }
        });
      }
      const freshTasks = await fetchTasksAction();
      useTaskStore.getState().setTasks(freshTasks);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
        window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
      }
      router.refresh();
    } catch (e) {}
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Workspace refreshed & data synced!');
    }, 500);
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

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isReception = currentUser?.role === 'Reception Staff';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';

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

  if (!currentUser) return null;

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

        {/* Company Branch Switcher: Super Admin Only */}
        {isSuperAdmin && (
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
                      onClick={() => {
                        const idx = DAILY_WELLNESS_HABITS.findIndex((h) => h.category === 'stretch');
                        if (idx !== -1) setCurrentHabitIndex(idx);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        currentHabit.category === 'stretch'
                          ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Activity className="h-3 w-3 text-emerald-500" />
                      Stretches
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const idx = DAILY_WELLNESS_HABITS.findIndex((h) => h.category === 'water');
                        if (idx !== -1) setCurrentHabitIndex(idx);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        currentHabit.category === 'water'
                          ? 'bg-white dark:bg-zinc-700 text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Droplets className="h-3 w-3 text-blue-500" />
                      Hydration
                    </button>
                    <button
                      type="button"
                      onClick={handleShuffleHabit}
                      title="Daily Shuffle inside task & exercises"
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold bg-brand-500/15 text-brand-600 dark:text-brand-300 hover:bg-brand-500/25 transition-all"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Shuffle
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Take 60 seconds to reset your posture, stretch muscles, and rest your eyes before continuing your tasks.
                </p>
              </div>

              {/* Ergonomic Habit Builder Banner with Daily Shuffle */}
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-emerald-500/5 via-brand-500/5 to-purple-500/5 p-3 flex items-center gap-3 relative">
                <img
                  src={currentHabit.gif}
                  alt={currentHabit.title}
                  className="h-16 w-20 rounded-lg object-cover border border-zinc-200/60 dark:border-zinc-700/60 shrink-0 bg-zinc-900"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span className="truncate">{currentHabit.badge}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleShuffleHabit}
                      className="text-[9px] font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Shuffle Task
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {currentHabit.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {currentHabit.description}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {currentHabit.goal}
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
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <span>10 Health Checkpoints</span>
                    <span className="text-[10px] font-normal text-muted-foreground">(Daily Shuffled)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {healthCompletedItems.length} of {HEALTH_CHECKLIST.length} completed
                    </span>
                    <button
                      type="button"
                      onClick={handleShuffleHabit}
                      title="Shuffle checkpoint list order"
                      className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw className="h-2.5 w-2.5" />
                      Shuffle
                    </button>
                  </div>
                </div>

                {/* Select Dropdown to Choose Checkpoint */}
                <select
                  value={selectedHealthCheckpoint}
                  onChange={(e) => setSelectedHealthCheckpoint(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">📋 Show All 10 Health Checkpoints (Choose below)</option>
                  {shuffledCheckpoints.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.id}. {item.emoji} {item.title} {healthCompletedItems.includes(item.id) ? '✓' : ''}
                    </option>
                  ))}
                </select>

                {/* Filtered Checkpoint List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {shuffledCheckpoints.filter(
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
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Navbar Quick Wellness
                  </span>
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

              {/* Distinct Notification Sound Recognizer Bar */}
              <div className="pt-2.5 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  🔊 Distinct Alert Sounds (Click to Recognize):
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChime('chat');
                      toast.success('💬 Chat Sound: Double Pop + Ping');
                    }}
                    className="rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 text-[10px] font-extrabold text-teal-600 dark:text-teal-400 text-left transition-colors"
                  >
                    💬 Chat Msg Sound
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChime('reminder');
                      toast.success('⏰ Reminder Sound: 3-Note Bell Alarm');
                    }}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 text-left transition-colors"
                  >
                    ⏰ Reminder Sound
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChime('self_reminder');
                      toast.success('🔔 Self Reminder: 4-Note Warm Melody');
                    }}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 text-[10px] font-extrabold text-purple-600 dark:text-purple-400 text-left transition-colors"
                  >
                    🔔 Self Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChime('task_assigned');
                      toast.success('📌 Task Assigned: 2-Chord Brass Fanfare');
                    }}
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 text-left transition-colors"
                  >
                    📌 Task Assigned
                  </button>
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
            <div className="absolute right-0 mt-2 w-80 sm:w-[350px] max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3.5 shadow-xl glass-panel z-50 animate-fade">
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

              {/* Theme & Birthday Controls Inside Profile */}
              <div className="space-y-2 mb-2 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                {/* Theme Mode Switcher */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="h-3.5 w-3.5 text-purple-400" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span className="text-xs font-bold text-foreground">Theme</span>
                  </div>
                  <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/40 dark:border-zinc-700/40">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        theme === 'light'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Sun className="h-3 w-3 text-amber-500" />
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Moon className="h-3 w-3 text-purple-400" />
                      Dark
                    </button>
                  </div>
                </div>

                {/* Team Birthdays Section */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setShowBirthdaysInProfile((prev) => !prev)}
                    className="w-full flex items-center justify-between p-2 text-xs font-bold text-foreground hover:bg-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Cake className="h-3.5 w-3.5 text-amber-500" />
                      <span>Team Birthdays</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {showBirthdaysInProfile ? 'Hide' : 'View (12 Mo)'}
                      </span>
                      <ChevronDown
                        className={`h-3 w-3 text-amber-600 transition-transform duration-200 ${
                          showBirthdaysInProfile ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {showBirthdaysInProfile && (
                    <div className="p-2 pt-0 border-t border-amber-500/20 max-h-56 overflow-y-auto space-y-2 bg-background/50">
                      <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>{isAustralia ? 'Ambizcon AU' : 'Ambizcon Health'}</span>
                        <span className="text-amber-600 font-mono">12 Months</span>
                      </div>
                      {MONTH_WISE_BIRTHDAYS.map((m) => {
                        const branchUsers = m.users.filter((u) =>
                          isUserInCompany(u, isAustralia ? 'Ambizcon' : 'Ambizcon Health - India')
                        );
                        if (branchUsers.length === 0) return null;
                        return (
                          <div key={m.month} className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-zinc-200/40 dark:border-zinc-800/40 pb-0.5">
                              {m.month}
                            </span>
                            {branchUsers.map((u) => (
                              <div
                                key={u.name}
                                className="flex items-center justify-between p-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
                              >
                                <div className="min-w-0 pr-1">
                                  <span className="font-bold text-foreground block text-[11px] truncate">
                                    {u.name}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground truncate block">
                                    {u.role} • {u.team}
                                  </span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[9px] text-amber-600 border-amber-500/30 shrink-0"
                                >
                                  {u.date}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

      {/* Persistent Right-Side Notification & Alert Pop-up (Stays open until user clicks Close) */}
      {visiblePopupAlerts.length > 0 && (
        <div className="fixed top-20 right-4 z-[95] w-80 sm:w-96 max-w-[calc(100vw-24px)] space-y-2.5 pointer-events-none">
          {visiblePopupAlerts.length > 1 && (
            <div className="flex justify-end pointer-events-auto">
              <button
                type="button"
                onClick={dismissAllPopupAlerts}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300/80 dark:border-zinc-700/80 bg-background/95 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 shadow-md transition-all"
              >
                <X className="h-3 w-3" />
                Close All Alerts ({visiblePopupAlerts.length})
              </button>
            </div>
          )}

          {visiblePopupAlerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="pointer-events-auto rounded-2xl border-2 border-emerald-500/50 dark:border-emerald-500/40 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-xl p-3.5 shadow-2xl transition-all animate-fade"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div
                    className={`h-8 w-8 rounded-xl ${
                      alert.color || 'bg-emerald-500'
                    } text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5`}
                  >
                    <BellRing className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {alert.category || 'Notification Alert'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {alert.time || 'Just now'}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-foreground mt-1 leading-snug break-words">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed break-words">
                      {alert.text}
                    </p>
                  </div>
                </div>

                {/* Explicit Close Button (Only closes when user clicks this) */}
                <button
                  type="button"
                  onClick={() => dismissPopupAlert(alert.id)}
                  className="h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors"
                  title="Close Alert Pop-up"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    dismissPopupAlert(alert.id);
                    handleNotificationClick(alert);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-colors"
                >
                  Open Details
                </button>
                <button
                  type="button"
                  onClick={() => dismissPopupAlert(alert.id)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/10 hover:text-rose-500 text-foreground border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Close Pop-up
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member In-App Camera QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />
    </header>
  );
}
