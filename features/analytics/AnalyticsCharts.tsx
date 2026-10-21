'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchAnalyticsAction } from '@/actions/analyticsActions';
import { TeamName } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';

export function AnalyticsCharts() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  const [selectedTeam, setSelectedTeam] = useState<TeamName | 'All'>('All');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnalyticsAction(selectedTeam === 'All' ? undefined : selectedTeam, activeCompanyScope).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [selectedTeam, activeCompanyScope]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { summary, statusData, priorityData, teamProductivity, monthlyTrend } = data;

  return (
    <div className="space-y-6">
      {/* Team Selector Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Bizy Hub Analytics & Insights</h2>
            <p className="text-xs text-muted-foreground">Real-time team productivity metrics and completion trends.</p>
          </div>
        </div>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value as TeamName | 'All')}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-1.5 text-xs font-semibold focus-ring"
        >
          <option value="All">All Workspace Teams</option>
          <option value="Creative">Creative Team</option>
          <option value="Marketing">Marketing Team</option>
          <option value="Development">Development Team</option>
        </select>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Workspace Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{summary.totalTasks}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {summary.totalTasks === 0 ? 'No tasks logged' : `${summary.totalTasks} tasks in workspace`}
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{summary.completedTasks}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {Math.round((summary.completedTasks / (summary.totalTasks || 1)) * 100)}% completion rate
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Avg Completion Time</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{summary.avgCompletionHours}h</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {summary.completedTasks === 0 ? 'No completed tasks yet' : `Across ${summary.completedTasks} completed tasks`}
          </span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-500">{summary.overdueTasks}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Requires lead attention</span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tasks by Status */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-bold">Tasks by Status</CardTitle>
            <CardDescription className="text-xs">Current task distribution across workflow states.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Priority Distribution */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-bold">Priority Breakdown</CardTitle>
            <CardDescription className="text-xs">Task volume filtered by priority level.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {priorityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend formatter={(value) => <span className="text-xs font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Team Productivity Comparison */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-bold">Team Performance & Output</CardTitle>
            <CardDescription className="text-xs">Compare total vs completed output across teams.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamProductivity}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="team" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend formatter={(value) => <span className="text-xs font-medium">{value}</span>} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="incoming" name="Incoming Queue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Monthly Completion Trend */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-bold">Monthly Velocity Trend</CardTitle>
            <CardDescription className="text-xs">Growth trajectory of completed vs created tasks.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Legend formatter={(value) => <span className="text-xs font-medium">{value}</span>} />
                <Line type="monotone" dataKey="completed" name="Completed Tasks" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="created" name="Created Tasks" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
