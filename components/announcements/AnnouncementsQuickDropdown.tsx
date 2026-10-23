'use client';

import React from 'react';
import { Announcement } from '@/lib/announcements-store';
import { Badge } from '@/components/ui/Badge';
import { Megaphone, Plus, ThumbsUp, MessageSquare, ExternalLink, Pin, Calendar } from 'lucide-react';
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
  return (
    <div className="absolute right-0 mt-2 w-84 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-4 shadow-2xl glass-panel z-50 animate-fade">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <Megaphone className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-black text-foreground">
            Official Announcements
          </span>
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono font-extrabold px-1.5 py-0.2">
            {announcements.length}
          </Badge>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreate();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ambizcon-gradient text-white text-[11px] font-extrabold shadow-sm hover:opacity-95 transition-all"
            title="Create new announcement (Admin only)"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80 overflow-y-auto my-1 pr-1">
        {announcements.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No announcements published yet.
          </p>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => {
                onClose();
                onSelectAnnouncement(ann);
              }}
              className="py-2.5 px-2 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 rounded-xl cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-bold text-xs text-foreground line-clamp-1 hover:text-brand-500 transition-colors">
                  {ann.pinned && <Pin className="inline h-3 w-3 text-amber-500 mr-1 shrink-0" />}
                  {ann.title}
                </h5>
                <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5 text-brand-500" />
                  {ann.createdAt}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {ann.content}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="text-zinc-500 font-medium">
                  By {ann.authorName} • <span className="font-semibold text-foreground">[{ann.applicableTo}]</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                    <ThumbsUp className="h-3 w-3" />
                    {ann.likes.length}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <MessageSquare className="h-3 w-3" />
                    {ann.comments.length}
                  </span>
                </div>
              </div>
            </div>
          ))
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
