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

export default function AttendancePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
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

  // Dynamic Shift Clock State (Default to active shift at 03:24 PM IST with live elapsed time)
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [clockInTime, setClockInTime] = useState<string>('03:24 PM');
  const [clockOutTime, setClockOutTime] = useState<string>('—');
  const [clockInTimestamp, setClockInTimestamp] = useState<number | null>(() => Date.now() - 26 * 60 * 1000);
  const [workedSeconds, setWorkedSeconds] = useState<number>(26 * 60);
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  // Login History State (Personal Punch Logs & Audit Register)
  const [loginHistory, setLoginHistory] = useState<any[]>([
    {
      id: 'SESH-809',
      date: '08 Sep 2026 (Today)',
      clockIn: '03:24 PM IST',
      clockInAest: '07:54 PM AEST',
      clockOut: '—',
      clockOutAest: '—',
      workMode: 'Work From Office',
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      hoursWorked: 'In Progress (Live)',
      status: 'Active Shift',
      geofenceVerified: true,
    },
    {
      id: 'SESH-808',
      date: '07 Sep 2026',
      clockIn: '08:28 AM IST',
      clockInAest: '12:58 PM AEST',
      clockOut: '05:02 PM IST',
      clockOutAest: '09:32 PM AEST',
      workMode: 'Work From Office',
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      hoursWorked: '8h 34m',
      status: 'Completed',
      geofenceVerified: true,
    },
    {
      id: 'SESH-807',
      date: '06 Sep 2026',
      clockIn: '08:32 AM IST',
      clockInAest: '01:02 PM AEST',
      clockOut: '05:00 PM IST',
      clockOutAest: '09:30 PM AEST',
      workMode: 'Work From Office',
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      hoursWorked: '8h 28m',
      status: 'Completed',
      geofenceVerified: true,
    },
    {
      id: 'SESH-806',
      date: '05 Sep 2026',
      clockIn: '08:45 AM IST',
      clockInAest: '01:15 PM AEST',
      clockOut: '05:15 PM IST',
      clockOutAest: '09:45 PM AEST',
      workMode: 'Work From Home (WFH)',
      ipAddress: '122.178.42.11',
      location: 'Anna Nagar, Chennai',
      hoursWorked: '8h 30m',
      status: 'Completed',
      geofenceVerified: true,
    },
    {
      id: 'SESH-805',
      date: '04 Sep 2026',
      clockIn: '08:25 AM IST',
      clockInAest: '12:55 PM AEST',
      clockOut: '05:00 PM IST',
      clockOutAest: '09:30 PM AEST',
      workMode: 'Work From Office',
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      hoursWorked: '8h 35m',
      status: 'Completed',
      geofenceVerified: true,
    },
    {
      id: 'SESH-804',
      date: '03 Sep 2026',
      clockIn: '08:30 AM IST',
      clockInAest: '01:00 PM AEST',
      clockOut: '05:00 PM IST',
      clockOutAest: '09:30 PM AEST',
      workMode: 'Work From Office',
      ipAddress: '192.168.1.104',
      location: 'Anna Nagar, Chennai',
      hoursWorked: '8h 30m',
      status: 'Completed',
      geofenceVerified: true,
    },
  ]);

  // Break Management Engine State
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState<number>(0);
  const [breakType, setBreakType] = useState<'Lunch' | 'Tea' | 'Personal' | 'Meeting'>('Lunch');
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Attendance Regularization & Time Correction State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState('');
  const [requestedIn, setRequestedIn] = useState('08:30');
  const [requestedOut, setRequestedOut] = useState('17:00');
  const [correctionReason, setCorrectionReason] = useState('');
  const [corrections, setCorrections] = useState<any[]>([
    {
      id: 'COR-801',
      userName: 'Aravind S.',
      userTeam: 'Development',
      date: '2026-09-02',
      originalClockIn: '09:15 AM',
      originalClockOut: '—',
      requestedClockIn: '08:30 AM',
      requestedClockOut: '05:00 PM',
      reason: 'Biometric kiosk scanner offline on arrival',
      status: 'Pending',
      createdAt: '2026-09-02T17:30:00Z',
    },
    {
      id: 'COR-802',
      userName: 'Kenneth F.',
      userTeam: 'Marketing',
      date: '2026-09-01',
      originalClockIn: '08:45 AM',
      originalClockOut: '04:30 PM',
      requestedClockIn: '08:30 AM',
      requestedClockOut: '05:00 PM',
      reason: 'On client meeting call during evening clock-out',
      status: 'Approved',
      createdAt: '2026-09-01T18:00:00Z',
    },
  ]);

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

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isTeamLead = currentUser?.role === 'Team Lead' || isSuperAdmin;

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

    // Restore shift state from localStorage if present
    const savedShift = localStorage.getItem(`ambizcon_shift_${currentUser._id}`);
    if (savedShift) {
      try {
        const parsed = JSON.parse(savedShift);
        setIsClockedIn(parsed.isClockedIn);
        setClockInTime(parsed.clockInTime || '03:24 PM');
        setClockOutTime(parsed.clockOutTime || '—');
        if (parsed.clockInTimestamp) {
          setClockInTimestamp(parsed.clockInTimestamp);
          if (parsed.isClockedIn) {
            const elapsed = Math.max(0, Math.floor((Date.now() - parsed.clockInTimestamp) / 1000));
            setWorkedSeconds(elapsed);
          } else if (parsed.workedSeconds !== undefined) {
            setWorkedSeconds(parsed.workedSeconds);
          }
        }
      } catch (e) {
        // Fallback default
      }
    }

    const savedHistory = localStorage.getItem(`ambizcon_login_history_${currentUser._id}`);
    if (savedHistory) {
      try {
        setLoginHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }

    // Dual Time Zone Interval (Chennai IST & Brisbane AEST)
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
    }, 1000);

    if (currentUser?.workMode) {
      setActiveWorkMode(currentUser.workMode);
    }

    return () => clearInterval(timer);
  }, [currentUser]);

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

  const handleRequestCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const newCorr = {
      id: `COR-${Math.floor(100 + Math.random() * 900)}`,
      userName: currentUser.name,
      userTeam: currentUser.team,
      date: correctionDate,
      originalClockIn: clockInTime,
      originalClockOut: clockOutTime,
      requestedClockIn: requestedIn,
      requestedClockOut: requestedOut,
      reason: correctionReason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setCorrections([newCorr, ...corrections]);
    toast.success('Attendance Correction request submitted to Team Lead & HR!');
    setIsCorrectionModalOpen(false);
    setCorrectionReason('');
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

  // Roster Punch Data for Muster Timeline
  const musterPunchRoster = [
    { name: 'Anirudh K.', login: '8:32 AM', logout: '5:30 PM', status: 'ontime', startPct: 8, widthPct: 75, hoursWorked: '8h 58m', weeklyHours: '44h 30m', monthlyHours: '178h', compensation: '+$280 Overtime' },
    { name: 'Aravind S.', login: '8:27 AM', logout: '4:26 PM', status: 'ontime', startPct: 7, widthPct: 66, hoursWorked: '7h 59m', weeklyHours: '40h 00m', monthlyHours: '160h', compensation: 'Standard' },
    { name: 'Kenneth F.', login: '8:52 AM', logout: '5:00 PM', status: 'late', startPct: 14, widthPct: 68, hoursWorked: '8h 08m', weeklyHours: '41h 15m', monthlyHours: '165h', compensation: '+$60 Overtime' },
    { name: 'Deva R.', login: '8:21 AM', logout: '4:42 PM', status: 'ontime', startPct: 6, widthPct: 70, hoursWorked: '8h 21m', weeklyHours: '42h 00m', monthlyHours: '168h', compensation: '+$120 Overtime' },
    { name: 'Thanikaivel M.', login: '8:14 AM', logout: '4:28 PM', status: 'ontime', startPct: 4, widthPct: 69, hoursWorked: '8h 14m', weeklyHours: '41h 30m', monthlyHours: '166h', compensation: '+$90 Overtime' },
    { name: 'Naraine V.', login: '8:25 AM', logout: '5:40 PM', status: 'ontime', startPct: 7, widthPct: 77, hoursWorked: '9h 15m', weeklyHours: '46h 15m', monthlyHours: '185h', compensation: '+$380 Overtime' },
    { name: 'Mathi P.', login: '8:42 AM', logout: '4:50 PM', status: 'late', startPct: 12, widthPct: 68, hoursWorked: '8h 08m', weeklyHours: '40h 40m', monthlyHours: '162h', compensation: '+$40 Overtime' },
    { name: 'Krithika S.', login: '9:11 AM', logout: '4:32 PM', status: 'late', startPct: 18, widthPct: 61, hoursWorked: '7h 21m', weeklyHours: '37h 45m', monthlyHours: '151h', compensation: 'Standard' },
    { name: 'Siddesh K.', login: '—', logout: '—', status: 'leave', startPct: 0, widthPct: 100, hoursWorked: '0h 00m', weeklyHours: '32h 00m', monthlyHours: '128h', compensation: 'Granted Leave' },
    { name: 'Sathish K.', login: '—', logout: '—', status: 'nopunch', startPct: 0, widthPct: 100, hoursWorked: '0h 00m', weeklyHours: '32h 00m', monthlyHours: '128h', compensation: 'No Punch' },
    { name: 'Kavish M.', login: '8:31 AM', logout: '5:00 PM', status: 'ontime', startPct: 8, widthPct: 70, hoursWorked: '8h 29m', weeklyHours: '42h 30m', monthlyHours: '170h', compensation: '+$140 Overtime' },
    { name: 'Kasthuri S.', login: '8:20 AM', logout: '4:54 PM', status: 'ontime', startPct: 6, widthPct: 72, hoursWorked: '8h 34m', weeklyHours: '42h 50m', monthlyHours: '171h', compensation: '+$150 Overtime' },
  ];

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

        localStorage.setItem(
          `ambizcon_shift_${currentUser._id}`,
          JSON.stringify({
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
          clockIn: clockInTimeStr,
          clockInAest: clockInAestStr,
          clockOut: '—',
          clockOutAest: '—',
          workMode: activeWorkMode,
          ipAddress: '192.168.1.104',
          location: 'Anna Nagar, Chennai',
          hoursWorked: 'In Progress (Live)',
          status: 'Active Shift',
          geofenceVerified: true,
        };
        const updatedHistory = [newSession, ...loginHistory.filter((h) => !h.date.includes('Today'))];
        setLoginHistory(updatedHistory);
        localStorage.setItem(`ambizcon_login_history_${currentUser._id}`, JSON.stringify(updatedHistory));

        toast.success(`Clocked In successfully at ${formatted} IST — Shift timer started!`);
      } else {
        // API Call: POST /api/attendance/clock-out
        const res = await fetch('/api/attendance/clock-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser._id }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Clock Out failed');
          return;
        }

        // Clocking out / Closing shift
        setIsClockedIn(false);
        setClockOutTime(formatted);

        localStorage.setItem(
          `ambizcon_shift_${currentUser._id}`,
          JSON.stringify({
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
              clockOut: clockInTimeStr,
              clockOutAest: clockInAestStr,
              hoursWorked: finalHoursStr,
              status: 'Completed',
            };
          }
          return entry;
        });
        setLoginHistory(updatedHistory);
        localStorage.setItem(`ambizcon_login_history_${currentUser._id}`, JSON.stringify(updatedHistory));

        toast.success(`Clocked Out at ${formatted} IST — Day closed.`);
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
          musterPunchRoster.map(
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

  // Team Hierarchy Filtering
  const scopedRequests = requests.filter((req) => {
    if (isSuperAdmin) return true;
    if (currentUser.role === 'Team Lead') return req.empTeam === currentUser.team;
    return req.empId === currentUser._id;
  });

  const scopedRegister = SEED_USERS.filter((u) => {
    if (isSuperAdmin) return true;
    if (currentUser.role === 'Team Lead') return u.team === currentUser.team;
    return u.email === currentUser.email;
  });

  return (
    <div className="space-y-6">
      {/* Top Status Bar Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-5 glass-panel">
        <div className="flex items-center gap-4">
          <img
            src="/ambizcon-logo.png"
            alt="AMBIZCON Health Logo"
            className="h-12 w-12 rounded-2xl object-cover shadow-glow border border-emerald-500/30"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Ambizcon Pulse — Attendance & Leave
              </h1>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                10 min grace
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ambizcon Health • Chennai & Brisbane Workspace Sync
            </p>
          </div>
        </div>

        {/* Dual Live Clocks ONLY on Right Side */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
              CHENNAI
            </span>
            <span className="text-sm font-extrabold font-mono text-foreground">{chennaiTimeStr || '02:52:28 PM IST'}</span>
          </div>

          <div className="border-l border-zinc-200/60 dark:border-zinc-800/60 pl-6">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
              BRISBANE
            </span>
            <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {brisbaneTimeStr || '07:22:28 PM AEST'}
            </span>
          </div>
        </div>
      </div>

      {/* Management Sub-Navigation Tabs & 4 Stat KPI Cards (Strictly for TL & Admin ONLY) */}
      {isTeamLead && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
            {[
              { key: 'today', label: 'TODAY', allowed: true },
              { key: 'muster', label: 'COMPANY MUSTER', allowed: isTeamLead },
              { key: 'approvals', label: 'APPROVALS', allowed: isTeamLead },
              { key: 'permissions', label: 'PERMISSIONS', allowed: isTeamLead },
              { key: 'ledger', label: 'LEAVE LEDGER', allowed: isTeamLead },
              { key: 'reports', label: 'REPORTS', allowed: isSuperAdmin },
            ]
              .filter((tab) => tab.allowed)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'ambizcon-gradient text-white shadow-md'
                      : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          {/* 4 Stat KPI Cards Row (TL & Admin ONLY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: ON THE FLOOR NOW */}
            <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  ON THE FLOOR NOW
                </span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-foreground mt-1">10 of 12</div>
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
              <div className="text-2xl font-extrabold text-amber-500 mt-1">3 today</div>
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
              <div className="text-2xl font-extrabold text-rose-500 mt-1">1 today</div>
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
              <div className="text-2xl font-extrabold text-brand-500 mt-1">{scopedRequests.length} requests</div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">Awaiting signoff</span>
            </Card>
          </div>
        </>
      )}

      {/* Manual Clock In Card */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6 shadow-sm glass-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
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
            <div className="text-5xl font-extrabold font-mono tracking-tight text-foreground flex items-center gap-4">
              {formatWorkedTime(workedSeconds)}

              {/* Break Status Indicator */}
              {isOnBreak && (
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs font-mono animate-pulse">
                  ☕ On {breakType} Break ({formatWorkedTime(breakSeconds)})
                </Badge>
              )}
            </div>

            {/* Geofence & IP Verification Badge */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> GPS Geofence Verified (200m Radius)
              </span>
              <span>•</span>
              <span className="font-mono text-zinc-500 flex items-center gap-1">
                Authorized IP: <strong className="text-foreground">192.168.1.104</strong> <span className="text-emerald-600 dark:text-emerald-400 font-sans text-xs font-semibold">(Anna Nagar, Chennai)</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
              <span>CHENNAI <strong className="text-foreground">{chennaiTimeStr || '02:52:28 PM IST'}</strong></span>
              <span>BRISBANE <strong className="text-emerald-500">{brisbaneTimeStr || '07:22:28 PM AEST'}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              In <strong className="text-foreground">{clockInTime}</strong> • out <strong className="text-foreground">{clockOutTime}</strong> • full day recorded
            </p>
          </div>

          {/* Work Mode & Actions */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                Work From Office (8:30 AM – 5:00 PM)
              </span>

              <Button onClick={() => setIsWfhModalOpen(true)} variant="outline" size="sm" className="gap-1.5 text-xs text-brand-500 border-brand-500/30">
                <Home className="h-3.5 w-3.5" />
                Request WFH
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
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

              {/* Time Correction / Regularization Button */}
              <Button
                onClick={() => setIsCorrectionModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-500/30"
              >
                <FileEdit className="h-3.5 w-3.5" />
                Time Correction
              </Button>

              <Button onClick={() => setIsApplyModalOpen(true)} variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarIcon className="h-4 w-4" />
                Apply Leave
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

      {/* TAB CONTENT SWITCHING ENGINE */}
      {activeTab === 'today' && (
        <div className="space-y-6">
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
                  <span className="font-mono font-bold text-foreground">8h 30m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Tuesday</span>
                  <span className="font-mono font-bold text-foreground">8h 15m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Wednesday</span>
                  <span className="font-mono font-bold text-foreground">7h 55m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Thursday</span>
                  <span className="font-mono font-bold text-foreground">8h 40m</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                  <span className="font-semibold text-muted-foreground">Friday</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {isClockedIn ? formatWorkedTime(workedSeconds) : '8h 00m'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-foreground">
                  <span>Total Weekly Hours:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">41h 20m</span>
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
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">20 Days</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Total Worked Hours</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">162h 30m</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Average / Day</span>
                  <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">8h 07m</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground block">Completed Shifts</span>
                  <span className="text-2xl font-extrabold text-brand-500 font-mono mt-1 block">20 Shifts</span>
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
                  {loginHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
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
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: COMPANY MUSTER — Team Muster UI Matched 100% to Prototype Image */}
      {isTeamLead && activeTab === 'muster' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Team Muster</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {currentUser.role === 'Super Admin' ? 'All Workspace Teams — 15 names' : `${currentUser.team} — ${scopedRegister.length} names`}
            </p>
          </div>

          {/* Scoped Information Alert Banner */}
          <div className="rounded-2xl border-l-4 border-emerald-600 bg-emerald-500/10 p-4 text-xs text-foreground flex items-center justify-between gap-4">
            <p>
              <strong>{currentUser.team} only — {scopedRegister.length} people.</strong> No other team is readable from this account: not their attendance, not their punches, not their names. You approve leave for {currentUser.team} and nobody else.
            </p>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              Active Scope: {currentUser.team}
            </Badge>
          </div>

          {/* Team Muster Card */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            {/* Team Header & Export Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-foreground">{currentUser.team} team</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] uppercase font-bold">
                    YOUR TEAM
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scopedRegister.length} people · led by {currentUser.name} · 10 on the floor now
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

                <span className="text-[11px] text-muted-foreground font-mono">Scope: {currentUser.team}</span>
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
                  {musterPunchRoster.map((item, idx) => (
                    <tr key={item.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Name in Register */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 font-bold text-xs">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{idx === 0 ? 'Development Lead' : 'Software Engineer'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance % with Progress Bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold font-mono text-foreground text-xs">{96 + (idx % 3)}%</span>
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${96 + (idx % 3)}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Standing Badge */}
                      <td className="px-4 py-3">
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                          FULL
                        </Badge>
                      </td>

                      {/* Clock In Dual Time (IST / AEST) */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.login}</span>
                        <span className="text-[10px] text-muted-foreground block">12:57 PM</span>
                      </td>

                      {/* Clock Out Dual Time (IST / AEST) */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-foreground block">{item.logout}</span>
                        <span className="text-[10px] text-muted-foreground block">9:05 PM</span>
                      </td>

                      {/* Leave Used */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-foreground">{idx * 3 + 3}</td>

                      {/* Balance */}
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{33 - idx * 3}</td>
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
                {musterPunchRoster.map((item) => (
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

      {/* TAB 3: APPROVALS — 2-Step Leave/WFH Queue & Time Correction Requests */}
      {isTeamLead && activeTab === 'approvals' && (
        <div className="space-y-6">
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">Approved & Success Register + Pending Queue</h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {currentUser.role === 'Super Admin' ? 'All Teams (CEO)' : `${currentUser.team} Team Queue`}
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

          {/* Time Correction / Regularization Requests Table */}
          <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Attendance Regularization & Forgotten Punch Requests</h3>
                <p className="text-xs text-muted-foreground">Time correction requests submitted by employees for TL & HR signoff</p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 text-xs font-mono">
                {corrections.length} Corrections Submitted
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Req ID</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Target Date</th>
                    <th className="px-4 py-3">Original Time</th>
                    <th className="px-4 py-3">Requested Correction</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {corrections.map((corr) => (
                    <tr key={corr.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-purple-600 dark:text-purple-400">{corr.id}</td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {corr.userName} <span className="text-[10px] text-muted-foreground block font-normal">[{corr.userTeam}]</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold">{corr.date}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{corr.originalClockIn} – {corr.originalClockOut}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{corr.requestedClockIn} – {corr.requestedClockOut}</td>
                      <td className="px-4 py-3 italic max-w-xs truncate">"{corr.reason}"</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            corr.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                              : corr.status === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                          }
                        >
                          {corr.status === 'Approved' ? '✓ Approved' : corr.status === 'Rejected' ? '✗ Rejected' : 'Pending Signoff'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {corr.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => {
                                setCorrections(corrections.map((c) => (c.id === corr.id ? { ...c, status: 'Approved' } : c)));
                                toast.success(`Correction ${corr.id} approved!`);
                              }}
                              size="sm"
                              className="bg-emerald-600 text-white text-xs py-1"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                setCorrections(corrections.map((c) => (c.id === corr.id ? { ...c, status: 'Rejected' } : c)));
                                toast.error(`Correction ${corr.id} rejected.`);
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 text-xs py-1"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PERMISSIONS — Total List of Each Employee Requested & Taken Permission */}
      {isTeamLead && activeTab === 'permissions' && (
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
      {isTeamLead && activeTab === 'ledger' && (
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
                {scopedRegister.map((u, idx) => {
                  const present = 21 - (idx % 2);
                  const absent = idx === 8 || idx === 9 ? 1 : 0;
                  const leave = idx % 3 === 0 ? 1 : 0;
                  const wfh = idx % 2 === 0 ? 2 : 1;
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
      {isSuperAdmin && activeTab === 'reports' && (
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
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">96.4%</span>
                <span className="text-[10px] text-muted-foreground">{reportsTimeRange}</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Hours Logged</span>
                <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">2,480 hrs</span>
                <span className="text-[10px] text-muted-foreground">Across all roster members</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Overtime Pay Disbursed</span>
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1 block">+$1,450</span>
                <span className="text-[10px] text-muted-foreground">Total overtime compensation</span>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Loss of Pay (LOP) Days</span>
                <span className="text-2xl font-extrabold text-amber-500 font-mono mt-1 block">2 Days</span>
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
                      { period: 'W1 Jul', attendancePct: 94.2, hoursLogged: 580, overtime: 120 },
                      { period: 'W2 Jul', attendancePct: 96.0, hoursLogged: 610, overtime: 180 },
                      { period: 'W3 Jul', attendancePct: 95.5, hoursLogged: 595, overtime: 150 },
                      { period: 'W4 Jul', attendancePct: 97.8, hoursLogged: 640, overtime: 210 },
                      { period: 'W1 Aug', attendancePct: 96.8, hoursLogged: 620, overtime: 190 },
                      { period: 'W2 Aug', attendancePct: 98.2, hoursLogged: 655, overtime: 240 },
                      { period: 'W3 Aug', attendancePct: 97.4, hoursLogged: 630, overtime: 200 },
                      { period: 'W4 Aug', attendancePct: 98.9, hoursLogged: 670, overtime: 280 },
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
                    .map((u, idx) => {
                      const leavesTaken = u.name === 'Anirudh' || u.name === 'Thanikaivel' || u.name === 'Kasthuri' ? 0 : idx % 2 === 0 ? 1 : 0;

                      return (
                        <tr key={u.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                            {u.name}
                            {leavesTaken === 0 && (
                              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[9px]">
                                0 Leaves
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">{u.team}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">01 Jan 2026</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-foreground">176 Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-rose-500">{leavesTaken} Days</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-purple-600 dark:text-purple-400">+{(idx + 1) * 12} hrs</td>
                          <td className="px-4 py-3 text-right font-extrabold font-mono text-foreground">{(95 + (idx % 5)).toFixed(1)}%</td>
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
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 bg-zinc-50 dark:bg-zinc-900/50 text-xs">
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

      {/* Attendance Regularization & Time Correction Request Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Attendance Regularization Request"
        description="Submit time correction request for forgotten clock-out, biometric offline, or external client meeting."
        maxWidth="md"
      >
        <form onSubmit={handleRequestCorrection} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Date Requiring Correction *</label>
            <input
              type="date"
              value={correctionDate}
              onChange={(e) => setCorrectionDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Requested Clock In Time *</label>
              <input
                type="time"
                value={requestedIn}
                onChange={(e) => setRequestedIn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Requested Clock Out Time *</label>
              <input
                type="time"
                value={requestedOut}
                onChange={(e) => setRequestedOut(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Reason & Explanation *</label>
            <textarea
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              rows={3}
              placeholder="Provide justification (e.g. Biometric kiosk offline, Forgotten punch out, Client site meeting)..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              Submit Correction Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
