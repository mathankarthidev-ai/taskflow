'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { SEED_USERS } from '@/lib/seed-data';
import { isUserInCompany } from '@/lib/company-filter';
import { fetchAllUsersAction } from '@/actions/userActions';
import { supabase } from '@/lib/supabase';
import { TeamName } from '@/types';
import { getCustomUserAvatar, syncUsersAvatarsToLocalStore } from '@/lib/avatar-store';
import { formatSessionDateIST } from '@/lib/utils';
import { toast } from 'sonner';

const HRM_CODE_MAP: Record<string, string> = {
  'anirudh@ambizcon.com': 'HRM1',
  'mathan@ambizcon.com': 'HRM2',
  'aravind@ambizcon.com': 'HRM3',
  'kenneth@ambizcon.com': 'HRM4',
  'thanikaivel@ambizcon.com': 'HRM5',
  'deva@ambizcon.com': 'HRM6',
  'mathi.p@ambizcon.com': 'HRM7',
  'kiruthikashri@ambizcon.com': 'HRM8',
  'naraine@ambizcon.com': 'HRM9',
  'mathanmk@ambizcon.com': 'HRM10',
  'siddesh@ambizcon.com': 'HRM11',
  'sathish@ambizcon.com': 'HRM12',
  'kavish@ambizcon.com': 'HRM13',
  'kasthuri@ambizcon.com': 'HRM14',
  'ahamed@ambizcon.com': 'HRM15',
  'adriana@ambizcon.com': 'HRM16',
};

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'naraine@ambizcon.com': 'Naraine Raja',
};

// Realistic photorealistic-style avatars matching the HR portal look
const PORTRAIT_AVATARS: Record<string, string> = {
  'anirudh@ambizcon.com': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'mathan@ambizcon.com': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'aravind@ambizcon.com': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'kenneth@ambizcon.com': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'thanikaivel@ambizcon.com': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'deva@ambizcon.com': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'mathi.p@ambizcon.com': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'kiruthikashri@ambizcon.com': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'naraine@ambizcon.com': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'mathanmk@ambizcon.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&crop=faces&q=80',
  'siddesh@ambizcon.com': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'sathish@ambizcon.com': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'kavish@ambizcon.com': 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&auto=format&fit=crop&q=80',
  'kasthuri@ambizcon.com': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'ahamed@ambizcon.com': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'adriana@ambizcon.com': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
};

function getHrmCode(email?: string, index: number = 0): string {
  if (email && HRM_CODE_MAP[email.toLowerCase()]) {
    return HRM_CODE_MAP[email.toLowerCase()];
  }
  return `HRM${index + 1}`;
}

function getPortraitAvatar(email?: string, fallbackAvatar?: string, name?: string, userId?: string): string {
  const custom = getCustomUserAvatar({
    userId,
    email,
    name,
    fallbackSrc: fallbackAvatar,
  });
  if (custom) return custom;
  if (email && PORTRAIT_AVATARS[email.toLowerCase()]) {
    return PORTRAIT_AVATARS[email.toLowerCase()];
  }
  return fallbackAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Member';
}

