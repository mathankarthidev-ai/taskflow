'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AppNotification {
  id: string;
  type:
    | 'assigned'
    | 'updated'
    | 'due_date_reminder'
    | 'overdue'
    | 'comment'
    | 'task_completed'
    | 'task_approval'
    | 'review_assigned'
    | 'client_approval'
    | 'chat_message'
    | 'reimbursement_note';
  title: string;
  text: string;
  time: string;
  unread: boolean;
  color: string;
  category: string;
  taskId?: string;
  claimId?: string;
  claimNo?: string;
  channelId?: string;
  messageId?: string;
  targetTeam?: string;
  link?: string;
  targetRoles?: ('Super Admin' | 'Admin' | 'Team Lead' | 'Team Member' | 'Reception Staff')[];
  senderName?: string;
  senderRole?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'unread'>) => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'assigned',
    category: 'Task Assigned',
    title: '📌 Task Assigned to You',
    text: 'Deva Priya assigned "Redesign SaaS Dashboard & Component Library" to your workload.',
    time: '5m ago',
    unread: true,
    color: 'bg-blue-500',
  },
  {
    id: 'notif_2',
    type: 'updated',
    category: 'Task Updated',
    title: '✏️ Task Updated',
    text: 'Priority raised to Critical for "Setup Next.js 15 App Router & Auth Provider".',
    time: '18m ago',
    unread: true,
    color: 'bg-indigo-500',
  },
  {
    id: 'notif_3',
    type: 'due_date_reminder',
    category: 'Due Date Reminder',
    title: '⏰ Due Date Reminder',
    text: '"Figma Component System UI Kit" is due today by 5:00 PM IST.',
    time: '45m ago',
    unread: true,
    color: 'bg-amber-500',
  },
  {
    id: 'notif_4',
    type: 'overdue',
    category: 'Overdue Notification',
    title: '🚨 Overdue Task Alert',
    text: '"Mobile App Wireframes & Interactive Prototypes" has passed its due date!',
    time: '1h ago',
    unread: true,
    color: 'bg-rose-500',
  },
  {
    id: 'notif_5',
    type: 'comment',
    category: 'Comment / Mention',
    title: '💬 Comment & @Mention',
    text: 'Aravind Kalaivanan mentioned you in "API Integration & Auth Middleware".',
    time: '2h ago',
    unread: true,
    color: 'bg-purple-500',
  },
  {
    id: 'notif_6',
    type: 'task_completed',
    category: 'Task Completed',
    title: '✅ Task Completed',
    text: 'Kennath Franklin marked "SEO Meta & Schema Tags Audit" as Completed & Done!',
    time: '3h ago',
    unread: false,
    color: 'bg-emerald-500',
  },
  {
    id: 'notif_7',
    type: 'task_approval',
    category: 'Task Approval Request',
    title: '🛡️ Member Task Pending Approval',
    text: 'Member Mathankarthidev created "New Landing Page Redesign". Requires TL approval.',
    time: '4h ago',
    unread: true,
    color: 'bg-amber-600',
  },
  {
    id: 'notif_8',
    type: 'review_assigned',
    category: 'Reviewer Assignment',
    title: '🔍 Assigned as Task Reviewer',
    text: 'You were assigned as Reviewer for "Database Schema Migration & Indexes".',
    time: '5h ago',
    unread: false,
    color: 'bg-purple-600',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      addNotification: (notif) =>
        set((state) => ({
          notifications: [
            {
              ...notif,
              id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              time: 'Just now',
              unread: true,
            },
            ...state.notifications,
          ],
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, unread: false })),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'taskflow_notifications_v2',
    }
  )
);
