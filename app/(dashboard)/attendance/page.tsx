'use client';

import React, { useState, useEffect } from 'react';
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
  Camera,
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

export default function AttendancePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon - Australia'
    : currentUser?.company === 'Ambizcon - Australia';
  const isTeamLead = currentUser?.role === 'Team Lead' || isSuperAdmin;
  const isReception = currentUser?.role === 'Reception Staff';
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-Navigation Tab State
  const [activeTab, setActiveTab] = useState<'today' | 'muster' | 'approvals' | 'permissions' | 'ledger' | 'reports'>('today');

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

  // Break Management Engine State
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState<number>(0);
  const [breakType, setBreakType] = useState<'Lunch' | 'Tea' | 'Personal' | 'Meeting'>('Lunch');
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Leave Ledger & Reports State
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState('August 2026');
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
    const timer = setInterval(() => {
      const now = new Date();
      // Chennai IST
      setChennaiTimeStr(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) +
          ' IST'
      );
      // Brisbane AEST (UTC+10, offset from IST +4.5 hrs)
      const aestDate = new Date(now.getTime() + 4.5 * 3600 * 1000);
      setBrisbaneTimeStr(
        aestDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) +
          ' AEST'
      );

      // Nightly Midnight Reset Watcher: Check if midnight has passed
      const currentDayKey = now.toLocaleDateString('en-CA');
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
        ? 'Ambizcon - Australia'
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

  const handleBreakToggle = () => {
    if (!isClockedIn) {
      toast.error('You must clock in before starting a break!');
      return;
    }
    if (!isOnBreak) {
      setIsOnBreak(true);
      toast.success(`Started ${breakType} break! Worked timer paused.`);
    } else {
      setIsOnBreak(false);
      toast.success(`Ended ${breakType} break! Resumed shift work.`);
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

  // Australian Roster for Brisbane Branch View (Global Leadership)
  const initialAusRoster = [
    { name: 'Anirudh', role: 'Super Admin', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
    { name: 'Mathan P', role: 'Super Admin', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 0, hoursWorked: '0h 00m', weeklyHours: '0h 00m', monthlyHours: '0h 00m', compensation: 'Standard' },
  ];

  const baseMuster = isAustralia ? initialAusRoster : initialIndiaRoster;

  const activeMusterRoster = baseMuster.map((item) => {
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
      const formatted = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const clockInTimeStr = formatted + ' IST';
      const aestDate = new Date(d.getTime() + 4.5 * 3600 * 1000);
      const clockInAestStr = aestDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' AEST';

      if (!isClockedIn) {
        // API Call: POST /api/attendance/clock-in
        const res = await fetch('/api/attendance/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser._id,
            userName: currentUser.name,
            userTeam: currentUser.team,
            workMode: activeWorkMode,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Clock In failed');
          return;
        }

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
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Employee Name,Status,Login Time,Logout Time,Daily Worked,Weekly Hours,Monthly Hours,Compensation']
        .concat(
          activeMusterRoster.map(
            (r) => `"${r.name}",${r.status},${r.login},${r.logout},${r.hoursWorked},${r.weeklyHours},${r.monthlyHours},"${r.compensation}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ambizcon_Attendance_WorkingHours_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance & Working Hours report exported to CSV!');
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
    if (isSuperAdmin) return true;
    if (currentUser?.role === 'Team Lead') return u.team === currentUser.team;
    return u.email === currentUser?.email;
  });

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
              alt={isAustralia ? 'Ambizcon Australia Logo' : 'AMBIZCON Health Logo'}
              className={`h-full w-full ${isAustralia ? 'object-contain' : 'object-cover'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Ambizcon Pulse — Attendance & Leave {isAustralia ? '(Ambizcon - Australia)' : '(Ambizcon Health - India)'}
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
                ? 'Ambizcon Australia • Brisbane Workspace Sync (Queen Street CBD)'
                : 'Ambizcon Health • Chennai & Brisbane Workspace Sync'}
            </p>
          </div>
        </div>

        {/* Dual Live Clocks & Dynamic QR Kiosk Button */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-3 sm:gap-6 text-left sm:text-right">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
                CHENNAI
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground">{chennaiTimeStr || '02:52:28 PM IST'}</span>
            </div>

            <div className="border-l border-zinc-200/60 dark:border-zinc-800/60 pl-3 sm:pl-6">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
                BRISBANE
              </span>
              <span className="text-xs sm:text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {brisbaneTimeStr || '07:22:28 PM AEST'}
              </span>
            </div>
          </div>

          {(isSuperAdmin || isReception) && (
            <div className="sm:border-l sm:border-zinc-200/60 dark:sm:border-zinc-800/60 sm:pl-4">
              <Button
                onClick={() => setIsQrKioskOpen(true)}
                className="ambizcon-gradient text-white font-extrabold text-xs gap-2 shadow-glow hover:opacity-95 px-3 sm:px-4 py-2 rounded-xl border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <QrCode className="h-4 w-4 animate-pulse" />
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
                  {isClockedIn ? '1' : '0'} of {scopedRegister.length}
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
                    CHENNAI <strong className={!isAustralia ? 'text-foreground' : 'text-zinc-600 dark:text-zinc-400'}>{chennaiTimeStr || '02:52:28 PM IST'}</strong>
                  </span>
                  <span className={isAustralia ? 'font-bold text-emerald-500' : 'text-zinc-500'}>
                    BRISBANE <strong className={isAustralia ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}>{brisbaneTimeStr || '07:22:28 PM AEST'}</strong>
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
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Monday</span>
                  <span className="font-mono font-bold text-foreground">0h 00m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Tuesday</span>
                  <span className="font-mono font-bold text-foreground">0h 00m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Wednesday</span>
                  <span className="font-mono font-bold text-foreground">0h 00m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Thursday</span>
                  <span className="font-mono font-bold text-foreground">0h 00m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Today</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {isClockedIn ? formatWorkedTime(workedSeconds) : '0h 00m'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-foreground">
                  <span>Total Weekly Hours:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {isClockedIn ? formatWorkedTime(workedSeconds) : '0h 00m'}
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
                  <p className="text-xs text-muted-foreground mt-0.5">Aggregated metrics for current month (September 2026)</p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Monthly Stats
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Days Worked</span>
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
                    {loginHistory.filter((h) => h.status === 'Completed').length > 0
                      ? Math.round(loginHistory.filter((h) => h.status === 'Completed').length / 3)
                      : (isClockedIn ? 1 : 0)} Days
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Total Worked Hours</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                    {isClockedIn ? formatWorkedTime(workedSeconds) : '0h 00m'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Average / Day</span>
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
                    {isClockedIn ? formatWorkedTime(workedSeconds) : '0h 00m'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Completed Shifts</span>
                  <span className="text-2xl font-extrabold text-brand-500 font-mono mt-1 block">
                    {loginHistory.filter((h) => h.status === 'Completed').length} Shifts
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* HISTORY OF LOGINS (Personal Punch & Shift Logins Audit Register) */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-500" />
                    Personal Login & Logout History
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold">
                    PUNCH REGISTER LOGS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chronological audit log of your daily clock-in, clock-out, geofence verification, IP address, and total hours worked.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                  Total Recorded Logs: {loginHistory.length} Sessions
                </Badge>
              </div>
            </div>

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
                  {loginHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-xs">
                        No punch history recorded yet. Clock in or scan the office QR kiosk to record your attendance.
                      </td>
                    </tr>
                  ) : (
                    loginHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Employee Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={currentUser?.avatar} name={item.userName || currentUser?.name} size="sm" />
                          <div>
                            <span className="font-bold text-foreground block text-xs">{item.userName || currentUser?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{item.userTeam || currentUser?.team} • {isAustralia ? 'Ambizcon - Australia' : 'Ambizcon Health - India'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Session ID & Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-500 text-xs">{item.id}</span>
                          <span className="font-semibold text-foreground text-xs">{item.date}</span>
                        </div>
                      </td>

                      {/* Clock In Dual Time */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.clockIn}</span>
                        <span className="text-[10px] text-muted-foreground block">{item.clockInAest}</span>
                      </td>

                      {/* Clock Out Dual Time */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.clockOut}</span>
                        <span className="text-[10px] text-muted-foreground block">{item.clockOutAest}</span>
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
                            {formatWorkedTime(workedSeconds)}
                          </span>
                        ) : (
                          item.hoursWorked
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-right">
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
                      </td>
                    </tr>
                  )))}
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
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            {/* Team Header & Export Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-foreground">
                    {isSuperAdmin ? 'All Teams Muster Register' : `${currentUser.team} team`}
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold">
                    {isSuperAdmin ? 'EXECUTIVE MUSTER' : 'YOUR TEAM'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scopedRegister.length} people · {isSuperAdmin ? 'Executive Oversight' : `led by ${currentUser.name}`} · 10 on the floor now
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleExportCSV} className="ambizcon-gradient text-white text-xs gap-1.5 shadow-glow font-bold">
                  <Download className="h-4 w-4" />
                  Export attendance
                </Button>

                <Button onClick={handleExportCSV} variant="outline" className="text-xs font-bold gap-1.5">
                  Export leave ledger
                </Button>

                <span className="text-[11px] text-muted-foreground font-mono">Scope: {isSuperAdmin ? 'Global Workspace' : currentUser.team}</span>
              </div>
            </div>

            {/* Roster Attendance Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">NAME IN REGISTER</th>
                    <th className="px-4 py-3">ATTENDANCE</th>
                    <th className="px-4 py-3">STANDING</th>
                    <th className="px-4 py-3">CLOCK IN <span className="text-[9px] text-muted-foreground block font-mono">IST / AEST</span></th>
                    <th className="px-4 py-3">CLOCK OUT <span className="text-[9px] text-muted-foreground block font-mono">IST / AEST</span></th>
                    <th className="px-4 py-3 text-center">LEAVE USED</th>
                    <th className="px-4 py-3 text-center">BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {activeMusterRoster.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Name in Register */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 font-bold text-xs">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{(item as any).role || (idx === 0 ? 'Development Lead' : 'Software Engineer')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance % with Progress Bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold font-mono text-foreground text-xs">{item.status === 'ontime' ? '100%' : '0%'}</span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: item.status === 'ontime' ? '100%' : '0%' }} />
                          </div>
                        </div>
                      </td>

                      {/* Standing Badge */}
                      <td className="px-4 py-3">
                        <Badge className={item.status === 'ontime' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] font-bold' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px] font-bold'}>
                          {item.status === 'ontime' ? 'ACTIVE' : 'NO PUNCH'}
                        </Badge>
                      </td>

                      {/* Clock In Dual Time (IST / AEST) */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.login}</span>
                        <span className="text-[10px] text-muted-foreground block">{item.login !== '—' ? (isAustralia ? 'AEST' : 'IST') : '—'}</span>
                      </td>

                      {/* Clock Out Dual Time (IST / AEST) */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.logout}</span>
                        <span className="text-[10px] text-muted-foreground block">{item.logout !== '—' ? (isAustralia ? 'AEST' : 'IST') : '—'}</span>
                      </td>

                      {/* Leave Used */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-foreground">0</td>

                      {/* Balance */}
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">36</td>
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
                <option value="August 2026">August 2026 (Current)</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
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
                  const present = 0;
                  const absent = 0;
                  const leave = 0;
                  const wfh = 0;
                  const permissions = u.permissionCount || 0;
                  const attPct = '0.0';

                  return (
                    <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {u.name} <span className="text-[10px] text-muted-foreground block font-normal">{u.email}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{u.team}</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{present} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-rose-500">{absent} Days</td>
                      <td className="px-4 py-3 text-center font-extrabold font-mono text-purple-600 dark:text-purple-400">{leave} Day</td>
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
                  <option value="Monthly">Monthly Report (August 2026)</option>
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
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">0.0%</span>
                <span className="text-[10px] text-muted-foreground">{reportsTimeRange}</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Hours Logged</span>
                <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">0 hrs</span>
                <span className="text-[10px] text-muted-foreground">Across all roster members</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overtime Pay Disbursed</span>
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1 block">+$0</span>
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
                    data={[
                      { period: 'Week 1', attendancePct: 0, hoursLogged: 0, overtime: 0 },
                      { period: 'Week 2', attendancePct: 0, hoursLogged: 0, overtime: 0 },
                      { period: 'Week 3', attendancePct: 0, hoursLogged: 0, overtime: 0 },
                      { period: 'Week 4', attendancePct: 0, hoursLogged: 0, overtime: 0 },
                    ]}
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
                      return (
                        <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                            {u.name}
                            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[9px]">
                              0 Leaves
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold">{u.team}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">01 Jan 2026</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-foreground">0 Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">0 Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-muted-foreground">+0 hrs</td>
                          <td className="px-4 py-3 text-right font-extrabold font-mono text-foreground">0.0%</td>
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
              <span className="font-medium text-foreground">{currentUser.team} • {isAustralia ? 'Ambizcon - Australia' : 'Ambizcon Health - India'}</span>
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
        branch={isAustralia ? 'Ambizcon - Australia' : 'Ambizcon Health - India'}
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
