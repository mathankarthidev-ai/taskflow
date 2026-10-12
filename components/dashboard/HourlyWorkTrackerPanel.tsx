'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';
import { fetchAllUsersAction } from '@/actions/userActions';
import {
  WorkLogItem,
  WorkBlockColor,
  fetchWorkLogsForDate,
  saveWorkLogItem,
  deleteWorkLogItem,
  syncInProgressTasksToWorkLogs,
  parseTimeToMinutes,
  formatDurationHrs,
} from '@/lib/work-logs-store';
import { Plus, Trash2, Zap, Calendar as CalendarIcon, Users } from 'lucide-react';
import { toast } from 'sonner';

interface HourlyWorkTrackerPanelProps {
  tasks: Task[];
}

const HOUR_SLOTS = [
  { index: 1, start: '09:00', end: '10:00', startHour: 9, label: '09:00 – 10:00', sub: 'Slot 1 (1 hr)' },
  { index: 2, start: '10:00', end: '11:00', startHour: 10, label: '10:00 – 11:00', sub: 'Slot 2 (1 hr)' },
  { index: 3, start: '11:00', end: '12:00', startHour: 11, label: '11:00 – 12:00', sub: 'Slot 3 (1 hr)' },
  { index: 4, start: '12:00', end: '13:00', startHour: 12, label: '12:00 – 13:00', sub: 'Slot 4 (1 hr)' },
  { index: 5, start: '13:00', end: '14:00', startHour: 13, label: '13:00 – 14:00', sub: 'Slot 5 (1 hr)' },
  { index: 6, start: '14:00', end: '15:00', startHour: 14, label: '14:00 – 15:00', sub: 'Slot 6 (1 hr)' },
  { index: 7, start: '15:00', end: '16:00', startHour: 15, label: '15:00 – 16:00', sub: 'Slot 7 (1 hr)' },
  { index: 8, start: '16:00', end: '17:00', startHour: 16, label: '16:00 – 17:00', sub: 'Slot 8 (1 hr)' },
];

const HOURS_OPTIONS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const MINUTES_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const COLOR_OPTIONS: WorkBlockColor[] = ['blue', 'green', 'orange', 'purple', 'teal'];

const SLOT_HEIGHT_PX = 76; // 1 hour = 76px
const TIMELINE_START_MINUTES = 9 * 60; // 09:00 = 540 mins
const TIMELINE_END_MINUTES = 17 * 60; // 17:00 = 1020 mins

function getHandleFromName(name: string): string {
  const first = (name || 'user').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `@${first || 'user'}`;
}

function getBlockColorStyles(color: WorkBlockColor): string {
  switch (color) {
    case 'blue':
      return 'bg-[#2563eb] hover:bg-[#1d4ed8] border-[#3b82f6]/50 text-white';
    case 'green':
      return 'bg-[#15803d] hover:bg-[#166534] border-[#22c55e]/50 text-white';
    case 'orange':
      return 'bg-[#b45309] hover:bg-[#92400e] border-[#f59e0b]/50 text-white';
    case 'purple':
      return 'bg-[#7e22ce] hover:bg-[#6b21a8] border-[#a855f7]/50 text-white';
    case 'teal':
      return 'bg-[#0f766e] hover:bg-[#115e59] border-[#14b8a6]/50 text-white';
    default:
      return 'bg-[#2563eb] hover:bg-[#1d4ed8] border-[#3b82f6]/50 text-white';
  }
}

