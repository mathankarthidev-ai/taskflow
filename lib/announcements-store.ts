'use client';

import { User } from '@/types';

export interface AnnouncementComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  likesCount?: number;
}

export interface AnnouncementLike {
  userId: string;
  userName: string;
  userAvatar?: string;
  type?: 'heart' | 'like';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  applicableTo: 'All' | 'Development' | 'Marketing' | 'Creative' | 'Sales' | 'HR' | 'Ambizcon' | 'Ambizcon Health';
  createdAt: string;
  pinned?: boolean;
  likes: AnnouncementLike[];
  comments: AnnouncementComment[];
  readBy?: string[];
}

const STORAGE_KEY = 'ambizcon_announcements_v1';
const SYNC_CHANNEL_NAME = 'ambizcon_announcements_sync';

// BroadcastChannel for cross-tab sync
let announcementsBroadcastChannel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!announcementsBroadcastChannel) {
    try {
      announcementsBroadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    } catch {
      announcementsBroadcastChannel = null;
    }
  }
  return announcementsBroadcastChannel;
}

// Initial announcements matching user's Zoho People screenshots
const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1792150000001',
    title: 'Onboarding New Clients - June 2026',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'All',
    createdAt: '17 June 2:52 PM',
    pinned: true,
    content: `Hello Team,

We are pleased to announce that we are onboarding three new clients with immediate effect. Team Leads will provide further briefings over the coming days regarding project requirements, deliverables, and workflows.

1. Auzskin Aesthetics – Skin Cancer Management Clinic
For this client, we will be managing:
• Website Management
• SEO
• Google Ads

Our Design Team will support creative requirements as needed.
There is also an opportunity for us to take over their social media management in the coming months, subject to our performance, efficiency, and results. Fortnightly email marketing campaigns will also be implemented.

2. Dr Umed Cosmetics – Cosmetic Clinic
For this client, we will be managing:
• Website Management
• Content Creation & Creatives
• Google Ads Campaigns

3. The Pain Collective (TPC) – Medical Specialist Group
For this client, we will be managing:
• Social Media Strategy & Organic Posts
• SEO Optimization & Google My Business Management`,
    likes: [
      { userId: 'usr_1', userName: 'Anirudh Krishnakumar', type: 'heart' },
      { userId: 'usr_3', userName: 'Aravind Kalaivanan', type: 'like' },
      { userId: 'usr_5', userName: 'Deva Priya D A', type: 'heart' },
      { userId: 'usr_6', userName: 'Thanikaivel Arumugam', type: 'heart' },
      { userId: 'usr_12', userName: 'Sathish Kumar', type: 'like' },
    ],
    comments: [
      {
        id: 'comm_1',
        authorId: 'usr_12',
        authorName: 'Sathish Kumar',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        text: 'Great news! Looking forward to working on this project and delivering great results.',
        createdAt: '17 June 2:59 PM',
        likesCount: 1,
      },
      {
        id: 'comm_2',
        authorId: 'usr_9',
        authorName: 'Mathi Pandian',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        text: 'Great opportunities ahead! Looking forward to collaborating across all three clients and driving strong performance results.',
        createdAt: '17 June 3:12 PM',
        likesCount: 1,
      },
      {
        id: 'comm_3',
        authorId: 'usr_5',
        authorName: 'Deva Priya D A',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        text: 'Great! Looking forward to it.',
        createdAt: '17 June 3:15 PM',
        likesCount: 0,
      },
      {
        id: 'comm_4',
        authorId: 'usr_3',
        authorName: 'Aravind Kalaivanan',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        text: 'Workflows and tasks are aligned with development team.',
        createdAt: '17 June 3:20 PM',
        likesCount: 0,
      },
    ],
  },
  {
    id: 'ann_1792150000002',
    title: 'Yoga Sessions Update',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'All',
    createdAt: '08 June 7:26 AM',
    content: 'Hello everyone, Starting next Monday, we will have weekly wellness & yoga sessions every Wednesday morning from 8:30 AM to 9:00 AM. Attendance is optional but strongly encouraged for team well-being!',
    likes: [
      { userId: 'usr_3', userName: 'Aravind Kalaivanan' },
      { userId: 'usr_6', userName: 'Thanikaivel Arumugam' },
      { userId: 'usr_14', userName: 'Kasthuri M' },
    ],
    comments: [
      {
        id: 'comm_y1',
        authorId: 'usr_14',
        authorName: 'Kasthuri M',
        text: 'Looking forward to the Wednesday wellness session!',
        createdAt: '08 June 8:10 AM',
        likesCount: 1,
      },
      {
        id: 'comm_y2',
        authorId: 'usr_7',
        authorName: 'Naraine R',
        text: 'Awesome initiative for team wellness.',
        createdAt: '08 June 9:00 AM',
        likesCount: 1,
      },
    ],
  },
  {
    id: 'ann_1792150000003',
    title: 'Friday 29th May to a Holiday',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'All',
    createdAt: '28 May 5:47 AM',
    content: 'Dear Team, Please be informed that Friday, 29th May is declared an official office holiday for all team members. Enjoy your extended weekend!',
    likes: [
      { userId: 'usr_7', userName: 'Naraine R' },
      { userId: 'usr_8', userName: 'Mathanmk' },
    ],
    comments: [
      {
        id: 'comm_h1',
        authorId: 'usr_8',
        authorName: 'Mathanmk',
        text: 'Thank you Sir! Have a great weekend everyone.',
        createdAt: '28 May 6:30 AM',
        likesCount: 2,
      },
    ],
  },
  {
    id: 'ann_1792150000004',
    title: 'Updated Setting for Leave and attendance Managment',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'Development',
    createdAt: '27 May 5:35 AM',
    content: 'Hello Development Team, New automated clock-in/out and leave tracking workflows are now live. Please review your shift hours and ensure breaks are logged accurately in the portal.',
    likes: [],
    comments: [
      {
        id: 'comm_l1',
        authorId: 'usr_3',
        authorName: 'Aravind Kalaivanan',
        text: 'Noted. Team members will log their lunch & tea breaks through the kiosk.',
        createdAt: '27 May 6:00 AM',
        likesCount: 1,
      },
    ],
  },
  {
    id: 'ann_1792150000005',
    title: 'Creative Design Assets & UI Guidelines',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'Creative',
    createdAt: '25 May 7:21 AM',
    content: 'Creative Team: Please ensure all project assets and Figma design systems adhere to the updated brand palette and client design tokens.',
    likes: [
      { userId: 'usr_1', userName: 'Anirudh Krishnakumar', type: 'heart' },
      { userId: 'usr_2', userName: 'Mathan P', type: 'like' },
      { userId: 'usr_3', userName: 'Aravind Kalaivanan', type: 'like' },
      { userId: 'usr_4', userName: 'Kennath Franklin J', type: 'heart' },
      { userId: 'usr_5', userName: 'Deva Priya D A', type: 'heart' },
      { userId: 'usr_6', userName: 'Thanikaivel Arumugam', type: 'like' },
      { userId: 'usr_7', userName: 'Naraine R', type: 'like' },
      { userId: 'usr_8', userName: 'Mathanmk', type: 'heart' },
    ],
    comments: [
      {
        id: 'comm_t1',
        authorId: 'usr_6',
        authorName: 'Thanikaivel Arumugam',
        text: 'Design tokens and assets synced.',
        createdAt: '25 May 8:00 AM',
        likesCount: 1,
      },
    ],
  },
  {
    id: 'ann_1792150000006',
    title: 'Marketing Campaign Performance & Q4 Targets',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'Marketing',
    createdAt: '25 May 6:32 AM',
    content: 'Marketing Team: Review weekly organic traffic, Google Ads conversions, and client social campaigns before Friday reporting sync.',
    likes: [
      { userId: 'usr_3', userName: 'Aravind Kalaivanan', type: 'like' },
      { userId: 'usr_4', userName: 'Kennath Franklin J', type: 'heart' },
      { userId: 'usr_9', userName: 'Mathi Pandian', type: 'like' },
    ],
    comments: [
      {
        id: 'comm_li1',
        authorId: 'usr_9',
        authorName: 'Mathi Pandian',
        text: 'Updated performance sheets and submitted!',
        createdAt: '25 May 7:00 AM',
        likesCount: 1,
      },
    ],
  },
];

