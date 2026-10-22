'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ChatChannel, ChatMessage, TeamName, User } from '@/types';
import {
  getStoredChannels,
  getStoredMessages,
  sendChatMessage,
  deleteChatMessage,
  clearChannelMessages,
  clearAllStoredMessages,
  createDirectChannel,
  createGroupChannel,
  deleteGroupChannel,
  getChatBroadcastChannel,
  getNewChatMessageCount,
  extractDmParticipantIds,
  getUnreadMessageIdsForChannel,
  isUserReceiverForChatMessage,
  markChannelMessagesAsRead,
  resolveDirectChannelForUser,
  syncMessagesFromServer,
} from '@/lib/chat-db';
import { playNotificationChime } from '@/lib/audio-chime';
import { fetchAllUsersAction } from '@/actions/userActions';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Paperclip,
  Link as LinkIcon,
  Plus,
  Users,
  Building2,
  Shield,
  FileText,
  ExternalLink,
  Search,
  CheckCircle,
  Globe,
  UserCheck,
  Trash2,
  Volume2,
  AlertTriangle,
  Bell,
  ArrowLeft,
  Home,
  Reply,
  AtSign,
  X,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, formatDate } from '@/lib/utils';

export default function TeamChatPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('channel_all');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({});
  const [totalUnreadChat, setTotalUnreadChat] = useState<number>(0);
  const [newMsgIdsInActiveView, setNewMsgIdsInActiveView] = useState<string[]>([]);

  // Form State
  const [messageText, setMessageText] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [showLinkField, setShowLinkField] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; size?: string; type?: string } | null>(null);

  // Reply & Mention State
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Admin New Group Modal State
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupScope, setNewGroupScope] = useState<'all' | 'team'>('all');
  const [newGroupTeam, setNewGroupTeam] = useState<TeamName>('Creative');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Submission lock & window instance ID to prevent double paste
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const windowInstanceIdRef = useRef<string>(
    typeof window !== 'undefined' ? `win_${Math.random().toString(36).slice(2, 9)}` : 'srv'
  );

  // Direct DM Modal State
  const [isNewDmModalOpen, setIsNewDmModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

  // Helper to get all channel IDs belonging to the EXACT SAME Direct DM participant pair (in case duplicate DM channels exist)
  const getRelatedChannelIds = (channelId: string, allChs: ChatChannel[] = channels): string[] => {
    if (!currentUser || !channelId.startsWith('dm_')) return [channelId];
    const targetParts = extractDmParticipantIds(channelId).sort();
    if (targetParts.length < 2) return [channelId];
    if (!targetParts.includes(currentUser._id)) return [channelId];

    const matchingIds = allChs
      .filter((c) => {
        if (c.scope !== 'direct' && !c.id.startsWith('dm_')) return false;
        const cParts = extractDmParticipantIds(c.id).sort();
        if (cParts.length < 2) return false;
        return cParts[0] === targetParts[0] && cParts[1] === targetParts[1];
      })
      .map((c) => c.id);

    return matchingIds.length > 0 ? Array.from(new Set([channelId, ...matchingIds])) : [channelId];
  };

  const loadMergedMessagesForChannel = (channelId: string, allChs: ChatChannel[] = channels): ChatMessage[] => {
    const relatedIds = getRelatedChannelIds(channelId, allChs);
    const isDm = channelId.startsWith('dm_');
    const dmParts = isDm ? extractDmParticipantIds(channelId) : [];

    const merged: ChatMessage[] = [];
    const seen = new Set<string>();
    for (const id of relatedIds) {
      for (const m of getStoredMessages(id)) {
        if (!m || !m.id || seen.has(m.id)) continue;
        // Extra security: strictly isolate DM messages to the 2 participants of this channel
        if (isDm && dmParts.length === 2 && m.senderId) {
          if (!dmParts.includes(m.senderId)) {
            // Stray message from a third party — never leak into this private DM
            continue;
          }
        }
        seen.add(m.id);
        merged.push(m);
      }
    }
    return merged.sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  };

  const refreshUnreadCounts = () => {
    if (!currentUser) return;
    // The active channel is currently in view — mark it as read immediately
    markChannelMessagesAsRead(activeChannelId, currentUser._id);
    useNotificationStore.getState().markChatChannelRead(activeChannelId);

    const res = getNewChatMessageCount(
      currentUser.team,
      currentUser.role,
      currentUser._id,
      currentUser.name,
      true
    );

    const updated = { ...res.byChannel };
    // Active channel currently in view MUST ALWAYS have 0 unread badge
    delete updated[activeChannelId];
    const related = getRelatedChannelIds(activeChannelId);
    for (const rId of related) {
      delete updated[rId];
    }
    setUnreadByChannel(updated);
    setTotalUnreadChat(Object.values(updated).reduce((a, b) => a + b, 0));
  };

  useEffect(() => {
    fetchAllUsersAction().then((list) => {
      if (Array.isArray(list)) {
        import('@/lib/avatar-store').then(({ syncUsersAvatarsToLocalStore }) => {
          syncUsersAvatarsToLocalStore(list);
        });
      }
      setUsers(list || []);
    });
    const loadedChannels = getStoredChannels();
    setChannels(loadedChannels);
    if (currentUser) {
      markChannelMessagesAsRead(activeChannelId, currentUser._id);
      useNotificationStore.getState().markChatChannelRead(activeChannelId);
      toast.dismiss();
    }
    refreshUnreadCounts();
  }, [currentUser]);

  // When user opens or views activeChannelId:
  // Immediately mark all messages in the channel as read and remove popups/notifications
  useEffect(() => {
    if (activeChannelId && currentUser) {
      if (activeChannelId.startsWith('dm_')) {
        const parts = extractDmParticipantIds(activeChannelId);
        if (parts.length >= 2 && !parts.includes(currentUser._id)) {
          setActiveChannelId('channel_all');
          return;
        }
      }

      const currentChs = getStoredChannels();
      const msgs = loadMergedMessagesForChannel(activeChannelId, currentChs);
      setMessages(msgs);
      setNewMsgIdsInActiveView([]);

      markChannelMessagesAsRead(activeChannelId, currentUser._id);
      useNotificationStore.getState().markChatChannelRead(activeChannelId);
      toast.dismiss();
      refreshUnreadCounts();
    }
  }, [activeChannelId, currentUser?._id, users.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-clear any transient "New Msg" indicator inside active view after 3 seconds once seen
  useEffect(() => {
    if (newMsgIdsInActiveView.length === 0) return;
    const t = setTimeout(() => {
      setNewMsgIdsInActiveView([]);
    }, 3000);
    return () => clearTimeout(t);
  }, [newMsgIdsInActiveView]);

  // Real-time synchronization & cross-tab / cross-session events listener
  useEffect(() => {
    const appendIncomingMessage = (channelId: string, message: ChatMessage, originWindowId?: string) => {
      if (originWindowId && originWindowId === windowInstanceIdRef.current) {
        return;
      }

      const isReceiver = isUserReceiverForChatMessage(message, channelId, currentUser);
      const currentChs = getStoredChannels();
      const relatedActiveIds = getRelatedChannelIds(activeChannelId, currentChs);

      if (relatedActiveIds.includes(channelId) && message) {
        if (message.senderId !== currentUser?._id && message.senderName !== currentUser?.name) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            const last = prev[prev.length - 1];
            if (
              last &&
              last.senderId === message.senderId &&
              last.text === message.text &&
              Math.abs(new Date(message.createdAt).getTime() - new Date(last.createdAt).getTime()) < 2000
            ) {
              return prev;
            }
            return [...prev, message];
          });
          setNewMsgIdsInActiveView((prev) => (prev.includes(message.id) ? prev : [...prev, message.id]));
        }
      }

      if (currentUser && relatedActiveIds.includes(channelId)) {
        markChannelMessagesAsRead(activeChannelId, currentUser._id);
        useNotificationStore.getState().markChatChannelRead(activeChannelId);
      }

      // Only play distinct chat notification sound for RECEIVERS — NEVER for the sender!
      if (isReceiver) {
        playNotificationChime('chat');
      }

      setChannels(getStoredChannels());
      refreshUnreadCounts();
    };

    const handleRemoteMessage = (e: any) => {
      const { channelId, message, originWindowId } = e.detail || {};
      if (!message) return;
      appendIncomingMessage(channelId, message, originWindowId);
    };

    const handleDeletedMessage = (e: any) => {
      const { channelId, messageId } = e.detail || {};
      const currentChs = getStoredChannels();
      const relatedActiveIds = getRelatedChannelIds(activeChannelId, currentChs);
      if (relatedActiveIds.includes(channelId) && messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
      setChannels(currentChs);
      refreshUnreadCounts();
    };

    const handleChannelChange = () => {
      const updated = getStoredChannels();
      setChannels(updated);
      refreshUnreadCounts();
    };

    const bc = getChatBroadcastChannel();
    const handleBroadcast = (ev: MessageEvent) => {
      if (ev.data?.type === 'CHAT_MESSAGE_SENT' && ev.data?.message) {
        appendIncomingMessage(ev.data.channelId, ev.data.message, ev.data.originWindowId);
      } else if (ev.data?.type === 'CHAT_CHANNEL_CREATED' || ev.data?.type === 'CHAT_CHANNEL_DELETED') {
        handleChannelChange();
      }
    };
    if (bc) {
      bc.addEventListener('message', handleBroadcast);
    }

    const handleSyncedFromServer = (e: any) => {
      const currentChs = getStoredChannels();
      const relatedActiveIds = getRelatedChannelIds(activeChannelId, currentChs);
      const newMessages = e?.detail?.newMessages || [];

      if (newMessages.length > 0 && currentUser) {
        const newlyInActive = newMessages
          .filter(
            (item: any) =>
              relatedActiveIds.includes(item.channelId) &&
              isUserReceiverForChatMessage(item.message, item.channelId, currentUser)
          )
          .map((item: any) => item.message.id);

        if (newlyInActive.length > 0) {
          setNewMsgIdsInActiveView((prev) => Array.from(new Set([...prev, ...newlyInActive])));
        }

        const hasIncomingForReceiver = newMessages.some((item: any) =>
          isUserReceiverForChatMessage(item.message, item.channelId, currentUser)
        );
        if (hasIncomingForReceiver) {
          playNotificationChime('chat');
        }
      }

      if (currentUser) {
        markChannelMessagesAsRead(activeChannelId, currentUser._id);
        useNotificationStore.getState().markChatChannelRead(activeChannelId);
      }

      setMessages(loadMergedMessagesForChannel(activeChannelId, currentChs));
      setChannels(currentChs);
      refreshUnreadCounts();
    };

    const pollChatServer = async () => {
      await syncMessagesFromServer();
      const currentChs = getStoredChannels();
      if (currentUser) {
        markChannelMessagesAsRead(activeChannelId, currentUser._id);
        useNotificationStore.getState().markChatChannelRead(activeChannelId);
      }
      const nextMsgs = loadMergedMessagesForChannel(activeChannelId, currentChs);
      setMessages((prev) => {
        if (
          prev.length !== nextMsgs.length ||
          (nextMsgs.length > 0 && prev[prev.length - 1]?.id !== nextMsgs[nextMsgs.length - 1]?.id)
        ) {
          return nextMsgs;
        }
        return prev;
      });
      setChannels(currentChs);
      refreshUnreadCounts();
    };
    pollChatServer();
    const pollTimer = setInterval(pollChatServer, 2000);

    // Subscribe to Supabase Realtime on chat_messages for instant cross-device delivery
    const realtimeSub = supabase
      .channel(`chat_live_${activeChannelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          pollChatServer();
        }
      )
      .subscribe();

    window.addEventListener('taskflow_chat_message_sent', handleRemoteMessage);
    window.addEventListener('taskflow_chat_message_deleted', handleDeletedMessage);
    window.addEventListener('taskflow_chat_channel_created', handleChannelChange);
    window.addEventListener('taskflow_chat_channel_deleted', handleChannelChange);
    window.addEventListener('taskflow_chat_synced', handleSyncedFromServer);
    window.addEventListener('taskflow_chat_unread_updated', refreshUnreadCounts);
    window.addEventListener('storage', handleSyncedFromServer);
    return () => {
      window.removeEventListener('taskflow_chat_message_sent', handleRemoteMessage);
      window.removeEventListener('taskflow_chat_message_deleted', handleDeletedMessage);
      window.removeEventListener('taskflow_chat_channel_created', handleChannelChange);
      window.removeEventListener('taskflow_chat_channel_deleted', handleChannelChange);
      window.removeEventListener('taskflow_chat_synced', handleSyncedFromServer);
      window.removeEventListener('taskflow_chat_unread_updated', refreshUnreadCounts);
      window.removeEventListener('storage', handleSyncedFromServer);
      if (bc) {
        bc.removeEventListener('message', handleBroadcast);
      }
      clearInterval(pollTimer);
      supabase.removeChannel(realtimeSub);
    };
  }, [activeChannelId, currentUser?._id, currentUser?.name, currentUser?.team, currentUser?.role]);

  if (!currentUser) return null;

  const rawActiveChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const activeChannel = (() => {
    if (!rawActiveChannel) return channels[0];
    if (rawActiveChannel.scope === 'direct') {
      const resolved = resolveDirectChannelForUser(rawActiveChannel, currentUser, users);
      if (resolved.partnerKey) {
        return {
          ...rawActiveChannel,
          name: resolved.displayName,
          description: resolved.description,
        };
      }
    }
    return rawActiveChannel;
  })();

  // Mention & Reply Helpers
  const extractMentionsFromText = (text: string): string[] => {
    const list: string[] = [];
    for (const u of users) {
      if (text.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
        list.push(u.name);
      }
    }
    return Array.from(new Set(list));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageText(val);

    // Auto-grow height smoothly up to max
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;

    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.slice(lastAtIdx + 1);
      if (!query.includes(' ') && !query.includes('\n') && query.length <= 20) {
        setMentionQuery(query.toLowerCase());
        setMentionStartIndex(lastAtIdx);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: allow native newline insertion
        return;
      }
      // Enter without Shift: submit message
      e.preventDefault();
      if (!isSending && (messageText.trim() || attachedFile || linkInput.trim())) {
        handleSendMessage();
      }
    }
  };

  const handleSelectMention = (targetUser: User) => {
    if (mentionStartIndex === -1) {
      setMessageText((prev) => `${prev}@${targetUser.name} `);
    } else {
      const before = messageText.slice(0, mentionStartIndex);
      const cursorPos = inputRef.current?.selectionStart || messageText.length;
      const after = messageText.slice(cursorPos);
      setMessageText(`${before}@${targetUser.name} ${after}`);
    }
    setMentionQuery(null);
    setMentionStartIndex(-1);
    inputRef.current?.focus();
  };

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingTo({
      id: msg.id,
      senderName: msg.senderName,
      text: msg.text || (msg.fileAttachment ? `Attached: ${msg.fileAttachment.name}` : 'Link'),
    });
    // If text does not already tag the sender, prefill with @SenderName
    if (!messageText.includes(`@${msg.senderName}`)) {
      setMessageText((prev) => (prev ? `@${msg.senderName} ${prev}` : `@${msg.senderName} `));
    }
    inputRef.current?.focus();
  };

  const scrollToMessage = (msgId?: string) => {
    if (!msgId) return;
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-brand-500', 'bg-brand-500/10');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-brand-500', 'bg-brand-500/10');
      }, 2000);
    } else {
      toast.info('Referenced message is earlier in chat history');
    }
  };

  const renderFormattedText = (text: string, isMe: boolean) => {
    if (!text) return null;
    const parts = text.split(/(@[A-Za-z0-9 _.-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const candidate = part.slice(1).trim();
        const isMatched = users.some(
          (u) =>
            u.name.toLowerCase() === candidate.toLowerCase() ||
            candidate.toLowerCase().startsWith(u.name.toLowerCase())
        ) || candidate.length > 0;

        if (isMatched) {
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-extrabold text-[11px] mx-0.5 shadow-sm ${
                isMe
                  ? 'bg-white/25 text-white border border-white/40'
                  : 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30'
              }`}
            >
              <span className="opacity-80">@</span>
              {candidate}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Admin Group Creation Handler
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only Admins can create new chat groups');
      return;
    }
    const name = newGroupName.trim();
    if (!name) {
      toast.error('Please enter a group name');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const res = createGroupChannel(
        {
          _id: currentUser._id,
          name: currentUser.name,
          role: currentUser.role,
          team: currentUser.team,
          avatar: currentUser.avatar,
        },
        name,
        newGroupScope,
        newGroupScope === 'team' ? newGroupTeam : undefined,
        newGroupDescription.trim()
      );

      if (!res.success || !res.channel) {
        toast.error(res.error || 'Failed to create group');
        return;
      }

      setChannels(getStoredChannels());
      setActiveChannelId(res.channel.id);
      setIsNewGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      toast.success(`Group "${res.channel.name}" created successfully!`);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteCustomGroup = () => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to permanently delete group "${activeChannel?.name}"? All its messages will be wiped.`)) {
      const ok = deleteGroupChannel(activeChannelId, currentUser.role);
      if (ok) {
        setChannels(getStoredChannels());
        setActiveChannelId('channel_all');
        toast.success('Group deleted successfully');
      } else {
        toast.error('Cannot delete default system groups');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size > MAX_SIZE) {
      toast.error(`File "${file.name}" exceeds 5MB limit!`, {
        description: `Selected file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });
      return;
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const url = URL.createObjectURL(file);
    setAttachedFile({
      name: file.name,
      url,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
    });
    toast.success(`Attached file "${file.name}" (< 5MB limit verified)`);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Check 1: Guard against rapid double click or multiple submit events
    if (isSendingRef.current) return;

    const textToSend = messageText.trim();
    const fileToSend = attachedFile;
    const linkToSend = linkInput.trim();
    const currentReply = replyingTo;

    if (!textToSend && !fileToSend && !linkToSend) {
      toast.error('Please enter a message, link, or attach a file');
      return;
    }

    // Check 2: Immediately lock submission and clear form inputs so no second submit can grab the text
    isSendingRef.current = true;
    setIsSending(true);
    setMessageText('');
    setLinkInput('');
    setShowLinkField(false);
    setAttachedFile(null);
    setReplyingTo(null);
    setMentionQuery(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const extractedMentions = extractMentionsFromText(textToSend);
    if (currentReply && !extractedMentions.includes(currentReply.senderName)) {
      extractedMentions.push(currentReply.senderName);
    }

    try {
      const created = sendChatMessage(
        activeChannelId,
        {
          _id: currentUser._id,
          name: currentUser.name,
          role: currentUser.role,
          team: currentUser.team,
          avatar: currentUser.avatar,
        },
        textToSend,
        fileToSend || undefined,
        linkToSend || undefined,
        windowInstanceIdRef.current,
        currentReply || undefined,
        extractedMentions
      );

      // Targeted notification for Reply
      if (currentReply && currentReply.senderName !== currentUser.name) {
        useNotificationStore.getState().addNotification({
          type: 'chat_message',
          category: activeChannel?.name || 'Group Chat',
          title: `💬 ${currentUser.name} replied to your message in ${activeChannel?.name || 'Group Chat'}`,
          text: `"${textToSend || (fileToSend ? `Attached: ${fileToSend.name}` : 'Shared a link')}"`,
          color: 'bg-brand-500',
          link: '/chat',
          channelId: activeChannelId,
          messageId: created.id,
          targetUserNames: [currentReply.senderName],
          senderName: currentUser.name,
          senderRole: currentUser.role,
        });
      }

      // Targeted notification for Mentions
      const nonSelfMentions = extractedMentions.filter(
        (name) => name.toLowerCase() !== currentUser.name.toLowerCase() && (!currentReply || name !== currentReply.senderName)
      );
      if (nonSelfMentions.length > 0) {
        useNotificationStore.getState().addNotification({
          type: 'chat_message',
          category: activeChannel?.name || 'Group Chat',
          title: `📣 ${currentUser.name} mentioned you in ${activeChannel?.name || 'Group Chat'}`,
          text: `"${textToSend || (fileToSend ? `Attached: ${fileToSend.name}` : 'Shared a link')}"`,
          color: 'bg-purple-500',
          link: '/chat',
          channelId: activeChannelId,
          messageId: created.id,
          targetUserNames: nonSelfMentions,
          senderName: currentUser.name,
          senderRole: currentUser.role,
        });
      }

      // NOTE: Do NOT play sound or show broadcast toast to the sender!
      // Only receivers (Member, Team, or All-in-One) receive the notification & sound.
      const isAllInOne = activeChannelId === 'channel_all';

      // Store notification for RECEIVERS (filtered out for sender in Header & Sidebar)
      useNotificationStore.getState().addNotification({
        type: 'chat_message',
        category: isAllInOne ? 'All-in-One Chat (All Teams)' : (activeChannel?.name || 'Group Chat'),
        title: isAllInOne
          ? `💬 ${currentUser.name} (${currentUser.role}) in All-in-One Chat`
          : `💬 New Message in ${activeChannel?.name || 'Group Chat'}`,
        text: `${currentUser.name}: "${
          textToSend || (fileToSend ? `Attached: ${fileToSend.name}` : 'Shared a link')
        }"`,
        color: 'bg-teal-500',
        link: '/chat',
        channelId: activeChannelId,
        messageId: created.id,
        targetTeam: activeChannel?.team,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
      });

      // Check 3: Add to messages state with deduplication by ID and recent identical content
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        const last = prev[prev.length - 1];
        if (
          last &&
          last.senderId === created.senderId &&
          last.text === created.text &&
          Math.abs(new Date(created.createdAt).getTime() - new Date(last.createdAt).getTime()) < 2000
        ) {
          return prev;
        }
        return [...prev, created];
      });

      setNewMsgIdsInActiveView([]);
      markChannelMessagesAsRead(activeChannelId, currentUser._id);
      useNotificationStore.getState().markChatChannelRead(activeChannelId);
      setChannels(getStoredChannels());
      refreshUnreadCounts();
      window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
    } finally {
      // Cooldown debounce window (400ms) before unlocking send button
      setTimeout(() => {
        isSendingRef.current = false;
        setIsSending(false);
      }, 400);
    }
  };

  // Admin delete message action
  const handleDeleteMessage = (msgId: string) => {
    const success = deleteChatMessage(activeChannelId, msgId);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setChannels(getStoredChannels());
      refreshUnreadCounts();
      toast.success('Message deleted from group');
    }
  };

  // Admin clear current channel messages
  const handleClearGroup = () => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to delete all messages in "${activeChannel?.name}"? This action cannot be undone.`)) {
      clearChannelMessages(activeChannelId);
      setMessages([]);
      setChannels(getStoredChannels());
      toast.success(`All messages removed from ${activeChannel?.name}`);
    }
  };

  // Admin clear all messages across all channels
  const handleClearAllChats = () => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently clear all messages across ALL groups and direct chats?')) {
      clearAllStoredMessages();
      setMessages([]);
      setChannels(getStoredChannels());
      toast.success('All chat message history has been wiped.');
    }
  };

  const handleStartDirectChat = (targetUser: User) => {
    const dmChannel = createDirectChannel(currentUser._id, targetUser);
    setChannels(getStoredChannels());
    setActiveChannelId(dmChannel.id);
    setIsNewDmModalOpen(false);
    toast.success(`Direct conversation opened with ${targetUser.name}`);
  };

  // Filter channels relevant to user
  const allGroupChannel = channels.filter((c) => c.scope === 'all');
  const teamGroupChannels = channels.filter(
    (c) => c.scope === 'team' && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin' || c.team === currentUser.team)
  );

  // Resolve Direct DMs for currentUser so:
  // 1) It ALWAYS shows the OTHER participant's name (never currentUser's own name, and never a stale persona's name)
  // 2) It deduplicates by partnerKey so the same person is NEVER shown twice in INDIVIDUAL DIRECT DMS
  const directChannels = (() => {
    const mapByPartner = new Map<
      string,
      ChatChannel & { mergedIds: string[]; unreadTotal: number }
    >();

    for (const ch of channels) {
      if (ch.scope !== 'direct' && !ch.id.startsWith('dm_')) continue;
      const resolved = resolveDirectChannelForUser(ch, currentUser, users);
      if (!resolved.isParticipant || !resolved.partnerKey) continue;

      const chMsgs = getStoredMessages(ch.id);
      const lastMsg = chMsgs[chMsgs.length - 1];
      const latestTimeStr = lastMsg
        ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : ch.lastMessageTime || '';
      const chUnread = unreadByChannel[ch.id] || 0;

      const existing = mapByPartner.get(resolved.partnerKey);
      if (!existing) {
        mapByPartner.set(resolved.partnerKey, {
          ...ch,
          name: resolved.displayName,
          description: resolved.description,
          lastMessageTime: latestTimeStr,
          mergedIds: [ch.id],
          unreadTotal: chUnread,
        });
      } else {
        existing.mergedIds.push(ch.id);
        existing.unreadTotal += chUnread;
        // Prefer the channel ID that has messages or is currently active
        const existingMsgs = getStoredMessages(existing.id);
        if (ch.id === activeChannelId || (chMsgs.length > existingMsgs.length && existing.id !== activeChannelId)) {
          existing.id = ch.id;
        }
        if (latestTimeStr && !existing.lastMessageTime) {
          existing.lastMessageTime = latestTimeStr;
        }
      }
    }

    return Array.from(mapByPartner.values());
  })();

  const filteredUsersForDm = users.filter(
    (u) =>
      u._id !== currentUser._id &&
      (u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.team.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const handleExportChat = () => {
    if (!messages || messages.length === 0) {
      toast.error('No messages in this conversation to export');
      return;
    }
    const exportRows = messages.map((m) => ({
      'Message ID': m.id,
      'Sender Name': m.senderName,
      'Sender Role': m.senderRole,
      'Sender Team': m.senderTeam || 'General',
      'Timestamp': m.createdAt ? new Date(m.createdAt).toLocaleString() : '—',
      'Message Text': m.text || '',
      'Attachment File': m.fileAttachment?.name || '',
      'Shared Link': m.linkUrl || '',
      'Reply Context': m.replyTo ? `Replying to ${m.replyTo.senderName}: "${m.replyTo.text}"` : '',
    }));

    const cleanChannelName = (activeChannel?.name || 'Conversation').replace(/[^a-zA-Z0-9]/g, '_');
    exportToCSV(`BizyHub_Chat_${cleanChannelName}_Transcript`, exportRows);
    toast.success(`Chat transcript (${exportRows.length} messages) exported to CSV!`);
  };

  return (
    <div className="h-[calc(100vh-1.5rem)] flex flex-col gap-3 p-3 sm:p-4 max-w-7xl mx-auto">
      {/* Top Quick Navigation Bar with Back to Home Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card px-4 py-2.5 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 px-3.5 py-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-300 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <Home className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">
              Bizy Hub All-in-One &amp; Team Chat Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Avatar
            name={currentUser.name}
            src={currentUser.avatar}
            userId={currentUser._id}
            email={currentUser.email}
            size="sm"
          />
          <span className="text-xs font-bold text-foreground">{currentUser.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {currentUser.role}
          </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
      {/* Left Sidebar - Groups & Channels */}
      <div className="w-full md:w-80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card flex flex-col shrink-0 overflow-hidden shadow-sm">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-500" />
            <h2 className="font-extrabold text-sm text-foreground tracking-tight">Team Messaging</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setIsNewGroupModalOpen(true)}
                className="text-[11px] font-bold py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 shadow-sm"
                title="Create New Group (Admin Only)"
              >
                <Plus className="h-3.5 w-3.5" /> Group
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsNewDmModalOpen(true)}
              className="text-[11px] font-bold py-1 px-2.5 bg-brand-600 text-white rounded-xl gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Direct Chat
            </Button>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* All-in-One Group */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
              Company All-in-One Group
            </span>
            <div className="space-y-1">
              {allGroupChannel.map((ch) => {
                const newCount = activeChannelId === ch.id ? 0 : unreadByChannel[ch.id] || 0;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                      activeChannelId === ch.id
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {ch.id.startsWith('channel_grp_') && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          Group
                        </span>
                      )}
                    </div>
                    {newCount > 0 ? (
                      <Badge className="text-[9px] bg-rose-500 text-white font-extrabold animate-pulse border border-white/30 shrink-0">
                        {newCount} New Msg
                      </Badge>
                    ) : (
                      <Badge variant={activeChannelId === ch.id ? 'secondary' : 'default'} className="text-[9px] shrink-0">
                        All Roles
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Level Groups */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 block mb-1">
              Team Level Groups
            </span>
            <div className="space-y-1">
              {teamGroupChannels.map((ch) => {
                const newCount = activeChannelId === ch.id ? 0 : unreadByChannel[ch.id] || 0;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                      activeChannelId === ch.id
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="truncate">{ch.name}</span>
                      {ch.id.startsWith('channel_grp_') && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          Group
                        </span>
                      )}
                    </div>
                    {newCount > 0 ? (
                      <Badge className="text-[9px] bg-rose-500 text-white font-extrabold animate-pulse border border-white/30 shrink-0">
                        {newCount} New Msg
                      </Badge>
                    ) : (
                      ch.team && (
                        <Badge variant={activeChannelId === ch.id ? 'secondary' : 'outline'} className="text-[9px] shrink-0">
                          {ch.team}
                        </Badge>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Individual Conversations */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Individual Direct DMs
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{directChannels.length}</span>
            </div>
            <div className="space-y-1">
              {directChannels.length > 0 ? (
                directChannels.map((ch) => {
                  const isActiveDm = ch.mergedIds.includes(activeChannelId);
                  // Do NOT show "New Msg" in sidebar if the user is currently viewing this DM
                  const newCount = isActiveDm ? 0 : ch.unreadTotal;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full text-left p-2.5 rounded-xl font-semibold transition-all flex items-center justify-between ${
                        isActiveDm
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-bold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-foreground'
                      }`}
                    >
                      <span className="truncate">{ch.name}</span>
                      {newCount > 0 ? (
                        <Badge className="text-[9px] bg-rose-500 text-white font-extrabold animate-pulse border border-white/30 shrink-0">
                          {newCount} New Msg
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-mono opacity-70">{ch.lastMessageTime}</span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-[11px] text-muted-foreground italic px-2 py-1">No direct chats yet. Click "+ Direct Chat" to start.</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Clean Action in Sidebar Footer */}
        {isAdmin && (
          <div className="p-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={handleClearAllChats}
              className="w-full text-center py-1.5 px-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Wipe All Chat History (Admin)
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Conversation Workspace */}
      <div className="flex-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card flex flex-col overflow-hidden shadow-sm">
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/40">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-extrabold text-base text-foreground tracking-tight">{activeChannel?.name}</h1>
              <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-bold">
                {activeChannel?.scope === 'all' ? 'Group (TL, Member, Admin)' : activeChannel?.scope === 'team' ? `${activeChannel.team} Team` : 'Direct DM'}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                💬 {messages.length} Msgs
              </Badge>

            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{activeChannel?.description || 'Collaborate with text updates, share files, and link resources.'}</p>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportChat}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
              title="Download conversation transcript to CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Export Chat CSV
            </Button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
              title="Return to Home Dashboard"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-brand-500" />
              Home
            </Link>
            {isAdmin && activeChannelId.startsWith('channel_grp_') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteCustomGroup}
                className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                title="Delete this custom group (Admin Only)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Group
              </Button>
            )}
            {isAdmin && messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearGroup}
                className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
                title="Admin: Clear all messages in this group"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Group
              </Button>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(() => {
            const seenIds = new Set<string>();
            const uniqueMessages: ChatMessage[] = [];
            for (const m of messages) {
              if (!m || seenIds.has(m.id)) continue;
              seenIds.add(m.id);
              const prev = uniqueMessages[uniqueMessages.length - 1];
              if (
                prev &&
                prev.senderId === m.senderId &&
                prev.text === m.text &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 2000
              ) {
                continue;
              }
              uniqueMessages.push(m);
            }

            let hasRenderedNewDivider = false;

            return uniqueMessages.length > 0 ? (
              uniqueMessages.map((msg, idx) => {
                const isMe =
                  msg.senderId === currentUser._id ||
                  (msg.senderName || '').toLowerCase() === currentUser.name.toLowerCase();
                // Only show transient "New Msg" if it just arrived while viewing AND user hasn't replied after it
                const hasReplyAfter = uniqueMessages
                  .slice(idx + 1)
                  .some(
                    (later) =>
                      later.senderId === currentUser._id ||
                      (later.senderName || '').toLowerCase() === currentUser.name.toLowerCase()
                  );
                const isNewMsg = !isMe && !hasReplyAfter && newMsgIdsInActiveView.includes(msg.id);
                const showNewDivider = isNewMsg && !hasRenderedNewDivider;
                if (showNewDivider) {
                  hasRenderedNewDivider = true;
                }

                return (
                  <React.Fragment key={msg.id}>
                    {showNewDivider && (
                      <div className="flex items-center gap-3 my-2">
                        <div className="h-px flex-1 bg-rose-500/30" />
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                          <Bell className="h-3 w-3 animate-bounce" />
                          New Message Received
                        </span>
                        <div className="h-px flex-1 bg-rose-500/30" />
                      </div>
                    )}
                    <div
                      id={`chat-msg-${msg.id}`}
                      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group transition-all duration-300 rounded-2xl p-1.5`}
                    >
                      <Avatar
                        name={msg.senderName}
                        src={msg.senderAvatar}
                        userId={msg.senderId}
                        size="md"
                        className="shrink-0"
                      />
                      <div className={`max-w-xl space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                        {/* Sender Info & Admin Delete Action */}
                        <div className={`flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-foreground">{msg.senderName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {msg.senderRole}
                          </span>
                          {isNewMsg && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white shadow-sm animate-pulse inline-flex items-center gap-1">
                              <Bell className="h-2.5 w-2.5" />
                              New Msg
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <Bell className="h-2.5 w-2.5" />
                            {activeChannel?.scope === 'all' ? 'Notified All Teams' : 'Team Notified'}
                          </span>
                          <span className="font-mono text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {/* Reply Action */}
                          <button
                            type="button"
                            onClick={() => handleStartReply(msg)}
                            className="opacity-40 group-hover:opacity-100 hover:text-brand-500 dark:hover:text-brand-400 transition-opacity p-0.5 ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold"
                            title={`Reply to ${msg.senderName}`}
                          >
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                      {/* Admin Delete Action */}
                      {(isAdmin || isMe) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="opacity-40 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity p-0.5 ml-1"
                          title={isAdmin ? "Delete message (Admin)" : "Delete my message"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Content Box */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800/90 text-foreground rounded-tl-none border border-zinc-200/60 dark:border-zinc-700/60'
                      }`}
                    >
                      {/* Quoted Reply Preview */}
                      {msg.replyTo && (
                        <div
                          onClick={() => scrollToMessage(msg.replyTo?.id)}
                          className={`p-2 rounded-xl text-[11px] border cursor-pointer hover:opacity-90 transition-all flex items-start gap-2 mb-1.5 ${
                            isMe
                              ? 'bg-brand-700/60 border-brand-400/40 text-brand-100'
                              : 'bg-zinc-200/80 dark:bg-zinc-700/70 border-zinc-300 dark:border-zinc-600 text-foreground'
                          }`}
                          title="Click to jump to quoted message"
                        >
                          <Reply className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400" />
                          <div className="truncate flex-1 text-left">
                            <span className="font-extrabold text-[10px] text-brand-300 block">
                              Replying to @{msg.replyTo.senderName}
                            </span>
                            <p className="truncate italic text-[11px] opacity-90">{msg.replyTo.text || 'Attachment/Link'}</p>
                          </div>
                        </div>
                      )}

                      {msg.text && (
                        <p className="whitespace-pre-wrap">{renderFormattedText(msg.text, isMe)}</p>
                      )}

                      {/* File Link Attachment */}
                      {msg.fileAttachment && (
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isMe ? 'bg-brand-700/60 border-brand-400/40 text-white' : 'bg-background border-zinc-200 dark:border-zinc-700 text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span className="font-bold truncate" title={msg.fileAttachment.name}>
                              {msg.fileAttachment.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {msg.fileAttachment.size && <span className="text-[10px] font-mono opacity-80">{msg.fileAttachment.size}</span>}
                            <a
                              href={msg.fileAttachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          </div>
                        </div>
                      )}

                      {/* External Share Link */}
                      {msg.linkUrl && (
                        <div
                          className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                            isMe ? 'bg-brand-700/60 border-brand-400/40 text-white' : 'bg-background border-zinc-200 dark:border-zinc-700 text-foreground'
                          }`}
                        >
                          <span className="font-mono text-[11px] truncate mr-2" title={msg.linkUrl}>
                            🔗 {msg.linkUrl}
                          </span>
                          <a
                            href={msg.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold hover:underline shrink-0 flex items-center gap-1"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-brand-500 opacity-40" />
              <p className="font-bold text-sm text-foreground">No messages yet in this group</p>
              <p className="text-xs max-w-sm">Start the conversation by sharing updates, attaching documents (&lt; 5MB limit), or pasting links below. Group messages trigger audio & notification alerts for all members.</p>
            </div>
          );
        })()}
        <div ref={messagesEndRef} />
        </div>

        {/* Message Input Controls Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2 relative">
          {/* Floating Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs animate-in fade-in slide-in-from-bottom-2 shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <Reply className="h-4 w-4 text-brand-500 shrink-0" />
                <span className="font-extrabold shrink-0">Replying to @{replyingTo.senderName}:</span>
                <span className="italic truncate opacity-85 max-w-md">&ldquo;{replyingTo.text}&rdquo;</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-xs font-bold text-muted-foreground hover:text-rose-500 ml-2 p-1 rounded-lg hover:bg-rose-500/10 transition"
                title="Cancel reply"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Mention Candidates Popover */}
          {mentionQuery !== null && (
            <div className="absolute bottom-full left-3 mb-2 w-72 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-card shadow-2xl p-2 z-50 space-y-1 backdrop-blur-md">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-zinc-200/50 dark:border-zinc-800/50">
                <span className="flex items-center gap-1.5">
                  <AtSign className="h-3 w-3 text-brand-500" /> Mention Team Member
                </span>
                <button
                  type="button"
                  onClick={() => setMentionQuery(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(mentionQuery) ||
                      u.role.toLowerCase().includes(mentionQuery) ||
                      u.team.toLowerCase().includes(mentionQuery)
                  )
                  .slice(0, 6)
                  .map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => handleSelectMention(u)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-brand-500/10 dark:hover:bg-brand-500/20 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar name={u.name} src={u.avatar} size="xs" />
                        <span className="font-bold text-xs truncate text-foreground">{u.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">
                        {u.role}
                      </Badge>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* File Attachment Pill */}
          {attachedFile && (
            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <span className="font-bold truncate flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Attached: {attachedFile.name} ({attachedFile.size})
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Share Link Input */}
          {showLinkField && (
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste share link (e.g. https://taskflow-saas-app-five.vercel.app/...)"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-mono focus-ring"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => setShowLinkField(false)} className="text-xs">
                Cancel
              </Button>
            </div>
          )}

          {/* Text Message Field & Actions */}
          <div className="flex items-end gap-2">
            <label className="cursor-pointer p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5" title="Attach Document (< 5MB limit)">
              <Paperclip className="h-4 w-4 text-emerald-500" />
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip,.xlsx,.txt" />
            </label>

            <button
              type="button"
              onClick={() => setShowLinkField(!showLinkField)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5"
              title="Share Link"
            >
              <LinkIcon className="h-4 w-4 text-brand-500" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMessageText((prev) => (prev ? `${prev} @` : '@'));
                setMentionQuery('');
                setMentionStartIndex(messageText.length);
                inputRef.current?.focus();
              }}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-purple-500 transition-colors shrink-0 mb-0.5"
              title="Mention Team Member (@)"
            >
              <AtSign className="h-4 w-4 text-purple-500" />
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChannel?.name}... (Shift+Enter for new line, Enter to send)`}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-2.5 text-xs font-medium focus-ring resize-none min-h-[42px] max-h-36 overflow-y-auto leading-relaxed"
            />

            <Button
              type="submit"
              disabled={isSending || (!messageText.trim() && !attachedFile && !linkInput.trim())}
              className="ambizcon-gradient hover:opacity-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl gap-1.5 shadow-glow disabled:opacity-50 shrink-0 mb-0.5 h-[42px]"
            >
              <Send className="h-3.5 w-3.5" /> {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
      </div>

      {/* Admin Create New Group Modal */}
      {isAdmin && (
        <Modal
          isOpen={isNewGroupModalOpen}
          onClose={() => setIsNewGroupModalOpen(false)}
          title="Create New Group Chat (Admin Only)"
          description="Create a company-wide or team-specific group conversation space."
          maxWidth="md"
        >
          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Group Name *</label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. 🚀 Q4 Product Launch, 📱 Mobile App Sprint..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Group Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewGroupScope('all')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    newGroupScope === 'all'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Globe className="h-4 w-4 mb-1 text-brand-500" />
                  <p className="text-xs font-bold">All Company</p>
                  <p className="text-[10px] opacity-80">All team members &amp; roles</p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewGroupScope('team')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    newGroupScope === 'team'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Users className="h-4 w-4 mb-1 text-emerald-500" />
                  <p className="text-xs font-bold">Team Specific</p>
                  <p className="text-[10px] opacity-80">Designated team members</p>
                </button>
              </div>
            </div>

            {newGroupScope === 'team' && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Select Team</label>
                <select
                  value={newGroupTeam}
                  onChange={(e) => setNewGroupTeam(e.target.value as TeamName)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                >
                  <option value="Creative">Creative Team</option>
                  <option value="Marketing">Marketing Team</option>
                  <option value="Development">Development Team</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Description (Optional)</label>
              <textarea
                rows={2}
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="What is this group for? E.g., Weekly sprints, client deliverables..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewGroupModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingGroup || !newGroupName.trim()}
                className="ambizcon-gradient text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                {isCreatingGroup ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Direct DM User Selector Modal */}
      <Modal
        isOpen={isNewDmModalOpen}
        onClose={() => setIsNewDmModalOpen(false)}
        title="Start Direct Message (DM)"
        description="Select a Team Lead, Team Member, or Super Admin to start a private chat."
        maxWidth="md"
      >
        <div className="space-y-3 pt-2 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search by name, role, or team..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background pl-9 pr-3 py-2 text-xs focus-ring"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredUsersForDm.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartDirectChat(u)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div>
                    <p className="font-bold text-foreground text-xs">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.role} • {u.team}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  {u.company || 'India & Australia'}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
