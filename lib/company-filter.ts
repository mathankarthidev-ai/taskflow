import { CompanyBranch, Task, User } from '@/types';

const AU_EMAILS = new Set(['adriana@ambizcon.com']);
const AU_USER_IDS = new Set(['user-16']);

const GLOBAL_ADMIN_EMAILS = new Set([
  'anirudh@ambizcon.com',
  'mathan@ambizcon.com',
]);
const GLOBAL_ADMIN_USER_IDS = new Set(['user-1', 'user-2']);

const INDIA_ONLY_NAMES = new Set([
  'aravind',
  'kennath',
  'kenneth',
  'deva',
  'thanikaivel',
  'thanikaivel m.',
  'naraine',
  'naraine v.',
  'mathanmk',
  'mathi',
  'kiruthikashri',
  'siddesh',
  'sathish',
  'kavish',
  'kasthuri',
  'kasthuri s.',
  'ahamed',
  'hariprasath',
  'vignesh',
  'gowtham',
  'hema',
]);

/**
 * Resolves the effective CompanyBranch for any user or user-like record
 * (User object, AttendanceRecord, LeaveRequest, Claim, Birthday item, etc.)
 */
export function resolveEffectiveCompany(record?: {
  _id?: string;
  id?: string;
  userId?: string;
  email?: string;
  userEmail?: string;
  name?: string;
  userName?: string;
  role?: string;
  company?: string;
} | null): CompanyBranch {
  if (!record) return 'Ambizcon Health - India';

  const email = (record.email || record.userEmail || '').trim().toLowerCase();
  const uid = (record.userId || record._id || record.id || '').trim();
  const rawName = (record.name || record.userName || '').trim().toLowerCase();
  const role = (record.role || '').trim();

  // 1. Check Australia-specific identity first (handles legacy DB rows before company field existed)
  if (
    AU_EMAILS.has(email) ||
    AU_USER_IDS.has(uid) ||
    rawName.includes('adriana')
  ) {
    return 'Ambizcon';
  }

  // 2. Make sure India member 'mathanmk' is never mistaken for global admin 'mathan'
  if (rawName === 'mathanmk' || email === 'mathanmk@ambizcon.com') {
    return 'Ambizcon Health - India';
  }

  // 3. Check Global Super Admins (Anirudh & Mathan P)
  if (
    GLOBAL_ADMIN_EMAILS.has(email) ||
    GLOBAL_ADMIN_USER_IDS.has(uid) ||
    role === 'Super Admin' ||
    rawName === 'anirudh' ||
    rawName === 'anirudh r.' ||
    rawName === 'mathan' ||
    rawName === 'mathan p' ||
    rawName === 'mathan p.'
  ) {
    return 'India & Australia';
  }

  // 4. Check known India-only member names
  if (INDIA_ONLY_NAMES.has(rawName)) {
    return 'Ambizcon Health - India';
  }

  // 5. Respect explicit company field on record if valid
  if (record.company === 'Ambizcon') return 'Ambizcon';
  if (record.company === 'India & Australia') return 'India & Australia';
  if (record.company === 'Ambizcon Health - India') return 'Ambizcon Health - India';

  return 'Ambizcon Health - India';
}

/**
 * Returns true if the given user or user-linked record belongs to the currently selected company branch.
 * Dual-branch Super Admins ('India & Australia') appear in both branches.
 */
export function isUserInCompany(
  record:
    | {
        _id?: string;
        id?: string;
        userId?: string;
        email?: string;
        userEmail?: string;
        name?: string;
        userName?: string;
        role?: string;
        company?: string;
      }
    | null
    | undefined,
  selectedCompany: string
): boolean {
  if (!record) return false;
  const effective = resolveEffectiveCompany(record);
  if (effective === 'India & Australia') return true;
  if (selectedCompany === 'Ambizcon') {
    return effective === 'Ambizcon';
  }
  return effective === 'Ambizcon Health - India';
}

/**
 * Normalizes a User object so its `company` property is always accurate.
 */
export function normalizeUserCompany<T extends Partial<User>>(user: T): T {
  const company = resolveEffectiveCompany(user as any);
  return {
    ...user,
    company,
  };
}

/**
 * Determines whether a Task (or Reminder / Incoming item) belongs to the selected company branch.
 * - If assigned to an India-only user -> only 'Ambizcon Health - India'
 * - If assigned to an AU-only user (Adriana Ruju) -> only 'Ambizcon'
 * - If unassigned or assigned to a Super Admin -> checks creator/raiser or Australian client context
 */
export function isTaskInCompany(
  task: Task,
  selectedCompany: string,
  allUsers?: User[]
): boolean {
  if (!task) return false;

  // Check explicit company tag in labels if any
  if (Array.isArray(task.labels)) {
    if (task.labels.includes('Ambizcon AU')) {
      return selectedCompany === 'Ambizcon';
    }
    if (task.labels.includes('Ambizcon India')) {
      return selectedCompany === 'Ambizcon Health - India';
    }
  }

  // Resolve assignee
  let assignee: Partial<User> | undefined = task.assignedUser;
  if (!assignee && task.assignedTo && allUsers && allUsers.length > 0) {
    assignee = allUsers.find(
      (u) => u._id === task.assignedTo || u.email === task.assignedTo
    );
  }

  if (assignee) {
    const assigneeCompany = resolveEffectiveCompany(assignee);
    if (assigneeCompany === 'Ambizcon') {
      return selectedCompany === 'Ambizcon';
    }
    if (assigneeCompany === 'Ambizcon Health - India') {
      return selectedCompany === 'Ambizcon Health - India';
    }
    // If assignee is 'India & Australia' (Super Admin), fall through to creator/client check
  } else if (task.assignedTo) {
    // Check raw assignedTo ID/email if user object wasn't populated
    const rawAssigneeCompany = resolveEffectiveCompany({
      userId: task.assignedTo,
      email: task.assignedTo.includes('@') ? task.assignedTo : undefined,
      name: task.assignedTo,
    });
    if (rawAssigneeCompany === 'Ambizcon') {
      return selectedCompany === 'Ambizcon';
    }
    if (rawAssigneeCompany === 'Ambizcon Health - India') {
      return selectedCompany === 'Ambizcon Health - India';
    }
  }

  // Check creator / raiser
  const creator = task.createdByUser || task.raisedByUser;
  if (creator) {
    const creatorCompany = resolveEffectiveCompany(creator);
    if (creatorCompany === 'Ambizcon') {
      return selectedCompany === 'Ambizcon';
    }
    if (creatorCompany === 'Ambizcon Health - India') {
      return selectedCompany === 'Ambizcon Health - India';
    }
  }

  // If both assignee and creator are Super Admins (or unassigned), check client name / title for AU vs India context
  const textContext = `${task.clientName || ''} ${task.title || ''} ${task.description || ''}`.toLowerCase();
  const isAuContext =
    textContext.includes('sydney') ||
    textContext.includes('queensland') ||
    textContext.includes('melbourne') ||
    textContext.includes('brisbane') ||
    textContext.includes('australia') ||
    textContext.includes('adriana');

  if (selectedCompany === 'Ambizcon') {
    // If unassigned or assigned directly to Super Admin (Anirudh/Mathan), show if AU context or assigned to Super Admin
    if (assignee && resolveEffectiveCompany(assignee) === 'India & Australia') {
      return true;
    }
    return isAuContext;
  }

  return true;
}
