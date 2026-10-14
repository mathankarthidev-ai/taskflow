'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { User, Task } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { UserCheck, ArrowRight, Footprints } from 'lucide-react';

interface ReviewerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  onConfirmReviewer: (reviewer: User, note?: string) => void;
}

export function ReviewerSelectModal({
  isOpen,
  onClose,
  task,
  users,
  onConfirmReviewer,
}: ReviewerSelectModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [submissionNote, setSubmissionNote] = useState<string>('');

  useEffect(() => {
    if (isOpen && task && users.length > 0) {
      // Default to existing assigned reviewer, or the Team Lead of the task's team, or Super Admin
      if (task.assignedReviewerId && users.some((u) => u._id === task.assignedReviewerId)) {
        setSelectedUserId(task.assignedReviewerId);
      } else {
        const teamLead = users.find(
          (u) => u.role === 'Team Lead' && u.team === (task.team || currentUser?.team)
        );
        const anyLeadOrAdmin =
          teamLead ||
          users.find((u) => u.role === 'Team Lead' || u.role === 'Super Admin' || u.role === 'Admin');
        setSelectedUserId(anyLeadOrAdmin?._id || '');
      }
      setSubmissionNote('');
    }
  }, [isOpen, task, users, currentUser]);

  if (!task) return null;

  const chosenReviewer = users.find((u) => u._id === selectedUserId);

  const handleConfirm = () => {
    if (!chosenReviewer) return;
    onConfirmReviewer(chosenReviewer, submissionNote.trim() || undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit for Review (Record Review Footprint)"
      description="Select the Team Lead or Reviewer to review this task. Only a Team Lead or Admin can approve tasks to Completed (Done)."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 rounded-xl border border-purple-500/25 bg-purple-500/10 text-xs space-y-1.5">
          <span className="font-bold text-foreground block">Task: {task.title}</span>
          <span className="text-[11px] text-muted-foreground block">
            Moving to Review records a permanent footprint showing who submitted the task and to whom (`Mem → TL → Mem`).
          </span>
        </div>

        {/* Visual Review Footprint Preview */}
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Footprints className="h-3.5 w-3.5" />
            <span>Review Footprint Trail (Mem → TL)</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                name={currentUser?.name || 'Member'}
                src={currentUser?.avatar}
                userId={currentUser?._id}
                email={currentUser?.email}
                size="xs"
              />
              <div className="truncate">
                <span className="font-bold text-foreground block truncate">
                  {currentUser?.name || 'Member'}
                </span>
                <span className="text-[10px] text-muted-foreground">{currentUser?.role || 'Member'}</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-purple-500 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              {chosenReviewer ? (
                <>
                  <Avatar
                    name={chosenReviewer.name}
                    src={chosenReviewer.avatar}
                    userId={chosenReviewer._id}
                    email={chosenReviewer.email}
                    size="xs"
                  />
                  <div className="truncate">
                    <span className="font-bold text-purple-600 dark:text-purple-400 block truncate">
                      {chosenReviewer.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {chosenReviewer.role} · {chosenReviewer.team}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-xs italic text-muted-foreground">Select Reviewer...</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            To Whom Moved to Review (Select Team Lead / Reviewer) *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-xl border border-purple-500/40 bg-background px-3 py-2 text-xs font-bold focus-ring"
          >
            <option value="">-- Select Reviewer (Team Lead / Admin / Member) --</option>
            <optgroup label="Team Leads & Super Admins (Can Approve to Done)">
              {users
                .filter((u) => u.role === 'Super Admin' || u.role === 'Admin' || u.role === 'Team Lead')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    ⭐ {u.name} ({u.role} · {u.team} Team)
                  </option>
                ))}
            </optgroup>
            <optgroup label="Development Team">
              {users
                .filter((u) => u.team === 'Development' && u.role === 'Team Member')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    💻 {u.name} ({u.role})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Marketing Team">
              {users
                .filter((u) => u.team === 'Marketing' && u.role === 'Team Member')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    📢 {u.name} ({u.role})
                  </option>
                ))}
            </optgroup>
            <optgroup label="Creative Team">
              {users
                .filter((u) => u.team === 'Creative' && u.role === 'Team Member')
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    🎨 {u.name} ({u.role})
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            Specific Message / Note for Reviewer (Optional)
          </label>
          <textarea
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            placeholder="e.g. Completed initial build & responsive checks, ready for TL review..."
            rows={2}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedUserId}
            onClick={handleConfirm}
            className="ambizcon-gradient text-white text-xs font-bold gap-1.5"
          >
            <UserCheck className="h-4 w-4" />
            Move to Review & Save Footprint
          </Button>
        </div>
      </div>
    </Modal>
  );
}

