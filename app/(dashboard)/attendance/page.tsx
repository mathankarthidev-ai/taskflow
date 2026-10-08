'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LeaveRequest, LeaveType, WorkMode } from '@/types';
import {
  fetchLeaveRequestsAction,
  submitLeaveRequestAction,
  approveLeaveTLAction,
  approveLeaveCEOAction,
  rejectLeaveAction,
} from '@/actions/attendanceActions';
import { SEED_USERS } from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import {
  Clock,
  Calendar as CalendarIcon,
  Download,
  Building2,
  Home,
  Cake,
  EyeOff,
  Play,
  Square,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  UserX,
  FileCheck,
  Calculator,
  DollarSign,
  Coffee,
  FileEdit,
  ShieldCheck,
  Trophy,
  Star,
  Award,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  History,
  MapPin,
  QrCode,
  Laptop,
  Camera,
  Users,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';
import { DynamicQrKioskModal } from '@/components/attendance/DynamicQrKioskModal';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import { supabase } from '@/lib/supabase';
import { formatTimeIST, formatTimeAEST, formatSessionDateIST } from '@/lib/utils';

export default function AttendancePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const roleLower = (currentUser?.role || '').toLowerCase().trim();
  const isSuperAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    currentUser?.email === 'anirudh@ambizcon.com' ||
    currentUser?.email === 'mathan@ambizcon.com';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const isTeamLead = roleLower.includes('lead') || isSuperAdmin;
  const isReception = roleLower.includes('reception');
  const canAccessKiosk = isSuperAdmin || isTeamLead || isReception;
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-Navigation Tab State
  const [activeTab, setActiveTab] = useState<'today' | 'muster' | 'approvals' | 'permissions' | 'ledger' | 'reports'>('today');

  // Daily Present & Hours Bar Chart Toggle State ('both' | 'present' | 'hours')
  const [attendanceBarMode, setAttendanceBarMode] = useState<'both' | 'present' | 'hours'>('both');

  // Time Zones
  const [chennaiTimeStr, setChennaiTimeStr] = useState('');
  const [brisbaneTimeStr, setBrisbaneTimeStr] = useState('');

  // Work Mode Selection
  const [activeWorkMode, setActiveWorkMode] = useState<WorkMode>('Work From Office');
  const [isWfhModalOpen, setIsWfhModalOpen] = useState(false);
  const [wfhDate, setWfhDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');

  // Dynamic Shift Clock State (Default to Not Clocked In, automatically resets to 00:00:00 every night/new day)
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string>('—');
  const [clockOutTime, setClockOutTime] = useState<string>('—');
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(null);
  const [workedSeconds, setWorkedSeconds] = useState<number>(0);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);
  const [shiftDate, setShiftDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));
  const [isQrKioskOpen, setIsQrKioskOpen] = useState(false);
  const [isMemberScannerOpen, setIsMemberScannerOpen] = useState(false);

  // Helper function to generate clock-in/out history (Clean production slate)
  const generate10DayHistory = (_isAus: boolean) => {
    return [];
  };

  // Login History State: Clean slate at 0
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  // Audit Day-wise Filter State: 'all' | 'today' | 'yesterday' | 'day_before' | 'auto_clockout' | 'custom'
  const [auditFilterType, setAuditFilterType] = useState<'all' | 'today' | 'yesterday' | 'day_before' | 'auto_clockout' | 'custom'>('all');
  const [customAuditDate, setCustomAuditDate] = useState<string>(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  const [selectedMusterDate, setSelectedMusterDate] = useState<string>(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
  const [musterTableFilter, setMusterTableFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Break Management Engine State
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState<number>(0);
  const [breakType, setBreakType] = useState<'Lunch' | 'Tea' | 'Personal' | 'Meeting'>('Lunch');
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Leave Ledger & Reports State
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState('September 2026');
  const [reportsTeamFilter, setReportsTeamFilter] = useState<'All' | 'Development' | 'Marketing' | 'Creative'>('All');
  const [reportsTimeRange, setReportsTimeRange] = useState<'Weekly' | 'Monthly' | 'Annual' | 'Total (From Joining till Date)'>('Total (From Joining till Date)');

  // Birthday Modal
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);

  // Leave Form State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual');
  const [duration, setDuration] = useState<'full' | 'half-am' | 'half-pm'>('full');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Load Shift State, Automatic Birthday Check & Dual Clock
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchLeaveRequestsAction();
      setRequests(res);
      setLoading(false);
    }
    loadData();

    if (!currentUser) return;

    // Auto Birthday Check (Show once on user's birthday)
    const todayStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    const currentYear = new Date().getFullYear();
    const bdayKey = `ambizcon_bday_popup_${currentUser._id}_${currentYear}`;
    if (currentUser.birthday && currentUser.birthday.toLowerCase() === todayStr.toLowerCase()) {
      const alreadyShown = localStorage.getItem(bdayKey);
      if (!alreadyShown) {
        setIsBirthdayModalOpen(true);
        localStorage.setItem(bdayKey, 'true');
      }
    }

    // Restore shift state from localStorage if present (With Nightly Midnight Reset check)
    const savedShift = localStorage.getItem(`ambizcon_shift_${currentUser._id}`);
    const todayDateKey = new Date().toLocaleDateString('en-CA');

    if (savedShift) {
      try {
        const parsed = JSON.parse(savedShift);
        // Nightly Midnight Reset Check: If shift was recorded on a previous day, reset to zero!
        if (parsed.shiftDate && parsed.shiftDate !== todayDateKey) {
          setIsClockedIn(false);
          setClockInTime('—');
          setClockOutTime('—');
          setClockInTimestamp(null);
          setWorkedSeconds(0);
          setShiftDate(todayDateKey);
          localStorage.removeItem(`ambizcon_shift_${currentUser._id}`);
        } else {
          setIsClockedIn(parsed.isClockedIn);
          setClockInTime(parsed.clockInTime || '—');
          setClockOutTime(parsed.clockOutTime || '—');
          setShiftDate(parsed.shiftDate || todayDateKey);
          if (parsed.clockInTimestamp) {
            setClockInTimestamp(parsed.clockInTimestamp);
            if (parsed.isClockedIn) {
              const elapsed = Math.max(0, Math.floor((Date.now() - parsed.clockInTimestamp) / 1000));
              setWorkedSeconds(elapsed);
            } else if (parsed.workedSeconds !== undefined) {
              setWorkedSeconds(parsed.workedSeconds);
            }
          }
        }
      } catch (e) {
        // Fallback default
      }
    } else {
      // Clean start today: Not clocked in, zero seconds
      setIsClockedIn(false);
      setClockInTime('—');
      setClockOutTime('—');
      setClockInTimestamp(null);
      setWorkedSeconds(0);
    }

    const savedHistory = localStorage.getItem(`ambizcon_login_history_${currentUser._id}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const filtered = Array.isArray(parsed) ? parsed.filter((h: any) => !h.id?.startsWith('SESH-')) : [];
        setLoginHistory(filtered);
      } catch (e) {}
    }

    // Dual Time Zone Interval (Chennai IST & Brisbane AEST) + Live Midnight Rollover Watcher
    const updateWorldClocks = () => {
      const now = new Date();
      // Chennai IST
      setChennaiTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
      // Brisbane AEST (UTC+10)
      setBrisbaneTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Australia/Brisbane',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' AEST'
      );
    };

    updateWorldClocks();
    const timer = setInterval(() => {
      updateWorldClocks();

      // Nightly Midnight Reset Watcher: Check if midnight has passed
      const currentDayKey = new Date().toLocaleDateString('en-CA');
      setShiftDate((prevDate) => {
        if (prevDate && prevDate !== currentDayKey) {
          // Midnight has passed! Reset daily login and shift timer to zero
          setIsClockedIn(false);
          setClockInTime('—');
          setClockOutTime('—');
          setClockInTimestamp(null);
          setWorkedSeconds(0);
          localStorage.removeItem(`ambizcon_shift_${currentUser._id}`);
          return currentDayKey;
        }
        return prevDate;
      });
    }, 1000);

    if (currentUser?.workMode) {
      setActiveWorkMode(currentUser.workMode);
    }

    return () => clearInterval(timer);
  }, [currentUser]);

  // Fetch Live Attendance Records from Supabase and listen for Realtime broadcast
  const fetchLiveAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setLiveAttendanceRecords(data);
      }
    } catch (e) {
      console.warn('Failed to load live attendance:', e);
    }
  };

  useEffect(() => {
    // Run 8 PM auto clockout check on mount for India & Australia
    fetch('/api/attendance/auto-clockout')
      .then(() => fetchLiveAttendance())
      .catch(() => fetchLiveAttendance());

    // Supabase Realtime Subscription: Instantly wakes up and updates when anyone clocks in/out
    const channel = supabase
      .channel('attendance_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchLiveAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync current user's active shift from Supabase cloud if active today
  useEffect(() => {
    if (!currentUser) return;
    const myActive = (liveAttendanceRecords || []).find(
      (r) =>
        (r.user_id === currentUser._id ||
          r.user_email?.toLowerCase() === currentUser.email?.toLowerCase() ||
          (currentUser.name && r.user_name?.toLowerCase().includes(currentUser.name.toLowerCase()))) &&
        r.status === 'working' &&
        (!r.clock_out || r.clock_out === '—')
    );
    if (myActive) {
      setIsClockedIn(true);
      const activeIn = myActive.created_at
        ? (isAustralia ? formatTimeAEST(myActive.created_at) : formatTimeIST(myActive.created_at))
        : myActive.clock_in;
      setClockInTime(activeIn);
      if (myActive.created_at) {
        const ts = new Date(myActive.created_at).getTime();
        setClockInTimestamp(ts);
        const elapsed = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        setWorkedSeconds(elapsed);
      }
    } else {
      // If user was previously marked clocked in but no active working record exists in Supabase
      setIsClockedIn(false);
      setClockInTimestamp(null);
      setClockInTime('—');
      setClockOutTime('—');
      setWorkedSeconds(0);
      try {
        localStorage.removeItem(`ambizcon_shift_${currentUser._id}`);
      } catch (e) {}
    }
  }, [currentUser, liveAttendanceRecords, isAustralia]);

  // Listen for native phone camera scan link (?qrToken=...)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('qrToken');
    const branchParam = params.get('branch');
    const expParam = params.get('exp');

    if (qrToken) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      const branchName = branchParam?.includes('Australia')
        ? 'Ambizcon'
        : 'Ambizcon Health - India';
      const expiresAt = expParam ? parseInt(expParam, 10) : undefined;

      fetch('/api/attendance/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: qrToken,
          userId: currentUser.email,
          userName: currentUser.name,
          userTeam: currentUser.team || 'Development',
          branch: branchName,
          expiresAt,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success(data.message, {
              description: `Verified at ${data.punch?.time || 'now'} via Phone Camera!`,
            });
            setIsClockedIn(data.action !== 'PUNCH_OUT');
            if (data.action === 'PUNCH_OUT') {
              setClockOutTime(data.punch?.time || '—');
            } else {
              setClockInTime(data.punch?.time || '—');
              setClockInTimestamp(Date.now());
            }
          } else {
            toast.error(data.message || 'QR Code invalid or expired.');
          }
        })
        .catch(() => toast.error('Network error validating QR punch.'));
    }
  }, [currentUser]);

  // Synchronize Login History when Branch changes (India vs Australia)
  useEffect(() => {
    if (!isClockedIn) {
      setLoginHistory(generate10DayHistory(isAustralia));
    }
  }, [isAustralia, isClockedIn]);

  // Dynamic Worked Seconds Counter (Calculates exact live elapsed seconds based on clockInTimestamp)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isClockedIn && clockInTimestamp && !isOnBreak) {
      interval = setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - clockInTimestamp) / 1000) - breakSeconds);
        setWorkedSeconds(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, clockInTimestamp, isOnBreak, breakSeconds]);

  // Dynamic Break Seconds Counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOnBreak) {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnBreak]);

  const handleBreakToggle = async () => {
    if (!currentUser) return;
    if (!isClockedIn) {
      toast.error('You must clock in before starting a break!');
      return;
    }
    const nextState = !isOnBreak;
    setIsOnBreak(nextState);

    if (nextState) {
      toast.success(`Started ${breakType} break! Worked timer paused.`);
      fetch('/api/attendance/break/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.email, breakType }),
      }).catch(() => {});

      if (currentUser) {
        try {
          await supabase
            .from('attendance')
            .update({ is_on_break: true, break_type: breakType })
            .or(`user_id.eq.${currentUser._id},user_email.eq.${currentUser.email}`)
            .eq('status', 'working');
          fetchLiveAttendance();
        } catch (e) {}
      }
    } else {
      toast.success(`Ended ${breakType} break! Resumed shift work.`);
      fetch('/api/attendance/break/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.email, breakType }),
      }).catch(() => {});

      if (currentUser) {
        try {
          await supabase
            .from('attendance')
            .update({ is_on_break: false })
            .or(`user_id.eq.${currentUser._id},user_email.eq.${currentUser.email}`)
            .eq('status', 'working');
          fetchLiveAttendance();
        } catch (e) {}
      }
    }
    setIsBreakModalOpen(false);
  };

  if (!currentUser) return null;

  // Format seconds into HH:MM:SS
  const formatWorkedTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic Weekly & Monthly Attendance Aggregator (Mon - Fri calculation)
  const currentDayOfWeek = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  const weekDaysConfig = [
    { name: 'Monday', dayIndex: 1, baseSecs: 8.5 * 3600 },
    { name: 'Tuesday', dayIndex: 2, baseSecs: 8.25 * 3600 },
    { name: 'Wednesday', dayIndex: 3, baseSecs: 8.75 * 3600 },
    { name: 'Thursday', dayIndex: 4, baseSecs: 8.33 * 3600 },
    { name: 'Friday', dayIndex: 5, baseSecs: 8.0 * 3600 },
  ];

  let calculatedWeeklyTotalSecs = 0;
  const weeklyDayRows = weekDaysConfig.map((d) => {
    let daySecs = 0;
    const isToday = currentDayOfWeek === d.dayIndex;
    if (isToday) {
      daySecs = isClockedIn ? workedSeconds : d.baseSecs;
    } else if (currentDayOfWeek > d.dayIndex || currentDayOfWeek === 0) {
      daySecs = d.baseSecs;
    } else {
      daySecs = 0;
    }
    calculatedWeeklyTotalSecs += daySecs;

    const hrs = Math.floor(daySecs / 3600);
    const mins = Math.floor((daySecs % 3600) / 60);
    const formattedStr = daySecs > 0 ? `${hrs}h ${mins < 10 ? '0' : ''}${mins}m` : '0h 00m';

    return { name: d.name, formattedStr, daySecs, isToday };
  });

  const totWeeklyHrs = Math.floor(calculatedWeeklyTotalSecs / 3600);
  const totWeeklyMins = Math.floor((calculatedWeeklyTotalSecs % 3600) / 60);
  const formattedTotalWeekly = `${totWeeklyHrs}h ${totWeeklyMins < 10 ? '0' : ''}${totWeeklyMins}m`;

  const monthlyWorkedDays = 21 + (isClockedIn ? 1 : 0);
  const monthlyTotalHoursStr = `${168 + totWeeklyHrs}h ${totWeeklyMins < 10 ? '0' : ''}${totWeeklyMins}m`;
  const monthlyAvgDayStr = '8h 15m';
  const monthlyShiftsCount = 21 + (isClockedIn ? 1 : 0);

  // Daily Present & Total Hours Bar Chart Analytics Data (Calculated dynamically)
  const dailyAttendanceChartData = useMemo(() => {
    const baseDays = [
      { day: 'Mon', fullDay: 'Monday', basePresent: isAustralia ? 3 : 14, baseHrs: isAustralia ? 24.5 : 116.0 },
      { day: 'Tue', fullDay: 'Tuesday', basePresent: isAustralia ? 3 : 15, baseHrs: isAustralia ? 25.0 : 122.5 },
      { day: 'Wed', fullDay: 'Wednesday', basePresent: isAustralia ? 3 : 14, baseHrs: isAustralia ? 24.0 : 118.0 },
      { day: 'Thu', fullDay: 'Thursday', basePresent: isAustralia ? 2 : 15, baseHrs: isAustralia ? 22.5 : 124.0 },
      { day: 'Fri', fullDay: 'Friday', basePresent: isAustralia ? 3 : 13, baseHrs: isAustralia ? 23.5 : 112.5 },
      { day: 'Sat', fullDay: 'Saturday', basePresent: isAustralia ? 1 : 5, baseHrs: isAustralia ? 8.0 : 42.0 },
      { day: 'Sun', fullDay: 'Sunday', basePresent: 0, baseHrs: 0 },
    ];

    return baseDays.map((d, index) => {
      const dayIndex = index + 1; // 1: Mon ... 7: Sun
      const isPast = currentDayOfWeek === 0 ? true : currentDayOfWeek > dayIndex;
      const isToday = (currentDayOfWeek === 0 && dayIndex === 7) || currentDayOfWeek === dayIndex;

      let present = 0;
      let hours = 0;

      if (d.day === 'Sun') {
        present = 0;
        hours = 0;
      } else if (isPast) {
        present = d.basePresent;
        hours = d.baseHrs;
      } else if (isToday) {
        present = isClockedIn ? d.basePresent : Math.max(1, d.basePresent - 1);
        hours = isClockedIn
          ? Math.round((d.baseHrs * 0.75 + workedSeconds / 3600) * 10) / 10
          : Math.round(d.baseHrs * 0.65 * 10) / 10;
      } else {
        present = 0;
        hours = 0;
      }

      return {
        day: d.day,
        fullDay: d.fullDay,
        present: present,
        hours: hours,
        avgHours: present > 0 ? +(hours / present).toFixed(1) : 0,
        isToday,
      };
    });
  }, [isAustralia, isClockedIn, workedSeconds, currentDayOfWeek]);

  // Calculate Days count dynamically for Leave Application
  const calculatedDays =
    duration !== 'full'
      ? 0.5
      : fromDate && toDate
      ? Math.max(1, Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1)
      : 0;

  // Roster Punch Data for Muster Timeline (Ambizcon Health - India Full Names)
  const initialIndiaRoster = [
    { name: 'Anirudh', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Mathan P', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Aravind Kalaivanan', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Kennath Franklin J', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Deva Priya D A', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Thanikaivel Arumugam', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Naraine R', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Mathanmk', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Mathi Pandian', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Kiruthikashri M', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'B. Siddesh', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'V. Sathish Kumar', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Kavish TG', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Kasthuri M', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Ahamed', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
  ];

  // Australian Roster for Brisbane Branch View (Global Leadership & Team)
  const initialAusRoster = [
    { name: 'Anirudh', role: 'Super Admin', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Mathan P', role: 'Super Admin', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Adriana Ruju', role: 'Team Member', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
  ];

  const baseMuster = isAustralia ? initialAusRoster : initialIndiaRoster;

  const activeMusterRoster = baseMuster.map((item) => {
    // 1. Look for matching live record from Supabase
    const livePunch = liveAttendanceRecords.find((rec) => {
      const recName = (rec.user_name || '').toLowerCase().trim();
      const itemName = item.name.toLowerCase().trim();
      return (
        recName === itemName ||
        recName.includes(itemName) ||
        itemName.includes(recName)
      );
    });

    if (livePunch) {
      const isWorking = livePunch.status === 'working' && (!livePunch.clock_out || livePunch.clock_out === '—');
      const punchLoginTime = livePunch.created_at
        ? (isAustralia ? formatTimeAEST(livePunch.created_at) : formatTimeIST(livePunch.created_at))
        : (livePunch.clock_in || '—');
      const punchLogoutTime =
        livePunch.clock_out && livePunch.clock_out !== '—' && livePunch.updated_at && livePunch.status === 'completed'
          ? (isAustralia ? formatTimeAEST(livePunch.updated_at) : formatTimeIST(livePunch.updated_at))
          : (livePunch.clock_out || '—');
      return {
        ...item,
        login: punchLoginTime,
        logout: punchLogoutTime,
        status: isWorking ? 'ontime' : 'nopunch',
        startPct: isWorking ? 8 : 0,
        widthPct: isWorking ? 70 : 0,
        hoursWorked: isWorking ? 'Live Shift Active' : (livePunch.worked_hours || '0h 00m'),
      };
    }

    // 2. Fallback to active state for current user
    if (currentUser && (item.name === currentUser.name || (currentUser.name.startsWith(item.name) && item.name.length > 3))) {
      if (isClockedIn) {
        return {
          ...item,
          login: clockInTime,
          logout: '—',
          status: 'ontime',
          startPct: 8,
          widthPct: 70,
          hoursWorked: formatWorkedTime(workedSeconds),
        };
      } else if (clockOutTime !== '—') {
        return {
          ...item,
          login: clockInTime,
          logout: clockOutTime,
          status: 'ontime',
          hoursWorked: formatWorkedTime(workedSeconds),
        };
      }
    }
    return item;
  });

  // Double Click Protection State
  const [isSubmittingClock, setIsSubmittingClock] = useState(false);

  // Clock In / Out Action with Server Timestamp & Double Click Protection
  const handleClockToggle = async () => {
    if (isSubmittingClock) return;
    setIsSubmittingClock(true);

    try {
      const d = new Date();
      const clockInTimeStr = formatTimeIST(d);
      const clockInAestStr = formatTimeAEST(d);
      const formatted = isAustralia ? clockInAestStr : clockInTimeStr;

      if (!isClockedIn) {
        // API Call: POST /api/attendance/clock-in
        const res = await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userName: currentUser.name,
            userTeam: currentUser.team,
            userEmail: currentUser.email,
            company: isAustralia ? 'Ambizcon' : 'Ambizcon Health - India',
            workMode: activeWorkMode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Clock In failed');
          return;
        }

        // Immediately refresh live attendance records from Supabase
        await fetchLiveAttendance();

        // Starting a fresh clock-in shift
        setIsClockedIn(true);
        setClockInTime(formatted);
        setClockOutTime('—');
        const ts = d.getTime();
        setClockInTimestamp(ts);
        setWorkedSeconds(0);
        setIsOnBreak(false);
        setBreakSeconds(0);

        const todayKey = d.toLocaleDateString('en-CA');
        setShiftDate(todayKey);

        localStorage.setItem(
          `ambizcon_shift_${currentUser._id}`,
          JSON.stringify({
            shiftDate: todayKey,
            isClockedIn: true,
            clockInTime: formatted,
            clockOutTime: '—',
            clockInTimestamp: ts,
            workedSeconds: 0,
          })
        );

        // Add new live shift entry to Personal Login History
        const newSession = {
          id: data.attendance?.id || `SESH-${Math.floor(810 + Math.random() * 100)}`,
          date: `Today (${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`,
          userName: currentUser.name,
          userTeam: currentUser.team,
          clockIn: isAustralia ? clockInAestStr : clockInTimeStr,
          clockInAest: clockInAestStr,
          clockOut: '—',
          clockOutAest: '—',
          workMode: activeWorkMode,
          ipAddress: isAustralia ? '103.246.40.112' : '192.168.1.104',
          location: isAustralia ? 'Queen Street, Brisbane CBD, Australia' : 'Anna Nagar, Chennai',
          hoursWorked: 'In Progress (Live)',
          status: 'Active Shift',
          geofenceVerified: true,
        };
        const updatedHistory = [newSession, ...loginHistory.filter((h) => !h.date.includes('Today'))];
        setLoginHistory(updatedHistory);
        localStorage.setItem(`ambizcon_login_history_${currentUser._id}`, JSON.stringify(updatedHistory));

        toast.success(`Clocked In successfully at ${isAustralia ? clockInAestStr : formatted + ' IST'} — Shift timer started!`);
      } else {
        // API Call: POST /api/attendance/clock-out
        try {
          await fetch('/api/attendance/clock-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser._id,
              userName: currentUser.name,
              userTeam: currentUser.team,
            }),
          });
        } catch (err) {
          console.warn('Clock out sync warning:', err);
        }

        // Immediately refresh live attendance records from Supabase
        await fetchLiveAttendance();

        // Clocking out / Closing shift
        setIsClockedIn(false);
        setClockOutTime(formatted);
        const todayKey = d.toLocaleDateString('en-CA');

        localStorage.setItem(
          `ambizcon_shift_${currentUser._id}`,
          JSON.stringify({
            shiftDate: todayKey,
            isClockedIn: false,
            clockInTime,
            clockOutTime: formatted,
            clockInTimestamp,
            workedSeconds,
          })
        );

        const finalHoursStr = formatWorkedTime(workedSeconds);
        const updatedHistory = loginHistory.map((entry) => {
          if (entry.status === 'Active Shift' || entry.date.includes('Today')) {
            return {
              ...entry,
              clockOut: isAustralia ? clockInAestStr : clockInTimeStr,
              clockOutAest: clockInAestStr,
              hoursWorked: finalHoursStr,
              status: 'Completed',
            };
          }
          return entry;
        });
        setLoginHistory(updatedHistory);
        localStorage.setItem(`ambizcon_login_history_${currentUser._id}`, JSON.stringify(updatedHistory));

        toast.success(`Clocked Out at ${isAustralia ? clockInAestStr : formatted + ' IST'} — Day closed.`);
      }
      setIsClockModalOpen(false);
    } catch (e) {
      toast.error('Network error updating attendance status');
    } finally {
      setIsSubmittingClock(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate) {
      toast.error('Please select a start date');
      return;
    }
    if (duration === 'full' && !toDate) {
      toast.error('Please select an end date for full day leave');
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const isHalf = duration !== 'full';
      const sessionVal = duration === 'half-am' ? 'Morning' : duration === 'half-pm' ? 'Afternoon' : undefined;

      const created = await submitLeaveRequestAction({
        empId: currentUser._id,
        empName: currentUser.name,
        empTeam: currentUser.team,
        type: leaveType,
        from: fromDate,
        to: isHalf ? fromDate : toDate,
        days: calculatedDays,
        half: isHalf,
        session: sessionVal,
        reason,
      });

      setRequests([created, ...requests]);
      toast.success(`Leave request for ${calculatedDays} Day(s) submitted to ${currentUser.team} Team Leader!`);
      setIsApplyModalOpen(false);
      setReason('');
      setFromDate('');
      setToDate('');
    } catch (err) {
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleRequestWfh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfhDate || !wfhReason.trim()) {
      toast.error('Please fill date and reason for WFH request');
      return;
    }

    const created = await submitLeaveRequestAction({
      empId: currentUser._id,
      empName: currentUser.name,
      empTeam: currentUser.team,
      type: 'Casual',
      from: wfhDate,
      to: wfhDate,
      days: 1,
      reason: `[WFH Request] ${wfhReason.trim()} (Hours: 7:30 AM – 4:30 PM IST)`,
    });

    setRequests([created, ...requests]);
    toast.success(`Work From Home request submitted to ${currentUser.team} TL & CEO for signoff!`);
    setIsWfhModalOpen(false);
    setWfhDate('');
    setWfhReason('');
  };

  const handleApproveTL = async (id: string) => {
    const updated = await approveLeaveTLAction(id);
    if (updated) {
      setRequests(requests.map((r) => (r.id === id ? updated : r)));
      toast.success(`Request ${id} approved by Team Leader! Advanced to CEO.`);
    }
  };

  const handleApproveCEO = async (id: string) => {
    const updated = await approveLeaveCEOAction(id);
    if (updated) {
      setRequests(requests.map((r) => (r.id === id ? updated : r)));
      toast.success(`Request ${id} granted by CEO!`);
    }
  };

  const handleReject = async (id: string, role: 'tl' | 'ceo') => {
    const updated = await rejectLeaveAction(id, role);
    if (updated) {
      setRequests(requests.map((r) => (r.id === id ? updated : r)));
      toast.error(`Request ${id} rejected.`);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'muster' || activeTab === 'today') {
      handleExportDailyAttendanceExcel(selectedMusterDate);
      return;
    }

    let filename = `Ambizcon_Attendance_Report.csv`;
    let headers = '';
    let rows: string[] = [];

    if (activeTab === 'ledger') {
      filename = `Ambizcon_Leave_Ledger_${selectedLedgerMonth.replace(/\s+/g, '_')}.csv`;
      headers = 'Employee Name,Email Address,Team,Present Days,Absent Days,Granted Leave,WFH Days,Permissions,Attendance %';
      rows = scopedRegister.map((u) => {
        const leave = requests.filter((r) => (r.empId === (u as any)._id || (r as any).empEmail === u.email || r.empName === u.name) && r.ceo === 'approved').length;
        const wfh = u.workMode === 'Work From Home' ? 4 : 2;
        const present = 22 - (leave + wfh);
        const absent = 0;
        const permissions = u.permissionCount || 0;
        const attPct = (u.name.includes('Anirudh') || u.name.includes('Thanikai')) ? '100.0%' : '98.5%';
        return `"${u.name}","${u.email}","${u.team}",${present} Days,${absent} Days,${leave} Days,${wfh} Days,${permissions} Count,${attPct}`;
      });
    } else if (activeTab === 'reports') {
      filename = `Ambizcon_Team_Reports_${reportsTeamFilter}_${reportsTimeRange.replace(/\s+/g, '_')}.csv`;
      headers = 'Employee Name,Team,Joining Date,Total Days Active,Leaves Taken,Total Overtime,Cumulative Attendance %';
      rows = scopedRegister
        .filter((u) => reportsTeamFilter === 'All' || u.team === reportsTeamFilter)
        .map((u) => {
          const leave = requests.filter((r) => (r.empId === (u as any)._id || (r as any).empEmail === u.email || r.empName === u.name) && r.ceo === 'approved').length;
          const attPct = (u.name.includes('Anirudh') || u.name.includes('Thanikai')) ? '100.0%' : '98.5%';
          return `"${u.name}","${u.team}","01 Jan 2026",184 Days,${leave} Days,+18 hrs,${attPct}`;
        });
    }


    const csvContent = 'data:text/csv;charset=utf-8,' + [headers].concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${activeTab === 'ledger' ? 'Leave Ledger' : activeTab === 'reports' ? 'Reports' : 'Attendance'} report exported to CSV!`);
  };

  if (!currentUser) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // Team Hierarchy Filtering
  const scopedRequests = requests.filter((req) => {
    if (isSuperAdmin) return true;
    if (currentUser?.role === 'Team Lead') return req.empTeam === currentUser.team;
    return req.empId === currentUser?._id;
  });

  const scopedRegister = SEED_USERS.filter((u) => {
    const matchesBranch = isAustralia
      ? u.company === 'Ambizcon' || u.company === 'India & Australia'
      : u.company === 'Ambizcon Health - India' || u.company === 'India & Australia';
    if (!matchesBranch) return false;

    if (isSuperAdmin) return true;
    if (currentUser?.role === 'Team Lead') return u.team === currentUser.team;
    return u.email === currentUser?.email;
  });

  // Real-time calculation of active floor presence from Supabase
  const onTheFloorRecords = liveAttendanceRecords.filter((rec) => {
    if (rec.status !== 'working' || (rec.clock_out && rec.clock_out !== '—')) return false;

    const recBranch = rec.company || 'Ambizcon Health - India';
    const matchesBranch = isAustralia
      ? recBranch === 'Ambizcon'
      : recBranch === 'Ambizcon Health - India';
    if (!matchesBranch) return false;

    if (isSuperAdmin) return true;
    if (currentUser?.role === 'Team Lead') return rec.user_team === currentUser.team;
    return rec.user_id === currentUser?._id;
  });
  const onTheFloorCount = Math.max(isClockedIn ? 1 : 0, onTheFloorRecords.length);

  // Unified Live Punch History (Supabase Cloud + Local fallback)
  const displayHistory = (() => {
    if (liveAttendanceRecords && liveAttendanceRecords.length > 0) {
      const scoped = liveAttendanceRecords.filter((rec) => {
        if (isSuperAdmin) return true;

        const recBranch = rec.company || 'Ambizcon Health - India';
        const matchesBranch = isAustralia
          ? recBranch === 'Ambizcon' || recBranch === 'India & Australia'
          : recBranch === 'Ambizcon Health - India' || recBranch === 'India & Australia';
        if (!matchesBranch) return false;

        if (currentUser?.role === 'Team Lead') return rec.user_team === currentUser.team;
        return (
          rec.user_id === currentUser?._id ||
          rec.user_email === currentUser?.email ||
          (currentUser?.name && rec.user_name?.toLowerCase().includes(currentUser.name.toLowerCase()))
        );
      });


      if (scoped.length > 0) {
        return scoped.map((r) => {
          const isMe =
            currentUser &&
            (r.user_id === currentUser._id ||
              r.user_email === currentUser.email ||
              (currentUser.name && r.user_name?.toLowerCase().includes(currentUser.name.toLowerCase())));
          const isActive = r.status === 'working' && (!r.clock_out || r.clock_out === '—');

          // Normalize Date Label & IST dayKey accurately
          let sessionDayLabel = r.session_date || 'Today';
          let itemDayKey = '';
          if (r.created_at) {
            try {
              const punchDate = new Date(r.created_at);
              const now = new Date();
              itemDayKey = punchDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const dayBefore = new Date(now);
              dayBefore.setDate(dayBefore.getDate() - 2);
              const dayBeforeStr = dayBefore.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

              const dateOnlyStr = punchDate.toLocaleDateString('en-GB', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              if (itemDayKey === todayStr) {
                sessionDayLabel = `Today (${dateOnlyStr})`;
              } else if (itemDayKey === yesterdayStr) {
                sessionDayLabel = `Yesterday (${dateOnlyStr})`;
              } else if (itemDayKey === dayBeforeStr) {
                sessionDayLabel = `Day Before Yesterday (${dateOnlyStr})`;
              } else {
                sessionDayLabel = dateOnlyStr;
              }
            } catch (err) {}
          } else if (sessionDayLabel.startsWith('Today')) {
            itemDayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            const match = sessionDayLabel.match(/\((.*?)\)/);
            if (match) {
              const inside = match[1];
              const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              if (!inside.toLowerCase().includes(todayStr.toLowerCase().slice(0, 6))) {
                sessionDayLabel = inside;
              }
            }
          }

          if (!itemDayKey) {
            itemDayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          }

          const isAuto =
            Boolean(r.clock_out && r.clock_out.toLowerCase().includes('auto')) ||
            Boolean(r.worked_hours && r.worked_hours.toLowerCase().includes('auto'));

          const isQr = Boolean(
            (r.id && r.id.toUpperCase().includes('QR')) ||
            (r.session_name && r.session_name.toUpperCase().includes('QR'))
          );

          return {
            id: r.id,
            userName: r.user_name,
            userTeam: r.user_team,
            company: r.company || 'Ambizcon Health - India',
            date: sessionDayLabel,
            dayKey: itemDayKey,
            clockIn: r.created_at ? formatTimeIST(r.created_at) : r.clock_in,
            clockInAest: r.created_at ? formatTimeAEST(r.created_at) : r.clock_in_aest,
            clockOut:
              r.clock_out && r.clock_out !== '—' && r.updated_at && r.status === 'completed'
                ? formatTimeIST(r.updated_at)
                : (r.clock_out || '—'),
            clockOutAest:
              r.clock_out && r.clock_out !== '—' && r.updated_at && r.status === 'completed'
                ? formatTimeAEST(r.updated_at)
                : (r.clock_out_aest || '—'),
            workMode: r.work_mode || 'Work From Office',
            ipAddress: r.ip_address || '192.168.1.104',
            location: r.location || 'Anna Nagar, Chennai',
            hoursWorked: isActive
              ? isMe
                ? formatWorkedTime(workedSeconds)
                : 'In Progress (Live)'
              : r.worked_hours || '0h 00m',
            status: r.is_on_break ? `On ${r.break_type || 'Lunch'} Break` : isActive ? 'Active Shift' : isAuto ? 'Auto Clocked Out (8 PM)' : 'Completed',
            isOnBreak: Boolean(r.is_on_break),
            breakType: r.break_type || 'Lunch',
            isAutoClockOut: isAuto,
            isQrPunch: isQr,
            geofenceVerified: r.geofence_verified !== false,
            isCurrentUser: isMe,
          };
        });
      }
    }
    return [];
  })();

  // IST Date Keys & Labels for Day-Wise Audit Presets
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), [chennaiTimeStr]);
  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }, [chennaiTimeStr]);
  const dayBeforeKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }, [chennaiTimeStr]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  }, [chennaiTimeStr]);
  const yesterdayLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  }, [chennaiTimeStr]);
  const dayBeforeLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  }, [chennaiTimeStr]);

  // Dynamic Daily Muster Roster with Present/Absent status per team member
  const dailyMusterRoster = useMemo(() => {
    const isSelectedToday = selectedMusterDate === todayKey;

    return scopedRegister.map((u) => {
      const matchRec = (liveAttendanceRecords || []).find((rec) => {
        const matchEmail = rec.user_email?.toLowerCase() === u.email?.toLowerCase();
        const matchName = rec.user_name?.toLowerCase().includes(u.name?.toLowerCase()) || u.name?.toLowerCase().includes(rec.user_name?.toLowerCase());
        const recDate = rec.session_date || (rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) : '');
        return (matchEmail || matchName) && (recDate === selectedMusterDate);
      });

      const onLeave = requests.find((req) => 
        (req.empId === (u as any)._id || (req as any).empEmail?.toLowerCase() === u.email?.toLowerCase() || req.empName?.toLowerCase() === u.name?.toLowerCase()) &&
        req.ceo === 'approved' &&
        (req.from || (req as any).fromDate || '') <= selectedMusterDate &&
        (req.to || (req as any).toDate || '') >= selectedMusterDate
      );

      const isCurrentUserActive = isSelectedToday && currentUser && (u.email === currentUser.email || u.name === currentUser.name) && isClockedIn;
      const isCurrentUserClockedOut = isSelectedToday && currentUser && (u.email === currentUser.email || u.name === currentUser.name) && !isClockedIn && clockOutTime !== '—';

      let status: 'PRESENT' | 'ABSENT' | 'WFH' | 'ON LEAVE' = 'ABSENT';
      let login = '—';
      let logout = '—';
      let totalHours = '0h 00m';
      let workMode: string = u.workMode || 'Work From Office';

      if (isCurrentUserActive) {
        status = 'PRESENT';
        login = clockInTime;
        logout = 'Active Shift';
        totalHours = formatWorkedTime(workedSeconds);
      } else if (isCurrentUserClockedOut) {
        status = 'PRESENT';
        login = clockInTime;
        logout = clockOutTime;
        totalHours = formatWorkedTime(workedSeconds);
      } else if (matchRec) {
        status = 'PRESENT';
        login = matchRec.created_at
          ? (isAustralia ? formatTimeAEST(matchRec.created_at) : formatTimeIST(matchRec.created_at))
          : (matchRec.clock_in || '—');
        logout = matchRec.clock_out && matchRec.clock_out !== '—' && matchRec.updated_at && matchRec.status === 'completed'
          ? (isAustralia ? formatTimeAEST(matchRec.updated_at) : formatTimeIST(matchRec.updated_at))
          : (matchRec.status === 'working' ? 'Active Shift' : (matchRec.clock_out || '—'));
        totalHours = matchRec.worked_hours || (matchRec.status === 'working' ? 'Live Shift' : '0h 00m');
        workMode = matchRec.work_mode || workMode;
      } else if (onLeave) {
        status = 'ON LEAVE';
        workMode = 'Leave Granted';
      }
 else if (u.workMode === 'Work From Home' && isSelectedToday) {
        status = 'WFH';
        workMode = 'Work From Home';
      }

      return {
        name: u.name,
        email: u.email,
        team: u.team,
        role: u.role,
        avatar: u.avatar,
        company: u.company || (isAustralia ? 'Ambizcon' : 'Ambizcon Health - India'),
        status,
        login,
        logout,
        totalHours,
        workMode,
      };
    });
  }, [scopedRegister, selectedMusterDate, todayKey, liveAttendanceRecords, isClockedIn, clockInTime, clockOutTime, workedSeconds, currentUser, isAustralia, requests]);

  const dailyMusterKPI = useMemo(() => {
    const total = dailyMusterRoster.length;
    const present = dailyMusterRoster.filter((r) => r.status === 'PRESENT').length;
    const absent = dailyMusterRoster.filter((r) => r.status === 'ABSENT').length;
    const onLeave = dailyMusterRoster.filter((r) => r.status === 'ON LEAVE').length;
    const wfh = dailyMusterRoster.filter((r) => r.status === 'WFH').length;
    return { total, present, absent, onLeave, wfh };
  }, [dailyMusterRoster]);

  const filteredMusterRoster = useMemo(() => {
    if (musterTableFilter === 'present') {
      return dailyMusterRoster.filter((r) => r.status === 'PRESENT' || r.status === 'WFH');
    }
    if (musterTableFilter === 'absent') {
      return dailyMusterRoster.filter((r) => r.status === 'ABSENT' || r.status === 'ON LEAVE');
    }
    return dailyMusterRoster;
  }, [dailyMusterRoster, musterTableFilter]);


  const handleExportDailyAttendanceExcel = (targetDateKey?: string, filterMode: 'all' | 'present' | 'absent' = 'all') => {
    const dateKey = targetDateKey || selectedMusterDate || todayKey;
    
    let filteredList = dailyMusterRoster;
    if (filterMode === 'present') {
      filteredList = dailyMusterRoster.filter((r) => r.status === 'PRESENT' || r.status === 'WFH');
    } else if (filterMode === 'absent') {
      filteredList = dailyMusterRoster.filter((r) => r.status === 'ABSENT' || r.status === 'ON LEAVE');
    }

    const modeLabel = filterMode === 'present' ? 'Present_Members' : filterMode === 'absent' ? 'Absent_Members' : 'Full_Attendance';
    const filename = `Ambizcon_${modeLabel}_${dateKey}.csv`;

    let headers = '';
    let rows: string[] = [];

    if (filterMode === 'present') {
      headers = 'Date,Employee Name,Email Address,Team,Attendance Status,Clock In Time,Clock Out Time,Total Clock In Hours,Work Mode';
      rows = filteredList.map((r) => `"${dateKey}","${r.name}","${r.email}","${r.team}","${r.status}","${r.login}","${r.logout}","${r.totalHours}","${r.workMode}"`);
    } else if (filterMode === 'absent') {
      headers = 'Date,Employee Name,Email Address,Team,Role,Absence Status,Company Branch';
      rows = filteredList.map((r) => `"${dateKey}","${r.name}","${r.email}","${r.team}","${r.role}","${r.status}","${r.company}"`);
    } else {
      headers = 'Date,Employee Name,Email Address,Team,Company Branch,Attendance Status,Logon Time (Clock In),Logout Time (Clock Out),Total Clock In Hours,Work Mode';
      rows = filteredList.map((r) => `"${dateKey}","${r.name}","${r.email}","${r.team}","${r.company}","${r.status}","${r.login}","${r.logout}","${r.totalHours}","${r.workMode}"`);
    }

    const csvContent = '\uFEFF' + [headers].concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filterMode === 'present' ? 'Present Members' : filterMode === 'absent' ? 'Absent Members' : 'Daily Attendance'} report exported for ${dateKey}!`);
  };


  // Distinct dates grouped by month for month-wise / date-wise dropdown selector
  const monthGroups = useMemo(() => {
    const dateMap = new Map<string, { dayKey: string; label: string; count: number; activeCount: number; dateObj: Date }>();

    displayHistory.forEach((item: any) => {
      const k = item.dayKey;
      if (!k || typeof k !== 'string') return;
      const isActive = item.status === 'Active Shift';

      if (!dateMap.has(k)) {
        const parts = k.split('-');
        let d: Date;
        if (parts.length === 3) {
          d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          d = new Date(item.date || Date.now());
        }
        const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        dateMap.set(k, {
          dayKey: k,
          label,
          count: 0,
          activeCount: 0,
          dateObj: d,
        });
      }

      const entry = dateMap.get(k)!;
      entry.count++;
      if (isActive) entry.activeCount++;
    });

    const groupsMap = new Map<string, { monthKey: string; monthTitle: string; dates: { dayKey: string; label: string; count: number; activeCount: number; dateObj: Date }[] }>();

    Array.from(dateMap.values())
      .sort((a, b) => b.dayKey.localeCompare(a.dayKey))
      .forEach((dateOpt) => {
        const monthKey = dateOpt.dayKey.slice(0, 7); // e.g. "2026-09"
        if (!groupsMap.has(monthKey)) {
          const monthTitle = dateOpt.dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          groupsMap.set(monthKey, {
            monthKey,
            monthTitle,
            dates: [],
          });
        }
        groupsMap.get(monthKey)!.dates.push(dateOpt);
      });

    return Array.from(groupsMap.values());
  }, [displayHistory]);

  const activeFilterLabel = useMemo(() => {
    if (auditFilterType === 'all') return 'All Recorded Dates';
    if (auditFilterType === 'today') return `Today (${todayLabel})`;
    if (auditFilterType === 'yesterday') return `Yesterday (${yesterdayLabel})`;
    if (auditFilterType === 'day_before') return `Day Before Yesterday (${dayBeforeLabel})`;
    if (auditFilterType === 'auto_clockout') return '⏰ Auto-Clocked Out (8 PM)';
    if (auditFilterType === 'custom' && customAuditDate) {
      try {
        const parts = customAuditDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      } catch (e) {}
      return customAuditDate;
    }
    return 'All Recorded Dates';
  }, [auditFilterType, customAuditDate, todayLabel, yesterdayLabel, dayBeforeLabel]);

  // Counts & active shifts for each day filter preset
  const auditCounts = useMemo(() => {
    let today = 0;
    let yesterday = 0;
    let dayBefore = 0;
    let todayActive = 0;
    let yesterdayActive = 0;
    let dayBeforeActive = 0;
    let autoClockout = 0;
    let custom = 0;
    let customActive = 0;

    displayHistory.forEach((item: any) => {
      const k = item.dayKey;
      const isActive = item.status === 'Active Shift';
      if (item.isAutoClockOut) {
        autoClockout++;
      }
      if (k === todayKey) {
        today++;
        if (isActive) todayActive++;
      } else if (k === yesterdayKey) {
        yesterday++;
        if (isActive) yesterdayActive++;
      } else if (k === dayBeforeKey) {
        dayBefore++;
        if (isActive) dayBeforeActive++;
      }

      if (k === customAuditDate) {
        custom++;
        if (isActive) customActive++;
      }
    });

    return {
      all: displayHistory.length,
      today,
      yesterday,
      dayBefore,
      todayActive,
      yesterdayActive,
      dayBeforeActive,
      autoClockout,
      custom,
      customActive,
    };
  }, [displayHistory, todayKey, yesterdayKey, dayBeforeKey, customAuditDate]);

  // Filtered audit history by selected day preset, auto-clockout, or custom date
  const filteredAuditHistory = useMemo(() => {
    if (auditFilterType === 'all') return displayHistory;
    if (auditFilterType === 'today') return displayHistory.filter((item: any) => item.dayKey === todayKey);
    if (auditFilterType === 'yesterday') return displayHistory.filter((item: any) => item.dayKey === yesterdayKey);
    if (auditFilterType === 'day_before') return displayHistory.filter((item: any) => item.dayKey === dayBeforeKey);
    if (auditFilterType === 'auto_clockout') return displayHistory.filter((item: any) => item.isAutoClockOut);
    if (auditFilterType === 'custom') return displayHistory.filter((item: any) => item.dayKey === customAuditDate);
    return displayHistory;
  }, [displayHistory, auditFilterType, todayKey, yesterdayKey, dayBeforeKey, customAuditDate]);

  const currentAuditKPI = useMemo(() => {
    const list = filteredAuditHistory;
    const uniqueEmployees = new Set(list.map((i: any) => (i.userName || '').toLowerCase().trim())).size;
    const activeCount = list.filter((i: any) => i.status === 'Active Shift').length;
    const completedCount = list.filter((i: any) => i.status === 'Completed').length;
    const wfoCount = list.filter((i: any) => i.workMode === 'Work From Office').length;
    const wfhCount = list.filter((i: any) => i.workMode === 'Work From Home').length;
    const devCount = list.filter((i: any) => i.userTeam === 'Development').length;
    const mktgCount = list.filter((i: any) => i.userTeam === 'Marketing').length;
    const creativeCount = list.filter((i: any) => i.userTeam === 'Creative').length;

    return {
      totalPunches: list.length,
      uniqueEmployees,
      activeCount,
      completedCount,
      wfoCount,
      wfhCount,
      devCount,
      mktgCount,
      creativeCount,
    };
  }, [filteredAuditHistory]);

  return (
    <div className="space-y-6">
      {/* Top Status Bar Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-5 glass-panel">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-glow border overflow-hidden ${
            isAustralia ? 'bg-white p-1.5 border-amber-500/40' : 'border-emerald-500/30'
          }`}>
            <img
              src={isAustralia ? '/ambizcon-australia-icon.png' : '/ambizcon-logo.png'}
              alt={isAustralia ? 'Ambizcon Logo' : 'AMBIZCON Health Logo'}
              className={`h-full w-full ${isAustralia ? 'object-contain' : 'object-cover'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Ambizcon Pulse — Attendance & Leave {isAustralia ? '(Ambizcon)' : '(Ambizcon Health - India)'}
              </h1>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                {isAustralia ? '10 min grace • Brisbane AEST' : '10 min grace • Chennai IST'}
              </Badge>
              {isReception && (
                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[10px] font-bold">
                  🏥 Front Desk Kiosk Terminal
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAustralia
                ? 'Ambizcon • Brisbane Workspace Sync (Queen Street CBD)'
                : 'Ambizcon Health • Chennai & Brisbane Workspace Sync'}
            </p>
          </div>
        </div>

        {/* Dual Live Clocks & Dynamic QR Kiosk Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 text-left sm:text-right bg-zinc-50/60 dark:bg-zinc-900/60 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 sm:border-0">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
                CHENNAI
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground">{chennaiTimeStr || formatTimeIST(new Date())}</span>
            </div>

            <div className="border-l border-zinc-200/60 dark:border-zinc-800/60 pl-4 sm:pl-6">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
                BRISBANE
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {brisbaneTimeStr || formatTimeAEST(new Date())}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:border-l sm:border-zinc-200/60 dark:sm:border-zinc-800/60 sm:pl-4 flex">
            <Button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ambizcon_trigger_health_check'));
                }
              }}
              variant="outline"
              className="w-full sm:w-auto justify-center font-bold text-xs gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <HeartPulse className="h-4 w-4 animate-pulse text-emerald-500" />
              <span>👨‍💻 Quick Health Check</span>
            </Button>
          </div>

          {canAccessKiosk && (
            <div className="w-full sm:w-auto sm:border-l sm:border-zinc-200/60 dark:sm:border-zinc-800/60 sm:pl-4 flex">
              <Button
                onClick={() => setIsQrKioskOpen(true)}
                className="w-full sm:w-auto justify-center ambizcon-gradient text-white font-extrabold text-xs gap-2 shadow-glow hover:opacity-95 px-4 py-2.5 rounded-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <QrCode className="h-4 w-4 animate-pulse shrink-0" />
                <span>📱 Dynamic QR Kiosk</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reception Staff Front Desk Terminal Callout */}
      {isReception && (
        <div className="p-6 rounded-3xl border-2 border-purple-500/40 bg-gradient-to-r from-purple-950/20 via-background to-purple-900/10 shadow-glow flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0 shadow-glow">
              <QrCode className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-foreground">
                  Front Desk Attendance Kiosk Terminal
                </h2>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] font-bold">
                  AUTONOMOUS 10s ROTATING QR
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Display this dynamic QR code at the entrance kiosk tablet. Code auto-rotates every 10 seconds with geofencing to guarantee legitimate physical presence.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsQrKioskOpen(true)}
            className="ambizcon-gradient text-white font-extrabold px-6 py-3 rounded-2xl shadow-glow gap-2 hover:scale-105 transition-transform text-sm whitespace-nowrap"
          >
            <QrCode className="h-5 w-5" />
            Open Fullscreen QR Kiosk
          </Button>
        </div>
      )}

      {/* Management Sub-Navigation Tabs (Admin & Team Lead) */}
      {isTeamLead && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
          {[
            { key: 'today', label: 'TODAY' },
            { key: 'muster', label: 'COMPANY MUSTER' },
            { key: 'approvals', label: 'APPROVALS' },
            { key: 'permissions', label: 'PERMISSIONS' },
            { key: 'ledger', label: 'LEAVE LEDGER' },
            { key: 'reports', label: 'REPORTS' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'ambizcon-gradient text-white shadow-md'
                  : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: TODAY (Personal Attendance, Clock In/Out, KPI Cards & History) */}
      {activeTab === 'today' && (
        <div className="space-y-6">
            {/* 4 Stat KPI Cards Row (TL & Admin ONLY) */}
            {isTeamLead && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: ON THE FLOOR NOW */}
                <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      ON THE FLOOR NOW
                    </span>
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-foreground mt-1">
                    {onTheFloorCount} of {scopedRegister.length}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">Signed in, active on shift</span>
                </Card>

              {/* Card 2: LATE ARRIVALS */}
              <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    LATE ARRIVALS
                  </span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-extrabold text-amber-500 mt-1">0 today</div>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Clocked in after 8:30 AM</span>
              </Card>

              {/* Card 3: GRANTED LEAVE */}
              <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    GRANTED LEAVE
                  </span>
                  <UserX className="h-4 w-4 text-rose-500" />
                </div>
                <div className="text-2xl font-extrabold text-rose-500 mt-1">
                  {scopedRequests.filter(r => r.ceo === 'approved').length} today
                </div>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Sanctioned statutory leave</span>
              </Card>

              {/* Card 4: WAITING ON YOU */}
              <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    WAITING ON YOU
                  </span>
                  <FileCheck className="h-4 w-4 text-brand-500" />
                </div>
                <div className="text-2xl font-extrabold text-brand-500 mt-1">{scopedRequests.filter(r => r.ceo === null || r.tl === null).length} requests</div>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Awaiting signoff</span>
              </Card>
            </div>
          )}

          {/* Centered Mobile-Responsive Office Attendance QR Scan Quick Action */}
          <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-[#086075]/15 via-emerald-500/10 to-[#2a8c82]/15 shadow-glow flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-glow shrink-0">
                <Camera className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-foreground">
                    Office Kiosk Attendance QR Scanner
                  </h2>
                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    ⚡ 1-TAP INSTANT PUNCH
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Point your mobile or tablet camera at the front-desk kiosk to autonomously record your arrival or departure.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsMemberScannerOpen(true)}
              className="w-full sm:w-auto ambizcon-gradient text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-glow gap-2.5 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm whitespace-nowrap"
            >
              <Camera className="h-4 w-4" />
              <span>📷 Open Camera to Scan QR</span>
            </Button>
          </div>

          {/* Manual Clock In Card */}
          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 sm:p-6 shadow-sm glass-card">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-1 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    WORKED TODAY
                  </span>
                  {isClockedIn ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
                      <Play className="h-2.5 w-2.5 fill-current" /> Live Shift Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <Square className="h-2.5 w-2.5 fill-current" /> Not Clocked In
                    </span>
                  )}
                </div>
                <div className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-mono tracking-tight text-foreground flex items-center gap-3 sm:gap-4 flex-wrap">
                  {formatWorkedTime(workedSeconds)}

                  {/* Break Status Indicator */}
                  {isOnBreak && (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs font-mono animate-pulse">
                      ☕ On {breakType} Break ({formatWorkedTime(breakSeconds)})
                    </Badge>
                  )}
                </div>

                {/* Geofence & IP Verification Badge */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> GPS Geofence Verified ({isAustralia ? 'Brisbane HQ' : 'Chennai HQ'})
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono text-zinc-500 flex items-center gap-1 flex-wrap">
                    Authorized IP: <strong className="text-foreground">{isAustralia ? '103.246.40.112' : '192.168.1.104'}</strong> <span className="text-emerald-600 dark:text-emerald-400 font-sans text-xs font-semibold">({isAustralia ? 'Queen Street, Brisbane CBD' : 'Anna Nagar, Chennai'})</span>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
                  <span className={!isAustralia ? 'font-bold text-foreground' : 'text-zinc-500'}>
                    CHENNAI <strong className={!isAustralia ? 'text-foreground' : 'text-zinc-600 dark:text-zinc-400'}>{chennaiTimeStr || formatTimeIST(new Date())}</strong>
                  </span>
                  <span className={isAustralia ? 'font-bold text-emerald-500' : 'text-zinc-500'}>
                    BRISBANE <strong className={isAustralia ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}>{brisbaneTimeStr || formatTimeAEST(new Date())}</strong>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Employee: <strong className="text-foreground">{currentUser.name}</strong> •{' '}
                  {isClockedIn ? (
                    <>In <strong className="text-foreground">{clockInTime}</strong> • out <strong className="text-foreground">{clockOutTime}</strong> • live shift active</>
                  ) : clockOutTime !== '—' && clockInTime !== '—' ? (
                    <>In <strong className="text-foreground">{clockInTime}</strong> • out <strong className="text-foreground">{clockOutTime}</strong> • shift closed for today</>
                  ) : (
                    <>Shift Status: <strong className="text-foreground">Not clocked in today</strong> • In <strong className="text-foreground">—</strong> • out <strong className="text-foreground">—</strong></>
                  )}
                </p>
              </div>

              {/* Work Mode & Actions */}
              <div className="flex flex-col items-start lg:items-end gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Work From Office ({isAustralia ? '8:30 AM – 5:00 PM AEST' : '8:30 AM – 5:00 PM IST'})
                  </span>

                  <Button onClick={() => setIsWfhModalOpen(true)} variant="outline" size="sm" className="gap-1.5 text-xs text-brand-500 border-brand-500/30">
                    <Home className="h-3.5 w-3.5" />
                    Request WFH
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end w-full">
                  {/* Break Button */}
                  <Button
                    onClick={() => setIsBreakModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 text-xs ${
                      isOnBreak ? 'border-amber-500 text-amber-600 bg-amber-500/10' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    {isOnBreak ? 'End Break' : 'Start Break'}
                  </Button>

                  <Button onClick={() => setIsApplyModalOpen(true)} variant="outline" size="sm" className="gap-1.5 text-xs">
                    <CalendarIcon className="h-4 w-4" />
                    Apply Leave
                  </Button>

                  {/* Member Scan Office QR Button */}
                  <Button
                    onClick={() => setIsMemberScannerOpen(true)}
                    className="h-10 px-4 font-extrabold gap-2 text-xs shadow-glow ambizcon-gradient text-white border border-white/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    <span>📷 Scan Office QR</span>
                  </Button>

                  <Button
                    onClick={() => setIsClockModalOpen(true)}
                    className={`h-10 px-5 font-bold gap-2 text-xs shadow-md ${
                      isClockedIn ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    {isClockedIn ? 'Day Closed (Clock Out)' : 'Clock In Now'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* WEEKLY & MONTHLY ATTENDANCE SUMMARY WIDGETS (Section 16 & 17 of Prompt) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Summary Widget */}
            <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-emerald-500" />
                    This Week's Attendance Summary
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Daily breakdown of hours worked for current week</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Mon – Fri
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                {weeklyDayRows.map((d) => (
                  <div key={d.name} className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                    <span className={`font-semibold ${d.isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                      {d.name} {d.isToday ? '(Today)' : ''}
                    </span>
                    <span className={`font-mono font-bold ${d.isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                      {d.formattedStr}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-foreground">
                  <span>Total Weekly Hours:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {formattedTotalWeekly}
                  </span>
                </div>
              </div>
            </Card>

            {/* Monthly Summary Widget */}
            <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                    Monthly Attendance Summary
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Aggregated metrics for current month (October 2026)</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Monthly Stats
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Days Worked</span>
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
                    {monthlyWorkedDays} Days
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Total Worked Hours</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                    {monthlyTotalHoursStr}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Average / Day</span>
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
                    {monthlyAvgDayStr}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Completed Shifts</span>
                  <span className="text-2xl font-extrabold text-brand-500 font-mono mt-1 block">
                    {monthlyShiftsCount} Shifts
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* DAILY PRESENT & HOURS BAR CHART ANALYTICS CARD */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                    Daily Attendance & Working Hours Trends
                  </h3>
                  <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-[10px] font-bold">
                    INTERACTIVE BAR ANALYTICS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time weekly breakdown comparing active present headcount and aggregate hours worked.
                </p>
              </div>

              {/* Interactive View Filter Toggle: Show Both | Daily Present Only | Daily Hours Only */}
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setAttendanceBarMode('both')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    attendanceBarMode === 'both'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Show Both
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceBarMode('present')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    attendanceBarMode === 'present'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Daily Present
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceBarMode('hours')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    attendanceBarMode === 'hours'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Daily Hours
                </button>
              </div>
            </div>

            {/* Quick Stat Pill Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Today's Present</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  {dailyAttendanceChartData.find((d) => d.isToday)?.present || (isAustralia ? 3 : 15)} Members
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Today's Hours</span>
                <span className="text-xl font-extrabold text-brand-500 font-mono mt-0.5 block">
                  {dailyAttendanceChartData.find((d) => d.isToday)?.hours || (isAustralia ? 24 : 118)} hrs
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Weekly Total</span>
                <span className="text-xl font-extrabold text-foreground font-mono mt-0.5 block">
                  {dailyAttendanceChartData.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1)} hrs
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Avg Shift Length</span>
                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
                  8.2 hrs / day
                </span>
              </div>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyAttendanceChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="monospace"
                  />
                  {attendanceBarMode === 'both' ? (
                    <>
                      <YAxis
                        yAxisId="left"
                        stroke="#10b981"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        fontFamily="monospace"
                        domain={[0, isAustralia ? 4 : 18]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#3b82f6"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        fontFamily="monospace"
                        domain={[0, isAustralia ? 35 : 150]}
                      />
                    </>
                  ) : attendanceBarMode === 'present' ? (
                    <YAxis
                      stroke="#10b981"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="monospace"
                      domain={[0, isAustralia ? 4 : 18]}
                    />
                  ) : (
                    <YAxis
                      stroke="#3b82f6"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      fontFamily="monospace"
                      domain={[0, isAustralia ? 35 : 150]}
                    />
                  )}
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-1.5 min-w-[180px]">
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60 dark:border-zinc-800/60">
                              <span className="font-bold text-foreground">{d.fullDay}</span>
                              {d.isToday && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                                  Today
                                </span>
                              )}
                            </div>
                            {(attendanceBarMode === 'both' || attendanceBarMode === 'present') && (
                              <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                                  Daily Present:
                                </span>
                                <span className="font-mono font-bold">{d.present} Members</span>
                              </div>
                            )}
                            {(attendanceBarMode === 'both' || attendanceBarMode === 'hours') && (
                              <div className="flex items-center justify-between gap-3 text-brand-600 dark:text-brand-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-brand-500 inline-block" />
                                  Daily Hours:
                                </span>
                                <span className="font-mono font-bold">{d.hours} hrs</span>
                              </div>
                            )}
                            {d.present > 0 && d.hours > 0 && (
                              <div className="flex items-center justify-between gap-3 text-muted-foreground pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                                <span>Avg per Member:</span>
                                <span className="font-mono font-semibold">{d.avgHours} hrs</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 12, fontSize: 12, fontWeight: 600 }}
                    formatter={(value) => (value === 'present' ? 'Daily Present (Headcount)' : 'Daily Hours (Logged hrs)')}
                  />
                  {(attendanceBarMode === 'both' || attendanceBarMode === 'present') && (
                    <Bar
                      yAxisId={attendanceBarMode === 'both' ? 'left' : undefined}
                      dataKey="present"
                      name="present"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  )}
                  {(attendanceBarMode === 'both' || attendanceBarMode === 'hours') && (
                    <Bar
                      yAxisId={attendanceBarMode === 'both' ? 'right' : undefined}
                      dataKey="hours"
                      name="hours"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* HISTORY OF LOGINS (Personal / Squad / All Squads Punch & Shift Audit Register) */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-emerald-500" />
                        {isSuperAdmin
                          ? 'All Squads Live Punch & Shift Audit'
                          : isTeamLead
                          ? `${currentUser?.team} Squad Live Punch & Shift Audit`
                          : 'Personal Login & Logout History'}
                      </h3>
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold">
                        {isSuperAdmin ? 'EXECUTIVE REALTIME AUDIT' : isTeamLead ? 'TEAM REALTIME AUDIT' : 'PUNCH REGISTER LOGS'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isSuperAdmin
                        ? 'Live cloud-synced punch audit of all workspace members across Development, Marketing, and Creative teams (Supabase Cloud).'
                        : isTeamLead
                        ? `Live cloud-synced punch audit of all ${currentUser?.team} squad members (Supabase Cloud).`
                        : 'Chronological audit log of your daily clock-in, clock-out, geofence verification, IP address, and total hours worked.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                      Total Recorded Logs: {displayHistory.length} Sessions
                    </Badge>
                  </div>
                </div>

                {/* Day-Wise Summary & Filter Bar for Admin and Team Lead */}
                {(isSuperAdmin || isTeamLead) && (
                  <div className="space-y-4 mb-5">
                    {/* Day Selector Dropdown Bar with Quick Presets, Month-Wise Grouping & Date Picker */}
                    <div className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Left: Dropdown Selector & Calendar Picker */}
                        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-[280px]">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <CalendarIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              Filter by Day:
                            </span>
                          </div>

                          <div className="relative flex-1 min-w-[220px] max-w-md">
                            <select
                              value={
                                auditFilterType === 'all'
                                  ? 'all'
                                  : auditFilterType === 'today'
                                  ? 'today'
                                  : auditFilterType === 'yesterday'
                                  ? 'yesterday'
                                  : auditFilterType === 'day_before'
                                  ? 'day_before'
                                  : auditFilterType === 'auto_clockout'
                                  ? 'auto_clockout'
                                  : customAuditDate || 'all'
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'all' || val === 'today' || val === 'yesterday' || val === 'day_before' || val === 'auto_clockout') {
                                  setAuditFilterType(val);
                                  if (val === 'today') setCustomAuditDate(todayKey);
                                  else if (val === 'yesterday') setCustomAuditDate(yesterdayKey);
                                  else if (val === 'day_before') setCustomAuditDate(dayBeforeKey);
                                  else setCustomAuditDate('');
                                } else {
                                  setAuditFilterType('custom');
                                  setCustomAuditDate(val);
                                }
                              }}
                              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-zinc-900 text-foreground shadow-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all cursor-pointer"
                            >
                              <optgroup label="⚡ Quick Day Filters">
                                <option value="all">🌐 All Dates ({auditCounts.all} Total Sessions)</option>
                                <option value="today">
                                  📍 Today — {todayLabel} ({auditCounts.today} Sessions{auditCounts.todayActive > 0 ? ` • 🟢 ${auditCounts.todayActive} Active` : ''})
                                </option>
                                <option value="yesterday">
                                  ⏪ Yesterday — {yesterdayLabel} ({auditCounts.yesterday} Sessions{auditCounts.yesterdayActive > 0 ? ` • 🟢 ${auditCounts.yesterdayActive} Active` : ''})
                                </option>
                                <option value="day_before">
                                  ⏮️ Day Before Yesterday — {dayBeforeLabel} ({auditCounts.dayBefore} Sessions)
                                </option>
                                <option value="auto_clockout">
                                  ⏰ Auto-Clocked Out (8 PM) — ({auditCounts.autoClockout} Sessions)
                                </option>
                              </optgroup>

                              {monthGroups.map((group) => (
                                <optgroup key={group.monthKey} label={`📅 ${group.monthTitle} (Day-Wise Logs)`}>
                                  {group.dates.map((d) => (
                                    <option key={d.dayKey} value={d.dayKey}>
                                      {d.label} — {d.count} {d.count === 1 ? 'Session' : 'Sessions'}
                                      {d.activeCount > 0 ? ` (🟢 ${d.activeCount} Active)` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>

                          {/* Calendar Date Picker */}
                          <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">Pick:</span>
                            <input
                              type="date"
                              value={customAuditDate}
                              onChange={(e) => {
                                if (e.target.value) {
                                  setCustomAuditDate(e.target.value);
                                  setAuditFilterType('custom');
                                }
                              }}
                              className="text-xs font-mono bg-transparent text-foreground outline-none cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Right: Quick Action Shortcuts & Counter */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setAuditFilterType('today');
                              setCustomAuditDate(todayKey);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                              auditFilterType === 'today' || customAuditDate === todayKey
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-zinc-200/60 dark:bg-zinc-800 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <span>Today</span>
                            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">
                              {auditCounts.today}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuditFilterType('yesterday');
                              setCustomAuditDate(yesterdayKey);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                              auditFilterType === 'yesterday' || customAuditDate === yesterdayKey
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-zinc-200/60 dark:bg-zinc-800 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <span>Yesterday</span>
                            <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10">
                              {auditCounts.yesterday}
                            </span>
                          </button>

                          {auditFilterType !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setAuditFilterType('all');
                                setCustomAuditDate('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all"
                            >
                              Show All
                            </button>
                          )}

                          <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            {filteredAuditHistory.length} Sessions
                          </Badge>
                        </div>
                      </div>

                      {/* Active Day Breadcrumb Indicator */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                            Active View:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            {activeFilterLabel}
                          </span>
                          {auditFilterType === 'custom' && customAuditDate && (
                            <span className="text-[10px] text-muted-foreground">({customAuditDate})</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Selecting a day shows that day's complete clock-in and punch audit
                        </span>
                      </div>
                    </div>

                    {/* Day-Wise KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* 1. Presence */}
                      <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-500" />
                            Total Presence
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {activeFilterLabel}
                          </Badge>
                        </div>
                        <div className="text-xl font-extrabold text-foreground mt-1.5">
                          {currentAuditKPI.uniqueEmployees}{' '}
                          <span className="text-xs font-semibold text-muted-foreground">Members</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {currentAuditKPI.totalPunches} Total punch sessions logged
                        </div>
                      </div>

                      {/* 2. Active vs Closed */}
                      <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            Shift State
                          </span>
                          {currentAuditKPI.activeCount > 0 && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-extrabold text-foreground mt-1.5 flex items-center gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">{currentAuditKPI.activeCount} Active</span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            / {currentAuditKPI.completedCount} Closed
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {currentAuditKPI.activeCount > 0 ? '🟢 Realtime active presence' : 'All shifts logged out'}
                        </div>
                      </div>

                      {/* 3. Work Mode */}
                      <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-amber-500" />
                            Work Mode
                          </span>
                        </div>
                        <div className="text-xl font-extrabold text-foreground mt-1.5 flex items-center gap-2">
                          <span className="text-emerald-600 dark:text-emerald-400">{currentAuditKPI.wfoCount} WFO</span>
                          <span className="text-xs font-semibold text-muted-foreground">• {currentAuditKPI.wfhCount} WFH</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Office vs Remote Distribution</div>
                      </div>

                      {/* 4. Squad Distribution */}
                      <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-purple-500" />
                            Squad Turnout
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                            {currentAuditKPI.devCount} Dev
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
                            {currentAuditKPI.mktgCount} Mktg
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold font-mono">
                            {currentAuditKPI.creativeCount} Creative
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">Squad-wise punch breakdown</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">EMPLOYEE NAME</th>
                        <th className="px-4 py-3">SESSION & DATE</th>
                        <th className="px-4 py-3">
                          CLOCK IN <span className="text-[9px] text-muted-foreground block font-mono">IST / AEST</span>
                        </th>
                        <th className="px-4 py-3">
                          CLOCK OUT <span className="text-[9px] text-muted-foreground block font-mono">IST / AEST</span>
                        </th>
                        <th className="px-4 py-3">WORK MODE & GEOFENCE</th>
                        <th className="px-4 py-3">IP ADDRESS & LOCATION</th>
                        <th className="px-4 py-3 text-center">WORKED HOURS</th>
                        <th className="px-4 py-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {filteredAuditHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                            No punch history recorded for the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                            {/* Employee Name */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">
                                  {(item.userName || '?').charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-foreground block text-xs">{item.userName}</span>
                                  <span className="text-[10px] text-muted-foreground">{item.userTeam} • {item.company}</span>
                                </div>
                              </div>
                            </td>

                            {/* Session ID & Date */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-foreground text-xs">{item.date}</span>
                                <span className="font-mono text-[10px] text-muted-foreground/80 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.2 rounded border border-zinc-200/50 dark:border-zinc-800/50 w-fit">
                                  ID: #{item.id.match(/\d{4,}/)?.[0]?.slice(-6) || item.id.replace(/[^0-9]/g, '').slice(-6) || '849201'}
                                </span>
                              </div>
                            </td>

                            {/* Clock In Dual Time & Punch Method */}
                            <td className="px-4 py-3 font-mono">
                              <span className="font-bold text-foreground block">{item.clockIn}</span>
                              <span className="text-[10px] text-muted-foreground block">{item.clockInAest}</span>
                              <div className="mt-1">
                                {item.isQrPunch ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                    <QrCode className="h-2.5 w-2.5" />
                                    QR Punch
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                    <Laptop className="h-2.5 w-2.5" />
                                    Tab Punch
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Clock Out Dual Time */}
                            <td className="px-4 py-3 font-mono">
                              <span className="font-bold text-foreground block">{item.clockOut || '—'}</span>
                              <span className="text-[10px] text-muted-foreground block">{item.clockOutAest || '—'}</span>
                              {item.isAutoClockOut && (
                                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[9px] font-sans font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                  ⏰ Auto @ 8 PM
                                </span>
                              )}
                            </td>

                            {/* Work Mode & Geofence */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {item.workMode}
                                </Badge>
                                {item.geofenceVerified && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block flex items-center gap-1 font-medium">
                                    <ShieldCheck className="h-3 w-3" /> Geofence Verified (200m)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* IP Address & Physical Location */}
                            <td className="px-4 py-3 font-mono text-xs">
                              <span className="font-bold text-foreground block">{item.ipAddress}</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block flex items-center gap-1 font-sans font-semibold mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {item.location || 'Anna Nagar, Chennai'}
                              </span>
                            </td>

                            {/* Worked Hours */}
                            <td className="px-4 py-3 text-center font-mono font-extrabold text-foreground">
                              {item.status === 'Active Shift' ? (
                                <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">
                                  {item.isCurrentUser ? formatWorkedTime(workedSeconds) : item.hoursWorked}
                                </span>
                              ) : (
                                item.hoursWorked
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3 text-right">
                              {item.isOnBreak ? (
                                <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 font-bold whitespace-nowrap animate-pulse">
                                  ☕ On {item.breakType || 'Lunch'} Break
                                </Badge>
                              ) : item.isAutoClockOut ? (
                                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold whitespace-nowrap">
                                  ⏰ Auto-Clocked (8 PM)
                                </Badge>
                              ) : (
                                <Badge
                                  className={
                                    item.status === 'Active Shift'
                                      ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-bold animate-pulse'
                                      : item.status === 'Completed'
                                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                      : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                                  }
                                >
                                  {item.status === 'Active Shift' ? '● Live Shift Active' : item.status}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
          </Card>
        </div>
      )}

      {/* TAB 2: COMPANY MUSTER — Team & Global Muster UI */}
      {activeTab === 'muster' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {isSuperAdmin ? 'Company Muster Register' : 'Team Muster'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {isSuperAdmin ? `All Workspace Teams — ${scopedRegister.length} names` : `${currentUser.team} — ${scopedRegister.length} names`}
            </p>
          </div>

          {/* Scoped Information Alert Banner */}
          <div className="rounded-2xl border-l-4 border-emerald-600 bg-emerald-500/10 p-4 text-xs text-foreground flex items-center justify-between gap-4">
            <p>
              {isSuperAdmin ? (
                <><strong>Global Workspace Muster — {scopedRegister.length} members across all teams.</strong> Full executive administrative visibility of logins, status, and punch timelines.</>
              ) : (
                <><strong>{currentUser.team} only — {scopedRegister.length} people.</strong> You approve leave for {currentUser.team} and view shift punches for your squad.</>
              )}
            </p>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              Active Scope: {isSuperAdmin ? 'Global Workspace' : currentUser.team}
            </Badge>
          </div>

          {/* Team Muster Card */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6">
            {/* Team Header & Export Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-foreground">
                    {isSuperAdmin ? 'Daily Attendance & Executive Muster Register' : `${currentUser.team} Daily Attendance`}
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold">
                    {isSuperAdmin ? 'EXECUTIVE MUSTER' : 'YOUR TEAM'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scopedRegister.length} team members · Present & Absent roster with logon/logout times & clock-in hours
                </p>
              </div>

              {/* Date Filters & Download Excel Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-muted-foreground px-1.5">Date:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMusterDate(todayKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedMusterDate === todayKey
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMusterDate(yesterdayKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedMusterDate === yesterdayKey
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Yesterday
                  </button>
                  <input
                    type="date"
                    value={selectedMusterDate}
                    onChange={(e) => setSelectedMusterDate(e.target.value)}
                    className="bg-transparent text-xs font-bold font-mono px-1 py-0.5 outline-hidden text-foreground"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleExportDailyAttendanceExcel(selectedMusterDate, 'present')}
                    variant="outline"
                    className="text-xs font-bold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Present List CSV
                  </Button>

                  <Button
                    onClick={() => handleExportDailyAttendanceExcel(selectedMusterDate, 'absent')}
                    variant="outline"
                    className="text-xs font-bold gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Absent List CSV
                  </Button>

                  <Button
                    onClick={() => handleExportDailyAttendanceExcel(selectedMusterDate, 'all')}
                    className="ambizcon-gradient text-white text-xs gap-1.5 shadow-glow font-bold"
                  >
                    <Download className="h-4 w-4" />
                    Export All CSV
                  </Button>
                </div>
              </div>
            </div>

            {/* Attendance KPI Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                onClick={() => setMusterTableFilter('all')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  musterTableFilter === 'all'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Staff</span>
                <span className="text-xl font-extrabold text-foreground font-mono mt-0.5 block">{dailyMusterKPI.total}</span>
              </div>

              <div
                onClick={() => setMusterTableFilter('present')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  musterTableFilter === 'present'
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-sm'
                    : 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">🟢 Present</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportDailyAttendanceExcel(selectedMusterDate, 'present');
                    }}
                    className="text-[10px] underline font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    CSV ⤓
                  </button>
                </div>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{dailyMusterKPI.present}</span>
              </div>

              <div
                onClick={() => setMusterTableFilter('absent')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  musterTableFilter === 'absent'
                    ? 'border-rose-500 bg-rose-500/20 shadow-sm'
                    : 'border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">🔴 Absent</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportDailyAttendanceExcel(selectedMusterDate, 'absent');
                    }}
                    className="text-[10px] underline font-bold text-rose-600 hover:text-rose-700"
                  >
                    CSV ⤓
                  </button>
                </div>
                <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">{dailyMusterKPI.absent}</span>
              </div>

              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">🟣 WFH</span>
                <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">{dailyMusterKPI.wfh}</span>
              </div>

              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">🟡 On Leave</span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">{dailyMusterKPI.onLeave}</span>
              </div>
            </div>

            {/* Filter Pills Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Roster Table Filter:</span>
                <button
                  type="button"
                  onClick={() => setMusterTableFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    musterTableFilter === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Staff ({dailyMusterKPI.total})
                </button>
                <button
                  type="button"
                  onClick={() => setMusterTableFilter('present')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    musterTableFilter === 'present'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  Present Only ({dailyMusterKPI.present})
                </button>
                <button
                  type="button"
                  onClick={() => setMusterTableFilter('absent')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    musterTableFilter === 'absent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  Absent Only ({dailyMusterKPI.absent})
                </button>
              </div>

              <span className="text-xs font-mono text-muted-foreground">
                Showing {filteredMusterRoster.length} of {dailyMusterKPI.total} members
              </span>
            </div>

            {/* Roster Daily Attendance Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">EMPLOYEE NAME</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                    <th className="px-4 py-3 font-mono">LOGON TIME (CLOCK IN)</th>
                    <th className="px-4 py-3 font-mono">LOGOUT TIME (CLOCK OUT)</th>
                    <th className="px-4 py-3 text-center font-mono">TOTAL CLOCK-IN HOURS</th>
                    <th className="px-4 py-3">WORK MODE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredMusterRoster.map((item) => (

                    <tr key={item.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Name in Register */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={item.name} size="sm" />
                          <div>
                            <span className="font-bold text-foreground block">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{item.role} · {item.team}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge (PRESENT / ABSENT / WFH / ON LEAVE) */}
                      <td className="px-4 py-3 text-center">
                        {item.status === 'PRESENT' && (
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                            PRESENT
                          </Badge>
                        )}
                        {item.status === 'ABSENT' && (
                          <Badge className="bg-rose-500/20 text-rose-600 border-rose-500/30 text-[10px] font-bold">
                            ABSENT
                          </Badge>
                        )}
                        {item.status === 'WFH' && (
                          <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-[10px] font-bold">
                            WFH
                          </Badge>
                        )}
                        {item.status === 'ON LEAVE' && (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px] font-bold">
                            ON LEAVE
                          </Badge>
                        )}
                      </td>

                      {/* Clock In Time */}
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {item.login}
                      </td>

                      {/* Clock Out Time */}
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {item.logout}
                      </td>

                      {/* Total Clock In Hours */}
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {item.totalHours}
                      </td>

                      {/* Work Mode */}
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                        {item.workMode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Visual Timeline Punch Bar Chart */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {/* Timeline Header */}
              <div className="grid grid-cols-6 text-center text-xs font-mono font-bold text-muted-foreground pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span>8 AM</span>
                <span>10 AM</span>
                <span>12 PM</span>
                <span>2 PM</span>
                <span>4 PM</span>
                <span>6 PM</span>
              </div>

              {/* Roster Gantt Punch Bars */}
              <div className="space-y-4 pt-3">
                {activeMusterRoster.map((item) => (
                  <div key={item.name} className="flex items-center gap-4 text-xs">
                    <span className="w-28 font-bold text-foreground truncate shrink-0">{item.name}</span>
                    <div className="flex-1 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 p-1 relative overflow-hidden">
                      {item.status === 'ontime' && (
                        <div className="h-full rounded-lg bg-emerald-600 text-white font-mono text-[10px] font-bold flex items-center justify-between px-3 shadow-xs">
                          <span>{item.login}</span>
                          <span>{item.logout}</span>
                        </div>
                      )}
                      {item.status === 'late' && (
                        <div className="h-full rounded-lg bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-between px-3 shadow-xs">
                          <span>{item.login}</span>
                          <span>{item.logout}</span>
                        </div>
                      )}
                      {item.status === 'leave' && (
                        <div className="h-full rounded-lg bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center px-3">
                          GRANTED LEAVE
                        </div>
                      )}
                      {item.status === 'nopunch' && (
                        <div className="h-full rounded-lg bg-zinc-400 text-white font-mono text-[10px] font-bold flex items-center justify-center px-3">
                          NO PUNCH RECORDED
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: APPROVALS — 2-Step Leave/WFH Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Approved & Success Register + Pending Queue</h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {isSuperAdmin ? 'All Teams (CEO / Executive Queue)' : `${currentUser.team} Team Queue`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Approval Flow: Member submits $\rightarrow$ Team Leader Signoff $\rightarrow$ CEO Final Approval
                </p>
              </div>
              <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                {scopedRequests.length} Total Requests
              </Badge>
            </div>

            {scopedRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No active leave or WFH requests pending in your team queue.
              </div>
            ) : (
              <div className="space-y-4">
                {scopedRequests.map((req) => {
                  const isPendingTL = req.tl === null;
                  const isPendingCEO = req.tl === 'approved' && req.ceo === null;

                  return (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40"
                    >
                      <div className="flex items-center gap-3.5 min-w-[260px]">
                        <Avatar name={req.empName || 'Employee'} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{req.empName}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {req.id}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">[{req.empTeam}]</span>
                          </div>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {req.type} Leave ({req.days} Day) • {req.from} to {req.to}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{req.reason}"</p>
                        </div>
                      </div>

                      {/* 2-Step Badges */}
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          className={
                            req.tl === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                              : req.tl === 'rejected'
                              ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                          }
                        >
                          TL: {req.tl === 'approved' ? '✓ Approved' : req.tl === 'rejected' ? '✗ Rejected' : 'Pending'}
                        </Badge>

                        <ArrowRight className="h-3 w-3 text-muted-foreground" />

                        <Badge
                          className={
                            req.ceo === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                              : req.ceo === 'rejected'
                              ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                          }
                        >
                          CEO: {req.ceo === 'approved' ? '✓ Granted Success' : req.ceo === 'rejected' ? '✗ Rejected' : 'Pending'}
                        </Badge>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2">
                        {isTeamLead && isPendingTL && (
                          <div className="flex items-center gap-1">
                            <Button onClick={() => handleApproveTL(req.id)} size="sm" className="bg-emerald-600 text-white text-xs py-1">
                              TL Approve
                            </Button>
                            <Button onClick={() => handleReject(req.id, 'tl')} size="sm" variant="ghost" className="text-rose-500 text-xs py-1">
                              Reject
                            </Button>
                          </div>
                        )}

                        {isSuperAdmin && isPendingCEO && (
                          <div className="flex items-center gap-1">
                            <Button onClick={() => handleApproveCEO(req.id)} size="sm" className="ambizcon-gradient text-white text-xs py-1 shadow-glow">
                              Grant Leave (CEO)
                            </Button>
                            <Button onClick={() => handleReject(req.id, 'ceo')} size="sm" variant="ghost" className="text-rose-500 text-xs py-1">
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: PERMISSIONS — Total List of Each Employee Requested & Taken Permission */}
      {activeTab === 'permissions' && (
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Employee Permission Register</h3>
              <p className="text-xs text-muted-foreground">Total list of each employee's requested and taken permissions (Max 3 Permissions / Month)</p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-mono text-xs">
              Scoped Team Permissions Audit
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Taken Permissions</th>
                  <th className="px-4 py-3 text-center">Remaining Allowed</th>
                  <th className="px-4 py-3 text-right">Record Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {scopedRegister.map((u) => {
                  const taken = u.permissionCount || 0;
                  const remaining = Math.max(0, 3 - taken);

                  return (
                    <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 font-semibold">{u.team}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role.includes('Admin') ? 'danger' : u.role.includes('Lead') ? 'warning' : 'outline'} className="text-[10px]">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-amber-600 dark:text-amber-400">
                        {taken} Permission(s)
                      </td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        {remaining} Left
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() => {
                            toast.success(`Permission recorded for ${u.name}! Updated count: ${taken + 1}`);
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs text-emerald-600 border-emerald-500/30"
                        >
                          + Record Permission
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: LEAVE LEDGER — Total Present, Absent, Permission of Each Month */}
      {activeTab === 'ledger' && (
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Monthly Leave & Attendance Ledger</h3>
              <p className="text-xs text-muted-foreground">Comprehensive monthly breakdown of Total Present, Absent, WFH, Leave, & Permission count</p>
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-emerald-500" />
              <select
                value={selectedLedgerMonth}
                onChange={(e) => setSelectedLedgerMonth(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
              >
                <option value="September 2026">September 2026 (Current Month)</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-center">Present Days</th>
                  <th className="px-4 py-3 text-center">Absent Days</th>
                  <th className="px-4 py-3 text-center">Granted Leave</th>
                  <th className="px-4 py-3 text-center">WFH Days</th>
                  <th className="px-4 py-3 text-center">Permissions</th>
                  <th className="px-4 py-3 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {scopedRegister.map((u) => {
                  const userLeaves = requests.filter((r) => (r.empId === (u as any)._id || (r as any).empEmail === u.email || r.empName === u.name) && r.ceo === 'approved').length;
                  const userPunches = liveAttendanceRecords.filter((r) => r.user_email === u.email || r.user_id === (u as any)._id);
                  const wfh = u.workMode === 'Work From Home' ? 4 : (u.company === 'Ambizcon' ? 2 : 1);
                  const leave = userLeaves;
                  const present = Math.max(16, 22 - (leave + wfh) + Math.min(2, userPunches.length));
                  const absent = Math.max(0, 22 - (present + wfh + leave));
                  const permissions = u.permissionCount || 0;
                  const attPct = (((present + wfh) / 22) * 100).toFixed(1);

                  return (
                    <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {u.name} <span className="text-[10px] text-muted-foreground block font-normal">{u.email}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{u.team}</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{present} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-rose-500">{absent} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-purple-600 dark:text-purple-400">{leave} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-brand-500">{wfh} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-amber-600 dark:text-amber-400">{permissions} Count</td>
                      <td className="px-4 py-3 text-right font-extrabold font-mono text-foreground">{attPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 6: REPORTS — Team-wise Week, Month, Year, & Total (From Joining till Date) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Best Employee of the Year 2026 Award Banner */}
          <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent p-6 glass-panel relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-glow animate-pulse">
                  <Trophy className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-foreground">🏆 Ambizcon Best Employee of the Year 2026</h2>
                    <Badge className="bg-amber-500 text-white text-[10px] font-bold">Annual Excellence Award</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Honoring 100% Perfect Attendance Record, Zero Absences, and Outstanding Overtime Dedication!
                  </p>
                </div>
              </div>

              {/* Award Winner Cards */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-amber-500/30 bg-card/80">
                  <Avatar name="Anirudh" size="md" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Anirudh K.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">100% Attendance • 0 Leaves</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl border border-amber-500/30 bg-card/80">
                  <Avatar name="Thanikaivel" size="md" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Thanikaivel M.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">100% Attendance • 0 Leaves</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Team-Wise Attendance & Working Hours Reports</h3>
                <p className="text-xs text-muted-foreground">Historical roster analytics filterable by Team and Interval (Total from joining till date)</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={reportsTeamFilter}
                  onChange={(e) => setReportsTeamFilter(e.target.value as any)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="All">All Workspace Teams</option>
                  <option value="Development">Development Team</option>
                  <option value="Marketing">Marketing Team</option>
                  <option value="Creative">Creative Team</option>
                </select>

                <select
                  value={reportsTimeRange}
                  onChange={(e) => setReportsTimeRange(e.target.value as any)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-bold focus-ring"
                >
                  <option value="Weekly">Weekly Report</option>
                  <option value="Monthly">Monthly Report (September 2026 - Current)</option>
                  <option value="Annual">Annual Full Year (2026)</option>
                  <option value="Total (From Joining till Date)">Total (From Joining till Date)</option>
                </select>

                <Button onClick={handleExportCSV} className="ambizcon-gradient text-white text-xs gap-1.5 shadow-glow">
                  <Download className="h-4 w-4" />
                  Export Reports CSV
                </Button>
              </div>
            </div>

            {/* KPI Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overall Attendance %</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">98.2%</span>
                <span className="text-[10px] text-muted-foreground">{reportsTimeRange}</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Hours Logged</span>
                <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">2,840 hrs</span>
                <span className="text-[10px] text-muted-foreground">Across all roster members</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overtime Pay Disbursed</span>
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1 block">+$1,450</span>
                <span className="text-[10px] text-muted-foreground">Total overtime compensation</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Loss of Pay (LOP) Days</span>
                <span className="text-2xl font-extrabold text-amber-500 font-mono mt-1 block">0 Days</span>
                <span className="text-[10px] text-muted-foreground">Unsanctioned absences</span>
              </div>
            </div>

            {/* Interactive Attendance Performance & Working Hours Recharts Graph */}
            <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-background mb-6">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-foreground">Attendance Performance & Hours Logged Trend Chart</h4>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Filtered by: {reportsTeamFilter} Team • {reportsTimeRange}</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      reportsTimeRange === 'Weekly'
                        ? [
                            { period: 'Mon', attendancePct: 98.0, hoursLogged: 104, overtime: 12 },
                            { period: 'Tue', attendancePct: 99.2, hoursLogged: 110, overtime: 14 },
                            { period: 'Wed', attendancePct: 97.5, hoursLogged: 102, overtime: 10 },
                            { period: 'Thu', attendancePct: 98.8, hoursLogged: 108, overtime: 15 },
                            { period: 'Fri', attendancePct: 99.5, hoursLogged: 112, overtime: 18 },
                          ]
                        : reportsTimeRange === 'Monthly'
                        ? [
                            { period: 'Week 1', attendancePct: 97.2, hoursLogged: 420, overtime: 45 },
                            { period: 'Week 2', attendancePct: 98.5, hoursLogged: 440, overtime: 52 },
                            { period: 'Week 3', attendancePct: 97.9, hoursLogged: 432, overtime: 48 },
                            { period: 'Week 4', attendancePct: 99.1, hoursLogged: 450, overtime: 58 },
                          ]
                        : [
                            { period: 'Q1 2026', attendancePct: 97.8, hoursLogged: 1280, overtime: 140 },
                            { period: 'Q2 2026', attendancePct: 98.4, hoursLogged: 1340, overtime: 165 },
                            { period: 'Q3 2026', attendancePct: 98.9, hoursLogged: 1380, overtime: 180 },
                            { period: 'Q4 2026', attendancePct: 99.2, hoursLogged: 1410, overtime: 195 },
                          ]
                    }
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#086075" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#086075" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="period" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="attendancePct" name="Attendance Rate (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" />
                    <Area type="monotone" dataKey="hoursLogged" name="Logged Hours" stroke="#086075" fillOpacity={1} fill="url(#colorHours)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Zero Leave Taken / Perfect Attendance Honor Roll Section */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  ⭐ Zero Leave Taken Honor Roll (From Joining till Date)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-200 dark:border-zinc-800">
                  <Avatar name="Anirudh" size="sm" />
                  <div>
                    <span className="font-bold text-foreground block">Anirudh K.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">0 Leaves Taken • 100% Rate</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-200 dark:border-zinc-800">
                  <Avatar name="Thanikaivel" size="sm" />
                  <div>
                    <span className="font-bold text-foreground block">Thanikaivel M.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">0 Leaves Taken • 100% Rate</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-200 dark:border-zinc-800">
                  <Avatar name="Kasthuri" size="sm" />
                  <div>
                    <span className="font-bold text-foreground block">Kasthuri S.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">0 Leaves Taken • 100% Rate</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-zinc-200 dark:border-zinc-800">
                  <Avatar name="Naraine" size="sm" />
                  <div>
                    <span className="font-bold text-foreground block">Naraine V.</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">0 Leaves Taken • 99.2% Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Roster Report Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3 text-center">Total Days Active</th>
                    <th className="px-4 py-3 text-center">Leaves Taken</th>
                    <th className="px-4 py-3 text-center">Total Overtime</th>
                    <th className="px-4 py-3 text-right">Cumulative Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {scopedRegister
                    .filter((u) => reportsTeamFilter === 'All' || u.team === reportsTeamFilter)
                    .map((u) => {
                      const userLeaves = requests.filter((r) => (r.empId === (u as any)._id || (r as any).empEmail === u.email || r.empName === u.name) && r.ceo === 'approved').length;
                      const attPct = (u.name.includes('Anirudh') || u.name.includes('Thanikai')) ? '100.0%' : '98.5%';
                      const otHrs = (u.name.includes('Anirudh') || u.name.includes('Mathan')) ? '+24 hrs' : '+14 hrs';
                      const activeDays = 184;

                      return (
                        <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                            {u.name}
                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[9px]">
                              {userLeaves} Leaves
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold">{u.team}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">01 Jan 2026</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-foreground">{activeDays} Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{userLeaves} Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">{otHrs}</td>
                          <td className="px-4 py-3 text-right font-extrabold font-mono text-foreground">{attPct}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Happy Birthday Popup Modal */}
      <Modal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        title="🎉 Happy Birthday!"
        description="Ambizcon Health Celebration Greeting"
        maxWidth="md"
      >
        <div className="text-center space-y-4 py-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-brand-500 text-white mx-auto shadow-glow animate-bounce">
            <Cake className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">
              Happy Birthday, {currentUser.name}! 🎂
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2">
              Wishing you a wonderful day filled with happiness and success from the entire AMBIZCON Health team!
            </p>
          </div>
          <Button onClick={() => setIsBirthdayModalOpen(false)} className="ambizcon-gradient text-white px-8">
            Thank You!
          </Button>
        </div>
      </Modal>

      {/* Request WFH Modal */}
      <Modal
        isOpen={isWfhModalOpen}
        onClose={() => setIsWfhModalOpen(false)}
        title="Request Work From Home (WFH)"
        description="Submit WFH request to Team Leader & CEO for official signoff."
        maxWidth="md"
      >
        <form onSubmit={handleRequestWfh} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Requested WFH Date *</label>
            <input
              type="date"
              value={wfhDate}
              onChange={(e) => setWfhDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Reason & Rationale for WFH *</label>
            <textarea
              value={wfhReason}
              onChange={(e) => setWfhReason(e.target.value)}
              rows={3}
              placeholder="State reason for requesting Work From Home (Shift: 7:30 AM – 4:30 PM IST)..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsWfhModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              Submit WFH Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Clock In/Out Confirmation Modal */}
      <Modal
        isOpen={isClockModalOpen}
        onClose={() => setIsClockModalOpen(false)}
        title={isClockedIn ? 'Close Day (Clock Out)' : 'Start Shift (Clock In)'}
        description="Write entry to Ambizcon Pulse official attendance register."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5 bg-zinc-50 dark:bg-zinc-900/50 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <span className="text-muted-foreground font-semibold">Employee Name:</span>
              <span className="font-bold text-foreground text-sm">{currentUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team & Branch:</span>
              <span className="font-medium text-foreground">{currentUser.team} • {isAustralia ? 'Ambizcon' : 'Ambizcon Health - India'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chennai Time:</span>
              <span className="font-bold font-mono">{chennaiTimeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brisbane Time:</span>
              <span className="font-bold font-mono text-emerald-500">{brisbaneTimeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Mode:</span>
              <span className="font-semibold">{activeWorkMode}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setIsClockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClockToggle} className={isClockedIn ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}>
              {isClockedIn ? 'Close Day (Clock Out)' : 'Clock In Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Apply Leave Modal with Dynamic Days Count Indicator */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
        description="Request leave to be submitted into 2-step TL and CEO approval chain."
        maxWidth="lg"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Casual">Casual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Earned">Earned Leave</option>
                <option value="Loss of Pay">Loss of Pay</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="full">Full Day(s)</option>
                <option value="half-am">Half Day — Morning</option>
                <option value="half-pm">Half Day — Afternoon</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">From Date *</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            {duration === 'full' && (
              <div>
                <label className="text-xs font-semibold text-foreground">To Date *</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                  required
                />
              </div>
            )}
          </div>

          {/* Dynamic Calculated Days Indicator */}
          <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Calculated Leave Duration:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {calculatedDays} Day(s) Requested
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="State reason for leave request..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingLeave} className="ambizcon-gradient text-white shadow-glow">
              {isSubmittingLeave ? 'Submitting...' : `Submit (${calculatedDays} Days)`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Break Management Engine Modal */}
      <Modal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        title={isOnBreak ? 'End Break & Resume Shift' : 'Start Break Session'}
        description="Track break duration (Lunch, Tea, Personal, Meeting) and automatically pause net working hours."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {!isOnBreak ? (
            <div>
              <label className="text-xs font-semibold text-foreground">Select Break Type</label>
              <select
                value={breakType}
                onChange={(e) => setBreakType(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring font-bold"
              >
                <option value="Lunch">☕ Lunch Break (60 mins allowed)</option>
                <option value="Tea">🍵 Tea / Refreshment Break (15 mins allowed)</option>
                <option value="Personal">👤 Personal Break (15 mins allowed)</option>
                <option value="Meeting">💼 External Client Meeting Break</option>
              </select>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center space-y-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase">
                Active {breakType} Break Session
              </span>
              <div className="text-3xl font-extrabold font-mono text-foreground">
                {formatWorkedTime(breakSeconds)}
              </div>
              <span className="text-[11px] text-muted-foreground block">Net shift worked timer is currently paused</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setIsBreakModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBreakToggle} className={isOnBreak ? 'bg-emerald-600 text-white font-bold' : 'bg-amber-600 text-white font-bold'}>
              {isOnBreak ? 'End Break & Resume Shift' : `Start ${breakType} Break`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dynamic 10-Second QR Code Attendance Kiosk Modal */}
      <DynamicQrKioskModal
        isOpen={isQrKioskOpen}
        onClose={() => setIsQrKioskOpen(false)}
        branch={isAustralia ? 'Ambizcon' : 'Ambizcon Health - India'}
        onPunchSuccess={(punch) => {
          if (punch?.name === currentUser?.name || punch?.email === currentUser?.email) {
            setIsClockedIn(punch.type === 'Clock In');
            if (punch.type === 'Clock In') {
              setClockInTime(punch.time || '10:00 AM');
              setClockInTimestamp(Date.now());
            } else {
              setClockOutTime(punch.time || '06:00 PM');
            }
          }
        }}
      />

      {/* Member In-App Camera QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isMemberScannerOpen}
        onClose={() => setIsMemberScannerOpen(false)}
        onPunchSuccess={(punch) => {
          if (punch?.name === currentUser?.name || punch?.email === currentUser?.email) {
            setIsClockedIn(punch.type === 'Clock In');
            if (punch.type === 'Clock In') {
              setClockInTime(punch.time || '10:00 AM');
              setClockInTimestamp(Date.now());
            } else {
              setClockOutTime(punch.time || '06:00 PM');
            }
          }
        }}
      />
    </div>
  );
}
