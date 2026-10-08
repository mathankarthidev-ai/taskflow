import { User, Team, Task, Comment, NotificationItem, LeaveRequest, ReimbursementClaim, ClientItem, TaskTypeTemplate, Project, TimeEntry } from '@/types';
import { SEED_USERS, SEED_TEAMS, SEED_TASKS_INITIAL, SEED_TASK_TYPES, SEED_CLIENTS_FULL, SEED_PROJECTS, SEED_TIME_ENTRIES } from './seed-data';

// Internal global in-memory state
export class DataStore {
  public users: User[] = [];
  public teams: Team[] = [];
  public tasks: Task[] = [];
  public comments: Comment[] = [];
  public notifications: NotificationItem[] = [];
  public leaveRequests: LeaveRequest[] = [];
  public reimbursements: ReimbursementClaim[] = [];
  public clients: ClientItem[] = [];
  public taskTypes: TaskTypeTemplate[] = [];
  public projects: Project[] = [];
  public timeEntries: TimeEntry[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (this.initialized) return;

    // Initialize Users with IDs & skills
    this.users = SEED_USERS.map((u, i) => ({
      ...u,
      _id: `usr_${i + 1}`,
      skills: u.team === 'Development' 
        ? ['WordPress', 'PHP', 'React', 'WooCommerce', 'MySQL', 'APIs'] 
        : u.team === 'Marketing' 
        ? ['Google Ads', 'SEO', 'GSC', 'GA4', 'Meta Ads', 'Copywriting'] 
        : ['UI/UX', 'Figma', 'Branding', 'Tailwind', 'Photoshop'],
      createdAt: new Date().toISOString(),
    }));

    // Initialize Teams with IDs
    this.teams = SEED_TEAMS.map((t, i) => {
      const lead = this.users.find((u) => u.team === t.name && u.role === 'Team Lead');
      return {
        ...t,
        _id: `team_${i + 1}`,
        leadId: lead?._id,
        lead: lead,
      };
    });

    // Initialize Clients, Task Types, Projects, Time Entries
    this.clients = SEED_CLIENTS_FULL;
    this.taskTypes = SEED_TASK_TYPES;
    this.projects = SEED_PROJECTS;
    this.timeEntries = SEED_TIME_ENTRIES;

    // Initialize Tasks
    this.tasks = SEED_TASKS_INITIAL.map((t, i) => {
      const assignedUser = this.users.find((u) => u.email === t.userEmail);
      const createdByUser = this.users.find((u) => u.email === t.creatorEmail) || this.users[0];
      const raisedByUser = (t as any).raisedByEmail ? this.users.find((u) => u.email === (t as any).raisedByEmail) : undefined;
      const reviewerUser = (t as any).assignedReviewerEmail ? this.users.find((u) => u.email === (t as any).assignedReviewerEmail) : undefined;

      return {
        _id: `task_${i + 1}`,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        team: t.team,
        clientName: (t as any).clientName || 'Apollo Hospitals',
        doctorName: (t as any).doctorName || 'Dr. Umed Specialist',
        clientApproved: true,
        approvalToken: `token_client_appr_${i + 1}`,
        approvalExpiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
        assignedTo: assignedUser?._id,
        assignedUser: assignedUser,
        createdBy: createdByUser._id,
        createdByUser: createdByUser,
        raisedBy: raisedByUser?._id,
        raisedByUser: raisedByUser,
        incoming: t.incoming,
        approvalStatus: (t as any).approvalStatus || (createdByUser.role === 'Team Member' ? 'pending_approval' : 'approved'),
        assignedReviewerId: reviewerUser?._id,
        assignedReviewerName: reviewerUser?.name || ((t as any).assignedReviewerName),
        reviewStatus: (t as any).reviewStatus || (t.status === 'Review' ? 'pending_review' : 'none'),
        dueDate: t.dueDate,
        estimatedHours: 10,
        actualHours: 3.5,
        isRecurring: i % 3 === 0,
        recurringFrequency: i % 3 === 0 ? 'monthly' : undefined,
        labels: t.labels,
        attachments: t.attachments || [],
        subtasks: (t as any).subtasks || [],
        commentsCount: i === 0 ? 2 : 0,
        history: (t as any).history || [
          {
            id: `hist_init_${i}`,
            action: `Task created by ${createdByUser.name} (${createdByUser.role})`,
            performedBy: createdByUser.name,
            performedRole: createdByUser.role,
            timestamp: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Initial Leave Requests (10 Demo Records)
    this.leaveRequests = [];

    // Initial Reimbursement Claims (Clean Slate)
    this.reimbursements = [];

    this.comments = [];

    // Initial Notifications
    this.notifications = [];

    this.initialized = true;
  }

  public reset(): void {
    this.initialized = false;
    this.init();
  }
}

// Global singleton instance across HMR in development
declare global {
  // eslint-disable-next-line no-var
  var globalDataStore: DataStore | undefined;
}

export const mockStore = globalThis.globalDataStore || new DataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.globalDataStore = mockStore;
}
