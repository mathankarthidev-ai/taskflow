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

const STORAGE_KEY = 'ambizcon_announcements_v2';
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

// All old announcement data removed - clean starting slate
const SEED_ANNOUNCEMENTS: Announcement[] = [];

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
  if (typeof window === 'undefined') return [];
  try {
    // Purge any old legacy announcements from local storage
    if (localStorage.getItem('ambizcon_announcements_v1')) {
      localStorage.removeItem('ambizcon_announcements_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeAnnouncement);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

export function clearAllAnnouncements(): Announcement[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem('ambizcon_announcements_v1');
    emitAnnouncementsChanged();
  }
  return [];
}

export function resetAnnouncementsToDefaults(): Announcement[] {
  return clearAllAnnouncements();
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
