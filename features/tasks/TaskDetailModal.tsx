'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TaskStatus, Comment } from '@/types';
import { updateTaskStatusAction, assignTaskAction, deleteTaskAction } from '@/actions/taskActions';
import { fetchCommentsAction, addCommentAction, deleteCommentAction } from '@/actions/commentActions';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate, formatTimeAgo } from '@/lib/utils';
import { MessageSquare, Calendar, User as UserIcon, Tag, Trash2, Send, Paperclip, ExternalLink, CornerUpLeft } from 'lucide-react';
import { toast } from 'sonner';

export function TaskDetailModal() {
  const { selectedTask, isDetailModalOpen, setDetailModalOpen, setSelectedTask, setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (selectedTask) {
      fetchCommentsAction(selectedTask._id).then(setComments);
    }
  }, [selectedTask]);

  if (!selectedTask || !currentUser) return null;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    const updated = await updateTaskStatusAction(selectedTask._id, newStatus);
    if (updated) {
      setSelectedTask(updated);
      setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
      toast.success(`Task status updated to ${newStatus}`);
    }
  };

  const handleDeleteTask = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTaskAction(selectedTask._id);
      setTasks(tasks.filter((t) => t._id !== selectedTask._id));
      setDetailModalOpen(false);
      toast.success('Task deleted');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const comment = await addCommentAction(selectedTask._id, currentUser._id, newComment);
      setComments([...comments, comment]);
      setNewComment('');
      toast.success('Comment added');
    } catch (e) {
      toast.error('Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteCommentAction(commentId, selectedTask._id);
    setComments(comments.filter((c) => c._id !== commentId));
    toast.success('Comment removed');
  };

  const canChangeStatus =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Team Lead' ||
    selectedTask.assignedTo === currentUser._id;

  const canDelete =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Team Lead' ||
    selectedTask.createdBy === currentUser._id;

  return (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Header Badge Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(selectedTask.status)}>
              {selectedTask.status}
            </Badge>
            <Badge className={getPriorityBadgeColor(selectedTask.priority)}>
              {selectedTask.priority}
            </Badge>
            {selectedTask.incoming && (
              <Badge variant="warning" className="animate-pulse">
                Incoming Request
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canChangeStatus ? (
              <select
                value={selectedTask.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
              >
                <option value="Todo">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Support">Support</option>
                <option value="Done">Done</option>
              </select>
            ) : (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Status Edit Restricted (Lead/Assignee Only)
              </Badge>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteTask}
                className="text-rose-500 hover:bg-rose-500/10"
                title="Delete Task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Task Title & Description */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{selectedTask.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {selectedTask.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 p-3.5 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assigned Team</span>
            <span className="font-semibold text-foreground mt-0.5 block">{selectedTask.team}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Assignee</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Avatar
                src={selectedTask.assignedUser?.avatar}
                name={selectedTask.assignedUser?.name || 'Unassigned'}
                size="sm"
              />
              <span className="font-semibold text-foreground truncate">
                {selectedTask.assignedUser?.name || 'Unassigned'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Due Date</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-foreground">{formatDate(selectedTask.dueDate)}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Created By</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {selectedTask.createdByUser?.name || 'User'}
            </span>
          </div>
        </div>

        {/* Labels */}
        {selectedTask.labels && selectedTask.labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {selectedTask.labels.map((label, i) => (
              <Badge key={i} variant="outline" className="text-[11px]">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Attachments */}
        {selectedTask.attachments && selectedTask.attachments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              Attachments ({selectedTask.attachments.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedTask.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-2.5 hover:bg-accent transition-colors"
                >
                  <span className="text-xs font-medium truncate">{att.name}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Threaded Comments Section */}
        <div className="space-y-4 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Activity & Discussion ({comments.length})
            </h3>
          </div>

          {/* Comment List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex items-start gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 text-xs"
                >
                  <Avatar src={comment.user?.avatar} name={comment.user?.name || 'User'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{comment.user?.name || 'User'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">{formatTimeAgo(comment.createdAt)}</span>
                        {comment.userId === currentUser._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {comment.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... (use @name or emojis 😊)"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
              />
              <Button type="submit" size="sm" disabled={isAddingComment || !newComment.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
