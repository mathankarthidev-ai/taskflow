export type UserRole = 'Team Member' | 'Team Lead' | 'Super Admin';
export type TeamName = 'Creative' | 'Marketing' | 'Development';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';
export type WorkMode = 'Work From Office' | 'Work From Home';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  avatar: string;
  birthday?: string; // e.g. "27 Sep"
  workMode?: WorkMode;
  permissionCount?: number;
  hasResetPassword?: boolean;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bankAccount?: string;
  taxId?: string;
  bloodGroup?: string;
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: TeamName;
  code: string;
  description: string;
  leadId?: string;
  lead?: User;
  membersCount?: number;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: string;
  user?: User;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  team: TeamName;
  assignedTo?: string; // User ID
  assignedUser?: User;
  createdBy: string; // User ID
  createdByUser?: User;
  raisedBy?: string; // User ID or Team Name
  raisedByUser?: User;
  incoming: boolean;
  dueDate: string;
  labels: string[];
  attachments?: TaskAttachment[];
  commentsCount?: number;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'assigned' | 'updated' | 'comment' | 'status_change' | 'incoming';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DateRangeFilter {
  range: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingReviewTasks: number;
  overdueTasks: number;
  avgCompletionHours: number;
  incomingQueueCount: number;
}

/* ================= AMBIZCON INTELLIGENCE & MARKET CONCEPTS ================= */
export interface GPIntelligence {
  gpsToFollowUp: number;
  practicesNotContacted: number;
  newGpsDetected: number;
  doctorsDeparted: number;
  highValueOpportunities: number;
  meetingsScheduled: number;
  activeGpCampaigns: number;
  medicalCentresTracked: number;
  referralGrowthMoM: string;
}

export interface MarketIntelligence {
  postcode: string;
  locationName: string;
  population: number;
  populationGrowthPct: string;
  medianHouseholdIncome: string;
  seifaScore: number;
  marketOpportunityScore: number;
  catchmentPopulation: number;
  relevantPopulation: number;
  existingPatientBase: number;
  marketPenetrationPct: string;
  untappedOpportunity: number;
  absFeedConnected: boolean;
}

export interface IntegrationSource {
  source: string;
  type: string;
  refresh: string;
  lastSync: string;
  status: 'Connected' | 'Manual Data' | 'Reconnect Needed' | 'Not Available';
}

export interface AIAnalystQuery {
  id: string;
  question: string;
  fact: string;
  insight: string;
  recommendation: string;
  assumption?: string;
  missingData?: string;
  sources: string;
  confidence: string;
}

/* ================= AMBIZCON PULSE ATTENDANCE & LEAVE ================= */
export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Loss of Pay';
export type LeaveStatus = 'awaiting_tl' | 'awaiting_ceo' | 'approved' | 'rejected';

export interface LeaveBalance {
  earned: number;
  casual: number;
  sick: number;
}

export interface LeaveChatMessage {
  role: 'lead' | 'ceo';
  who: string;
  text: string;
  time: string;
}

export interface LeaveRequest {
  id: string;
  empId: string;
  empName?: string;
  empTeam?: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  half?: boolean;
  session?: 'Morning' | 'Afternoon';
  reason: string;
  tl: 'approved' | 'rejected' | null;
  ceo: 'approved' | 'rejected' | null;
  raised: string;
  chat?: LeaveChatMessage[];
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'present' | 'late' | 'leave' | 'absent';
  totalMinutes?: number;
  workMode?: WorkMode;
  startingTime?: string;
}

/* ================= AMBIZCLAIM REIMBURSEMENTS ================= */
export type ClaimCategory = 'Travel' | 'Client Lunch' | 'Software' | 'Equipment' | 'Office Supplies' | 'Medical';
export type ClaimStatus = 'Pending TL' | 'Pending CEO' | 'Approved' | 'Paid' | 'Rejected';

export interface BreakSession {
  id: string;
  type: 'Lunch' | 'Tea' | 'Personal' | 'Meeting';
  startTime: string;
  endTime?: string;
  durationMinutes: number;
}

export interface AttendanceCorrectionRequest {
  id: string;
  userId: string;
  userName: string;
  userTeam: TeamName;
  date: string;
  originalClockIn: string;
  originalClockOut: string;
  requestedClockIn: string;
  requestedClockOut: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface ReimbursementClaim {
  _id: string;
  claimNo: string;
  userId: string;
  userName: string;
  userTeam: TeamName;
  userAvatar?: string;
  category: ClaimCategory;
  amount: number;
  date: string;
  description: string;
  receiptName?: string;
  receiptUrl?: string;
  tlStatus: 'approved' | 'rejected' | null;
  ceoStatus: 'approved' | 'rejected' | null;
  isPaid: boolean;
  status: ClaimStatus;
  createdAt: string;
}