/**
 * Defensive sanitizer ensuring every announcement has required fields and valid arrays
 */
export function sanitizeAnnouncement(raw: any): Announcement {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: 'Company Announcement',
      content: '',
      authorId: 'usr_1',
      authorName: 'Anirudh Krishnakumar',
      authorRole: 'Director',
      applicableTo: 'All',
      createdAt: 'Just now',
      likes: [],
      comments: [],
    };
  }

  const safeLikes: AnnouncementLike[] = Array.isArray(raw.likes)
    ? raw.likes
        .filter((l: any) => l && typeof l === 'object' && l.userId)
        .map((l: any) => ({
          userId: String(l.userId),
          userName: String(l.userName || 'Team Member'),
          userAvatar: l.userAvatar ? String(l.userAvatar) : undefined,
          type: l.type === 'heart' ? 'heart' : 'like',
        }))
    : [];

  const safeComments: AnnouncementComment[] = Array.isArray(raw.comments)
    ? raw.comments
        .filter((c: any) => c && typeof c === 'object' && c.id)
        .map((c: any) => ({
          id: String(c.id),
          authorId: String(c.authorId || 'usr_1'),
          authorName: String(c.authorName || 'Team Member'),
          authorRole: c.authorRole ? String(c.authorRole) : undefined,
          authorAvatar: c.authorAvatar ? String(c.authorAvatar) : undefined,
          text: String(c.text || ''),
          createdAt: String(c.createdAt || 'Just now'),
          likesCount: typeof c.likesCount === 'number' ? c.likesCount : 0,
        }))
    : [];

  const safeReadBy: string[] = Array.isArray(raw.readBy)
    ? raw.readBy.filter((id: any) => typeof id === 'string')
    : [];

  return {
    id: String(raw.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    title: String(raw.title || 'Company Announcement'),
    content: String(raw.content || ''),
    authorId: String(raw.authorId || 'usr_1'),
    authorName: String(raw.authorName || 'Anirudh Krishnakumar'),
    authorRole: String(raw.authorRole || 'Director'),
    authorAvatar: raw.authorAvatar ? String(raw.authorAvatar) : undefined,
    applicableTo: raw.applicableTo || 'All',
    createdAt: String(raw.createdAt || 'Just now'),
    pinned: Boolean(raw.pinned),
    likes: safeLikes,
    comments: safeComments,
    readBy: safeReadBy,
  };
}

