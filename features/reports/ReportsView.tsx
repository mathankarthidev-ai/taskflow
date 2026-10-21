'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchTasksAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
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
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isTaskInCompany, isUserInCompany } from '@/lib/company-filter';
import { CompletedPeriod } from '@/lib/completed-tasks-generator';

export function ReportsView() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [reportType, setReportType] = useState<'my' | 'team' | 'company'>('team');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [statusScope, setStatusScope] = useState<'completed_only' | 'all'>('completed_only');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(30);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [taskRes, userRes] = await Promise.all([
        fetchTasksAction(),
        fetchAllUsersAction(),
      ]);
      setTasks(taskRes || []);
      setUsers(userRes || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  const scopedUsers = useMemo(
    () =>
      (users || []).filter(
        (u) =>
          u &&
          isUserInCompany(u, activeCompanyScope) &&
          (reportType === 'company' || isSuperAdmin || u.team === currentUser?.team)
      ),
    [users, activeCompanyScope, reportType, isSuperAdmin, currentUser?.team]
  );

  const completedPeriod: CompletedPeriod =
    dateRange === 'today'
      ? 'daily'
      : dateRange === 'week'
      ? 'weekly'
      : dateRange === 'month'
      ? 'monthly'
      : 'yearly';

  const combinedTasks = useMemo(() => {
    if (statusScope === 'completed_only') {
      return (tasks || []).filter((t) => t && t.status === 'Done');
    }
    return tasks || [];
  }, [tasks, statusScope]);

  // Strict Filter Tasks based on Company Branch, Report Type, Member, Role & Date Scoping
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = monday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const monthPrefix = todayStr.slice(0, 7);

    return combinedTasks.filter((t) => {
      if (!isTaskInCompany(t, activeCompanyScope, users)) return false;

      // 1. Report Type Filter
      if (reportType === 'my') {
        if (t.assignedTo !== currentUser?._id && t.createdBy !== currentUser?._id) return false;
      } else if (reportType === 'team') {
        if (!isSuperAdmin && t.team !== currentUser?.team) return false;
      } else if (reportType === 'company') {
        if (!isSuperAdmin) return false;
      }

      // 2. Member Filter
      if (selectedMemberId !== 'all') {
        if (t.assignedTo !== selectedMemberId && t.createdBy !== selectedMemberId) return false;
      }

      // 3. Date Range Filter
      const taskDate = (t.updatedAt || t.createdAt || t.dueDate || '').slice(0, 10);
      if (dateRange === 'today') {
        if (taskDate !== todayStr) return false;
      } else if (dateRange === 'week') {
        if (taskDate < mondayStr) return false;
      } else if (dateRange === 'month') {
        if (!taskDate.startsWith(monthPrefix)) return false;
      }

      return true;
    });
  }, [combinedTasks, activeCompanyScope, users, reportType, currentUser, isSuperAdmin, selectedMemberId, dateRange]);

  const realPeriodCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const mondayStr = monday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const monthPrefix = todayStr.slice(0, 7);

    const doneTasks = (tasks || []).filter((t) => {
      if (!t || t.status !== 'Done') return false;
      if (!isTaskInCompany(t, activeCompanyScope, users)) return false;
      if (reportType === 'my') {
        if (t.assignedTo !== currentUser?._id && t.createdBy !== currentUser?._id) return false;
      } else if (reportType === 'team') {
        if (!isSuperAdmin && t.team !== currentUser?.team) return false;
      }
      if (selectedMemberId !== 'all') {
        if (t.assignedTo !== selectedMemberId && t.createdBy !== selectedMemberId) return false;
      }
      return true;
    });

    const todayCount = doneTasks.filter((t) => {
      const d = (t.updatedAt || t.createdAt || t.dueDate || '').slice(0, 10);
      return d === todayStr;
    }).length;

    const weekCount = doneTasks.filter((t) => {
      const d = (t.updatedAt || t.createdAt || t.dueDate || '').slice(0, 10);
      return d >= mondayStr;
    }).length;

    const monthCount = doneTasks.filter((t) => {
      const d = (t.updatedAt || t.createdAt || t.dueDate || '').slice(0, 10);
      return d.startsWith(monthPrefix);
    }).length;

    const allCount = doneTasks.length;

    return { today: todayCount, week: weekCount, month: monthCount, all: allCount };
  }, [tasks, activeCompanyScope, users, reportType, currentUser, isSuperAdmin, selectedMemberId]);

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
      'Client': t.clientName || '—',
      'Doctor': t.doctorName || '—',
      'Due / Completed Date': formatDate(t.dueDate),
      'Created Date': formatDate(t.createdAt),
    }));

    exportToCSV(`BizyHub_${reportType.toUpperCase()}_${completedPeriod.toUpperCase()}_Report`, exportRows);
    toast.success(`${reportType.toUpperCase()} (${completedPeriod.toUpperCase()}) Report exported to CSV!`);
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Bizy Hub Reports Center</h1>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold">
                {filteredTasks.length} Records
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time task completion audit and performance export.
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV ({filteredTasks.length})
          </Button>
          <Button onClick={handleExportCSV} size="sm" className="gap-1.5 shadow-glow">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Completed Tasks View Options Quick Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            {
              range: 'today',
              title: 'Daily Completed',
              accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            },
            {
              range: 'week',
              title: 'Weekly Completed',
              accent: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
            },
            {
              range: 'month',
              title: 'Monthly Completed',
              accent: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400',
            },
            {
              range: 'all',
              title: 'Yearly Completed',
              accent: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
            },
          ] as const
        ).map((card) => {
          const isActive = dateRange === card.range;
          const count = realPeriodCounts[card.range];
          return (
            <button
              key={card.range}
              type="button"
              onClick={() => {
                setDateRange(card.range);
                setVisibleLimit(30);
              }}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 bg-card hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  {card.title}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold font-mono ${card.accent}`}>
                  {count} {count === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black text-foreground">
                  {count}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {count === 0 ? 'No completed tasks' : 'Real database records'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-card">
        {/* Report Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 text-xs max-w-full">
          <button
            onClick={() => {
              setReportType('my');
              setSelectedMemberId(currentUser?._id || 'all');
              setVisibleLimit(30);
            }}
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
            onClick={() => {
              setReportType('team');
              setSelectedMemberId('all');
              setVisibleLimit(30);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
              reportType === 'team'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Team Report ({currentUser?.team || 'General'})
          </button>

          {/* Company Report Tab - Only Visible to Super Admin */}
          {isSuperAdmin ? (
            <button
              onClick={() => {
                setReportType('company');
                setSelectedMemberId('all');
                setVisibleLimit(30);
              }}
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

        {/* Member Selector & Time Horizon Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value);
              setVisibleLimit(30);
            }}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold focus-ring"
          >
            <option value="all">All Scoped Members ({scopedUsers.length})</option>
            {scopedUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.team})
              </option>
            ))}
          </select>

          <select
            value={statusScope}
            onChange={(e) => {
              setStatusScope(e.target.value as any);
              setVisibleLimit(30);
            }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-1.5 text-xs font-semibold focus-ring"
          >
            <option value="completed_only">✅ Completed Tasks Only</option>
            <option value="all">📋 All Statuses (Active + Completed)</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as any);
              setVisibleLimit(30);
            }}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-1.5 text-xs font-bold focus-ring"
          >
            <option value="today">Daily View (Today)</option>
            <option value="week">Weekly View (This Week)</option>
            <option value="month">Monthly View (This Month)</option>
            <option value="all">Yearly / All-Time View</option>
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
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Client / Doctor</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Completed / Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No matching task records found for this report scope.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.slice(0, visibleLimit).map((t, idx) => (
                    <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{t.title}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{t.clientName || 'Ambizcon'}</div>
                        {t.doctorName && (
                          <div className="text-[10px] text-muted-foreground">{t.doctorName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{t.team}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(t.status)}>
                          {t.status === 'Done' ? 'Completed' : t.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getPriorityBadgeColor(t.priority)}>{t.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">{t.assignedUser?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {formatDate(t.dueDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredTasks.length > visibleLimit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="text-xs text-muted-foreground">
                Showing <strong>{visibleLimit}</strong> of <strong>{filteredTasks.length}</strong> records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleLimit((prev) => prev + 35)}
                  className="text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                >
                  Load +35 More ({filteredTasks.length - visibleLimit} left)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleLimit(filteredTasks.length)}
                  className="text-xs"
                >
                  Show All ({filteredTasks.length})
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

