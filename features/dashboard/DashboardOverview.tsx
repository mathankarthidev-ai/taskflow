'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchTasksAction, updateTaskStatusAction } from '@/actions/taskActions';
import { Task } from '@/types';
import { getTimeBasedGreeting, getRandomQuote } from '@/lib/quotes';
import { DEFAULT_PORTRAIT_AVATARS } from '@/lib/avatar-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { getPriorityBadgeColor, getStatusBadgeColor, formatDate, formatTimeAgo } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Inbox,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Layers,
  Plus,
  Zap,
  Megaphone,
  Pin,
  Heart,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { isTaskInCompany } from '@/lib/company-filter';
import { TeamPresenceOverviewPanel } from '@/components/dashboard/TeamPresenceOverviewPanel';
import { HourlyWorkTrackerPanel } from '@/components/dashboard/HourlyWorkTrackerPanel';
import {
  Announcement,
  getStoredAnnouncements,
  getVisibleAnnouncementsForUser,
  getHeartLikesCount,
  getThumbLikesCount,
  isAnnouncementRead,
  getUnreadAnnouncementsCount,
} from '@/lib/announcements-store';
import { AnnouncementDetailModal } from '@/components/announcements/AnnouncementDetailModal';

function parseTimeStringToTodayTimestamp(timeStr?: string): number | null {
  if (!timeStr || timeStr === '-' || timeStr === '—') return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const meridian = match[4]?.toLowerCase();
  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, seconds, 0);
  return d.getTime();
}

