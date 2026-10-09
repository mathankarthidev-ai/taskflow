'use client';

import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getPriorityBadgeColor, getStatusBadgeColor } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Check,
  Plus,
  ExternalLink,
  Tag,
  Sparkles,
  Layers,
  CalendarDays,
  User as UserIcon,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskCalendarViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onOpenModal: (task: Task) => void;
  onCreateTaskForDate?: (dateStr: string, title: string) => Promise<void>;
}

type DayFilterTab = 'all' | 'pending' | 'reminders' | 'completed' | 'current' | 'upcoming';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STATUS_SELECT_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'Backlog', value: 'Backlog' },
  { label: 'To Do', value: 'Todo' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Review / Testing', value: 'Review' },
  { label: 'Support', value: 'Support' },
  { label: 'Completed', value: 'Done' },
];

export function TaskCalendarView({
  tasks,
  onStatusChange,
  onOpenModal,
  onCreateTaskForDate,
}: TaskCalendarViewProps) {
  // Current calendar viewing month and year
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());

  // Currently selected date for the detailed day panel (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayStr);

  // Active filter tab in the day detail view
  const [dayFilterTab, setDayFilterTab] = useState<DayFilterTab>('all');

  // Quick add task title for selected date
  const [quickTitle, setQuickTitle] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dayNum: dNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dayNum: dNum,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
      });
    }

    // Next month filler days to complete rows (up to 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let dNum = 1; dNum <= remaining; dNum++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dayNum: dNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Map tasks strictly to their respective dates
  // "mention only for that day in sam edtae"
  const tasksByDateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        all: Task[];
        completed: Task[];
        current: Task[];
        pending: Task[];
        reminders: Task[];
        upcoming: Task[];
      }
    >();

    (tasks || []).forEach((t) => {
      if (!t) return;

      // Extract task date (dueDate is primary deadline, or reminderDate)
      const primaryDate = t.dueDate ? t.dueDate.split('T')[0] : null;
      const reminderDate = t.reminderSettings?.reminderDate
        ? t.reminderSettings.reminderDate.split('T')[0]
        : null;

      // Collect all dates this task specifically belongs to
      const targetDates = new Set<string>();
      if (primaryDate) targetDates.add(primaryDate);
      if (reminderDate) targetDates.add(reminderDate);

      // If no dueDate but created, use createdAt date
      if (targetDates.size === 0 && t.createdAt) {
        targetDates.add(t.createdAt.split('T')[0]);
      }

      targetDates.forEach((dateKey) => {
        if (!map.has(dateKey)) {
          map.set(dateKey, {
            all: [],
            completed: [],
            current: [],
            pending: [],
            reminders: [],
            upcoming: [],
          });
        }
        const bucket = map.get(dateKey)!;

        // Add to all for this specific date
        if (!bucket.all.some((item) => item._id === t._id)) {
          bucket.all.push(t);

          // 1. Completed
          if (t.status === 'Done') {
            bucket.completed.push(t);
          }
          // 2. Current (In Progress)
          else if (t.status === 'In Progress') {
            bucket.current.push(t);
          }
          // 3. Pending (To Do, Backlog, Review, Support)
          else {
            bucket.pending.push(t);
          }

          // 4. Reminders for this date
          const hasReminderOnDate =
            Boolean(t.reminderSettings?.enabled) &&
            (reminderDate === dateKey || (!reminderDate && primaryDate === dateKey));
          if (hasReminderOnDate) {
            bucket.reminders.push(t);
          }

          // 5. Upcoming for this date
          if (dateKey >= todayStr && t.status !== 'Done') {
            bucket.upcoming.push(t);
          }
        }
      });
    });

    return map;
  }, [tasks, todayStr]);

  // Selected Day Items ("mention only for that day in sam edtae")
  const selectedDayData = useMemo(() => {
    return (
      tasksByDateMap.get(selectedDateStr) || {
        all: [],
        completed: [],
        current: [],
        pending: [],
        reminders: [],
        upcoming: [],
      }
    );
  }, [tasksByDateMap, selectedDateStr]);

  // Filtered items based on active sub-tab for the selected day
  const filteredDayItems = useMemo(() => {
    switch (dayFilterTab) {
      case 'pending':
        return selectedDayData.pending;
      case 'reminders':
        return selectedDayData.reminders;
      case 'completed':
        return selectedDayData.completed;
      case 'current':
        return selectedDayData.current;
      case 'upcoming':
        return selectedDayData.upcoming;
      case 'all':
      default:
        return selectedDayData.all;
    }
  }, [selectedDayData, dayFilterTab]);

  // Handle quick task creation for the selected date
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    if (onCreateTaskForDate) {
      setIsCreatingQuick(true);
      await onCreateTaskForDate(selectedDateStr, title);
      setQuickTitle('');
      setIsCreatingQuick(false);
    } else {
      toast.info(`Creating task "${title}" for ${selectedDateStr}`);
    }
  };

  // Formatted date string for selected day header
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Monthly summary metrics across current month
  const monthStats = useMemo(() => {
    let totalPending = 0;
    let totalCurrent = 0;
    let totalCompleted = 0;
    let totalReminders = 0;

    calendarDays.forEach((cd) => {
      if (cd.isCurrentMonth) {
        const d = tasksByDateMap.get(cd.dateStr);
        if (d) {
          totalPending += d.pending.length;
          totalCurrent += d.current.length;
          totalCompleted += d.completed.length;
          totalReminders += d.reminders.length;
        }
      }
    });

    return { totalPending, totalCurrent, totalCompleted, totalReminders };
  }, [calendarDays, tasksByDateMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card: Month Navigator & Monthly Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              {currentMonth === today.getMonth() && currentYear === today.getFullYear() && (
                <Badge variant="outline" className="text-[10px] font-mono bg-brand-500/10 text-brand-600">
                  Current Month
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any date to inspect tasks and reminders belonging strictly to that day.
            </p>
          </div>
        </div>

        {/* Navigation & Jump Today */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Metrics Pills */}
          <div className="hidden lg:flex items-center gap-1.5 mr-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              ⏳ {monthStats.totalPending} Pending
            </span>
            <span className="px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              ⚡ {monthStats.totalCurrent} Current
            </span>
            <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              ✅ {monthStats.totalCompleted} Done
            </span>
            <span className="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              🔔 {monthStats.totalReminders} Reminders
            </span>
          </div>

          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground text-xs font-semibold transition-colors"
          >
            Today
          </button>

          <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background p-0.5 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-foreground font-mono">
              {MONTH_NAMES[currentMonth].substring(0, 3)}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Calendar Grid + Selected Day Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 or 8 Cols): Interactive Month Grid */}
        <div className="xl:col-span-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card overflow-hidden shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-center py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {calendarDays.map((cell) => {
              const dayData = tasksByDateMap.get(cell.dateStr);
              const isSelected = cell.dateStr === selectedDateStr;
              const hasItems = dayData && dayData.all.length > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                    cell.isCurrentMonth
                      ? 'bg-card hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50'
                      : 'bg-zinc-50/40 dark:bg-zinc-950/40 text-muted-foreground/60'
                  } ${
                    isSelected
                      ? 'ring-2 ring-inset ring-brand-500 bg-brand-500/[0.04] dark:bg-brand-500/[0.08]'
                      : ''
                  }`}
                >
                  {/* Top Bar of Day Cell: Day Number + Today Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                        cell.isToday
                          ? 'bg-brand-500 text-white shadow-sm font-extrabold'
                          : isSelected
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                          : cell.isCurrentMonth
                          ? 'text-foreground'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cell.isToday && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Day Content Badges / Chips */}
                  <div className="my-1.5 space-y-1 flex-1">
                    {hasItems ? (
                      <>
                        {/* Compact Counter Chips */}
                        <div className="flex flex-wrap gap-1">
                          {dayData.pending.length > 0 && (
                            <span
                              title={`${dayData.pending.length} Pending Tasks`}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            >
                              ⏳ {dayData.pending.length}
                            </span>
                          )}
                          {dayData.current.length > 0 && (
                            <span
                              title={`${dayData.current.length} In Progress Tasks`}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            >
                              ⚡ {dayData.current.length}
                            </span>
                          )}
                          {dayData.completed.length > 0 && (
                            <span
                              title={`${dayData.completed.length} Completed Tasks`}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            >
                              ✅ {dayData.completed.length}
                            </span>
                          )}
                          {dayData.reminders.length > 0 && (
                            <span
                              title={`${dayData.reminders.length} Reminders for this date`}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5"
                            >
                              <Bell className="h-2.5 w-2.5" />
                              {dayData.reminders.length}
                            </span>
                          )}
                        </div>

                        {/* Top 2 Task Titles preview */}
                        <div className="space-y-0.5 mt-1">
                          {dayData.all.slice(0, 2).map((t) => (
                            <div
                              key={t._id}
                              className="text-[10px] truncate rounded px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-foreground font-medium flex items-center gap-1 border border-zinc-200/50 dark:border-zinc-700/50"
                              title={t.title}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  t.status === 'Done'
                                    ? 'bg-emerald-500'
                                    : t.status === 'In Progress'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span className="truncate">{t.title}</span>
                              {t.reminderSettings?.enabled && (
                                <Bell className="h-2.5 w-2.5 text-indigo-500 shrink-0 ml-auto" />
                              )}
                            </div>
                          ))}
                          {dayData.all.length > 2 && (
                            <span className="text-[9px] text-muted-foreground font-semibold block px-1">
                              +{dayData.all.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-[10px] text-muted-foreground/40 font-mono">—</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom indicator if selected */}
                  {isSelected && (
                    <div className="h-1 w-full bg-brand-500 rounded-full mt-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 or 5 Cols): Dedicated Day Inspector Panel */}
        {/* "mention only for that day in sam edtae" */}
        <div className="xl:col-span-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 space-y-4 shadow-sm sticky top-6">
          {/* Day Inspector Header */}
          <div className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Selected Day Breakdown
              </span>
              <span className="font-mono text-[10px] text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {selectedDateStr}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              {formattedSelectedDate}
            </h3>
            <p className="text-xs text-muted-foreground">
              Showing tasks, pending workload, and active reminders for this date only.
            </p>
          </div>

          {/* Quick Sub-filter Tabs for this Date */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setDayFilterTab('all')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'all'
                  ? 'bg-background text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({selectedDayData.all.length})
            </button>
            <button
              type="button"
              onClick={() => setDayFilterTab('pending')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'pending'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ⏳ Pending ({selectedDayData.pending.length})
            </button>
            <button
              type="button"
              onClick={() => setDayFilterTab('reminders')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'reminders'
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🔔 Reminders ({selectedDayData.reminders.length})
            </button>
            <button
              type="button"
              onClick={() => setDayFilterTab('current')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'current'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚡ Current ({selectedDayData.current.length})
            </button>
            <button
              type="button"
              onClick={() => setDayFilterTab('upcoming')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'upcoming'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📅 Upcoming ({selectedDayData.upcoming.length})
            </button>
            <button
              type="button"
              onClick={() => setDayFilterTab('completed')}
              className={`py-1.5 px-2 rounded-lg font-semibold text-center transition-all ${
                dayFilterTab === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ✅ Done ({selectedDayData.completed.length})
            </button>
          </div>

          {/* Task List for this Specific Date */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredDayItems.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <Clock className="h-8 w-8 mx-auto mb-2 text-zinc-400 opacity-60" />
                <p className="text-xs font-semibold text-foreground">No tasks in this category</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {dayFilterTab === 'all'
                    ? `No tasks or reminders are scheduled for ${selectedDateStr}.`
                    : `No ${dayFilterTab} items found on this day.`}
                </p>
              </div>
            ) : (
              filteredDayItems.map((task) => {
                const isDone = task.status === 'Done';
                const hasReminder = Boolean(task.reminderSettings?.enabled);

                return (
                  <div
                    key={task._id}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      isDone
                        ? 'border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]'
                        : hasReminder
                        ? 'border-indigo-500/30 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04]'
                        : 'border-zinc-200 dark:border-zinc-800 bg-background hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Item Top Row: Priority + Status + Details Link */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${getPriorityBadgeColor(task.priority)}`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${getStatusBadgeColor(task.status)}`}
                        >
                          {task.status}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenModal(task)}
                        title="Open Task Details"
                        className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 font-semibold"
                      >
                        Inspect
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Task Title */}
                    <div
                      onClick={() => onOpenModal(task)}
                      className="cursor-pointer group"
                    >
                      <h4
                        className={`font-semibold text-xs transition-colors ${
                          isDone
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground group-hover:text-brand-500'
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.clientName && (
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                          Client: {task.clientName}
                        </span>
                      )}
                    </div>

                    {/* Reminder Callout if this task has an active reminder for this day */}
                    {hasReminder && (
                      <div className="p-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-semibold">
                            Reminder: {task.reminderSettings?.reminderTime || 'Scheduled'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono opacity-80">
                          {task.reminderSettings?.frequency || 'Daily'}
                        </span>
                      </div>
                    )}

                    {/* Bottom Controls: Assignee + Status Changer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Avatar
                          src={task.assignedUser?.avatar}
                          name={task.assignedUser?.name || 'User'}
                          size="sm"
                        />
                        <span className="truncate max-w-[100px]">
                          {task.assignedUser?.name || 'Unassigned'}
                        </span>
                      </div>

                      {/* Quick Status Select */}
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus-ring"
                      >
                        {STATUS_SELECT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Task for this Specific Date */}
          {onCreateTaskForDate && (
            <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={`+ Add task for ${selectedDateStr}...`}
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreatingQuick || !quickTitle.trim()}
                  className="ambizcon-gradient text-white text-xs px-3 h-8 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
