import { Task, TaskPriority, TeamName, User } from '@/types';
import { resolveEffectiveCompany } from './company-filter';

export type CompletedPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const DEV_TASK_TITLES = [
  'WordPress Core 6.7 & WooCommerce Security Patch Deployment',
  'Doctor Appointment Slot Double-Booking Race Condition Fix',
  'Telehealth Video Consultation WebRTC Latency Optimization',
  'Stripe & Medicare Rebate Webhook Reconciliation Script',
  'Cloudflare SSL & DNS Record Hardening for Clinic Portal',
  'Biometric QR Attendance Real-Time Supabase Sync',
  'Patient Portal Two-Factor Authentication (2FA) Flow',
  'Core Web Vitals LCP & CLS Speed Optimization (95+ Score)',
  'MySQL Database Indexing for 10k+ Patient Records',
  'Automated Nightly WP-Content & Database S3 Backup Verify',
  'REST API Rate Limiting & CORS Security Header Audit',
  'Interactive GP Referral Form Validation & File Upload Fix',
];

const MARKETING_TASK_TITLES = [
  'Google Search Ads High-Intent Keyword & Negative List Audit',
  'Monthly Technical SEO & Google Search Console 404 Fix',
  'Patient Reactivation 4-Stage Automated Email Drip Funnel',
  'Google Business Profile (GMB) Local Pack Citation Update',
  'Meta Retargeting Ad Campaign & Pixel Conversion Setup',
  'Specialist Cardiology Landing Page Copy & CTA Optimization',
  'Competitor SERP & Backlink Authority Gap Analysis',
  'GA4 Custom Event Tracking & GTM Trigger Verification',
  'Quarterly Healthcare Patient Acquisition ROI Deck',
  'Doctor Bio Schema.org MedicalWebPage JSON-LD Markup',
  'WhatsApp & SMS Appointment Reminder Copy A/B Testing',
  'Brisbane & Sydney Clinic Geo-Radius Ad Bid Adjustment',
];

const CREATIVE_TASK_TITLES = [
  'Figma High-Fidelity Doctor Profile & Booking UI Kit',
  'Clinic Hero Section Vector Illustration & Responsive Banner',
  'Patient Medical Consent Form Print & Interactive PDF Design',
  'Social Media Health Awareness Carousel Post Series (10 Slides)',
  'Ambizcon Design System Dark Mode & Color Token Export',
  'Mobile Telehealth App Onboarding Wireframes & Prototype',
  'Specialist Clinic Reception Signage & Brochure Print Layout',
  'Doctor Video Testimonial Lower-Thirds & Motion Graphics',
  'Email Newsletter Responsive HTML Template Design',
  'Custom Medical Specialty SVG Icon Set (Cardio, Dental, GP)',
  'Clinic Rebranding Logo Variations & Typography Guide',
  'Interactive Before/After Dermatology Gallery Component',
];

const INDIA_CLIENTS = [
  'Apollo Hospitals',
  'Fortis Healthcare',
  'Manipal Hospitals',
  'Max Healthcare',
  'Aster DM Healthcare',
];

const AU_CLIENTS = [
  'Sydney Specialist Clinic',
  'Queensland Health',
  'Brisbane GP Medical Centre',
  'Melbourne Cardiology Group',
];

const DOCTORS = [
  'Dr. Sarah Jenkins',
  'Dr. Umed Specialist',
  'Dr. Michael Chen',
  'Dr. Priya Sharma',
  'Dr. Rajesh Kumar',
  'Dr. Marcus Vance',
  'Dr. Emily Watson',
];

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Critical', 'Low', 'High'];

/**
 * Generates deterministic, realistic completed ('Done') tasks for a single member:
 * - Index 0..4   (5 tasks)   -> Completed TODAY (Daily = 5)
 * - Index 5..9   (5 tasks)   -> Completed 1–6 days ago (Weekly cumulative = 10)
 * - Index 10..39 (30 tasks)  -> Completed 7–28 days ago (Monthly cumulative = 40)
 * - Index 40..104 (65 tasks) -> Completed 31–330 days ago (Yearly cumulative = 105, i.e. 100+)
 */
