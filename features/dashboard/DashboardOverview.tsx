'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchTasksAction, updateTaskStatusAction } from '@/actions/taskActions';
import { Task } from '@/types';
import { getTimeBasedGreeting, getRandomQuote } from '@/lib/quotes';
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
  const [chennaiTime, setChennaiTime] = useState('');
  const [brisbaneTime, setBrisbaneTime] = useState('');

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

  useEffect(() => {
    if (!currentUser) return;
    const user = currentUser;
    async function loadCurrentShift() {
      try {
        const res = await fetch(
          `/api/attendance/current?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(
            user.name
          )}&userId=${encodeURIComponent(user._id)}`
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
    }
    loadCurrentShift();

    const timer = setInterval(() => {
      const now = new Date();
      setChennaiTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
      setBrisbaneTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Australia/Brisbane',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' AEST'
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

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

  return (
    <div className="space-y-6">
      {/* Time-Based Greeting Banner with Random Motivational Quote */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border ambizcon-hero-banner p-6 glass-panel">
        <div className="flex items-center gap-4">
          <Avatar
            src={currentUser.avatar}
            name={currentUser.name}
            userId={currentUser._id}
            email={currentUser.email}
            size="xl"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {timeGreeting.greeting} Welcome back, {currentUser.name}!
              </h1>
              <Badge variant="outline" className={`text-xs font-bold ${
                isAustralia
                  ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              }`}>
                {currentUser.role} • {currentUser.team}
              </Badge>
              {/* Registered Branch Logo Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold shadow-xs ${
                  isAustralia
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
                title={`Registered Branch: ${isAustralia ? 'Ambizcon (Brisbane HQ)' : 'Ambizcon Health (Chennai HQ)'}`}
              >
                {isAustralia ? (
                  <div className="h-4 w-4 rounded bg-white p-0.5 border border-sky-500/40 flex items-center justify-center shrink-0">
                    <img src="/ambizcon-australia-icon.png" alt="AUS" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <img
                    src="/ambizcon-logo.png"
                    alt="IND"
                    className="h-4 w-4 rounded object-cover border border-emerald-500/30 shrink-0"
                  />
                )}
                <span>{isAustralia ? '🇦🇺 Ambizcon (Brisbane HQ)' : '🇮🇳 Ambizcon Health (Chennai HQ)'}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              You have <span className="font-bold text-foreground">{myAssignedTasks.length} assigned tasks</span> pending on your workspace board today.
            </p>
            {/* Random Motivational Quote */}
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs text-amber-600 dark:text-amber-300 font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>"{quote || 'Make today amazing.'}"</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Real-time Shift & Attendance Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card/60 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              {currentShift?.isWorking && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  currentShift?.isWorking
                    ? 'bg-emerald-500'
                    : currentShift?.status === 'completed'
                    ? 'bg-zinc-400'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-bold text-foreground">
              {currentShift?.isWorking
                ? 'Live Shift Active'
                : currentShift?.status === 'completed'
                ? 'Shift Completed Today'
                : 'Not Clocked In Today'}
            </span>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>•</span>
            {currentShift?.isWorking ? (
              <span>
                Clocked In at{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {currentShift.clockIn}
                </strong>
              </span>
            ) : currentShift?.status === 'completed' ? (
              <span>
                Shift: In <strong className="font-mono text-foreground">{currentShift.clockIn}</strong> • Out{' '}
                <strong className="font-mono text-foreground">{currentShift.clockOut}</strong> ({currentShift.workedHours})
              </span>
            ) : (
              <span>
                {isAustralia
                  ? 'Office Shift: 8:30 AM – 5:00 PM AEST (Brisbane HQ, Australia)'
                  : 'Office Shift: 8:30 AM – 5:00 PM IST (Anna Nagar, Chennai)'}
              </span>
            )}
          </div>
        </div>

        {/* Dual Live World Clocks & Quick Action */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <div className="hidden sm:flex items-center gap-3">
            <span>
              CHENNAI <strong className="text-foreground">{chennaiTime || 'Loading...'}</strong>
            </span>
            <span>•</span>
            <span>
              BRISBANE <strong className="text-emerald-600 dark:text-emerald-400">{brisbaneTime || 'Loading...'}</strong>
            </span>
          </div>
          <Link href="/attendance">
            <Button
              size="sm"
              variant={currentShift?.isWorking ? 'outline' : 'default'}
              className={`h-8 text-xs font-bold gap-1.5 ${
                !currentShift?.isWorking ? 'ambizcon-gradient text-white shadow-glow' : ''
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {currentShift?.isWorking ? 'View Attendance' : 'Clock In Now'}
            </Button>
          </Link>
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
          <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> Great velocity today
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

      {/* Main Grid: Team Presence Overview (Check-in/Out + Reporting Manager + Department Members) + Assigned Tasks & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (1 Col): Zoho-Style Team Presence Overview Panel (Strictly Scoped to Their Team Only) */}
        <div className="lg:col-span-1">
          <TeamPresenceOverviewPanel />
        </div>

        {/* Right Column (2 Cols): My Active Assigned Tasks + Deadlines & Activity */}
        <div className="lg:col-span-2 space-y-6">
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
    </div>
  );
}
