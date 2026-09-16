import { UserRole, TeamName, WorkMode, GPIntelligence, MarketIntelligence, IntegrationSource, AIAnalystQuery } from '@/types';

export const SEED_TEAMS: { name: TeamName; code: string; description: string }[] = [
  {
    name: 'Development',
    code: 'DEV',
    description: 'Software Engineering, AI Systems, Cloud Infrastructure & Database Architecture',
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Operations, Patient Outreach, Brand Growth, Media & Healthcare Campaigns',
  },
  {
    name: 'Creative',
    code: 'CRT',
    description: 'UI/UX Design, Figma Wireframes, Brand Systems & Visual Media Assets',
  },
];

export const SEED_USERS: Omit<
  {
    name: string;
    email: string;
    role: UserRole;
    team: TeamName;
    avatar: string;
    birthday: string;
    workMode: WorkMode;
    permissionCount: number;
  },
  '_id'
>[] = [
  // Super Admins
  {
    name: 'Anirudh',
    email: 'anirudh@ambizcon.com',
    role: 'Super Admin',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anirudh',
    birthday: '14 Mar',
    workMode: 'Work From Office',
    permissionCount: 2,
  },
  {
    name: 'Mathan',
    email: 'mathan@ambizcon.com',
    role: 'Super Admin',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan',
    birthday: '14 Mar',
    workMode: 'Work From Office',
    permissionCount: 1,
  },

  // Team Leads
  {
    name: 'Aravind',
    email: 'aravind@ambizcon.com',
    role: 'Team Lead',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind',
    birthday: '22 Jul',
    workMode: 'Work From Office',
    permissionCount: 3,
  },
  {
    name: 'Kenneth',
    email: 'kenneth@ambizcon.com',
    role: 'Team Lead',
    team: 'Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenneth',
    birthday: '02 Nov',
    workMode: 'Work From Office',
    permissionCount: 4,
  },
  {
    name: 'Deva',
    email: 'deva@ambizcon.com',
    role: 'Team Lead',
    team: 'Creative',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deva',
    birthday: '18 May',
    workMode: 'Work From Office',
    permissionCount: 2,
  },

  // Development Team Members
  {
    name: 'Thanikaivel',
    email: 'thanikaivel@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanikaivel',
    birthday: '09 Jan',
    workMode: 'Work From Home',
    permissionCount: 3,
  },
  {
    name: 'Naraine',
    email: 'naraine@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Naraine',
    birthday: '27 Sep',
    workMode: 'Work From Office',
    permissionCount: 5,
  },
  {
    name: 'Mathanmk',
    email: 'mathanmk@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathanmk',
    birthday: '14 Mar',
    workMode: 'Work From Office',
    permissionCount: 1,
  },

  // Marketing / Operations Team Members
  {
    name: 'Mathi',
    email: 'mathi@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathi',
    birthday: '12 Apr',
    workMode: 'Work From Office',
    permissionCount: 6,
  },
  {
    name: 'Krithika Shri',
    email: 'krithikashri@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Krithikashri',
    birthday: '03 Dec',
    workMode: 'Work From Office',
    permissionCount: 8,
  },
  {
    name: 'Siddesh',
    email: 'siddesh@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddesh',
    birthday: '16 Aug',
    workMode: 'Work From Home',
    permissionCount: 7,
  },

  // Creative Team Members
  {
    name: 'Sathish',
    email: 'sathish@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sathish',
    birthday: '25 Feb',
    workMode: 'Work From Office',
    permissionCount: 4,
  },
  {
    name: 'Kavish',
    email: 'kavish@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavish',
    birthday: '27 Aug',
    workMode: 'Work From Office',
    permissionCount: 3,
  },
  {
    name: 'Kasthuri',
    email: 'kasthuri@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kasthuri',
    birthday: '11 Oct',
    workMode: 'Work From Office',
    permissionCount: 2,
  },
  {
    name: 'Ahamed',
    email: 'ahamed@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahamed',
    birthday: '15 Nov',
    workMode: 'Work From Home',
    permissionCount: 2,
  },
];

