export type UserRole = 'Team Member' | 'Team Lead' | 'Super Admin' | 'Admin' | 'Reception Staff';
export type CompanyBranch = 'Ambizcon Health - India' | 'Ambizcon' | 'India & Australia';
export type TeamName = 'Creative' | 'Marketing' | 'Development' | string;
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';
export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';
export type WorkMode = 'Work From Office' | 'Work From Home';

export interface EducationRecord {
  id: string;
  degree: string; // Degree / Course / Standard (e.g. B.Tech, HSC, MCA)
  institution: string; // College or School Name
  year: string; // Passing Year or Duration (e.g. 2018 - 2022)
  area: string; // Area / City / Locality (e.g. Guindy, Chennai)
  state: string; // State / Region (e.g. Tamil Nadu)
  grade?: string; // Percentage / CGPA / Grade
}

export interface ExperienceRecord {
  id: string;
  role: string; // Designation / Role (e.g. Senior Software Engineer)
  company: string; // Company Name (e.g. Ambizcon Technologies)
  year: string; // Working Duration / Years (e.g. 2022 - Present)
  area: string; // Area / City / Locality (e.g. OMR, Chennai)
  state: string; // State / Region (e.g. Tamil Nadu)
  description?: string; // Key Responsibilities / Description
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  company?: CompanyBranch;
  avatar: string;
  birthday?: string; // e.g. "27 Sep"
  dob?: string; // e.g. "14/10/2000"
  workMode?: WorkMode;
  skills?: string[]; // e.g. ["WordPress", "SEO", "Google Ads", "React", "Node.js"]
  permissionCount?: number;
  hasResetPassword?: boolean;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bankAccount?: string;
  taxId?: string;
  bloodGroup?: string;
  education?: EducationRecord[];
  experience?: ExperienceRecord[];
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
  isInternal?: boolean; // Client-visible vs internal team note
  createdAt: string;
  updatedAt?: string;
}

export interface ClientSite {
  id: string;
  clientId: string;
  clientName: string;
  siteName: string;
  liveUrl: string;
  stagingUrl?: string;
  hostingProvider?: string;
  credentialsRef?: string; // Pointer to Password Manager entry (e.g. 1Password / Bitwarden vault ref)
  notes?: string;
  createdAt: string;
}

export interface ClientService {
  id: string;
  clientId: string;
  clientName: string;
  serviceName: string; // e.g. "Monthly SEO Retainer", "WordPress Maintenance", "Google Ads"
  retainerHours: number; // e.g. 20 hours/month
  monthlyFee: number;
  status: 'active' | 'paused' | 'completed';
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  title: string; // e.g. "Website Redesign 2026", "SEO Growth Campaign"
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  startDate?: string;
  targetDate?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  category?: string; // e.g. "Medical Centers", "Specialist", "Wellness", "Telehealth", "Cardiologists", "Business / Other Services", "Diagnostics", "Dermatology / Cosmetics", "Others"
  contactPerson?: string;
  email?: string;
  phone?: string;
  assetsUrl?: string;
  status: 'active' | 'pending_admin_approval';
  addedBy: string;
  addedByRole?: string;
  sites?: ClientSite[];
  services?: ClientService[];
  createdAt: string;
}

export interface TaskTypeTemplate {
  id: string;
  name: string; // e.g. "WordPress Site Build", "Monthly SEO Audit", "Ad Campaign Setup", "WP Core & Plugin Update", "Speed Optimization"
  category: string;
  description: string;
  defaultChecklist: string[];
  defaultEstimatedHours: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  hoursLogged: number;
  isExtraHours?: boolean;
  workDescription: string;
  date: string;
  createdAt: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size?: string;
  bytes?: number;
}

export interface TaskHistoryItem {
  id: string;
  action: string;
  performedBy: string;
  performedRole?: string;
  timestamp: string;
  note?: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export type NotificationRecipientType = 'all_teams' | 'all_tl' | 'specific_team' | 'custom_members';

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';
  reminderDate: string; // YYYY-MM-DD
  reminderTime: string; // e.g. "10:00 AM"
  remindBeforeDays?: number; // e.g. 30, 14, 7, 1
  repeatEndsOption: 'never' | 'until_date';
  repeatUntilDate?: string;
  recipientType?: NotificationRecipientType;
  targetTeam?: string; // e.g. "Development", "Marketing", "Creative"
  targetUserIds?: string[]; // Array of selected user IDs when custom_members is chosen
  summaryText?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  team: TeamName;
  clientName?: string;
  clientId?: string;
  doctorName?: string; // Doctor / GP Name e.g. "Dr. Umed", "Dr. Sarah Jenkins"
  specialist?: string; // Medical Specialty e.g. "Cardiology", "General Practice", "Gastroenterology"
  projectId?: string;
  projectName?: string;
  taskTypeId?: string;
  taskTypeName?: string;
  clientApproved?: boolean;
  approvalToken?: string; // Share-link token for external client sign-off without login
  approvalExpiresAt?: string;
  assignedTo?: string; // User ID
  assignedUser?: User;
  createdBy: string; // User ID
  createdByUser?: User;
  raisedBy?: string; // User ID or Team Name
  raisedByUser?: User;
  incoming: boolean;
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected';
  approvedBy?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewStatus?: 'none' | 'pending_review' | 'approved' | 'changes_requested';
  reviewNote?: string;
  startDate?: string;
  dueDate: string;
  estimatedHours?: number;
  actualHours?: number;
  extraHours?: number;
  timeEntries?: TimeEntry[];
  progressPct?: number;
  subtasks?: SubtaskItem[];
  dependencies?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  reminderSettings?: ReminderSettings;
  labels: string[];
  attachments?: TaskAttachment[];
  commentsCount?: number;
  comments?: Comment[];
  history?: TaskHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'assigned' | 'updated' | 'comment' | 'status_change' | 'incoming' | 'task_approval' | 'review_assigned' | 'client_approval';
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
export type ClaimCategory = string;
export type ClaimStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Rejected' | 'Cancelled';

export interface ExpenseItem {
  id: string;
  category: ClaimCategory;
  amount: number;
  date: string;
  description: string;
  receiptName?: string;
  receiptUrl?: string;
}

export interface ClaimComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

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
  company?: string;
  category: ClaimCategory;
  amount: number;
  date: string;
  description: string;
  receiptName?: string;
  receiptUrl?: string;
  items?: ExpenseItem[];
  comments?: ClaimComment[];
  rejectionReason?: string;
  draftSavedAt?: string;
  adminStatus?: 'approved' | 'rejected' | null;
  tlStatus?: 'approved' | 'rejected' | null;
  ceoStatus?: 'approved' | 'rejected' | null;
  isPaid: boolean;
  status: ClaimStatus;
  createdAt: string;
}

/* ================= AMBIZCON TEAM MESSAGING ================= */
export type ChatScope = 'all' | 'team' | 'direct';

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  senderTeam?: TeamName;
  text: string;
  fileAttachment?: {
    name: string;
    url: string;
    size?: string;
    type?: string;
  };
  linkUrl?: string;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  scope: ChatScope;
  team?: TeamName;
  participantIds?: string[]; // user IDs for direct messages
  description?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}
