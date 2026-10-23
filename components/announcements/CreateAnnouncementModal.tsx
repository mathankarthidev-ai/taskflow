'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createAnnouncement, Announcement } from '@/lib/announcements-store';
import { useAuthStore } from '@/store/useAuthStore';
import { Megaphone, Pin, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onCreated,
}: CreateAnnouncementModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [applicableTo, setApplicableTo] = useState<Announcement['applicableTo']>('All');
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) return null;

  const roleLower = (currentUser.role || '').toLowerCase().trim();
  const isAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    currentUser.email === 'anirudh@ambizcon.com' ||
    currentUser.email === 'mathan@ambizcon.com' ||
    roleLower === 'director';
  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an announcement title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please write the announcement message');
      return;
    }

    setIsSubmitting(true);
    try {
      createAnnouncement(
        {
          title: title.trim(),
          content: content.trim(),
          applicableTo,
          pinned,
        },
        currentUser
      );
      toast.success('Official announcement published to all team members!');
      setTitle('');
      setContent('');
      setPinned(false);
      setApplicableTo('All');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Official Company Announcement"
      description="Only Admins can publish announcements. All team members will be able to view, like, and comment."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Announcement Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Office Relocation, Holiday Notice, Townhall Meeting..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs font-semibold focus-ring"
            required
          />
        </div>

        {/* Target Audience & Pin Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-brand-500" />
              Applicable To
            </label>
            <select
              value={applicableTo}
              onChange={(e) => setApplicableTo(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="All">All Organization (All Members)</option>
              <option value="Development">Development Team Only</option>
              <option value="Marketing">Marketing Team Only</option>
              <option value="Creative">Creative Team Only</option>
              <option value="Sales">Sales Team Only</option>
              <option value="HR">HR Team Only</option>
              <option value="Ambizcon Health">Ambizcon Health (Chennai HQ)</option>
              <option value="Ambizcon">Ambizcon (Brisbane HQ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-amber-500" />
              Pin Announcement
            </label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pin-announcement-toggle"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-500 cursor-pointer"
              />
              <label htmlFor="pin-announcement-toggle" className="text-xs text-muted-foreground font-medium cursor-pointer">
                Keep pinned at the top of the list
              </label>
            </div>
          </div>
        </div>

        {/* Announcement Message Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Announcement Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={7}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write official company update, policy changes, client onboardings, or holiday notices..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background text-xs leading-relaxed focus-ring resize-y font-sans"
            required
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="ambizcon-gradient text-white text-xs font-bold px-4 gap-1.5 shadow-glow"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Announcement'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
