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

    // Helper for YYYY-MM-DD local date offset
    const getOffsetDateStr = (daysAgo: number): string => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const getOffsetIso = (daysAgo: number): string => {
      const d = new Date(Date.now() - daysAgo * 86400000);
      return d.toISOString();
    };

    // Initial Reimbursement Claims (Spanning Daily/Today, Weekly, Monthly & Historical across India & Australia)
    this.reimbursements = [
      // === TODAY (DAILY) CLAIMS ===
      {
        _id: 'claim_seed_1',
        claimNo: 'CLM-8041',
        userId: 'usr_2',
        userName: 'Mathan P',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan',
        company: 'Ambizcon Health - India',
        category: 'Software',
        amount: 2450,
        date: getOffsetDateStr(0),
        description: 'Cloud Server GPU API & Vercel Pro Add-on Renewal',
        receiptName: 'vercel_cloud_invoice_oct.pdf',
        items: [
          {
            id: 'itm_s1_1',
            category: 'Software',
            amount: 2450,
            date: getOffsetDateStr(0),
            description: 'Cloud Server GPU API & Vercel Pro Add-on Renewal',
            receiptName: 'vercel_cloud_invoice_oct.pdf',
          },
        ],
        comments: [
          {
            id: 'cmt_s1',
            authorName: 'Anirudh',
            authorRole: 'Super Admin',
            text: 'Approved & settled immediately for production deployment.',
            createdAt: getOffsetIso(0),
          },
        ],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(0),
      },
      {
        _id: 'claim_seed_2',
        claimNo: 'CLM-8042',
        userId: 'usr_3',
        userName: 'Aravind Kalaivanan',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind',
        company: 'Ambizcon Health - India',
        category: 'Client Lunch',
        amount: 1850,
        date: getOffsetDateStr(0),
        description: 'Hospital Portal Architecture Review Lunch with Apollo IT Team',
        receiptName: 'apollo_client_lunch_bill.jpg',
        items: [
          {
            id: 'itm_s2_1',
            category: 'Client Lunch',
            amount: 1850,
            date: getOffsetDateStr(0),
            description: 'Hospital Portal Architecture Review Lunch with Apollo IT Team',
            receiptName: 'apollo_client_lunch_bill.jpg',
          },
        ],
        comments: [],
        adminStatus: null,
        ceoStatus: null,
        isPaid: false,
        status: 'Pending Approval',
        createdAt: getOffsetIso(0),
      },
      {
        _id: 'claim_seed_3',
        claimNo: 'CLM-8043',
        userId: 'usr_15',
        userName: 'Adriana Ruju',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana',
        company: 'Ambizcon',
        category: 'Travel',
        amount: 3200,
        date: getOffsetDateStr(0),
        description: 'Brisbane Specialist Clinic Outreach Cab & Parking Pass',
        receiptName: 'brisbane_clinic_cab_receipt.pdf',
        items: [
          {
            id: 'itm_s3_1',
            category: 'Travel',
            amount: 3200,
            date: getOffsetDateStr(0),
            description: 'Brisbane Specialist Clinic Outreach Cab & Parking Pass',
            receiptName: 'brisbane_clinic_cab_receipt.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(0),
      },

      // === THIS WEEK (WEEKLY: 2 TO 6 DAYS AGO) CLAIMS ===
      {
        _id: 'claim_seed_4',
        claimNo: 'CLM-8038',
        userId: 'usr_4',
        userName: 'Kennath Franklin J',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenneth',
        company: 'Ambizcon Health - India',
        category: 'Travel',
        amount: 4600,
        date: getOffsetDateStr(2),
        description: 'GP Referral Network Field Visits — Fuel & Metro Passes',
        receiptName: 'gp_field_visit_travel.pdf',
        items: [
          {
            id: 'itm_s4_1',
            category: 'Travel',
            amount: 3100,
            date: getOffsetDateStr(2),
            description: 'Clinic Visit Cab & Highway Toll Charges',
            receiptName: 'cab_toll_receipt.pdf',
          },
          {
            id: 'itm_s4_2',
            category: 'Client Lunch',
            amount: 1500,
            date: getOffsetDateStr(2),
            description: 'Refreshments with Clinic Practice Managers',
            receiptName: 'clinic_refreshments.jpg',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(2),
      },
      {
        _id: 'claim_seed_5',
        claimNo: 'CLM-8039',
        userId: 'usr_5',
        userName: 'Deva Priya D A',
        userTeam: 'Creative',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deva',
        company: 'Ambizcon Health - India',
        category: 'Software',
        amount: 3400,
        date: getOffsetDateStr(3),
        description: 'Figma Enterprise Seat & Envato Healthcare Stock Assets',
        receiptName: 'figma_envato_receipt.pdf',
        items: [
          {
            id: 'itm_s5_1',
            category: 'Software',
            amount: 3400,
            date: getOffsetDateStr(3),
            description: 'Figma Enterprise Seat & Envato Healthcare Stock Assets',
            receiptName: 'figma_envato_receipt.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: false,
        status: 'Approved',
        createdAt: getOffsetIso(3),
      },
      {
        _id: 'claim_seed_6',
        claimNo: 'CLM-8040',
        userId: 'usr_6',
        userName: 'Thanikaivel Arumugam',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanikaivel',
        company: 'Ambizcon Health - India',
        category: 'Equipment',
        amount: 5800,
        date: getOffsetDateStr(5),
        description: 'USB-C Multiport Dock & High-Speed NVMe Backup Drive',
        receiptName: 'hardware_dock_invoice.pdf',
        items: [
          {
            id: 'itm_s6_1',
            category: 'Equipment',
            amount: 5800,
            date: getOffsetDateStr(5),
            description: 'USB-C Multiport Dock & High-Speed NVMe Backup Drive',
            receiptName: 'hardware_dock_invoice.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(5),
      },
      {
        _id: 'claim_seed_7',
        claimNo: 'CLM-8037',
        userId: 'usr_15',
        userName: 'Adriana Ruju',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana',
        company: 'Ambizcon',
        category: 'Client Lunch',
        amount: 4900,
        date: getOffsetDateStr(4),
        description: 'Queensland Medical Centre Partner Luncheon & Presentation Printed Decks',
        receiptName: 'qld_partner_lunch.pdf',
        items: [
          {
            id: 'itm_s7_1',
            category: 'Client Lunch',
            amount: 4900,
            date: getOffsetDateStr(4),
            description: 'Queensland Medical Centre Partner Luncheon & Presentation Printed Decks',
            receiptName: 'qld_partner_lunch.pdf',
          },
        ],
        comments: [],
        adminStatus: null,
        ceoStatus: null,
        isPaid: false,
        status: 'Pending Approval',
        createdAt: getOffsetIso(4),
      },

      // === THIS MONTH (MONTHLY: 10 TO 25 DAYS AGO) CLAIMS ===
      {
        _id: 'claim_seed_8',
        claimNo: 'CLM-8033',
        userId: 'usr_2',
        userName: 'Mathan P',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan',
        company: 'Ambizcon Health - India',
        category: 'Equipment',
        amount: 8500,
        date: getOffsetDateStr(12),
        description: '27-inch IPS Coding Monitor & Ergonomic Desk Arm for Dev Bay',
        receiptName: 'lg_monitor_tax_invoice.pdf',
        items: [
          {
            id: 'itm_s8_1',
            category: 'Equipment',
            amount: 8500,
            date: getOffsetDateStr(12),
            description: '27-inch IPS Coding Monitor & Ergonomic Desk Arm for Dev Bay',
            receiptName: 'lg_monitor_tax_invoice.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(12),
      },
      {
        _id: 'claim_seed_9',
        claimNo: 'CLM-8034',
        userId: 'usr_9',
        userName: 'Mathi Pandian',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathi',
        company: 'Ambizcon Health - India',
        category: 'Office Supplies',
        amount: 2750,
        date: getOffsetDateStr(16),
        description: 'Healthcare Conference Standees, Brochures & Lanyard Printing',
        receiptName: 'print_standee_invoice.pdf',
        items: [
          {
            id: 'itm_s9_1',
            category: 'Office Supplies',
            amount: 2750,
            date: getOffsetDateStr(16),
            description: 'Healthcare Conference Standees, Brochures & Lanyard Printing',
            receiptName: 'print_standee_invoice.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(16),
      },
      {
        _id: 'claim_seed_10',
        claimNo: 'CLM-8035',
        userId: 'usr_12',
        userName: 'V. Sathish Kumar',
        userTeam: 'Creative',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sathish',
        company: 'Ambizcon Health - India',
        category: 'Medical',
        amount: 3900,
        date: getOffsetDateStr(20),
        description: 'First-Aid Wellness Kit & Blue-Light Filter Glasses Reimbursement',
        receiptName: 'wellness_kit_receipt.pdf',
        items: [
          {
            id: 'itm_s10_1',
            category: 'Medical',
            amount: 3900,
            date: getOffsetDateStr(20),
            description: 'First-Aid Wellness Kit & Blue-Light Filter Glasses Reimbursement',
            receiptName: 'wellness_kit_receipt.pdf',
          },
        ],
        comments: [],
        adminStatus: null,
        ceoStatus: null,
        isPaid: false,
        status: 'Pending Approval',
        createdAt: getOffsetIso(20),
      },
      {
        _id: 'claim_seed_11',
        claimNo: 'CLM-8036',
        userId: 'usr_15',
        userName: 'Adriana Ruju',
        userTeam: 'Marketing',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana',
        company: 'Ambizcon',
        category: 'Software',
        amount: 6400,
        date: getOffsetDateStr(15),
        description: 'SEMrush Healthcare Keyword Tracker & Australian GP Directory Subscription',
        receiptName: 'au_gp_directory_sub.pdf',
        items: [
          {
            id: 'itm_s11_1',
            category: 'Software',
            amount: 6400,
            date: getOffsetDateStr(15),
            description: 'SEMrush Healthcare Keyword Tracker & Australian GP Directory Subscription',
            receiptName: 'au_gp_directory_sub.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(15),
      },

      // === EARLIER / HISTORICAL (ALL TIME: 38 TO 55 DAYS AGO) CLAIMS ===
      {
        _id: 'claim_seed_12',
        claimNo: 'CLM-8029',
        userId: 'usr_1',
        userName: 'Anirudh',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anirudh',
        company: 'Ambizcon Health - India',
        category: 'Travel',
        amount: 12400,
        date: getOffsetDateStr(38),
        description: 'Annual Healthcare Tech Summit Flight & Hotel Transit',
        receiptName: 'summit_flight_boarding.pdf',
        items: [
          {
            id: 'itm_s12_1',
            category: 'Travel',
            amount: 12400,
            date: getOffsetDateStr(38),
            description: 'Annual Healthcare Tech Summit Flight & Hotel Transit',
            receiptName: 'summit_flight_boarding.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: true,
        status: 'Paid',
        createdAt: getOffsetIso(38),
      },
      {
        _id: 'claim_seed_13',
        claimNo: 'CLM-8030',
        userId: 'usr_7',
        userName: 'Naraine R',
        userTeam: 'Development',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Naraine',
        company: 'Ambizcon Health - India',
        category: 'Software',
        amount: 4200,
        date: getOffsetDateStr(45),
        description: 'JetBrains All Products Pack & Postman Team License',
        receiptName: 'jetbrains_license_inv.pdf',
        items: [
          {
            id: 'itm_s13_1',
            category: 'Software',
            amount: 4200,
            date: getOffsetDateStr(45),
            description: 'JetBrains All Products Pack & Postman Team License',
            receiptName: 'jetbrains_license_inv.pdf',
          },
        ],
        comments: [],
        adminStatus: 'approved',
        ceoStatus: 'approved',
        isPaid: false,
        status: 'Approved',
        createdAt: getOffsetIso(45),
      },
    ];

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