export const SEED_TASKS_INITIAL: {
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  team: TeamName;
  userEmail: string;
  creatorEmail: string;
  raisedByEmail?: string;
  incoming: boolean;
  dueDate: string;
  labels: string[];
  attachments?: { name: string; url: string; type: string }[];
}[] = [
  // Creative Team Tasks
  {
    title: 'Brand Refresh Deck & AMBIZCON Logo Guidelines',
    description: 'Comprehensive brand identity manual for healthcare partners and media.',
    status: 'In Progress',
    priority: 'High',
    team: 'Creative',
    userEmail: 'kavish@ambizcon.com',
    creatorEmail: 'deva@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-15',
    labels: ['Figma', 'UI/UX', 'Design System'],
    attachments: [{ name: 'ambizcon_brand_guide.pdf', url: '#', type: 'application/pdf' }],
  },
  {
    title: 'Mobile App Onboarding Flow Wireframes',
    description: 'High-fidelity Figma wireframes for patient onboarding and appointment booking.',
    status: 'Review',
    priority: 'Medium',
    team: 'Creative',
    userEmail: 'sathish@ambizcon.com',
    creatorEmail: 'deva@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-12',
    labels: ['Figma', 'Mobile', 'Wireframes'],
  },
  {
    title: 'Social Media Campaign Banners & Icon Tokens',
    description: 'Create vector banner templates for AMBIZCON Health awareness campaign.',
    status: 'Todo',
    priority: 'Medium',
    team: 'Creative',
    userEmail: 'kasthuri@ambizcon.com',
    creatorEmail: 'deva@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-20',
    labels: ['Figma', 'Campaign'],
  },
  {
    title: 'Healthcare Partner Presentation Deck Illustrations',
    description: 'Illustrations and graphics for hospital partnership presentation.',
    status: 'In Progress',
    priority: 'High',
    team: 'Creative',
    userEmail: 'ahamed@ambizcon.com',
    creatorEmail: 'deva@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-18',
    labels: ['Figma', 'Graphics'],
  },

  // Marketing / Operations Team Tasks
  {
    title: 'Q3 Healthcare Partner Outreach Strategy',
    description: 'Executive marketing deck for hospital network acquisitions and lead generation.',
    status: 'In Progress',
    priority: 'Critical',
    team: 'Marketing',
    userEmail: 'mathi@ambizcon.com',
    creatorEmail: 'kenneth@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-10',
    labels: ['SEO', 'Growth', 'Strategy'],
  },
  {
    title: 'Operations Ledger & Patient Survey Audit',
    description: 'Audit monthly operational feedback scores and campaign response rates.',
    status: 'Review',
    priority: 'High',
    team: 'Marketing',
    userEmail: 'krithikashri@ambizcon.com',
    creatorEmail: 'kenneth@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-14',
    labels: ['Operations', 'Audit'],
  },
  {
    title: 'Digital Marketing Campaign SEO & Ad Copies',
    description: 'Optimize Google Ads copies and landing page SEO for medical consultations.',
    status: 'Todo',
    priority: 'Medium',
    team: 'Marketing',
    userEmail: 'siddesh@ambizcon.com',
    creatorEmail: 'kenneth@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-22',
    labels: ['SEO', 'Campaign'],
  },

  // Development Team Tasks
  {
    title: 'MongoDB Atlas & Next.js 15 Server Actions RPC Gateway',
    description: 'Optimize Server Action boundaries and Mongoose document hydration.',
    status: 'Done',
    priority: 'Critical',
    team: 'Development',
    userEmail: 'thanikaivel@ambizcon.com',
    creatorEmail: 'aravind@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-05',
    labels: ['API', 'Security', 'Database'],
  },
  {
    title: 'Ambizcon Pulse Live Clock-In & Shift Verification Engine',
    description: 'Build real-time shift timer and late arrival verification algorithm.',
    status: 'In Progress',
    priority: 'High',
    team: 'Development',
    userEmail: 'naraine@ambizcon.com',
    creatorEmail: 'aravind@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-16',
    labels: ['API', 'ClockIn'],
  },
  {
    title: 'AmbizClaim Reimbursements Multi-Step Approval Engine',
    description: 'Build 2-step TL and CEO approval workflow and receipt claim status badges.',
    status: 'Review',
    priority: 'Critical',
    team: 'Development',
    userEmail: 'mathanmk@ambizcon.com',
    creatorEmail: 'mathan@ambizcon.com',
    incoming: false,
    dueDate: '2026-08-11',
    labels: ['API', 'Reimbursements'],
  },
];

