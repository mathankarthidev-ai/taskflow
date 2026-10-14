import { ChatChannel, ChatMessage, TeamName, UserRole } from '@/types';
import { SEED_USERS } from '@/lib/seed-data';
import { useNotificationStore } from '@/store/useNotificationStore';

const CHANNELS_KEY = 'taskflow_chat_channels_v3';
const MESSAGES_KEY = 'taskflow_chat_messages_v3';
const DISMISSED_MSG_IDS_KEY = 'taskflow_chat_dismissed_msg_ids_v3';

export function extractDmParticipantIds(channelId: string): string[] {
  if (!channelId || !channelId.startsWith('dm_')) return [];
  const body = channelId.replace(/^dm_/, '');
  const matches = body.match(/usr?_\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
  if (matches && matches.length >= 2) return Array.from(new Set(matches));
  if (matches && matches.length > 0) return Array.from(new Set(matches));
  const tokens = body.split('_').filter(Boolean);
  const reassembled: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if ((tokens[i] === 'usr' || tokens[i] === 'u') && i + 1 < tokens.length) {
      reassembled.push(`${tokens[i]}_${tokens[i + 1]}`);
      i++;
    } else {
      reassembled.push(tokens[i]);
    }
  }
  return Array.from(new Set(reassembled));
}


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

// Auto-clean legacy v1 & v2 data from localStorage on first run
function purgeLegacyV1() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('taskflow_chat_channels_v1');
    localStorage.removeItem('taskflow_chat_messages_v1');
    localStorage.removeItem('taskflow_chat_channels_v2');
    localStorage.removeItem('taskflow_chat_messages_v2');
  } catch (_) {}
}

const LAST_READ_TS_KEY = 'taskflow_chat_last_read_ts_v2';

function getLastReadTimestamps(userId?: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const key = userId ? `${LAST_READ_TS_KEY}_${userId}` : LAST_READ_TS_KEY;
    const rawUser = localStorage.getItem(key);
    const rawGlobal = localStorage.getItem(LAST_READ_TS_KEY);
    const mapUser = rawUser ? JSON.parse(rawUser) : {};
    const mapGlobal = rawGlobal ? JSON.parse(rawGlobal) : {};
    const merged: Record<string, number> = { ...mapGlobal };
    Object.entries(mapUser).forEach(([k, v]) => {
      if (typeof v === 'number' && v > (merged[k] || 0)) {
        merged[k] = v;
      }
    });
    return merged;
  } catch (_) {
    return {};
  }
}

