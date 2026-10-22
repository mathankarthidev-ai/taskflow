'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { isTaskInCompany } from '@/lib/company-filter';
import { TeamPresenceOverviewPanel } from '@/components/dashboard/TeamPresenceOverviewPanel';
import { HourlyWorkTrackerPanel } from '@/components/dashboard/HourlyWorkTrackerPanel';

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
      const res = await fetch(
        `/api/attendance/current?email=${encodeURIComponent(currentUser.email)}&name=${encodeURIComponent(
          currentUser.name
        )}&userId=${encodeURIComponent(currentUser._id)}`
      );
      const data = await res.json();
      if (data.success && data.attendance) {
        setCurrentShift({
          isWorking: data.isWorking,
          clockIn: data.clockIn || '—',
          clockOut: data.clockOut || '—',
          status: data.status,
          workedHours: data.workedHours || '0h 00m',
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
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Clocked Out successfully! Shift completed.');
          setCurrentShift((prev) => ({
            isWorking: false,
            clockIn: prev?.clockIn || formattedNow,
            clockOut: data.clockOutTime || formattedNow,
            status: 'completed',
            workedHours: prev?.workedHours || '0h 00m',
          }));
          localStorage.setItem(
            `ambizcon_shift_${currentUser._id}`,
            JSON.stringify({
              shiftDate: todayKey,
              isClockedIn: false,
              clockInTime: currentShift?.clockIn || formattedNow,
              clockOutTime: data.clockOutTime || formattedNow,
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
          setCurrentShift({
            isWorking: true,
            clockIn: data.clockIn || formattedNow,
            clockOut: '—',
            status: 'working',
            workedHours: '0h 00m',
          });
          localStorage.setItem(
            `ambizcon_shift_${currentUser._id}`,
            JSON.stringify({
              shiftDate: todayKey,
              isClockedIn: true,
              clockInTime: data.clockIn || formattedNow,
              clockInTimestamp: Date.now(),
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
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3.5 py-1 text-xs text-amber-700 dark:text-amber-300 font-medium shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>"{quote || 'Stay inspired and keep creating.'}"</span>
              </div>
            </div>
          </div>

          {/* Right: Divider + Live Time Clock & Action Buttons */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 border-t md:border-t-0 md:border-l border-brand-500/20 p-6 flex flex-col items-center justify-center text-center gap-3">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
                {digitalClock24 || '14:58:49'}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                {currentDateFormatted || 'Thursday 22 Oct'}
              </div>
            </div>

            <div className="w-full space-y-2.5 mt-1">
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
                className="w-full font-bold text-sm py-2.5 px-4 rounded-xl bg-[#0b2545] hover:bg-[#07162c] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all border border-brand-500/20"
              >
                <Plus className="h-4 w-4 text-brand-300" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Integrated Team View (Department Members) - Directly Below Clock In Button, Kept Inside Hero Card */}
        <div className="border-t border-brand-500/15 bg-zinc-50/70 dark:bg-zinc-900/50 p-4 sm:p-5">
          <TeamPresenceOverviewPanel variant="hero-embed" />
        </div>

        {/* Bottom Bar (Theme Deep Blue #0b2545 with Shift Status, Clock-in Time & Dual World Clocks) */}
        <div className="bg-[#0b2545] border-t border-brand-500/20 p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* SHIFT STATUS */}
            <div className="bg-[#07162c] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 block">
                SHIFT STATUS
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    currentShift?.isWorking
                      ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20'
                      : currentShift?.status === 'completed'
                      ? 'bg-zinc-400'
                      : 'bg-zinc-500'
                  }`}
                />
                <span className="text-xs font-bold text-zinc-200">
                  {currentShift?.isWorking
                    ? 'Shift Active'
                    : currentShift?.status === 'completed'
                    ? 'Shift Completed'
                    : 'Shift not started'}
                </span>
              </div>
            </div>

            {/* CLOCKED IN AT */}
            <div className="bg-[#07162c] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 block">
                {isAustralia ? 'CLOCKED IN AT (AUSTRALIA TIME)' : 'CLOCKED IN AT (INDIA TIME)'}
              </span>
              <div className="mt-2">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-[#0b2545] border border-white/10 text-zinc-200 font-mono text-xs font-semibold">
                  {currentShift?.isWorking
                    ? currentShift.clockIn
                    : currentShift?.status === 'completed'
                    ? `In: ${currentShift.clockIn}`
                    : 'Not clocked in'}
                </span>
              </div>
            </div>

            {/* CHENNAI, INDIA • IST */}
            <div className="bg-[#07162c] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-brand-300 block">
                CHENNAI, INDIA • IST
              </span>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-brand-500/25 text-brand-200 border border-brand-500/40 shadow-[0_0_12px_rgba(8,96,117,0.45)] font-mono text-xs font-bold">
                  {chennaiTime || '02:58:49 pm'}
                </span>
              </div>
            </div>

            {/* BRISBANE, AUSTRALIA • AEST */}
            <div className="bg-[#07162c] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-center">
              <span className="text-[10px] font-bold tracking-wider uppercase text-sky-300 block">
                BRISBANE, AUSTRALIA • AEST
              </span>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 rounded-lg bg-sky-500/25 text-sky-200 border border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.35)] font-mono text-xs font-bold">
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
      </div>
    );
  }