// Helper to notify other components/tabs
function emitAnnouncementsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ambizcon_announcements_updated'));
  const bc = getBroadcastChannel();
  bc?.postMessage({ type: 'announcements_updated', timestamp: Date.now() });
}

export function getStoredAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return SEED_ANNOUNCEMENTS.map(sanitizeAnnouncement);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
      return SEED_ANNOUNCEMENTS.map(sanitizeAnnouncement);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.map(sanitizeAnnouncement);
      // Ensure all seed announcements are guaranteed to exist even if local cache is partial
      const existingIds = new Set(sanitized.map((p) => p.id));
      const missingSeeds = SEED_ANNOUNCEMENTS.filter((s) => !existingIds.has(s.id)).map(sanitizeAnnouncement);

      const merged = [...sanitized, ...missingSeeds];
      if (missingSeeds.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
    return SEED_ANNOUNCEMENTS.map(sanitizeAnnouncement);
  } catch {
    return SEED_ANNOUNCEMENTS.map(sanitizeAnnouncement);
  }
}

export function resetAnnouncementsToDefaults(): Announcement[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
    emitAnnouncementsChanged();
  }
  return SEED_ANNOUNCEMENTS.map(sanitizeAnnouncement);
}

/**
 * Role & Team Scoping for Announcements:
 * - Admin (Super Admin & Admin): Can see all announcements across all teams and departments.
 * - Team Lead (TL) & Team Member (Mem): Can see All-organization announcements and ONLY their own team (not other teams).
 */
