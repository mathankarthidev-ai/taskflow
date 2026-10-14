'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  playNotificationChime,
  resolveNotificationSoundType,
} from '@/lib/audio-chime';

export interface AppNotification {
  id: string;
  type:
    | 'assigned'
    | 'updated'
    | 'task_update'
    | 'system'
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
  popupAlerts: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'unread'> & { id?: string }) => void;
  dismissPopupAlert: (id: string) => void;
  dismissAllPopupAlerts: () => void;
  markAllRead: () => void;
  markAsRead: (id: string) => void;
  markChatChannelRead: (channelId?: string) => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      popupAlerts: [],
      addNotification: (notif) =>
        set((state) => {
          const isInsideChatPage =
            typeof window !== 'undefined' && window.location.pathname.startsWith('/chat');

          // If user is already inside /chat, do NOT create chat notifications or right-side chat popups
          if (notif.type === 'chat_message' && isInsideChatPage) {
            return {
              notifications: (Array.isArray(state.notifications) ? state.notifications : []).filter(
                (n) => n && n.type !== 'chat_message'
              ),
              popupAlerts: (Array.isArray(state.popupAlerts) ? state.popupAlerts : []).filter(
                (p) => p && p.type !== 'chat_message'
              ),
            };
          }

          const newEntry: AppNotification = {
            ...notif,
            id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            time: 'Just now',
            unread: true,
          };
          const currentNotifs = Array.isArray(state.notifications) ? state.notifications : [];
          const currentPopups = Array.isArray(state.popupAlerts) ? state.popupAlerts : [];

          const existsInNotifs = currentNotifs.some((n) => n && n.id === newEntry.id);
          const existsInPopups = currentPopups.some((p) => p && p.id === newEntry.id);

          // Automatically play distinct notification sound for non-chat notifications
          // (chat sound is played by the chat receiver listener so senders don't hear their own outgoing msg)
          if (!existsInNotifs && newEntry.type !== 'chat_message' && typeof window !== 'undefined') {
            const soundType = resolveNotificationSoundType(newEntry);
            playNotificationChime(soundType);
          }

          return {
            notifications: existsInNotifs ? currentNotifs : [newEntry, ...currentNotifs],
            popupAlerts: existsInPopups ? currentPopups : [newEntry, ...currentPopups].slice(0, 6),
          };
        }),
      dismissPopupAlert: (id) =>
        set((state) => ({
          popupAlerts: (Array.isArray(state.popupAlerts) ? state.popupAlerts : []).filter(
            (p) => p && p.id !== id
          ),
        })),
      dismissAllPopupAlerts: () => set({ popupAlerts: [] }),
      markAllRead: () =>
        set((state) => ({
          notifications: (Array.isArray(state.notifications) ? state.notifications : []).map((n) => ({
            ...n,
            unread: false,
          })),
          popupAlerts: [],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: (Array.isArray(state.notifications) ? state.notifications : []).map((n) =>
            n.id === id ? { ...n, unread: false } : n
          ),
          popupAlerts: (Array.isArray(state.popupAlerts) ? state.popupAlerts : []).filter(
            (p) => p && p.id !== id
          ),
        })),
      markChatChannelRead: (channelId) =>
        set((state) => ({
          // Remove chat notifications from Notification Bell and Right-Side Pop-up Alerts when user views chat
          notifications: (Array.isArray(state.notifications) ? state.notifications : []).filter((n) => {
            if (!n) return false;
            if (n.type !== 'chat_message') return true;
            if (!channelId || !n.channelId || n.channelId === channelId) {
              return false;
            }
            return true;
          }),
          popupAlerts: (Array.isArray(state.popupAlerts) ? state.popupAlerts : []).filter((p) => {
            if (!p) return false;
            if (p.type !== 'chat_message') return true;
            if (!channelId || !p.channelId || p.channelId === channelId) {
              return false;
            }
            return true;
          }),
        })),
      clearAll: () => set({ notifications: [], popupAlerts: [] }),
    }),
    {
      name: 'taskflow_notifications_v3',
    }
  )
);
