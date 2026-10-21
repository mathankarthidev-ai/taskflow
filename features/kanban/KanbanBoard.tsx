'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority, TaskStatus, TeamName, User } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { isUserInCompany, isTaskInCompany } from '@/lib/company-filter';
import { CompletedPeriod } from '@/lib/completed-tasks-generator';
import { TaskCard } from '../tasks/TaskCard';
import { TaskListView } from './TaskListView';
import { TaskCalendarView } from './TaskCalendarView';
import { ReviewerSelectModal } from '@/components/tasks/ReviewerSelectModal';
import { CompletedTasksExplorerModal } from '@/components/tasks/CompletedTasksExplorerModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { syncUsersAvatarsToLocalStore } from '@/lib/avatar-store';
import {
  updateTaskStatusAction,
  updateTaskReviewWorkflowAction,
  fetchTasksAction,
  createTaskAction,
  deleteTaskAction,
} from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Search, Filter, Plus, RotateCcw, KanbanSquare, Sparkles, Layers, Tag, UserCheck, Clock, Shield, List, Calendar, CheckCircle2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV, formatDate } from '@/lib/utils';

const KANBAN_COLUMNS: { title: string; status: TaskStatus; accent: string; bg: string }[] = [
  { title: 'To Do', status: 'Todo', accent: 'bg-zinc-500', bg: 'hover:border-zinc-400/50' },
  { title: 'In Progress', status: 'In Progress', accent: 'bg-blue-500', bg: 'hover:border-blue-500/50' },
  { title: 'Review / Testing', status: 'Review', accent: 'bg-purple-500', bg: 'hover:border-purple-500/50' },
  { title: 'Completed', status: 'Done', accent: 'bg-emerald-500', bg: 'hover:border-emerald-500/50' },
];

