'use client';

import React from 'react';
import { Task } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { MessageSquare, Calendar, AlertCircle, Tag, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

export function TaskCard({ task }: TaskCardProps) {
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const setDetailModalOpen = useTaskStore((s) => s.setDetailModalOpen);

  const isOverdue =
    task.status !== 'Done' && new Date(task.dueDate).getTime() < Date.now();

  const getLabelStyle = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('figma') || l.includes('ui/ux') || l.includes('design')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (l.includes('wireframe') || l.includes('prototype') || l.includes('mobile')) {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    if (l.includes('react') || l.includes('next') || l.includes('frontend') || l.includes('css')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
    if (l.includes('security') || l.includes('critical') || l.includes('api')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (l.includes('growth') || l.includes('seo') || l.includes('campaign')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    return 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => {
        setSelectedTask(task);
        setDetailModalOpen(true);
      }}
      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 shadow-sm hover:shadow-lg hover:border-brand-500/50 transition-all cursor-pointer glass-card"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`${getPriorityBadgeColor(task.priority)} text-[10px] py-0 px-2 font-bold`}>
              {task.priority}
            </Badge>
            {task.incoming && (
              <Badge variant="warning" className="text-[10px] py-0 px-1.5 animate-pulse font-mono">
                Incoming
              </Badge>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md">
            {task.team}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="mt-2.5 text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Description snippet */}
        {task.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Labels Tag Bar (Figma, Wireframes, Mobile, etc.) */}
        {task.labels && task.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {task.labels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold tracking-tight transition-colors ${getLabelStyle(
                  label
                )}`}
              >
                <Tag className="h-2.5 w-2.5 opacity-70" />
                {label}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="text-[10px] font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
        {/* Due Date */}
        <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
          {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
          <span>{formatDate(task.dueDate)}</span>
        </div>

        {/* Right side: Attachments, Comments & Assignee Avatar */}
        <div className="flex items-center gap-2">
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {(task.commentsCount || 0) > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}

          <Avatar
            src={task.assignedUser?.avatar}
            name={task.assignedUser?.name || 'Unassigned'}
            size="sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
