import { User, Team, Task, Comment, NotificationItem } from '@/types';
import { SEED_USERS, SEED_TEAMS, SEED_TASKS_INITIAL } from './seed-data';

// Internal global in-memory state
export class DataStore {
  public users: User[] = [];
  public teams: Team[] = [];
  public tasks: Task[] = [];
  public comments: Comment[] = [];
  public notifications: NotificationItem[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (this.initialized) return;

    // Initialize Users with IDs
    this.users = SEED_USERS.map((u, i) => ({
      ...u,
      _id: `usr_${i + 1}`,
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

    // Initialize Tasks
    this.tasks = SEED_TASKS_INITIAL.map((t, i) => {
      const assignedUser = this.users.find((u) => u.email === t.userEmail);
      const createdByUser = this.users.find((u) => u.email === t.creatorEmail) || this.users[0];
      const raisedByUser = t.raisedByEmail ? this.users.find((u) => u.email === t.raisedByEmail) : undefined;

      return {
        _id: `task_${i + 1}`,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        team: t.team,
        assignedTo: assignedUser?._id,
        assignedUser: assignedUser,
        createdBy: createdByUser._id,
        createdByUser: createdByUser,
        raisedBy: raisedByUser?._id,
        raisedByUser: raisedByUser,
        incoming: t.incoming,
        dueDate: t.dueDate,
        labels: t.labels,
        attachments: t.attachments,
        commentsCount: i === 0 ? 2 : 0,
        createdAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Initialize sample comments on task_1
    this.comments = [
      {
        _id: 'comment_1',
        taskId: 'task_1',
        userId: 'usr_2',
        user: this.users[1],
        message: 'Looking great Oliver! Make sure dark mode contrast meets WCAG AA standards.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        _id: 'comment_2',
        taskId: 'task_1',
        userId: 'usr_5',
        user: this.users[4],
        message: '@Maya tested with accessibility contrast analyzer, all checks passing! 🚀',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    // Initial Notifications
    this.notifications = [
      {
        _id: 'notif_1',
        userId: 'usr_5',
        type: 'assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned to Redesign SaaS Dashboard Layout.',
        read: false,
        link: '/kanban',
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'notif_2',
        userId: 'usr_4',
        type: 'incoming',
        title: 'New Cross-Team Task Raised',
        message: 'Ava Stone raised an incoming task for the Development team.',
        read: false,
        link: '/incoming',
        createdAt: new Date().toISOString(),
      },
    ];

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
