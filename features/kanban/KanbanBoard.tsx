'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, TeamName, User } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskCard } from '../tasks/TaskCard';
import { TaskListView } from './TaskListView';
import { TaskCalendarView } from './TaskCalendarView';
import { ReviewerSelectModal } from '@/components/tasks/ReviewerSelectModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { updateTaskStatusAction, fetchTasksAction, createTaskAction, deleteTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Search, Filter, Plus, RotateCcw, KanbanSquare, Sparkles, Layers, Tag, UserCheck, Clock, Shield, List, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const KANBAN_COLUMNS: { title: string; status: TaskStatus; accent: string; bg: string }[] = [
  { title: 'Backlog', status: 'Backlog', accent: 'bg-slate-500', bg: 'hover:border-slate-400/50' },
  { title: 'To Do', status: 'Todo', accent: 'bg-zinc-500', bg: 'hover:border-zinc-400/50' },
  { title: 'In Progress', status: 'In Progress', accent: 'bg-blue-500', bg: 'hover:border-blue-500/50' },
  { title: 'Review / Testing', status: 'Review', accent: 'bg-purple-500', bg: 'hover:border-purple-500/50' },
  { title: 'Support', status: 'Support', accent: 'bg-orange-500', bg: 'hover:border-orange-500/50' },
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'calendar'>('board');
  const [quickTitle, setQuickTitle] = useState('');

  // New Tracking & TL Scope Dropdown States
  const [creationTrackingFilter, setCreationTrackingFilter] = useState<'all' | 'created_by_me' | 'assigned_to_me'>('all');
  const [tlMemberFilter, setTlMemberFilter] = useState<string>('team_all');

  // Reviewer Selection Modal States
  const [reviewTaskTarget, setReviewTaskTarget] = useState<Task | null>(null);
  const [isReviewerModalOpen, setIsReviewerModalOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isTeamLead = currentUser?.role === 'Team Lead' || isSuperAdmin;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let [fetchedTasks, userList] = await Promise.all([
        fetchTasksAction(),
        fetchAllUsersAction(),
      ]);

      if (!fetchedTasks || fetchedTasks.length === 0) {
        try {
          await fetch('/api/seed', { method: 'POST' });
          fetchedTasks = await fetchTasksAction();
        } catch {
          // fallback
        }
      }

      setTasks(fetchedTasks || []);
      setUsers(userList || []);
      setLoading(false);
    }
    loadData();

    if (currentUser && !isSuperAdmin) {
      setSelectedTeam(currentUser.team);
    }
  }, [setTasks, currentUser, setSelectedTeam, isSuperAdmin]);

  // Team Users Filter List
  const teamMembersList = (users || []).filter((u) => u && (isSuperAdmin || u.team === currentUser?.team));

  // Filter tasks with strict role scoping and tracking options
  const filteredTasks = (tasks || []).filter((t) => {
    if (!t) return false;

    // Hide incoming requests from main Kanban
    if (t.incoming) return false;

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
        currentUser?.role === 'Team Lead' ||
        task.assignedTo === currentUser?._id ||
        task.createdBy === currentUser?._id;

      if (!canMove) {
        toast.error('Permission Restricted: Only Team Lead, Admin, or assigned member can move task status.');
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
          action: `Status moved from ${task.status} to ${targetStatus}`,
          performedBy: currentUser?.name || 'User',
          performedRole: currentUser?.role,
          timestamp: new Date().toISOString(),
        },
      ];

      // Optimistic update
      const updatedTasks = tasks.map((t) =>
        t._id === taskId ? { ...t, status: targetStatus, history: newHistory, updatedAt: new Date().toISOString() } : t
      );
      setTasks(updatedTasks);
      toast.success(`Moved "${task.title}" to ${targetStatus}`);

      // Server update
      await updateTaskStatusAction(taskId, targetStatus);
    }
  };

  const handleConfirmReviewer = async (reviewer: User) => {
    if (!reviewTaskTarget) return;

    const historyLog = reviewTaskTarget.history || [];
    const newHistory = [
      ...historyLog,
      {
        id: `hist_${Date.now()}`,
        action: `Moved to Review & Assigned Reviewer: ${reviewer.name} (${reviewer.role})`,
        performedBy: currentUser?.name || 'User',
        performedRole: currentUser?.role,
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedTasks = tasks.map((t) =>
      t._id === reviewTaskTarget._id
        ? {
            ...t,
            status: 'Review' as const,
            assignedReviewerId: reviewer._id,
            assignedReviewerName: reviewer.name,
            reviewStatus: 'pending_review' as const,
            history: newHistory,
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    setTasks(updatedTasks);
    toast.success(`Task submitted for review! Assigned Reviewer: ${reviewer.name}`);
    await updateTaskStatusAction(reviewTaskTarget._id, 'Review');
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
    const updated = tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    toast.success(`Updated status to ${newStatus}`);
    await updateTaskStatusAction(taskId, newStatus);
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
            <Button type="submit" size="sm" className="font-bold text-xs px-3">
              Add
            </Button>
          </form>

          {filteredTasks.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setLoading(true);
                try {
                  await fetch('/api/seed', { method: 'POST' });
                  const fetchedTasks = await fetchTasksAction();
                  setTasks(fetchedTasks);
                  toast.success('Populated 18 Ambizcon tasks across all 6 columns!');
                } catch (e) {
                  toast.error('Failed to populate tasks');
                } finally {
                  setLoading(false);
                }
              }}
              className="gap-1.5 border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              Populate Tasks
            </Button>
          )}
          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5 shadow-glow">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-panel space-y-2 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, label (e.g. Figma, Mobile)..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background py-1.5 pl-9 pr-3 text-xs focus-ring"
            />
          </div>

          {/* Task Creation & History Tracking Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:inline">Track Mode:</span>
            <select
              value={creationTrackingFilter}
              onChange={(e) => setCreationTrackingFilter(e.target.value as any)}
              className="rounded-xl border border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold px-3 py-1.5 text-xs focus-ring"
            >
              <option value="all">All Workspace Tasks ({tasks.length})</option>
              <option value="created_by_me">Tasks Created By Me ({myCreatedCount})</option>
              <option value="assigned_to_me">Tasks Assigned To Me ({myAssignedCount})</option>
            </select>
          </div>

          {/* Team Lead (TL) Member Workload Filter Dropdown */}
          {isTeamLead && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground hidden sm:inline">TL Workload View:</span>
              <select
                value={tlMemberFilter}
                onChange={(e) => setTlMemberFilter(e.target.value)}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 text-xs focus-ring"
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
          )}

          {/* Team Filter */}
          {isSuperAdmin && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as TeamName | 'All')}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
            >
              <option value="All">All Workspace Teams</option>
              <option value="Creative">Creative Team</option>
              <option value="Marketing">Marketing Team</option>
              <option value="Development">Development Team</option>
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
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

      {/* Quick Label Preset Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mr-1">
          Quick Label Filters:
        </span>
        <button
          onClick={() => {
            setCreationTrackingFilter('assigned_to_me');
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
            creationTrackingFilter === 'assigned_to_me'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Assigned to Me
        </button>
        <button
          onClick={() => {
            setCreationTrackingFilter('created_by_me');
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
            creationTrackingFilter === 'created_by_me'
              ? 'border-brand-500 bg-brand-500/10 text-brand-400'
              : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          📝 Created By Me ({myCreatedCount})
        </button>

        {['Figma', 'UI/UX', 'Mobile', 'Wireframes', 'SEO', 'API'].map((labelTag) => (
          <button
            key={labelTag}
            onClick={() => setSearchQuery(labelTag)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all flex items-center gap-1 ${
              searchQuery === labelTag
                ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="h-3 w-3 opacity-60" />
            {labelTag}
          </button>
        ))}
      </div>

      {/* Main View: List or Board */}
      {loading ? (
        <div className="flex xl:grid xl:grid-cols-6 overflow-x-auto pb-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-[285px] sm:w-[320px] xl:w-full shrink-0 xl:shrink space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
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
        <div className="flex xl:grid xl:grid-cols-6 overflow-x-auto pb-4 gap-4 items-start snap-x snap-mandatory">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = (filteredTasks || []).filter(
              (t) => t && (t.status === column.status || (t.status || '').toLowerCase() === column.status.toLowerCase())
            );

            return (
              <div
                key={column.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
                className={`flex flex-col rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 min-h-[500px] lg:min-h-[600px] w-[285px] sm:w-[320px] lg:w-full shrink-0 lg:shrink snap-center transition-all ${column.bg}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.accent}`} />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      {column.title}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Column Cards List */}
                <div className="flex-1 space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                      No tasks in {column.title}
                    </div>
                  ) : (
                    columnTasks.map((task) => {
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
                    })
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
