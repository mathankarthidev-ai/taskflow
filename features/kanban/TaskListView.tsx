'use client';

import React, { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate, getPriorityBadgeColor } from '@/lib/utils';
import { ChevronDown, X, ExternalLink, Calendar, Building2, User, Tag, AlertCircle } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onDelete: (taskId: string, title?: string) => Promise<void>;
  onOpenModal: (task: Task) => void;
}

const STATUS_OPTIONS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'Backlog', value: 'Backlog', color: 'text-slate-600 dark:text-slate-400' },
  { label: 'To Do', value: 'Todo', color: 'text-zinc-600 dark:text-zinc-400' },
  { label: 'In Progress', value: 'In Progress', color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Review / Testing', value: 'Review', color: 'text-purple-600 dark:text-purple-400' },
  { label: 'Support', value: 'Support', color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Completed', value: 'Done', color: 'text-emerald-600 dark:text-emerald-400' },
];

export function TaskListView({ tasks, onStatusChange, onDelete, onOpenModal }: TaskListViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
              <th className="py-3 px-3 min-w-[140px]">Assignee</th>
              <th className="py-3 px-3 text-right min-w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {tasks.map((task) => {
              const isExpanded = expandedIds.has(task._id);
              const isOverdue =
                task.status !== 'Done' && task.dueDate
                  ? !isNaN(new Date(task.dueDate).getTime()) && new Date(task.dueDate).getTime() < Date.now()
                  : false;

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
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs font-semibold focus-ring cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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

                    {/* Assignee */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={task.assignedUser?.avatar}
                          name={task.assignedUser?.name || 'Unassigned'}
                          size="sm"
                        />
                        <span className="truncate max-w-[100px] text-xs font-medium text-foreground">
                          {task.assignedUser?.name || 'Unassigned'}
                        </span>
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
                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                              🔍 Reviewer: {task.assignedReviewerName}
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
    </div>
  );
}