export function getDismissedMessageIds(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${DISMISSED_MSG_IDS_KEY}_${userId}` : DISMISSED_MSG_IDS_KEY;
    const rawUser = localStorage.getItem(key);
    const rawGlobal = localStorage.getItem(DISMISSED_MSG_IDS_KEY);
    const listUser: string[] = rawUser ? JSON.parse(rawUser) : [];
    const listGlobal: string[] = rawGlobal ? JSON.parse(rawGlobal) : [];
    return Array.from(new Set([...listUser, ...listGlobal]));
  } catch (_) {
    return [];
  }
}

export function markChannelMessagesAsRead(channelId?: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const nowTs = Date.now() + 5000;
    const tsMap = getLastReadTimestamps(userId);
    if (channelId) {
      tsMap[channelId] = nowTs;
    } else {
      tsMap.__ALL__ = nowTs;
    }

    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
      const dismissed = new Set<string>(getDismissedMessageIds(userId));

      if (channelId) {
        const list = allMsgs[channelId] || [];
        list.forEach((m) => {
          if (m?.id) dismissed.add(m.id);
        });
      } else {
        Object.entries(allMsgs).forEach(([chKey, list]) => {
          tsMap[chKey] = nowTs;
          (list || []).forEach((m) => {
            if (m?.id) dismissed.add(m.id);
          });
        });
      }

      const arr = Array.from(dismissed);
      localStorage.setItem(DISMISSED_MSG_IDS_KEY, JSON.stringify(arr));
      if (userId) {
        localStorage.setItem(`${DISMISSED_MSG_IDS_KEY}_${userId}`, JSON.stringify(arr));
      }
    }

    localStorage.setItem(LAST_READ_TS_KEY, JSON.stringify(tsMap));
    if (userId) {
      localStorage.setItem(`${LAST_READ_TS_KEY}_${userId}`, JSON.stringify(tsMap));
    }

    try {
      useNotificationStore.getState().markChatChannelRead(channelId);
    } catch (_) {}
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
    (currentUser.name &&
      message.senderName &&
      message.senderName.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
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
    const extracted = extractDmParticipantIds(channelId);
    if (currentUser._id && extracted.includes(currentUser._id)) {
      return true;
    }
    if (ch?.participantIds && currentUser._id && ch.participantIds.includes(currentUser._id)) {
      return true;
    }
    return false;
  }

  return true;
}

function isMessageAlreadyRead(
  msg: ChatMessage,
  channelId: string,
  dismissed: Set<string>,
  tsMap: Record<string, number>
): boolean {
  if (!msg || !msg.id) return true;
  if (dismissed.has(msg.id)) return true;
  const msgTime = new Date(msg.createdAt || 0).getTime();
  const channelReadTs = Math.max(tsMap[channelId] || 0, tsMap.__ALL__ || 0);
  if (channelReadTs > 0 && msgTime > 0 && msgTime <= channelReadTs) {
    return true;
  }
  return false;
}

export function getUnreadMessageIdsForChannel(
  channelId: string,
  currentUser?: { _id?: string; name?: string; team?: string; role?: string } | null
): string[] {
  if (typeof window === 'undefined' || !channelId || !currentUser) return [];
  try {
    const msgs = getStoredMessages(channelId);
    const dismissed = new Set<string>(getDismissedMessageIds(currentUser._id));
    const tsMap = getLastReadTimestamps(currentUser._id);
    return msgs
      .filter((m) => {
        if (!m || !m.id || isMessageAlreadyRead(m, channelId, dismissed, tsMap)) return false;
        return isUserReceiverForChatMessage(m, channelId, currentUser);
      })
      .map((m) => m.id);
  } catch (_) {
    return [];
  }
}

export function resolveDirectChannelForUser(
  channel: ChatChannel,
  currentUser: { _id: string; name: string; role?: string },
  allUsers: { _id: string; name: string; role: string }[] = []
): {
  isParticipant: boolean;
  partnerName: string;
  partnerRole: string;
  partnerKey: string;
  displayName: string;
  description: string;
} {
  const msgs = getStoredMessages(channel.id);
  const extractedIds = extractDmParticipantIds(channel.id);
  const storedIds = (channel.participantIds || []).filter(
    (id) => id && id !== 'u' && id !== 'usr' && !/^\d+$/.test(id)
  );
  const participantIds = Array.from(new Set([...extractedIds, ...storedIds]));

  const currentNameLower = (currentUser.name || '').toLowerCase().trim();
  const isParticipantById = Boolean(currentUser._id && participantIds.includes(currentUser._id));

  // If this DM channel has explicit participant IDs and currentUser is NOT one of them, strictly NOT a participant
  if (participantIds.length >= 2 && !isParticipantById) {
    return {
      isParticipant: false,
      partnerName: '',
      partnerRole: '',
      partnerKey: '',
      displayName: channel.name,
      description: channel.description || '',
    };
  }

  const hasCurrentMsg = msgs.some(
    (m) =>
      m &&
      (m.senderId === currentUser._id ||
        (m.senderName || '').toLowerCase().trim() === currentNameLower)
  );

  const isParticipant = isParticipantById || (participantIds.length === 0 && hasCurrentMsg);
  if (!isParticipant) {
    return {
      isParticipant: false,
      partnerName: '',
      partnerRole: '',
      partnerKey: '',
      displayName: channel.name,
      description: channel.description || '',
    };
  }

  // Build combined lookup of users (all users + SEED_USERS fallback)
  const seedLookup = SEED_USERS.map((su, idx) => ({
    _id: `usr_${idx + 1}`,
    name: su.name,
    role: su.role,
  }));
  const combinedUsers = [...allUsers, ...seedLookup];

  const cleanPersonName = (raw: string) =>
    raw
      .replace(/^💬\s*/, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim();

  let partnerName = '';
  let partnerRole = '';

  // 1. Highest priority: look up the OTHER participant ID from participantIds
  const otherId = participantIds.find((id) => id !== currentUser._id);
  if (otherId) {
    const matchedUser = combinedUsers.find(
      (u) =>
        (u._id === otherId || (u as any).id === otherId) &&
        cleanPersonName(u.name).toLowerCase() !== currentNameLower
    );
    if (matchedUser) {
      partnerName = cleanPersonName(matchedUser.name);
      partnerRole = matchedUser.role;
    }
  }

  // 2. Second priority: check actual messages in this DM from the OTHER participant
  if (!partnerName) {
    const otherMsg = [...msgs]
      .reverse()
      .find(
        (m) =>
          m &&
          m.senderName &&
          cleanPersonName(m.senderName).toLowerCase() !== currentNameLower &&
          m.senderId !== currentUser._id
      );

    if (otherMsg) {
      partnerName = cleanPersonName(otherMsg.senderName);
      partnerRole = otherMsg.senderRole || 'Team Member';
    }
  }

  // 3. Third priority: parse channel.name if it doesn't match currentUser.name
  if (!partnerName && channel.name) {
    const rawName = channel.name.replace(/^💬\s*/, '').trim();
    const match = rawName.match(/^(.+?)\s*\((.+?)\)$/);
    const candidateName = cleanPersonName(match ? match[1] : rawName);
    const candidateRole = match ? match[2].trim() : 'Team Member';
    if (candidateName && candidateName.toLowerCase() !== currentNameLower) {
      partnerName = candidateName;
      partnerRole = candidateRole;
    }
  }

  // If still no valid partner (or partner is currentUser themselves), hide this channel for currentUser
  if (!partnerName || partnerName.toLowerCase() === currentNameLower) {
    return {
      isParticipant: false,
      partnerName: '',
      partnerRole: '',
      partnerKey: '',
      displayName: channel.name,
      description: channel.description || '',
    };
  }

  const resolvedUser = combinedUsers.find(
    (u) => cleanPersonName(u.name).toLowerCase() === partnerName.toLowerCase()
  );
  if (resolvedUser) {
    partnerName = cleanPersonName(resolvedUser.name);
    if (!partnerRole || partnerRole === 'Member') {
      partnerRole = resolvedUser.role;
    }
  }

  // Strictly isolate partnerKey to the specific pair of participant IDs so it never collides with third-party DMs
  const partnerKey = otherId
    ? [currentUser._id, otherId].sort().join('_')
    : `${currentUser._id}_${partnerName.toLowerCase().trim()}`;

  return {
    isParticipant: true,
    partnerName,
    partnerRole: partnerRole || 'Team Member',
    partnerKey,
    displayName: `💬 ${partnerName} (${partnerRole || 'Team Member'})`,
    description: `Private Direct Message with ${partnerName}`,
  };
}

export function getNewChatMessageCount(
  userTeam?: string,
  userRole?: string,
  currentUserId?: string,
  currentUserName?: string,
  allowInChatPage?: boolean
): {
  total: number;
  byChannel: Record<string, number>;
  latestMessage: ChatMessage | null;
} {
  if (typeof window === 'undefined') {
    return { total: 0, byChannel: {}, latestMessage: null };
  }
  try {
    // If user is currently inside the /chat page, return 0 for global badges unless explicitly allowed
    if (!allowInChatPage && window.location.pathname.startsWith('/chat')) {
      return { total: 0, byChannel: {}, latestMessage: null };
    }

    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return { total: 0, byChannel: {}, latestMessage: null };
    const allMsgs: Record<string, ChatMessage[]> = JSON.parse(raw);
    const dismissed = new Set<string>(getDismissedMessageIds(currentUserId));
    const tsMap = getLastReadTimestamps(currentUserId);
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

      // If direct channel, skip if current user is not a participant
      if (chId.startsWith('dm_') || ch?.scope === 'direct') {
        const dmParts = extractDmParticipantIds(chId);
        if (currentUserId && dmParts.length >= 2 && !dmParts.includes(currentUserId)) {
          return;
        }
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
        if (isMessageAlreadyRead(m, chId, dismissed, tsMap)) return false;
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
    const parsed: ChatChannel[] = JSON.parse(raw);
    let repaired = false;
    const channels = parsed.map((ch) => {
      if (ch && (ch.scope === 'direct' || ch.id.startsWith('dm_'))) {
        const realParts = extractDmParticipantIds(ch.id);
        if (
          realParts.length >= 2 &&
          (!ch.participantIds ||
            ch.participantIds.length < 2 ||
            ch.participantIds.includes('usr') ||
            ch.participantIds.includes('u'))
        ) {
          repaired = true;
          return { ...ch, participantIds: realParts };
        }
      }
      return ch;
    });
    if (repaired) {
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(channels));
    }
    return channels;
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
    const nowMs = Date.now();

    const serverMap = data.messagesByChannel as Record<string, ChatMessage[]>;
    const allChannelIds = new Set([
      ...Object.keys(INITIAL_MESSAGES),
      ...Object.keys(localMsgs),
      ...Object.keys(serverMap),
    ]);

    const currentChannels = getStoredChannels();
    let channelsChanged = false;

    allChannelIds.forEach((channelId) => {
      const serverList: ChatMessage[] = Array.isArray(serverMap[channelId]) ? serverMap[channelId] : [];
      const currentList: ChatMessage[] = Array.isArray(localMsgs[channelId]) ? localMsgs[channelId] : [];

      const existingIds = new Set(currentList.filter(Boolean).map((m) => m.id));
      const serverIds = new Set(serverList.filter(Boolean).map((m) => m.id));

      // 1. Keep local messages that exist on server OR were sent within the last 8 seconds (in-flight POST)
      const retainedLocal = currentList.filter((m) => {
        if (!m || !m.id) return false;
        if (serverIds.has(m.id)) return true;
        const ageMs = nowMs - new Date(m.createdAt || 0).getTime();
        return ageMs < 8000;
      });

      if (retainedLocal.length !== currentList.length) {
        hasChanges = true;
      }

      // 2. Append any newly arrived server messages
      for (const srvMsg of serverList) {
        if (srvMsg && srvMsg.id && !existingIds.has(srvMsg.id)) {
          retainedLocal.push(srvMsg);
          existingIds.add(srvMsg.id);
          newlyDiscovered.push({ channelId, message: srvMsg });
          hasChanges = true;
        }
      }

      retainedLocal.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
      localMsgs[channelId] = retainedLocal;

      // 3. Auto-create missing Direct Message (dm_) channel & update channel preview
      if (channelId.startsWith('dm_') && retainedLocal.length > 0) {
        const existsCh = currentChannels.some((c) => c && c.id === channelId);
        const parts = extractDmParticipantIds(channelId);
        const sampleMsg = retainedLocal[retainedLocal.length - 1];
        if (!existsCh) {
          currentChannels.unshift({
            id: channelId,
            name: `💬 ${sampleMsg?.senderName || 'Team Member'} (${sampleMsg?.senderRole || 'Member'})`,
            scope: 'direct',
            participantIds: parts,
            description: `Direct Message with ${sampleMsg?.senderName || 'Team Member'}`,
            lastMessage: String(sampleMsg?.text || '').slice(0, 40) || 'Direct message',
            lastMessageTime: new Date(sampleMsg?.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          });
          channelsChanged = true;
        } else {
          const idx = currentChannels.findIndex((c) => c && c.id === channelId);
          if (
            idx !== -1 &&
            (!currentChannels[idx].participantIds ||
              currentChannels[idx].participantIds?.includes('usr') ||
              (currentChannels[idx].participantIds?.length || 0) < 2)
          ) {
            currentChannels[idx] = { ...currentChannels[idx], participantIds: parts };
            channelsChanged = true;
          }
        }
      }
    });

    if (channelsChanged) {
      localStorage.setItem(CHANNELS_KEY, JSON.stringify(currentChannels));
    }

    if (hasChanges || newlyDiscovered.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(localMsgs));
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/chat')) {
        markChannelMessagesAsRead();
      }
      window.dispatchEvent(
        new CustomEvent('taskflow_chat_synced', {
          detail: { newMessages: newlyDiscovered },
        })
      );
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
      markChannelMessagesAsRead(channelId, sender._id);

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
