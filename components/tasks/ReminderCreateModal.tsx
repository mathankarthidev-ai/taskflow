'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Task, TaskPriority, TeamName, User, ReminderSettings } from '@/types';
import { createTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { getStoredClients } from '@/lib/client-db';
import { toast } from 'sonner';
import {
  BellRing,
  Repeat,
  Calendar,
  Clock,
  Building2,
  User as UserIcon,
  ShieldCheck,
  Zap,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  AlertCircle,
  Tag,
  Check,
  Sparkles, Info,
} from 'lucide-react';

interface ReminderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';
  defaultDay?: string;
  defaultTime?: string;
  defaultWeek?: string;
  defaultDate?: string;
  onCreated?: (task: Task) => void;
}

const SUGGESTED_TEMPLATES = [
  {
    title: 'Monthly SEO Retainer Performance Audit',
    team: 'Marketing' as TeamName,
    frequency: 'Monthly' as const,
    checklist: '1. Audit GSC 404 crawl errors\n2. Check Core Web Vitals (LCP/CLS)\n3. Compile rank tracking report\n4. Dispatch client monthly summary',
  },
  {
    title: 'WordPress Core & Security Maintenance Update',
    team: 'Development' as TeamName,
    frequency: 'Weekly' as const,
    checklist: '1. Backup MySQL DB & wp-content\n2. Audit PHP 8.2 & WP 6.7 plugin compatibility\n3. Deploy on staging first\n4. Verify booking forms & webhooks',
  },
  {
    title: 'Clinic Telehealth System & Booking Health Check',
    team: 'Development' as TeamName,
    frequency: 'Daily' as const,
    checklist: '1. Test doctor appointment booking flow\n2. Verify SMS reminder webhook queue\n3. Check payment gateway sandbox logs',
  },
  {
    title: 'Annual Client Retainer SLA & Contract Renewal',
    team: 'Creative' as TeamName,
    frequency: 'Yearly' as const,
    checklist: '1. Review SLA billables and retainer hours\n2. Audit brand guidelines & design system\n3. Schedule annual partner executive review',
  },
  {
    title: 'SSL Certificate & Domain Pre-Expiry Renewal Alert',
    team: 'Development' as TeamName,
    frequency: 'Custom' as const,
    checklist: '1. Check Let\'s Encrypt auto-renewal status\n2. Verify DNS records with Cloudflare\n3. Test HTTPS redirect headers',
  },
];