export function getVisibleAnnouncementsForUser(
  announcements: Announcement[],
  user: User | null
): Announcement[] {
  if (!Array.isArray(announcements)) return [];
  const safeList = announcements.filter(Boolean).map(sanitizeAnnouncement);
  if (!user) return safeList;
  const roleLower = (user.role || '').toLowerCase().trim();
  const isAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    user.email === 'anirudh@ambizcon.com' ||
    user.email === 'mathan@ambizcon.com' ||
    roleLower === 'director';

  if (isAdmin) return safeList;

  const rawUserTeam = (user.team || '').toLowerCase().trim();
  // Normalize team: "development team" -> "development"
  const cleanUserTeam = rawUserTeam.replace(/\s*team\s*/i, '').trim();

  return safeList.filter((ann) => {
    // 1. All-company broadcasts are visible to all members
    const target = (ann.applicableTo || 'All').toLowerCase().trim();
    if (
      target === 'all' ||
      target === 'ambizcon' ||
      target === 'ambizcon health' ||
      target === 'all teams' ||
      target === 'organization'
    ) {
      return true;
    }
    // 2. Team-specific announcements are ONLY visible to members of that specific team
    const cleanAnnTeam = target.replace(/\s*team\s*/i, '').trim();
    return cleanAnnTeam === cleanUserTeam || target === rawUserTeam;
  });
}

export function getAnnouncementsCount(): number {
  return getStoredAnnouncements().length;
}

export function createAnnouncement(
  data: {
    title: string;
    content: string;
    applicableTo?: Announcement['applicableTo'];
    pinned?: boolean;
  },
  adminUser: User
): Announcement {
  const roleLower = (adminUser.role || '').toLowerCase().trim();
  const isAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    adminUser.email === 'anirudh@ambizcon.com' ||
    adminUser.email === 'mathan@ambizcon.com' ||
    roleLower === 'director';

  if (!isAdmin) {
    throw new Error('Permission denied: Only Admin can create announcements.');
  }

  const list = getStoredAnnouncements();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const newAnn: Announcement = sanitizeAnnouncement({
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: (data.title || '').trim(),
    content: (data.content || '').trim(),
    authorId: adminUser._id,
    authorName: adminUser.name,
    authorRole: adminUser.role === 'Super Admin' ? 'Director' : adminUser.role,
    authorAvatar: adminUser.avatar,
    applicableTo: data.applicableTo || 'All',
    createdAt: dateFormatted,
    pinned: Boolean(data.pinned),
    likes: [],
    comments: [],
  });

  const updated = [newAnn, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitAnnouncementsChanged();
  }
  return newAnn;
}

const READ_STORAGE_KEY_PREFIX = 'ambizcon_announcements_read_';

