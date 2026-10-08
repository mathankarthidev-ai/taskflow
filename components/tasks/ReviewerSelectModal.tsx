'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { User, Task } from '@/types';
import { UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReviewerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  onConfirmReviewer: (reviewer: User) => void;
}

export function ReviewerSelectModal({
  isOpen,
  onClose,
  task,
  users,
  onConfirmReviewer,
}: ReviewerSelectModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  if (!task) return null;

  const handleConfirm = () => {
    const chosen = users.find((u) => u._id === selectedUserId);
    if (!chosen) return;
    onConfirmReviewer(chosen);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Task Reviewer"
      description="Choose a team member, Team Lead, or Admin to review and sign off on this task."
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-xs">
          <span className="font-bold text-foreground block">Task: {task.title}</span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Moving to Review status requires an assigned Reviewer to approve or request changes.
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            Assign Reviewer (Choose Anyone — All Members, Team Leads & Admins) *
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full rounded-xl border border-purple-500/40 bg-background px-3 py-2 text-xs font-bold focus-ring"
          >
            <option value="">-- Select Reviewer (Anyone in Workspace) --</option>
            <optgroup label="Team Leads & Super Admins">
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

        {selectedUserId && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            {(() => {
              const u = users.find((item) => item._id === selectedUserId);
              if (!u) return null;
              return (
                <>
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">{u.name}</span>
                    <span className="text-[10px] text-muted-foreground">{u.role} · {u.team} team</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

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
            Submit for Review
          </Button>
        </div>
      </div>
    </Modal>
  );
}
