import { UserRole, TeamName, WorkMode, CompanyBranch, GPIntelligence, MarketIntelligence, IntegrationSource, AIAnalystQuery, ClientItem, TaskTypeTemplate, Project, TimeEntry } from '@/types';

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
    dob: '29/06/1993',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
  {
    name: 'Mathan P',
    email: 'mathan@ambizcon.com',
    role: 'Super Admin',
    team: 'Development',
    company: 'India & Australia',
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
    email: 'kiruthikashri@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    company: 'Ambizcon Health - India',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiruthikashri',
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
  // Australian Team Members (Brisbane Branch)
  {
    name: 'Adriana Ruju',
    email: 'adriana@ambizcon.com',
    role: 'Team Member',
    team: 'Marketing',
    company: 'Ambizcon',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adriana',
    birthday: '12 Jun',
    dob: '12/06/2003',
    workMode: 'Work From Office',
    permissionCount: 0,
  },
];

const CLIENT_NAMES = ['Apollo Hospitals', 'Fortis Healthcare', 'Figma', 'Manipal Hospitals', 'Max Healthcare', 'Aster DM Healthcare'];

const TEAM_TASK_TEMPLATES: Record<TeamName, { title: string; desc: string; labels: string[]; attName: string; attType: string }[]> = {
  Development: [
    { title: 'Implement Next.js 15 Server Actions & Auth Middleware', desc: 'Secure Server Action endpoints and attach HTTP-only cookie JWT verification.', labels: ['API', 'Mobile'], attName: 'Auth_Middleware_Architecture.pdf', attType: 'application/pdf' },
    { title: 'Setup MongoDB Atlas Connection Pooling & Schemas', desc: 'Configure Mongoose connection retry logic and index user email fields.', labels: ['API'], attName: 'Database_Indexing_Report.pdf', attType: 'application/pdf' },
    { title: 'Optimize REST API Latency & Redis Cache Layer', desc: 'Implement in-memory caching for attendance summary queries to reduce query times.', labels: ['API'], attName: 'Redis_Benchmark_Log.txt', attType: 'text/plain' },
    { title: 'Fix Webhook Callback Exception Handling', desc: 'Add fallback retry handling for third-party billing webhooks.', labels: ['API', 'Mobile'], attName: 'Webhook_Error_Trace.log', attType: 'text/plain' },
    { title: 'Build Real-Time WebSocket Notification Handler', desc: 'Connect socket server to stream live task update events to online clients.', labels: ['API', 'Mobile'], attName: 'WebSocket_Spec_v1.pdf', attType: 'application/pdf' },
    { title: 'Configure Docker Multi-Stage Build & CI/CD Pipeline', desc: 'Streamline GitHub Actions workflow to build lightweight Docker containers.', labels: ['API'], attName: 'Dockerfile_Security_Audit.pdf', attType: 'application/pdf' },
    { title: 'Implement Role-Based Access Control Middleware', desc: 'Restricted administrative routes to Super Admin and Team Lead personas.', labels: ['API'], attName: 'RBAC_Policy_Document.docx', attType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { title: 'Optimize Database Query Indexing for Attendance Logs', desc: 'Compound index on userId and timestamp for fast attendance log aggregation.', labels: ['API'], attName: 'Mongo_Performance_Analysis.png', attType: 'image/png' },
    { title: 'Refactor User Management Server Actions', desc: 'Modularize server actions into separate files for clean code architecture.', labels: ['API'], attName: 'Code_Refactor_Summary.pdf', attType: 'application/pdf' },
    { title: 'Integration Test Suite for Payment Gateway', desc: 'Automated Playwright integration tests covering subscription checkout flows.', labels: ['API', 'Mobile'], attName: 'Payment_Test_Report.xlsx', attType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  ],
  Marketing: [
    { title: 'Healthcare Patient Outreach Campaign Strategy Q4', desc: 'Formulate digital marketing strategy for general practitioner outreach.', labels: ['SEO'], attName: 'Outreach_Strategy_Q4.pdf', attType: 'application/pdf' },
    { title: 'GP Referral Network Email Sequence & Analytics', desc: 'Design automated 4-step email sequence for clinic referral partnerships.', labels: ['SEO'], attName: 'Email_Sequence_Copy.docx', attType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { title: 'Google Ads Campaign Optimization & Negative Keywords', desc: 'Audit CPC performance and add negative match terms to lower acquisition cost.', labels: ['SEO'], attName: 'Google_Ads_Audit_Oct.xlsx', attType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { title: 'Social Media Visual Assets & Content Calendar', desc: 'Plan LinkedIn and Facebook publishing schedule with custom banner graphics.', labels: ['SEO', 'Figma'], attName: 'Content_Calendar_Q4.pdf', attType: 'application/pdf' },
    { title: 'Hospital Partnership Proposal Presentation', desc: 'Draft executive pitch deck for multi-site healthcare system integration.', labels: ['SEO'], attName: 'Partnership_Deck_v3.pdf', attType: 'application/pdf' },
    { title: 'SEO Meta Tags Audit & Keyword Ranking Report', desc: 'Optimize title tags, meta descriptions, and schema markup across landing pages.', labels: ['SEO'], attName: 'SEO_Keywords_Report.xlsx', attType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { title: 'Lead Generation Landing Page A/B Testing', desc: 'Compare conversion rates between video hero section vs static form layout.', labels: ['SEO', 'UI/UX'], attName: 'AB_Test_Results.pdf', attType: 'application/pdf' },
    { title: 'Patient Feedback Survey Analysis & Insights', desc: 'Aggregate quarterly patient experience ratings and net promoter scores.', labels: ['SEO'], attName: 'NPS_Survey_Analysis.pdf', attType: 'application/pdf' },
    { title: 'Monthly Marketing ROI & CAC Performance Report', desc: 'Calculate Customer Acquisition Cost and Return on Ad Spend across channels.', labels: ['SEO'], attName: 'Marketing_ROI_Report.xlsx', attType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { title: 'Brand Reputation & Review System Management', desc: 'Monitor Google My Business ratings and implement review collection workflow.', labels: ['SEO'], attName: 'Reputation_Summary.pdf', attType: 'application/pdf' },
  ],
  Creative: [
    { title: 'Figma UI/UX Design System Component Library', desc: 'Create reusable button variants, modal dialogs, and input field primitives in Figma.', labels: ['Figma', 'UI/UX'], attName: 'Figma_Design_System_Spec.pdf', attType: 'application/pdf' },
    { title: 'Mobile App Wireframes & Interactive Prototypes', desc: 'High-fidelity wireframes for iOS and Android healthcare mobile application.', labels: ['Figma', 'UI/UX', 'Mobile'], attName: 'Mobile_Wireframes_Export.png', attType: 'image/png' },
    { title: 'Ambizcon Brand Guidelines & Typography Spec', desc: 'Define primary brand colors, typography hierarchy, and logo usage rules.', labels: ['Figma', 'UI/UX'], attName: 'Brand_Guidelines_2026.pdf', attType: 'application/pdf' },
    { title: 'Redesign SaaS Dashboard Light & Dark Mode', desc: 'Craft clean UI layout with high contrast ratios for both light and dark themes.', labels: ['Figma', 'UI/UX'], attName: 'Dashboard_Mockup_V2.png', attType: 'image/png' },
    { title: 'Social Media Banners & Ad Campaign Illustrations', desc: 'Vector illustrations for upcoming healthcare awareness campaign.', labels: ['Figma', 'UI/UX'], attName: 'Ad_Banners_Pack.zip', attType: 'application/zip' },
    { title: 'Interactive Patient Portal Onboarding Flow', desc: 'Step-by-step onboarding walkthrough UI for new patient registrations.', labels: ['Figma', 'UI/UX', 'Wireframes'], attName: 'Patient_Flow_Wireframes.pdf', attType: 'application/pdf' },
    { title: 'Iconography Set & Vector Graphics Assets', desc: 'Custom 24px icon set for medical specialties and clinical services.', labels: ['Figma', 'UI/UX'], attName: 'Medical_Icons_Set.svg', attType: 'image/svg+xml' },
    { title: 'Landing Page Hero Section Motion Design', desc: 'Interactive Lottie animation for homepage hero background element.', labels: ['Figma', 'UI/UX'], attName: 'Hero_Animation_Spec.json', attType: 'application/json' },
    { title: 'UX Research & Usability Testing Summary', desc: 'Synthesize feedback from 12 usability testing sessions with clinical staff.', labels: ['Figma', 'UI/UX'], attName: 'Usability_Testing_Report.pdf', attType: 'application/pdf' },
    { title: 'Print Media Brochure & Conference Banner Designs', desc: 'Print-ready vector layouts for annual medical conference exhibition booth.', labels: ['Figma', 'UI/UX'], attName: 'Print_Brochure_CMYK.pdf', attType: 'application/pdf' },
  ],
};

const STATUSES: ('Todo' | 'In Progress' | 'Review' | 'Support' | 'Done')[] = ['Todo', 'In Progress', 'Review', 'Support', 'Done'];
const PRIORITIES: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];

export const SEED_TASKS_INITIAL: any[] = [];

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

export const SEED_TASK_TYPES: TaskTypeTemplate[] = [
  // --- New Quick Start Team Repetitive Tasks ---
  {
    id: 'tt_blogs_drafting',
    name: 'Blogs drafting',
    category: 'Marketing',
    description: 'Blog drafting with title & meta descriptions, internal/external links, and CTA/author assignment.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Title & Meta Decriptions',
      'Hyperlinking of internal & external links',
      'CTA/Author',
    ],
  },
  {
    id: 'tt_content_creation',
    name: 'Content Creation',
    category: 'Creative / Marketing',
    description: 'Content creation according to brief and upload to SPOT/Calendar.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Content creation accordingly',
      'Get it uploaded on SPOT/Calendar',
    ],
  },
  {
    id: 'tt_mailer',
    name: 'Mailer',
    category: 'Marketing',
    description: 'Creation of mailer, sending test mailer for preview and approval, and scheduling on correct time & date.',
    defaultEstimatedHours: 3,
    defaultChecklist: [
      'Creation of mailer',
      'Send out test mailer for preview & approval',
      'Schedule it on correct time & date',
    ],
  },
  {
    id: 'tt_seo_keywords',
    name: 'SEO & Keywords',
    category: 'Marketing',
    description: 'Finding out keyphrases, implementing on metadata, and proper documentation.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Finding out the keyphrase',
      'Making use of it on metadata\'s',
      'Documentation',
    ],
  },
  {
    id: 'tt_website_content_drafting',
    name: 'Website Content Creation & Drafting',
    category: 'Marketing / Creative',
    description: 'Discussion with Dev team on theme and needed, drafting each page with proper documentation, review approval, and sharing to dev team.',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      'Getting of details & Discussion with Dev team on theme and needed',
      'Drafting each page accordingly and proper documentation of content on doc',
      'Sent out for review and getting approval',
      'Sharing to dev team member',
    ],
  },
  {
    id: 'tt_daily_user_log',
    name: 'Daily & User Log',
    category: 'Development / Operations',
    description: 'User log audit, daily work log review, website performance check, and plugin update routine.',
    defaultEstimatedHours: 2,
    defaultChecklist: [
      'user log',
      'daily log',
      'website performance',
      'plugin update',
    ],
  },
  {
    id: 'tt_blog',
    name: 'Blog',
    category: 'Marketing',
    description: 'Regular blog post creation, visual media formatting, and client review.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Draft blog post content & structure',
      'Design banner & embedded illustrations',
      'Internal quality & plagiarism check',
      'Client review and live publishing',
    ],
  },
  {
    id: 'tt_page_creation',
    name: 'Page Creation',
    category: 'Development / Creative',
    description: 'New website page creation, layout build, content styling, and mobile responsiveness.',
    defaultEstimatedHours: 6,
    defaultChecklist: [
      'Page wireframe & layout structure review',
      'Build responsive page layout with blocks / Elementor',
      'Embed approved content & graphics',
      'Mobile responsiveness & cross-device QA',
      'Publish page and configure navigation link',
    ],
  },
  {
    id: 'tt_monthly_tasks_page_speed',
    name: 'Monthly Tasks Page Speed',
    category: 'Development',
    description: 'Monthly website speed tuning, caching, asset optimization, and Core Web Vitals audit.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Page speed & Core Web Vitals check',
      'Image compression & WebP conversion',
      'Cache clearing & CDN performance check',
      'Database cleanup & transients purge',
      'Mobile loading speed verification',
    ],
  },
  {
    id: 'tt_website_task_backup',
    name: 'Website Task Backup',
    category: 'Development',
    description: 'Full website files and database backup routine with cloud storage sync verification.',
    defaultEstimatedHours: 2,
    defaultChecklist: [
      'Full database & WP files backup',
      'Verify backup integrity and cloud storage upload',
      'Security vulnerability & malware scan',
      'Cache flush & live site verification',
    ],
  },
  {
    id: 'tt_seo_revamp',
    name: 'SEO Revamp',
    category: 'Marketing',
    description: 'Comprehensive SEO revamp, keyword repositioning, metadata overhaul, and sitemap resubmission.',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      'Comprehensive on-page SEO review',
      'Meta titles, descriptions, and H1/H2 revamp',
      'Keyword ranking & search impression audit',
      'Internal linking & anchor text optimization',
      'Google Search Console crawl error audit & sitemap resubmission',
    ],
  },

  // --- Existing Team Repetitive Templates ---
  {
    id: 'tt_weekly_social_media',
    name: 'Weekly Social Media Content',
    category: 'Creative / Marketing',
    description: 'Regular social media content creation and delivery for assigned clients.',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      'Review the content plan and upcoming post requirements',
      'Design static posts and carousels',
      'Edit reels and short-form videos',
      'Create social media stories',
      'Complete internal review and corrections',
      'Apply client feedback and revisions',
      'Export and organise final files in client folders',
    ],
  },
  {
    id: 'tt_monthly_social_planning',
    name: 'Monthly Social Media Content Planning',
    category: 'Marketing',
    description: 'Planning content for the upcoming month for each client.',
    defaultEstimatedHours: 6,
    defaultChecklist: [
      'Brainstorm new topics and creative formats',
      'Coordinate with the marketing team for content and approvals',
      'Finalise content requirements for design and video production',
    ],
  },
  {
    id: 'tt_video_production_editing',
    name: 'Video Production & Editing',
    category: 'Creative',
    description: 'Recurring video requirements for clients such as Ambizcon Health, MBM, CEEDS, GP and other assigned clients.',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      'Review video briefs and scripts',
      'Coordinate shoot requirements',
      'Organise and review footage',
      'Edit rough cuts and final videos',
      'Add subtitles, music and other required elements',
      'Complete internal review and corrections',
      'Apply client feedback',
      'Export and save final videos',
      'Update the video pipeline and upcoming deliverables',
    ],
  },
  {
    id: 'tt_meta_ads_creatives',
    name: 'Meta Ads Creatives',
    category: 'Creative / Marketing',
    description: 'Designing and updating creatives for ongoing advertising campaigns.',
    defaultEstimatedHours: 6,
    defaultChecklist: [
      'Review campaign requirements',
      'Design ad posters and creative variations',
      'Complete internal review',
      'Apply feedback and corrections',
      'Export final creatives and share with the marketing team',
    ],
  },
  {
    id: 'tt_client_design_collateral',
    name: 'Client Design & Marketing Collateral',
    category: 'Creative',
    description: 'Recurring design requests based on client requirements.',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      'Website banners and pop-ups',
      'Flyers, posters and brochures',
      'Business cards and other print materials',
      'Campaign creatives and promotional designs',
      'Website graphics, icons and image updates',
      'Client revisions and final file delivery',
    ],
  },
  {
    id: 'tt_awareness_day_content',
    name: 'Awareness-Day Content',
    category: 'Marketing',
    description: 'Content for relevant health awareness days and important dates.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Review the upcoming awareness-day calendar',
      'Identify relevant clients and content requirements',
      'Prepare stories, static posts or carousels',
      'Complete internal review and revisions',
    ],
  },
  {
    id: 'tt_client_revisions_delivery',
    name: 'Client Revisions & Final Delivery',
    category: 'Creative / Marketing',
    description: 'This happens across social media, videos, advertisements and other creative deliverables.',
    defaultEstimatedHours: 3,
    defaultChecklist: [
      'Complete corrections and internal review',
      'Obtain final approval where required',
      'Save the approved version and update task status',
    ],
  },
  {
    id: 'tt_wp_build',
    name: 'WordPress Site Build',
    category: 'Development',
    description: 'Complete WordPress website setup from staging setup to live domain launch.',
    defaultEstimatedHours: 24,
    defaultChecklist: [
      'Staging environment setup & WP core install',
      'Theme & custom plugin configuration',
      'Page layout & content migration',
      'Mobile responsiveness & cross-browser audit',
      'SEO meta tags & Yoast/RankMath setup',
      'Domain DNS, SSL certificate & live launch checklist',
    ],
  },
  {
    id: 'tt_seo_audit',
    name: 'Monthly SEO Audit',
    category: 'Marketing',
    description: 'Comprehensive monthly search engine optimization audit and ranking performance review.',
    defaultEstimatedHours: 12,
    defaultChecklist: [
      'Google Search Console crawl errors & indexation audit',
      'Page speed & Core Web Vitals check',
      'Keyword ranking & organic impression audit',
      'Backlink profile & spam score review',
      'Competitor SERP analysis',
      'Monthly client progress report compilation',
    ],
  },
  {
    id: 'tt_google_ads',
    name: 'Google Ads Campaign Setup',
    category: 'Marketing',
    description: 'High-converting PPC ad campaign setup with conversion tracking.',
    defaultEstimatedHours: 10,
    defaultChecklist: [
      'Conversion tracking & GTM trigger verification',
      'Audience demographic & keyword targeting',
      'Ad copy & ad extension creation',
      'Negative keyword list configuration',
      'Landing page alignment & CTA test',
      'Daily budget & bidding strategy setup',
    ],
  },
  {
    id: 'tt_wp_maintenance',
    name: 'WP Security & Plugin Updates',
    category: 'Development',
    description: 'Routine WordPress core, theme, and plugin update with full backup audit.',
    defaultEstimatedHours: 4,
    defaultChecklist: [
      'Full database & WP files backup',
      'WordPress core update verification',
      'Plugins & theme updates in staging',
      'Security vulnerability & malware scan',
      'Broken link check & form submission test',
      'Cache flush & live site verification',
    ],
  },
  {
    id: 'tt_speed_opt',
    name: 'Speed & Core Web Vitals Optimization',
    category: 'Development',
    description: 'Performance tuning to achieve 90+ PageSpeed score and fast LCP/CLS metrics.',
    defaultEstimatedHours: 8,
    defaultChecklist: [
      'Image compression & WebP conversion',
      'WP Rocket / LiteSpeed caching & CDN config',
      'JavaScript & CSS minification and deferral',
      'Database cleanup & transients purge',
      'Font preloading & DOM depth reduction',
      'PageSpeed Insights & GTmetrix score re-testing',
    ],
  },
];

