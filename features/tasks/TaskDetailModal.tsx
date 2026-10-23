'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TaskStatus, Comment, User } from '@/types';
import {
  updateTaskStatusAction,
  updateTaskAction,
  assignTaskAction,
  deleteTaskAction,
  logTaskTimeAction,
  updateTaskReviewWorkflowAction,
} from '@/actions/taskActions';
import { fetchCommentsAction, addCommentAction, deleteCommentAction } from '@/actions/commentActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { ReviewerSelectModal } from '@/components/tasks/ReviewerSelectModal';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate, formatTimeAgo, normalizeUrl } from '@/lib/utils';
import { MessageSquare, Calendar, User as UserIcon, Tag, Trash2, Send, Paperclip, ExternalLink, CornerUpLeft, Clock, ShieldCheck, Plus, RotateCcw, AlertCircle, UserCheck, Edit3, Zap, Footprints, ArrowRight, Link2, Briefcase, FileSearch, FileText, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

import { SEED_CLIENTS_FULL } from '@/lib/seed-data';
import { Copy, Lock, Globe, CheckCircle2, Shield, Timer } from 'lucide-react';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { saveWorkLogItem, formatMinutesToHHMM } from '@/lib/work-logs-store';
import { useNotificationStore } from '@/store/useNotificationStore';

function renderFormattedCommentText(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  const elements: React.ReactNode[] = [];
  let lastIdx = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(text.substring(lastIdx, match.index));
    }
    if (match[2] && match[3]) {
      // Markdown formatted link [Title](url)
      elements.push(
        <a
          key={match.index}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 underline hover:text-brand-700 bg-brand-500/10 px-2 py-0.5 rounded-md text-[11px] my-0.5 align-middle"
        >
          <Globe className="h-3 w-3 inline shrink-0" />
          <span>{match[2]}</span>
          <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
        </a>
      );
    } else {
      // Plain URL
      const rawUrl = match[0];
      elements.push(
        <a
          key={match.index}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 underline hover:text-brand-700 bg-brand-500/10 px-2 py-0.5 rounded-md text-[11px] my-0.5 max-w-[260px] truncate align-middle"
        >
          <Globe className="h-3 w-3 inline shrink-0" />
          <span className="truncate">{rawUrl.replace(/^https?:\/\//i, '')}</span>
          <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
        </a>
      );
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    elements.push(text.substring(lastIdx));
  }
  return elements;
}

export function TaskDetailModal() {
  const { selectedTask, isDetailModalOpen, setDetailModalOpen, setSelectedTask, setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Comment / Reply Links State
  const [commentLinks, setCommentLinks] = useState<{ title: string; url: string }[]>([]);
  const [showCommentLinkForm, setShowCommentLinkForm] = useState(false);
  const [newCommentLinkTitle, setNewCommentLinkTitle] = useState('');
  const [newCommentLinkUrl, setNewCommentLinkUrl] = useState('');

  // Task Level Direct Resource Link State
  const [showTaskLinkForm, setShowTaskLinkForm] = useState(false);
  const [taskLinkTitle, setTaskLinkTitle] = useState('');
  const [taskLinkUrl, setTaskLinkUrl] = useState('');
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Time logging state
  const [hoursToLog, setHoursToLog] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('');
  const [isExtraHoursLog, setIsExtraHoursLog] = useState<boolean>(false);

  // In-App Div Modal States (No Native Browser Popups) — MUST be declared before early return
  const [isRequestChangesModalOpen, setIsRequestChangesModalOpen] = useState(false);
  const [requestChangesNote, setRequestChangesNote] = useState('');
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    fetchAllUsersAction().then(setWorkspaceUsers);
  }, []);

  useEffect(() => {
    if (selectedTask) {
      fetchCommentsAction(selectedTask._id).then(setComments);
    }
  }, [selectedTask]);

  if (!selectedTask || !currentUser) return null;

  const isTLOrAdmin =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Admin' ||
    currentUser.role === 'Team Lead';

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseFloat(hoursToLog);
    if (isNaN(hrs) || hrs <= 0) {
      toast.error('Please enter valid hours logged');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const descText =
      workDescription.trim() ||
      (isExtraHoursLog ? 'Worked extra hours (Overtime)' : 'Logged work time');

    const newEntry = {
      id: `te_${Date.now()}`,
      taskId: selectedTask._id,
      taskTitle: selectedTask.title,
      userId: currentUser._id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      hoursLogged: hrs,
      isExtraHours: isExtraHoursLog,
      workDescription: descText,
      date: todayStr,
      createdAt: new Date().toISOString(),
    };

    const updatedTimeEntries = [...(selectedTask.timeEntries || []), newEntry];
    const totalActual = Number(((selectedTask.actualHours || 0) + hrs).toFixed(2));
    const totalExtra = Number(
      updatedTimeEntries
        .reduce((sum, te) => sum + (te.isExtraHours ? Number(te.hoursLogged || 0) : 0), 0)
        .toFixed(2)
    );

    const newHistory = [
      ...(selectedTask.history || []),
      {
        id: `hist_${Date.now()}`,
        action: isExtraHoursLog
          ? `Logged +${hrs} Extra Hrs (Overtime) — ${descText}`
          : `Logged ${hrs} hours work (${descText})`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = {
      ...selectedTask,
      actualHours: totalActual,
      extraHours: totalExtra,
      timeEntries: updatedTimeEntries,
      history: newHistory,
    };

    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    setHoursToLog('');
    setWorkDescription('');
    setIsExtraHoursLog(false);

    // Persist to Supabase tasks table
    logTaskTimeAction(selectedTask._id, {
      actualHours: totalActual,
      extraHours: totalExtra,
      timeEntries: updatedTimeEntries,
      history: newHistory,
    }).catch(() => {});

    // Also sync this logged work block into Overview Hourly Work Slots (work_logs)
    const durationMins = Math.max(15, Math.round(hrs * 60));
    const startMins = isExtraHoursLog ? 17 * 60 : 9 * 60;
    const endMins = Math.min(23 * 60 + 55, startMins + durationMins);
    saveWorkLogItem({
      id: `WL-TASK-${Date.now()}`,
      user_id: currentUser._id,
      user_email: currentUser.email.toLowerCase(),
      user_name: currentUser.name,
      team: currentUser.team || selectedTask.team || 'Development',
      company: currentUser.company || 'Ambizcon Health - India',
      work_date: todayStr,
      task_id: selectedTask._id,
      task_title: isExtraHoursLog
        ? `[Extra Hr] ${selectedTask.title} — ${descText}`
        : `${selectedTask.title} — ${descText}`,
      start_time: formatMinutesToHHMM(startMins),
      end_time: formatMinutesToHHMM(endMins),
      duration_minutes: durationMins,
      color: isExtraHoursLog ? 'orange' : 'blue',
      is_auto_in_progress: false,
      is_extra_hours: isExtraHoursLog,
      created_at: new Date().toISOString(),
    }).catch(() => {});

    toast.success(
      isExtraHoursLog
        ? `Logged +${hrs} Extra Hours (Overtime)! Total Extra: ${totalExtra}h`
        : `Logged ${hrs} hours to task! Total: ${totalActual} hrs.`
    );
  };

  const handleCopyClientApprovalLink = () => {
    const token = selectedTask.approvalToken || `appr_token_${selectedTask._id}`;
    const approvalUrl = `https://taskflow-saas-app-five.vercel.app/approval/${token}`;
    navigator.clipboard.writeText(approvalUrl);
    toast.success('Client Approval Share-Link copied to clipboard!', {
      description: 'Clients can view & approve deliverables without logging in.',
    });
  };

  const handleConfirmReviewerInModal = async (reviewer: User, submissionNote?: string) => {
    if (!selectedTask) return;

    const historyLog = selectedTask.history || [];
    const newHistory = [
      ...historyLog,
      {
        id: `hist_${Date.now()}`,
        action: `[Footprint: ${currentUser.name} (${currentUser.role}) → ${reviewer.name} (${reviewer.role})] Moved to Review${
          submissionNote ? ` — "${submissionNote}"` : ''
        }`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
        note: submissionNote || undefined,
      },
    ];

    const updatedNote = submissionNote
      ? `${currentUser.name} → ${reviewer.name}: ${submissionNote}`
      : selectedTask.reviewNote;

    const updated = {
      ...selectedTask,
      status: 'Review' as const,
      assignedReviewerId: reviewer._id,
      assignedReviewerName: reviewer.name,
      reviewStatus: 'pending_review' as const,
      reviewNote: updatedNote,
      history: newHistory,
      updatedAt: new Date().toISOString(),
    };

    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    const assignedUser = selectedTask.assignedUser || (selectedTask.assignedTo ? workspaceUsers.find((u) => u._id === selectedTask.assignedTo) : undefined);
    const assignedName = assignedUser?.name || selectedTask.assignedUser?.name || currentUser.name || 'Member';
    useNotificationStore.getState().addNotification({
      type: 'review_assigned',
      category: 'Reviewer Assignment',
      title: `🔍 Moved to Review (${currentUser.name} → ${reviewer.name})`,
      text: `${currentUser.name} moved "${selectedTask.title}" to Review for ${reviewer.name}${
        submissionNote ? `: "${submissionNote}"` : '.'
      }`,
      color: 'bg-purple-600',
      taskId: selectedTask._id,
      targetTeam: selectedTask.team,
      assignedUserId: selectedTask.assignedTo,
      assignedUserName: assignedName,
      completedByUserId: currentUser._id,
      completedByName: currentUser.name,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
      targetUserIds: [reviewer._id, selectedTask.assignedTo, currentUser._id].filter(Boolean) as string[],
      targetUserNames: [reviewer.name, assignedName, currentUser.name].filter(Boolean) as string[],
    });
    toast.success(`Footprint saved: ${currentUser.name} → ${reviewer.name} (Moved to Review)`);
    await updateTaskReviewWorkflowAction(selectedTask._id, {
      status: 'Review',
      assignedReviewerId: reviewer._id,
      assignedReviewerName: reviewer.name,
      reviewStatus: 'pending_review',
      reviewNote: updatedNote,
      history: newHistory,
    });
    setIsReviewerModalOpen(false);
  };

  const isWorkerOnSelectedTask = Boolean(
    currentUser &&
      selectedTask &&
      ((selectedTask.assignedTo &&
        (String(selectedTask.assignedTo).toLowerCase() === String(currentUser._id || '').toLowerCase() ||
          String(selectedTask.assignedTo).toLowerCase() === String(currentUser.email || '').toLowerCase())) ||
        (selectedTask.assignedUser?.email &&
          String(selectedTask.assignedUser.email).toLowerCase() === String(currentUser.email || '').toLowerCase()) ||
        (selectedTask.assignedUser?._id &&
          String(selectedTask.assignedUser._id).toLowerCase() === String(currentUser._id || '').toLowerCase()) ||
        (selectedTask.assignedUser?.name &&
          currentUser.name &&
          String(selectedTask.assignedUser.name).toLowerCase() === String(currentUser.name).toLowerCase()) ||
        (selectedTask.createdBy &&
          (String(selectedTask.createdBy).toLowerCase() === String(currentUser._id || '').toLowerCase() ||
            String(selectedTask.createdBy).toLowerCase() === String(currentUser.email || '').toLowerCase())))
  );

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask || selectedTask.status === newStatus) return;

    if (!isTLOrAdmin) {
      if (!isWorkerOnSelectedTask) {
        toast.error('Permission Restricted: You can only update tasks you are assigned to / working on.');
        return;
      }

      if (selectedTask.status === 'Review') {
        toast.error('Permission Restricted: This task is currently under Review. Only Team Lead or Admin can review or update status.');
        return;
      }

      if (selectedTask.status === 'Done') {
        toast.error('Permission Restricted: This task is already Completed. Only Team Lead or Admin can reopen it.');
        return;
      }

      if (newStatus === 'Done') {
        toast.error(
          'Only Team Lead or Admin can approve a task to be Done (Completed). Please submit to TL for Review.'
        );
        setIsReviewerModalOpen(true);
        return;
      }

      if (newStatus === 'Review') {
        setIsReviewerModalOpen(true);
        return;
      }
    } else {
      if (newStatus === 'Review') {
        setIsReviewerModalOpen(true);
        return;
      }

      if (newStatus === 'Done') {
        await handleApproveReview();
        return;
      }
    }

    const newHistory = [
      ...(selectedTask.history || []),
      {
        id: `hist_${Date.now()}`,
        action: `Status moved from ${selectedTask.status} to ${newStatus}`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = await updateTaskReviewWorkflowAction(selectedTask._id, {
      status: newStatus,
      history: newHistory,
    });
    if (updated) {
      setSelectedTask(updated);
      setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
      useNotificationStore.getState().addNotification({
        type: 'updated',
        category: 'Task Status Updated',
        title: `🔄 Status Changed to ${newStatus}`,
        text: `${currentUser.name} moved "${selectedTask.title}" to ${newStatus}.`,
        color: 'bg-blue-500',
        taskId: selectedTask._id,
      });
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

  const handleAddCommentLink = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newCommentLinkUrl.trim()) {
      toast.error('Please enter a link URL');
      return;
    }
    const cleanUrl = normalizeUrl(newCommentLinkUrl);
    const title = newCommentLinkTitle.trim() || cleanUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'Link';
    setCommentLinks((prev) => [...prev, { title, url: cleanUrl }]);
    setNewCommentLinkTitle('');
    setNewCommentLinkUrl('');
    toast.success(`Attached link: "${title}"`);
  };

  const handleRemoveCommentLink = (idx: number) => {
    setCommentLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTaskDirectLink = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedTask || !currentUser) return;
    if (!taskLinkUrl.trim()) {
      toast.error('Please enter a valid link URL');
      return;
    }
    const cleanUrl = normalizeUrl(taskLinkUrl);
    const title = taskLinkTitle.trim() || cleanUrl.replace(/^https?:\/\//i, '').split('/')[0] || 'Resource Link';
    const newLink = { title, url: cleanUrl };
    const existingLinks = selectedTask.links || [];
    const updatedLinks = [...existingLinks, newLink];

    try {
      await updateTaskAction(
        selectedTask._id,
        {
          links: updatedLinks,
          attachments: [
            ...(selectedTask.attachments || []).filter((a) => a.type !== 'link'),
            ...updatedLinks.map((l) => ({ name: l.title || 'Link', url: l.url, type: 'link' })),
          ],
        },
        currentUser._id,
        currentUser.role,
        currentUser.name
      );

      const updatedTaskObj = {
        ...selectedTask,
        links: updatedLinks,
        attachments: [
          ...(selectedTask.attachments || []).filter((a) => a.type !== 'link'),
          ...updatedLinks.map((l) => ({ name: l.title || 'Link', url: l.url, type: 'link' })),
        ],
      };
      setSelectedTask(updatedTaskObj);
      setTasks(tasks.map((t) => (t._id === selectedTask._id ? updatedTaskObj : t)));
      setTaskLinkTitle('');
      setTaskLinkUrl('');
      setShowTaskLinkForm(false);
      toast.success(`Link "${title}" added to Task resources!`);
    } catch {
      toast.error('Failed to add link to task');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && commentLinks.length === 0) return;

    setIsAddingComment(true);
    try {
      let finalMessage = newComment.trim();
      if (commentLinks.length > 0) {
        const linkList = commentLinks.map((l) => `[${l.title}](${l.url})`).join(' • ');
        finalMessage = finalMessage ? `${finalMessage}\n\n🔗 ${linkList}` : `🔗 ${linkList}`;
      }

      const comment = await addCommentAction(selectedTask._id, currentUser._id, finalMessage);
      comment.links = commentLinks;
      setComments([...comments, comment]);
      setNewComment('');
      setCommentLinks([]);
      setShowCommentLinkForm(false);
      useNotificationStore.getState().addNotification({
        type: 'comment',
        category: 'Comment / Note',
        title: '💬 New Task Comment',
        text: `${currentUser.name} commented on "${selectedTask.title}": "${finalMessage.trim().slice(0, 60)}"`,
        color: 'bg-purple-500',
        taskId: selectedTask._id,
      });
      toast.success('Comment & links posted');
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

  const canChangeStatus = isTLOrAdmin || isWorkerOnSelectedTask;

  const canDelete =
    currentUser.role === 'Super Admin' ||
    currentUser.role === 'Team Lead' ||
    selectedTask.createdBy === currentUser._id;

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
    const assignedUser = selectedTask.assignedUser || (selectedTask.assignedTo ? workspaceUsers.find((u) => u._id === selectedTask.assignedTo) : undefined);
    const assignedName = assignedUser?.name || selectedTask.assignedUser?.name || 'Member';
    useNotificationStore.getState().addNotification({
      type: 'task_approval',
      category: 'Task Approved',
      title: '🛡️ Task Approved',
      text: `${currentUser.name} (${currentUser.role}) approved task "${selectedTask.title}".`,
      color: 'bg-emerald-600',
      taskId: selectedTask._id,
      targetTeam: selectedTask.team,
      assignedUserId: selectedTask.assignedTo,
      assignedUserName: assignedName,
      completedByUserId: currentUser._id,
      completedByName: currentUser.name,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
      targetUserIds: [selectedTask.assignedTo, currentUser._id].filter(Boolean) as string[],
      targetUserNames: [assignedName, currentUser.name].filter(Boolean) as string[],
    });
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

  const handleApproveReview = async () => {
    if (!isTLOrAdmin) {
      toast.error('Only Team Lead or Admin can approve a task to be Done (Completed).');
      return;
    }

    const newHistory = [
      ...(selectedTask.history || []),
      {
        id: `hist_${Date.now()}`,
        action: `[Footprint: ${currentUser.name} (${currentUser.role}) Approved → Completed] Review approved & marked Done`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = {
      ...selectedTask,
      status: 'Done' as const,
      reviewStatus: 'approved' as const,
      approvedBy: currentUser.name,
      approvalStatus: 'approved' as const,
      history: newHistory,
      updatedAt: new Date().toISOString(),
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    const assignedUser = selectedTask.assignedUser || (selectedTask.assignedTo ? workspaceUsers.find((u) => u._id === selectedTask.assignedTo) : undefined);
    const assignedName = assignedUser?.name || selectedTask.assignedUser?.name || 'Member';
    useNotificationStore.getState().addNotification({
      id: `notif_done_${selectedTask._id}_${Date.now()}`,
      type: 'task_completed',
      category: 'Task Completed',
      title: '✅ Approved to Completed (Done)',
      text: `${currentUser.name} (${currentUser.role}) approved "${selectedTask.title}" and marked it Completed!`,
      color: 'bg-emerald-500',
      taskId: selectedTask._id,
      targetTeam: selectedTask.team,
      assignedUserId: selectedTask.assignedTo,
      assignedUserName: assignedName,
      completedByUserId: currentUser._id,
      completedByName: currentUser.name,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
      targetUserIds: [selectedTask.assignedTo, currentUser._id].filter(Boolean) as string[],
      targetUserNames: [assignedName, currentUser.name].filter(Boolean) as string[],
    });
    toast.success(`Approved by ${currentUser.name} (${currentUser.role}) & marked Completed!`);
    await updateTaskReviewWorkflowAction(selectedTask._id, {
      status: 'Done',
      reviewStatus: 'approved',
      approvedBy: currentUser.name,
      approvalStatus: 'approved',
      history: newHistory,
    });
  };

  const handleRequestChangesReview = () => {
    setRequestChangesNote('');
    setIsRequestChangesModalOpen(true);
  };

  const handleConfirmRequestChanges = async () => {
    if (!selectedTask) return;

    const note = requestChangesNote.trim() || 'Please check and update as requested by TL.';
    const targetMemberUser =
      selectedTask.assignedUser ||
      workspaceUsers.find((u) => u._id === selectedTask.assignedTo);
    const targetMemberName = targetMemberUser?.name || 'Member';

    const newHistory = [
      ...(selectedTask.history || []),
      {
        id: `hist_${Date.now()}`,
        action: `[Footprint: ${currentUser.name} (${currentUser.role}) → ${targetMemberName}] Sent back with specific msg: "${note}"`,
        performedBy: currentUser.name,
        performedRole: currentUser.role,
        timestamp: new Date().toISOString(),
        note: note,
      },
    ];

    const formattedReviewNote = `${currentUser.name} (${currentUser.role}) → ${targetMemberName}: ${note}`;

    const updated = {
      ...selectedTask,
      status: 'In Progress' as const,
      reviewStatus: 'changes_requested' as const,
      reviewNote: formattedReviewNote,
      history: newHistory,
      updatedAt: new Date().toISOString(),
    };
    setSelectedTask(updated);
    setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
    setIsRequestChangesModalOpen(false);

    useNotificationStore.getState().addNotification({
      type: 'updated',
      category: 'Review Feedback (TL → Member)',
      title: `↩️ ${currentUser.name} → ${targetMemberName} (Changes Requested)`,
      text: `Specific Msg on "${selectedTask.title}": "${note}"`,
      color: 'bg-amber-600',
      taskId: selectedTask._id,
    });

    toast.info(`Sent back to ${targetMemberName} with specific message!`);
    await updateTaskReviewWorkflowAction(selectedTask._id, {
      status: 'In Progress',
      reviewStatus: 'changes_requested',
      reviewNote: formattedReviewNote,
      history: newHistory,
    });
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
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                DESCRIPTION
              </h4>
              <p className="text-xs font-bold text-foreground leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {selectedTask.description || 'Vector illustrations for upcoming healthcare campaign across Meta and LinkedIn.'}
              </p>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-primary" />
                  SUBTASKS · {completedSubtasksCount}/{subtasksList.length}
                </h4>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
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
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer group transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                    />
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-foreground/50 font-semibold' : 'text-foreground font-bold'
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
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-xs font-bold text-foreground focus-ring"
                />
                <Button type="submit" size="sm" variant="outline" className="px-3 font-bold">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>

            {/* Attachments Section */}
            <div className="space-y-2 border-t border-zinc-200/80 dark:border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  ATTACHMENTS
                </h4>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-card hover:bg-accent text-xs font-extrabold text-foreground flex items-center gap-1.5 shadow-xs">
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
              <p className="text-xs font-bold text-foreground/80 dark:text-zinc-200">
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
                          <span className="text-xs font-bold truncate text-foreground" title={att.name}>{att.name}</span>
                          <a href={att.url} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 font-extrabold hover:underline text-xs">View</a>
                        </div>
                      </div>
                    ) : (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-accent text-xs font-bold text-foreground">
                        <span className="truncate">{att.name}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-foreground/80 flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary shrink-0" />
                  <span>No files attached yet. Click &quot;Upload&quot; to attach reference files.</span>
                </div>
              )}
            </div>

            {/* Resource & Reference Links Section */}
            <div className="space-y-2 border-t border-zinc-200/80 dark:border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  LINKS &amp; RESOURCES
                </h4>
                <button
                  type="button"
                  onClick={() => setShowTaskLinkForm(!showTaskLinkForm)}
                  className="text-xs font-black text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showTaskLinkForm ? 'Cancel' : 'Add Link'}
                </button>
              </div>

              {showTaskLinkForm && (
                <div className="p-3 rounded-2xl border border-brand-500/30 bg-brand-500/[0.04] space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={taskLinkTitle}
                      onChange={(e) => setTaskLinkTitle(e.target.value)}
                      placeholder="Title (e.g. Figma, Google Sheet, PR)"
                      className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs font-bold text-foreground focus-ring"
                    />
                    <input
                      type="url"
                      value={taskLinkUrl}
                      onChange={(e) => setTaskLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs font-bold text-foreground focus-ring font-mono"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveTaskDirectLink();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTaskLinkForm(false)}
                      className="text-xs h-7 font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveTaskDirectLink}
                      className="ambizcon-gradient text-white text-xs h-7 shadow-glow gap-1 font-bold"
                    >
                      <Plus className="h-3 w-3" />
                      Save Link to Task
                    </Button>
                  </div>
                </div>
              )}

              {/* Display existing task links */}
              {(selectedTask.links && selectedTask.links.length > 0) ||
              (selectedTask.attachments && selectedTask.attachments.some((a) => a.type === 'link')) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    ...(selectedTask.links || []),
                    ...(selectedTask.attachments || [])
                      .filter((a) => a.type === 'link' && !(selectedTask.links || []).some((l) => l.url === a.url))
                      .map((a) => ({ title: a.name || a.url, url: a.url })),
                  ].map((l, i) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-brand-500/10 hover:border-brand-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-foreground truncate group-hover:text-brand-600 transition-colors">
                            {l.title || 'Resource Link'}
                          </p>
                          <p className="text-xs font-semibold text-foreground/75 truncate font-mono">
                            {l.url.replace(/^https?:\/\//i, '')}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-foreground/70 group-hover:text-brand-600 shrink-0 ml-1.5" />
                    </a>
                  ))}
                </div>
              ) : (
                !showTaskLinkForm && (
                  <div className="p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-foreground/80 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>No resource links attached. Click &quot;+ Add Link&quot; to attach Figma, Docs, or Staging URLs.</span>
                  </div>
                )
              )}
            </div>

            {/* Discussion Comments Section */}
            <div className="space-y-3 border-t border-zinc-200/80 dark:border-zinc-800/80 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  DISCUSSION / REPLY CHAT
                </span>
                <span className="text-xs font-extrabold text-foreground bg-zinc-200/90 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                  {comments.length} message{comments.length === 1 ? '' : 's'}
                </span>
              </h4>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply or task comment..."
                  rows={3}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background p-3 text-xs focus-ring"
                />

                {/* Show Attached Comment Links */}
                {commentLinks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 self-center mr-1">
                      <Link2 className="h-3 w-3 text-brand-500" />
                      Links:
                    </span>
                    {commentLinks.map((cl, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-[11px] font-medium"
                      >
                        <Globe className="h-2.5 w-2.5 text-brand-500" />
                        <span className="max-w-[150px] truncate">{cl.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCommentLink(idx)}
                          className="hover:text-rose-500 ml-0.5"
                          title="Remove link"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Link to Reply Input Modal / Popover */}
                {showCommentLinkForm && (
                  <div className="p-2.5 rounded-xl border border-brand-500/30 bg-background space-y-2 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newCommentLinkTitle}
                        onChange={(e) => setNewCommentLinkTitle(e.target.value)}
                        placeholder="Link Label (e.g. Design Draft, PR)"
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
                      />
                      <input
                        type="url"
                        value={newCommentLinkUrl}
                        onChange={(e) => setNewCommentLinkUrl(e.target.value)}
                        placeholder="https://..."
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCommentLink();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCommentLinkForm(false)}
                        className="text-[11px] h-6 px-2.5"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCommentLink}
                        className="ambizcon-gradient text-white text-[11px] h-6 px-2.5 gap-1 shadow-glow"
                      >
                        <Plus className="h-3 w-3" />
                        Attach to Reply
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="h-4 w-4 rounded accent-brand-600"
                      />
                      Internal note
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowCommentLinkForm(!showCommentLinkForm)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      title="Attach link to reply"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span>{showCommentLinkForm ? 'Hide Link' : 'Add Link'}</span>
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isAddingComment || (!newComment.trim() && commentLinks.length === 0)}
                    className="ambizcon-gradient hover:opacity-90 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-glow"
                  >
                    Post Reply
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-2 pt-2 max-h-56 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c._id} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground text-xs">{c.user?.name || 'User'}</span>
                          {c.isInternal && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {renderFormattedCommentText(c.message)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-2 border-t border-zinc-200/80 dark:border-zinc-800/80 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                AUDIT HISTORY
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-foreground">
                    {selectedTask.createdByUser?.name || 'Deva Priya D A'}
                  </span>
                  <span className="text-foreground/80 font-medium">Created this task</span>
                  <span className="text-[10px] text-foreground/70 font-mono font-bold ml-auto">
                    {formatDate(selectedTask.createdAt)} · 10:00
                  </span>
                </div>
                {selectedTask.history?.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-bold text-foreground">{log.performedBy}</span>
                    <span className="text-foreground/80 font-medium">{log.action}</span>
                    <span className="text-[10px] text-foreground/70 font-mono font-bold ml-auto">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground">
                    STATUS
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    TL / Admin Approves Done
                  </span>
                </div>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  disabled={!canChangeStatus || (!isTLOrAdmin && (selectedTask.status === 'Review' || selectedTask.status === 'Done'))}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-xs font-bold text-foreground focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review" disabled={!isTLOrAdmin && selectedTask.status === 'Review'}>
                    Review / Testing (Submit to TL)
                  </option>
                  <option value="Done" disabled={!isTLOrAdmin && selectedTask.status !== 'Done'}>
                    {isTLOrAdmin ? 'Completed (Approve to Done)' : 'Completed (TL / Admin Only 🔒)'}
                  </option>
                </select>
              </div>

              {/* Color-Differentiated Task Ownership: 🟣 Creator • 🔵 Working • 🟠 Review */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="uppercase tracking-wider text-foreground">Task Roles</span>
                  <span className="font-mono text-foreground font-bold">🟣 Creator • 🔵 Working • 🟠 Review</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Creator */}
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/35 space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5" /> Creator
                    </span>
                    <p className="text-xs font-black text-foreground truncate" title={creatorName}>{creatorName}</p>
                    <p className="text-[10px] font-bold text-purple-900/80 dark:text-purple-200/80 truncate">{selectedTask.createdByUser?.role || 'Author'}</p>
                  </div>

                  {/* Working */}
                  <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/35 space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> Working
                    </span>
                    <p className="text-xs font-black text-foreground truncate" title={selectedTask.assignedUser?.name || 'Unassigned'}>
                      {selectedTask.assignedUser?.name || 'Unassigned'}
                    </p>
                    <p className="text-[10px] font-bold text-blue-900/80 dark:text-blue-200/80 truncate">{selectedTask.team} Team</p>
                  </div>

                  {/* Review */}
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <FileSearch className="h-3.5 w-3.5" /> Review
                    </span>
                    <p className="text-xs font-black text-foreground truncate" title={selectedTask.assignedReviewerName || 'Unassigned'}>
                      {selectedTask.assignedReviewerName || 'Unassigned'}
                    </p>
                    <p className="text-[10px] font-bold text-amber-900/80 dark:text-amber-200/80 truncate">
                      {selectedTask.reviewStatus === 'approved' ? 'Approved' : 'Sign-off'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-foreground">
                    ASSIGNEE (WORKING)
                  </label>
                  {currentUser.role === 'Super Admin' || currentUser.role === 'Admin' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Admin · All Teams
                    </span>
                  ) : currentUser.role === 'Team Lead' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      TL · {currentUser.team} Team Only
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-muted-foreground flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5 text-amber-500" />
                      Handled by TL
                    </span>
                  )}
                </div>

                {(() => {
                  const isAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';
                  const isTL = currentUser.role === 'Team Lead';
                  const currentAssignedUser =
                    selectedTask.assignedUser ||
                    workspaceUsers.find((u) => u._id === selectedTask.assignedTo);
                  const displayAssigneeName = currentAssignedUser
                    ? `${currentAssignedUser.name} (${currentAssignedUser.role})`
                    : 'Unassigned';

                  const handleRedirectAssignee = async (newUserId: string) => {
                    if (!newUserId || (!isAdmin && !isTL)) return;
                    const targetUser = workspaceUsers.find((u) => u._id === newUserId);
                    if (!targetUser) return;

                    if (isTL && targetUser.team !== currentUser.team) {
                      toast.error(`Team Leads can only redirect tasks within their own (${currentUser.team}) team.`);
                      return;
                    }

                    const updatedTeam =
                      targetUser.role !== 'Super Admin' && targetUser.team
                        ? targetUser.team
                        : selectedTask.team;

                    const newHistory = [
                      ...(selectedTask.history || []),
                      {
                        id: `hist_${Date.now()}`,
                        action: `Redirected task to ${targetUser.name} (${targetUser.team} Team)`,
                        performedBy: currentUser.name,
                        performedRole: currentUser.role,
                        timestamp: new Date().toISOString(),
                      },
                    ];

                    const optimisticTask = {
                      ...selectedTask,
                      assignedTo: targetUser._id,
                      assignedUser: targetUser,
                      team: updatedTeam,
                      history: newHistory,
                      updatedAt: new Date().toISOString(),
                    };

                    setSelectedTask(optimisticTask);
                    setTasks(tasks.map((t) => (t._id === optimisticTask._id ? optimisticTask : t)));
                    useNotificationStore.getState().addNotification({
                      type: 'assigned',
                      category: 'Task Redirected',
                      title: `📌 Task Redirected to ${targetUser.name}`,
                      text: `${currentUser.name} (${currentUser.role}) redirected "${selectedTask.title}" to ${targetUser.name} (${targetUser.team} Team).`,
                      color: 'bg-blue-500',
                      taskId: selectedTask._id,
                    });
                    toast.success(`Redirected to ${targetUser.name} (${targetUser.team} Team)`);
                    await assignTaskAction(selectedTask._id, newUserId);
                  };

                  if (!isAdmin && !isTL) {
                    // Team Member: Read-only display (Only handled by TL / Admin)
                    return (
                      <div
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 select-none"
                        title="Only Team Lead or Admin can redirect task assignee"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar
                            src={currentAssignedUser?.avatar}
                            name={currentAssignedUser?.name || 'Member'}
                            userId={currentAssignedUser?._id || selectedTask.assignedTo}
                            email={currentAssignedUser?.email}
                            size="sm"
                          />
                          <span className="text-xs font-semibold text-foreground truncate">
                            {displayAssigneeName}
                          </span>
                        </div>
                        <Lock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      </div>
                    );
                  }

                  const tlTeamUsers = workspaceUsers.filter(
                    (u) => u.team === currentUser.team && u.role !== 'Super Admin'
                  );

                  return (
                    <div className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background">
                      <Avatar
                        src={currentAssignedUser?.avatar}
                        name={currentAssignedUser?.name || 'Member'}
                        userId={currentAssignedUser?._id || selectedTask.assignedTo}
                        email={currentAssignedUser?.email}
                        size="sm"
                      />
                      <select
                        value={selectedTask.assignedTo || currentAssignedUser?._id || ''}
                        onChange={(e) => handleRedirectAssignee(e.target.value)}
                        className="w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        {!selectedTask.assignedTo && (
                          <option value="">{displayAssigneeName}</option>
                        )}
                        {isTL ? (
                          <optgroup label={`${currentUser.team} Team (Your Team)`}>
                            {tlTeamUsers.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.role})
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <>
                            {(['Development', 'Marketing', 'Creative'] as const).map((teamName) => {
                              const members = workspaceUsers.filter(
                                (u) => u.team === teamName && u.role !== 'Super Admin'
                              );
                              if (members.length === 0) return null;
                              return (
                                <optgroup key={teamName} label={`${teamName} Team`}>
                                  {members.map((u) => (
                                    <option key={u._id} value={u._id}>
                                      {u.name} ({u.role})
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                            <optgroup label="Super Admins">
                              {workspaceUsers
                                .filter((u) => u.role === 'Super Admin')
                                .map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.name} ({u.role})
                                  </option>
                                ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>
                  );
                })()}
              </div>

              {/* Meta details */}
              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 text-xs font-bold text-foreground">
                <div>Team: <strong className="text-primary font-black">{selectedTask.team}</strong> · Due: <strong className="text-foreground font-black">{formatDate(selectedTask.dueDate)}</strong></div>
                <div>Project: <strong className="text-foreground font-black">{selectedTask.projectName || 'Social Media 2026'}</strong></div>
                {selectedTask.doctorName && <div>Doctor: <strong className="text-foreground font-black">{selectedTask.doctorName}</strong></div>}
                {selectedTask.specialist && <div>Specialist: <strong className="text-foreground font-black">{selectedTask.specialist}</strong></div>}
                <div>Created by: <strong className="text-purple-700 dark:text-purple-300 font-black">{selectedTask.createdByUser?.name || 'Deva Priya D A'}</strong></div>
              </div>
            </div>

            {/* Review Footprint & TL / Admin Approval Card (Mem -> TL -> Mem (specific msg)) */}
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-4 space-y-3">
              {(() => {
                const assignedMember =
                  selectedTask.assignedUser ||
                  workspaceUsers.find((u) => u._id === selectedTask.assignedTo);
                const memberName = assignedMember?.name || 'Member';
                const teamLeadUser =
                  workspaceUsers.find((u) => u._id === selectedTask.assignedReviewerId) ||
                  workspaceUsers.find(
                    (u) => u.role === 'Team Lead' && u.team === selectedTask.team
                  );
                const reviewerName =
                  selectedTask.assignedReviewerName ||
                  teamLeadUser?.name ||
                  'Team Lead';

                // Extract review footprint history logs
                const reviewFootprintLogs = (selectedTask.history || []).filter(
                  (h) =>
                    h.action?.includes('Footprint:') ||
                    h.action?.toLowerCase().includes('review') ||
                    h.action?.toLowerCase().includes('changes requested') ||
                    h.action?.toLowerCase().includes('approved')
                );

                // Find who last moved to review
                const lastReviewMoveLog = [...reviewFootprintLogs]
                  .reverse()
                  .find((h) => h.action?.toLowerCase().includes('review') && !h.action?.toLowerCase().includes('approved'));

                const movedToReviewBy = lastReviewMoveLog?.performedBy || memberName;

                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Footprints className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300">
                          REVIEW FOOTPRINT (MEM → TL → MEM)
                        </span>
                      </div>
                      {selectedTask.status === 'Done' || selectedTask.reviewStatus === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          ✅ Approved (Done)
                        </span>
                      ) : selectedTask.reviewStatus === 'changes_requested' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          ↩️ TL → Mem (Msg)
                        </span>
                      ) : selectedTask.status === 'Review' || selectedTask.reviewStatus === 'pending_review' ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                          ⏳ In Review ({reviewerName})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-muted-foreground text-[10px] font-semibold">
                          Ready for Review
                        </span>
                      )}
                    </div>

                    {/* Visual Footprint Chain: Mem -> TL -> Mem */}
                    <div className="p-2.5 rounded-xl border border-purple-500/20 bg-background/80 space-y-2">
                      <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 truncate">
                            👤 {movedToReviewBy}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 truncate">
                            🛡️ {reviewerName} (TL)
                          </span>
                        </div>

                        {selectedTask.reviewStatus === 'changes_requested' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 truncate">
                              👤 {memberName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* To Whom Moved to Review Info */}
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <span>
                          Moved to Review by:{' '}
                          <strong className="text-foreground">{movedToReviewBy}</strong>
                        </span>
                        <span>
                          To Reviewer:{' '}
                          <strong className="text-purple-600 dark:text-purple-400">
                            {selectedTask.assignedReviewerName || `${reviewerName} (Not submitted yet)`}
                          </strong>
                        </span>
                      </div>

                      {selectedTask.approvedBy && selectedTask.status === 'Done' && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Approved to Completed (Done) by {selectedTask.approvedBy}</span>
                        </div>
                      )}
                    </div>

                    {/* Specific Message Box (TL -> Mem or Mem -> TL note) */}
                    {selectedTask.reviewNote && (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          selectedTask.reviewStatus === 'changes_requested'
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                            : 'border-purple-500/30 bg-purple-500/10 text-purple-900 dark:text-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider">
                          <span>
                            {selectedTask.reviewStatus === 'changes_requested'
                              ? '💬 Specific Message (TL → Member)'
                              : '💬 Review Footprint Note (Mem → TL)'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-relaxed">
                          &ldquo;{selectedTask.reviewNote}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Footprint Trail History Steps */}
                    {reviewFootprintLogs.length > 0 && (
                      <div className="space-y-1.5 pt-1 max-h-28 overflow-y-auto">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Footprint Trail History:
                        </span>
                        {reviewFootprintLogs
                          .slice()
                          .reverse()
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-2 text-[11px] p-1.5 rounded-lg bg-background/70 border border-zinc-200/60 dark:border-zinc-800/60"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-foreground">{item.performedBy}: </span>
                                <span className="text-muted-foreground">{item.action}</span>
                              </div>
                              <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                                {new Date(item.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {/* Submit / Move to Review Button */}
                      <Button
                        type="button"
                        onClick={() => setIsReviewerModalOpen(true)}
                        className="w-full ambizcon-gradient hover:opacity-90 text-white font-bold text-xs py-2.5 rounded-xl gap-2 shadow-glow"
                      >
                        <UserCheck className="h-4 w-4" />
                        {selectedTask.assignedReviewerName
                          ? `Re-Submit / Change Reviewer (${selectedTask.assignedReviewerName})`
                          : 'Move to Review (Select TL / Reviewer)'}
                      </Button>

                      {/* TL or Admin Exclusive Completion & Send-Back Controls */}
                      {isTLOrAdmin ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <Button
                            type="button"
                            onClick={handleApproveReview}
                            disabled={selectedTask.status === 'Done'}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Approve to Done
                          </Button>
                          <Button
                            type="button"
                            onClick={handleRequestChangesReview}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl gap-1.5 shadow-sm"
                          >
                            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                            TL → Mem (Specific Msg)
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>Only TL or Admin can approve to be Done (Completed)</span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Time Logger Box (Includes Worked Extra Hours / Overtime) */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-3">
              {(() => {
                const taskExtraHrs =
                  selectedTask.extraHours ??
                  (selectedTask.timeEntries || []).reduce(
                    (sum, te) => sum + (te.isExtraHours ? Number(te.hoursLogged || 0) : 0),
                    0
                  );
                return (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-brand-500" />
                        <span className="font-black text-xs uppercase tracking-wider text-foreground">
                          TIME LOGGER
                        </span>
                      </div>

                      {taskExtraHrs > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold font-mono">
                          <Zap className="h-3 w-3" />+{taskExtraHrs}h Extra Hr
                        </span>
                      )}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-bold">{selectedTask.actualHours || 0.0}h</span> logged of{' '}
                          {selectedTask.estimatedHours || 6}h est.
                        </span>
                        {taskExtraHrs > 0 && (
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            Includes {taskExtraHrs}h Overtime
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full"
                          style={{
                            width: `${Math.min(
                              100,
                              ((selectedTask.actualHours || 0) / (selectedTask.estimatedHours || 6)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <form onSubmit={handleLogTime} className="space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={hoursToLog}
                          onChange={(e) => setHoursToLog(e.target.value)}
                          placeholder="hrs"
                          className="w-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs text-center focus-ring"
                        />
                        <input
                          type="text"
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          placeholder={isExtraHoursLog ? 'Extra hrs work details...' : 'What did you do?'}
                          className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className={
                            isExtraHoursLog
                              ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 font-bold shadow-xs'
                              : 'ambizcon-gradient text-white text-xs px-3 font-bold shadow-glow'
                          }
                        >
                          {isExtraHoursLog ? '+Extra' : 'Log'}
                        </Button>
                      </div>

                      {/* Worked Extra Hr Toggle */}
                      <button
                        type="button"
                        onClick={() => setIsExtraHoursLog(!isExtraHoursLog)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isExtraHoursLog
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400'
                            : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className={`h-3.5 w-3.5 ${isExtraHoursLog ? 'text-amber-500' : 'opacity-60'}`} />
                          Worked Extra Hr (Overtime)
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isExtraHoursLog
                              ? 'bg-amber-500 text-white font-extrabold'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-muted-foreground'
                          }`}
                        >
                          {isExtraHoursLog ? 'YES • EXTRA HR' : 'Off'}
                        </span>
                      </button>
                    </form>

                    {/* Logged Time Entries Breakdown */}
                    {selectedTask.timeEntries && selectedTask.timeEntries.length > 0 && (
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/70 space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedTask.timeEntries
                          .slice()
                          .reverse()
                          .map((te) => (
                            <div
                              key={te.id}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] border ${
                                te.isExtraHours
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                  : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 text-muted-foreground'
                              }`}
                            >
                              <div className="truncate flex items-center gap-1.5">
                                {te.isExtraHours && (
                                  <span className="shrink-0 px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-extrabold uppercase">
                                    Extra Hr
                                  </span>
                                )}
                                <span className="font-semibold text-foreground truncate">
                                  {te.workDescription}
                                </span>
                              </div>
                              <span className="shrink-0 font-mono font-bold">
                                {te.isExtraHours ? `+${te.hoursLogged}h` : `${te.hoursLogged}h`}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Client Share Link Box */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-500" />
                <span className="font-black text-xs uppercase tracking-wider text-foreground">CLIENT SHARE LINK</span>
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

      {/* In-App Request Changes / Revisions Modal (TL -> Mem Specific Msg) */}
      <Modal
        isOpen={isRequestChangesModalOpen}
        onClose={() => setIsRequestChangesModalOpen(false)}
        title="Send Back to Member with Specific Message (TL → Mem)"
        description="Provide a specific review message for the member. This footprint will be shown on the task and revert status to In Progress."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block mb-1">
              Footprint: {currentUser.name} ({currentUser.role}) →{' '}
              {selectedTask.assignedUser?.name ||
                workspaceUsers.find((u) => u._id === selectedTask.assignedTo)?.name ||
                'Member'}
            </span>
            <span>
              Your specific message will be displayed in the Review Footprint (`Mem → TL → Mem (specific msg)`) and notify the member.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Specific Message for Member *
            </label>
            <textarea
              value={requestChangesNote}
              onChange={(e) => setRequestChangesNote(e.target.value)}
              placeholder="e.g. Please update mobile responsiveness and adjust logo spacing before final approval..."
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
              Send Specific Msg to Member (TL → Mem)
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
