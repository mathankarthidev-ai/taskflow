import { ChatChannel, ChatMessage, TeamName, UserRole } from '@/types';

const CHANNELS_KEY = 'taskflow_chat_channels_v2';
const MESSAGES_KEY = 'taskflow_chat_messages_v2';
const DISMISSED_MSG_IDS_KEY = 'taskflow_chat_dismissed_msg_ids_v2';

export const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'channel_all',
    name: '🌐 All-in-One Company Group',
    scope: 'all',
    description: 'Company-wide chat space for All Team Members, Team Leads, and Admins.',
    lastMessage: 'No messages yet',
    lastMessageTime: '',
  },
  {
    id: 'channel_creative',
    name: '🎨 Creative Team Group',
    scope: 'team',
    team: 'Creative',
    description: 'Designers, Copywriters, and Creative Leads collaboration space.',
    lastMessage: 'No messages yet',
    lastMessageTime: '',
  },
  {
    id: 'channel_marketing',
    name: '📈 Marketing Team Group',
    scope: 'team',
    team: 'Marketing',
    description: 'SEO, Google Ads, and Social Media Strategy discussion.',
    lastMessage: 'No messages yet',
    lastMessageTime: '',
  },
  {
    id: 'channel_development',
    name: '💻 Development Team Group',
    scope: 'team',
    team: 'Development',
    description: 'Full-stack engineers, WordPress Devs, and Tech Leads channel.',
    lastMessage: 'No messages yet',
    lastMessageTime: '',
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  channel_all: [],
  channel_creative: [],
  channel_marketing: [],
  channel_development: [],
};

// BroadcastChannel singleton for instant cross-tab notification & message sync
let chatBroadcastChannel: BroadcastChannel | null = null;
export function getChatBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!chatBroadcastChannel) {
    try {
      chatBroadcastChannel = new BroadcastChannel('ambizcon_chat_sync');
    } catch (_) {
      chatBroadcastChannel = null;
    }
  }
  return chatBroadcastChannel;
}

// Auto-clean legacy v1 data from localStorage on first run
function purgeLegacyV1() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('taskflow_chat_channels_v1');
    localStorage.removeItem('taskflow_chat_messages_v1');
  } catch (_) {}
}

export function getDismissedMessageIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DISMISSED_MSG_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function markChannelMessagesAsRead(channelId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return;
    const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
    const dismissed = new Set<string>(getDismissedMessageIds());

    if (channelId) {
      const list = allMsgs[channelId] || [];
      list.forEach((m) => {
        if (m?.id) dismissed.add(m.id);
      });
    } else {
      Object.values(allMsgs).forEach((list) => {
        (list || []).forEach((m) => {
          if (m?.id) dismissed.add(m.id);
        });
      });
    }

    localStorage.setItem(DISMISSED_MSG_IDS_KEY, JSON.stringify(Array.from(dismissed)));
    window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
  } catch (_) {}
}

export function isUserReceiverForChatMessage(
  message: ChatMessage | null | undefined,
  channelId: string,
  currentUser?: { _id?: string; name?: string; team?: string; role?: string } | null
): boolean {
  if (!currentUser || !message) return false;

  // 1. NEVER notify or play sound for the SENDER
  if (
    (currentUser._id && message.senderId === currentUser._id) ||
    (currentUser.name && message.senderName === currentUser.name)
  ) {
    return false;
  }

  const channels = getStoredChannels();
  const ch = channels.find((c) => c.id === channelId);
  const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

  // 2. All-in-One Group ('channel_all' / scope === 'all'): all users EXCEPT sender
  if (channelId === 'channel_all' || ch?.scope === 'all') {
    return true;
  }

  // 3. Team Group ('channel_creative', 'channel_marketing', 'channel_development' / scope === 'team'):
  // Only members/TLs of that specific team (or Admin) EXCEPT sender
  if (ch?.scope === 'team' || channelId.startsWith('channel_')) {
    const targetTeam =
      ch?.team ||
      (channelId === 'channel_creative'
        ? 'Creative'
        : channelId === 'channel_marketing'
        ? 'Marketing'
        : channelId === 'channel_development'
        ? 'Development'
        : undefined);
    if (isAdmin) return true;
    return Boolean(targetTeam && currentUser.team === targetTeam);
  }

  // 4. Direct Individual Chat ('dm_...' / scope === 'direct'):
  // Only the target participant member EXCEPT sender
  if (ch?.scope === 'direct' || channelId.startsWith('dm_')) {
    if (ch?.participantIds && currentUser._id) {
      return ch.participantIds.includes(currentUser._id);
    }
    if (currentUser._id && channelId.includes(currentUser._id)) {
      return true;
    }
    if (ch?.name && currentUser.name && ch.name.toLowerCase().includes(currentUser.name.toLowerCase())) {
      return true;
    }
    return false;
  }

  return true;
}