export const SEED_CLIENTS_FULL: ClientItem[] = [
  // Medical Centers (1 - 20)
  { id: 'client_mc_1', name: 'Doctor @ Coomera Central', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_2', name: 'Coomera Town Medical Center', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_3', name: 'Canungra Town Medical Center', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_4', name: 'Market Place Medical Center and Skin Clinic', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_5', name: 'Carrara Family Practice', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_6', name: 'Tamborine Village Medical', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_7', name: 'Nerang Medical Centre & Skin Clinic', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_8', name: 'Haan Health Medical Centre', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_9', name: 'Coomera Specialist & Diagnostics Centre', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_10', name: 'Illawarra General Practice', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_11', name: 'Next Practice Newstead', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_12', name: 'Bopple Surgery', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_13', name: 'MY Local Doc Figtree Medical', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_14', name: 'MY Local Doc Silkyoaks Medical', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_15', name: 'MY Local Doc Radius', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_16', name: 'MY Local Doc Wishart', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_17', name: 'MY Local Doc Rocklea', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_18', name: 'MY Local Doc Chermside', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_19', name: 'MY Local Doc Beerwah', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_mc_20', name: 'MY Local Doc Caloundra', category: 'Medical Centers', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Specialist (21)
  { id: 'client_sp_21', name: 'Gold Coast Gastroenterology', category: 'Specialist', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Wellness (22 - 23)
  { id: 'client_well_22', name: 'The Possibility Coach', category: 'Wellness', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_well_23', name: 'Kiran Wellness', category: 'Wellness', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Others / Dental (24)
  { id: 'client_oth_24', name: 'Carrara Dental', category: 'Others', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Telehealth (25 - 26)
  { id: 'client_th_25', name: 'Psychetel Australia', category: 'Telehealth', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_th_26', name: '1GP', category: 'Telehealth', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Cardiologists (27 - 30)
  {
    id: 'client_card_27',
    name: 'Coastline Cardiology',
    category: 'Cardiologists',
    contactPerson: 'Sarah Jenkins',
    email: 'admin@coastlinecardiology.com.au',
    phone: '+61 7 5512 3400',
    assetsUrl: 'https://dropbox.com/coastline_cardiology_media',
    status: 'active',
    addedBy: 'Kenneth',
    addedByRole: 'Team Lead',
    createdAt: new Date().toISOString(),
    sites: [
      {
        id: 'site_coastline_live',
        clientId: 'client_card_27',
        clientName: 'Coastline Cardiology',
        siteName: 'Coastline Cardiology AU',
        liveUrl: 'https://coastlinecardiology.com.au',
        stagingUrl: 'https://staging.coastlinecardiology.com.au',
        hostingProvider: 'WP Engine Pro',
        credentialsRef: '1pw_vault_ref_coastline_92',
        notes: 'WooCommerce appointment booking system connected.',
        createdAt: new Date().toISOString(),
      },
    ],
    services: [
      {
        id: 'srv_coastline_ads',
        clientId: 'client_card_27',
        clientName: 'Coastline Cardiology',
        serviceName: 'Google & Meta Paid Media Management',
        retainerHours: 25,
        monthlyFee: 2800,
        status: 'active',
      },
    ],
  },
  { id: 'client_card_28', name: 'Yarrabilba Cardiology', category: 'Cardiologists', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_card_29', name: 'Springwood Cardiology', category: 'Cardiologists', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_card_30', name: 'BK Heart', category: 'Cardiologists', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_card_31', name: 'Heart Link', category: 'Cardiologists', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Business / Other Services (32 - 37)
  { id: 'client_biz_32', name: 'Fintax Partners', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_biz_33', name: 'Fin Flex', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_biz_34', name: 'Ambizcon', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_biz_35', name: 'Guru Property', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  {
    id: 'client_biz_36',
    name: 'Apollo Hospitals',
    category: 'Business / Other Services',
    contactPerson: 'Dr. S. K. Sharma',
    email: 'contact@apollohospitals.com',
    phone: '+91 44 2829 0200',
    assetsUrl: 'https://drive.google.com/drive/folders/apollo_brand_assets',
    status: 'active',
    addedBy: 'Anirudh',
    addedByRole: 'Super Admin',
    createdAt: new Date().toISOString(),
    sites: [
      {
        id: 'site_apollo_live',
        clientId: 'client_biz_36',
        clientName: 'Apollo Hospitals',
        siteName: 'Apollo Main Healthcare Portal',
        liveUrl: 'https://apollohospitals.com',
        stagingUrl: 'https://staging.apollohospitals.com',
        hostingProvider: 'Kinsta Managed WordPress',
        credentialsRef: '1pw_vault_ref_apollo_prod_89',
        notes: 'PHP 8.2, WP Rocket active, Cloudflare Enterprise CDN.',
        createdAt: new Date().toISOString(),
      },
    ],
    services: [
      {
        id: 'srv_apollo_wp',
        clientId: 'client_biz_36',
        clientName: 'Apollo Hospitals',
        serviceName: 'WordPress Web Maintenance & SLA',
        retainerHours: 35,
        monthlyFee: 3500,
        status: 'active',
      },
    ],
  },
  { id: 'client_biz_37', name: 'Ambizcon Health', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_biz_38', name: 'SBIT – IT Solutions', category: 'Business / Other Services', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Diagnostics (39 - 40)
  { id: 'client_diag_39', name: 'New England CT', category: 'Diagnostics', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_diag_40', name: 'Radiant Radiology – Radiology', category: 'Diagnostics', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },

  // Dermatology / Cosmetics (41 - 42)
  { id: 'client_cosm_41', name: 'Auzskin', category: 'Dermatology / Cosmetics', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
  { id: 'client_cosm_42', name: 'Dr. Umed Cosmetics', category: 'Dermatology / Cosmetics', status: 'active', addedBy: 'Super Admin', createdAt: new Date().toISOString() },
];

export const SEED_PROJECTS: Project[] = [];

export const SEED_TIME_ENTRIES: TimeEntry[] = [];
