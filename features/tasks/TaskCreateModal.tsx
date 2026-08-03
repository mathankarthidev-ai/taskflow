'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TaskPriority, TaskStatus, TeamName, User } from '@/types';
import { createTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { toast } from 'sonner';

export function TaskCreateModal() {
  const { isCreateModalOpen, setCreateModalOpen, setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [targetTeam, setTargetTeam] = useState<TeamName>('Creative');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [labelsInput, setLabelsInput] = useState('UI/UX, SaaS');
  const [isCrossTeam, setIsCrossTeam] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setTargetTeam(currentUser.team);
    }
    fetchAllUsersAction().then(setUsers);
  }, [currentUser]);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const isIncoming = isCrossTeam || targetTeam !== currentUser.team;

      const newTask = await createTaskAction({
        title,
        description,
        priority,
        status,
        team: targetTeam,
        assignedTo: isIncoming ? undefined : (assignedTo || currentUser._id),
        createdBy: currentUser._id,
        raisedBy: isIncoming ? currentUser._id : undefined,
        incoming: isIncoming,
        dueDate: new Date(dueDate).toISOString(),
        labels,
      });

      setTasks([newTask, ...tasks]);
      toast.success(
        isIncoming
          ? `Task raised to ${targetTeam} Incoming Queue!`
          : 'Task created successfully!'
      );
      setCreateModalOpen(false);

      // Reset Form
      setTitle('');
      setDescription('');
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Create New Task"
      description="Add a task to your team board or raise a cross-team request."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-foreground">Task Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement OAuth Google Sign-In"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of task specifications..."
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
          />
        </div>

        {/* Cross-Team Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Cross-Team Request</p>
            <p className="text-[11px] text-muted-foreground">Raise task to another team's Incoming Queue</p>
          </div>
          <input
            type="checkbox"
            checked={isCrossTeam}
            onChange={(e) => setIsCrossTeam(e.target.checked)}
            className="h-4 w-4 rounded accent-primary cursor-pointer"
          />
        </div>

        {/* Team & Assignee Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground">Assigned Team</label>
            <select
              value={targetTeam}
              onChange={(e) => setTargetTeam(e.target.value as TeamName)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Creative">Creative Team</option>
              <option value="Marketing">Marketing Team</option>
              <option value="Development">Development Team</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {isCrossTeam ? 'Assigned User (Lead Review)' : 'Assigned Member'}
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={isCrossTeam}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring disabled:opacity-50"
            >
              <option value="">-- Auto-assign / Unassigned --</option>
              {users
                .filter((u) => u.team === targetTeam)
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Priority, Status, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Support">Support</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>
        </div>

        {/* Labels */}
        <div>
          <label className="text-xs font-semibold text-foreground">Labels (comma separated)</label>
          <input
            type="text"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="e.g. Design, Frontend, Priority"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : isCrossTeam ? 'Raise Cross-Team Request' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
