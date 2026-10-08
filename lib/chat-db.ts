import { ChatChannel, ChatMessage, TeamName, UserRole } from '@/types';

const CHANNELS_KEY = 'taskflow_chat_channels_v1';
const MESSAGES_KEY = 'taskflow_chat_messages_v1';

export const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'channel_all',
    name: '🌐 All-in-One Company Group',
    scope: 'all',
    description: 'Company-wide chat space for All Team Members, Team Leads, and Admins.',
    lastMessage: 'Welcome to Ambizcon TaskFlow Team Messaging!',
    lastMessageTime: '10:00 AM',
  },
  {
    id: 'channel_creative',
    name: '🎨 Creative Team Group',
    scope: 'team',
    team: 'Creative',
    description: 'Designers, Copywriters, and Creative Leads collaboration space.',
    lastMessage: 'Updated vector campaign assets uploaded.',
    lastMessageTime: '11:15 AM',
  },
  {
    id: 'channel_marketing',
    name: '📈 Marketing Team Group',
    scope: 'team',
    team: 'Marketing',
    description: 'SEO, Google Ads, and Social Media Strategy discussion.',
    lastMessage: 'Monthly retainer client performance report ready.',
    lastMessageTime: '11:45 AM',
  },
  {
    id: 'channel_development',
    name: '💻 Development Team Group',
    scope: 'team',
    team: 'Development',
    description: 'Full-stack engineers, WordPress Devs, and Tech Leads channel.',
    lastMessage: 'WordPress 6.7 compatibility testing completed.',
    lastMessageTime: '12:10 PM',
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  channel_all: [],
  channel_creative: [],
  channel_marketing: [],
  channel_development: [],
};

export function getStoredChannels(): ChatChannel[] {
  if (typeof window === 'undefined') return DEFAULT_CHANNELS;
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
    id: `msg_${Date.now()}`,
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
    } catch (err) {
      console.error('Failed to save message', err);
    }
  }

  return newMsg;
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
