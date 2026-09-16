import { User, Team, Task, Comment, NotificationItem, LeaveRequest, ReimbursementClaim } from '@/types';
import { SEED_USERS, SEED_TEAMS, SEED_TASKS_INITIAL } from './seed-data';

// Internal global in-memory state
export class DataStore {
  public users: User[] = [];
  public teams: Team[] = [];
  public tasks: Task[] = [];
  public comments: Comment[] = [];
  public notifications: NotificationItem[] = [];
  public leaveRequests: LeaveRequest[] = [];
  public reimbursements: ReimbursementClaim[] = [];
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

    // Initial Leave Requests (matching Ambizcon Pulse seed data)
    this.leaveRequests = [
      {
        id: 'LR-1041',
        empId: 'usr_7',
        empName: 'Noah Patel',
        empTeam: 'Development',
        type: 'Casual',
        from: '29 Jul',
        to: '30 Jul',
        days: 2,
        reason: 'Family function in Thanjavur',
        tl: null,
        ceo: null,
        raised: '2 days ago',
      },
      {
        id: 'LR-1040',
        empId: 'usr_6',
        empName: 'Ava Stone',
        empTeam: 'Marketing',
        type: 'Casual',
        from: '31 Jul',
        to: '31 Jul',
        days: 0.5,
        half: true,
        session: 'Morning',
        reason: 'Bank work',
        tl: null,
        ceo: null,
        raised: '1 hour ago',
      },
      {
        id: 'LR-1042',
        empId: 'usr_5',
        empName: 'Oliver Swift',
        empTeam: 'Creative',
        type: 'Sick',
        from: '25 Jul',
        to: '25 Jul',
        days: 1,
        reason: 'Dental procedure',
        tl: 'approved',
        ceo: null,
        raised: '5 hours ago',
      },
      {
        id: 'LR-1043',
        empId: 'usr_5',
        empName: 'Oliver Swift',
        empTeam: 'Creative',
        type: 'Earned',
        from: '04 Aug',
        to: '08 Aug',
        days: 5,
        reason: 'Annual holiday',
        tl: null,
        ceo: null,
        raised: 'yesterday',
      },
      {
        id: 'LR-1038',
        empId: 'usr_2',
        empName: 'Maya Lin',
        empTeam: 'Creative',
        type: 'Earned',
        from: '12 Aug',
        to: '14 Aug',
        days: 3,
        reason: 'Family travel',
        tl: null,
        ceo: null,
        raised: '3 hours ago',
        chat: [
          { role: 'ceo', who: 'Alex', text: 'Who covers Creative team those days?', time: '2h ago' },
          { role: 'lead', who: 'Maya', text: 'Oliver will cover — I will brief him.', time: '1h ago' },
        ],
      },
      {
        id: 'LR-1039',
        empId: 'usr_6',
        empName: 'Ava Stone',
        empTeam: 'Marketing',
        type: 'Casual',
        from: '18 Jul',
        to: '18 Jul',
        days: 1,
        reason: 'Personal errand',
        tl: 'approved',
        ceo: 'approved',
        raised: '1 week ago',
      },
    ];

    // Initial Reimbursement Claims (matching AmbizClaim seed data)
    this.reimbursements = [
      {
        _id: 'claim_101',
        claimNo: 'CLM-8041',
        userId: 'usr_5',
        userName: 'Oliver Swift',
        userTeam: 'Creative',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
        category: 'Client Lunch',
        amount: 3450,
        date: '2026-07-28',
        description: 'Client lunch meeting with HealthTech media partners at Trident Hotel',
        receiptName: 'trident_lunch_bill.pdf',
        receiptUrl: '#',
        tlStatus: 'approved',
        ceoStatus: null,
        isPaid: false,
        status: 'Pending CEO',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        _id: 'claim_102',
        claimNo: 'CLM-8042',
        userId: 'usr_6',
        userName: 'Ava Stone',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava',
        category: 'Travel',
        amount: 5200,
        date: '2026-07-30',
        description: 'Flight tickets to Bengaluru for Healthcare Expo booth setup',
        receiptName: 'indigo_flight_ticket.pdf',
        receiptUrl: '#',
        tlStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        _id: 'claim_103',
        claimNo: 'CLM-8043',
        userId: 'usr_7',
        userName: 'Noah Patel',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah',
        category: 'Software',
        amount: 8900,
        date: '2026-08-01',
        description: 'Annual Vercel Enterprise seat & Supabase Pro database tier renewal',
        receiptName: 'vercel_supabase_invoice.pdf',
        receiptUrl: '#',
        tlStatus: null,
        ceoStatus: null,
        isPaid: false,
        status: 'Pending TL',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        _id: 'claim_104',
        claimNo: 'CLM-8044',
        userId: 'usr_2',
        userName: 'Maya Lin',
        userTeam: 'Creative',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
        category: 'Equipment',
        amount: 14500,
        date: '2026-07-20',
        description: '4K Wacom Drawing Tablet for brand design team assets',
        receiptName: 'wacom_amazon_bill.pdf',
        receiptUrl: '#',
        tlStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: false,
        status: 'Approved',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ];

    // Initial Comments
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
