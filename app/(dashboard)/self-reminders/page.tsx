'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  SelfReminder,
  SelfReminderRepeat,
  fetchSelfReminders,
  createSelfReminder,
  updateSelfReminder,
  deleteSelfReminder,
  getDayOfWeekFromDate,
  formatTime12Hour,
  to24HourTime,
} from '@/lib/self-reminders-store';
import { Card } from '@/components/ui/Card';
import { playNotificationChime } from '@/lib/audio-chime';

function playAlertSound() {
  playNotificationChime('self_reminder');
}
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  BellRing,
  Calendar as CalendarIcon,
  Clock,
  Repeat,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  Volume2,
  Check,
  RotateCcw,
  Search,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';

const ALL_WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SelfRemindersPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [reminders, setReminders] = useState<SelfReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Form State
  const todayIso = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [reminderDate, setReminderDate] = useState(todayIso);
  const [dayName, setDayName] = useState(() => getDayOfWeekFromDate(todayIso));
  const [reminderTime, setReminderTime] = useState('09:30');
  const [repeatType, setRepeatType] = useState<SelfReminderRepeat>('Daily');
  const [selectedCustomDays, setSelectedCustomDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Once' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom Days' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SelfReminder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDay, setEditDay] = useState('Monday');
  const [editTime, setEditTime] = useState('09:30');
  const [editRepeat, setEditRepeat] = useState<SelfReminderRepeat>('Daily');
  const [editCustomDays, setEditCustomDays] = useState<string[]>([]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    const data = await fetchSelfReminders(currentUser._id, currentUser.email, currentUser.name);
    setReminders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('ambizcon_self_reminders_updated', handleSync);
    return () => window.removeEventListener('ambizcon_self_reminders_updated', handleSync);
  }, [currentUser?.email]);

  // Live Clock Watcher to Trigger Audio, Notification Bell & Right-Side Alert Pop-up
  useEffect(() => {
    if (!currentUser || reminders.length === 0) return;

    const checkDueReminders = () => {
      const now = new Date();
      const nowTime24 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toLocaleDateString('en-CA');

      reminders.forEach((rem) => {
        if (!rem) return;
        const rem24 = to24HourTime(rem.reminder_time);

        if (rem.is_completed) {
          const doneKey = `self_rem_done_notified_${rem.id}`;
          if (!localStorage.getItem(doneKey)) {
            localStorage.setItem(doneKey, '1');
            useNotificationStore.getState().addNotification({
              id: `notif_self_done_${rem.id}`,
              type: 'task_completed',
              category: 'Self Reminder Completed',
              title: `✅ Self Reminder Completed: ${rem.title}`,
              text: `"${rem.title}" (${rem.day_name} • ${rem.reminder_time}) is marked as Completed.`,
              color: 'bg-emerald-500',
              link: '/self-reminders',
            });
          }
          return;
        }

        if (!rem.is_active) return;

        // Trigger if reminder time matches or has already passed today
        if (rem24 <= nowTime24) {
          const firedKey = `self_rem_fired_${rem.id}_${todayKey}_${rem24}`;
          if (!localStorage.getItem(firedKey)) {
            localStorage.setItem(firedKey, '1');
            try {
              playAlertSound();
            } catch (e) {}
            useNotificationStore.getState().addNotification({
              id: `notif_self_due_${rem.id}_${todayKey}`,
              type: 'due_date_reminder',
              category: 'Self Reminder Alert',
              title: `🔔 Self Reminder: ${rem.title}`,
              text: `${rem.note ? `${rem.note} — ` : ''}Scheduled for ${rem.day_name} at ${rem.reminder_time} (${rem.repeat_type}).`,
              color: 'bg-amber-500',
              link: '/self-reminders',
            });
          }
        }
      });
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 15000);
    return () => clearInterval(interval);
  }, [reminders, currentUser]);

  const filteredReminders = useMemo(() => {
    return (reminders || []).filter((r) => {
      if (!r) return false;
      if (activeFilter === 'Active' && r.is_completed) return false;
      if (activeFilter === 'Completed' && !r.is_completed) return false;
      if (activeFilter === 'Once' && r.repeat_type !== 'Once') return false;
      if (activeFilter === 'Daily' && r.repeat_type !== 'Daily' && r.repeat_type !== 'Weekdays (Mon–Fri)') return false;
      if (activeFilter === 'Weekly' && r.repeat_type !== 'Weekly') return false;
      if (activeFilter === 'Monthly' && r.repeat_type !== 'Monthly' && r.repeat_type !== 'Yearly') return false;
      if (activeFilter === 'Custom Days' && r.repeat_type !== 'Custom Days') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (r.title || '').toLowerCase().includes(q) ||
          (r.note || '').toLowerCase().includes(q) ||
          (r.day_name || '').toLowerCase().includes(q) ||
          (r.repeat_type || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reminders, activeFilter, searchQuery]);

  if (!currentUser) return null;

  const handleDateChange = (newDate: string) => {
    setReminderDate(newDate);
    if (newDate) {
      setDayName(getDayOfWeekFromDate(newDate));
    }
  };

  const handleRepeatTypeChange = (newRepeat: SelfReminderRepeat) => {
    setRepeatType(newRepeat);
    if (newRepeat === 'Daily') {
      setDayName('Every Day');
    } else if (newRepeat === 'Weekdays (Mon–Fri)') {
      setDayName('Monday – Friday');
    } else {
      setDayName(getDayOfWeekFromDate(reminderDate));
    }
  };

  const toggleCustomDay = (d: string, isEdit = false) => {
    if (isEdit) {
      setEditCustomDays((prev) =>
        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
      );
    } else {
      setSelectedCustomDays((prev) =>
        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
      );
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }

    setIsSaving(true);
    const effectiveDay =
      repeatType === 'Custom Days'
        ? selectedCustomDays.join(', ') || dayName
        : repeatType === 'Daily'
        ? 'Every Day'
        : repeatType === 'Weekdays (Mon–Fri)'
        ? 'Monday – Friday'
        : dayName;

    const created = await createSelfReminder({
      user_id: currentUser._id,
      user_email: currentUser.email,
      user_name: currentUser.name,
      title: title.trim(),
      note: note.trim(),
      reminder_date: reminderDate || todayIso,
      day_name: effectiveDay,
      reminder_time: formatTime12Hour(reminderTime),
      repeat_type: repeatType,
      custom_days: repeatType === 'Custom Days' ? selectedCustomDays.join(', ') : effectiveDay,
      is_completed: false,
      is_active: true,
    });

    useNotificationStore.getState().addNotification({
      id: `notif_self_created_${created.id}`,
      type: 'due_date_reminder',
      category: 'Self Reminder Scheduled',
      title: `🔔 Self Reminder Scheduled: ${created.title}`,
      text: `Scheduled for ${effectiveDay} at ${formatTime12Hour(reminderTime)} (${repeatType}).`,
      color: 'bg-amber-500',
      link: '/self-reminders',
    });

    setTitle('');
    setNote('');
    setIsSaving(false);
    toast.success('Self Reminder saved!', {
      description: `Scheduled for ${effectiveDay} at ${formatTime12Hour(reminderTime)} (${repeatType})`,
    });
    await loadData();
  };

  const handleToggleComplete = async (item: SelfReminder) => {
    const nextCompleted = !item.is_completed;
    await updateSelfReminder(item.id, currentUser.email, {
      is_completed: nextCompleted,
    });
    if (nextCompleted) {
      localStorage.setItem(`self_rem_done_notified_${item.id}`, '1');
      useNotificationStore.getState().addNotification({
        id: `notif_self_done_${item.id}_${Date.now()}`,
        type: 'task_completed',
        category: 'Self Reminder Completed',
        title: `✅ Self Reminder Completed`,
        text: `You marked "${item.title}" (${item.day_name} • ${item.reminder_time}) as Completed!`,
        color: 'bg-emerald-500',
        link: '/self-reminders',
      });
    }
    toast.success(
      nextCompleted ? `Marked "${item.title}" as Done!` : `Re-activated "${item.title}"`
    );
    await loadData();
  };

  const handleDelete = async (item: SelfReminder) => {
    await deleteSelfReminder(item.id, currentUser.email);
    toast.success(`Deleted reminder "${item.title}"`);
    await loadData();
  };

  const handleTestSound = (item: SelfReminder) => {
    try {
      playAlertSound();
    } catch (e) {}
    useNotificationStore.getState().addNotification({
      id: `notif_self_test_${item.id}_${Date.now()}`,
      type: 'due_date_reminder',
      category: 'Self Reminder Alert',
      title: `🔔 Reminder Alert: ${item.title}`,
      text: `${item.note ? `${item.note} — ` : ''}${item.day_name} • ${item.reminder_time} (${item.repeat_type})`,
      color: 'bg-amber-500',
      link: '/self-reminders',
    });
    toast.success(`🔔 Alert Preview: ${item.title}`, {
      description: `Date: ${item.reminder_date} • Day: ${item.day_name} • Time: ${item.reminder_time} • Repeat: ${item.repeat_type}`,
    });
  };

  const handleOpenEdit = (item: SelfReminder) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditNote(item.note || '');
    setEditDate(item.reminder_date);
    setEditDay(item.day_name);
    setEditTime(to24HourTime(item.reminder_time));
    setEditRepeat(item.repeat_type);
    setEditCustomDays(
      item.custom_days
        ? item.custom_days.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Mon', 'Wed', 'Fri']
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;

    const effectiveDay =
      editRepeat === 'Custom Days'
        ? editCustomDays.join(', ') || editDay
        : editRepeat === 'Daily'
        ? 'Every Day'
        : editRepeat === 'Weekdays (Mon–Fri)'
        ? 'Monday – Friday'
        : editDay;

    await updateSelfReminder(editingItem.id, currentUser.email, {
      title: editTitle.trim(),
      note: editNote.trim(),
      reminder_date: editDate,
      day_name: effectiveDay,
      reminder_time: formatTime12Hour(editTime),
      repeat_type: editRepeat,
      custom_days: editRepeat === 'Custom Days' ? editCustomDays.join(', ') : effectiveDay,
    });

    toast.success('Self Reminder updated!');
    setEditingItem(null);
    await loadData();
  };

  const activeCount = reminders.filter((r) => !r.is_completed).length;
  const completedCount = reminders.filter((r) => r.is_completed).length;
  const recurringCount = reminders.filter((r) => r.repeat_type !== 'Once' && !r.is_completed).length;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            <BellRing className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Self Reminders (Simple Personal Reminders)
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                PERSONAL • SUPABASE SYNCED
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set simple personal reminders with Date, Day, Time, and how repetitive it should be (Once, Daily, Weekly, Monthly, or Custom Days).
            </p>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
              Active
            </span>
            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl border border-brand-500/30 bg-brand-500/10 text-center">
            <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400 block">
              Repetitive
            </span>
            <span className="text-base font-extrabold font-mono text-brand-600 dark:text-brand-400">
              {recurringCount}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-center">
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              Done
            </span>
            <span className="text-base font-extrabold font-mono text-foreground">
              {completedCount}
            </span>
          </div>
        </div>
      </div>

      {/* SIMPLE SELF REMINDER CREATION CARD */}
      <Card className="p-6 border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-card shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
              + Create Simple Self Reminder
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Pick Date, Day, Time & How Repetitive
          </span>
        </div>

        <form onSubmit={handleAddReminder} className="space-y-4">
          {/* Row 1: Reminder Title & Optional Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground">
                What do you want to be reminded about? *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call client, Submit report, Team meeting, Take break..."
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-2.5 text-sm font-medium focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">
                Short Note / Details (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Share updated invoice PDF on WhatsApp / Email"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3.5 py-2.5 text-sm focus-ring"
              />
            </div>
          </div>

          {/* Row 2: 1. DATE & DAY (2 in 1), 2. TIME, 3. HOW REPETITIVE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. DATE & DAY (Combined 2-in-1 Div) */}
            <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-emerald-500" />
                  1. Date &amp; Day
                </label>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ⚡ Auto Day
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">Pick Date</span>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-2 text-xs font-mono font-bold focus-ring"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">Day of Week</span>
                  <select
                    value={dayName}
                    onChange={(e) => setDayName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-2 text-xs font-bold focus-ring"
                  >
                    <option value="Every Day">Every Day (Mon – Sun)</option>
                    <option value="Monday – Friday">Weekdays (Mon – Fri)</option>
                    {ALL_WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. TIME */}
            <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                2. Time
              </label>
              <div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-mono font-bold focus-ring"
                  required
                />
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {[
                    { label: '9:30 AM', val: '09:30' },
                    { label: '11:00 AM', val: '11:00' },
                    { label: '2:00 PM', val: '14:00' },
                    { label: '5:00 PM', val: '17:00' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setReminderTime(preset.val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        reminderTime === preset.val
                          ? 'bg-amber-500 text-white'
                          : 'bg-zinc-200/70 dark:bg-zinc-800 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. HOW REPETITIVE */}
            <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Repeat className="h-3.5 w-3.5 text-purple-500" />
                3. How Repetitive?
              </label>
              <div className="space-y-1.5">
                <select
                  value={repeatType}
                  onChange={(e) => handleRepeatTypeChange(e.target.value as SelfReminderRepeat)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-bold focus-ring"
                >
                  <option value="Once">One-Time Only (Once)</option>
                  <option value="Daily">Daily (Every Day)</option>
                  <option value="Weekdays (Mon–Fri)">Every Weekday (Mon–Fri)</option>
                  <option value="Weekly">Weekly (Every {getDayOfWeekFromDate(reminderDate)})</option>
                  <option value="Monthly">Monthly (Every Month on this Date)</option>
                  <option value="Yearly">Yearly (Annually on this Date)</option>
                  <option value="Custom Days">Custom Days (Pick Days)</option>
                </select>
                <div className="text-[10px] text-muted-foreground font-medium">
                  {repeatType === 'Once' && 'Fires once on the chosen date.'}
                  {repeatType === 'Daily' && 'Fires every day at the chosen time.'}
                  {repeatType === 'Weekdays (Mon–Fri)' && 'Fires Monday through Friday.'}
                  {repeatType === 'Weekly' && `Fires every ${getDayOfWeekFromDate(reminderDate)}.`}
                  {repeatType === 'Monthly' && `Fires each month on day ${reminderDate.split('-')[2] || 'chosen date'}.`}
                  {repeatType === 'Yearly' && 'Fires once a year on this exact date.'}
                  {repeatType === 'Custom Days' && 'Fires on your selected days below.'}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Days Picker when "Custom Days" is selected */}
          {repeatType === 'Custom Days' && (
            <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                Select which days of the week this reminder should repeat:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SHORT_DAYS.map((d) => {
                  const active = selectedCustomDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleCustomDay(d, false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-muted-foreground'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Summary & Save Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="font-semibold text-foreground">Schedule Preview:</span>
              <Badge variant="outline" className="font-mono text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                📅 {formatDisplayDate(reminderDate)}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] border-blue-500/30 text-blue-600 dark:text-blue-400">
                📆 {repeatType === 'Custom Days' ? selectedCustomDays.join(', ') : dayName}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] border-amber-500/30 text-amber-600 dark:text-amber-400">
                ⏰ {formatTime12Hour(reminderTime)}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] border-purple-500/30 text-purple-600 dark:text-purple-400">
                🔁 {repeatType}
              </Badge>
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="ambizcon-gradient text-white font-extrabold px-6 py-2.5 rounded-xl shadow-glow gap-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Saving Reminder...' : 'Add Self Reminder'}
            </Button>
          </div>
        </form>
      </Card>

      {/* FILTER BAR & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          {(
            [
              { key: 'All', label: `All (${reminders.length})` },
              { key: 'Active', label: `Active (${activeCount})` },
              { key: 'Once', label: 'One-Time' },
              { key: 'Daily', label: 'Daily / Weekdays' },
              { key: 'Weekly', label: 'Weekly' },
              { key: 'Monthly', label: 'Monthly / Yearly' },
              { key: 'Custom Days', label: 'Custom Days' },
              { key: 'Completed', label: `Done (${completedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your reminders..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background py-1.5 pl-8 pr-3 text-xs focus-ring"
          />
        </div>
      </div>

      {/* REMINDERS LIST */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <Card className="p-12 text-center border border-dashed border-zinc-300 dark:border-zinc-800">
            <BellRing className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-foreground">No self reminders found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Use the simple form above to create a personal reminder with your preferred Date, Day, Time, and Repeat schedule.
            </p>
          </Card>
        ) : (
          filteredReminders.map((item) => (
            <Card
              key={item.id}
              className={`p-4 sm:p-5 border transition-all ${
                item.is_completed
                  ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-70'
                  : 'border-zinc-200/90 dark:border-zinc-800/90 bg-card hover:border-emerald-500/40 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Check Button + Title + Badges */}
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      item.is_completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-transparent'
                    }`}
                    title={item.is_completed ? 'Mark as Active' : 'Mark as Done'}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-extrabold ${
                          item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {item.is_completed ? (
                        <Badge className="bg-zinc-200 dark:bg-zinc-800 text-muted-foreground text-[10px]">
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                          Active Alert
                        </Badge>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    )}

                    {/* Date, Day, Time, and How Repetitive Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] font-mono font-bold text-foreground">
                        <CalendarIcon className="h-3 w-3 text-emerald-500" />
                        Date: {formatDisplayDate(item.reminder_date)}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <CalendarDays className="h-3 w-3" />
                        Day: {item.day_name}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-[11px] font-mono font-extrabold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="h-3 w-3" />
                        Time: {item.reminder_time}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-[11px] font-extrabold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Repeat className="h-3 w-3" />
                        Repeat: {item.repeat_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestSound(item)}
                    className="gap-1 text-xs h-8 px-2.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    title="Test Alert Sound & Notification"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    Test Alert
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleComplete(item)}
                    className="gap-1 text-xs h-8 px-2.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {item.is_completed ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Undo
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Done
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    title="Edit Reminder"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="h-8 px-2 text-rose-500 hover:bg-rose-500/10"
                    title="Delete Reminder"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* EDIT SELF REMINDER MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Self Reminder"
        description="Update Date, Day, Time, or How Repetitive this reminder is."
        maxWidth="md"
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Reminder Title *</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Note (Optional)</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              />
            </div>

            {/* 1. Date & Day (Combined 2-in-1 Div) */}
            <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-emerald-500" />
                  1. Date &amp; Day *
                </label>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ⚡ Auto Day
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5">Date</span>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => {
                      const newD = e.target.value;
                      setEditDate(newD);
                      if (newD) {
                        setEditDay(getDayOfWeekFromDate(newD));
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-0.5">Day of Week</span>
                  <select
                    value={editDay}
                    onChange={(e) => setEditDay(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                  >
                    <option value="Every Day">Every Day (Mon – Sun)</option>
                    <option value="Monday – Friday">Weekdays (Mon – Fri)</option>
                    {ALL_WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">2. Time *</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">3. How Repetitive?</label>
                <select
                  value={editRepeat}
                  onChange={(e) => setEditRepeat(e.target.value as SelfReminderRepeat)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                >
                  <option value="Once">One-Time Only (Once)</option>
                  <option value="Daily">Daily (Every Day)</option>
                  <option value="Weekdays (Mon–Fri)">Every Weekday (Mon–Fri)</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Custom Days">Custom Days</option>
                </select>
              </div>
            </div>

            {editRepeat === 'Custom Days' && (
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <span className="text-xs font-bold text-foreground block">Repeat on Days:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SHORT_DAYS.map((d) => {
                    const active = editCustomDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleCustomDay(d, true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          active
                            ? 'bg-purple-600 text-white'
                            : 'bg-background border border-zinc-200 dark:border-zinc-800 text-muted-foreground'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