export function getNewChatMessageCount(
  userTeam?: string,
  userRole?: string,
  currentUserId?: string,
  currentUserName?: string
): {
  total: number;
  byChannel: Record<string, number>;
  latestMessage: ChatMessage | null;
} {
  if (typeof window === 'undefined') {
    return { total: 0, byChannel: {}, latestMessage: null };
  }
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return { total: 0, byChannel: {}, latestMessage: null };
    const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
    const dismissed = new Set<string>(getDismissedMessageIds());
    const channels = getStoredChannels();
    const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

    let total = 0;
    const byChannel: Record<string, number> = {};
    let latestMessage: ChatMessage | null = null;

    Object.entries(allMsgs).forEach(([chId, list]) => {
      if (!Array.isArray(list) || list.length === 0) return;

      // Check if user has access to this channel
      const ch = channels.find((c) => c.id === chId);
      if (ch && ch.scope === 'team' && !isAdmin && userTeam && ch.team !== userTeam) {
        return;
      }

      // Deduplicate messages in channel
      const seen = new Set<string>();
      const validMsgs: ChatMessage[] = [];
      for (const m of list) {
        if (!m || !m.id || seen.has(m.id)) continue;
        seen.add(m.id);
        validMsgs.push(m);
      }

      // Only count messages where the user is a RECEIVER (never count the sender's own messages)
      const unreadInChannel = validMsgs.filter((m) => {
        if (dismissed.has(m.id)) return false;
        if (currentUserId || currentUserName) {
          return isUserReceiverForChatMessage(m, chId, {
            _id: currentUserId,
            name: currentUserName,
            team: userTeam,
            role: userRole,
          });
        }
        return true;
      });

      if (unreadInChannel.length > 0) {
        byChannel[chId] = unreadInChannel.length;
        total += unreadInChannel.length;
        const last = unreadInChannel[unreadInChannel.length - 1];
        if (
          !latestMessage ||
          new Date(last.createdAt).getTime() >= new Date(latestMessage.createdAt).getTime()
        ) {
          latestMessage = last;
        }
      }
    });

    return { total, byChannel, latestMessage };
  } catch (_) {
    return { total: 0, byChannel: {}, latestMessage: null };
  }
}

export function getStoredChannels(): ChatChannel[] {
  if (typeof window === 'undefined') return DEFAULT_CHANNELS;
  purgeLegacyV1();
  try {
    const raw = localStorage.getItem(CHANNELS_KEY);
    if (!raw) {
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(DEFAULT_CHANNELS));
      return DEFAULT_CHANNELS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_CHANNELS;
  }
}

export function getStoredMessages(channelId: string): ChatMessage[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGES[channelId] || [];
  purgeLegacyV1();
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES[channelId] || [];
    }
    const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
    const list: ChatMessage[] = allMsgs[channelId] || INITIAL_MESSAGES[channelId] || [];

    // Deduplicate by ID and strip rapid accidental duplicates (same sender & identical text within 2000ms)
    const seenIds = new Set<string>();
    const deduplicated: ChatMessage[] = [];
    for (const m of list) {
      if (!m || seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      const prev = deduplicated[deduplicated.length - 1];
      if (
        prev &&
        prev.senderId === m.senderId &&
        prev.text === m.text &&
        Math.abs(new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 2000
      ) {
        continue;
      }
      deduplicated.push(m);
    }
    return deduplicated;
  } catch (err) {
    return INITIAL_MESSAGES[channelId] || [];
  }
}

