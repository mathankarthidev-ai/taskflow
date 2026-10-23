'use client';

import React, { useState } from 'react';
import { Task, User } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getPriorityBadgeColor, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
  ChevronDown,
  X,
  Calendar,
  AlertCircle,
  Building2,
  Tag,
  Paperclip,
  MessageSquare,
  ExternalLink,
  Edit3,
  Lock,
  Footprints,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Users,
  UserCheck,
  Briefcase,
  FileSearch,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { toast } from 'sonner';

function getTeamBadgeColor(team?: string): string {
  switch (team) {
    case 'Development':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
    case 'Marketing':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
    case 'Creative':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
    case 'Sales':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
    case 'HR':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
    case 'Operations':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25';
    case 'Billing':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25';
    default:
      return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/25';
  }
}

interface TaskCardProps {
  task: Task;
  users?: User[];
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onDelete?: (taskId: string, title?: string) => void;
}

export function TaskCard({ task, users, onDelete }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const setDetailModalOpen = useTaskStore((s) => s.setDetailModalOpen);
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!task) return null;

  const canEdit = canEditTaskOrReminder(task, currentUser);
  const creatorName = getTaskCreatorName(task);

  const assignedUser =
    task.assignedUser ||
    (task.assignedTo ? users?.find((u) => u._id === task.assignedTo || (u as any).id === task.assignedTo) : undefined);
  const assignedName = assignedUser?.name || task.assignedUser?.name || (task.assignedTo ? 'Assigned' : 'Unassigned');

  const isOverdue =
    task.status !== 'Done' && task.dueDate
      ? !isNaN(new Date(task.dueDate).getTime()) && new Date(task.dueDate).getTime() < Date.now()
      : false;

  const handleCardClick = () => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative flex flex-col rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-3 shadow-sm hover:shadow-md hover:border-brand-500/40 transition-all glass-card"
    >
      {/* Top Bar: Arrow + Title + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand Arrow: Click to know more */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title="Click arrow to know more"
            className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-brand-500' : ''
              }`}
            />
          </button>

          {/* Title */}
          <span
            onClick={handleCardClick}
            className="text-xs font-semibold tracking-tight text-foreground hover:text-brand-500 transition-colors truncate cursor-pointer flex-1"
            title={task.title}
          >
            {task.title}
          </span>
        </div>

        {/* Card Quick Actions: Edit + Delete */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (canEdit) {
                setIsEditModalOpen(true);
              } else {
                toast.error('Permission Restricted', {
                  description: `Only Admin or the creator (${creatorName}) can edit this task.`,
                });
              }
            }}
            title={canEdit ? 'Edit task' : `Created by ${creatorName} (Admin or creator only)`}
            className={`p-1 rounded transition opacity-0 group-hover:opacity-100 ${
              canEdit
                ? 'text-muted-foreground/60 hover:text-brand-500 hover:bg-brand-500/10'
                : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10'
            }`}
          >
            {canEdit ? <Edit3 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5 text-amber-500/70" />}
          </button>

          {/* Delete Quick Button */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id, task.title);
              }}
              title="Delete task"
              className="p-1 rounded text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Color-Differentiated Task Roles: 🟣 Creator • 🔵 Working • 🟠 Review */}
      <div className="mt-2.5 space-y-1.5 p-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60">
        {/* Row 1: Working (Assignee) & Team */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1" title={`Working: ${assignedName}`}>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
              <Briefcase className="h-2.5 w-2.5" />
              Working
            </span>
            <span className="text-[11px] font-bold text-foreground truncate">
              {assignedName}
            </span>
          </div>

          {/* Team Name */}
          <span
            className={`text-[9.5px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-md border shrink-0 ${getTeamBadgeColor(
              task.team
            )}`}
          >
            {task.team || 'General'}
          </span>
        </div>

        {/* Row 2: Creator & Reviewer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/40 text-[10px]">
          {/* Creator (Purple) */}
          <div className="flex items-center gap-1 min-w-0 truncate" title={`Creator: ${creatorName}`}>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase tracking-wide bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25 shrink-0">
              <UserCheck className="h-2.5 w-2.5" />
              Creator
            </span>
            <span className="font-semibold text-muted-foreground truncate">
              {creatorName}
            </span>
          </div>

          {/* Review (Amber) */}
          <div className="flex items-center gap-1 min-w-0 truncate justify-end" title={`Review: ${task.assignedReviewerName || 'Unassigned'}`}>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 shrink-0">
              <FileSearch className="h-2.5 w-2.5" />
              Review
            </span>
            <span className="font-semibold text-muted-foreground truncate">
              {task.assignedReviewerName || (task.status === 'Review' ? 'Team Lead' : 'None')}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Metadata Summary (Always Visible) */}
      <div className="mt-2 flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${getPriorityBadgeColor(task.priority)} text-[9px] py-0 px-1.5 font-bold`}>
            {task.priority}
          </Badge>
          {task.status === 'In Progress' && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1 animate-pulse">
              <Briefcase className="h-2.5 w-2.5" />
              Working
            </span>
          )}
          {task.status === 'Review' && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <FileSearch className="h-2.5 w-2.5" />
              Review
            </span>
          )}
          {task.status === 'Todo' && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <UserCheck className="h-2.5 w-2.5" />
              Created
            </span>
          )}
          {task.status === 'Done' && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Done
            </span>
          )}
          {task.clientName && (
            <span className="text-[9px] font-semibold text-brand-500 truncate max-w-[110px]" title={task.clientName}>
              🏢 {task.clientName}
            </span>
          )}
          {(() => {
            const extraHrs =
              task.extraHours ??
              (task.timeEntries || []).reduce(
                (sum, te) => sum + (te.isExtraHours ? Number(te.hoursLogged || 0) : 0),
                0
              );
            return extraHrs > 0 ? (
              <span
                className="text-[9px] font-mono font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded"
                title={`Worked ${extraHrs} Extra Hours (Overtime)`}
              >
                ⚡ +{extraHrs}h Extra Hr
              </span>
            ) : null;
          })()}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
            {isOverdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5" />}
            <span>{formatDate(task.dueDate)}</span>
          </div>
        </div>
      </div>

      {/* Review Footprint Trail Banner (Mem -> TL -> Mem) */}
      {(() => {
        const hasReviewInfo =
          task.assignedReviewerName ||
          task.status === 'Review' ||
          task.reviewStatus === 'changes_requested' ||
          task.reviewNote ||
          (task.status === 'Done' && task.approvedBy);

        if (!hasReviewInfo) return null;

        const memberName = task.assignedUser?.name || 'Member';
        const reviewerName = task.assignedReviewerName || 'Team Lead';

        return (
          <div
            onClick={handleCardClick}
            className={`mt-2 p-1.5 rounded-xl border text-[10px] cursor-pointer transition-all hover:opacity-90 space-y-1 ${
              task.status === 'Done'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : task.reviewStatus === 'changes_requested'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
            }`}
          >
            <div className="flex items-center justify-between gap-1 font-bold">
              <div className="flex items-center gap-1 truncate">
                <Footprints className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {task.status === 'Done' && task.approvedBy ? (
                    `Approved by ${task.approvedBy}`
                  ) : task.reviewStatus === 'changes_requested' ? (
                    `TL → ${memberName} (Changes Req)`
                  ) : (
                    `${memberName} → ${reviewerName}`
                  )}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-wider shrink-0 font-extrabold px-1 py-0.2 rounded bg-background/80">
                {task.status === 'Done'
                  ? 'Completed'
                  : task.reviewStatus === 'changes_requested'
                  ? 'Feedback'
                  : 'Review'}
              </span>
            </div>

            {task.reviewNote && (
              <p className="line-clamp-1 italic text-[9.5px] opacity-90">
                &ldquo;{task.reviewNote}&rdquo;
              </p>
            )}
          </div>
        );
      })()}

      {/* Expandable "Know More" Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                {task.description || 'No description provided.'}
              </p>

              {/* Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="rounded-md border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 font-bold text-brand-600 dark:text-brand-400">
                  👤 Mem: {assignedName}
                </span>
                <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-0.5 font-bold text-foreground">
                  👥 Team: {task.team || 'General'}
                </span>
                {task.doctorName && (
                  <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-0.5 font-medium text-foreground">
                    👨‍⚕️ {task.doctorName}
                  </span>
                )}
                {task.assignedReviewerName && (
                  <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-bold text-purple-600 dark:text-purple-400">
                    👣 Reviewer: {task.assignedReviewerName}
                  </span>
                )}
                {task.reviewNote && (
                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-300">
                    💬 Msg: {task.reviewNote}
                  </span>
                )}
                {task.approvedBy && task.status === 'Done' && (
                  <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                    ✅ Approved by {task.approvedBy}
                  </span>
                )}
                {Array.isArray(task.labels) &&
                  task.labels.slice(0, 3).map((label, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-background px-1.5 py-0.5 font-medium text-muted-foreground"
                    >
                      <Tag className="inline h-2.5 w-2.5 mr-0.5 opacity-60" />
                      {typeof label === 'string' ? label : String(label)}
                    </span>
                  ))}
              </div>

              {/* Footer Open Details Link & Quick Edit */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCardClick}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Full Details
                </button>

                <div className="flex items-center gap-3">
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit Task
                    </button>
                  ) : (
                    <span
                      className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-default"
                      title={`Created by ${creatorName}. Only creator or Admin can edit.`}
                    >
                      <Lock className="h-2.5 w-2.5 text-amber-500" />
                      by {creatorName}
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Paperclip className="h-2.5 w-2.5" />
                        {task.attachments.length}
                      </span>
                    )}
                    {(task.commentsCount || 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {task.commentsCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Edit Modal */}
      <TaskEditModal
        task={task}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </motion.div>
  );
}
