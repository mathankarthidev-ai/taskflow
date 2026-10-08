import { ChatChannel, ChatMessage, TeamName, UserRole } from '@/types';

const CHANNELS_KEY = 'taskflow_chat_channels_v2';
const MESSAGES_KEY = 'taskflow_chat_messages_v2';

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

// Auto-clean legacy v1 data from localStorage on first run
function purgeLegacyV1() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('taskflow_chat_channels_v1');
    localStorage.removeItem('taskflow_chat_messages_v1');
  } catch (_) {}
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
    return allMsgs[channelId] || INITIAL_MESSAGES[channelId] || [];
  } catch (err) {
    return INITIAL_MESSAGES[channelId] || [];
  }
}

export function sendChatMessage(
  channelId: string,
  sender: { _id: string; name: string; role: UserRole; team: TeamName; avatar?: string },
  text: string,
  fileAttachment?: { name: string; url: string; size?: string; type?: string },
  linkUrl?: string
): ChatMessage {
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    channelId,
    senderId: sender._id,
    senderName: sender.name,
    senderRole: sender.role,
    senderTeam: sender.team,
    senderAvatar: sender.avatar,
    text: text.trim(),
    fileAttachment,
    linkUrl: linkUrl?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      const allMsgs: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : { ...INITIAL_MESSAGES };
      const currentList = allMsgs[channelId] || INITIAL_MESSAGES[channelId] || [];
      const updatedList = [...currentList, newMsg];
      allMsgs[channelId] = updatedList;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMsgs));

      // Update Channel Last Message info
      const channels = getStoredChannels();
      const updatedChannels = channels.map((c) =>
        c.id === channelId
          ? {
              ...c,
              lastMessage: text.slice(0, 40) || (fileAttachment ? `Attachment: ${fileAttachment.name}` : 'File/Link Shared'),
              lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : c
      );
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));

      // Dispatch window event for cross-component / live-tab sync
      window.dispatchEvent(
        new CustomEvent('taskflow_chat_message_sent', {
          detail: { channelId, message: newMsg },
        })
      );
    } catch (err) {
      console.error('Failed to save message', err);
    }
  }

  return newMsg;
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
              ? (lastMsg.text.slice(0, 40) || (lastMsg.fileAttachment ? `Attachment: ${lastMsg.fileAttachment.name}` : 'File/Link'))
              : 'No messages yet',
            lastMessageTime: lastMsg
              ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }
        : c
    );
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(updatedChannels));

    window.dispatchEvent(
      new CustomEvent('taskflow_chat_message_deleted', {
        detail: { channelId, messageId },
      })
    );
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
    const resetChannels = DEFAULT_CHANNELS.map((c) => ({
      ...c,
      lastMessage: 'No messages yet',
      lastMessageTime: '',
    }));
    localStorage.setItem(CHANNELS_KEY, JSON.stringify(resetChannels));
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