export function HourlyWorkTrackerPanel({ tasks }: HourlyWorkTrackerPanelProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);

  const roleLower = (currentUser?.role || '').toLowerCase().trim();
  const isSuperAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    currentUser?.email === 'anirudh@ambizcon.com' ||
    currentUser?.email === 'mathan@ambizcon.com';
  const isTeamLead = roleLower.includes('lead') || isSuperAdmin;

  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';

  // View Mode: 'user' ("My tab (user)") or 'admin' ("Admin view")
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [workDate, setWorkDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [allUsers, setAllUsers] = useState<User[]>(SEED_USERS as any);
  const [workLogs, setWorkLogs] = useState<WorkLogItem[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(currentUser?.email || '');
  const [adminTeamFilter, setAdminTeamFilter] = useState<string>('All');

  // Add / Edit Work Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLogItem | null>(null);
  const [modalTargetUser, setModalTargetUser] = useState<User | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [selectedColor, setSelectedColor] = useState<WorkBlockColor>('blue');

  useEffect(() => {
    if (currentUser?.email && !selectedUserEmail) {
      setSelectedUserEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    fetchAllUsersAction()
      .then((res) => {
        if (res && res.length > 0) setAllUsers(res);
      })
      .catch(() => {});
  }, []);

  // Load work logs & auto-sync any "In Progress" tasks
  const loadAndSyncLogs = async () => {
    const synced = await syncInProgressTasksToWorkLogs(tasks, workDate, allUsers);
    setWorkLogs(synced);
  };

  useEffect(() => {
    loadAndSyncLogs();
  }, [workDate, tasks, allUsers.length]);

  useEffect(() => {
    const handleSync = () => {
      fetchWorkLogsForDate(workDate).then(setWorkLogs);
    };
    window.addEventListener('ambizcon_work_logs_updated', handleSync);
    return () => window.removeEventListener('ambizcon_work_logs_updated', handleSync);
  }, [workDate]);

  // Scoped users for branch & role
  const scopedUsers = useMemo(() => {
    const branchUsers = allUsers.filter(
      (u) => u.role !== 'Reception Staff' && isUserInCompany(u, activeCompanyScope)
    );
    if (isSuperAdmin) {
      if (adminTeamFilter !== 'All') {
        return branchUsers.filter((u) => u.team === adminTeamFilter);
      }
      return branchUsers;
    }
    if (isTeamLead && currentUser) {
      return branchUsers.filter((u) => u.team === currentUser.team);
    }
    return branchUsers.filter((u) => u.email.toLowerCase() === (currentUser?.email || '').toLowerCase());
  }, [allUsers, activeCompanyScope, isSuperAdmin, isTeamLead, currentUser, adminTeamFilter]);

  const activeUserObj = useMemo(() => {
    return (
      allUsers.find((u) => u.email.toLowerCase() === selectedUserEmail.toLowerCase()) ||
      (currentUser as User) ||
      allUsers[0]
    );
  }, [allUsers, selectedUserEmail, currentUser]);

  // Calculate modal duration
  const modalDurationMinutes = useMemo(() => {
    const sMins = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const eMins = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);
    return Math.max(0, eMins - sMins);
  }, [startHour, startMinute, endHour, endMinute]);

  // Open Add Work Modal
  const handleOpenAddModal = (userObj: User, presetStart = '09:00', presetEnd = '10:00') => {
    const [sH, sM] = presetStart.split(':');
    const [eH, eM] = presetEnd.split(':');
    const userLogs = workLogs.filter((l) => l.user_email.toLowerCase() === userObj.email.toLowerCase());
    const nextColor = COLOR_OPTIONS[userLogs.length % COLOR_OPTIONS.length];

    setEditingLog(null);
    setModalTargetUser(userObj);
    setTaskInput('');
    setStartHour(sH || '09');
    setStartMinute(sM || '00');
    setEndHour(eH || '10');
    setEndMinute(eM || '00');
    setSelectedColor(nextColor);
    setIsModalOpen(true);
  };

  // Open Edit Work Modal
  const handleOpenEditModal = (log: WorkLogItem, userObj: User) => {
    const [sH, sM] = (log.start_time || '09:00').split(':');
    const [eH, eM] = (log.end_time || '10:00').split(':');
    setEditingLog(log);
    setModalTargetUser(userObj);
    setTaskInput(log.task_title);
    setStartHour(sH || '09');
    setStartMinute(sM || '00');
    setEndHour(eH || '10');
    setEndMinute(eM || '00');
    setSelectedColor(log.color || 'blue');
    setIsModalOpen(true);
  };

  // Save Work Item
  const handleSaveWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTargetUser) return;
    if (!taskInput.trim()) {
      toast.error('Please enter what you worked on');
      return;
    }
    if (modalDurationMinutes <= 0) {
      toast.error('End time must be after Start time');
      return;
    }

    const startStr = `${startHour}:${startMinute}`;
    const endStr = `${endHour}:${endMinute}`;

    const itemToSave: WorkLogItem = {
      id: editingLog ? editingLog.id : `WL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: modalTargetUser._id,
      user_email: modalTargetUser.email.toLowerCase(),
      user_name: modalTargetUser.name,
      team: modalTargetUser.team || 'Development',
      company: modalTargetUser.company || activeCompanyScope,
      work_date: workDate,
      task_id: editingLog?.task_id || '',
      task_title: taskInput.trim(),
      start_time: startStr,
      end_time: endStr,
      duration_minutes: modalDurationMinutes,
      color: selectedColor,
      is_auto_in_progress: editingLog?.is_auto_in_progress || false,
      created_at: editingLog?.created_at || new Date().toISOString(),
    };

    await saveWorkLogItem(itemToSave);
    toast.success(editingLog ? 'Work slot updated!' : 'Work added to hourly timeline!');
    setIsModalOpen(false);
    const updated = await fetchWorkLogsForDate(workDate);
    setWorkLogs(updated);
  };

  // Delete Work Item
  const handleDeleteWork = async () => {
    if (!editingLog) return;
    await deleteWorkLogItem(editingLog.id, workDate);
    toast.success(`Removed "${editingLog.task_title}" from timeline`);
    setIsModalOpen(false);
    const updated = await fetchWorkLogsForDate(workDate);
    setWorkLogs(updated);
  };

  // Render a single user's Hourly Timeline Column (used in both "My tab (user)" and "Admin view")
  const renderUserHourlyBoard = (userObj: User) => {
    const userLogs = workLogs.filter(
      (l) => l.user_email.toLowerCase() === userObj.email.toLowerCase()
    );
    const totalMinutes = userLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const handle = getHandleFromName(userObj.name);

    return (
      <div
        key={userObj.email}
        className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#0d1117] p-5 shadow-sm flex flex-col justify-between"
      >
        <div>
          {/* Top Bar: @username pill + Logged X:XX hrs / 8:00 hrs */}
          <div className="flex items-center justify-between gap-2 pb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/15 text-blue-600 dark:text-[#58a6ff] font-bold text-sm">
              {handle}
              <span className="text-[11px] font-normal text-muted-foreground hidden sm:inline">
                ({userObj.name})
              </span>
            </span>

            <span className="text-xs sm:text-sm font-semibold text-muted-foreground font-mono">
              Logged <strong className="text-foreground">{formatDurationHrs(totalMinutes)}</strong> / 8:00 hrs
            </span>
          </div>

          {/* Column Headers: Hour slots | Work done */}
          <div className="grid grid-cols-[125px_1fr] sm:grid-cols-[140px_1fr] gap-3 pb-2 text-xs font-semibold text-muted-foreground">
            <span>Hour slots</span>
            <span>Work done</span>
          </div>

          {/* Hourly Grid Container */}
          <div className="grid grid-cols-[125px_1fr] sm:grid-cols-[140px_1fr] gap-3 relative">
            {/* Left Column: 8 Hour Slots */}
            <div className="space-y-2">
              {HOUR_SLOTS.map((slot) => (
                <div
                  key={slot.index}
                  onClick={() => handleOpenAddModal(userObj, slot.start, slot.end)}
                  style={{ height: `${SLOT_HEIGHT_PX - 8}px` }}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#161b22]/80 p-2.5 flex flex-col justify-center cursor-pointer hover:border-blue-500/60 transition-colors"
                  title={`Click to add work for ${slot.label}`}
                >
                  <span className="text-xs font-mono font-bold text-foreground block">
                    {slot.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {slot.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Right Column: Work Done Proportional Timeline */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ height: `${HOUR_SLOTS.length * SLOT_HEIGHT_PX}px` }}
            >
              {/* Background Dashed Empty Slot Boxes (Click to Add Work at that Hour) */}
              {HOUR_SLOTS.map((slot, i) => (
                <div
                  key={slot.index}
                  onClick={() => handleOpenAddModal(userObj, slot.start, slot.end)}
                  style={{
                    top: `${i * SLOT_HEIGHT_PX}px`,
                    height: `${SLOT_HEIGHT_PX - 8}px`,
                  }}
                  className="absolute inset-x-0 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer"
                />
              ))}

              {/* Rendered Work Blocks */}
              {userLogs.map((log) => {
                const startMins = parseTimeToMinutes(log.start_time);
                const endMins = parseTimeToMinutes(log.end_time);
                const clampedStart = Math.max(TIMELINE_START_MINUTES, Math.min(TIMELINE_END_MINUTES - 15, startMins));
                const clampedEnd = Math.max(clampedStart + 20, Math.min(TIMELINE_END_MINUTES + 60, endMins));

                const topPx = ((clampedStart - TIMELINE_START_MINUTES) / 60) * SLOT_HEIGHT_PX;
                const heightPx = Math.max(
                  44,
                  ((clampedEnd - clampedStart) / 60) * SLOT_HEIGHT_PX - 6
                );

                return (
                  <div
                    key={log.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(log, userObj);
                    }}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                    }}
                    className={`absolute inset-x-0 z-10 rounded-xl border p-3 shadow-md cursor-pointer transition-transform hover:scale-[1.01] flex flex-col justify-start overflow-hidden ${getBlockColorStyles(
                      log.color
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-extrabold text-xs sm:text-sm leading-snug line-clamp-1">
                        {log.task_title}
                      </span>
                      {log.is_auto_in_progress && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/25 text-[9px] font-bold uppercase tracking-wider">
                          <Zap className="h-2.5 w-2.5" /> In Progress
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs text-white/90 font-mono mt-0.5">
                      {formatDurationHrs(log.duration_minutes)} · {log.start_time}–{log.end_time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // User's "In Progress" tasks for quick display
  const activeUserInProgressTasks = useMemo(() => {
    if (!activeUserObj) return [];
    return (tasks || []).filter(
      (t) =>
        t.status === 'In Progress' &&
        (t.assignedTo === activeUserObj._id ||
          (t.assignedTo || '').toLowerCase() === activeUserObj.email.toLowerCase() ||
          (t.assignedTo || '').toLowerCase() === activeUserObj.name.toLowerCase())
    );
  }, [tasks, activeUserObj]);

  if (!currentUser) return null;

  return (
    <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-card p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Bar: Mode Switcher ("Admin view" | "My tab (user)") + Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {(isSuperAdmin || isTeamLead) && (
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                viewMode === 'admin'
                  ? 'bg-[#2563eb] text-white border-[#3b82f6] shadow-md'
                  : 'bg-zinc-100 dark:bg-[#161b22] text-muted-foreground border-zinc-200 dark:border-zinc-800 hover:text-foreground'
              }`}
            >
              Admin view
            </button>
          )}

          <button
            type="button"
            onClick={() => setViewMode('user')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              viewMode === 'user'
                ? 'bg-[#2563eb] text-white border-[#3b82f6] shadow-md'
                : 'bg-zinc-100 dark:bg-[#161b22] text-muted-foreground border-zinc-200 dark:border-zinc-800 hover:text-foreground'
            }`}
          >
            My tab (user)
          </button>
        </div>

        {/* Right Controls: Auto-Sync Indicator + Team Filter (in Admin view) + Date Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Zap className="h-3.5 w-3.5" />
            In-Progress Tasks Auto-Added
          </span>

          {viewMode === 'admin' && isSuperAdmin && (
            <select
              value={adminTeamFilter}
              onChange={(e) => setAdminTeamFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-bold"
            >
              <option value="All">All Teams ({scopedUsers.length})</option>
              <option value="Development">Development Team</option>
              <option value="Marketing">Marketing Team</option>
              <option value="Creative">Creative Team</option>
            </select>
          )}

          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: MY TAB (USER) — Two-Column Layout ("My work" left panel + User Hourly Timeline right panel) */}
      {viewMode === 'user' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: "My work" Card */}
          <div className="lg:col-span-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#0d1117] p-6 space-y-5 shadow-sm">
            <h3 className="text-xl font-extrabold text-foreground">My work</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">I am</label>
              {isSuperAdmin || isTeamLead ? (
                <select
                  value={activeUserObj?.email || ''}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#161b22] px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:border-blue-500"
                >
                  {scopedUsers.map((u) => (
                    <option key={u.email} value={u.email}>
                      {getHandleFromName(u.name)} — {u.name} ({u.team})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#161b22] px-3.5 py-2.5 text-sm font-bold text-foreground">
                  {getHandleFromName(currentUser.name)} — {currentUser.name}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => activeUserObj && handleOpenAddModal(activeUserObj, '09:00', '10:00')}
              className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              + Add work
            </button>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Click an hour box (or empty space) to add work at that time. Click a work block to edit or delete it. Times go in 5-min steps.
            </p>

            {/* Auto-Synced "In Progress" Tasks Box */}
            <div className="pt-3 border-t border-zinc-200/70 dark:border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  Tasks In Progress (Auto-Added)
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {activeUserInProgressTasks.length} active
                </span>
              </div>

              {activeUserInProgressTasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Any task moved to <strong>In Progress</strong> on the Bizzy Board is automatically added to your hourly work slots.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {activeUserInProgressTasks.map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs"
                    >
                      <span className="font-bold text-foreground truncate">{t.title}</span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold shrink-0">
                        ✓ Auto-Logged
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Selected User's Hourly Slots & Work Done */}
          <div className="lg:col-span-7">
            {activeUserObj && renderUserHourlyBoard(activeUserObj)}
          </div>
        </div>
      ) : (
        /* VIEW 2: ADMIN VIEW — Side-by-Side Grid of All Scoped Team Members' Hourly Work Boards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {scopedUsers.map((u) => renderUserHourlyBoard(u))}
        </div>
      )}

      {/* ADD / EDIT WORK MODAL (Matches Screenshot 1) */}
      {isModalOpen && modalTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161b22] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-foreground">
                {editingLog ? 'Edit work' : 'Add work'}
              </h3>
              <span className="text-xs font-mono font-bold text-blue-500">
                {getHandleFromName(modalTargetUser.name)}
              </span>
            </div>

            <form onSubmit={handleSaveWork} className="space-y-4">
              {/* Task Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Task</label>
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d1117] px-3.5 py-2.5 text-sm font-medium text-foreground outline-none focus:border-blue-500"
                  required
                />

                {/* Quick Pick from User's Assigned Tasks */}
                {tasks.filter(
                  (t) =>
                    t.assignedTo === modalTargetUser._id ||
                    (t.assignedTo || '').toLowerCase() === modalTargetUser.email.toLowerCase()
                ).length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-muted-foreground">Quick pick:</span>
                    {tasks
                      .filter(
                        (t) =>
                          t.assignedTo === modalTargetUser._id ||
                          (t.assignedTo || '').toLowerCase() === modalTargetUser.email.toLowerCase()
                      )
                      .slice(0, 3)
                      .map((t) => (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => setTaskInput(t.title)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-semibold truncate max-w-[160px]"
                        >
                          {t.title}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Start time (hour : minute) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Start time (hour : minute)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d1117] px-3.5 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-blue-500"
                  >
                    {HOURS_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>

                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d1117] px-3.5 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-blue-500"
                  >
                    {MINUTES_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End time (hour : minute) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">
                  End time (hour : minute)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d1117] px-3.5 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-blue-500"
                  >
                    {HOURS_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>

                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#0d1117] px-3.5 py-2.5 text-sm font-mono font-bold text-foreground outline-none focus:border-blue-500"
                  >
                    {MINUTES_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Block Color Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-muted-foreground">Block Color:</span>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${
                        selectedColor === c ? 'scale-115 border-white ring-2 ring-blue-500' : 'border-transparent opacity-70'
                      } ${
                        c === 'blue'
                          ? 'bg-[#2563eb]'
                          : c === 'green'
                          ? 'bg-[#15803d]'
                          : c === 'orange'
                          ? 'bg-[#b45309]'
                          : c === 'purple'
                          ? 'bg-[#7e22ce]'
                          : 'bg-[#0f766e]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Total duration box */}
              <div className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] px-4 py-3 text-sm text-foreground">
                Total duration: <strong className="font-extrabold">{formatDurationHrs(modalDurationMinutes)}</strong>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {editingLog && (
                  <button
                    type="button"
                    onClick={handleDeleteWork}
                    className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-sm font-bold flex items-center justify-center"
                    title="Delete work block"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold text-foreground transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-bold shadow-md transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