export function DashboardOverview() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';
  const router = useRouter();
  const { setSelectedTask, setDetailModalOpen, setCreateModalOpen } = useTaskStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState('');
  const [timeGreeting, setTimeGreeting] = useState({ greeting: 'Welcome back!', icon: '' });
  const [currentShift, setCurrentShift] = useState<{
    isWorking: boolean;
    clockIn: string;
    clockOut: string;
    status: string;
    workedHours: string;
  } | null>(null);
  const [digitalClock24, setDigitalClock24] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [chennaiTime, setChennaiTime] = useState('');
  const [brisbaneTime, setBrisbaneTime] = useState('');
  const [clockingInProgress, setClockingInProgress] = useState(false);

  // Live Daily Login & Shift Timer
  const [liveWorkedSeconds, setLiveWorkedSeconds] = useState<number>(0);
  const [previousCompletedSecondsToday, setPreviousCompletedSecondsToday] = useState<number>(0);
  const previousCompletedSecondsRef = useRef<number>(0);
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(null);
  const clockInTimestampRef = useRef<number | null>(null);
  const isWorkingRef = useRef<boolean>(false);

  // Official Announcements state & live sync
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>(() => getStoredAnnouncements());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementDetailOpen, setIsAnnouncementDetailOpen] = useState(false);

  useEffect(() => {
    const refreshAnnouncements = () => {
      setAnnouncementsList(getStoredAnnouncements());
    };
    refreshAnnouncements();

    window.addEventListener('ambizcon_announcements_updated', refreshAnnouncements);
    window.addEventListener('storage', refreshAnnouncements);
    return () => {
      window.removeEventListener('ambizcon_announcements_updated', refreshAnnouncements);
      window.removeEventListener('storage', refreshAnnouncements);
    };
  }, []);

  const visibleAnnouncements = useMemo(() => {
    return getVisibleAnnouncementsForUser(announcementsList, currentUser);
  }, [announcementsList, currentUser]);

  const unreadAnnouncementsCount = useMemo(() => {
    return currentUser ? getUnreadAnnouncementsCount(currentUser._id, currentUser, visibleAnnouncements) : 0;
  }, [currentUser, visibleAnnouncements]);

  const liveWorkedFormatted = useMemo(() => {
    const h = Math.floor(liveWorkedSeconds / 3600);
    const m = Math.floor((liveWorkedSeconds % 3600) / 60);
    const s = liveWorkedSeconds % 60;
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }, [liveWorkedSeconds]);

  useEffect(() => {
    async function loadData(showSpinner = true) {
      if (showSpinner) setLoading(true);
      const res = await fetchTasksAction();
      setTasks(res);
      if (showSpinner) setLoading(false);
    }
    loadData(true);
    setQuote(getRandomQuote());
    setTimeGreeting(getTimeBasedGreeting());

    const handleWorkspaceRefresh = () => {
      loadData(false);
    };
    window.addEventListener('ambizcon_workspace_refresh', handleWorkspaceRefresh);
    return () => window.removeEventListener('ambizcon_workspace_refresh', handleWorkspaceRefresh);
  }, []);

  const loadCurrentShift = async () => {
    if (!currentUser) return;
    try {
      const todayDateKey = new Date().toISOString().split('T')[0];
      let cachedTs: number | null = null;
      let cachedClockInTime: string | null = null;
      let cachedPrevSecs = 0;
      try {
        const raw = localStorage.getItem(`ambizcon_shift_${currentUser._id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.shiftDate === todayDateKey) {
            cachedTs = parsed.clockInTimestamp || null;
            cachedClockInTime = parsed.clockInTime || null;
            cachedPrevSecs = Number(parsed.previousCompletedSecondsToday) || 0;
          }
        }
      } catch {}

      const res = await fetch(
        `/api/attendance/current?email=${encodeURIComponent(currentUser.email)}&name=${encodeURIComponent(
          currentUser.name
        )}&userId=${encodeURIComponent(currentUser._id)}`
      );
      const data = await res.json();
      if (data.success && data.attendance) {
        const isWorking = Boolean(data.isWorking);
        const clockIn = data.clockIn || cachedClockInTime || '—';
        const clockOut = data.clockOut || '—';
        const status = data.status || (isWorking ? 'working' : 'completed');
        const workedHours = data.workedHours || '0h 00m';
        const prevSecs = typeof data.previousCompletedSecondsToday === 'number'
          ? data.previousCompletedSecondsToday
          : cachedPrevSecs;
        setPreviousCompletedSecondsToday(prevSecs);
        previousCompletedSecondsRef.current = prevSecs;

        let effectiveTs: number | null = cachedTs;
        if (!effectiveTs && isWorking) {
          if (data.attendance?.created_at) {
            effectiveTs = new Date(data.attendance.created_at).getTime();
          } else if (data.attendance?.clock_in_timestamp) {
            effectiveTs = data.attendance.clock_in_timestamp;
          } else {
            effectiveTs = parseTimeStringToTodayTimestamp(clockIn);
          }
        }

        setCurrentShift({
          isWorking,
          clockIn,
          clockOut,
          status,
          workedHours,
        });

        if (isWorking && effectiveTs) {
          setClockInTimestamp(effectiveTs);
          clockInTimestampRef.current = effectiveTs;
          isWorkingRef.current = true;
          const currentElapsed = Math.max(0, Math.floor((Date.now() - effectiveTs) / 1000));
          setLiveWorkedSeconds(prevSecs + currentElapsed);
        } else {
          setClockInTimestamp(null);
          clockInTimestampRef.current = null;
          isWorkingRef.current = false;
          const todayTot = Number(data.todayTotalSeconds) || prevSecs;
          setLiveWorkedSeconds(todayTot);
        }
      } else if (cachedTs) {
        setClockInTimestamp(cachedTs);
        clockInTimestampRef.current = cachedTs;
        isWorkingRef.current = true;
        setPreviousCompletedSecondsToday(cachedPrevSecs);
        previousCompletedSecondsRef.current = cachedPrevSecs;
        const currentElapsed = Math.max(0, Math.floor((Date.now() - cachedTs) / 1000));
        setLiveWorkedSeconds(cachedPrevSecs + currentElapsed);
        setCurrentShift({
          isWorking: true,
          clockIn: cachedClockInTime || '—',
          clockOut: '—',
          status: 'working',
          workedHours: '0h 00m',
        });
      }
    } catch (e) {
      console.warn('Failed to load dashboard shift status:', e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadCurrentShift();

    const updateAllClocks = () => {
      const now = new Date();
      const targetTimezone = isAustralia ? 'Australia/Brisbane' : 'Asia/Kolkata';

      // 24-hour main digital clock: e.g. "14:58:49"
      setDigitalClock24(
        now.toLocaleTimeString('en-GB', {
          timeZone: targetTimezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );

      // Current Date below big clock: e.g. "Thursday 22 Oct"
      setCurrentDateFormatted(
        now.toLocaleDateString('en-GB', {
          timeZone: targetTimezone,
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })
      );

      // Chennai IST 12-hour: e.g. "02:58:49 pm"
      setChennaiTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).toLowerCase()
      );

      // Brisbane AEST 12-hour: e.g. "07:28:49 pm"
      setBrisbaneTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Australia/Brisbane',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).toLowerCase()
      );

      // Live Running Shift Timer Ticker (Real-Time Count Up Every Second)
      if (isWorkingRef.current && clockInTimestampRef.current) {
        const currentElapsed = Math.max(0, Math.floor((Date.now() - clockInTimestampRef.current) / 1000));
        setLiveWorkedSeconds(previousCompletedSecondsRef.current + currentElapsed);
      }
    };

    updateAllClocks();
    const timer = setInterval(updateAllClocks, 1000);

    const handleAttendanceRefresh = () => {
      loadCurrentShift();
    };
    window.addEventListener('ambizcon_attendance_updated', handleAttendanceRefresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener('ambizcon_attendance_updated', handleAttendanceRefresh);
    };
  }, [currentUser, isAustralia]);

  const handleClockToggle = async () => {
    if (!currentUser) return;

    setClockingInProgress(true);
    const todayKey = new Date().toLocaleDateString('en-CA');
    const targetTz = isAustralia ? 'Australia/Brisbane' : 'Asia/Kolkata';
    const formattedNow = new Date().toLocaleTimeString('en-US', {
      timeZone: targetTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    try {
      if (currentShift?.isWorking) {
        // Direct Clock Out from Overview
        const res = await fetch('/api/attendance/clock-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userTeam: currentUser.team,
            company: activeCompanyScope,
            clockInTimestamp: clockInTimestampRef.current || clockInTimestamp || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Clocked Out successfully! Shift completed.');
          setClockInTimestamp(null);
          clockInTimestampRef.current = null;
          isWorkingRef.current = false;

          const todayTot = Number(data.todayTotalSeconds) || (previousCompletedSecondsRef.current + liveWorkedSeconds);
          setLiveWorkedSeconds(todayTot);
          setPreviousCompletedSecondsToday(todayTot);
          previousCompletedSecondsRef.current = todayTot;

          const totH = Math.floor(todayTot / 3600);
          const totM = Math.floor((todayTot % 3600) / 60);
          const cumulativeWorkedHoursStr = `${totH}h ${String(totM).padStart(2, '0')}m`;

          setCurrentShift((prev) => ({
            isWorking: false,
            clockIn: prev?.clockIn || formattedNow,
            clockOut: data.clockOutTime || formattedNow,
            status: 'completed',
            workedHours: data.todayTotalHours || cumulativeWorkedHoursStr,
          }));
          localStorage.setItem(
            `ambizcon_shift_${currentUser._id}`,
            JSON.stringify({
              shiftDate: todayKey,
              isClockedIn: false,
              clockInTime: currentShift?.clockIn || formattedNow,
              clockOutTime: data.clockOutTime || formattedNow,
              previousCompletedSecondsToday: todayTot,
              workedSeconds: todayTot,
              status: 'completed',
            })
          );
          await loadCurrentShift();
          window.dispatchEvent(new CustomEvent('ambizcon_attendance_updated'));
        } else {
          toast.error(data.message || 'Failed to clock out');
        }
      } else {
        // Direct Clock In from Overview
        const res = await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userTeam: currentUser.team,
            company: activeCompanyScope,
            workMode: 'Work From Office',
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Clocked In successfully! Shift active.`);
          const nowTs = Date.now();
          const prevSecs = Number(data.previousCompletedSecondsToday) || previousCompletedSecondsRef.current || 0;
          setPreviousCompletedSecondsToday(prevSecs);
          previousCompletedSecondsRef.current = prevSecs;

          setClockInTimestamp(nowTs);
          clockInTimestampRef.current = nowTs;
          isWorkingRef.current = true;
          setLiveWorkedSeconds(prevSecs);

          const prevH = Math.floor(prevSecs / 3600);
          const prevM = Math.floor((prevSecs % 3600) / 60);
          const initialWorkedHoursStr = prevSecs > 0 ? `${prevH}h ${String(prevM).padStart(2, '0')}m` : '0h 00m';

          setCurrentShift({
            isWorking: true,
            clockIn: data.clockIn || formattedNow,
            clockOut: '—',
            status: 'working',
            workedHours: initialWorkedHoursStr,
          });
          localStorage.setItem(
            `ambizcon_shift_${currentUser._id}`,
            JSON.stringify({
              shiftDate: todayKey,
              isClockedIn: true,
              clockInTime: data.clockIn || formattedNow,
              clockInTimestamp: nowTs,
              previousCompletedSecondsToday: prevSecs,
              status: 'working',
            })
          );
          await loadCurrentShift();
          window.dispatchEvent(new CustomEvent('ambizcon_attendance_updated'));
        } else {
          toast.error(data.message || 'Failed to clock in');
        }
      }
    } catch {
      toast.error('Network or server error while updating attendance');
    } finally {
      setClockingInProgress(false);
    }
  };

  if (!currentUser) return null;

  const now = new Date();
  const scopedTasks = tasks.filter((t) => isTaskInCompany(t, activeCompanyScope));

  // Widget 1: Assigned Tasks
  const myAssignedTasks = scopedTasks.filter((t) => t.assignedTo === currentUser._id && t.status !== 'Done');

  // Widget 2: Completed Today
  const completedToday = scopedTasks.filter(
    (t) => t.status === 'Done' && new Date(t.updatedAt).toDateString() === now.toDateString()
  );

  // Widget 3: Overdue Tasks
  const overdueTasks = scopedTasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate).getTime() < now.getTime()
  );

  // Widget 4: Pending Review
  const pendingReviewTasks = scopedTasks.filter((t) => t.status === 'Review');

  // Widget 5: Upcoming Deadlines (Due in next 7 days, sorted)
  const upcomingDeadlines = scopedTasks
    .filter((t) => t.status !== 'Done' && new Date(t.dueDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Widget 6: Recent Activity (Latest updated tasks)
  const recentActivity = [...scopedTasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Dynamic Portrait for Left Hero Visual (Crystal Clear, High Resolution)
  let portraitUrl = currentUser.avatar;
  if (!portraitUrl || portraitUrl.includes('dicebear') || portraitUrl.includes('api.dicebear.com')) {
    const fallbackPortrait = DEFAULT_PORTRAIT_AVATARS[currentUser.email.toLowerCase()];
    if (fallbackPortrait) {
      portraitUrl = fallbackPortrait;
    }
  }
  if (portraitUrl && portraitUrl.includes('images.unsplash.com')) {
    portraitUrl = portraitUrl.replace('w=200', 'w=800').replace('q=80', 'q=95');
  }

  // Time-based greeting phrase (Good Morning / Good Afternoon / Good Evening)
  const getGreetingPhrase = () => {
    const hr = now.getHours();
    if (hr >= 5 && hr < 12) return 'Good Morning';
    if (hr >= 12 && hr < 17) return 'Good Afternoon';
    if (hr >= 17 && hr < 22) return 'Good Evening';
    return 'Welcome';
  };

  return (
    <div className="space-y-6">
      {/* Unified Hero Widget (Visual Portrait, Greeting, Dual Action & Clocks, Bottom Shift Bar) */}
      <div className="rounded-3xl border border-brand-500/20 bg-white/95 dark:bg-zinc-950/95 shadow-sm overflow-hidden backdrop-blur-md">
        {/* Top Zone: Portrait, Greeting & Badges, Right Live Time & Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch justify-between relative min-h-[220px]">
          {/* Left: Sharp, Crisp Portrait (Natural Color, No Blur, No Fade Mask) */}
          <div className="relative w-full md:w-56 lg:w-64 shrink-0 h-52 md:h-auto overflow-hidden self-stretch border-b md:border-b-0 md:border-r border-brand-500/20 bg-zinc-100 dark:bg-zinc-900">
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={currentUser.name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center text-4xl font-extrabold">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Center: Greeting, Badges, Quote */}
          <div className="flex-1 p-6 flex flex-col justify-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
                <span className="ambizcon-gradient-text font-black">
                  {getGreetingPhrase()}!
                </span>{' '}
                Welcome back,
                <br className="hidden sm:inline" />
                <span className="font-extrabold text-foreground"> {currentUser.name}!</span>
              </h1>
            </div>

            {/* Badges Row with Ambizcon Brand Colors */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                {currentUser.role} • {currentUser.team}
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                {isAustralia ? 'Ambizcon (Brisbane HQ)' : 'Ambizcon Health (Chennai HQ)'}
              </span>
            </div>

            {/* Quote Pill */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm sm:text-base text-amber-800 dark:text-amber-200 font-bold shadow-xs">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                <span className="leading-snug">"{quote || 'Keep your goals in sight.'}"</span>
              </div>
            </div>
          </div>

          {/* Right: Divider + Live Time Clock & Action Buttons */}
          <div className="w-full md:w-68 lg:w-80 shrink-0 border-t md:border-t-0 md:border-l border-brand-500/20 p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-2.5">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                {digitalClock24 || '14:58:49'}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                {currentDateFormatted || 'Thursday 22 Oct'}
              </div>
            </div>

            {/* Daily Clock-In Login Timings & Live Running Hours Card */}
            <div
              className={`w-full rounded-2xl border p-2.5 transition-all text-left ${
                currentShift?.isWorking
                  ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20 shadow-xs'
                  : currentShift?.status === 'completed'
                  ? 'bg-zinc-100/80 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                  : 'bg-zinc-50/80 dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      currentShift?.isWorking
                        ? 'bg-emerald-500 animate-ping'
                        : currentShift?.status === 'completed'
                        ? 'bg-zinc-400'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      currentShift?.isWorking
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : currentShift?.status === 'completed'
                        ? 'text-zinc-600 dark:text-zinc-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {currentShift?.isWorking
                      ? 'Live Shift Active'
                      : currentShift?.status === 'completed'
                      ? 'Shift Completed'
                      : 'Shift Not Started'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {currentShift?.isWorking
                    ? `In: ${currentShift.clockIn}`
                    : currentShift?.status === 'completed'
                    ? `In: ${currentShift.clockIn}`
                    : 'Daily Shift'}
                </span>
              </div>

              {/* Live Running Timing */}
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {currentShift?.isWorking ? 'Live Worked Time:' : 'Worked Hours:'}
                </span>
                <span
                  className={`font-mono font-black text-base sm:text-lg tracking-tight ${
                    currentShift?.isWorking
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : currentShift?.status === 'completed'
                      ? 'text-foreground'
                      : 'text-muted-foreground/70'
                  }`}
                >
                  {currentShift?.isWorking
                    ? liveWorkedFormatted
                    : currentShift?.status === 'completed'
                    ? currentShift.workedHours || (liveWorkedSeconds > 0 ? liveWorkedFormatted : '0h 00m')
                    : '0h 00m 00s'}
                </span>
              </div>

              {previousCompletedSecondsToday > 0 && currentShift?.isWorking && (
                <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium text-right mt-0.5">
                  ⚡ Includes {Math.floor(previousCompletedSecondsToday / 3600)}h {String(Math.floor((previousCompletedSecondsToday % 3600) / 60)).padStart(2, '0')}m earlier today
                </div>
              )}

              {currentShift?.status === 'completed' && currentShift.clockOut && currentShift.clockOut !== '—' && currentShift.clockOut !== '-' && (
                <div className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                  Clocked out at: {currentShift.clockOut}
                </div>
              )}
            </div>

            <div className="w-full space-y-2 mt-0.5">
              <button
                type="button"
                onClick={handleClockToggle}
                disabled={clockingInProgress}
                className={`w-full font-bold text-sm py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  currentShift?.isWorking
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm ring-2 ring-rose-500/30'
                    : 'ambizcon-gradient hover:opacity-95 text-white shadow-glow'
                }`}
              >
                <Clock className={`h-4 w-4 ${currentShift?.isWorking ? 'animate-pulse' : ''}`} />
                <span>
                  {clockingInProgress
                    ? 'Updating...'
                    : currentShift?.isWorking
                    ? 'Clock Out'
                    : 'Clock In'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="w-full font-bold text-sm py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all border border-brand-500/30"
              >
                <Plus className="h-4 w-4 text-white" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Integrated Team View (Department Members) - Directly Below Clock In Button, Kept Inside Hero Card */}
        <div className="border-t border-brand-500/15 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 sm:p-5">
          <TeamPresenceOverviewPanel variant="hero-embed" />
        </div>

        {/* Bottom Bar: Dual Office Live Timings (Chennai, India • IST & Brisbane, Australia • AEST) */}
        <div className="ambizcon-gradient border-t border-brand-500/30 p-3 sm:p-4 shadow-sm text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* CHENNAI, INDIA • IST */}
            <div className="bg-black/35 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-200">
                  CHENNAI, INDIA • IST
                </span>
                <span className="text-xs text-white/70 font-medium mt-0.5">
                  India Headquarters
                </span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/20 border border-white/30 shadow-inner">
                <span className="font-mono text-lg sm:text-xl font-black text-white tracking-wider drop-shadow-sm">
                  {chennaiTime || '02:58:49 pm'}
                </span>
              </div>
            </div>

            {/* BRISBANE, AUSTRALIA • AEST */}
            <div className="bg-black/35 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex flex-col">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-sky-200">
                  BRISBANE, AUSTRALIA • AEST
                </span>
                <span className="text-xs text-white/70 font-medium mt-0.5">
                  Australia Branch
                </span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/20 border border-white/30 shadow-inner">
                <span className="font-mono text-lg sm:text-xl font-black text-white tracking-wider drop-shadow-sm">
                  {brisbaneTime || '07:28:49 pm'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: My Pending Tasks */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">My Pending Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{myAssignedTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Assigned to you</span>
        </Card>

        {/* Metric 2: Completed Today */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed Today</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{completedToday.length}</p>
          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
            {completedToday.length > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">{completedToday.length} completed during shift</span>
              </>
            ) : (
              <span>No tasks finished yet today</span>
            )}
          </span>
        </Card>

        {/* Metric 3: Overdue Tasks */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue Tasks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-500">{overdueTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Passed target deadline</span>
        </Card>

        {/* Metric 4: Pending Review */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Awaiting Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-foreground">{pendingReviewTasks.length}</p>
          <span className="text-[10px] text-muted-foreground mt-1 block">Awaiting Lead Signoff</span>
        </Card>
      </div>

      {/* Official Organization Announcements Section */}
      <Card className="p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Official Announcements</h3>
                {unreadAnnouncementsCount > 0 && (
                  <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5">
                    {unreadAnnouncementsCount} New Unread
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Company-wide broadcasts & team updates from leadership
              </p>
            </div>
          </div>
          <Link href="/announcements">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold hover:bg-brand-500/10">
              View All Announcements ({visibleAnnouncements.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No announcements published for your team yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleAnnouncements.slice(0, 3).map((ann) => {
              const isRead = currentUser ? isAnnouncementRead(ann.id, currentUser._id, visibleAnnouncements) : true;
              const hearts = getHeartLikesCount(ann);
              const thumbs = getThumbLikesCount(ann);
              return (
                <div
                  key={ann.id}
                  onClick={() => {
                    setSelectedAnnouncement(ann);
                    setIsAnnouncementDetailOpen(true);
                  }}
                  className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    !isRead
                      ? 'border-indigo-400/40 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs ring-1 ring-indigo-400/20 hover:border-indigo-500'
                      : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ann.pinned && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 gap-1">
                            <Pin className="h-3 w-3 fill-amber-500" />
                            Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {ann.applicableTo === 'All' ? '📢 All Teams' : `👥 ${ann.applicableTo}`}
                        </Badge>
                        {!isRead && (
                          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{ann.createdAt}</span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                        {ann.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={ann.authorAvatar}
                        name={ann.authorName}
                        userId={ann.authorId}
                        size="xs"
                        className="h-5 w-5 ring-1 ring-border text-[9px]"
                      />
                      <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                        {ann.authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-muted-foreground text-[11px]">
                      {hearts > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-500 font-semibold">
                          <Heart className="h-3 w-3 fill-rose-500" />
                          {hearts}
                        </span>
                      )}
                      {thumbs > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-blue-500 font-semibold">
                          <ThumbsUp className="h-3 w-3 fill-blue-500" />
                          {thumbs}
                        </span>
                      )}
                      {ann.comments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {ann.comments.length}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Hourly Work Slots & Task Progress Tracker (Admin view & My tab user view) */}
      <HourlyWorkTrackerPanel tasks={scopedTasks} />

      {/* Main Workspace Tasks & Deadlines Section (Full Width, Team View is now inside Top Hero Card) */}
      <div className="space-y-6">
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">My Assigned Workspace Tasks</h3>
                <p className="text-xs text-muted-foreground">
                  Tasks assigned directly to your account. Marking a task <strong>In Progress</strong> automatically adds it to your Hourly Work Slots above.
                </p>
              </div>
              <Link href="/kanban">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-brand-500">
                  Bizzy Board
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : myAssignedTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                🎉 All caught up! No pending tasks assigned to you right now.
              </div>
            ) : (
              <div className="space-y-3">
                {myAssignedTasks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => {
                      setSelectedTask(t);
                      setDetailModalOpen(true);
                    }}
                    className="group flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-[200px] flex-1">
                      <div className={`h-2.5 w-2.5 rounded-full ${getStatusBadgeColor(t.status)}`} />
                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.status !== 'In Progress' ? (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const updated = await updateTaskStatusAction(t._id, 'In Progress');
                            setTasks((prev) =>
                              prev.map((item) => (item._id === t._id ? updated || { ...item, status: 'In Progress' } : item))
                            );
                            toast.success(`"${t.title}" moved to In Progress & added to Hourly Work Slots!`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[10px] font-bold transition-all"
                        >
                          <Zap className="h-3 w-3" />
                          Start (In Progress)
                        </button>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                          ⚡ In Progress (Auto-Logged)
                        </Badge>
                      )}

                      <Badge variant="outline" className={`text-[10px] ${getPriorityBadgeColor(t.priority)}`}>
                        {t.priority}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{formatDate(t.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Deadlines */}
            <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Upcoming Deadlines
                </h3>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.map((t) => (
                  <div key={t._id} className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{t.team} Team</p>
                    </div>
                    <span className="font-mono text-[10px] text-amber-500 font-bold shrink-0">{formatDate(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Recent Workspace Activity
                </h3>
              </div>

              <div className="space-y-3">
                {recentActivity.map((t) => (
                  <div key={t._id} className="flex items-center gap-2.5 text-xs">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{t.title}</p>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatTimeAgo(t.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <AnnouncementDetailModal
            announcement={selectedAnnouncement}
            isOpen={isAnnouncementDetailOpen}
            onClose={() => {
              setIsAnnouncementDetailOpen(false);
              setSelectedAnnouncement(null);
            }}
            onUpdate={() => {
              setAnnouncementsList(getStoredAnnouncements());
            }}
          />
        )}
      </div>
    );
  }
