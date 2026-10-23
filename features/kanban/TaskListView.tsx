'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate, getPriorityBadgeColor } from '@/lib/utils';
import { ChevronDown, X, ExternalLink, Calendar, Building2, User, Tag, AlertCircle, Edit3, Lock } from 'lucide-react';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { toast } from 'sonner';

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string, title?: string) => Promise<void>;
  onOpenModal: (task: Task) => void;
}

const STATUS_OPTIONS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'To Do', value: 'Todo', color: 'text-zinc-600 dark:text-zinc-400' },
  { label: 'In Progress', value: 'In Progress', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Review / Testing', value: 'Review', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Completed', value: 'Done', color: 'text-emerald-600 dark:text-emerald-400' },
];

export function TaskListView({ tasks, onStatusChange, onDelete, onOpenModal }: TaskListViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(30);
  const currentUser = useAuthStore((s) => s.currentUser);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-card">
        <p className="text-sm font-medium text-muted-foreground">No tasks found matching current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
              <th className="py-3 px-4 min-w-[280px]">Task</th>
              <th className="py-3 px-3 min-w-[150px]">Status</th>
              <th className="py-3 px-3 min-w-[100px]">Team</th>
              <th className="py-3 px-3 min-w-[100px]">Priority</th>
              <th className="py-3 px-3 min-w-[120px]">Due Date</th>
              <th className="py-3 px-3 min-w-[200px]">Roles (🟣 Creator • 🔵 Working • 🟠 Review)</th>
              <th className="py-3 px-3 text-right min-w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {tasks.slice(0, visibleLimit).map((task) => {
              const isExpanded = expandedIds.has(task._id);
              const isOverdue =
                task.status !== 'Done' && task.dueDate
                  ? !isNaN(new Date(task.dueDate).getTime()) && new Date(task.dueDate).getTime() < Date.now()
                  : false;
              const canEdit = canEditTaskOrReminder(task, currentUser);
              const creatorName = getTaskCreatorName(task);

              return (
                <React.Fragment key={task._id}>
                  <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors group">
                    {/* Task Title + Expand Arrow */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(task._id, e)}
                          title="Click arrow to know more"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-brand-500' : ''
                            }`}
                          />
                        </button>
                        <span
                          onClick={() => onOpenModal(task)}
                          className="font-semibold text-foreground hover:text-brand-500 transition-colors cursor-pointer truncate max-w-sm"
                          title={task.title}
                        >
                          {task.title}
                        </span>
                        {task.clientName && (
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1 font-bold border-brand-500/30 text-brand-500 bg-brand-500/10 shrink-0"
                          >
                            {task.clientName}
                          </Badge>
                        )}
                      </div>
                    </td>

                        {/* Status Dropdown */}
                    <td className="py-3 px-3">
                      {(() => {
                        const isTLOrAdmin =
                          currentUser?.role === 'Super Admin' ||
                          currentUser?.role === 'Admin' ||
                          currentUser?.role === 'Team Lead';
                        return (
                          <select
                            value={task.status}
                            onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs font-semibold focus-ring cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((opt) => {
                              const isDoneRestricted =
                                opt.value === 'Done' && !isTLOrAdmin && task.status !== 'Done';
                              return (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  disabled={isDoneRestricted}
                                >
                                  {isDoneRestricted ? 'Completed (TL/Admin Only 🔒)' : opt.label}
                                </option>
                              );
                            })}
                          </select>
                        );
                      })()}
                    </td>

                    {/* Team */}
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {task.team}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <Badge className={`${getPriorityBadgeColor(task.priority)} text-[10px] py-0 px-2 font-bold`}>
                        {task.priority}
                      </Badge>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-3">
                      <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                        {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                    </td>

                    {/* Color-Differentiated Roles: 🟣 Creator • 🔵 Working • 🟠 Review */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 min-w-[170px]">
                        {/* Working (Blue) */}
                        <div className="flex items-center gap-1.5" title={`Working: ${task.assignedUser?.name || 'Unassigned'}`}>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                            Working
                          </span>
                          <span className="text-xs font-bold text-foreground truncate max-w-[130px]">
                            {task.assignedUser?.name || 'Unassigned'}
                          </span>
                        </div>
                        {/* Creator (Purple) & Review (Amber) */}
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-semibold truncate" title={`Creator: ${creatorName}`}>
                            <span className="text-[8px] font-extrabold uppercase bg-purple-500/15 px-1 py-0.2 rounded border border-purple-500/25">By</span>
                            {creatorName}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold truncate" title={`Review: ${task.assignedReviewerName || 'None'}`}>
                            <span className="text-[8px] font-extrabold uppercase bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/25">Rev</span>
                            {task.assignedReviewerName || 'None'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenModal(task)}
                          className="p-1 rounded text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 transition"
                          title="Open full details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (canEdit) {
                              setEditingTask(task);
                            } else {
                              toast.error('Permission Restricted', {
                                description: `Only Admin or creator (${creatorName}) can edit this task.`,
                              });
                            }
                          }}
                          className={`p-1 rounded transition ${
                            canEdit
                              ? 'text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10'
                              : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={canEdit ? 'Edit task' : `Created by ${creatorName} (Admin or creator only)`}
                        >
                          {canEdit ? <Edit3 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-amber-500/70" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(task._id, task.title)}
                          className="p-1 rounded text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete task"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable "Know More" Row */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200/80 dark:border-zinc-800/80">
                      <td colSpan={7} className="px-6 py-4 space-y-3">
                        {/* Description */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Description:
                          </span>
                          <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                            {task.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Details Chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {/* 🟣 Creator */}
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            👤 Creator: {creatorName}
                          </span>
                          {/* 🔵 Working */}
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                            💼 Working: {task.assignedUser?.name || 'Unassigned'}
                          </span>
                          {/* 🟠 Review */}
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            🔍 Review: {task.assignedReviewerName || 'Unassigned'}
                          </span>
                          {task.clientName && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                              <Building2 className="h-3 w-3 text-brand-500" /> Client: {task.clientName}
                            </span>
                          )}
                          {task.doctorName && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                              👨‍⚕️ Doctor: {task.doctorName}
                            </span>
                          )}
                          {task.assignedReviewerName && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                              👣 Footprint: {task.assignedUser?.name || 'Member'} → {task.assignedReviewerName}
                            </span>
                          )}
                          {task.reviewNote && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                              💬 Msg: {task.reviewNote}
                            </span>
                          )}
                          {task.approvedBy && task.status === 'Done' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✅ Approved by {task.approvedBy}
                            </span>
                          )}
                          {Array.isArray(task.labels) &&
                            task.labels.map((l, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                <Tag className="h-2.5 w-2.5 opacity-60" /> {typeof l === 'string' ? l : String(l)}
                              </span>
                            ))}
                        </div>

                        {/* Open Details Button */}
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenModal(task)}
                            className="text-xs font-semibold gap-1.5 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Full Details, Activity & Comments
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {tasks.length > visibleLimit && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
          <span className="text-xs text-muted-foreground font-medium">
            Showing <strong className="text-foreground">{visibleLimit}</strong> of{' '}
            <strong className="text-foreground">{tasks.length}</strong> tasks
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVisibleLimit((prev) => prev + 30)}
              className="text-xs font-bold border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10"
            >
              Show +30 More ({tasks.length - visibleLimit} remaining)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVisibleLimit(tasks.length)}
              className="text-xs"
            >
              Show All ({tasks.length})
            </Button>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
      />
    </div>
  );
}
