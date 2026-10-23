'use client';

import React from 'react';
import {
  Announcement,
  isAnnouncementRead,
  markAllAnnouncementsAsRead,
  getUnreadAnnouncementsCount,
  getHeartLikesCount,
  getThumbLikesCount,
  getVisibleAnnouncementsForUser,
} from '@/lib/announcements-store';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import {
  Megaphone,
  Plus,
  ThumbsUp,
  Heart,
  MessageSquare,
  ExternalLink,
  Pin,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import Link from 'next/link';

interface AnnouncementsQuickDropdownProps {
  announcements: Announcement[];
  onSelectAnnouncement: (ann: Announcement) => void;
  onOpenCreate: () => void;
  onClose: () => void;
  isAdmin: boolean;
}

export function AnnouncementsQuickDropdown({
  announcements,
  onSelectAnnouncement,
  onOpenCreate,
  onClose,
  isAdmin,
}: AnnouncementsQuickDropdownProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const visibleAnnouncements = getVisibleAnnouncementsForUser(announcements, currentUser);
  const unreadCount = currentUser ? getUnreadAnnouncementsCount(currentUser._id, currentUser, visibleAnnouncements) : 0;

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    markAllAnnouncementsAsRead(currentUser._id);
  };

  return (
    <div className="absolute right-0 mt-2 w-84 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-2xl glass-panel z-50 animate-fade">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Megaphone className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-black text-foreground">
            Announcements
          </span>
          {unreadCount > 0 ? (
            <Badge className="bg-rose-500 text-white border-transparent text-[10px] font-mono font-extrabold px-1.5 py-0.2 animate-pulse">
              {unreadCount} New
            </Badge>
          ) : (
            <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-bold px-1.5 py-0.2">
              {visibleAnnouncements.length} Total
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {currentUser && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ambizcon-gradient text-white text-[10px] font-extrabold shadow-sm hover:opacity-95 transition-all"
              title="Create new announcement (Admin only)"
            >
              <Plus className="h-3 w-3" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80 overflow-y-auto my-1 pr-1">
        {visibleAnnouncements.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No announcements published for your team yet.
          </p>
        ) : (
          visibleAnnouncements.map((ann) => {
            const isRead = currentUser ? isAnnouncementRead(ann.id, currentUser._id, visibleAnnouncements) : true;
            const heartCount = getHeartLikesCount(ann);
            const thumbCount = getThumbLikesCount(ann);

            return (
              <div
                key={ann.id}
                onClick={() => {
                  onClose();
                  onSelectAnnouncement(ann);
                }}
                className={`py-2.5 px-2 rounded-xl cursor-pointer transition-colors space-y-1 ${
                  !isRead
                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                    : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Unread" />
                    )}
                    <h5 className="font-bold text-xs text-foreground line-clamp-1 hover:text-brand-500 transition-colors">
                      {ann.pinned && <Pin className="inline h-3 w-3 text-amber-500 mr-1 shrink-0" />}
                      {ann.title}
                    </h5>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5 text-brand-500" />
                    {ann.createdAt}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {ann.content}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-zinc-500 font-medium truncate max-w-[170px]">
                    By {ann.authorName} • <span className="font-semibold text-foreground">[{ann.applicableTo}]</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {heartCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-bold text-rose-500">
                        <Heart className="h-2.5 w-2.5 fill-rose-500" />
                        {heartCount}
                      </span>
                    )}
                    {thumbCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 dark:text-blue-400">
                        <ThumbsUp className="h-2.5 w-2.5 fill-blue-500" />
                        {thumbCount}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {ann.comments.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer link to full Announcements page */}
      <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Real-time company broadcasts
        </span>
        <Link
          href="/announcements"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        >
          <span>View All Announcements</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
