'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, User } from '@/types';
import { CompletedPeriod } from '@/lib/completed-tasks-generator';
import { fetchTasksAction } from '@/actions/taskActions';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, getPriorityBadgeColor } from '@/lib/utils';
import {
  CheckCircle2,
  X,
  Search,
  Users,
} from 'lucide-react';

interface CompletedTasksExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  tasks?: Task[];
  initialMemberId?: string;
  initialPeriod?: CompletedPeriod;
  onSelectTask?: (task: Task) => void;
}

const PERIOD_OPTIONS: {
  id: CompletedPeriod;
  label: string;
  sublabel: string;
  badgeColor: string;
}[] = [
  {
    id: 'daily',
    label: 'Daily Completed',
    sublabel: 'Completed Today',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'weekly',
    label: 'Weekly Completed',
    sublabel: 'Completed This Week',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'monthly',
    label: 'Monthly Completed',
    sublabel: 'Completed This Month',
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'yearly',
    label: 'Yearly Completed',
    sublabel: 'Annual Completed Archive',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
];

export function CompletedTasksExplorerModal({
  isOpen,
  onClose,
  users,
  tasks: propTasks,
  initialMemberId = 'all',
  initialPeriod = 'daily',
}: CompletedTasksExplorerModalProps) {
  const [period, setPeriod] = useState<CompletedPeriod>(initialPeriod);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId);
  const [search, setSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(25);
  const [loadedTasks, setLoadedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPeriod(initialPeriod);
      setSelectedMemberId(initialMemberId);
      setVisibleLimit(25);
      if (!propTasks || propTasks.length === 0) {
        fetchTasksAction().then((t) => setLoadedTasks(t || []));
      }
    }
  }, [isOpen, initialPeriod, initialMemberId, propTasks]);

  const allTasks = (propTasks && propTasks.length > 0) ? propTasks : loadedTasks;

  const selectedMember = useMemo(
    () => users.find((u) => u._id === selectedMemberId) || null,
    [users, selectedMemberId]
  );

  const getFilteredTasksForPeriod = useMemo(() => {
    return (pId: CompletedPeriod, mId: string) => {
      const doneTasks = (allTasks || []).filter((t) => t.status === 'Done');
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const mondayStr = monday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

      const monthPrefix = todayStr.slice(0, 7);
      const yearPrefix = todayStr.slice(0, 4);

      return doneTasks.filter((t) => {
        if (mId !== 'all') {
          if (t.assignedTo !== mId && t.createdBy !== mId) return false;
        }

        const taskDate = (t.updatedAt || t.createdAt || t.dueDate || '').slice(0, 10);
        if (pId === 'daily') return taskDate === todayStr;
        if (pId === 'weekly') return taskDate >= mondayStr;
        if (pId === 'monthly') return taskDate.startsWith(monthPrefix);
        if (pId === 'yearly') return taskDate.startsWith(yearPrefix);
        return true;
      });
    };
  }, [allTasks]);

  const completedTasks = useMemo(() => {
    if (!isOpen) return [];
    const base = getFilteredTasksForPeriod(period, selectedMemberId);

    if (!search.trim()) return base;
    const q = search.toLowerCase().trim();
    return base.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.doctorName || '').toLowerCase().includes(q) ||
        (t.assignedUser?.name || '').toLowerCase().includes(q) ||
        t.team.toLowerCase().includes(q)
    );
  }, [isOpen, getFilteredTasksForPeriod, period, selectedMemberId, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[90vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                  Completed Tasks View Explorer
                </h2>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold">
                  {completedTasks.length} Completed Tasks
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Displaying genuine completed tasks from verified workspace database records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Completed View Option Selector Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-4 pb-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200/60 dark:border-zinc-800/60">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.id;
            const count = getFilteredTasksForPeriod(opt.id, selectedMemberId).length;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setPeriod(opt.id);
                  setVisibleLimit(25);
                }}
                className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-card hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    {opt.label}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold font-mono ${opt.badgeColor}`}
                  >
                    {count} {count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-foreground">{count}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.sublabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Member Selector Pills + Search Filter */}
        <div className="flex flex-col gap-3 px-6 py-3 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Member to Inspect Completed Tasks:
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search completed task, client, doctor..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background pl-8 pr-3 py-1.5 text-xs focus-ring"
              />
            </div>
          </div>

          {/* Horizontal Scrollable Member Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId('all');
                setVisibleLimit(25);
              }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold shrink-0 transition-all ${
                selectedMemberId === 'all'
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>All Members ({users.length})</span>
              <span className="rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] font-mono">
                {getFilteredTasksForPeriod(period, 'all').length} tasks
              </span>
            </button>

            {users.map((member) => {
              const isSelected = selectedMemberId === member._id;
              const memberCount = getFilteredTasksForPeriod(period, member._id).length;
              return (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(member._id);
                    setVisibleLimit(25);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Avatar src={member.avatar} name={member.name} size="sm" />
                  <div className="text-left">
                    <div className="text-xs leading-tight text-foreground font-bold">{member.name}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      {member.team}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  >
                    {memberCount}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Member Summary Banner */}
        {selectedMember && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-emerald-500/5 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <Avatar src={selectedMember.avatar} name={selectedMember.name} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-foreground">{selectedMember.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedMember.role} • {selectedMember.team}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Showing <strong>{completedTasks.length}</strong> completed tasks for{' '}
                  <strong>{PERIOD_OPTIONS.find((p) => p.id === period)?.label}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-bold">
                Daily: {getFilteredTasksForPeriod('daily', selectedMember._id).length}
              </span>
              <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-600 dark:text-blue-400 font-bold">
                Weekly: {getFilteredTasksForPeriod('weekly', selectedMember._id).length}
              </span>
              <span className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-purple-600 dark:text-purple-400 font-bold">
                Monthly: {getFilteredTasksForPeriod('monthly', selectedMember._id).length}
              </span>
              <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-600 dark:text-amber-400 font-bold">
                Yearly: {getFilteredTasksForPeriod('yearly', selectedMember._id).length}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Tasks Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3 w-12">#</th>
                  <th className="py-3 px-3">Completed Task Deliverable</th>
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Client & Doctor</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Completed Date</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {completedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No completed tasks recorded for this selection.
                    </td>
                  </tr>
                ) : (
                  completedTasks.slice(0, visibleLimit).map((task, idx) => (
                    <tr
                      key={task._id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground">{task.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={task.assignedUser?.avatar}
                            name={task.assignedUser?.name || 'Member'}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-foreground">
                              {task.assignedUser?.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{task.team}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{task.clientName || '—'}</div>
                        <div className="text-[10px] text-muted-foreground">{task.doctorName || '—'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`${getPriorityBadgeColor(task.priority)} text-[10px]`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                        {formatDate(task.updatedAt)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {completedTasks.length > visibleLimit && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Showing <strong>{visibleLimit}</strong> of <strong>{completedTasks.length}</strong>{' '}
                completed tasks
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleLimit((prev) => prev + 35)}
                  className="text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                >
                  Load +35 More ({completedTasks.length - visibleLimit} left)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleLimit(completedTasks.length)}
                  className="text-xs"
                >
                  Show All ({completedTasks.length})
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