export function ReminderCreateModal({
  isOpen,
  onClose,
  defaultFrequency = 'Daily',
  defaultDay = 'Monday',
  defaultTime = '09:30 AM',
  defaultWeek = 'Week 1',
  defaultDate = '',
  onCreated,
}: ReminderCreateModalProps) {
  const { setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Frequency Tab State
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom'>(defaultFrequency);

  // Core Form Fields
  const [title, setTitle] = useState('');
  const [checklist, setChecklist] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [team, setTeam] = useState<TeamName>('Development');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [clientName, setClientName] = useState<string>('Apollo Hospitals');

  // Scheduling Details
  const [reminderTime, setReminderTime] = useState<string>(defaultTime);
  const [selectedDay, setSelectedDay] = useState<string>(defaultDay);
  const [slotTag, setSlotTag] = useState<string>('T1');
  const [selectedWeek, setSelectedWeek] = useState<string>(defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');
  const [reminderDate, setReminderDate] = useState<string>(defaultDate || new Date().toISOString().split('T')[0]);
  const [remindBeforeDays, setRemindBeforeDays] = useState<number>(7);

  // Recipient Audience
  const [recipientAudience, setRecipientAudience] = useState<'assigned' | 'team' | 'all_tl' | 'all_teams'>('assigned');

  // Channels
  const [channelToast, setChannelToast] = useState(true);
  const [channelBell, setChannelBell] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);

  // End recurrence
  const [repeatEndsOption, setRepeatEndsOption] = useState<'never' | 'until_date'>('never');
  const [repeatUntilDate, setRepeatUntilDate] = useState<string>('');

  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState(getStoredClients());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setFrequency(defaultFrequency);
      setSelectedDay(defaultDay);
      setReminderTime(defaultTime);
      setSelectedWeek(defaultWeek);
      if (defaultDate) setReminderDate(defaultDate);
      if (currentUser) {
        setTeam(currentUser.team);
      }
      fetchAllUsersAction().then(setUsers);
      setClients(getStoredClients());
    }
  }, [isOpen, defaultFrequency, defaultDay, defaultTime, defaultWeek, defaultDate, currentUser]);

  const handleApplyTemplate = (tmpl: typeof SUGGESTED_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setTeam(tmpl.team);
    setFrequency(tmpl.frequency);
    setChecklist(tmpl.checklist);
    toast.success(`Applied "${tmpl.title}" template!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a reminder title / service subject.');
      return;
    }

    if (!currentUser) {
      toast.error('You must be signed in to schedule a reminder.');
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryText = `${frequency} reminder for ${clientName} (${team}) at ${reminderTime}.`;

      const reminderSettings: ReminderSettings = {
        enabled: true,
        frequency,
        reminderDate,
        reminderTime,
        remindBeforeDays: frequency === 'Custom' ? remindBeforeDays : frequency === 'Yearly' ? 30 : 7,
        repeatEndsOption,
        repeatUntilDate: repeatEndsOption === 'until_date' ? repeatUntilDate : undefined,
        recipientType:
          recipientAudience === 'all_teams'
            ? 'all_teams'
            : recipientAudience === 'all_tl'
            ? 'all_tl'
            : recipientAudience === 'team'
            ? 'specific_team'
            : 'custom_members',
        targetTeam: team,
        targetUserIds: assignedTo ? [assignedTo] : [],
        summaryText,
      };

      const labels = ['Reminder', frequency, team];
      if (frequency === 'Weekly') labels.push(selectedDay, slotTag);
      if (frequency === 'Monthly') labels.push(selectedWeek);

      const newTask = await createTaskAction({
        title: title.trim(),
        description: checklist.trim() || `Automated ${frequency} reminder schedule for ${clientName}.`,
        priority,
        status: 'Todo',
        team,
        assignedTo: assignedTo || currentUser._id,
        createdBy: currentUser._id,
        incoming: false,
        dueDate: reminderDate,
        labels,
        clientName,
        reminderSettings,
      });

      setTasks([newTask, ...(tasks || [])]);
      if (onCreated) onCreated(newTask);

      toast.success(`Reminder alert scheduled successfully!`, {
        description: `${frequency} trigger registered for ${clientName} at ${reminderTime}.`,
      });

      // Reset form & close
      setTitle('');
      setChecklist('');
      onClose();
    } catch (err: any) {
      console.error('Error creating reminder task:', err);
      toast.error(err?.message || 'Failed to schedule reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Due Reminder & Automated Alert"
      description="Configure automated recurring alerts, renewal notifications, reviewer assignments, and client audit schedules."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Banner with Visual Recurrence Branding */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-glow shrink-0">
              <BellRing className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Automated Alert Scheduler
                </span>
                <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
                  {frequency} Mode
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Triggers center-screen health check alerts, notifications, and scheduled retainer audits.
              </p>
            </div>
          </div>
          <Repeat className="h-5 w-5 text-indigo-500/40 hidden sm:block shrink-0" />
        </div>

        {/* 1. Interactive Frequency Selector */}
        <div>
          <label className="text-xs font-bold text-foreground block mb-1.5 flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-indigo-500" />
            Select Recurrence Frequency *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'Daily', label: 'Daily', sub: 'Every 24h', color: 'border-sky-500 text-sky-600 bg-sky-500/10' },
              { id: 'Weekly', label: 'Weekly', sub: 'Mon–Sun (T1–T3)', color: 'border-teal-500 text-teal-600 bg-teal-500/10' },
              { id: 'Monthly', label: 'Monthly', sub: 'Weeks 1–5', color: 'border-indigo-500 text-indigo-600 bg-indigo-500/10' },
              { id: 'Yearly', label: 'Yearly', sub: 'Annual 365d', color: 'border-purple-500 text-purple-600 bg-purple-500/10' },
              { id: 'Custom', label: 'Custom', sub: 'Lead time alert', color: 'border-amber-500 text-amber-600 bg-amber-500/10' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id as any)}
                className={`p-2.5 rounded-2xl border text-left transition-all ${
                  frequency === f.id
                    ? `${f.color} ring-2 ring-indigo-500/40 font-black shadow-sm`
                    : 'border-zinc-200 dark:border-zinc-800 bg-card hover:border-zinc-300 text-muted-foreground'
                }`}
              >
                <span className="text-xs font-bold block text-foreground">{f.label}</span>
                <span className="text-[10px] text-muted-foreground block">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mb-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Quick Service Templates (Click to fill):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUGGESTED_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.title}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="text-[10px] font-medium px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-muted-foreground hover:text-foreground transition-all"
              >
                + {tmpl.title.split(' ')[0]} {tmpl.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Alert Title & Client Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-foreground block mb-1">
              Reminder Subject / Service Audit Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly SEO Retainer Audit & Backlink Review"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-brand-500" />
              Medical Client / Practice *
            </label>
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Responsible Team / Department *
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as TeamName)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="Development">💻 Development Team</option>
              <option value="Marketing">📈 Marketing Team</option>
              <option value="Creative">🎨 Creative Team</option>
            </select>
          </div>
        </div>

        {/* 3. Frequency-Specific Schedule Builder */}
        <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {frequency} Schedule Configuration
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              Chennai IST (UTC+5:30) • Brisbane AEST (UTC+10)
            </span>
          </div>

          {/* If Weekly: Day of Week & Slot Tag */}
          {frequency === 'Weekly' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Day of Week</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Slot Identifier</label>
                <select
                  value={slotTag}
                  onChange={(e) => setSlotTag(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="T1">T1 – Task / Reminder 1</option>
                  <option value="T2">T2 – Task / Reminder 2</option>
                  <option value="T3">T3 – Task / Reminder 3</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Slot Trigger Time</label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="09:30 AM">09:30 AM (Morning Shift)</option>
                  <option value="02:00 PM">02:00 PM (Afternoon Shift)</option>
                  <option value="05:30 PM">05:30 PM (Evening Sign-off)</option>
                </select>
              </div>
            </div>
          )}

          {/* If Monthly: Week Block, Day, Date, Time */}
          {frequency === 'Monthly' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Calendar Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="Week 1">Week 1 (01–04 Oct)</option>
                  <option value="Week 2">Week 2 (05–11 Oct)</option>
                  <option value="Week 3">Week 3 (12–18 Oct)</option>
                  <option value="Week 4">Week 4 (19–25 Oct)</option>
                  <option value="Week 5">Week 5 (26–31 Oct)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Day of Week</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Target Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Audit Time</label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
            </div>
          )}

          {/* If Daily or Yearly or Custom */}
          {frequency !== 'Weekly' && frequency !== 'Monthly' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Due / Renewal Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">Trigger Time</label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  {frequency === 'Custom' ? 'Advance Lead Time' : 'Advance Warning'}
                </label>
                <select
                  value={remindBeforeDays}
                  onChange={(e) => setRemindBeforeDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-indigo-500/30 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value={0}>On the exact day</option>
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>7 days before</option>
                  <option value={14}>14 days before</option>
                  <option value={30}>30 days before</option>
                  <option value={60}>60 days before</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 4. Assignee, Priority & Notification Audience */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5 text-brand-500" />
              Responsible Assignee
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="">-- Assign to Me ({currentUser?.name}) --</option>
              {users
                .filter((u) => u.team === team)
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Alert Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="Critical">🔴 Critical (Urgent Review)</option>
              <option value="High">🟠 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Target Audience
            </label>
            <select
              value={recipientAudience}
              onChange={(e) => setRecipientAudience(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="assigned">Assigned Member Only</option>
              <option value="team">Entire {team} Team</option>
              <option value="all_tl">All Team Leads (All TL)</option>
              <option value="all_teams">All Workspace Teams</option>
            </select>
          </div>
        </div>

        {/* 5. Notification Channels & Recurrence Expiry */}
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5">
          <label className="text-xs font-bold text-foreground block">
            Notification Delivery Channels
          </label>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channelToast}
                onChange={(e) => setChannelToast(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="font-semibold text-foreground">In-App Toast & Popup</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channelBell}
                onChange={(e) => setChannelBell(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="font-semibold text-foreground">Header Notification Bell</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={channelEmail}
                onChange={(e) => setChannelEmail(e.target.checked)}
                className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="font-semibold text-foreground">Email Digest Alert</span>
            </label>
          </div>
        </div>

        {/* 6. Staff Action Checklist */}
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">
            Staff Verification Checklist / Action Notes
          </label>
          <textarea
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
            placeholder="List step-by-step verification points for the staff member when the alert triggers..."
            rows={3}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-mono focus-ring"
          />
        </div>

        {/* Live Preview Pill */}
        <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>
            <strong>Schedule Summary:</strong> {frequency} reminder for <strong>{clientName}</strong> ({team}) at{' '}
            <strong>{reminderTime}</strong>. Priority: <strong>{priority}</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="ambizcon-gradient text-white gap-2 font-bold shadow-glow"
          >
            <BellRing className="h-4 w-4" />
            {isSubmitting ? 'Scheduling...' : 'Schedule Reminder Alert'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