export async function syncMessagesFromServer(): Promise<{
  newMessages: { channelId: string; message: ChatMessage }[];
}> {
  if (typeof window === 'undefined') return { newMessages: [] };
  try {
    const res = await fetch('/api/chat', { cache: 'no-store' });
    if (!res.ok) return { newMessages: [] };
    const data = await res.json();
    if (!data.success || !data.messagesByChannel) return { newMessages: [] };

    const raw = localStorage.getItem(MESSAGES_KEY);
    const localMsgs: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : { ...INITIAL_MESSAGES };
    const newlyDiscovered: { channelId: string; message: ChatMessage }[] = [];
    let hasChanges = false;

    Object.entries(data.messagesByChannel as Record<string, ChatMessage[]>).forEach(
      ([channelId, serverList]) => {
        if (!Array.isArray(serverList)) return;
        const currentList = localMsgs[channelId] || [];
        const existingIds = new Set(currentList.map((m) => m.id));

        for (const srvMsg of serverList) {
          if (srvMsg && srvMsg.id && !existingIds.has(srvMsg.id)) {
            currentList.push(srvMsg);
            existingIds.add(srvMsg.id);
            newlyDiscovered.push({ channelId, message: srvMsg });
            hasChanges = true;
          }
        }
        localMsgs[channelId] = currentList;
      }
    );

    // Also push any local messages that aren't on the server yet so other tabs/sessions get them
    Object.entries(localMsgs).forEach(([channelId, localList]) => {
      if (!Array.isArray(localList) || localList.length === 0) return;
      const serverList: ChatMessage[] = data.messagesByChannel[channelId] || [];
      const serverIds = new Set(serverList.map((m) => m.id));
      for (const locMsg of localList) {
        if (locMsg && locMsg.id && !serverIds.has(locMsg.id)) {
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId, message: locMsg }),
          }).catch(() => {});
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(localMsgs));
      window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
    }

    return { newMessages: newlyDiscovered };
  } catch (_) {
    return { newMessages: [] };
  }
}

export function sendChatMessage(
  channelId: string,
  sender: { _id: string; name: string; role: UserRole; team: TeamName; avatar?: string },
  text: string,
  fileAttachment?: { name: string; url: string; size?: string; type?: string },
  linkUrl?: string,
  originWindowId?: string
): ChatMessage {
  const trimmedText = text.trim();

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      const allMsgs: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : { ...INITIAL_MESSAGES };
      const currentList: ChatMessage[] = allMsgs[channelId] || INITIAL_MESSAGES[channelId] || [];

      // Check for rapid double submit (same sender, same text, same channel within last 2000ms)
      const lastMsg = currentList[currentList.length - 1];
      if (
        lastMsg &&
        lastMsg.senderId === sender._id &&
        lastMsg.text === trimmedText &&
        (!fileAttachment || lastMsg.fileAttachment?.name === fileAttachment.name) &&
        Date.now() - new Date(lastMsg.createdAt).getTime() < 2000
      ) {
        return lastMsg;
      }

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        channelId,
        senderId: sender._id,
        senderName: sender.name,
        senderRole: sender.role,
        senderTeam: sender.team,
        senderAvatar: sender.avatar,
        text: trimmedText,
        fileAttachment,
        linkUrl: linkUrl?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [...currentList, newMsg];
      allMsgs[channelId] = updatedList;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));

      // Update Channel Last Message info
      const channels = getStoredChannels();
      const updatedChannels = channels.map((c) =>
        c.id === channelId
          ? {
              ...c,
              lastMessage:
                trimmedText.slice(0, 40) ||
                (fileAttachment ? `Attachment: ${fileAttachment.name}` : 'File/Link Shared'),
              lastMessageTime: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : c
      );
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));

      // Sync to server API (/api/chat) for all team members across browsers/sessions
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, message: newMsg }),
      }).catch(() => {});

      // Broadcast across open browser tabs via BroadcastChannel
      const bc = getChatBroadcastChannel();
      if (bc) {
        try {
          bc.postMessage({
            type: 'CHAT_MESSAGE_SENT',
            channelId,
            message: newMsg,
            originWindowId,
          });
        } catch (_) {}
      }

      // Dispatch window event with originWindowId for cross-component / live-tab sync
      window.dispatchEvent(
        new CustomEvent('taskflow_chat_message_sent', {
          detail: { channelId, message: newMsg, originWindowId },
        })
      );
      window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));

      return newMsg;
    } catch (err) {
      console.error('Failed to save message', err);
    }
  }

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    channelId,
    senderId: sender._id,
    senderName: sender.name,
    senderRole: sender.role,
    senderTeam: sender.team,
    senderAvatar: sender.avatar,
    text: trimmedText,
    fileAttachment,
    linkUrl: linkUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

