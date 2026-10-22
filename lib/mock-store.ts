import { User, Team, Task, Comment, NotificationItem, LeaveRequest, ReimbursementClaim, ClientItem, TaskTypeTemplate, Project, TimeEntry } from '@/types';
import { SEED_USERS, SEED_TEAMS, SEED_TASK_TYPES, SEED_CLIENTS_FULL, SEED_PROJECTS } from './seed-data';
import { getEmployeeNumber } from './utils';

// Internal global in-memory state (Clean Slate: No dummy tasks, leaves, or claims)
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

    // Initialize Users with IDs, skills & auto-generated Employee ID (APN 001, APN 002...)
    this.users = SEED_USERS.map((u, i) => ({
      ...u,
      _id: `usr_${i + 1}`,
      employeeNumber: getEmployeeNumber(u, i),
      skills:
        u.team === 'Development'
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

    // Initialize Clients, Task Types, Projects
    this.clients = SEED_CLIENTS_FULL;
    this.taskTypes = SEED_TASK_TYPES;
    this.projects = SEED_PROJECTS;

    // Clean Slate: No dummy tasks, claims, leaves, comments, or time entries
    this.tasks = [];
    this.leaveRequests = [];
    this.reimbursements = [];
    this.timeEntries = [];
    this.comments = [];
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
