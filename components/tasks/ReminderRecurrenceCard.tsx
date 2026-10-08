'use client';

import React, { useState, useEffect } from 'react';
import { ReminderSettings, NotificationRecipientType, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchAllUsersAction } from '@/actions/userActions';
import {
  Bell,
  Repeat,
  Calendar,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  ShieldAlert,
  Search,
  CheckSquare,
  Square,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface ReminderRecurrenceCardProps {
  value?: ReminderSettings;
  onChange?: (settings: ReminderSettings) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export function ReminderRecurrenceCard({
  value,
  onChange,
  className,
  defaultExpanded = true,
}: ReminderRecurrenceCardProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isTeamLeadOrAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Team Lead';

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Initial State Defaults
  const [enabled, setEnabled] = useState(value?.enabled ?? true);
  const [frequency, setFrequency] = useState<ReminderSettings['frequency']>(value?.frequency || 'Yearly');
  const [reminderDate, setReminderDate] = useState(value?.reminderDate || '2026-10-01');
  const [reminderTime, setReminderTime] = useState(value?.reminderTime || '10:00 AM');
  const [remindBeforeDays, setRemindBeforeDays] = useState<number | undefined>(value?.remindBeforeDays);
  const [repeatEndsOption, setRepeatEndsOption] = useState<'never' | 'until_date'>(value?.repeatEndsOption || 'never');
  const [repeatUntilDate, setRepeatUntilDate] = useState<string>(value?.repeatUntilDate || '');

  // Recipient Target States (TL and Admin feature)
  const [recipientType, setRecipientType] = useState<NotificationRecipientType>(value?.recipientType || 'all_teams');
  const [targetTeam, setTargetTeam] = useState<string>(value?.targetTeam || 'Development');
  const [targetUserIds, setTargetUserIds] = useState<string[]>(value?.targetUserIds || []);

  // Workspace Users list for custom checkboxes
  const [usersList, setUsersList] = useState<User[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  useEffect(() => {
    fetchAllUsersAction().then((users) => {
      setUsersList(users);
      // Pre-select first 3 users if custom_members is chosen without prior selection
      if ((!value?.targetUserIds || value.targetUserIds.length === 0) && users.length > 0) {
        setTargetUserIds(users.slice(0, 3).map((u) => u._id));
      }
    });
  }, []);

  // Format Helper for Human Readable Date (e.g. 2026-10-01 -> 1 October 2026)
  const formatHumanDate = (dateStr: string) => {
    if (!dateStr) return '1 October 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Compute Recipient Description
  const getRecipientSummaryLabel = () => {
    if (recipientType === 'all_teams') return 'showing to All Teams';
    if (recipientType === 'all_tl') return 'showing to All Team Leads (All TL)';
    if (recipientType === 'specific_team') return `showing to ${targetTeam} Team`;
    if (recipientType === 'custom_members') {
      const count = targetUserIds.length;
      return `showing to ${count} selected member${count === 1 ? '' : 's'}`;
    }
    return 'showing to assigned user';
  };

  // Compute Dynamic Summary Sentence
  const computeSummary = () => {
    if (!enabled) return 'Reminders are disabled for this task.';
    const freqStr = frequency.toLowerCase();
    const dateStr = formatHumanDate(reminderDate);
    const beforeStr = remindBeforeDays ? ` and ${remindBeforeDays} days before due date` : '';
    const endStr = repeatEndsOption === 'until_date' && repeatUntilDate ? ` until ${formatHumanDate(repeatUntilDate)}.` : ' with no end date.';
    const recipientStr = ` — ${getRecipientSummaryLabel()}`;

    return `You will be reminded every ${freqStr === 'yearly' ? 'year' : freqStr === 'monthly' ? 'month' : freqStr === 'weekly' ? 'week' : freqStr === 'daily' ? 'day' : freqStr} on ${dateStr} at ${reminderTime}${beforeStr}${endStr}${recipientStr}.`;
  };

  const summary = computeSummary();

  // Notify parent component on state change
  useEffect(() => {
    if (onChange) {
      onChange({
        enabled,
        frequency,
        reminderDate,
        reminderTime,
        remindBeforeDays,
        repeatEndsOption,
        repeatUntilDate,
        recipientType,
        targetTeam,
        targetUserIds,
        summaryText: summary,
      });
    }
  }, [enabled, frequency, reminderDate, reminderTime, remindBeforeDays, repeatEndsOption, repeatUntilDate, recipientType, targetTeam, targetUserIds]);

  const toggleUserSelection = (userId: string) => {
    if (!isTeamLeadOrAdmin) return;
    setTargetUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (!isTeamLeadOrAdmin) return;
    if (targetUserIds.length === usersList.length) {
      setTargetUserIds([]);
    } else {
      setTargetUserIds(usersList.map((u) => u._id));
    }
  };

  const filteredUsersList = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.team.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className={cn('rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 sm:p-5 shadow-sm space-y-4 transition-all', className)}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm sm:text-base text-foreground">Reminder & Recurrence</h4>
              {isTeamLeadOrAdmin ? (
                <Badge className="bg-[#086075]/10 text-[#086075] border-[#086075]/30 text-[10px] font-bold">
                  TL & Admin Creator Mode
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                  View Only (TL/Admin Created)
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {enabled
                ? `${frequency} · from ${formatHumanDate(reminderDate).replace(/\s\d{4}$/, '')} · ${reminderTime}`
                : 'Disabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide transition-colors',
              enabled
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
            )}
          >
            {enabled ? 'ON' : 'OFF'}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Body */}
      {isExpanded && (
        <div className="space-y-5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 animate-in fade-in duration-200">
          {/* Permission Notice if Regular Team Member */}
          {!isTeamLeadOrAdmin && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Reminder settings are managed by <strong>Team Leads</strong> and <strong>Admins</strong>.
              </span>
            </div>
          )}

          {/* Row 1: Enable Reminder Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="enable-reminder-toggle" className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer">
                Enable Reminder
              </label>
              <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">
                — notify target team members by in-app alert
              </span>
            </div>
            <button
              id="enable-reminder-toggle"
              type="button"
              role="switch"
              disabled={!isTeamLeadOrAdmin}
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                enabled ? 'bg-teal-700 dark:bg-teal-600' : 'bg-zinc-300 dark:bg-zinc-700'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                  enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {enabled && (
            <>
              {/* ================= TL & ADMIN FEATURE: NOTIFICATION RECIPIENT SELECTION ================= */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#086075]" />
                    TO WHOM IT NEED TO SHOW (RECIPIENT TARGET)
                  </label>
                  <span className="text-[10px] font-semibold text-[#086075] bg-[#086075]/10 px-2 py-0.5 rounded-full">
                    TL / Admin Creator Option
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dropdown for Recipient Type */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Recipient Audience
                    </label>
                    <select
                      value={recipientType}
                      disabled={!isTeamLeadOrAdmin}
                      onChange={(e) => setRecipientType(e.target.value as NotificationRecipientType)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-[#086075] outline-none disabled:opacity-60"
                    >
                      <option value="all_teams">All Teams (Everyone)</option>
                      <option value="all_tl">All Team Leads (All TL)</option>
                      <option value="specific_team">Specific Team (Select Team)</option>
                      <option value="custom_members">Select Specific Members (Checkboxes)</option>
                    </select>
                  </div>

                  {/* Secondary selector: Team dropdown if specific_team */}
                  {recipientType === 'specific_team' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Target Department Team
                      </label>
                      <select
                        value={targetTeam}
                        disabled={!isTeamLeadOrAdmin}
                        onChange={(e) => setTargetTeam(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-[#086075] outline-none"
                      >
                        <option value="Development">Development Team</option>
                        <option value="Marketing">Marketing Team</option>
                        <option value="Creative">Creative Team</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Checkbox List if custom_members is selected */}
                {recipientType === 'custom_members' && (
                  <div className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Select Team Members ({targetUserIds.length} of {usersList.length} selected):
                      </span>
                      {isTeamLeadOrAdmin && (
                        <button
                          type="button"
                          onClick={handleSelectAllUsers}
                          className="text-xs font-bold text-[#086075] hover:underline"
                        >
                          {targetUserIds.length === usersList.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Member Search input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search member by name, team or role..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-xs bg-background border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-1 focus:ring-[#086075]"
                      />
                    </div>

                    {/* Scrollable Checkboxes List */}
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-background rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                      {filteredUsersList.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">No members found</p>
                      ) : (
                        filteredUsersList.map((u) => {
                          const isChecked = targetUserIds.includes(u._id);
                          return (
                            <label
                              key={u._id}
                              onClick={() => toggleUserSelection(u._id)}
                              className={cn(
                                'flex items-center justify-between p-1.5 rounded-lg border transition-colors cursor-pointer text-xs',
                                isChecked
                                  ? 'bg-[#086075]/10 border-[#086075]/40 text-foreground font-semibold'
                                  : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isTeamLeadOrAdmin}
                                  onChange={() => {}}
                                  className="h-4 w-4 rounded accent-[#086075] cursor-pointer"
                                />
                                <Avatar src={u.avatar} name={u.name} className="h-5 w-5" />
                                <span>{u.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {u.team} · {u.role}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Frequency, Date & Time Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Reminder Frequency */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    REMINDER FREQUENCY
                  </label>
                  <div className="relative">
                    <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      value={frequency}
                      disabled={!isTeamLeadOrAdmin}
                      onChange={(e) => setFrequency(e.target.value as ReminderSettings['frequency'])}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
                    >
                      <option value="Yearly">Yearly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Daily">Daily</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Reminder Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    REMINDER DATE
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={reminderDate}
                      disabled={!isTeamLeadOrAdmin}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Separate from the task due date.</p>
                </div>

                {/* Reminder Time */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    REMINDER TIME
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      value={reminderTime}
                      disabled={!isTeamLeadOrAdmin}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Remind Before Due Date Pills */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    REMIND BEFORE DUE DATE
                  </span>
                  <span className="text-[11px] text-muted-foreground">(handy for renewals and expiries)</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[30, 14, 7, 1].map((days) => {
                    const isSelected = remindBeforeDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        disabled={!isTeamLeadOrAdmin}
                        onClick={() => setRemindBeforeDays(isSelected ? undefined : days)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border disabled:opacity-60',
                          isSelected
                            ? 'bg-[#086075] text-white border-[#086075] shadow-sm'
                            : 'bg-background text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                        )}
                      >
                        {days} {days === 1 ? 'day' : 'days'} before
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Repeat Task Option */}
              <div className="space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  REPEAT TASK
                </span>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="repeat-ends-option"
                      disabled={!isTeamLeadOrAdmin}
                      checked={repeatEndsOption === 'never'}
                      onChange={() => setRepeatEndsOption('never')}
                      className="h-4 w-4 text-[#086075] focus:ring-[#086075] border-zinc-300"
                    />
                    Never ends
                  </label>

                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="repeat-ends-option"
                      disabled={!isTeamLeadOrAdmin}
                      checked={repeatEndsOption === 'until_date'}
                      onChange={() => setRepeatEndsOption('until_date')}
                      className="h-4 w-4 text-[#086075] focus:ring-[#086075] border-zinc-300"
                    />
                    Repeat until
                  </label>

                  {repeatEndsOption === 'until_date' && (
                    <input
                      type="date"
                      disabled={!isTeamLeadOrAdmin}
                      value={repeatUntilDate}
                      onChange={(e) => setRepeatUntilDate(e.target.value)}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-background border border-zinc-200 dark:border-zinc-700 rounded-xl font-medium focus:ring-2 focus:ring-[#086075] outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Row 5: Dynamic Info Callout Banner */}
              <div className="bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl p-3.5 flex items-start gap-3 text-sky-900 dark:text-sky-200 text-xs font-medium">
                <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>{summary}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
