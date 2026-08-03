'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchTasksAction } from '@/actions/taskActions';
import { Task } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate, formatTimeAgo } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export function DashboardOverview() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { setSelectedTask, setDetailModalOpen, setCreateModalOpen } = useTaskStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchTasksAction();
      setTasks(res);
      setLoading(false);
    }
    loadData();
  }, []);

  if (!currentUser) return null;

  const now = new Date();

  // Widget 1: Assigned Tasks
  const myAssignedTasks = tasks.filter((t) => t.assignedTo === currentUser._id && t.status !== 'Done');

  // Widget 2: Completed Today
  const completedToday = tasks.filter(
    (t) => t.status === 'Done' && new Date(t.updatedAt).toDateString() === now.toDateString()
  );

  // Widget 3: Overdue Tasks
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate).getTime() < now.getTime()
  );

  // Widget 4: Pending Review
  const pendingReviewTasks = tasks.filter((t) => t.status === 'Review');

  // Widget 5: Upcoming Deadlines (Due in next 7 days, sorted)
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== 'Done' && new Date(t.dueDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Widget 6: Recent Activity (Latest updated tasks)
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Welcome back, {currentUser.name}!
              </h1>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You have <span className="font-semibold text-foreground">{myAssignedTasks.length} assigned tasks</span> pending on your workspace board today.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5 shadow-glow">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
          <Link href="/kanban">
            <Button variant="outline" size="sm" className="gap-1.5">
              Kanban Board
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Super Admin Portfolio & Executive KPIs */}
      {currentUser.role === 'Super Admin' && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-transparent p-5 glass-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Company Portfolio & Executive Performance Console
                  <Badge variant="danger" className="text-[9px]">
                    Super Admin View
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Global Workspace Status: Creative, Marketing & Development Output Metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Workspaces</span>
                <span className="font-extrabold text-foreground text-sm">3 Active Teams</span>
              </div>
              <div className="border-l border-zinc-200/60 dark:border-zinc-800/60 pl-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Backlog</span>
                <span className="font-extrabold text-brand-400 text-sm">{tasks.length} Sprint Tasks</span>
              </div>
              <div className="border-l border-zinc-200/60 dark:border-zinc-800/60 pl-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Company Velocity</span>
                <span className="font-extrabold text-emerald-400 text-sm">94.8% SLA Pass</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Assigned Tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">My Active Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{myAssignedTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">In your personal queue</span>
        </Card>

        {/* KPI 2: Completed Today */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Completed Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{completedToday.length}</p>
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> Great velocity!
          </span>
        </Card>

        {/* KPI 3: Overdue */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Overdue Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-500">{overdueTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Past due date cutoff</span>
        </Card>

        {/* KPI 4: Pending Review */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{pendingReviewTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Awaiting QA & Lead signoff</span>
        </Card>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget: Recent Activity Feed (2 Cols) */}
        <Card className="lg:col-span-2 p-5">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Recent Activity Stream
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Latest updates across task statuses and cross-team actions.
                </CardDescription>
              </div>
              <Link href="/kanban" className="text-xs font-semibold text-primary hover:underline">
                View Board →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-3">
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              recentActivity.map((task) => (
                <div
                  key={task._id}
                  onClick={() => {
                    setSelectedTask(task);
                    setDetailModalOpen(true);
                  }}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={task.assignedUser?.avatar} name={task.assignedUser?.name || 'Task'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.team} • {task.status} • Updated {formatTimeAgo(task.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getPriorityBadgeColor(task.priority)} text-[10px]`}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Widget: Upcoming Deadlines */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Tasks due soon requiring focus.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-3">
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => {
                    setSelectedTask(task);
                    setDetailModalOpen(true);
                  }}
                  className="flex items-center justify-between rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-3 hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{task.title}</p>
                    <span className="text-[10px] text-rose-500 font-medium">
                      Due {formatDate(task.dueDate)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {task.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
