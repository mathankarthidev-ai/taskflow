export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userTeam: string;
  clockIn: string; // ISO String
  clockOut: string | null; // ISO String
  status: 'working' | 'completed';
  totalSeconds: number;
  totalHours: number;
  workMode: string;
  ipAddress: string;
  location: string;
  geofenceVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BreakRecord {
  id: string;
  attendanceId: string;
  userId: string;
  breakType: string;
  breakStart: string;
  breakEnd: string | null;
  durationSeconds: number;
  createdAt: string;
}

export interface AttendanceAudit {
  id: string;
  attendanceId: string;
  action: 'CLOCK_IN' | 'CLOCK_OUT' | 'ADMIN_EDIT';
  oldValue: any;
  newValue: any;
  changedBy: string;
  createdAt: string;
}

// In-memory Database Store for Attendance
const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'ATT-2026-0910-01',
    userId: 'user_anirudh_01',
    userName: 'Anirudh K.',
    userTeam: 'Development',
    clockIn: '2026-09-10T08:30:00.000Z',
    clockOut: '2026-09-10T17:00:00.000Z',
    status: 'completed',
    totalSeconds: 30600,
    totalHours: 8.5,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: '2026-09-10T08:30:00.000Z',
    updatedAt: '2026-09-10T17:00:00.000Z',
  },
  {
    id: 'ATT-2026-0909-01',
    userId: 'user_anirudh_01',
    userName: 'Anirudh K.',
    userTeam: 'Development',
    clockIn: '2026-09-09T08:30:00.000Z',
    clockOut: '2026-09-09T17:00:00.000Z',
    status: 'completed',
    totalSeconds: 30600,
    totalHours: 8.5,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: '2026-09-09T08:30:00.000Z',
    updatedAt: '2026-09-09T17:00:00.000Z',
  },
  {
    id: 'ATT-2026-0908-01',
    userId: 'user_anirudh_01',
    userName: 'Anirudh K.',
    userTeam: 'Development',
    clockIn: '2026-09-08T08:28:00.000Z',
    clockOut: '2026-09-08T17:02:00.000Z',
    status: 'completed',
    totalSeconds: 30840,
    totalHours: 8.57,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: '2026-09-08T08:28:00.000Z',
    updatedAt: '2026-09-08T17:02:00.000Z',
  },
  {
    id: 'ATT-2026-0907-01',
    userId: 'user_aravind_02',
    userName: 'Aravind S.',
    userTeam: 'Development',
    clockIn: '2026-09-07T08:30:00.000Z',
    clockOut: '2026-09-07T16:30:00.000Z',
    status: 'completed',
    totalSeconds: 28800,
    totalHours: 8.0,
    workMode: 'Work From Office',
    ipAddress: '192.168.1.104',
    location: 'Anna Nagar, Chennai',
    geofenceVerified: true,
    createdAt: '2026-09-07T08:30:00.000Z',
    updatedAt: '2026-09-07T16:30:00.000Z',
  },
];

const breakRecords: BreakRecord[] = [];
const auditRecords: AttendanceAudit[] = [];

export const attendanceDb = {
  getAll: () => attendanceRecords,
  getById: (id: string) => attendanceRecords.find((r) => r.id === id),
  getActiveByUser: (userId: string) =>
    attendanceRecords.find((r) => r.userId === userId && r.status === 'working' && r.clockOut === null),
  getByUser: (userId: string) => attendanceRecords.filter((r) => r.userId === userId),
  add: (record: AttendanceRecord) => {
    attendanceRecords.unshift(record);
    return record;
  },
  update: (id: string, updates: Partial<AttendanceRecord>) => {
    const idx = attendanceRecords.findIndex((r) => r.id === id);
    if (idx !== -1) {
      attendanceRecords[idx] = { ...attendanceRecords[idx], ...updates, updatedAt: new Date().toISOString() };
      return attendanceRecords[idx];
    }
    return null;
  },
  addAudit: (audit: AttendanceAudit) => {
    auditRecords.unshift(audit);
    return audit;
  },
  getAudits: () => auditRecords,
  addBreak: (brk: BreakRecord) => {
    breakRecords.unshift(brk);
    return brk;
  },
  getBreaksByAttendanceId: (attendanceId: string) => breakRecords.filter((b) => b.attendanceId === attendanceId),
};
