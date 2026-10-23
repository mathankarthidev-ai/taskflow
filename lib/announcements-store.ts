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
      { userId: 'usr_1', userName: 'Anirudh Krishnakumar' },
      { userId: 'usr_3', userName: 'Aravind Kalaivanan' },
      { userId: 'usr_5', userName: 'Deva Priya D A' },
      { userId: 'usr_6', userName: 'Thanikaivel Arumugam' },
      { userId: 'usr_12', userName: 'Sathish Kumar' },
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
    applicableTo: 'All',
    createdAt: '27 May 5:35 AM',
    content: 'Hello Team, New automated clock-in/out and leave tracking workflows are now live. Please review your shift hours and ensure breaks are logged accurately in the portal.',
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
    title: 'Timesheet Update',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'All',
    createdAt: '25 May 7:21 AM',
    content: 'Reminder to all team members: please ensure all weekly timesheet logs and hourly work tracker entries are submitted before 5:00 PM every Friday.',
    likes: [
      { userId: 'usr_1', userName: 'Anirudh Krishnakumar' },
      { userId: 'usr_2', userName: 'Mathan P' },
      { userId: 'usr_3', userName: 'Aravind Kalaivanan' },
      { userId: 'usr_4', userName: 'Kennath Franklin J' },
      { userId: 'usr_5', userName: 'Deva Priya D A' },
      { userId: 'usr_6', userName: 'Thanikaivel Arumugam' },
      { userId: 'usr_7', userName: 'Naraine R' },
      { userId: 'usr_8', userName: 'Mathanmk' },
    ],
    comments: [
      {
        id: 'comm_t1',
        authorId: 'usr_6',
        authorName: 'Thanikaivel Arumugam',
        text: 'Timesheet submitted for this week.',
        createdAt: '25 May 8:00 AM',
        likesCount: 1,
      },
    ],
  },
  {
    id: 'ann_1792150000006',
    title: 'Update all your Linkedin Profiles with Immediate Effect',
    authorId: 'usr_1',
    authorName: 'Anirudh Krishnakumar',
    authorRole: 'Director',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    applicableTo: 'All',
    createdAt: '25 May 6:32 AM',
    content: 'Team members are requested to update their LinkedIn employment details to reflect Ambizcon Health / Ambizcon and connect with our official company page.',
    likes: [
      { userId: 'usr_3', userName: 'Aravind Kalaivanan' },
      { userId: 'usr_4', userName: 'Kennath Franklin J' },
      { userId: 'usr_9', userName: 'Mathi Pandian' },
    ],
    comments: [
      {
        id: 'comm_li1',
        authorId: 'usr_9',
        authorName: 'Mathi Pandian',
        text: 'Updated profile and connected!',
        createdAt: '25 May 7:00 AM',
        likesCount: 1,
      },
    ],
  },
];

// Helper to notify other components/tabs
function emitAnnouncementsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ambizcon_announcements_updated'));
  const bc = getBroadcastChannel();
  bc?.postMessage({ type: 'announcements_updated', timestamp: Date.now() });
}

export function getStoredAnnouncements(): Announcement[] {
  if (typeof window === 'undefined') return SEED_ANNOUNCEMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
      return SEED_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ANNOUNCEMENTS));
    return SEED_ANNOUNCEMENTS;
  } catch {
    return SEED_ANNOUNCEMENTS;
  }
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
  if (adminUser.role !== 'Super Admin' && adminUser.role !== 'Admin') {
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

  const newAnn: Announcement = {
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: data.title.trim(),
    content: data.content.trim(),
    authorId: adminUser._id,
    authorName: adminUser.name,
    authorRole: adminUser.role === 'Super Admin' ? 'Director' : adminUser.role,
    authorAvatar: adminUser.avatar,
    applicableTo: data.applicableTo || 'All',
    createdAt: dateFormatted,
    pinned: Boolean(data.pinned),
    likes: [],
    comments: [],
  };

  const updated = [newAnn, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitAnnouncementsChanged();
  }
  return newAnn;
}

export function toggleLikeAnnouncement(announcementId: string, user: User): Announcement | null {
  const list = getStoredAnnouncements();
  const target = list.find((a) => a.id === announcementId);
  if (!target) return null;

  const alreadyLikedIndex = target.likes.findIndex((l) => l.userId === user._id);
  if (alreadyLikedIndex !== -1) {
    // Unlike
    target.likes.splice(alreadyLikedIndex, 1);
  } else {
    // Like
    target.likes.push({
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatar,
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
  const target = list.find((a) => a.id === announcementId);
  if (!target) return null;

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
  const target = list.find((a) => a.id === announcementId);
  if (!target) return false;

  const commentIndex = target.comments.findIndex((c) => c.id === commentId);
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
  if (adminUser.role !== 'Super Admin' && adminUser.role !== 'Admin') {
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
