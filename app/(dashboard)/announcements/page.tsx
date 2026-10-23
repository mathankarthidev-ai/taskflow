'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Announcement,
  getStoredAnnouncements,
  getVisibleAnnouncementsForUser,
  isAnnouncementRead,
  markAnnouncementAsRead,
  markAnnouncementAsUnread,
  markAllAnnouncementsAsRead,
  getUnreadAnnouncementsCount,
  getHeartLikesCount,
  getThumbLikesCount,
  toggleLikeAnnouncement,
  resetAnnouncementsToDefaults,
  clearAllAnnouncements,
  sanitizeAnnouncement,
} from '@/lib/announcements-store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AnnouncementDetailModal } from '@/components/announcements/AnnouncementDetailModal';
import { CreateAnnouncementModal } from '@/components/announcements/CreateAnnouncementModal';
import {
  Megaphone,
  Plus,
  ThumbsUp,
  Heart,
  MessageSquare,
  Search,
  Pin,
  Calendar,
  Users,
  Building2,
  Sparkles,
  Check,
  CheckCircle2,
  CheckCheck,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [isMounted, setIsMounted] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const roleLower = (currentUser?.role || '').toLowerCase().trim();
  const isAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    currentUser?.email === 'anirudh@ambizcon.com' ||
    currentUser?.email === 'mathan@ambizcon.com' ||
    roleLower === 'director';

  const userTeam = (currentUser?.team || 'Development').replace(/\s*team\s*/i, '').trim();

  const loadAnnouncements = () => {
    try {
      const list = getStoredAnnouncements();
      setAnnouncements([...list]);

      // Update selected announcement reference if modal is open
      if (selectedAnnouncement) {
        const refreshed = list.find((a) => a && a.id === selectedAnnouncement.id);
        if (refreshed) {
          setSelectedAnnouncement(refreshed);
        }
      }
    } catch (e) {
      console.error('Failed to load announcements:', e);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadAnnouncements();
    const handleSync = () => loadAnnouncements();
    window.addEventListener('ambizcon_announcements_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ambizcon_announcements_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Base list of announcements visible to this user
  // Admin: can see all announcements across all teams
  // Mem and TL: can only see 'All' and their own team, not other teams
  const visibleAnnouncements = useMemo(() => {
    if (!isMounted) return [];
    return getVisibleAnnouncementsForUser(announcements, currentUser);
  }, [announcements, currentUser, isMounted]);

  const unreadCount = useMemo(() => {
    if (!currentUser || !isMounted) return 0;
    return getUnreadAnnouncementsCount(currentUser._id, currentUser, visibleAnnouncements);
  }, [currentUser, isMounted, visibleAnnouncements]);

  // Filter tabs:
  // Admin has all options: All, Unread, Pinned, Development, Marketing, Creative, Sales, HR
  // Mem and TL can see All, Unread, Pinned, and ONLY their own team (not other teams)
  const availableFilterTabs = useMemo(() => {
    if (isAdmin) {
      return [
        { key: 'All', label: `All (${visibleAnnouncements.length})` },
        { key: 'Unread', label: `⚡ Unread (${unreadCount})` },
        { key: 'Pinned', label: '📌 Pinned' },
        { key: 'Development', label: 'Development' },
        { key: 'Marketing', label: 'Marketing' },
        { key: 'Creative', label: 'Creative' },
        { key: 'Sales', label: 'Sales' },
        { key: 'HR', label: 'HR' },
      ];
    }

    // Mem and TL: Only their own team tab, no other teams!
    return [
      { key: 'All', label: `All (${visibleAnnouncements.length})` },
      { key: 'Unread', label: `⚡ Unread (${unreadCount})` },
      { key: 'Pinned', label: '📌 Pinned' },
      { key: userTeam, label: `${userTeam} Team` },
    ];
  }, [isAdmin, visibleAnnouncements.length, unreadCount, userTeam]);

  // Fallback to 'All' if current filter key is not available to this user's role/team
  useEffect(() => {
    const validKeys = availableFilterTabs.map((t) => t.key);
    if (!validKeys.includes(selectedFilter)) {
      setSelectedFilter('All');
    }
  }, [availableFilterTabs, selectedFilter]);

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    markAllAnnouncementsAsRead(currentUser._id);
    loadAnnouncements();
    toast.success('All announcements marked as read');
  };

  const handleToggleRead = (announcementId: string, isRead: boolean) => {
    if (!currentUser) return;
    if (isRead) {
      markAnnouncementAsUnread(announcementId, currentUser._id);
      toast.info('Marked as unread');
    } else {
      markAnnouncementAsRead(announcementId, currentUser._id);
      toast.success('Marked as read');
    }
    loadAnnouncements();
  };

  const handleToggleReaction = (announcementId: string, type: 'heart' | 'like') => {
    if (!currentUser) return;
    toggleLikeAnnouncement(announcementId, currentUser, type);
    loadAnnouncements();
  };

  const handleResetDefaults = () => {
    const reset = resetAnnouncementsToDefaults();
    setAnnouncements([...reset]);
    toast.success('Official announcements synchronized to standard roster');
  };

  // Filtered list derived from visibleAnnouncements
  const filteredAnnouncements = useMemo(() => {
    return visibleAnnouncements.filter((ann) => {
      if (!ann) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (ann.title || '').toLowerCase().includes(q);
        const matchAuthor = (ann.authorName || '').toLowerCase().includes(q);
        const matchContent = (ann.content || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchContent) return false;
      }

      // Category / Team filter
      if (selectedFilter === 'Unread') {
        return currentUser ? !isAnnouncementRead(ann.id, currentUser._id, visibleAnnouncements) : false;
      }
      if (selectedFilter === 'Pinned') {
        return Boolean(ann.pinned);
      }
      if (selectedFilter !== 'All') {
        const cleanFilter = selectedFilter.toLowerCase().replace(/\s*team\s*/i, '').trim();
        const cleanAnn = (ann.applicableTo || '').toLowerCase().replace(/\s*team\s*/i, '').trim();
        return cleanAnn === cleanFilter;
      }
      return true;
    });
  }, [visibleAnnouncements, searchQuery, selectedFilter, currentUser]);

  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50" />
        <div className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
        <div className="space-y-3">
          <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
          <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border ambizcon-hero-banner p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl ambizcon-gradient text-white shadow-glow shrink-0">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Organization Announcements
              </h1>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-mono font-extrabold px-2 py-0.5">
                {visibleAnnouncements.length} {isAdmin ? 'Official Bulletins (All Teams)' : `${userTeam} & Company Bulletins`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin
                ? 'Official company updates, client onboardings, holiday schedules, and team briefings across all departments. Only Admin can post; all members can like and comment.'
                : `Official company updates and ${userTeam} team briefings. You can view all company broadcasts and ${userTeam} team bulletins.`}
            </p>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && announcements.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to remove all old announcement data?')) {
                  const cleaned = clearAllAnnouncements();
                  setAnnouncements([...cleaned]);
                  toast.success('All announcement data removed');
                }
              }}
              className="text-xs font-bold gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
              title="Remove all announcements"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Announcements</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="ambizcon-gradient text-white text-xs font-extrabold gap-2 shadow-glow px-4 py-2 hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              <span>Create Announcement</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title, author, or content..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background focus-ring font-medium"
          />
        </div>

        {/* Filter Pills & Mark All Read */}
        <div className="flex items-center justify-between gap-2 flex-wrap flex-1">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {availableFilterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedFilter === tab.key
                    ? 'ambizcon-gradient text-white shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {currentUser && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
              title="Mark all announcements as read"
            >
              <CheckCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements List (Zoho People Style matching Screenshot 3) */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <Card className="p-12 text-center space-y-3 border-dashed border-zinc-200 dark:border-zinc-800">
            <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">No announcements found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search keywords.'
                : 'All old announcements have been removed. Admins can create and post new official announcements here anytime.'}
            </p>
            {isAdmin && !searchQuery && (
              <div className="pt-2">
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="ambizcon-gradient text-white text-xs font-bold gap-1.5 shadow-glow"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Announcement</span>
                </Button>
              </div>
            )}
          </Card>
        ) : (
          filteredAnnouncements.map((ann) => {
            if (!ann) return null;
            const likes = Array.isArray(ann.likes) ? ann.likes : [];
            const comments = Array.isArray(ann.comments) ? ann.comments : [];
            const myLike = currentUser ? likes.find((l) => l && l.userId === currentUser._id) : null;
            const isHearted = myLike?.type === 'heart';
            const isThumbLiked = myLike && myLike.type !== 'heart';
            const heartCount = getHeartLikesCount(ann);
            const thumbCount = getThumbLikesCount(ann);
            const isRead = currentUser ? isAnnouncementRead(ann.id, currentUser._id, visibleAnnouncements) : true;
            const safeContent = ann.content || '';

            return (
              <div
                key={ann.id}
                onClick={() => {
                  setSelectedAnnouncement(ann);
                  setIsDetailOpen(true);
                }}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !isRead
                    ? 'border-amber-500/40 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] hover:border-amber-500/60'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-card hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 hover:border-brand-500/40'
                }`}
              >
                {/* Left: Author Avatar + Title + Meta */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Avatar
                    src={ann.authorAvatar}
                    name={ann.authorName || 'Ambizcon Member'}
                    userId={ann.authorId}
                    size="md"
                    className="h-11 w-11 shrink-0 ring-2 ring-brand-500/20 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand-500 transition-colors leading-tight">
                        {ann.title || 'Company Announcement'}
                      </h3>
                      {!isRead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                          Unread
                        </span>
                      )}
                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground/80">{ann.authorName || 'Ambizcon Team'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="h-3 w-3 text-brand-500" />
                        {ann.createdAt || 'Recent'}
                      </span>
                      <span>•</span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold">
                        Applicable: {ann.applicableTo || 'All'}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed pt-0.5">
                      {safeContent.replace(/\n+/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Right: Heart Symbol + Like + Comments + Mark Read Toggle */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                  {/* Heart Symbol Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(ann.id, 'heart');
                    }}
                    title={isHearted ? 'Hearted by you (Click to remove)' : 'React with Heart ❤️'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isHearted
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-extrabold shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isHearted ? 'fill-rose-500 text-rose-500' : 'text-rose-500'}`} />
                    <span>{heartCount}</span>
                  </button>

                  {/* Thumbs Up Like Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(ann.id, 'like');
                    }}
                    title={isThumbLiked ? 'Liked by you (Click to remove)' : 'React with Thumbs Up 👍'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isThumbLiked
                        ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/40 font-extrabold shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${isThumbLiked ? 'fill-blue-500 text-blue-500' : 'text-blue-500'}`} />
                    <span>{thumbCount}</span>
                  </button>

                  {/* Comment Count Badge */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-muted-foreground group-hover:text-foreground transition-colors">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{comments.length}</span>
                  </div>

                  {/* Mark as Read / Unread Option */}
                  {currentUser && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRead(ann.id, isRead);
                      }}
                      title={isRead ? 'Mark as unread' : 'Mark as read'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                        isRead
                          ? 'bg-transparent border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 shadow-xs'
                      }`}
                    >
                      {isRead ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="hidden sm:inline">Read</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Mark Read</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAnnouncement(null);
        }}
        onUpdate={loadAnnouncements}
      />

      <CreateAnnouncementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadAnnouncements}
      />
    </div>
  );
}
