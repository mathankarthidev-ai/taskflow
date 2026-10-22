'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Task, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Avatar } from '@/components/ui/Avatar';
import { syncUsersAvatarsToLocalStore } from '@/lib/avatar-store';
import {
  WorkLogItem,
  WorkBlockColor,
  fetchWorkLogsForDate,
  saveWorkLogItem,
  deleteWorkLogItem,
  syncInProgressTasksToWorkLogs,
  parseTimeToMinutes,
  formatDurationHrs,
  isWorkLogExtraHours,
} from '@/lib/work-logs-store';
import {
  Plus,
  Trash2,
  Zap,
  Calendar as CalendarIcon,
  Users,
  User as UserIcon,
  Building2,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface HourlyWorkTrackerPanelProps {
  tasks: Task[];
}

const HOUR_SLOTS = [
  { index: 1, start: '09:00', end: '10:00', startHour: 9, label: '09:00 – 10:00', sub: 'Slot 1 (1 hr)', isExtra: false },
  { index: 2, start: '10:00', end: '11:00', startHour: 10, label: '10:00 – 11:00', sub: 'Slot 2 (1 hr)', isExtra: false },
  { index: 3, start: '11:00', end: '12:00', startHour: 11, label: '11:00 – 12:00', sub: 'Slot 3 (1 hr)', isExtra: false },
  { index: 4, start: '12:00', end: '13:00', startHour: 12, label: '12:00 – 13:00', sub: 'Slot 4 (1 hr)', isExtra: false },
  { index: 5, start: '13:00', end: '14:00', startHour: 13, label: '13:00 – 14:00', sub: 'Slot 5 (1 hr)', isExtra: false },
  { index: 6, start: '14:00', end: '15:00', startHour: 14, label: '14:00 – 15:00', sub: 'Slot 6 (1 hr)', isExtra: false },
  { index: 7, start: '15:00', end: '16:00', startHour: 15, label: '15:00 – 16:00', sub: 'Slot 7 (1 hr)', isExtra: false },
  { index: 8, start: '16:00', end: '17:00', startHour: 16, label: '16:00 – 17:00', sub: 'Slot 8 (1 hr)', isExtra: false },
];

const EXTRA_HOUR_SLOTS = [
  { index: 9, start: '17:00', end: '18:00', startHour: 17, label: '17:00 – 18:00', sub: '⚡ Extra Hr 1 (1 hr)', isExtra: true },
  { index: 10, start: '18:00', end: '19:00', startHour: 18, label: '18:00 – 19:00', sub: '⚡ Extra Hr 2 (1 hr)', isExtra: true },
  { index: 11, start: '19:00', end: '20:00', startHour: 19, label: '19:00 – 20:00', sub: '⚡ Extra Hr 3 (1 hr)', isExtra: true },
  { index: 12, start: '20:00', end: '21:00', startHour: 20, label: '20:00 – 21:00', sub: '⚡ Extra Hr 4 (1 hr)', isExtra: true },
];

const HOURS_OPTIONS = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
const MINUTES_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const COLOR_OPTIONS: WorkBlockColor[] = ['blue', 'green', 'orange', 'purple', 'teal'];

const SLOT_HEIGHT_PX = 76; // 1 hour = 76px
const TIMELINE_START_MINUTES = 9 * 60; // 09:00 = 540 mins
const TIMELINE_END_MINUTES = 17 * 60; // 17:00 = 1020 mins
const EXTRA_TIMELINE_END_MINUTES = 21 * 60; // 21:00 = 1260 mins

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
  const isTeamLead = !isSuperAdmin && roleLower.includes('lead');
  const canViewTeamOrAdmin = isSuperAdmin || isTeamLead;

  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';

  // Top View Mode: 'user' ("My tab (user)") or 'admin' ("Admin view" / "Team Lead view")
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [workDate, setWorkDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [allUsers, setAllUsers] = useState<User[]>(SEED_USERS as any);
  const [workLogs, setWorkLogs] = useState<WorkLogItem[]>([]);
  const [showExtraSlotsManual, setShowExtraSlotsManual] = useState<boolean>(false);

  // In "My tab (user)", selectedUserEmail defaults to the logged-in user
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(currentUser?.email || '');

  // In "Admin / Team Lead view":
  // Filter Mode: 'name' | 'team' | 'all'
  // Default is 'name' with dropdown closed (empty selection until user picks/clicks a name!)
  const [adminScopeMode, setAdminScopeMode] = useState<'name' | 'team' | 'all'>('name');
  const [adminSelectedMemberEmail, setAdminSelectedMemberEmail] = useState<string>('');
  const [adminSelectedTeam, setAdminSelectedTeam] = useState<string>('');

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
  const [isExtraHoursModal, setIsExtraHoursModal] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.email) {
      setSelectedUserEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const loadUsers = () => {
      fetchAllUsersAction()
        .then((res) => {
          if (res && res.length > 0) {
            syncUsersAvatarsToLocalStore(res);
            setAllUsers(res);
          }
        })
        .catch(() => {});
    };
    loadUsers();
    window.addEventListener('ambizcon_avatar_updated', loadUsers);
    window.addEventListener('ambizcon_workspace_refresh', loadUsers);
    return () => {
      window.removeEventListener('ambizcon_avatar_updated', loadUsers);
      window.removeEventListener('ambizcon_workspace_refresh', loadUsers);
    };
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

  /**
   * STRICT ROLE SCOPING:
   * - Super Admin: All non-reception members in active branch (India or Australia)
   * - Team Lead (TL): Strictly ONLY their own and their own team members (u.team === currentUser.team)
   * - Regular Team Member: Strictly ONLY themselves
   */
  const allowedUsers = useMemo(() => {
    const branchUsers = allUsers.filter(
      (u) => u.role !== 'Reception Staff' && isUserInCompany(u, activeCompanyScope)
    );
    if (isSuperAdmin) {
      return branchUsers;
    }
    if (isTeamLead && currentUser) {
      return branchUsers.filter(
        (u) =>
          u.team === currentUser.team ||
          u.email.toLowerCase() === currentUser.email.toLowerCase()
      );
    }
    return branchUsers.filter(
      (u) => u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()
    );
  }, [allUsers, activeCompanyScope, isSuperAdmin, isTeamLead, currentUser]);

  // Available teams for the current user's role
  const allowedTeams = useMemo(() => {
    if (isSuperAdmin) {
      return ['Development', 'Marketing', 'Creative'];
    }
    if (isTeamLead && currentUser?.team) {
      return [currentUser.team];
    }
    return [];
  }, [isSuperAdmin, isTeamLead, currentUser?.team]);

  // Active user in "My tab (user)"
  const activeUserObj = useMemo(() => {
    const found = allowedUsers.find(
      (u) => u.email.toLowerCase() === selectedUserEmail.toLowerCase()
    );
    if (found) return found;
    const self = allowedUsers.find(
      (u) => u.email.toLowerCase() === (currentUser?.email || '').toLowerCase()
    );
    return self || (currentUser as User) || allowedUsers[0];
  }, [allowedUsers, selectedUserEmail, currentUser]);

  // Users to display in Admin / Team Lead view based on ('name' | 'team' | 'all') selection
  const displayedAdminUsers = useMemo(() => {
    if (adminScopeMode === 'name') {
      if (!adminSelectedMemberEmail) return [];
      return allowedUsers.filter(
        (u) => u.email.toLowerCase() === adminSelectedMemberEmail.toLowerCase()
      );
    }
    if (adminScopeMode === 'team') {
      const targetTeam = isTeamLead ? currentUser?.team || '' : adminSelectedTeam;
      if (!targetTeam) return [];
      return allowedUsers.filter((u) => u.team === targetTeam);
    }
    // 'all' mode: shows all allowedUsers (for TL: only their own team; for Admin: all branch users)
    return allowedUsers;
  }, [adminScopeMode, adminSelectedMemberEmail, adminSelectedTeam, allowedUsers, isTeamLead, currentUser?.team]);

  // Calculate modal duration
  const modalDurationMinutes = useMemo(() => {
    const sMins = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const eMins = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);
    return Math.max(0, eMins - sMins);
  }, [startHour, startMinute, endHour, endMinute]);

  // Open Add Work Modal
  const handleOpenAddModal = (
    userObj: User,
    presetStart = '09:00',
    presetEnd = '10:00',
    forceExtra = false
  ) => {
    const [sH, sM] = presetStart.split(':');
    const [eH, eM] = presetEnd.split(':');
    const userLogs = workLogs.filter((l) => l.user_email.toLowerCase() === userObj.email.toLowerCase());
    const isExtraSlot = forceExtra || parseInt(sH || '09', 10) >= 17 || parseInt(sH || '09', 10) < 9;
    const nextColor = isExtraSlot ? 'orange' : COLOR_OPTIONS[userLogs.length % COLOR_OPTIONS.length];

    setEditingLog(null);
    setModalTargetUser(userObj);
    setTaskInput('');
    setStartHour(sH || '09');
    setStartMinute(sM || '00');
    setEndHour(eH || '10');
    setEndMinute(eM || '00');
    setSelectedColor(nextColor);
    setIsExtraHoursModal(isExtraSlot);
    setIsModalOpen(true);
  };

  // Open Edit Work Modal
  const handleOpenEditModal = (log: WorkLogItem, userObj: User) => {
    const [sH, sM] = (log.start_time || '09:00').split(':');
    const [eH, eM] = (log.end_time || '10:00').split(':');
    const isExtra = isWorkLogExtraHours(log);
    const cleanedTitle = (log.task_title || '').replace(/^\[Extra Hr\]\s*/i, '');

    setEditingLog(log);
    setModalTargetUser(userObj);
    setTaskInput(cleanedTitle);
    setStartHour(sH || '09');
    setStartMinute(sM || '00');
    setEndHour(eH || '10');
    setEndMinute(eM || '00');
    setSelectedColor(log.color || 'blue');
    setIsExtraHoursModal(isExtra);
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
    const startMins = parseTimeToMinutes(startStr);
    const endMins = parseTimeToMinutes(endStr);
    const isExtra =
      isExtraHoursModal || startMins >= 17 * 60 || endMins > 17 * 60 || startMins < 9 * 60;

    const cleanTitle = taskInput.trim().replace(/^\[Extra Hr\]\s*/i, '');
    const finalTitle = isExtra ? `[Extra Hr] ${cleanTitle}` : cleanTitle;

    const itemToSave: WorkLogItem = {
      id: editingLog ? editingLog.id : `WL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: modalTargetUser._id,
      user_email: modalTargetUser.email.toLowerCase(),
      user_name: modalTargetUser.name,
      team: modalTargetUser.team || 'Development',
      company: modalTargetUser.company || activeCompanyScope,
      work_date: workDate,
      task_id: editingLog?.task_id || '',
      task_title: finalTitle,
      start_time: startStr,
      end_time: endStr,
      duration_minutes: modalDurationMinutes,
      color: selectedColor,
      is_auto_in_progress: editingLog?.is_auto_in_progress || false,
      is_extra_hours: isExtra,
      created_at: editingLog?.created_at || new Date().toISOString(),
    };

    await saveWorkLogItem(itemToSave);
    toast.success(
      isExtra
        ? `Saved Extra Hours (+${formatDurationHrs(modalDurationMinutes)})!`
        : editingLog
        ? 'Work slot updated!'
        : 'Work added to hourly timeline!'
    );
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

  // Helper to compute user's total minutes and extra minutes
  const getUserTimeStats = (userEmail: string) => {
    const userLogs = workLogs.filter(
      (l) => l.user_email.toLowerCase() === userEmail.toLowerCase()
    );
    const totalMinutes = userLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const explicitExtraMinutes = userLogs.reduce(
      (acc, curr) => acc + (isWorkLogExtraHours(curr) ? curr.duration_minutes || 0 : 0),
      0
    );
    const overtimeFromTotal = Math.max(0, totalMinutes - 8 * 60);
    const extraMinutes = Math.max(explicitExtraMinutes, overtimeFromTotal);
    const hasAfter17Logs = userLogs.some(
      (l) => parseTimeToMinutes(l.start_time) >= 17 * 60 || parseTimeToMinutes(l.end_time) > 17 * 60
    );
    return { userLogs, totalMinutes, extraMinutes, hasAfter17Logs };
  };

  // Render a single user's Hourly Timeline Column
  const renderUserHourlyBoard = (userObj: User, showCloseBtn = false) => {
    const { userLogs, totalMinutes, extraMinutes, hasAfter17Logs } = getUserTimeStats(userObj.email);
    const handle = getHandleFromName(userObj.name);
    const showExtraGrid = showExtraSlotsManual || hasAfter17Logs || extraMinutes > 0;
    const activeSlots = showExtraGrid ? [...HOUR_SLOTS, ...EXTRA_HOUR_SLOTS] : HOUR_SLOTS;
    const maxTimelineMinutes = showExtraGrid ? EXTRA_TIMELINE_END_MINUTES : TIMELINE_END_MINUTES;

    return (
      <div
        key={userObj.email}
        className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/90 bg-white dark:bg-[#0d1117] p-5 shadow-sm flex flex-col justify-between"
      >
        <div>
          {/* Top Bar: Avatar + @username pill + Logged X:XX hrs / 8:00 hrs + Extra Hrs Badge */}
          <div className="flex items-center justify-between gap-2 pb-4 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Avatar
                src={userObj.avatar}
                name={userObj.name}
                userId={userObj._id}
                email={userObj.email}
                size="md"
                className="h-9 w-9 ring-2 ring-blue-500/30"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/15 text-blue-600 dark:text-[#58a6ff] font-bold text-sm">
                {handle}
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({userObj.name} • {userObj.team})
                </span>
              </span>

              {extraMinutes > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-extrabold font-mono">
                  <Zap className="h-3.5 w-3.5" />+{formatDurationHrs(extraMinutes)} Extra Hr
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground font-mono">
                Logged <strong className="text-foreground">{formatDurationHrs(totalMinutes)}</strong> / 8:00 hrs
              </span>

              {showCloseBtn && (
                <button
                  type="button"
                  onClick={() => setAdminSelectedMemberEmail('')}
                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title="Close member board"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Column Headers: Hour slots | Work done */}
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[145px_1fr] gap-3 pb-2 text-xs font-semibold text-muted-foreground">
            <span>Hour slots</span>
            <span>Work done</span>
          </div>

          {/* Hourly Grid Container */}
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[145px_1fr] gap-3 relative">
            {/* Left Column: Hour Slots (Standard 8 + Extra Hours if active) */}
            <div className="space-y-2">
              {activeSlots.map((slot) => (
                <div
                  key={slot.index}
                  onClick={() => handleOpenAddModal(userObj, slot.start, slot.end, slot.isExtra)}
                  style={{ height: `${SLOT_HEIGHT_PX - 8}px` }}
                  className={`rounded-xl border p-2.5 flex flex-col justify-center cursor-pointer transition-colors ${
                    slot.isExtra
                      ? 'border-amber-500/40 bg-amber-500/10 hover:border-amber-500'
                      : 'border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#161b22]/80 hover:border-blue-500/60'
                  }`}
                  title={`Click to add ${slot.isExtra ? 'Extra Hours ' : ''}work for ${slot.label}`}
                >
                  <span
                    className={`text-xs font-mono font-bold block ${
                      slot.isExtra ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                    }`}
                  >
                    {slot.label}
                  </span>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      slot.isExtra
                        ? 'text-amber-600/90 dark:text-amber-400/90 font-bold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {slot.sub}
                  </span>
                </div>
              ))}
            </div>

            {/* Right Column: Work Done Proportional Timeline */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ height: `${activeSlots.length * SLOT_HEIGHT_PX}px` }}
            >
              {/* Background Dashed Empty Slot Boxes (Click to Add Work at that Hour) */}
              {activeSlots.map((slot, i) => (
                <div
                  key={slot.index}
                  onClick={() => handleOpenAddModal(userObj, slot.start, slot.end, slot.isExtra)}
                  style={{
                    top: `${i * SLOT_HEIGHT_PX}px`,
                    height: `${SLOT_HEIGHT_PX - 8}px`,
                  }}
                  className={`absolute inset-x-0 rounded-xl border border-dashed transition-all cursor-pointer ${
                    slot.isExtra
                      ? 'border-amber-500/35 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10'
                      : 'border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/40 hover:bg-blue-500/5'
                  }`}
                />
              ))}

              {/* Rendered Work Blocks */}
              {userLogs.map((log) => {
                const startMins = parseTimeToMinutes(log.start_time);
                const endMins = parseTimeToMinutes(log.end_time);
                const isExtra = isWorkLogExtraHours(log);
                const clampedStart = Math.max(
                  TIMELINE_START_MINUTES,
                  Math.min(maxTimelineMinutes - 15, startMins)
                );
                const clampedEnd = Math.max(
                  clampedStart + 20,
                  Math.min(maxTimelineMinutes + 60, endMins)
                );

                const topPx = ((clampedStart - TIMELINE_START_MINUTES) / 60) * SLOT_HEIGHT_PX;
                const heightPx = Math.max(
                  44,
                  ((clampedEnd - clampedStart) / 60) * SLOT_HEIGHT_PX - 6
                );

                const displayTitle = (log.task_title || '').replace(/^\[Extra Hr\]\s*/i, '');

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
                        {displayTitle}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isExtra && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-extrabold uppercase tracking-wider">
                            <Zap className="h-2.5 w-2.5" /> Extra Hr
                          </span>
                        )}
                        {log.is_auto_in_progress && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/25 text-[9px] font-bold uppercase tracking-wider">
                            <Zap className="h-2.5 w-2.5" /> In Progress
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] sm:text-xs text-white/90 font-mono mt-0.5">
                      {formatDurationHrs(log.duration_minutes)} · {log.start_time}–{log.end_time}
                      {isExtra ? ' (Overtime)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Quick Add Extra Hours / Toggle Extra Hour Slots (17:00 – 21:00) */}
          <div className="mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal(userObj, '17:00', '18:00', true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-extrabold transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />+ Add Worked Extra Hr (Overtime)
            </button>

            <button
              type="button"
              onClick={() => setShowExtraSlotsManual(!showExtraSlotsManual)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground underline"
            >
              {showExtraGrid
                ? 'Hide Extra Hour Slots (17:00–21:00)'
                : 'Show Extra Hour Slots (17:00–21:00)'}
            </button>
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
      {/* Top Bar: Mode Switcher ("Admin view" / "Team Lead view" | "My tab (user)") + Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {canViewTeamOrAdmin && (
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                viewMode === 'admin'
                  ? 'bg-[#2563eb] text-white border-[#3b82f6] shadow-md'
                  : 'bg-zinc-100 dark:bg-[#161b22] text-muted-foreground border-zinc-200 dark:border-zinc-800 hover:text-foreground'
              }`}
            >
              {isSuperAdmin ? 'Admin view' : `${currentUser.team} Team view (TL)`}
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

        {/* Right Controls: Auto-Sync Indicator + Date Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Zap className="h-3.5 w-3.5" />
            In-Progress Tasks Auto-Added
          </span>

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
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-extrabold text-foreground">My work</h3>
              {activeUserObj && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#161b22]">
                  <Avatar
                    src={activeUserObj.avatar}
                    name={activeUserObj.name}
                    userId={activeUserObj._id}
                    email={activeUserObj.email}
                    size="sm"
                    className="h-6 w-6 ring-1 ring-blue-500/30"
                  />
                  <span className="text-xs font-bold text-foreground truncate max-w-[130px]">
                    {activeUserObj.name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                {canViewTeamOrAdmin
                  ? isSuperAdmin
                    ? 'I am (Select Member Name)'
                    : `I am (Yourself or ${currentUser.team} Team Member)`
                  : 'I am'}
              </label>

              {canViewTeamOrAdmin ? (
                <>
                  <div className="flex items-center gap-2.5">
                    {activeUserObj && (
                      <Avatar
                        src={activeUserObj.avatar}
                        name={activeUserObj.name}
                        userId={activeUserObj._id}
                        email={activeUserObj.email}
                        size="md"
                        className="h-10 w-10 ring-2 ring-blue-500/30 shrink-0"
                      />
                    )}
                    <select
                      value={activeUserObj?.email || ''}
                      onChange={(e) => setSelectedUserEmail(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#161b22] px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {allowedUsers.map((u) => (
                        <option key={u.email} value={u.email}>
                          {getHandleFromName(u.name)} — {u.name} ({u.team})
                          {u.email.toLowerCase() === currentUser.email.toLowerCase() ? ' (You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Clickable Member Profile Picture Options for TL / Admin */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {allowedUsers.map((u) => {
                      const isSelected =
                        (activeUserObj?.email || '').toLowerCase() === u.email.toLowerCase();
                      return (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => setSelectedUserEmail(u.email)}
                          className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                            isSelected
                              ? 'bg-[#2563eb] text-white border-[#3b82f6] shadow-xs'
                              : 'bg-zinc-50 dark:bg-[#161b22] text-foreground border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                          }`}
                        >
                          <Avatar
                            src={u.avatar}
                            name={u.name}
                            userId={u._id}
                            email={u.email}
                            size="sm"
                            className="h-5 w-5"
                          />
                          <span className="truncate max-w-[110px]">{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#161b22] px-3.5 py-2.5 text-sm font-bold text-foreground">
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    userId={currentUser._id}
                    email={currentUser.email}
                    size="sm"
                    className="h-7 w-7 ring-2 ring-blue-500/30"
                  />
                  <span>
                    {getHandleFromName(currentUser.name)} — {currentUser.name}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => activeUserObj && handleOpenAddModal(activeUserObj, '09:00', '10:00', false)}
                className="w-full py-3 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                + Add work
              </button>

              <button
                type="button"
                onClick={() => activeUserObj && handleOpenAddModal(activeUserObj, '17:00', '18:00', true)}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                + Worked Extra Hr (Overtime)
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Click an hour box (or empty space) to add work at that time. Click <strong>+ Worked Extra Hr</strong> if you worked overtime beyond your 8-hour shift.
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
        /* VIEW 2: ADMIN / TEAM LEAD VIEW — Filter by Name Dropdown, Team Dropdown, or All */
        <div className="space-y-5">
          {/* Selector Control Card: Name | Team | All */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#0d1117] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Mode Tabs: Name | Team | All */}
              <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-[#161b22] p-1 rounded-xl border border-zinc-300/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdminScopeMode('name');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adminScopeMode === 'name'
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  By Name
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminScopeMode('team');
                    if (isTeamLead && currentUser?.team) {
                      setAdminSelectedTeam(currentUser.team);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adminScopeMode === 'team'
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  By Team
                </button>

                <button
                  type="button"
                  onClick={() => setAdminScopeMode('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    adminScopeMode === 'all'
                      ? 'bg-[#2563eb] text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  All ({allowedUsers.length})
                </button>
              </div>

              {/* Scope Badge */}
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {isSuperAdmin
                  ? `Scope: ${activeCompanyScope} (${allowedUsers.length} Members)`
                  : `Team Lead Scope: ${currentUser.team} Team Only (${allowedUsers.length} Members)`}
              </span>
            </div>

            {/* Dropdown Selector Row based on Mode */}
            {adminScopeMode === 'name' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-foreground whitespace-nowrap">
                    Select Member Name to Open:
                  </label>
                  <div className="flex items-center gap-2.5 flex-1 max-w-md">
                    {adminSelectedMemberEmail && (() => {
                      const selU = allowedUsers.find(
                        (item) => item.email.toLowerCase() === adminSelectedMemberEmail.toLowerCase()
                      );
                      return selU ? (
                        <Avatar
                          src={selU.avatar}
                          name={selU.name}
                          userId={selU._id}
                          email={selU.email}
                          size="md"
                          className="h-9 w-9 ring-2 ring-blue-500/40 shrink-0"
                        />
                      ) : null;
                    })()}
                    <select
                      value={adminSelectedMemberEmail}
                      onChange={(e) => setAdminSelectedMemberEmail(e.target.value)}
                      className="w-full rounded-xl border border-blue-500/40 bg-white dark:bg-[#161b22] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                    >
                      <option value="">-- Click to select a member name from dropdown --</option>
                      {allowedUsers.map((u) => {
                        const { totalMinutes: mins, extraMinutes: extraMins } = getUserTimeStats(
                          u.email
                        );
                        return (
                          <option key={u.email} value={u.email}>
                            {getHandleFromName(u.name)} — {u.name} ({u.team}) • Logged{' '}
                            {formatDurationHrs(mins)}
                            {extraMins > 0 ? ` (⚡ +${formatDurationHrs(extraMins)} Extra)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {adminSelectedMemberEmail && (
                    <button
                      type="button"
                      onClick={() => setAdminSelectedMemberEmail('')}
                      className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Close Board
                    </button>
                  )}
                </div>

                {/* Quick Clickable Member Pills with Profile Pictures */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Or click a member to open:
                  </span>
                  {allowedUsers.map((u) => {
                    const isSelected =
                      adminSelectedMemberEmail.toLowerCase() === u.email.toLowerCase();
                    const { totalMinutes: mins, extraMinutes: extraMins } = getUserTimeStats(
                      u.email
                    );

                    return (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() =>
                          setAdminSelectedMemberEmail(isSelected ? '' : u.email)
                        }
                        className={`pl-2 pr-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[#2563eb] text-white border-[#3b82f6] shadow-xs'
                            : 'bg-white dark:bg-[#161b22] text-foreground border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                        }`}
                      >
                        <Avatar
                          src={u.avatar}
                          name={u.name}
                          userId={u._id}
                          email={u.email}
                          size="sm"
                          className="h-6 w-6 ring-1 ring-white/25"
                        />
                        <span>{u.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-black/20 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-muted-foreground'
                          }`}
                        >
                          {formatDurationHrs(mins)}
                        </span>
                        {extraMins > 0 && (
                          <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-white">
                            ⚡ +{formatDurationHrs(extraMins)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {adminScopeMode === 'team' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-foreground whitespace-nowrap">
                    Select Team to Open:
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={adminSelectedTeam}
                      onChange={(e) => setAdminSelectedTeam(e.target.value)}
                      className="flex-1 max-w-md rounded-xl border border-blue-500/40 bg-white dark:bg-[#161b22] px-3.5 py-2.5 text-xs sm:text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                    >
                      <option value="">-- Select a Team from dropdown to open --</option>
                      {allowedTeams.map((teamName) => {
                        const count = allowedUsers.filter((u) => u.team === teamName).length;
                        return (
                          <option key={teamName} value={teamName}>
                            {teamName} Team ({count} {count === 1 ? 'Member' : 'Members'})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {currentUser.team} Team ({allowedUsers.length} Members)
                    </div>
                  )}
                </div>

                {displayedAdminUsers.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      Team Members:
                    </span>
                    {displayedAdminUsers.map((u) => (
                      <div
                        key={u.email}
                        className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161b22] text-xs font-bold text-foreground"
                      >
                        <Avatar
                          src={u.avatar}
                          name={u.name}
                          userId={u._id}
                          email={u.email}
                          size="sm"
                          className="h-5 w-5"
                        />
                        <span>{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opened Hourly Work Boards based on Selection */}
          {displayedAdminUsers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-10 text-center space-y-2">
              <ChevronDown className="h-7 w-7 text-blue-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-extrabold text-foreground">
                {adminScopeMode === 'name'
                  ? 'Select or click a member name above to open their Hourly Work Slots'
                  : 'Select a team from the dropdown above to open team work slots'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {isSuperAdmin
                  ? 'Choose any member name, team, or click "All" to view and manage their logged work hours.'
                  : `Choose yourself or any ${currentUser.team} team member from the dropdown above to view their logged work hours.`}
              </p>
            </div>
          ) : (
            <div
              className={
                displayedAdminUsers.length === 1
                  ? 'max-w-3xl mx-auto'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start'
              }
            >
              {displayedAdminUsers.map((u) =>
                renderUserHourlyBoard(u, adminScopeMode === 'name')
              )}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT WORK MODAL (Matches Screenshot 1 + Worked Extra Hr Toggle) */}
      {isModalOpen && modalTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#161b22] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-extrabold text-foreground">
                {editingLog ? 'Edit work' : isExtraHoursModal ? 'Add Extra Hours' : 'Add work'}
              </h3>
              <div className="flex items-center gap-2">
                <Avatar
                  src={modalTargetUser.avatar}
                  name={modalTargetUser.name}
                  userId={modalTargetUser._id}
                  email={modalTargetUser.email}
                  size="sm"
                  className="h-6 w-6 ring-1 ring-blue-500/40"
                />
                <span className="text-xs font-mono font-bold text-blue-500">
                  {getHandleFromName(modalTargetUser.name)} ({modalTargetUser.name})
                </span>
              </div>
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

              {/* Worked Extra Hr (Overtime) Toggle inside Modal */}
              <button
                type="button"
                onClick={() => {
                  const nextExtra = !isExtraHoursModal;
                  setIsExtraHoursModal(nextExtra);
                  if (nextExtra) {
                    setSelectedColor('orange');
                    if (parseInt(startHour, 10) < 17) {
                      setStartHour('17');
                      setStartMinute('00');
                      setEndHour('18');
                      setEndMinute('00');
                    }
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isExtraHoursModal
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400'
                    : 'bg-zinc-50 dark:bg-[#0d1117] border-zinc-300 dark:border-zinc-700 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Zap className={`h-4 w-4 ${isExtraHoursModal ? 'text-amber-500' : 'opacity-60'}`} />
                  Worked Extra Hr (Overtime / After Shift)
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isExtraHoursModal
                      ? 'bg-amber-500 text-white font-extrabold'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-muted-foreground'
                  }`}
                >
                  {isExtraHoursModal ? 'YES • EXTRA HR' : 'Standard Shift'}
                </span>
              </button>

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
                        {h} {parseInt(h, 10) >= 17 ? '(Extra Hr)' : ''}
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
                        {h} {parseInt(h, 10) > 17 ? '(Extra Hr)' : ''}
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
              <div className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1117] px-4 py-3 text-sm text-foreground flex items-center justify-between">
                <span>
                  Total duration: <strong className="font-extrabold">{formatDurationHrs(modalDurationMinutes)}</strong>
                </span>
                {(isExtraHoursModal || parseInt(startHour, 10) >= 17) && (
                  <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    ⚡ Extra Hours
                  </span>
                )}
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