export function deleteChatMessage(channelId: string, messageId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return false;
    const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
    const list = allMsgs[channelId] || [];
    const updatedList = list.filter((m) => m.id !== messageId);
    allMsgs[channelId] = updatedList;
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));

    // Update Channel Last Message info
    const channels = getStoredChannels();
    const lastMsg = updatedList[updatedList.length - 1];
    const updatedChannels = channels.map((c) =>
      c.id === channelId
        ? {
            ...c,
            lastMessage: lastMsg
              ? lastMsg.text.slice(0, 40) ||
                (lastMsg.fileAttachment ? `Attachment: ${lastMsg.fileAttachment.name}` : 'File/Link')
              : 'No messages yet',
            lastMessageTime: lastMsg
              ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '',
          }
        : c
    );
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));

    fetch(
      `/api/chat?channelId=${encodeURIComponent(channelId)}&messageId=${encodeURIComponent(messageId)}`,
      { method: 'DELETE' }
    ).catch(() => {});

    window.dispatchEvent(
      new CustomEvent('taskflow_chat_message_deleted', {
        detail: { channelId, messageId },
      })
    );
    window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
    return true;
  } catch (err) {
    console.error('Failed to delete message', err);
    return false;
  }
}

export function clearChannelMessages(channelId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const allMsgs: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : { ...INITIAL_MESSAGES };
    allMsgs[channelId] = [];
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));

    const channels = getStoredChannels();
    const updatedChannels = channels.map((c) =>
      c.id === channelId
        ? {
            ...c,
            lastMessage: 'No messages yet',
            lastMessageTime: '',
          }
        : c
    );
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));

    fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}`, { method: 'DELETE' }).catch(
      () => {}
    );
    window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
    return true;
  } catch (err) {
    console.error('Failed to clear channel messages', err);
    return false;
  }
}

export function clearAllStoredMessages(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
    localStorage.removeItem(DISMISSED_MSG_IDS_KEY);
    const resetChannels = DEFAULT_CHANNELS.map((c) => ({
      ...c,
      lastMessage: 'No messages yet',
      lastMessageTime: '',
    }));
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(resetChannels));

    fetch('/api/chat?clearAll=true', { method: 'DELETE' }).catch(() => {});
    window.dispatchEvent(new CustomEvent('taskflow_chat_unread_updated'));
  } catch (err) {
    console.error('Failed to clear all messages', err);
  }
}

export function createDirectChannel(
  currentUserId: string,
  targetUser: { _id: string; name: string; role: UserRole }
): ChatChannel {
  const channelId = `dm_${[currentUserId, targetUser._id].sort().join('_')}`;
  const channels = getStoredChannels();
  const existing = channels.find((c) => c.id === channelId);
  if (existing) return existing;

  const newChannel: ChatChannel = {
    id: channelId,
    name: `💬 ${targetUser.name} (${targetUser.role})`,
    scope: 'direct',
    participantIds: [currentUserId, targetUser._id],
    description: `Private Direct Message with ${targetUser.name}`,
    lastMessage: 'Direct chat started',
    lastMessageTime: 'Just now',
  };

  const updatedChannels = [newChannel, ...channels];
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));
  }
  return newChannel;
}
