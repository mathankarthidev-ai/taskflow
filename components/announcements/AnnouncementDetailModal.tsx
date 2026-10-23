'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Announcement,
  toggleLikeAnnouncement,
  addCommentToAnnouncement,
  deleteCommentFromAnnouncement,
  deleteAnnouncement,
  getHeartLikesCount,
  getThumbLikesCount,
  isAnnouncementRead,
  markAnnouncementAsRead,
  markAnnouncementAsUnread,
} from '@/lib/announcements-store';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ThumbsUp,
  Heart,
  MessageSquare,
  Trash2,
  Send,
  Pin,
  Users,
  Calendar,
  Share2,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnnouncementDetailModalProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function AnnouncementDetailModal({
  announcement,
  isOpen,
  onClose,
  onUpdate,
}: AnnouncementDetailModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  if (!announcement || !currentUser) return null;

  const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
  const myLike = announcement.likes.find((l) => l.userId === currentUser._id);
  const isHeartedByMe = myLike?.type === 'heart';
  const isThumbLikedByMe = myLike && myLike.type !== 'heart';
  const heartCount = getHeartLikesCount(announcement);
  const thumbCount = getThumbLikesCount(announcement);
  const isReadByMe = isAnnouncementRead(announcement.id, currentUser._id);

  // Auto-mark as read when modal opens
  React.useEffect(() => {
    if (isOpen && announcement && currentUser && !isReadByMe) {
      markAnnouncementAsRead(announcement.id, currentUser._id);
      onUpdate();
    }
  }, [isOpen, announcement?.id, currentUser?._id, isReadByMe]);

  const handleHeart = () => {
    toggleLikeAnnouncement(announcement.id, currentUser, 'heart');
    onUpdate();
  };

  const handleThumbLike = () => {
    toggleLikeAnnouncement(announcement.id, currentUser, 'like');
    onUpdate();
  };

  const handleToggleRead = () => {
    if (isReadByMe) {
      markAnnouncementAsUnread(announcement.id, currentUser._id);
      toast.info('Announcement marked as unread');
    } else {
      markAnnouncementAsRead(announcement.id, currentUser._id);
      toast.success('Announcement marked as read');
    }
    onUpdate();
  };

  const handleAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      addCommentToAnnouncement(announcement.id, commentText, currentUser);
      setCommentText('');
      onUpdate();
      toast.success('Comment posted successfully');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentFromAnnouncement(announcement.id, commentId, currentUser._id, isAdmin);
    onUpdate();
    toast.info('Comment deleted');
  };

  const handleDeleteAnnouncement = () => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(announcement.id, currentUser);
      onUpdate();
      onClose();
      toast.info('Announcement deleted');
    }
  };

  // Build formatted likers list text
  const likersNames = announcement.likes.map((l) => l.userName).join(', ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="3xl"
    >
      <div className="space-y-5 -mt-2">
        {/* Header: Author Avatar + Name + Role + Timestamp */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-3.5">
            <Avatar
              src={announcement.authorAvatar}
              name={announcement.authorName}
              userId={announcement.authorId}
              size="lg"
              className="h-12 w-12 ring-2 ring-brand-500/20"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base text-foreground">{announcement.authorName}</h4>
                {announcement.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{announcement.authorRole}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3 text-brand-500" />
                  {announcement.createdAt}
                </span>
              </p>
            </div>
          </div>

          {/* Top Header Actions: Mark as Read Toggle + Admin Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleRead}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isReadByMe
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 shadow-xs'
              }`}
              title={isReadByMe ? 'Click to mark as unread' : 'Mark announcement as read'}
            >
              {isReadByMe ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Read</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Mark as Read</span>
                </>
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleDeleteAnnouncement}
                className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                title="Delete announcement (Admin only)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
            {announcement.title}
          </h1>
        </div>

        {/* Body Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans text-sm">
          {announcement.content}
        </div>

        {/* Audience Pill */}
        <div className="pt-2 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold">Applicable to :</span>
          <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-foreground font-bold border border-zinc-200 dark:border-zinc-700 text-xs">
            {announcement.applicableTo}
          </span>
        </div>

        {/* Action Buttons: Heart + Like + Comment */}
        <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex-wrap">
          {/* Heart / Love Button */}
          <button
            type="button"
            onClick={handleHeart}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isHeartedByMe
                ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground hover:text-rose-500'
            }`}
            title="Love this announcement with Heart ❤️"
          >
            <Heart className={`h-4 w-4 ${isHeartedByMe ? 'fill-white text-white' : 'text-rose-500'}`} />
            <span>Heart ❤️ ({heartCount})</span>
          </button>

          {/* Thumbs Up / Like Button */}
          <button
            type="button"
            onClick={handleThumbLike}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isThumbLikedByMe
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground hover:text-blue-500'
            }`}
            title="Like this announcement with Thumbs Up 👍"
          >
            <ThumbsUp className={`h-4 w-4 ${isThumbLikedByMe ? 'fill-white text-white' : 'text-blue-500'}`} />
            <span>Like 👍 ({thumbCount})</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            onClick={() => {
              const inputEl = document.getElementById('announcement-comment-input');
              inputEl?.focus();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground text-xs font-bold transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>Comment ({announcement.comments.length})</span>
          </button>
        </div>

        {/* Likers List Strip (Zoho People style with Heart and Like badges) */}
        {announcement.likes.length > 0 && (
          <div className="p-2.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-foreground flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 shrink-0">
              {heartCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 text-[11px]">
                  <span>❤️</span>
                  <span className="font-mono">{heartCount}</span>
                </span>
              )}
              {thumbCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 text-[11px]">
                  <span>👍</span>
                  <span className="font-mono">{thumbCount}</span>
                </span>
              )}
            </div>
            <span className="font-medium text-xs text-muted-foreground leading-normal">
              {announcement.likes
                .map((l) => `${l.userName} (${l.type === 'heart' ? '❤️' : '👍'})`)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Comments Section */}
        <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
              Displaying all {announcement.comments.length} comment(s)
            </span>
          </div>

          {/* Comments List */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {announcement.comments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              announcement.comments.map((comm) => (
                <div
                  key={comm.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 group/comment"
                >
                  <Avatar
                    src={comm.authorAvatar}
                    name={comm.authorName}
                    userId={comm.authorId}
                    size="sm"
                    className="h-8 w-8 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{comm.authorName}</span>
                        {comm.authorRole && (
                          <span className="text-[10px] text-muted-foreground font-mono">[{comm.authorRole}]</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{comm.createdAt}</span>
                        {(comm.authorId === currentUser._id || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comm.id)}
                            className="text-zinc-400 hover:text-rose-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-wrap">
                      {comm.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input Box (All members can comment!) */}
          <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              userId={currentUser._id}
              size="sm"
              className="h-8 w-8 shrink-0"
            />
            <div className="flex-1 relative">
              <input
                id="announcement-comment-input"
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs text-foreground focus-ring"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="absolute right-2 top-2 p-1 text-brand-500 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-brand-500"
                title="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingComment || !commentText.trim()}
              className="ambizcon-gradient text-white text-xs font-bold px-3.5"
            >
              Post
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
