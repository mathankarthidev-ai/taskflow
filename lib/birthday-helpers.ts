import { User } from '@/types';
import { isUserInCompany, resolveEffectiveCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';

export interface BirthdayItem {
  id?: string;
  name: string;
  date: string; // e.g. "22 Jun"
  day: number;
  team: string;
  role: string;
  company?: string;
  email?: string;
  avatar?: string;
}

export interface MonthBirthdays {
  month: string;
  monthIndex: number; // 0 to 11
  users: BirthdayItem[];
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_ABBR_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/**
 * Robust birthday parser supporting:
 * - "22 Jun", "22 June", "Jun 22"
 * - "22-06-2005", "22- 06- 2005", "22/06/2005", "22.06.2005"
 * - "2005-06-22" (ISO date)
 * - "22-06", "22/06"
 */
export function parseBirthday(val?: string): { day: number; monthIndex: number; formatted: string } | null {
  if (!val) return null;
  const clean = val.replace(/\s*\(\d{4}\)/g, '').trim();

  // Pattern 1: ISO "2005-06-22"
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const day = parseInt(isoMatch[3], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, '0');
      const abbr = MONTH_NAMES[monthIndex].slice(0, 3);
      return { day, monthIndex, formatted: `${dayStr} ${abbr}` };
    }
  }

  // Pattern 2: "22-06-2005" or "22- 06- 2005" or "22/06/2005" or "22.06.2005"
  const dmyMatch = clean.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIndex = parseInt(dmyMatch[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, '0');
      const abbr = MONTH_NAMES[monthIndex].slice(0, 3);
      return { day, monthIndex, formatted: `${dayStr} ${abbr}` };
    }
  }

  // Pattern 3: "22-06" or "22/06"
  const dmMatch = clean.match(/^(\d{1,2})\s*[-/.]\s*(\d{1,2})$/);
  if (dmMatch) {
    const day = parseInt(dmMatch[1], 10);
    const monthIndex = parseInt(dmMatch[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex <= 11 && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, '0');
      const abbr = MONTH_NAMES[monthIndex].slice(0, 3);
      return { day, monthIndex, formatted: `${dayStr} ${abbr}` };
    }
  }

  // Pattern 4: "22 Jun" or "22 June" or "22-Jun" or "22-June"
  const dayNameMatch = clean.match(/^(\d{1,2})\s*[-/.\s]?\s*([a-zA-Z]+)(?:\s+\d{2,4})?$/);
  if (dayNameMatch) {
    const day = parseInt(dayNameMatch[1], 10);
    const monKey = dayNameMatch[2].toLowerCase();
    const monthIndex = MONTH_ABBR_MAP[monKey];
    if (monthIndex !== undefined && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, '0');
      const abbr = MONTH_NAMES[monthIndex].slice(0, 3);
      return { day, monthIndex, formatted: `${dayStr} ${abbr}` };
    }
  }

  // Pattern 5: "Jun 22" or "June 22"
  const nameDayMatch = clean.match(/^([a-zA-Z]+)\s*[-/.\s]?\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*,\s*\d{2,4})?$/);
  if (nameDayMatch) {
    const monKey = nameDayMatch[1].toLowerCase();
    const day = parseInt(nameDayMatch[2], 10);
    const monthIndex = MONTH_ABBR_MAP[monKey];
    if (monthIndex !== undefined && day >= 1 && day <= 31) {
      const dayStr = String(day).padStart(2, '0');
      const abbr = MONTH_NAMES[monthIndex].slice(0, 3);
      return { day, monthIndex, formatted: `${dayStr} ${abbr}` };
    }
  }

  return null;
}

/**
 * Dynamically generates 12-month birthday rosters from a dynamic list of users.
 * Automatically merges SEED_USERS so registered members like A. Abdul kani
 * are always present immediately.
 */
export function generateMonthWiseBirthdays(usersList?: Array<Partial<User>>): MonthBirthdays[] {
  // Combine usersList with SEED_USERS, deduplicating by normalized email
  const userMap = new Map<string, any>();

  // 1. Seed users first
  for (const s of SEED_USERS) {
    const emailKey = (s.email || '').toLowerCase().trim();
    if (emailKey) {
      userMap.set(emailKey, {
        ...s,
        company: resolveEffectiveCompany(s),
      });
    }
  }

  // 2. Overlay live dynamic registered users from DB / Store / LocalStorage
  if (Array.isArray(usersList)) {
    for (const u of usersList) {
      if (!u || !u.name) continue;
      const emailKey = (u.email || '').toLowerCase().trim() || u.name.toLowerCase().trim();
      const existing = userMap.get(emailKey) || {};
      userMap.set(emailKey, {
        ...existing,
        ...u,
        company: resolveEffectiveCompany(u),
      });
    }
  }

  // Initialize 12 empty months
  const months: MonthBirthdays[] = MONTH_NAMES.map((name, index) => ({
    month: name,
    monthIndex: index,
    users: [],
  }));

  // Group each member into their corresponding month
  for (const user of userMap.values()) {
    const birthdayRaw = user.birthday || user.dob;
    const parsed = parseBirthday(birthdayRaw);
    if (!parsed) continue;

    const item: BirthdayItem = {
      id: user._id || user.id,
      name: user.name,
      date: parsed.formatted,
      day: parsed.day,
      team: user.team || 'Creative',
      role: user.role || 'Team Member',
      company: user.company || resolveEffectiveCompany(user),
      email: user.email,
      avatar: user.avatar,
    };

    months[parsed.monthIndex].users.push(item);
  }

  // Sort members in each month by day (1st to 31st)
  for (const m of months) {
    m.users.sort((a, b) => a.day - b.day);
  }

  return months;
}