function KanbanBoardContent() {
  const {
    tasks,
    setTasks,
    searchQuery,
    setSearchQuery,
    selectedTeam,
    setSelectedTeam,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    resetFilters,
    setCreateModalOpen,
    setSelectedTask,
    setDetailModalOpen,
  } = useTaskStore();

  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');
  const [quickTitle, setQuickTitle] = useState('');

  // New Tracking & TL Scope Dropdown States
  const [creationTrackingFilter, setCreationTrackingFilter] = useState<'all' | 'created_by_me' | 'assigned_to_me'>('all');
  const [tlMemberFilter, setTlMemberFilter] = useState<string>('team_all');

  // Completed Tasks View Options State
  const [completedPeriod, setCompletedPeriod] = useState<CompletedPeriod>('daily');
  const [completedVisibleLimit, setCompletedVisibleLimit] = useState<number>(15);
  const [isCompletedExplorerOpen, setIsCompletedExplorerOpen] = useState<boolean>(false);

  // Reviewer Selection Modal States
  const [reviewTaskTarget, setReviewTaskTarget] = useState<Task | null>(null);
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isTeamLead = currentUser?.role === 'Team Lead' || isSuperAdmin;
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  useEffect(() => {
    async function loadData(showLoader = true) {
      if (showLoader) setLoading(true);
      const [fetchedTasks, userList] = await Promise.all([
        fetchTasksAction(),
        fetchAllUsersAction(),
      ]);

      if (Array.isArray(userList)) {
        syncUsersAvatarsToLocalStore(userList);
      }
      setTasks(fetchedTasks || []);
      setUsers(userList || []);
      if (showLoader) setLoading(false);
    }
    loadData(true);

    if (currentUser && !isSuperAdmin) {
      setSelectedTeam(currentUser.team);
    }

    const onRefresh = () => {
      loadData(false);
    };
    window.addEventListener('ambizcon_workspace_refresh', onRefresh);
    return () => window.removeEventListener('ambizcon_workspace_refresh', onRefresh);
  }, [setTasks, currentUser, setSelectedTeam, isSuperAdmin]);

  // Team Users Filter List (Scoped by Company Branch)
  const teamMembersList = (users || []).filter(
    (u) => u && isUserInCompany(u, activeCompanyScope) && (isSuperAdmin || u.team === currentUser?.team)
  );

  // Use real workspace tasks (mapping legacy Backlog -> Todo and Support -> Review so no task is lost)
  const combinedTasks = useMemo(() => {
    return (tasks || []).map((t) => {
      if (!t) return t;
      if (t.status === 'Backlog') return { ...t, status: 'Todo' as TaskStatus };
      if (t.status === 'Support') return { ...t, status: 'Review' as TaskStatus };
      return t;
    });
  }, [tasks]);

  // Filter tasks with strict role scoping, company branch, and tracking options
  const filteredTasks = (combinedTasks || []).filter((t) => {
    if (!t) return false;

    // Hide incoming requests from main Kanban
    if (t.incoming) return false;

    // Company Branch Scoping
    if (!isTaskInCompany(t, activeCompanyScope, users)) return false;

    // Team Scoping
    if (!isSuperAdmin && currentUser) {
      if (t.team !== currentUser.team) return false;
    } else if (selectedTeam !== 'All' && t.team !== selectedTeam) {
      return false;
    }

    // Created By Me / Assigned To Me Tracking Filter
    if (creationTrackingFilter === 'created_by_me') {
      if (t.createdBy !== currentUser?._id && t.createdByUser?.email !== currentUser?.email) return false;
    } else if (creationTrackingFilter === 'assigned_to_me') {
      if (t.assignedTo !== currentUser?._id && t.assignedUser?.email !== currentUser?.email) return false;
    }

    // TL Specific Member Workload Filter Dropdown
    if (tlMemberFilter === 'my_own') {
      if (t.assignedTo !== currentUser?._id && t.createdBy !== currentUser?._id) return false;
    } else if (tlMemberFilter !== 'team_all') {
      if (t.assignedTo !== tlMemberFilter && t.createdBy !== tlMemberFilter) return false;
    }

    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
    if (selectedAssignee !== 'All' && t.assignedTo !== selectedAssignee) return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = (t.title || '').toLowerCase().includes(q);
      const matchesDesc = (t.description || '').toLowerCase().includes(q);
      const matchesLabel = Array.isArray(t.labels)
        ? t.labels.some((l) => typeof l === 'string' && l.toLowerCase().includes(q))
        : false;
      if (!matchesTitle && !matchesDesc && !matchesLabel) return false;
    }
    return true;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== targetStatus) {
      const canMove =
        currentUser?.role === 'Super Admin' ||
        currentUser?.role === 'Admin' ||
        currentUser?.role === 'Team Lead' ||
        task.assignedTo === currentUser?._id ||
        task.createdBy === currentUser?._id;

      if (!canMove) {
        toast.error('Permission Restricted: Only Team Lead, Admin, or assigned member can move task status.');
        return;
      }

      // Strict Rule: Only TL or Admin can approve a task to be Done (Completed)
      if (targetStatus === 'Done' && !isTeamLead) {
        toast.error(
          'Only Team Lead or Admin can approve a task to be Done (Completed). Please submit to TL for Review.'
        );
        setReviewTaskTarget(task);
        setIsReviewerModalOpen(true);
        return;
      }

      if (targetStatus === 'Review') {
        setReviewTaskTarget(task);
        setIsReviewerModalOpen(true);
        return;
      }

      // Record History item
      const historyLog = task.history || [];
      const newHistory = [
        ...historyLog,
        {
          id: `hist_${Date.now()}`,
          action:
            targetStatus === 'Done'
              ? `[Footprint: ${currentUser?.name || 'User'} (${currentUser?.role}) Approved → Completed] Task approved & marked Done`
              : `Status moved from ${task.status} to ${targetStatus}`,
          performedBy: currentUser?.name || 'User',
          performedRole: currentUser?.role,
          timestamp: new Date().toISOString(),
        },
      ];

      const isApprovingDone = targetStatus === 'Done';

      // Optimistic update
      const updatedTasks = tasks.map((t) =>
        t._id === taskId
          ? {
              ...t,
              status: targetStatus,
              ...(isApprovingDone
                ? {
                    reviewStatus: 'approved' as const,
                    approvedBy: currentUser?.name || 'TL / Admin',
                    approvalStatus: 'approved' as const,
                  }
                : {}),
              history: newHistory,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      setTasks(updatedTasks);

      if (targetStatus === 'Done') {
        const assignedUser = task.assignedUser || (task.assignedTo ? users.find((u) => u._id === task.assignedTo) : undefined);
        const assignedName = assignedUser?.name || task.assignedUser?.name || 'Member';
        useNotificationStore.getState().addNotification({
          id: `notif_done_${task._id}_${Date.now()}`,
          type: 'task_completed',
          category: 'Task Completed',
          title: '✅ Approved to Completed (Done)',
          text: `${currentUser?.name || 'User'} (${currentUser?.role}) approved "${task.title}" (${task.team} Team) as Completed!`,
          color: 'bg-emerald-500',
          taskId: task._id,
          targetTeam: task.team,
          assignedUserId: task.assignedTo,
          assignedUserName: assignedName,
          completedByUserId: currentUser?._id,
          completedByName: currentUser?.name,
          targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
          targetUserIds: [task.assignedTo, currentUser?._id].filter(Boolean) as string[],
          targetUserNames: [assignedName, currentUser?.name].filter(Boolean) as string[],
        });
      } else {
        useNotificationStore.getState().addNotification({
          type: 'updated',
          category: 'Task Status Updated',
          title: `🔄 Moved to ${targetStatus}`,
          text: `${currentUser?.name || 'User'} moved "${task.title}" to ${targetStatus}.`,
          color: 'bg-blue-500',
          taskId: task._id,
        });
      }

      toast.success(
        targetStatus === 'Done'
          ? `Approved "${task.title}" to Completed!`
          : `Moved "${task.title}" to ${targetStatus}`
      );

      // Server update
      await updateTaskReviewWorkflowAction(taskId, {
        status: targetStatus,
        ...(isApprovingDone
          ? {
              reviewStatus: 'approved',
              approvedBy: currentUser?.name || 'TL / Admin',
              approvalStatus: 'approved',
            }
          : {}),
        history: newHistory,
      });
    }
  };

  const handleConfirmReviewer = async (reviewer: User, submissionNote?: string) => {
    if (!reviewTaskTarget) return;

    const historyLog = reviewTaskTarget.history || [];
    const newHistory = [
      ...historyLog,
      {
        id: `hist_${Date.now()}`,
        action: `[Footprint: ${currentUser?.name || 'User'} (${currentUser?.role}) → ${reviewer.name} (${reviewer.role})] Moved to Review${
          submissionNote ? ` — "${submissionNote}"` : ''
        }`,
        performedBy: currentUser?.name || 'User',
        performedRole: currentUser?.role,
        timestamp: new Date().toISOString(),
        note: submissionNote || undefined,
      },
    ];

    const updatedNote = submissionNote
      ? `${currentUser?.name || 'Member'} → ${reviewer.name}: ${submissionNote}`
      : reviewTaskTarget.reviewNote;

    const updatedTasks = tasks.map((t) =>
      t._id === reviewTaskTarget._id
        ? {
            ...t,
            status: 'Review' as const,
            assignedReviewerId: reviewer._id,
            assignedReviewerName: reviewer.name,
            reviewStatus: 'pending_review' as const,
            reviewNote: updatedNote,
            history: newHistory,
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    setTasks(updatedTasks);
    const assignedUser = reviewTaskTarget.assignedUser || (reviewTaskTarget.assignedTo ? users.find((u) => u._id === reviewTaskTarget.assignedTo) : undefined);
    const assignedName = assignedUser?.name || reviewTaskTarget.assignedUser?.name || currentUser?.name || 'Member';
    useNotificationStore.getState().addNotification({
      type: 'review_assigned',
      category: 'Reviewer Assignment',
      title: `🔍 Moved to Review (${currentUser?.name || 'Member'} → ${reviewer.name})`,
      text: `${currentUser?.name || 'User'} submitted "${reviewTaskTarget.title}" for review to ${reviewer.name}${
        submissionNote ? `: "${submissionNote}"` : '.'
      }`,
      color: 'bg-purple-600',
      taskId: reviewTaskTarget._id,
      targetTeam: reviewTaskTarget.team,
      assignedUserId: reviewTaskTarget.assignedTo,
      assignedUserName: assignedName,
      completedByUserId: currentUser?._id,
      completedByName: currentUser?.name,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
      targetUserIds: [reviewer._id, reviewTaskTarget.assignedTo, currentUser?._id].filter(Boolean) as string[],
      targetUserNames: [reviewer.name, assignedName, currentUser?.name].filter(Boolean) as string[],
    });
    toast.success(`Footprint saved: ${currentUser?.name || 'Member'} → ${reviewer.name} (Moved to Review)`);
    await updateTaskReviewWorkflowAction(reviewTaskTarget._id, {
      status: 'Review',
      assignedReviewerId: reviewer._id,
      assignedReviewerName: reviewer.name,
      reviewStatus: 'pending_review',
      reviewNote: updatedNote,
      history: newHistory,
    });
    setReviewTaskTarget(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  // Tracking counts
  const myCreatedCount = (tasks || []).filter((t) => t && !t.incoming && (t.createdBy === currentUser?._id || t.createdByUser?.email === currentUser?.email)).length;
  const myAssignedCount = (tasks || []).filter((t) => t && !t.incoming && (t.assignedTo === currentUser?._id || t.assignedUser?.email === currentUser?.email)).length;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetTeam = selectedTeam !== 'All' ? selectedTeam : (currentUser?.team || 'Development');
    const newTaskData = {
      title: quickTitle.trim(),
      description: '',
      priority: 'Medium' as const,
      status: 'Todo' as const,
      team: targetTeam,
      assignedTo: currentUser?._id,
      createdBy: currentUser?._id || 'usr_1',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      labels: [],
      clientName: 'Ambizcon Health',
    };

    const titleToUse = quickTitle.trim();
    setQuickTitle('');
    try {
      const created = await createTaskAction(newTaskData as any);
      if (created) {
        setTasks([created, ...tasks]);
        useNotificationStore.getState().addNotification({
          type: 'assigned',
          category: 'Task Created',
          title: '📌 New Task Created',
          text: `${currentUser?.name || 'User'} created "${titleToUse}" in ${targetTeam} Team.`,
          color: 'bg-blue-500',
          taskId: created._id,
        });
        toast.success(`Task "${titleToUse}" created in To Do!`);
      }
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string, title?: string) => {
    try {
      setTasks(tasks.filter((t) => t._id !== taskId));
      await deleteTaskAction(taskId);
      toast.success(title ? `Deleted "${title}"` : 'Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t._id === taskId);
    if (!targetTask) return;

    if (newStatus === 'Done' && !isTeamLead) {
      toast.error(
        'Only Team Lead or Admin can approve a task to be Done (Completed). Please submit to TL for Review.'
      );
      setReviewTaskTarget(targetTask);
      setIsReviewerModalOpen(true);
      return;
    }

    if (newStatus === 'Review') {
      setReviewTaskTarget(targetTask);
      setIsReviewerModalOpen(true);
      return;
    }

    const newHistory = [
      ...(targetTask.history || []),
      {
        id: `hist_${Date.now()}`,
        action:
          newStatus === 'Done'
            ? `[Footprint: ${currentUser?.name || 'User'} (${currentUser?.role}) Approved → Completed] Task approved & marked Done`
            : `Status moved from ${targetTask.status} to ${newStatus}`,
        performedBy: currentUser?.name || 'User',
        performedRole: currentUser?.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const isApprovingDone = newStatus === 'Done';
    const updated = tasks.map((t) =>
      t._id === taskId
        ? {
            ...t,
            status: newStatus,
            ...(isApprovingDone
              ? {
                  reviewStatus: 'approved' as const,
                  approvedBy: currentUser?.name || 'TL / Admin',
                  approvalStatus: 'approved' as const,
                }
              : {}),
            history: newHistory,
          }
        : t
    );
    setTasks(updated);
    if (newStatus === 'Done') {
      const assignedUser = targetTask.assignedUser || (targetTask.assignedTo ? users.find((u) => u._id === targetTask.assignedTo) : undefined);
      const assignedName = assignedUser?.name || targetTask.assignedUser?.name || 'Member';
      useNotificationStore.getState().addNotification({
        id: `notif_done_${targetTask._id}_${Date.now()}`,
        type: 'task_completed',
        category: 'Task Completed',
        title: '✅ Approved to Completed (Done)',
        text: `${currentUser?.name || 'User'} (${currentUser?.role}) approved "${targetTask.title}" as Completed!`,
        color: 'bg-emerald-500',
        taskId: targetTask._id,
        targetTeam: targetTask.team,
        assignedUserId: targetTask.assignedTo,
        assignedUserName: assignedName,
        completedByUserId: currentUser?._id,
        completedByName: currentUser?.name,
        targetRoles: ['Super Admin', 'Admin', 'Team Lead'],
        targetUserIds: [targetTask.assignedTo, currentUser?._id].filter(Boolean) as string[],
        targetUserNames: [assignedName, currentUser?.name].filter(Boolean) as string[],
      });
    } else {
      useNotificationStore.getState().addNotification({
        type: 'updated',
        category: 'Task Status Updated',
        title: `🔄 Status Updated to ${newStatus}`,
        text: `${currentUser?.name || 'User'} updated "${targetTask.title}" to ${newStatus}.`,
        color: 'bg-blue-500',
        taskId: targetTask._id,
      });
    }
    toast.success(
      newStatus === 'Done'
        ? `Approved "${targetTask.title}" to Completed!`
        : `Updated status to ${newStatus}`
    );
    await updateTaskReviewWorkflowAction(taskId, {
      status: newStatus,
      ...(isApprovingDone
        ? {
            reviewStatus: 'approved',
            approvedBy: currentUser?.name || 'TL / Admin',
            approvalStatus: 'approved',
          }
        : {}),
      history: newHistory,
    });
  };

  const handleCreateTaskForDate = async (dateStr: string, title: string) => {
    const targetTeam = selectedTeam !== 'All' ? selectedTeam : (currentUser?.team || 'Development');
    const newTaskData = {
      title,
      description: `Task scheduled for ${dateStr}`,
      priority: 'Medium' as const,
      status: 'Todo' as const,
      team: targetTeam,
      assignedTo: currentUser?._id,
      createdBy: currentUser?._id || 'usr_1',
      dueDate: `${dateStr}T17:00:00.000Z`,
      labels: [],
      clientName: 'Ambizcon Health',
    };
    try {
      const created = await createTaskAction(newTaskData as any);
      if (created) {
        setTasks([created, ...tasks]);
        toast.success(`Task "${title}" created for ${dateStr}!`);
      }
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleExportTasksCSV = () => {
    if (!filteredTasks || filteredTasks.length === 0) {
      toast.error('No tasks available to export');
      return;
    }
    const exportRows = filteredTasks.map((t) => ({
      'Task ID': t._id,
      'Title': t.title,
      'Status': t.status,
      'Priority': t.priority,
      'Team': t.team,
      'Assignee': t.assignedUser?.name || t.assignedTo || 'Unassigned',
      'Reviewer': t.assignedReviewerName || 'None',
      'Client': t.clientName || '—',
      'Doctor': t.doctorName || '—',
      'Due Date': formatDate(t.dueDate),
      'Created Date': formatDate(t.createdAt),
    }));

    exportToCSV(`BizyHub_Kanban_Tasks_${selectedCompany.replace(/[^a-zA-Z0-9]/g, '_')}`, exportRows);
    toast.success(`Tasks (${exportRows.length} items) exported to CSV!`);
  };

  return (
    <div className="space-y-6">
      {/* Bizzy Board Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <KanbanSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isSuperAdmin ? 'Global Workspace Bizzy Board' : `${currentUser?.team || 'Workspace'} Team Bizzy Board`}
              </h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {filteredTasks.length} Active Cards
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag and drop cards across columns • Track creation history & team workload in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Board / List / Calendar switch option */}
          <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'board'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanSquare className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>

          {/* Quick Task Form: [New task...] [Add] */}
          <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="New task..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring placeholder:text-muted-foreground w-36 sm:w-48"
            />
            <Button type="submit" size="sm" className="font-bold text-xs px-3 ambizcon-gradient text-white shadow-glow">
              Add
            </Button>
          </form>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExportTasksCSV}
            className="gap-1.5 text-xs font-bold border-zinc-200 dark:border-zinc-800"
            title="Download active tasks to CSV"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Export CSV
          </Button>

          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-3.5 glass-panel">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background py-1.5 pl-8 pr-3 text-xs focus-ring"
            />
          </div>

          {/* Task Creation & History Tracking Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:inline">Track:</span>
            <select
              value={creationTrackingFilter}
              onChange={(e) => setCreationTrackingFilter(e.target.value as any)}
              className="rounded-xl border border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold px-2.5 py-1.5 text-xs focus-ring"
            >
              <option value="all">All Tasks ({tasks.length})</option>
              <option value="created_by_me">Created By Me ({myCreatedCount})</option>
              <option value="assigned_to_me">Assigned To Me ({myAssignedCount})</option>
            </select>
          </div>

          {/* Team Lead (TL) Member Workload Filter Dropdown */}
          {isTeamLead && (() => {
            const activeTlMember =
              tlMemberFilter === 'my_own'
                ? currentUser
                : tlMemberFilter !== 'team_all'
                ? teamMembersList.find((m) => m._id === tlMemberFilter) || null
                : null;
            return (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:inline">View:</span>
                {activeTlMember && (
                  <Avatar
                    src={activeTlMember.avatar}
                    name={activeTlMember.name}
                    userId={activeTlMember._id}
                    email={activeTlMember.email}
                    size="xs"
                    className="ring-1 ring-emerald-500/40"
                  />
                )}
                <select
                  value={tlMemberFilter}
                  onChange={(e) => setTlMemberFilter(e.target.value)}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1.5 text-xs focus-ring"
                >
                  <option value="team_all">Whole Team Tasks</option>
                  <option value="my_own">My Personal Tasks</option>
                  <optgroup label="Filter By Team Member">
                    {teamMembersList.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            );
          })()}

          {/* Team Filter */}
          {isSuperAdmin && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as TeamName | 'All')}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
            >
              <option value="All">All Teams</option>
              <option value="Creative">Creative</option>
              <option value="Marketing">Marketing</option>
              <option value="Development">Development</option>
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent 🔥</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Reset button */}
          {(searchQuery || creationTrackingFilter !== 'all' || tlMemberFilter !== 'team_all' || selectedPriority !== 'All') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetFilters();
                setCreationTrackingFilter('all');
                setTlMemberFilter('team_all');
              }}
              className="gap-1 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main View: List, Calendar, or Crisp 4-Column Board */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full space-y-2.5">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <TaskListView
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteTask}
          onOpenModal={(t) => {
            setSelectedTask(t);
            setDetailModalOpen(true);
          }}
        />
      ) : viewMode === 'calendar' ? (
        <TaskCalendarView
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onOpenModal={(t) => {
            setSelectedTask(t);
            setDetailModalOpen(true);
          }}
          onCreateTaskForDate={handleCreateTaskForDate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = (filteredTasks || []).filter(
              (t) => t && (t.status === column.status || (t.status || '').toLowerCase() === column.status.toLowerCase())
            );
            const isCompletedCol = column.status === 'Done';
            const visibleColumnTasks = isCompletedCol
              ? columnTasks.slice(0, completedVisibleLimit)
              : columnTasks;

            return (
              <div
                key={column.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
                className={`flex flex-col rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 min-h-[420px] w-full transition-all ${column.bg}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 px-1 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {column.title}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono px-2 py-0.5 ${
                      isCompletedCol
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : ''
                    }`}
                  >
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Column Cards List */}
                <div className="flex-1 space-y-3">
                  {visibleColumnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                      No tasks in {column.title}
                    </div>
                  ) : (
                    <>
                      {visibleColumnTasks.map((task) => {
                        if (!task || !task._id) return null;
                        return (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task._id)}
                          >
                            <TaskCard task={task} onDelete={handleDeleteTask} />
                          </div>
                        );
                      })}

                      {isCompletedCol && columnTasks.length > completedVisibleLimit && (
                        <div className="pt-2 space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCompletedVisibleLimit((prev) => prev + 20)}
                            className="w-full text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            Load +20 More ({columnTasks.length - completedVisibleLimit} left)
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCompletedExplorerOpen(true)}
                            className="w-full text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            Open Full Explorer ({columnTasks.length} Tasks)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviewer Selection Modal */}
      <ReviewerSelectModal
        isOpen={isReviewerModalOpen}
        onClose={() => setIsReviewerModalOpen(false)}
        task={reviewTaskTarget}
        users={users}
        onConfirmReviewer={handleConfirmReviewer}
      />

      {/* Completed Tasks View Explorer Modal */}
      <CompletedTasksExplorerModal
        isOpen={isCompletedExplorerOpen}
        onClose={() => setIsCompletedExplorerOpen(false)}
        users={teamMembersList}
        tasks={tasks}
        initialMemberId={
          tlMemberFilter !== 'team_all' && tlMemberFilter !== 'my_own'
            ? tlMemberFilter
            : tlMemberFilter === 'my_own' && currentUser
            ? currentUser._id
            : 'all'
        }
        initialPeriod={completedPeriod}
      />
    </div>
  );
}

class KanbanErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Bizzy Board Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-foreground">
            Bizzy Board Refresh Needed
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            A temporary display error occurred while rendering task cards. Click below to refresh your board view.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="ambizcon-gradient text-white text-xs font-bold px-4 py-2"
            >
              Reload Bizzy Board
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function KanbanBoard() {
  return (
    <KanbanErrorBoundary>
      <KanbanBoardContent />
    </KanbanErrorBoundary>
  );
}
