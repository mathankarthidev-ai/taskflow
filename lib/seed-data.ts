import { UserRole, TeamName, WorkMode, CompanyBranch, GPIntelligence, MarketIntelligence, IntegrationSource, AIAnalystQuery } from '@/types';

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
    company?: CompanyBranch;
    avatar: string;
    birthday: string;
    dob?: string;
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
    company: 'India & Australia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anirudh',
    birthday: '29 Jun',
    dob: '29 Jun',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Mathan P',
    email: 'mathan@ambizcon.com',
    role: 'Super Admin',
    team: 'Development',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathan',
    birthday: '16 Oct',
    dob: '16 Oct',
    workMode: 'Work From Office',
    permissionCount: 0,
  },

  // Team Leads (India)
  {
    name: 'Aravind Kalaivanan',
    email: 'aravind@ambizcon.com',
    role: 'Team Lead',
    team: 'Development',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind',
    birthday: '30 Dec',
    dob: '30 Dec',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Kennath Franklin J',
    email: 'kenneth@ambizcon.com',
    role: 'Team Lead',
    team: 'Marketing',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenneth',
    birthday: '14 Oct',
    dob: '14 Oct',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Deva Priya D A',
    email: 'deva@ambizcon.com',
    role: 'Team Lead',
    team: 'Creative',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deva',
    birthday: '16 Apr',
    dob: '16 Apr',
    workMode: 'Work From Office',
    permissionCount: 0,
  },

  // Development Team Members (India)
  {
    name: 'Thanikaivel Arumugam',
    email: 'thanikaivel@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thanikaivel',
    birthday: '17 Mar',
    dob: '17 Mar',
    workMode: 'Work From Home',
    permissionCount: 0,
  },
  {
    name: 'Naraine R',
    email: 'naraine@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Naraine',
    birthday: '10 Jul',
    dob: '10 Jul',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Mathanmk',
    email: 'mathanmk@ambizcon.com',
    role: 'Team Member',
    team: 'Development',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathanmk',
    birthday: '14 Mar',
    dob: '14 Mar',
    workMode: 'Work From Office',
    permissionCount: 0,
  },

  // Marketing / Operations Team Members (India)
  {
    name: 'Mathi Pandian',
    email: 'mathi.p@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mathi',
    birthday: '16 Oct',
    dob: '16 Oct',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Kiruthikashri M',
    email: 'krithikashri@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Krithikashri',
    birthday: '07 Jun',
    dob: '07 Jun',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'B. Siddesh',
    email: 'siddesh@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddesh',
    birthday: '23 Sep',
    dob: '23 Sep',
    workMode: 'Work From Home',
    permissionCount: 0,
  },

  // Creative Team Members (India)
  {
    name: 'V. Sathish Kumar',
    email: 'sathish@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sathish',
    birthday: '16 Nov',
    dob: '16 Nov',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Kavish TG',
    email: 'kavish@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavish',
    birthday: '02 Aug',
    dob: '02 Aug',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Kasthuri M',
    email: 'kasthuri@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kasthuri',
    birthday: '28 Oct',
    dob: '28 Oct',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Ahamed',
    email: 'ahamed@ambizcon.com',
    role: 'Team Member',
    team: 'Creative',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahamed',
    birthday: '15 Nov',
    dob: '15 Nov',
    workMode: 'Work From Home',
    permissionCount: 0,
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
}[] = [];

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