export function getUserReadAnnouncementIds(userId: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${READ_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isAnnouncementRead(announcementId: string, userId: string, announcements?: Announcement[]): boolean {
  if (!userId || !announcementId) return true;
  const userReadIds = getUserReadAnnouncementIds(userId);
  if (userReadIds.includes(announcementId)) return true;

  const list = announcements || getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);
  return Boolean(target?.readBy && Array.isArray(target.readBy) && target.readBy.includes(userId));
}

export function markAnnouncementAsRead(announcementId: string, userId: string): boolean {
  if (!userId || !announcementId) return false;
  const list = getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);

  if (target) {
    if (!Array.isArray(target.readBy)) target.readBy = [];
    if (!target.readBy.includes(userId)) {
      target.readBy.push(userId);
    }
  }

  if (typeof window !== 'undefined') {
    const userReadIds = getUserReadAnnouncementIds(userId);
    if (!userReadIds.includes(announcementId)) {
      userReadIds.push(announcementId);
      localStorage.setItem(`${READ_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(userReadIds));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
  return true;
}

export function markAnnouncementAsUnread(announcementId: string, userId: string): boolean {
  if (!userId || !announcementId) return false;
  const list = getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);

  if (target && Array.isArray(target.readBy)) {
    target.readBy = target.readBy.filter((id) => id !== userId);
  }

  if (typeof window !== 'undefined') {
    const userReadIds = getUserReadAnnouncementIds(userId).filter((id) => id !== announcementId);
    localStorage.setItem(`${READ_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(userReadIds));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
  return true;
}

export function markAllAnnouncementsAsRead(userId: string): void {
  if (!userId) return;
  const list = getStoredAnnouncements();
  const allIds = list.map((a) => a.id);

  list.forEach((a) => {
    if (!Array.isArray(a.readBy)) a.readBy = [];
    if (!a.readBy.includes(userId)) {
      a.readBy.push(userId);
    }
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${READ_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(allIds));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
}

export function getUnreadAnnouncementsCount(
  userId: string,
  userOrAnnouncements?: User | Announcement[] | null,
  maybeAnnouncements?: Announcement[]
): number {
  if (!userId) return 0;
  let user: User | null = null;
  let announcements: Announcement[] | undefined = undefined;

  if (Array.isArray(userOrAnnouncements)) {
    announcements = userOrAnnouncements;
  } else if (userOrAnnouncements && typeof userOrAnnouncements === 'object' && '_id' in userOrAnnouncements) {
    user = userOrAnnouncements as User;
    announcements = maybeAnnouncements;
  }

  const rawList = Array.isArray(announcements) ? announcements : getStoredAnnouncements();
  const visible = user ? getVisibleAnnouncementsForUser(rawList, user) : rawList;
  const userReadIds = new Set(getUserReadAnnouncementIds(userId));
  return visible.filter((a) => a && !userReadIds.has(a.id) && !(Array.isArray(a.readBy) && a.readBy.includes(userId))).length;
}

export function getHeartLikesCount(ann?: Announcement | null): number {
  if (!ann || !Array.isArray(ann.likes)) return 0;
  return ann.likes.filter((l) => l && l.type === 'heart').length;
}

export function getThumbLikesCount(ann?: Announcement | null): number {
  if (!ann || !Array.isArray(ann.likes)) return 0;
  return ann.likes.filter((l) => l && l.type !== 'heart').length;
}

export function toggleLikeAnnouncement(
  announcementId: string,
  user: User,
  reactionType: 'heart' | 'like' = 'heart'
): Announcement | null {
  const list = getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);
  if (!target) return null;

  if (!Array.isArray(target.likes)) {
    target.likes = [];
  }

  const alreadyLikedIndex = target.likes.findIndex((l) => l && l.userId === user._id);
  if (alreadyLikedIndex !== -1) {
    const existing = target.likes[alreadyLikedIndex];
    const currentType = existing?.type || 'like';
    if (currentType === reactionType) {
      // Toggle off if same reaction clicked
      target.likes.splice(alreadyLikedIndex, 1);
    } else {
      // Switch reaction (e.g. from thumbs up to heart or vice-versa)
      target.likes[alreadyLikedIndex] = {
        userId: user._id,
        userName: user.name,
        userAvatar: user.avatar,
        type: reactionType,
      };
    }
  } else {
    // Like with chosen reaction
    target.likes.push({
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      type: reactionType,
    });
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
  return target;
}

export function addCommentToAnnouncement(
  announcementId: string,
  commentText: string,
  user: User
): AnnouncementComment | null {
  if (!commentText.trim()) return null;
  const list = getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);
  if (!target) return null;

  if (!Array.isArray(target.comments)) {
    target.comments = [];
  }

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const newComment: AnnouncementComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorId: user._id,
    authorName: user.name,
    authorAvatar: user.avatar,
    authorRole: user.role,
    text: commentText.trim(),
    createdAt: dateFormatted,
    likesCount: 0,
  };

  target.comments.push(newComment);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
  return newComment;
}

export function deleteCommentFromAnnouncement(
  announcementId: string,
  commentId: string,
  userId: string,
  isAdmin: boolean
): boolean {
  const list = getStoredAnnouncements();
  const target = list.find((a) => a && a.id === announcementId);
  if (!target || !Array.isArray(target.comments)) return false;

  const commentIndex = target.comments.findIndex((c) => c && c.id === commentId);
  if (commentIndex === -1) return false;

  // Only comment author or admin can delete
  if (target.comments[commentIndex].authorId !== userId && !isAdmin) {
    return false;
  }

  target.comments.splice(commentIndex, 1);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitAnnouncementsChanged();
  }
  return true;
}

export function deleteAnnouncement(announcementId: string, adminUser: User): boolean {
  const roleLower = (adminUser.role || '').toLowerCase().trim();
  const isAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    adminUser.email === 'anirudh@ambizcon.com' ||
    adminUser.email === 'mathan@ambizcon.com' ||
    roleLower === 'director';

  if (!isAdmin) {
    return false;
  }
  const list = getStoredAnnouncements();
  const filtered = list.filter((a) => a.id !== announcementId);
  if (filtered.length === list.length) return false;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    emitAnnouncementsChanged();
  }
  return true;
}
