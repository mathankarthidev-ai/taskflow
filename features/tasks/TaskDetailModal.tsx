'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TaskStatus, Comment, User } from '@/types';
import { updateTaskStatusAction, assignTaskAction, deleteTaskAction } from '@/actions/taskActions';
import { fetchCommentsAction, addCommentAction, deleteCommentAction } from '@/actions/commentActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { ReviewerSelectModal } from '@/components/tasks/ReviewerSelectModal';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate, formatTimeAgo } from '@/lib/utils';
import { MessageSquare, Calendar, User as UserIcon, Tag, Trash2, Send, Paperclip, ExternalLink, CornerUpLeft, Clock, ShieldCheck, Plus, RotateCcw, AlertCircle, UserCheck, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

import { SEED_CLIENTS_FULL } from '@/lib/seed-data';
import { Copy, Lock, Globe, CheckCircle2, Shield, Timer } from 'lucide-react';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';

export function TaskDetailModal() {
  const { selectedTask, isDetailModalOpen, setDetailModalOpen, setSelectedTask, setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Time logging state
  const [hoursToLog, setHoursToLog] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('');

  useEffect(() => {
    fetchAllUsersAction().then(setWorkspaceUsers);
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchCommentsAction(selectedTask._id).then(setComments);
    }
  }, [selectedTask]);

  if (!selectedTask || !currentUser) return null;

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(hoursToLog);
    if (isNaN(hrs) || hrs <= 0) {
      toast.error('Please enter valid hours logged');
      return;
    }

    const newEntry = {
      id: `te_${Date.now()}`,
      taskId: selectedTask._id,
      taskTitle: selectedTask.title,
      userId: currentUser._id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      hoursLogged: hrs,
      workDescription: workDescription || 'Logged work time',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const updatedTimeEntries = [...(selectedTask.timeEntries || []), newEntry];
    const totalActual = (selectedTask.actualHours || 0) + hrs;

    const updated = {
      ...selectedTask,
      actualHours: totalActual,
      timeEntries: updatedTimeEntries,
      history: [
        ...(selectedTask.history || []),
        {
          id: `hist_${Date.now()}`,
          action: `Logged ${hrs} hours work (${workDescription || 'Task progress'})`,
          performedBy: currentUser.name,
          performedRole: currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    setHoursToLog('');
    setWorkDescription('');
    toast.success(`Logged ${hrs} hours to task! Total: ${totalActual} hrs.`);
  };

  const handleCopyClientApprovalLink = () => {
    const token = selectedTask.approvalToken || `appr_token_${selectedTask._id}`;
    const approvalUrl = `https://taskflow-saas-app-five.vercel.app/approval/${token}`;
    navigator.clipboard.writeText(approvalUrl);
    toast.success('Client Approval Share-Link copied to clipboard!', {
      description: 'Clients can view & approve deliverables without logging in.',
    });
  };

  const handleConfirmReviewerInModal = async (reviewer: User) => {
    if (!selectedTask) return;

    const historyLog = selectedTask.history || [];
    const newHistory = [
      ...historyLog,
      {
        id: `hist_${Date.now()}`,
        action: `Submitted for review & Assigned Reviewer: ${reviewer.name} (${reviewer.role})`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = {
      ...selectedTask,
      status: 'Review' as const,
      assignedReviewerId: reviewer._id,
      assignedReviewerName: reviewer.name,
      reviewStatus: 'pending_review' as const,
      history: newHistory,
      updatedAt: new Date().toISOString(),
    };

    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    toast.success(`Task submitted for review! Assigned Reviewer: ${reviewer.name}`);
    await updateTaskStatusAction(selectedTask._id, 'Review');
    setIsReviewerModalOpen(false);
  };

  // In-App Div Modal States (No Native Browser Popups)
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] = useState(false);
  const [requestChangesNote, setRequestChangesNote] = useState('');
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    const updated = await updateTaskStatusAction(selectedTask._id, newStatus);
    if (updated) {
      setSelectedTask(updated);
      setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
      toast.success(`Task status updated to ${newStatus}`);
    }
  };

  const handleDeleteTask = () => {
    setIsDeleteTaskModalOpen(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!selectedTask) return;
    await deleteTaskAction(selectedTask._id);
    setTasks(tasks.filter((t) => t._id !== selectedTask._id));
    setIsDeleteTaskModalOpen(false);
    setDetailModalOpen(false);
    toast.success('Task deleted');
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

  const isTLOrAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Team Lead';

  const handleApproveTask = () => {
    const updated = {
      ...selectedTask,
      approvalStatus: 'approved' as const,
      approvedBy: currentUser.name,
      history: [
        ...(selectedTask.history || []),
        {
          id: `hist_${Date.now()}`,
          action: `Task approved by ${currentUser.name} (${currentUser.role})`,
          performedBy: currentUser.name,
          performedRole: currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    toast.success(`Task "${selectedTask.title}" approved!`);
  };

  const handleRejectTask = () => {
    const updated = {
      ...selectedTask,
      approvalStatus: 'rejected' as const,
      history: [
        ...(selectedTask.history || []),
        {
          id: `hist_${Date.now()}`,
          action: `Task approval rejected by ${currentUser.name} (${currentUser.role})`,
          performedBy: currentUser.name,
          performedRole: currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    toast.error(`Task "${selectedTask.title}" rejected.`);
  };

  const handleApproveReview = () => {
    const updated = {
      ...selectedTask,
      status: 'Done' as const,
      reviewStatus: 'approved' as const,
      history: [
        ...(selectedTask.history || []),
        {
          id: `hist_${Date.now()}`,
          action: `Review approved by ${currentUser.name} -> Moved to Done`,
          performedBy: currentUser.name,
          performedRole: currentUser.role,
          timestamp: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    toast.success('Task approved by reviewer and marked Done!');
  };

  const handleRequestChangesReview = () => {
    setRequestChangesNote(selectedTask.reviewNote || '');
    setIsRequestChangesModalOpen(true);
  };

  const handleConfirmRequestChanges = () => {
    if (!selectedTask) return;

    const note = requestChangesNote.trim();
    const updated = {
      ...selectedTask,
      status: 'In Progress' as const,
      reviewStatus: 'changes_requested' as const,
      reviewNote: note,
      history: [
        ...(selectedTask.history || []),
        {
          id: `hist_${Date.now()}`,
          action: `Changes requested by ${currentUser.name}: ${note || 'Revisions required'} -> Reverted to In Progress`,
          performedBy: currentUser.name,
          performedRole: currentUser.role,
          timestamp: new Date().toISOString(),
          note: note,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    setIsRequestChangesModalOpen(false);
    toast.info('Changes requested. Task automatically reverted to In Progress.');
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const newAtts: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE) {
        toast.error(`File "${file.name}" exceeds 5MB limit! Uploads must be strictly less than 5MB.`, {
          description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        });
        continue;
      }
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(file.size / 1024)} KB`;
      const url = URL.createObjectURL(file);
      newAtts.push({ name: file.name, url, type: file.type || 'application/octet-stream', size: sizeStr, bytes: file.size });
    }

    if (newAtts.length > 0) {
      const updatedAtts = [...(selectedTask.attachments || []), ...newAtts];
      const updated = {
        ...selectedTask,
        attachments: updatedAtts,
        history: [
          ...(selectedTask.history || []),
          {
            id: `hist_${Date.now()}`,
            action: `Added ${newAtts.length} reference document(s) (< 5MB verified)`,
            performedBy: currentUser.name,
            performedRole: currentUser.role,
            timestamp: new Date().toISOString(),
          },
        ],
      };
      setSelectedTask(updated);
      setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
      toast.success(`Attached ${newAtts.length} document(s) (< 5MB limit verified)`);
    }
  };


  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleToggleSubtask = (subtaskId: string) => {
    if (!selectedTask) return;
    const updatedSubtasks = (selectedTask.subtasks || []).map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const progressPct = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : 0;

    const updated = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progressPct,
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;

    const newSub = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    const updatedSubtasks = [...(selectedTask.subtasks || []), newSub];
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const progressPct = Math.round((completedCount / updatedSubtasks.length) * 100);

    const updated = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progressPct,
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    setNewSubtaskTitle('');
    toast.success('Subtask added');
  };

  const subtasksList = selectedTask.subtasks || [
    { id: 'sub_1', title: 'Moodboard & Initial Draft', completed: true },
    { id: 'sub_2', title: 'Banner set A - Social formats', completed: false },
    { id: 'sub_3', title: 'Banner set B - Display formats', completed: false },
  ];
  const completedSubtasksCount = subtasksList.filter((s) => s.completed).length;
  const subtaskProgressPct = subtasksList.length > 0 ? Math.round((completedSubtasksCount / subtasksList.length) * 100) : 0;

  const canEdit = canEditTaskOrReminder(selectedTask, currentUser);
  const creatorName = getTaskCreatorName(selectedTask);
  const isReminder = Boolean(selectedTask.reminderSettings?.enabled);

  return (
    <>
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="4xl"
      >
        <div className="space-y-6 text-xs text-foreground">
          {/* Top Header Badge Row */}
          <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                T-10{selectedTask._id?.slice(-2) || '01'}
              </span>
              <Badge className={getPriorityBadgeColor(selectedTask.priority)}>
                {selectedTask.priority}
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                {selectedTask.clientName || 'Manipal Hospitals'}
              </Badge>
              {selectedTask.doctorName && (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
                  🩺 {selectedTask.doctorName}
                </Badge>
              )}
              {selectedTask.specialist && (
                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-bold">
                  ⚕️ {selectedTask.specialist}
                </Badge>
              )}
            </div>

            {/* Edit / Creator Security Button */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit ? (
                <Button
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs shadow-sm shadow-brand-500/20"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isReminder ? 'Edit Reminder' : 'Edit Task'}</span>
                </Button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground text-[11px] border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs"
                  title={`Created by ${creatorName}. Only the creator or an Admin can edit this.`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Created by <strong>{creatorName}</strong> (read-only)</span>
                </div>
              )}
            </div>
          </div>

        {/* Task Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{selectedTask.title}</h1>
        </div>

        {/* Two-Column Layout (Left Main Content 60%, Right Sidebar 40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                DESCRIPTION
              </h4>
              <p className="text-xs text-foreground leading-relaxed">
                {selectedTask.description || 'Vector illustrations for upcoming healthcare campaign across Meta and LinkedIn.'}
              </p>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  SUBTASKS · {completedSubtasksCount}/{subtasksList.length}
                </h4>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${subtaskProgressPct}%` }}
                />
              </div>

              {/* Subtasks Checklist Items */}
              <div className="space-y-1.5 pt-1">
                {subtasksList.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                ))}
              </div>

              {/* Add Subtask Input */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                />
                <Button type="submit" size="sm" variant="outline" className="px-3">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className="space-y-2 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  ATTACHMENTS
                </h4>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-accent text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  Upload
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip,.xlsx,.txt"
                    onChange={handleModalFileUpload}
                  />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                PDF, PNG, JPG, DOC, ZIP, XLSX, TXT — max 5MB each
              </p>

              {selectedTask.attachments && selectedTask.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {selectedTask.attachments.map((att, i) => {
                    const isImage =
                      att.type?.startsWith('image/') ||
                      /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(att.name) ||
                      att.url?.startsWith('data:image');

                    return isImage ? (
                      <div key={i} className="group relative rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden bg-card">
                        <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center">
                          <img
                            src={att.url}
                            alt={att.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="p-2 flex items-center justify-between">
                          <span className="text-[11px] font-medium truncate" title={att.name}>{att.name}</span>
                          <a href={att.url} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 font-bold hover:underline text-[10px]">View</a>
                        </div>
                      </div>
                    ) : (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-accent text-xs">
                        <span className="truncate">{att.name}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic py-1">No files yet.</p>
              )}
            </div>

            {/* Discussion Comments Section */}
            <div className="space-y-3 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                DISCUSSION
              </h4>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3 text-xs focus-ring"
                />
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="h-4 w-4 rounded accent-brand-600"
                    />
                    Internal team note
                  </label>
                  <Button
                    type="submit"
                    disabled={isAddingComment || !newComment.trim()}
                    className="ambizcon-gradient hover:opacity-90 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-glow"
                  >
                    Post
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c._id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{c.user?.name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-2 border-t border-zinc-200/60 dark:border-zinc-800/60 pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                AUDIT HISTORY
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-foreground">
                    {selectedTask.createdByUser?.name || 'Deva Priya D A'}
                  </span>
                  <span className="text-muted-foreground">Created this task</span>
                  <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                    {formatDate(selectedTask.createdAt)} · 10:00
                  </span>
                </div>
                {selectedTask.history?.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-bold text-foreground">{log.performedBy}</span>
                    <span className="text-muted-foreground">{log.action}</span>
                    <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Status & Assignee Card */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  STATUS
                </label>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
                >
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Support">Support</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  ASSIGNEE
                </label>
                <div className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background">
                  <Avatar name={selectedTask.assignedUser?.name || 'Rahul K'} size="sm" />
                  <select
                    value={selectedTask.assignedTo || ''}
                    onChange={(e) => assignTaskAction(selectedTask._id, e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  >
                    <option value="">{selectedTask.assignedUser?.name || 'Rahul K'}</option>
                    {workspaceUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meta details */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-1 text-[11px] text-muted-foreground">
                <div>Team: <strong className="text-foreground">{selectedTask.team}</strong> · Due: <strong className="text-foreground">{formatDate(selectedTask.dueDate)}</strong></div>
                <div>Project: <strong className="text-foreground">{selectedTask.projectName || 'Social Media 2026'}</strong></div>
                {selectedTask.doctorName && <div>Doctor: <strong className="text-foreground">{selectedTask.doctorName}</strong></div>}
                {selectedTask.specialist && <div>Specialist: <strong className="text-foreground">{selectedTask.specialist}</strong></div>}
                <div>Created by: <strong className="text-foreground">{selectedTask.createdByUser?.name || 'Deva Priya D A'}</strong></div>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              onClick={() => setIsReviewerModalOpen(true)}
              className="w-full ambizcon-gradient hover:opacity-90 text-white font-bold text-xs py-3 rounded-2xl gap-2 shadow-glow"
            >
              <UserCheck className="h-4 w-4" />
              Submit for Review
            </Button>

            {/* Time Logger Box */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-brand-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">TIME LOGGER</span>
              </div>
              <div className="text-xs">
                <span className="font-bold">{selectedTask.actualHours || 0.0}h</span> logged of {selectedTask.estimatedHours || 6}h est.
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full"
                    style={{ width: `${Math.min(100, ((selectedTask.actualHours || 0) / (selectedTask.estimatedHours || 6)) * 100)}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleLogTime} className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={hoursToLog}
                  onChange={(e) => setHoursToLog(e.target.value)}
                  placeholder="hrs"
                  className="w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs text-center focus-ring"
                />
                <input
                  type="text"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="What did you do?"
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                />
                <Button type="submit" size="sm" className="ambizcon-gradient text-white text-xs px-3 font-bold shadow-glow">
                  Log
                </Button>
              </form>
            </div>

            {/* Client Share Link Box */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">CLIENT SHARE LINK</span>
              </div>
              <input
                type="text"
                readOnly
                value={`https://taskflow-saas-app-five.vercel.app/approval/${selectedTask.approvalToken || 'appr_token_101'}`}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1.5 text-[11px] font-mono text-muted-foreground truncate"
              />
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={handleCopyClientApprovalLink} className="flex-1 gap-1 text-xs font-semibold">
                  <Copy className="h-3 w-3" /> Copy
                </Button>
                <a
                  href={`https://taskflow-saas-app-five.vercel.app/approval/${selectedTask.approvalToken || 'appr_token_101'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-accent text-xs font-semibold text-center flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Preview
                </a>
              </div>
            </div>

            {/* Delete Task Soft Red Box */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-center">
              <button
                onClick={handleDeleteTask}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center justify-center gap-1.5 w-full"
              >
                <Trash2 className="h-4 w-4" />
                Delete task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Selection Modal */}
      <ReviewerSelectModal
        isOpen={isReviewerModalOpen}
        onClose={() => setIsReviewerModalOpen(false)}
        task={selectedTask}
        users={workspaceUsers}
        onConfirmReviewer={handleConfirmReviewerInModal}
      />

      {/* In-App Request Changes / Revisions Modal (Div layout - No native browser prompt) */}
      <Modal
        isOpen={isRequestChangesModalOpen}
        onClose={() => setIsRequestChangesModalOpen(false)}
        title="Request Task Changes & Provide Feedback"
        description="Enter feedback for the assignee detailing what revisions are required."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block mb-1">Feedback Note for Assignee</span>
            <span>Task will automatically revert to "In Progress" with your requested changes note.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Feedback / Revision Details *
            </label>
            <textarea
              value={requestChangesNote}
              onChange={(e) => setRequestChangesNote(e.target.value)}
              placeholder="e.g. Please update mobile responsiveness and adjust logo spacing..."
              rows={4}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button variant="outline" size="sm" onClick={() => setIsRequestChangesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRequestChanges}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Send Revisions & Revert
            </Button>
          </div>
        </div>
      </Modal>

      {/* In-App Delete Task Confirmation Modal (Div layout - No native browser confirm) */}
      <Modal
        isOpen={isDeleteTaskModalOpen}
        onClose={() => setIsDeleteTaskModalOpen(false)}
        title="Confirm Task Deletion"
        description="Are you sure you want to delete this task? This action cannot be undone."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200 text-xs">
            <span className="font-bold block text-rose-700 dark:text-rose-400">⚠️ Permanent Deletion</span>
            <span>Deleting task "{selectedTask.title}" will remove all comments, attachments, and history log.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDeleteTask}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Task Permanently
            </Button>
          </div>
        </div>
      </Modal>
      </Modal>

      {/* Task & Reminder Edit Modal */}
      <TaskEditModal
        task={selectedTask}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updatedTask) => {
          setSelectedTask(updatedTask);
        }}
      />
    </>
  );
}
