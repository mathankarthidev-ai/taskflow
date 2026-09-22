export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userTeam: string;
  company?: string;
  sessionName?: string;
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

const ROSTER_MEMBERS = [
  // Ambizcon Health - India Roster
  { id: 'user_anirudh_01', name: 'Anirudh', team: 'Development', email: 'anirudh@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_mathan_02', name: 'Mathan P', team: 'Development', email: 'mathan@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_aravind_03', name: 'Aravind Kalaivanan', team: 'Development', email: 'aravind@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_kenneth_04', name: 'Kennath Franklin J', team: 'Marketing', email: 'kenneth@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_deva_05', name: 'Deva Priya D A', team: 'Creative', email: 'deva@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_thanikaivel_06', name: 'Thanikaivel Arumugam', team: 'Development', email: 'thanikaivel@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_naraine_07', name: 'Naraine R', team: 'Development', email: 'naraine@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_mathanmk_08', name: 'Mathanmk', team: 'Development', email: 'mathanmk@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_mathi_09', name: 'Mathi Pandian', team: 'Marketing', email: 'mathi@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_krithika_10', name: 'Kiruthikashri M', team: 'Marketing', email: 'krithikashri@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_siddesh_11', name: 'B. Siddesh', team: 'Marketing', email: 'siddesh@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_sathish_12', name: 'V. Sathish Kumar', team: 'Creative', email: 'sathish@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_kavish_13', name: 'Kavish TG', team: 'Creative', email: 'kavish@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_kasthuri_14', name: 'Kasthuri M', team: 'Creative', email: 'kasthuri@ambizcon.com', company: 'Ambizcon Health - India' },
  { id: 'user_ahamed_15', name: 'Ahamed', team: 'Creative', email: 'ahamed@ambizcon.com', company: 'Ambizcon Health - India' },

  // Ambizcon - Australia Roster (Brisbane HQ - Leadership)
  { id: 'user_anirudh_aus', name: 'Anirudh', team: 'Development', email: 'anirudh@ambizcon.com', company: 'Ambizcon - Australia' },
];

const LAST_10_DAYS = [
  '2026-09-20',
  '2026-09-19',
  '2026-09-18',
  '2026-09-17',
  '2026-09-16',
  '2026-09-15',
  '2026-09-14',
  '2026-09-13',
  '2026-09-12',
  '2026-09-11',
];

const DAILY_3_SESSIONS = [
  {
    code: 'S3',
    name: 'Evening Shift Close',
    inTime: '11:15:00.000Z', // 04:45 PM IST / 09:15 PM AEST
    outTime: '12:05:00.000Z', // 05:35 PM IST / 10:05 PM AEST
    durationSeconds: 3000,
    durationHours: 0.83,
  },
  {
    code: 'S2',
    name: 'Afternoon Shift',
    inTime: '08:15:00.000Z', // 01:45 PM IST / 06:15 PM AEST
    outTime: '11:00:00.000Z', // 04:30 PM IST / 09:00 PM AEST
    durationSeconds: 9900,
    durationHours: 2.75,
  },
  {
    code: 'S1',
    name: 'Morning Shift',
    inTime: '03:00:00.000Z', // 08:30 AM IST / 01:00 PM AEST
    outTime: '07:30:00.000Z', // 01:00 PM IST / 05:30 PM AEST
    durationSeconds: 16200,
    durationHours: 4.5,
  },
];

// Helper to generate clock-in/out records (clean production slate)
function generate10Day3SessionRecords(): AttendanceRecord[] {
  return [];
}

// In-memory Database Store for Attendance
let attendanceRecords: AttendanceRecord[] = [];
const breakRecords: BreakRecord[] = [];
const auditRecords: AttendanceAudit[] = [];

export const attendanceDb = {
  getAll: () => attendanceRecords,
  getById: (id: string) => attendanceRecords.find((r) => r.id === id),
  getActiveByUser: (userId: string) =>
    attendanceRecords.find((r) => (r.userId === userId || r.userName.toLowerCase() === userId.toLowerCase()) && r.status === 'working' && r.clockOut === null),
  getByUser: (userId: string) =>
    attendanceRecords.filter((r) => r.userId === userId || r.userName.toLowerCase() === userId.toLowerCase() || userId.toLowerCase().includes(r.userName.toLowerCase())),
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
  resetAll: () => {
    attendanceRecords = [];
    breakRecords.length = 0;
    auditRecords.length = 0;
    return attendanceRecords;
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
