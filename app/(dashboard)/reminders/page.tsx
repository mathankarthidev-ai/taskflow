'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Task, ReminderSettings } from '@/types';
import { fetchTasksAction } from '@/actions/taskActions';
import { TaskDetailModal } from '@/features/tasks/TaskDetailModal';
import { ReminderCreateModal } from '@/components/tasks/ReminderCreateModal';
import { getPriorityBadgeColor, getStatusBadgeColor } from '@/lib/utils';
import {
  fetchSelfReminders,
  getCachedActiveSelfReminderCount,
} from '@/lib/self-reminders-store';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  Repeat,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  User as UserIcon,
  Search,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Check,
  Zap,
  Sliders,
  ChevronDown,
  CalendarRange,
  ArrowRight,
  Layers,
  Sparkles,
  Edit3,
  Lock,
  Download,
} from 'lucide-react';
import { exportToCSV, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { isTaskInCompany } from '@/lib/company-filter';

const ITEMS_PER_PAGE = 4;

type FrequencyTab = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Customized' | 'All';

interface TaskWithReminder {
  task: Task;
  reminder: ReminderSettings;
}

export default function RemindersPage() {
  const { tasks, setTasks, setSelectedTask, setDetailModalOpen } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedReminders, setDismissedReminders] = useState<Record<string, boolean>>({});
  const [editingReminderTask, setEditingReminderTask] = useState<Task | null>(null);
  const [selfReminderCount, setSelfReminderCount] = useState<number>(0);

  useEffect(() => {
    if (!currentUser) return;
    const refreshCount = () => {
      setSelfReminderCount(getCachedActiveSelfReminderCount(currentUser.email));
      fetchSelfReminders(currentUser._id, currentUser.email, currentUser.name)
        .then((list) => {
          if (Array.isArray(list)) {
            setSelfReminderCount(list.filter((r) => !r.is_completed && r.is_active).length);
          }
        })
        .catch(() => {});
    };

    refreshCount();
    window.addEventListener('ambizcon_self_reminders_updated', refreshCount);
    return () => {
      window.removeEventListener('ambizcon_self_reminders_updated', refreshCount);
    };
  }, [currentUser?.email, currentUser?._id, currentUser?.name]);

  // Active Frequency View: Default is Daily Reminders as requested
  const [activeFrequency, setActiveFrequency] = useState<FrequencyTab>('Daily');

  // Pagination states for each section
  const [pageDaily, setPageDaily] = useState(1);
  const [pageWeekly, setPageWeekly] = useState(1);
  const [pageMonthly, setPageMonthly] = useState(1);
  const [pageYearly, setPageYearly] = useState(1);
  const [pageCustom, setPageCustom] = useState(1);

  // Month selector for Monthly Flow (Default: October 2026)
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  // Dedicated Reminder Create Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderDefaults, setReminderDefaults] = useState<{
    frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';
    dayName?: string;
    slotTime?: string;
    weekName?: string;
    dateStr?: string;
  }>({});

  const handleOpenReminderModal = (options?: {
    frequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';
    dayName?: string;
    slotTime?: string;
    weekName?: string;
    dateStr?: string;
  }) => {
    const freq =
      options?.frequency ||
      (activeFrequency === 'Customized'
        ? 'Custom'
        : activeFrequency === 'All'
        ? 'Daily'
        : (activeFrequency as any));
    setReminderDefaults({
      frequency: freq,
      dayName: options?.dayName || 'Monday',
      slotTime: options?.slotTime || '09:30 AM',
      weekName: options?.weekName || 'Week 1',
      dateStr: options?.dateStr || '',
    });
    setIsReminderModalOpen(true);
  };

  useEffect(() => {
    fetchTasksAction().then((res) => {
      setTasks(res || []);
      setLoading(false);
    });
  }, [setTasks]);

  const tasksWithReminders: TaskWithReminder[] = useMemo(() => {
    return (tasks || [])
      .filter((t) => t?.reminderSettings && t.reminderSettings.enabled)
      .map((t) => ({
        task: t,
        reminder: t.reminderSettings!,
      }));
  }, [tasks]);

  // Filter out dismissed tasks, branch scope, and search term
  const activeList = useMemo(() => {
    return tasksWithReminders.filter(({ task }) => {
      if (!task) return false;
      if (!isTaskInCompany(task, activeCompanyScope)) return false;
      if (dismissedReminders[task._id]) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (task.title || '').toLowerCase().includes(q);
        const clientMatch = (task.clientName || '').toLowerCase().includes(q);
        const teamMatch = (task.team || '').toLowerCase().includes(q);
        return titleMatch || clientMatch || teamMatch;
      }
      return true;
    });
  }, [tasksWithReminders, dismissedReminders, searchQuery, activeCompanyScope]);

  // Group items by Frequency
  const dailyTasks = useMemo(
    () => activeList.filter(({ reminder }) => reminder.frequency === 'Daily'),
    [activeList]
  );
  const weeklyTasks = useMemo(
    () => activeList.filter(({ reminder }) => reminder.frequency === 'Weekly'),
    [activeList]
  );
  const monthlyTasks = useMemo(
    () => activeList.filter(({ reminder }) => reminder.frequency === 'Monthly'),
    [activeList]
  );
  const yearlyTasks = useMemo(
    () => activeList.filter(({ reminder }) => reminder.frequency === 'Yearly'),
    [activeList]
  );
  const customTasks = useMemo(
    () => activeList.filter(({ reminder }) => reminder.frequency === 'Custom'),
    [activeList]
  );

  const handleDismiss = (taskId: string, title: string) => {
    setDismissedReminders((prev) => ({ ...prev, [taskId]: true }));
    useNotificationStore.getState().addNotification({
      type: 'system',
      category: 'Due Reminder Completed',
      title: `✅ Reminder Completed: ${title}`,
      text: `${currentUser?.name || 'User'} marked reminder "${title}" as Completed.`,
      color: 'bg-emerald-500',
      link: '/reminders',
      taskId,
      senderName: currentUser?.name,
      senderRole: currentUser?.role,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
    });
    toast.success(`Marked reminder for "${title}" as completed!`, {
      description: 'Notification dismissed from your active schedule.',
    });
  };

  const handleSnooze = (taskId: string, title: string) => {
    useNotificationStore.getState().addNotification({
      type: 'system',
      category: 'Reminder Snoozed',
      title: `⏰ Reminder Snoozed: ${title}`,
      text: `Reminder "${title}" snoozed by 24 hours (until tomorrow at 10:00 AM).`,
      color: 'bg-amber-500',
      link: '/reminders',
      taskId,
      senderName: currentUser?.name,
      senderRole: currentUser?.role,
      targetRoles: ['Super Admin', 'Admin', 'Team Lead', 'Team Member'],
    });
    toast.info(`Snoozed reminder for "${title}" by 24 hours.`, {
      description: 'Alert rescheduled to tomorrow at 10:00 AM.',
    });
  };

  const isTeamLeadOrAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Team Lead';

  // ==========================================
  // 1. WEEKLY REMINDER FLOW BUILDER (Mon - Sun)
  // ==========================================
  const weeklyDaysConfig = [
    { dayName: 'Monday', taskCount: 3 },
    { dayName: 'Tuesday', taskCount: 2 },
    { dayName: 'Wednesday', taskCount: 3 },
    { dayName: 'Thursday', taskCount: 2 },
    { dayName: 'Friday', taskCount: 3 },
    { dayName: 'Saturday', taskCount: 1 },
    { dayName: 'Sunday', taskCount: 1 },
  ];

  const weeklyScheduleGrouped = useMemo(() => {
    let taskPointer = 0;
    const pool = weeklyTasks.length > 0 ? weeklyTasks : activeList;

    return weeklyDaysConfig.map((day) => {
      const dayTasks: { tag: string; item: TaskWithReminder; time: string }[] = [];
      const times = ['09:30 AM', '02:00 PM', '05:30 PM'];

      for (let i = 0; i < day.taskCount; i++) {
        if (pool.length > 0) {
          const item = pool[taskPointer % pool.length];
          dayTasks.push({
            tag: `T${i + 1}`,
            item,
            time: times[i % times.length],
          });
          taskPointer++;
        }
      }

      return {
        dayName: day.dayName,
        tasks: dayTasks,
      };
    });
  }, [weeklyTasks, activeList]);

  // ==========================================
  // 2. MONTHLY REMINDER FLOW BUILDER (Weeks 1 - 5)
  // ==========================================
  const monthlyWeeksConfig = [
    {
      weekName: 'Week 1',
      dateRange: '01/10/2026 – 04/10/2026',
      days: [
        { dayName: 'Thursday', dateStr: '01/10/2026', time: '09:30 AM' },
        { dayName: 'Friday', dateStr: '02/10/2026', time: '11:00 AM' },
        { dayName: 'Saturday', dateStr: '03/10/2026', time: '02:00 PM' },
        { dayName: 'Sunday', dateStr: '04/10/2026', time: '04:30 PM' },
      ],
    },
    {
      weekName: 'Week 2',
      dateRange: '05/10/2026 – 11/10/2026',
      days: [
        { dayName: 'Monday', dateStr: '05/10/2026', time: '09:30 AM' },
        { dayName: 'Tuesday', dateStr: '06/10/2026', time: '11:15 AM' },
        { dayName: 'Wednesday', dateStr: '07/10/2026', time: '01:45 PM' },
        { dayName: 'Thursday', dateStr: '08/10/2026', time: '03:30 PM' },
        { dayName: 'Friday', dateStr: '09/10/2026', time: '05:00 PM' },
        { dayName: 'Saturday', dateStr: '10/10/2026', time: '10:00 AM' },
        { dayName: 'Sunday', dateStr: '11/10/2026', time: '11:30 AM' },
      ],
    },
    {
      weekName: 'Week 3',
      dateRange: '12/10/2026 – 18/10/2026',
      days: [
        { dayName: 'Monday', dateStr: '12/10/2026', time: '09:30 AM' },
        { dayName: 'Tuesday', dateStr: '13/10/2026', time: '11:30 AM' },
        { dayName: 'Wednesday', dateStr: '14/10/2026', time: '02:15 PM' },
        { dayName: 'Thursday', dateStr: '15/10/2026', time: '03:45 PM' },
        { dayName: 'Friday', dateStr: '16/10/2026', time: '05:15 PM' },
        { dayName: 'Saturday', dateStr: '17/10/2026', time: '10:30 AM' },
        { dayName: 'Sunday', dateStr: '18/10/2026', time: '12:00 PM' },
      ],
    },
    {
      weekName: 'Week 4',
      dateRange: '19/10/2026 – 25/10/2026',
      days: [
        { dayName: 'Monday', dateStr: '19/10/2026', time: '09:30 AM' },
        { dayName: 'Tuesday', dateStr: '20/10/2026', time: '11:00 AM' },
        { dayName: 'Wednesday', dateStr: '21/10/2026', time: '01:30 PM' },
        { dayName: 'Thursday', dateStr: '22/10/2026', time: '03:00 PM' },
        { dayName: 'Friday', dateStr: '23/10/2026', time: '04:30 PM' },
        { dayName: 'Saturday', dateStr: '24/10/2026', time: '11:00 AM' },
        { dayName: 'Sunday', dateStr: '25/10/2026', time: '01:00 PM' },
      ],
    },
    {
      weekName: 'Week 5',
      dateRange: '26/10/2026 – 31/10/2026',
      days: [
        { dayName: 'Monday', dateStr: '26/10/2026', time: '09:30 AM' },
        { dayName: 'Tuesday', dateStr: '27/10/2026', time: '11:30 AM' },
        { dayName: 'Wednesday', dateStr: '28/10/2026', time: '02:00 PM' },
        { dayName: 'Thursday', dateStr: '29/10/2026', time: '03:30 PM' },
        { dayName: 'Friday', dateStr: '30/10/2026', time: '05:00 PM' },
        { dayName: 'Saturday', dateStr: '31/10/2026', time: '10:00 AM' },
      ],
    },
  ];

  const monthlyScheduleGrouped = useMemo(() => {
    let taskIdx = 0;
    const pool = monthlyTasks.length > 0 ? monthlyTasks : activeList;

    return monthlyWeeksConfig.map((w, wIndex) => {
      const weekItems = w.days.map((d, dIndex) => {
        const item = pool.length > 0 ? pool[taskIdx % pool.length] : null;
        taskIdx++;
        return {
          code: `W${wIndex + 1} – T${dIndex + 1}`,
          dayName: d.dayName,
          dateStr: d.dateStr,
          time: d.time,
          item,
        };
      });

      return {
        weekName: w.weekName,
        dateRange: w.dateRange,
        items: weekItems,
      };
    });
  }, [monthlyTasks, activeList]);

  // Standard line-item renderer for individual paginated tasks
  const renderTaskLineItem = ({ task, reminder }: TaskWithReminder, tagPrefix?: string) => {
    const canEdit = canEditTaskOrReminder(task, currentUser);
    const creatorName = getTaskCreatorName(task);

    return (
      <div
        key={task._id + (tagPrefix || '')}
        onClick={() => {
          setSelectedTask(task);
          setDetailModalOpen(true);
        }}
        className="py-3 px-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 mb-1"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-brand-500/20 group-hover:scale-105 transition-transform">
            <Bell className="h-4 w-4" />
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {tagPrefix ? (
                <span className="font-mono text-[10px] font-black text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-md">
                  {tagPrefix}
                </span>
              ) : (
                <span className="font-mono text-[10px] font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  T-10{task._id.slice(-2)}
                </span>
              )}
              <Badge className={getPriorityBadgeColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge className={getStatusBadgeColor(task.status)}>
                {task.status}
              </Badge>
              <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {task.title}
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {task.clientName && (
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-brand-500" />
                  {task.clientName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Due: {task.dueDate ? task.dueDate.split('T')[0] : '2026-10-15'}
              </span>
              {task.assignedUser && (
                <span className="flex items-center gap-1 text-foreground font-medium">
                  <Avatar src={task.assignedUser.avatar} name={task.assignedUser.name} className="h-4 w-4" />
                  {task.assignedUser.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between md:justify-end shrink-0 border-t md:border-t-0 border-zinc-200/60 dark:border-zinc-800/60 pt-2 md:pt-0">
          <div className="text-left md:text-right">
            <div className="flex items-center gap-1.5 md:justify-end">
              <span className="text-xs font-bold text-foreground">{reminder.frequency} Alert</span>
              {reminder.remindBeforeDays && (
                <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {reminder.remindBeforeDays}d before
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 md:justify-end">
              <Clock className="h-3 w-3 text-brand-500" />
              Remind at {reminder.reminderTime}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (canEdit) {
                  setEditingReminderTask(task);
                } else {
                  toast.error('Permission Restricted', {
                    description: `Only Admin or the creator (${creatorName}) can edit this reminder.`,
                  });
                }
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                canEdit
                  ? 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-muted-foreground'
              }`}
              title={canEdit ? 'Edit reminder' : `Created by ${creatorName} (Admin or creator only)`}
            >
              {canEdit ? <Edit3 className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3 text-amber-500" />}
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSnooze(task._id, task.title);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground transition-colors"
            >
              Snooze 1d
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss(task._id, task.title);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Mark Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Generic Paginated Container
  const renderPaginatedSection = (
    title: string,
    subtitle: string,
    badgeColor: string,
    items: TaskWithReminder[],
    currentPage: number,
    setPage: React.Dispatch<React.SetStateAction<number>>,
    tagPrefixBase?: string
  ) => {
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
      <div className="bg-card border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${badgeColor}`} />
            <h3 className="text-sm font-extrabold text-foreground tracking-tight">{title}</h3>
            <Badge className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold border border-zinc-200 dark:border-zinc-700">
              {items.length} Alerts
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-xs text-muted-foreground">
            No active {title.toLowerCase()} reminders scheduled.
          </div>
        ) : (
          <div className="space-y-1">
            {paginatedItems.map((item, idx) =>
              renderTaskLineItem(
                item,
                tagPrefixBase ? `${tagPrefixBase}${startIndex + idx + 1}` : undefined
              )
            )}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <span className="text-muted-foreground">
            Showing <strong className="text-foreground">{items.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong className="text-foreground">{Math.min(startIndex + ITEMS_PER_PAGE, items.length)}</strong> of{' '}
            <strong className="text-foreground">{items.length}</strong> tasks
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={validPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-xs font-bold text-foreground px-2">
              Page {validPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={validPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-xl"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const handleExportRemindersCSV = () => {
    if (!activeList || activeList.length === 0) {
      toast.error('No active reminders available to export');
      return;
    }
    const exportRows = activeList.map(({ task, reminder }) => ({
      'Task ID': task._id,
      'Title': task.title,
      'Frequency': reminder.frequency || 'None',
      'Scheduled Time': reminder.reminderTime || '—',
      'Due Date': formatDate(task.dueDate),
      'Status': task.status,
      'Priority': task.priority,
      'Team': task.team,
      'Client': task.clientName || '—',
      'Doctor': task.doctorName || '—',
      'Assignee': task.assignedUser?.name || task.assignedTo || 'Unassigned',
      'Created Date': formatDate(task.createdAt),
    }));

    exportToCSV(`BizyHub_Reminders_Schedule_${activeCompanyScope.replace(/[^a-zA-Z0-9]/g, '_')}`, exportRows);
    toast.success(`Reminders (${exportRows.length} items) exported to CSV!`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Switcher: Reminders vs Self Reminders */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3 flex-wrap">
        <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 gap-1.5 shadow-xs">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-zinc-800 text-foreground shadow-sm border border-zinc-200/80 dark:border-zinc-700"
          >
            <BellRing className="h-3.5 w-3.5 text-brand-500" />
            <span>Scheduled &amp; Team Reminders</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-mono font-bold">
              {activeList.length}
            </span>
          </button>

          <Link
            href="/self-reminders"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
            title="Switch to Personal Self Reminders Page"
          >
            <Clock className="h-3.5 w-3.5 text-purple-500" />
            <span>Personal Self Reminders</span>
            {selfReminderCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono font-bold">
                {selfReminderCount} Active
              </span>
            )}
          </Link>
        </div>

        <Link
          href="/self-reminders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
        >
          <span>Open My Self Reminders</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 shadow-sm border border-brand-500/20">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Reminders &amp; Recurrence
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage automated in-app alerts, renewal notifications, and recurring task schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Quick Jump to Self Reminders Page Button */}
          <Link href="/self-reminders">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs rounded-xl border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 shadow-xs"
              title="Open Personal Self Reminders Page"
            >
              <Clock className="h-4 w-4 text-purple-500" />
              <span>Self Reminders</span>
              {selfReminderCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-purple-500 text-white font-mono text-[9px] font-extrabold flex items-center justify-center">
                  {selfReminderCount}
                </span>
              )}
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportRemindersCSV}
            className="gap-1.5 font-bold text-xs rounded-xl border-zinc-200 dark:border-zinc-800"
            title="Download full reminders schedule to CSV"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Export Reminders CSV
          </Button>

          {isTeamLeadOrAdmin ? (
            <Button
              onClick={() => handleOpenReminderModal()}
              className="ambizcon-gradient text-white gap-2 font-bold shadow-glow text-xs sm:text-sm rounded-xl"
            >
              <Plus className="h-4 w-4" />
              Create Reminder Task
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold px-3 py-1.5 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                View-Only Mode (TL &amp; Admin Created)
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Top Banner Card: Clickable Self Reminder Quick Link */}
      <Link
        href="/self-reminders"
        className="group block rounded-2xl border-2 border-purple-500/30 dark:border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-brand-500/5 to-pink-500/10 p-3.5 sm:p-4 transition-all hover:border-purple-500/60 hover:shadow-md cursor-pointer"
        title="Click to open Personal Self Reminders"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 group-hover:scale-105 transition-transform shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  ⏰ Personal Self Reminders
                </h3>
                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[9px] sm:text-[10px] font-bold">
                  Personal &amp; Sound Alarm
                </Badge>
                {selfReminderCount > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] sm:text-[10px] font-mono font-bold">
                    {selfReminderCount} Active
                  </Badge>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                Need personal alerts? Click here to manage your private daily routines, custom day reminders, and sound alarms.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 shrink-0 group-hover:translate-x-1 transition-transform">
            <span className="hidden sm:inline">Go to Self Reminders</span>
            <span className="sm:hidden">Open</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>

      {/* DUE NOTIFICATIONS SCHEDULE: 5 Interactive Frequency Cards */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 sm:p-6 space-y-4 shadow-sm glass-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-500 animate-pulse" />
            <h2 className="text-xs font-black text-foreground uppercase tracking-wider">
              DUE NOTIFICATIONS SCHEDULE
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Click any schedule to switch views •
            </span>
            <button
              type="button"
              onClick={() => setActiveFrequency('All')}
              className={`text-xs font-extrabold px-2.5 py-1 rounded-xl transition-all ${
                activeFrequency === 'All'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              Show All Stacked
            </button>
          </div>
        </div>

        {/* 5 Interactive Clickable Cards: Daily, Weekly, Monthly, Yearly, Customized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Daily Card */}
          <div
            onClick={() => setActiveFrequency('Daily')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
              activeFrequency === 'Daily'
                ? 'border-sky-500 bg-sky-500/20 ring-2 ring-sky-500/50 shadow-md scale-[1.02]'
                : 'border-sky-500/30 bg-sky-500/10 hover:border-sky-500/60 hover:bg-sky-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-sky-700 dark:text-sky-300 uppercase tracking-wider block text-[10px]">
                Daily Tasks
              </span>
              {activeFrequency === 'Daily' && (
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-foreground">{dailyTasks.length} Alerts</p>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Every 24h triggers</span>
            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-sky-600 dark:text-sky-400">
              <span>{activeFrequency === 'Daily' ? '● Active View' : 'Click to open →'}</span>
            </div>
          </div>

          {/* 2. Weekly Card */}
          <div
            onClick={() => setActiveFrequency('Weekly')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
              activeFrequency === 'Weekly'
                ? 'border-teal-500 bg-teal-500/20 ring-2 ring-teal-500/50 shadow-md scale-[1.02]'
                : 'border-teal-500/30 bg-teal-500/10 hover:border-teal-500/60 hover:bg-teal-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider block text-[10px]">
                Weekly Tasks
              </span>
              {activeFrequency === 'Weekly' && (
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-foreground">{weeklyTasks.length} Alerts</p>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Every 7 days triggers</span>
            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-teal-600 dark:text-teal-400">
              <span>{activeFrequency === 'Weekly' ? '● Active View' : 'Click to open →'}</span>
            </div>
          </div>

          {/* 3. Monthly Card */}
          <div
            onClick={() => setActiveFrequency('Monthly')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
              activeFrequency === 'Monthly'
                ? 'border-indigo-500 bg-indigo-500/20 ring-2 ring-indigo-500/50 shadow-md scale-[1.02]'
                : 'border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-500/60 hover:bg-indigo-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block text-[10px]">
                Monthly Tasks
              </span>
              {activeFrequency === 'Monthly' && (
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-foreground">{monthlyTasks.length} Alerts</p>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Monthly retainer audits</span>
            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              <span>{activeFrequency === 'Monthly' ? '● Active View' : 'Click to open →'}</span>
            </div>
          </div>

          {/* 4. Yearly Card */}
          <div
            onClick={() => setActiveFrequency('Yearly')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
              activeFrequency === 'Yearly'
                ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/50 shadow-md scale-[1.02]'
                : 'border-purple-500/30 bg-purple-500/10 hover:border-purple-500/60 hover:bg-purple-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider block text-[10px]">
                Yearly Tasks
              </span>
              {activeFrequency === 'Yearly' && (
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-foreground">{yearlyTasks.length} Alerts</p>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Annual renewals &amp; signoffs</span>
            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-purple-600 dark:text-purple-400">
              <span>{activeFrequency === 'Yearly' ? '● Active View' : 'Click to open →'}</span>
            </div>
          </div>

          {/* 5. Customized Card */}
          <div
            onClick={() => setActiveFrequency('Customized')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
              activeFrequency === 'Customized'
                ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50 shadow-md scale-[1.02]'
                : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60 hover:bg-amber-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider block text-[10px]">
                Customized Tasks
              </span>
              {activeFrequency === 'Customized' && (
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-xl font-black text-foreground">{customTasks.length} Alerts</p>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Pre-expiry custom alert</span>
            <div className="pt-2 flex items-center justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <span>{activeFrequency === 'Customized' ? '● Active View' : 'Click to open →'}</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks across all frequencies by title, client, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FREQUENCY CONTENT VIEWS: DYNAMIC RENDERING BASED ON CLICKED CARD          */}
      {/* ========================================================================= */}

      {/* VIEW 1: DAILY REMINDERS (DEFAULT) */}
      {(activeFrequency === 'Daily' || activeFrequency === 'All') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-500" />
              <h3 className="text-base font-extrabold text-foreground">
                Daily Notifications &amp; Tasks (Default 24h Reminders)
              </h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Every 24h Trigger
            </Badge>
          </div>

          {renderPaginatedSection(
            'Daily Automated Schedule',
            'Triggered every 24 hours at standard shift kickoff',
            'bg-sky-500',
            dailyTasks,
            pageDaily,
            setPageDaily,
            'D-'
          )}
        </div>
      )}

      {/* VIEW 2: WEEKLY REMINDER FLOW (MONDAY - SUNDAY HIERARCHY) */}
      {(activeFrequency === 'Weekly' || activeFrequency === 'All') && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-teal-500" />
                <h3 className="text-base font-extrabold text-foreground">
                  Weekly Reminder Flow (Monday – Sunday Breakdown)
                </h3>
                <Badge className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 text-[10px] font-bold">
                  Day → Task Flow
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organized task schedule by day of week with designated priority tokens (T1, T2, T3).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-xl self-start sm:self-auto">
              Weekly 7-Day Cycle
            </span>
          </div>

          {/* Monday through Sunday Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weeklyScheduleGrouped.map((dayGroup) => (
              <div
                key={dayGroup.dayName}
                className="bg-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-4 shadow-sm flex flex-col justify-between glass-card"
              >
                <div>
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-teal-500" />
                      <h4 className="font-extrabold text-sm text-foreground">{dayGroup.dayName}</h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {dayGroup.tasks.length} {dayGroup.tasks.length === 1 ? 'Task' : 'Tasks'}
                    </Badge>
                  </div>

                  {/* Tasks under this Day */}
                  <div className="space-y-2">
                    {dayGroup.tasks.length === 0 ? (
                      <div
                        onClick={() =>
                          handleOpenReminderModal({
                            frequency: 'Weekly',
                            dayName: dayGroup.dayName,
                            slotTime: '09:30 AM',
                          })
                        }
                        className="text-center py-6 px-3 border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-teal-500/50 hover:bg-teal-500/5 rounded-2xl cursor-pointer transition-all group"
                      >
                        <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                          No tasks scheduled for {dayGroup.dayName}
                        </p>
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-1 inline-flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Click to Schedule Task
                        </span>
                      </div>
                    ) : (
                      dayGroup.tasks.map(({ tag, item, time }) => (
                        <div
                          key={tag + item.task._id}
                          onClick={() => {
                            setSelectedTask(item.task);
                            setDetailModalOpen(true);
                          }}
                          className="p-3 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-black font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded-md">
                              {tag} – Task / Reminder
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 text-brand-500" />
                              {time}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                            {item.task.title}
                          </h5>

                          <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-zinc-200/40 dark:border-zinc-800/40 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Badge className={`${getPriorityBadgeColor(item.task.priority)} text-[9px] py-0 px-1.5`}>
                                {item.task.priority}
                              </Badge>
                              {item.task.clientName && (
                                <span className="truncate max-w-[90px] font-semibold text-foreground">
                                  {item.task.clientName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-brand-500 group-hover:translate-x-0.5 transition-transform flex items-center">
                              Open →
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-200/40 dark:border-zinc-800/40 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Recurring alert active</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">✓ Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY REMINDER FLOW (WEEK -> TASK -> DAY -> DATE HIERARCHY) */}
      {(activeFrequency === 'Monthly' || activeFrequency === 'All') && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <h3 className="text-base font-extrabold text-foreground">
                  Monthly Reminder Flow
                </h3>
                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold">
                  Monthly → Week → Task → Day → Date → Time
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full chronological retainer audits structured by calendar weeks and days.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-muted-foreground">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 text-xs focus-ring"
              >
                <option value="October 2026">October 2026 (Active)</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>
            </div>
          </div>

          {/* Stacked Weeks 1 through 5 Accordion / Flow */}
          <div className="space-y-4">
            {monthlyScheduleGrouped.map((weekBlock) => (
              <div
                key={weekBlock.weekName}
                className="bg-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3 glass-card"
              >
                {/* Week Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <CalendarRange className="h-4 w-4 text-indigo-500" />
                    <h4 className="font-extrabold text-sm text-foreground">
                      {weekBlock.weekName}
                    </h4>
                    <span className="text-xs font-mono text-muted-foreground">
                      ({weekBlock.dateRange})
                    </span>
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold self-start sm:self-auto">
                    {weekBlock.items.length} Reminders Scheduled
                  </Badge>
                </div>

                {/* Week Table / Line Hierarchy: W1 – T1 – Day – Date – Time */}
                <div className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                  {weekBlock.items.map((row) => (
                    <div
                      key={row.code}
                      onClick={() => {
                        if (row.item?.task) {
                          setSelectedTask(row.item.task);
                          setDetailModalOpen(true);
                        } else {
                          handleOpenReminderModal({
                            frequency: 'Monthly',
                            weekName: weekBlock.weekName,
                            dayName: row.dayName,
                            dateStr: row.dateStr,
                            slotTime: row.time,
                          });
                        }
                      }}
                      className="py-2.5 px-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      {/* Left: Code, Day, Date, Time hierarchy */}
                      <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                        {/* W1 – T1 Badge */}
                        <span className="font-mono text-[11px] font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg shrink-0">
                          {row.code}
                        </span>

                        {/* Day of Week */}
                        <span className="text-xs font-bold text-foreground min-w-[75px]">
                          {row.dayName}
                        </span>

                        {/* Date */}
                        <span className="text-xs font-mono text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md shrink-0">
                          {row.dateStr}
                        </span>

                        {/* Time */}
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {row.time}
                        </span>

                        {/* Task Title */}
                        <h5 className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-1 min-w-[150px]">
                          {row.item?.task.title || `Scheduled Retainer Slot (${row.dayName})`}
                        </h5>
                      </div>

                      {/* Right: Client & Actions */}
                      <div className="flex items-center gap-2 justify-between md:justify-end shrink-0 text-xs">
                        {row.item?.task.clientName && (
                          <span className="text-[11px] font-semibold text-muted-foreground hidden lg:inline">
                            🏢 {row.item.task.clientName}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          {row.item?.task ? 'Details' : '+ Schedule'} <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: YEARLY NOTIFICATIONS & RENEWALS */}
      {(activeFrequency === 'Yearly' || activeFrequency === 'All') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <h3 className="text-base font-extrabold text-foreground">
                Yearly Notifications &amp; Renewal Schedules
              </h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Annual 365d Triggers
            </Badge>
          </div>

          {renderPaginatedSection(
            'Annual Client Contracts & Audits',
            'Contract renewals, license audits, and domain registration cycles',
            'bg-purple-500',
            yearlyTasks,
            pageYearly,
            setPageYearly,
            'Y-'
          )}
        </div>
      )}

      {/* VIEW 5: CUSTOMIZED PRE-EXPIRY ALERTS */}
      {(activeFrequency === 'Customized' || activeFrequency === 'All') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <h3 className="text-base font-extrabold text-foreground">
                Customized Notifications &amp; Pre-Expiry Alerts
              </h3>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Custom Lead Time Warnings
            </Badge>
          </div>

          {renderPaginatedSection(
            'Custom Pre-Expiry Triggers',
            'Targeted lead-time alarms (7d, 14d, 30d, 60d prior to due date)',
            'bg-amber-500',
            customTasks,
            pageCustom,
            setPageCustom,
            'C-'
          )}
        </div>
      )}

      {/* Modals for Dedicated Reminder Creation & Task Edit */}
      <ReminderCreateModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        defaultFrequency={reminderDefaults.frequency}
        defaultDay={reminderDefaults.dayName}
        defaultTime={reminderDefaults.slotTime}
        defaultWeek={reminderDefaults.weekName}
        defaultDate={reminderDefaults.dateStr}
      />
      <TaskEditModal
        task={editingReminderTask}
        isOpen={Boolean(editingReminderTask)}
        onClose={() => setEditingReminderTask(null)}
      />
    </div>
  );
}
