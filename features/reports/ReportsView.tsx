'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchTasksAction } from '@/actions/taskActions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { exportToCSV, getPriorityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  UserCheck,
  Users,
  Building2,
  Lock,
  ShieldCheck,
  TrendingUp,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

export function ReportsView() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [reportType, setReportType] = useState<'my' | 'team' | 'company'>('team');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      const res = await fetchTasksAction();
      setTasks(res);
      setLoading(false);
    }
    loadTasks();
  }, []);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isTeamLead = currentUser.role === 'Team Lead';

  // Strict Filter Tasks based on Report Type & Role Scoping
  const filteredTasks = tasks.filter((t) => {
    // 1. Report Type Filter
    if (reportType === 'my') {
      if (t.assignedTo !== currentUser._id && t.createdBy !== currentUser._id) return false;
    } else if (reportType === 'team') {
      // Members & Leads only see their own team's tasks
      if (t.team !== currentUser.team) return false;
    } else if (reportType === 'company') {
      // Company Report is restricted to Super Admin
      if (!isSuperAdmin) return false;
    }

    // 2. Date Range Filter
    const taskDate = new Date(t.createdAt).getTime();
    const now = Date.now();
    if (dateRange === 'today') {
      if (now - taskDate > 86400000) return false;
    } else if (dateRange === 'week') {
      if (now - taskDate > 86400000 * 7) return false;
    } else if (dateRange === 'month') {
      if (now - taskDate > 86400000 * 30) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    if (reportType === 'company' && !isSuperAdmin) {
      toast.error('Access Denied: Only Super Admin can download Company Reports.');
      return;
    }

    if (filteredTasks.length === 0) {
      toast.error('No tasks available to export');
      return;
    }

    const exportRows = filteredTasks.map((t) => ({
      'Task ID': t._id,
      'Title': t.title,
      'Status': t.status,
      'Priority': t.priority,
      'Team': t.team,
      'Assignee': t.assignedUser?.name || 'Unassigned',
      'Created By': t.createdByUser?.name || 'User',
      'Due Date': formatDate(t.dueDate),
      'Created Date': formatDate(t.createdAt),
      'Incoming Request': t.incoming ? 'Yes' : 'No',
    }));

    exportToCSV(`TaskFlow_${reportType.toUpperCase()}_Report`, exportRows);
    toast.success(`${reportType.toUpperCase()} Report exported to CSV!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">TaskFlow Reports Center</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role-scoped performance reports and metric downloads.
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportCSV} size="sm" className="gap-1.5 shadow-glow">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Super Admin Special Executive KPI Card */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-5 glass-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Super Admin Executive Portfolio & Global KPIs
                  <Badge variant="danger" className="text-[9px]">
                    Super Admin Only
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Global workspace profile: 3 Active Teams • 7 Members • 30+ Total Sprint Tasks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Company Completion
                </span>
                <span className="font-extrabold text-emerald-500 text-sm">88.4%</span>
              </div>
              <div className="text-right border-l border-zinc-200/60 dark:border-zinc-800/60 pl-4">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Sprint Velocity
                </span>
                <span className="font-extrabold text-blue-500 text-sm">4.2x Speed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-card">
        {/* Report Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 text-xs max-w-full">
          <button
            onClick={() => setReportType('my')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              reportType === 'my'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            My Report
          </button>

          <button
            onClick={() => setReportType('team')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              reportType === 'team'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Team Report ({currentUser.team})
          </button>

          {/* Company Report Tab - Only Visible to Super Admin */}
          {isSuperAdmin ? (
            <button
              onClick={() => setReportType('company')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                reportType === 'company'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-amber-500" />
              Company Report
              <Badge variant="danger" className="text-[9px] py-0 px-1">
                Admin
              </Badge>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground/40 text-xs opacity-60 cursor-not-allowed"
              title="Only Super Admin can access Company Report"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Company Report (Super Admin Only)</span>
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Time Horizon:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-medium focus-ring"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No matching task records found for this report scope.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{t.title}</td>
                      <td className="px-4 py-3 font-medium">{t.team}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(t.status)}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getPriorityBadgeColor(t.priority)}>{t.priority}</Badge>
                      </td>
                      <td className="px-4 py-3">{t.assignedUser?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(t.dueDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