/* ================= AMBIZCON INTELLIGENCE SEED CONSTANTS ================= */
export const SEED_GP_INTELLIGENCE: GPIntelligence = {
  gpsToFollowUp: 42,
  practicesNotContacted: 17,
  newGpsDetected: 8,
  doctorsDeparted: 3,
  highValueOpportunities: 12,
  meetingsScheduled: 6,
  activeGpCampaigns: 4,
  medicalCentresTracked: 1240,
  referralGrowthMoM: '+14%',
};

export const SEED_MARKET_INTELLIGENCE: MarketIntelligence = {
  postcode: '4217',
  locationName: 'Gold Coast / Brisbane South',
  population: 38420,
  populationGrowthPct: '+9.2%',
  medianHouseholdIncome: '$1,640/wk',
  seifaScore: 1042,
  marketOpportunityScore: 82,
  catchmentPopulation: 10000,
  relevantPopulation: 7400,
  existingPatientBase: 4300,
  marketPenetrationPct: '58%',
  untappedOpportunity: 3100,
  absFeedConnected: true,
};

export const SEED_INTEGRATION_SOURCES: IntegrationSource[] = [
  { source: 'Google Analytics 4', type: 'Website Traffic', refresh: 'Daily', lastSync: '2h ago', status: 'Connected' },
  { source: 'Google Ads', type: 'Paid Search', refresh: 'Daily', lastSync: '2h ago', status: 'Connected' },
  { source: 'Google Search Console', type: 'SEO Rank', refresh: 'Daily', lastSync: '4h ago', status: 'Connected' },
  { source: 'Meta Ads', type: 'Social Campaigns', refresh: 'Daily', lastSync: '3h ago', status: 'Connected' },
  { source: 'ABS Data API', type: 'Demographics / Census', refresh: 'Quarterly', lastSync: 'Jul 2026', status: 'Connected' },
  { source: 'AIHW / MyHospitals', type: 'Healthcare Supply', refresh: 'Periodic', lastSync: 'Jun 2026', status: 'Connected' },
  { source: 'Booking Platform', type: 'Patient Bookings', refresh: 'Manual CSV', lastSync: 'Yesterday', status: 'Manual Data' },
];

export const SEED_AI_QUERIES: AIAnalystQuery[] = [
  {
    id: 'q1',
    question: 'Which team members & accounts need attention today?',
    fact: '4 accounts flagged today. Coastline Cardiology (bookings -24%) and Northside Family (7 deliverables overdue) are highest priority.',
    insight: "Northside's issue is operational (overloaded owner), not a strategy failure.",
    recommendation: 'Reallocate 2 overdue items from Mathi to Kenneth; open a Coastline booking-funnel review.',
    sources: 'Deliverables Engine • GA4 • Team Workload Audit',
    confidence: 'High (94%)',
  },
  {
    id: 'q2',
    question: 'What are we delivering across the team this week?',
    fact: '41 deliverables due this week: 28 completed, 6 in progress, 7 overdue.',
    insight: 'Overdue items are concentrated in Marketing & Development due to cross-team queue volume.',
    recommendation: 'Clear the 7 overdue items first before starting new low-priority requests.',
    sources: 'TaskFlow Deliverables Engine',
    confidence: 'High (98%)',
  },
  {
    id: 'q3',
    question: 'Why is Coastline Cardiology conversion declining?',
    fact: 'Coastline bookings fell 24% MoM while ad spend held steady and CPC rose 14%.',
    insight: 'Broad-match keyword bleed plus a landing-page booking-funnel drop-off.',
    recommendation: 'Add negative keywords, tighten match types, and audit the booking landing page.',
    sources: 'Google Ads API • GA4 Booking Funnel',
    confidence: 'Medium (85%)',
  },
];