export function generateMemberCompletedTasks(
  user: User,
  period: CompletedPeriod = 'yearly'
): Task[] {
  const totalCount =
    period === 'daily'
      ? 5
      : period === 'weekly'
      ? 10
      : period === 'monthly'
      ? 40
      : 105; // 100+ tasks for yearly

  const team: TeamName = user.team || 'Development';
  const titles =
    team === 'Marketing'
      ? MARKETING_TASK_TITLES
      : team === 'Creative'
      ? CREATIVE_TASK_TITLES
      : DEV_TASK_TITLES;

  const effCompany = resolveEffectiveCompany(user);
  const clients = effCompany === 'Ambizcon' ? AU_CLIENTS : INDIA_CLIENTS;
  const now = Date.now();
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  const result: Task[] = [];

  for (let i = 0; i < totalCount; i++) {
    let completedAgoMs: number;
    let periodTag: string;

    if (i < 5) {
      // Daily: 5 tasks completed today (between 30 mins and 7 hours ago)
      completedAgoMs = (i + 1) * 1.2 * HOUR;
      periodTag = 'Daily Completed';
    } else if (i < 10) {
      // Weekly: next 5 tasks completed 1 to 5 days ago (total 10 in last 7 days)
      const dayOffset = (i - 4); // 1..5 days ago
      completedAgoMs = dayOffset * DAY + (i % 4) * HOUR;
      periodTag = 'Weekly Completed';
    } else if (i < 40) {
      // Monthly: next 30 tasks completed 7 to 28 days ago (total 40 in last 30 days)
      const dayOffset = 7 + Math.floor(((i - 10) / 30) * 21); // 7..28 days ago
      completedAgoMs = dayOffset * DAY + (i % 6) * HOUR;
      periodTag = 'Monthly Completed';
    } else {
      // Yearly: next 65 tasks completed 32 to 340 days ago (total 105 in last 365 days)
      const dayOffset = 32 + Math.floor(((i - 40) / 65) * 305); // 32..337 days ago
      completedAgoMs = dayOffset * DAY + (i % 8) * HOUR;
      periodTag = 'Yearly Archive';
    }

    const completedAtDate = new Date(now - completedAgoMs);
    const createdAtDate = new Date(completedAtDate.getTime() - 2 * DAY);
    const baseTitle = titles[i % titles.length];
    const clientName = clients[i % clients.length];
    const doctorName = DOCTORS[i % DOCTORS.length];
    const priority = PRIORITIES[i % PRIORITIES.length];

    const branchLabel = effCompany === 'Ambizcon' ? 'Ambizcon AU' : 'Ambizcon India';

    result.push({
      _id: `comp_${user._id || user.email}_${i + 1}`,
      title: `${baseTitle} (#${i + 1})`,
      description: `Completed deliverable for ${clientName} (${doctorName}) by ${user.name}. Verified quality checklist, staging sign-off, and live production deployment.`,
      status: 'Done',
      priority,
      team,
      clientName,
      doctorName,
      clientApproved: true,
      assignedTo: user._id,
      assignedUser: user,
      createdBy: user._id,
      createdByUser: user,
      incoming: false,
      approvalStatus: 'approved',
      reviewStatus: 'approved',
      dueDate: completedAtDate.toISOString(),
      estimatedHours: 4 + (i % 6),
      actualHours: 3 + (i % 5),
      progressPct: 100,
      labels: [
        team,
        periodTag,
        branchLabel,
        'Completed',
      ],
      attachments: [],
      subtasks: [
        { id: `sub_${i}_1`, title: 'Requirements & clinical brief verification', completed: true },
        { id: `sub_${i}_2`, title: 'Implementation & peer quality review', completed: true },
        { id: `sub_${i}_3`, title: 'Final client sign-off & live deployment', completed: true },
      ],
      commentsCount: (i % 3) + 1,
      history: [
        {
          id: `hist_comp_${user._id}_${i}`,
          action: `Task completed and verified by ${user.name}`,
          performedBy: user.name,
          performedRole: user.role,
          timestamp: completedAtDate.toISOString(),
        },
      ],
      createdAt: createdAtDate.toISOString(),
      updatedAt: completedAtDate.toISOString(),
    });
  }

  return result;
}

/**
 * Generates completed tasks for a list of users for the specified period:
 * - 'daily'   -> 5 per member
 * - 'weekly'  -> 10 per member
 * - 'monthly' -> 40 per member
 * - 'yearly'  -> 105 (100+) per member
 */
export function generateAllMembersCompletedTasks(
  users: User[],
  period: CompletedPeriod = 'daily'
): Task[] {
  if (!users || users.length === 0) return [];
  const all: Task[] = [];
  for (const u of users) {
    all.push(...generateMemberCompletedTasks(u, period));
  }
  return all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
