'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, TeamName, User } from '@/types';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskCard } from '../tasks/TaskCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { updateTaskStatusAction, fetchTasksAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Search, Filter, Plus, RotateCcw, KanbanSquare, Sparkles, Layers, Tag } from 'lucide-react';
import { toast } from 'sonner';

const KANBAN_COLUMNS: { title: string; status: TaskStatus; accent: string; bg: string }[] = [
  { title: 'To Do', status: 'Todo', accent: 'bg-zinc-500', bg: 'hover:border-zinc-400/50' },
  { title: 'In Progress', status: 'In Progress', accent: 'bg-blue-500', bg: 'hover:border-blue-500/50' },
  { title: 'Review', status: 'Review', accent: 'bg-purple-500', bg: 'hover:border-purple-500/50' },
  { title: 'Support', status: 'Support', accent: 'bg-orange-500', bg: 'hover:border-orange-500/50' },
  { title: 'Done', status: 'Done', accent: 'bg-emerald-500', bg: 'hover:border-emerald-500/50' },
];

export function KanbanBoard() {
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
  } = useTaskStore();

  const currentUser = useAuthStore((s) => s.currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [fetchedTasks, userList] = await Promise.all([
        fetchTasksAction(),
        fetchAllUsersAction(),
      ]);
      setTasks(fetchedTasks);
      setUsers(userList);
      setLoading(false);
    }
    loadData();

    // Auto lock team selector for Team Members and Team Leads to their own team
    if (currentUser && currentUser.role !== 'Super Admin') {
      setSelectedTeam(currentUser.team);
    }
  }, [setTasks, currentUser, setSelectedTeam]);

  // Filter tasks with strict role scoping
  const filteredTasks = tasks.filter((t) => {
    // Hide incoming tasks from normal Kanban board until assigned by lead
    if (t.incoming) return false;

    // Team scoping: Non Super Admin can only see their own team tasks
    if (!isSuperAdmin && currentUser) {
      if (t.team !== currentUser.team) return false;
    } else if (selectedTeam !== 'All' && t.team !== selectedTeam) {
      return false;
    }

    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;
    if (selectedAssignee !== 'All' && t.assignedTo !== selectedAssignee) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesDesc = t.description.toLowerCase().includes(q);
      const matchesLabel = t.labels.some((l) => l.toLowerCase().includes(q));
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
        task.assignedTo === currentUser?._id;

      if (!canMove) {
        toast.error('Permission Restricted: Only Team Lead, Admin, or assigned member can move task status.');
        return;
      }

      // Optimistic update
      const updatedTasks = tasks.map((t) =>
        t._id === taskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t
      );
      setTasks(updatedTasks);
      toast.success(`Moved "${task.title}" to ${targetStatus}`);

      // Server update
      await updateTaskStatusAction(taskId, targetStatus);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div className="space-y-6">
      {/* Kanban Board Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <KanbanSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isSuperAdmin ? 'Global Workspace Kanban' : `${currentUser?.team} Team Kanban Board`}
              </h1>
              <Badge variant="default" className="text-[10px] font-mono">
                {filteredTasks.length} Active Cards
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag and drop cards across columns to update task status in real time.
            </p>
          </div>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5 shadow-glow">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-panel">
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

          {/* Team Filter */}
          <select
            value={isSuperAdmin ? selectedTeam : currentUser?.team || 'Creative'}
            onChange={(e) => isSuperAdmin && setSelectedTeam(e.target.value as TeamName | 'All')}
            disabled={!isSuperAdmin}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring disabled:opacity-80"
          >
            {isSuperAdmin && <option value="All">All Workspace Teams</option>}
            <option value="Creative">Creative Team</option>
            <option value="Marketing">Marketing Team</option>
            <option value="Development">Development Team</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
          >
            <option value="All">All Assignees</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Reset button */}
          {(searchQuery || selectedTeam !== 'All' || selectedPriority !== 'All' || selectedAssignee !== 'All') && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-xs">
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
            resetFilters();
            if (currentUser) setSelectedAssignee(currentUser._id);
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
            selectedAssignee === currentUser?._id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          ⚡ Assigned to Me
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

      {/* Kanban Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.status);

            return (
              <div
                key={column.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
                className={`flex flex-col rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 min-h-[600px] transition-all ${column.bg}`}
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
                    columnTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                      >
                        <TaskCard task={task} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