function findTodayAttendanceForUser(
  u: { _id?: string; email?: string; name?: string },
  liveAttendance: any[],
  todayDateKey: string,
  todayFormattedIst: string
) {
  const emailLower = (u.email || '').toLowerCase().trim();
  const nameLower = (u.name || '').toLowerCase().trim();
  const userId = String(u._id || '');

  return liveAttendance.find((r) => {
    const matchEmail = emailLower && r.user_email?.toLowerCase().trim() === emailLower;
    const matchId = userId && r.user_id === userId;
    const matchName =
      nameLower &&
      r.user_name &&
      (r.user_name.toLowerCase().trim() === nameLower ||
        r.user_name.toLowerCase().includes(nameLower));

    if (!matchEmail && !matchId && !matchName) return false;

    const recCreatedDateKey = r.created_at
      ? new Date(r.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      : '';
    const isToday =
      recCreatedDateKey === todayDateKey ||
      r.session_date === todayFormattedIst ||
      r.session_date === todayDateKey;

    return isToday;
  });
}

export function TeamPresenceOverviewPanel() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);

  const isSuperAdmin =
    currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isTeamLead = !isSuperAdmin && currentUser?.role === 'Team Lead';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';

  const [allUsers, setAllUsers] = useState<any[]>(SEED_USERS);
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isUpdatingShift, setIsUpdatingShift] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [adminSelectedTeam, setAdminSelectedTeam] = useState<'All' | TeamName>('Development');
  const [adminViewOption, setAdminViewOption] = useState<
    'all' | 'present' | 'absent' | 'leads_only' | 'members_only'
  >('all');
  const [tlSelectedMemberEmail, setTlSelectedMemberEmail] = useState<string>('all');
  const [avatarTick, setAvatarTick] = useState<number>(0);

  // Strictly scoped to the logged-in user's own team for non-admins; Admin can switch via dropdown
  const myTeam: TeamName = currentUser?.team || 'Development';
  const effectiveTeamScope: 'All' | TeamName = isSuperAdmin ? adminSelectedTeam : myTeam;

  // When switching between Ambizcon (Australia) and Ambizcon Health (India), reset team selector appropriately
  useEffect(() => {
    if (isAustralia) {
      setAdminSelectedTeam('All');
    } else if (adminSelectedTeam === 'All') {
      setAdminSelectedTeam('Development');
    }
  }, [isAustralia]);

  useEffect(() => {
    const onAvatarChange = () => setAvatarTick((t) => t + 1);
    window.addEventListener('ambizcon_avatar_updated', onAvatarChange);
    window.addEventListener('storage', onAvatarChange);
    return () => {
      window.removeEventListener('ambizcon_avatar_updated', onAvatarChange);
      window.removeEventListener('storage', onAvatarChange);
    };
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        setLiveAttendance(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadUsersFromDb = useCallback(() => {
    fetchAllUsersAction()
      .then((res) => {
        if (res && res.length > 0) {
          syncUsersAvatarsToLocalStore(res);
          setAllUsers(res);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsersFromDb();
    fetchAttendance();

    const channel = supabase
      .channel('overview_team_presence_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchAttendance();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsersFromDb();
      })
      .subscribe();

    const onLocalAttendanceEvent = () => {
      fetchAttendance();
      loadUsersFromDb();
    };
    window.addEventListener('ambizcon_attendance_updated', onLocalAttendanceEvent);
    window.addEventListener('ambizcon_workspace_refresh', onLocalAttendanceEvent);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAttendance();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      window.removeEventListener('ambizcon_attendance_updated', onLocalAttendanceEvent);
      window.removeEventListener('ambizcon_workspace_refresh', onLocalAttendanceEvent);
    };
  }, [fetchAttendance, loadUsersFromDb]);

  // Sync current user's clock-in state and live timer from Supabase attendance + localStorage
  useEffect(() => {
    if (!currentUser) return;
    const todayDateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayFormattedIst = formatSessionDateIST(new Date());

    const myTodayRec = findTodayAttendanceForUser(
      currentUser,
      liveAttendance,
      todayDateKey,
      todayFormattedIst
    );

    if (myTodayRec) {
      const isWorkingNow =
        myTodayRec.status === 'working' &&
        (!myTodayRec.clock_out || myTodayRec.clock_out === '—');
      setIsCheckedIn(isWorkingNow);
      if (isWorkingNow && myTodayRec.created_at) {
        setElapsedSeconds(
          Math.max(0, Math.floor((Date.now() - new Date(myTodayRec.created_at).getTime()) / 1000))
        );
      } else {
        setElapsedSeconds(Number(myTodayRec.worked_seconds || 0));
      }
      return;
    }

    const savedShift = localStorage.getItem(`ambizcon_shift_${currentUser._id}`);
    if (savedShift) {
      try {
        const parsed = JSON.parse(savedShift);
        if (parsed.shiftDate === todayDateKey && typeof parsed.isClockedIn === 'boolean') {
          setIsCheckedIn(parsed.isClockedIn);
          if (parsed.clockInTimestamp && parsed.isClockedIn) {
            setElapsedSeconds(Math.max(0, Math.floor((Date.now() - parsed.clockInTimestamp) / 1000)));
          } else {
            setElapsedSeconds(Number(parsed.workedSeconds || 0));
          }
          return;
        }
      } catch {
        // ignore
      }
    }

    setIsCheckedIn(false);
    setElapsedSeconds(0);
  }, [currentUser, liveAttendance]);

  useEffect(() => {
    if (!isCheckedIn) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const handleToggleClockInOut = async () => {
    if (!currentUser) return;
    setIsUpdatingShift(true);
    const todayDateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    try {
      if (isCheckedIn) {
        // CLOCK OUT -> Status becomes Absent
        setIsCheckedIn(false);
        const shiftData = {
          isClockedIn: false,
          clockInTime: '09:00 AM',
          clockOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          workedSeconds: elapsedSeconds,
          shiftDate: todayDateKey,
        };
        localStorage.setItem(`ambizcon_shift_${currentUser._id}`, JSON.stringify(shiftData));

        await fetch('/api/attendance/clock-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userEmail: currentUser.email,
            userName: currentUser.name,
            userTeam: currentUser.team,
          }),
        }).catch(() => {});

        await fetchAttendance();
        window.dispatchEvent(new CustomEvent('ambizcon_attendance_updated'));
        toast.info('Clocked Out — Status updated to Absent');
      } else {
        // CLOCK IN -> Status becomes Present
        setIsCheckedIn(true);
        const nowTs = Date.now();
        setElapsedSeconds(0);
        const shiftData = {
          isClockedIn: true,
          clockInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clockOutTime: '—',
          clockInTimestamp: nowTs,
          workedSeconds: 0,
          shiftDate: todayDateKey,
        };
        localStorage.setItem(`ambizcon_shift_${currentUser._id}`, JSON.stringify(shiftData));

        await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userEmail: currentUser.email,
            userName: currentUser.name,
            userTeam: currentUser.team,
            company: currentUser.company || activeCompanyScope,
            workMode: currentUser.workMode || 'Work From Office',
          }),
        }).catch(() => {});

        await fetchAttendance();
        window.dispatchEvent(new CustomEvent('ambizcon_attendance_updated'));
        toast.success('Clocked In — Status updated to Present!');
      }
    } finally {
      setIsUpdatingShift(false);
    }
  };

  // Filter strictly to active company branch (Ambizcon AU vs Ambizcon Health - India) & selected team
  // Presence is strictly determined by real Clock In / Clock Out status today:
  // After Clock In -> Present | After Clock Out (or not clocked in) -> Absent
  const departmentMembers = useMemo(() => {
    const todayDateKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayFormattedIst = formatSessionDateIST(new Date());

    const companyScopedUsers = allUsers.filter(
      (u) => u && isUserInCompany(u, activeCompanyScope)
    );

    const teamRoster = companyScopedUsers.filter((u) => {
      if (!isAustralia && u.role === 'Super Admin') return false;
      if (effectiveTeamScope === 'All') return true;
      return u.team === effectiveTeamScope;
    });

    const effectiveRoster =
      teamRoster.length > 0
        ? teamRoster
        : companyScopedUsers.filter((u) => (isAustralia ? true : u.role !== 'Super Admin'));

    return effectiveRoster.map((u, idx) => {
      const emailLower = (u.email || '').toLowerCase();
      const hrmCode = getHrmCode(emailLower, idx);
      const displayName = DISPLAY_NAME_OVERRIDES[emailLower] || u.name;
      const portrait = getPortraitAvatar(emailLower, u.avatar, u.name, u._id);

      const todayRec = findTodayAttendanceForUser(
        u,
        liveAttendance,
        todayDateKey,
        todayFormattedIst
      );

      const isMe = currentUser && emailLower === currentUser.email?.toLowerCase();

      // Strictly Present after Clock In, and Absent after Clock Out (or before Clock In)
      let isPresent = false;
      let modeText = 'Absent';

      if (isMe) {
        isPresent = isCheckedIn;
        modeText = isCheckedIn
          ? 'Clocked In (Remote In)'
          : todayRec
          ? 'Clocked Out'
          : 'Absent';
      } else if (todayRec) {
        isPresent =
          todayRec.status === 'working' &&
          (!todayRec.clock_out || todayRec.clock_out === '—');
        modeText = isPresent ? 'Clocked In (Remote In)' : 'Clocked Out';
      } else {
        isPresent = false;
        modeText = 'Absent';
      }

      return {
        ...u,
        hrmCode,
        displayName,
        portrait,
        isPresent,
        modeText,
      };
    });
  }, [allUsers, effectiveTeamScope, activeCompanyScope, isAustralia, liveAttendance, currentUser, isCheckedIn, avatarTick]);

  const filteredDepartmentMembers = useMemo(() => {
    let list = departmentMembers;

    // Apply Admin "What to See" view filter if Super Admin
    if (isSuperAdmin) {
      if (adminViewOption === 'present') {
        list = list.filter((m) => m.isPresent);
      } else if (adminViewOption === 'absent') {
        list = list.filter((m) => !m.isPresent);
      } else if (adminViewOption === 'leads_only') {
        list = list.filter((m) => m.role === 'Team Lead');
      } else if (adminViewOption === 'members_only') {
        list = list.filter((m) => m.role === 'Team Member');
      }
    }

    // Apply Team Lead member filter if selected
    if (isTeamLead && tlSelectedMemberEmail && tlSelectedMemberEmail !== 'all') {
      list = list.filter(
        (m) => (m.email || '').toLowerCase() === tlSelectedMemberEmail.toLowerCase()
      );
    }

    // Apply quick pill status filter
    if (statusFilter === 'present') {
      return list.filter((m) => m.isPresent);
    }
    if (statusFilter === 'absent') {
      return list.filter((m) => !m.isPresent);
    }
    return list;
  }, [departmentMembers, statusFilter, isSuperAdmin, adminViewOption, isTeamLead, tlSelectedMemberEmail]);

  if (!currentUser) return null;

  const myHrmCode = getHrmCode(currentUser.email, 0);
  const myPortrait = getPortraitAvatar(
    currentUser.email,
    currentUser.avatar,
    currentUser.name,
    currentUser._id
  );
  const hrs = String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(elapsedSeconds % 60).padStart(2, '0');

  const presentCount = departmentMembers.filter((m) => m.isPresent).length;
  const absentCount = departmentMembers.filter((m) => !m.isPresent).length;

  return (
    <div className="space-y-4">
      {/* 1. Top Profile & Clock In / Clock Out Card */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm">
        {/* Dark Botanical Leaf Header Banner */}
        <div
          className="h-24 w-full bg-cover bg-center relative"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(10, 35, 28, 0.55), rgba(10, 35, 28, 0.85)), url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80")',
          }}
        />

        {/* White Card Body with Overlapping Rounded-Square Avatar */}
        <div className="px-5 pb-5 pt-0 text-center relative">
          <div className="relative -mt-12 mx-auto h-24 w-24 rounded-2xl border-4 border-white dark:border-zinc-900 bg-sky-100 dark:bg-zinc-800 shadow-md overflow-hidden">
            <img
              src={myPortrait}
              alt={currentUser.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              <span className="text-slate-500 dark:text-zinc-400 font-medium">{myHrmCode} - </span>
              {DISPLAY_NAME_OVERRIDES[currentUser.email.toLowerCase()] || currentUser.name}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              {isSuperAdmin ? 'Super Admin (All Teams)' : `${currentUser.team} Department`} •{' '}
              <span
                className={
                  isCheckedIn
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-rose-500 font-semibold'
                }
              >
                {isCheckedIn ? 'Present (Clocked In)' : 'Absent'}
              </span>
            </p>
          </div>

          {/* 3 Timer Pills */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex h-7 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">
              {hrs}
            </span>
            <span className="text-xs font-bold text-slate-400">:</span>
            <span className="inline-flex h-7 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">
              {mins}
            </span>
            <span className="text-xs font-bold text-slate-400">:</span>
            <span className="inline-flex h-7 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">
              {secs}
            </span>
          </div>

          {/* Clock In / Clock Out Button */}
          <div className="mt-4">
            <button
              type="button"
              disabled={isUpdatingShift}
              onClick={handleToggleClockInOut}
              className={`min-w-[140px] rounded-lg border px-6 py-2 text-sm font-semibold transition-all ${
                isCheckedIn
                  ? 'border-rose-400 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              {isCheckedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Card: Admin Team & View Selector Dropdowns */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {isAustralia ? 'Ambizcon AU — Team & View Selector' : `Admin Team & View Selector (${currentUser.name})`}
            </span>
            <span className="rounded-full bg-brand-500/10 border border-brand-500/25 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-300">
              {effectiveTeamScope === 'All'
                ? isAustralia
                  ? 'Ambizcon AU Roster'
                  : 'All 3 Teams'
                : `${effectiveTeamScope} Team`}
            </span>
          </div>

          {/* Dropdown 1: Choose Team to See */}
          <div className="grid grid-cols-1 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                Select Team to View:
              </label>
              <select
                value={adminSelectedTeam}
                onChange={(e) => setAdminSelectedTeam(e.target.value as 'All' | TeamName)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/90 px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {isAustralia ? (
                  <>
                    <option value="All">🇦🇺 All Ambizcon Australia Members (Adriana, Anirudh, Mathan P)</option>
                    <option value="Marketing">📈 Marketing Team — Australia (HRM16 - Adriana Ruju)</option>
                    <option value="Development">💻 Executive / Development — Australia (HRM1 - Anirudh, HRM2 - Mathan P)</option>
                  </>
                ) : (
                  <>
                    <option value="Development">💻 Development Team (HRM3 - Aravind Kalaivanan)</option>
                    <option value="Marketing">📈 Marketing Team (HRM4 - Kennath Franklin J)</option>
                    <option value="Creative">🎨 Creative Team (HRM6 - Deva Priya D A)</option>
                    <option value="All">🌐 All India Teams (Development, Marketing &amp; Creative)</option>
                  </>
                )}
              </select>
            </div>

            {/* Dropdown 2: Choose What Need to See */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                What to See (Filter View):
              </label>
              <select
                value={adminViewOption}
                onChange={(e) => {
                  const val = e.target.value as
                    | 'all'
                    | 'present'
                    | 'absent'
                    | 'leads_only'
                    | 'members_only';
                  setAdminViewOption(val);
                  if (val === 'present') setStatusFilter('present');
                  else if (val === 'absent') setStatusFilter('absent');
                  else setStatusFilter('all');
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/90 px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">📋 All Roster ({departmentMembers.length})</option>
                <option value="present">🟢 Present / Clocked In Only ({presentCount})</option>
                <option value="absent">🔴 Absent / Clocked Out Only ({absentCount})</option>
                {!isAustralia && <option value="leads_only">👑 Reporting Managers / Team Leads Only</option>}
                <option value="members_only">👥 Team Members Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Card: Department Members */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Department Members
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              {effectiveTeamScope === 'All' ? 'All Teams' : `${effectiveTeamScope} Team`} • {presentCount} Present, {absentCount} Absent
            </p>
          </div>

          {/* Present / Absent Quick Filter Pills */}
          <div className="inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/70 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                if (isSuperAdmin && (adminViewOption === 'present' || adminViewOption === 'absent')) {
                  setAdminViewOption('all');
                }
              }}
              className={`rounded-md px-2 py-1 transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
              }`}
            >
              All ({departmentMembers.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('present');
                if (isSuperAdmin) setAdminViewOption('present');
              }}
              className={`rounded-md px-2 py-1 transition-all ${
                statusFilter === 'present'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('absent');
                if (isSuperAdmin) setAdminViewOption('absent');
              }}
              className={`rounded-md px-2 py-1 transition-all ${
                statusFilter === 'absent'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-500'
              }`}
            >
              Absent ({absentCount})
            </button>
          </div>
        </div>

        {/* TL Quick Member Filter Pills for Team Lead */}
        {isTeamLead && !isSuperAdmin && (
          <div className="mb-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 mr-1">
              TL Filter:
            </span>
            <button
              type="button"
              onClick={() => setTlSelectedMemberEmail('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                tlSelectedMemberEmail === 'all'
                  ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              All
            </button>
            {departmentMembers.map((m) => {
              const isSelected =
                tlSelectedMemberEmail.toLowerCase() === (m.email || '').toLowerCase();
              return (
                <button
                  key={m.email}
                  type="button"
                  onClick={() =>
                    setTlSelectedMemberEmail(isSelected ? 'all' : m.email)
                  }
                  className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50'
                  }`}
                  title={`${m.hrmCode} - ${m.displayName}`}
                >
                  <img
                    src={m.portrait}
                    alt={m.displayName}
                    className="h-5 w-5 rounded-full object-cover shrink-0 border border-white/30"
                  />
                  <span className="truncate max-w-[95px]">
                    {m.displayName.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {filteredDepartmentMembers.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No matching members in {effectiveTeamScope === 'All' ? 'All Teams' : `${effectiveTeamScope} team`}.
            </p>
          ) : (
            filteredDepartmentMembers.map((member) => (
              <div key={member.email || member._id} className="flex items-center gap-3.5 py-3.5 first:pt-2 last:pb-1">
                <div className="h-12 w-12 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-slate-100 dark:bg-zinc-800">
                  <img
                    src={member.portrait}
                    alt={member.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                      <span className="font-normal text-slate-500 dark:text-zinc-400">
                        {member.hrmCode} -{' '}
                      </span>
                      {member.displayName}
                    </p>
                    {isSuperAdmin && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 shrink-0">
                        {member.team} • {member.role === 'Team Lead' ? 'TL' : 'Member'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className={`text-xs font-semibold ${
                        member.isPresent
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {member.isPresent ? 'Clocked In' : member.modeText}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        member.isPresent
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                      }`}
                    >
                      {member.isPresent ? 'Present' : 'Absent'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
