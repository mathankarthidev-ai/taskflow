import { supabase } from './supabase';
import { SEED_USERS } from './seed-data';

export type FestivalBranchScope = 'Ambizcon Health - India' | 'Ambizcon' | 'Both Branches';
export type FestivalCategory = 'Festival Leave' | 'National Holiday' | 'Regional / State Holiday' | 'Optional Holiday';

export interface FestivalLeaveItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day_name: string;
  category: FestivalCategory;
  company: FestivalBranchScope;
  description: string;
  is_paid: boolean;
}

export interface EmployeeLeaveBalance {
  user_email: string;
  user_name: string;
  team: string;
  company: string;
  casual_total: number;
  casual_used: number;
  sick_total: number;
  sick_used: number;
  earned_total: number;
  earned_used: number;
  permissions_used: number;
  updated_at?: string;
}

export const DEFAULT_FESTIVAL_LEAVES: FestivalLeaveItem[] = [
  // Common / Both Branches
  {
    id: 'FEST-2026-01',
    name: "New Year's Day",
    date: '2026-01-01',
    day_name: 'Thursday',
    category: 'National Holiday',
    company: 'Both Branches',
    description: 'Global New Year Celebration Holiday',
    is_paid: true,
  },
  // India Branch (Ambizcon Health - India)
  {
    id: 'FEST-2026-02',
    name: 'Pongal / Makar Sankranti',
    date: '2026-01-14',
    day_name: 'Wednesday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Harvest Festival Common Holiday (Chennai HQ)',
    is_paid: true,
  },
  {
    id: 'FEST-2026-03',
    name: 'Thiruvalluvar Day / Mattu Pongal',
    date: '2026-01-15',
    day_name: 'Thursday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Tamil Nadu Statutory Pongal Festival Leave',
    is_paid: true,
  },
  {
    id: 'FEST-2026-04',
    name: 'Republic Day (India)',
    date: '2026-01-26',
    day_name: 'Monday',
    category: 'National Holiday',
    company: 'Ambizcon Health - India',
    description: 'National Statutory Republic Day Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-05',
    name: 'Tamil New Year / Vishu',
    date: '2026-04-14',
    day_name: 'Tuesday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Tamil Puthandu Common Festival Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-06',
    name: 'May Day (International Workers Day)',
    date: '2026-05-01',
    day_name: 'Friday',
    category: 'National Holiday',
    company: 'Ambizcon Health - India',
    description: 'Statutory Labour Day Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-07',
    name: 'Independence Day (India)',
    date: '2026-08-15',
    day_name: 'Saturday',
    category: 'National Holiday',
    company: 'Ambizcon Health - India',
    description: 'Indian National Independence Day',
    is_paid: true,
  },
  {
    id: 'FEST-2026-08',
    name: 'Vinayagar Chathurthi',
    date: '2026-09-14',
    day_name: 'Monday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Ganesh Chaturthi Common Festival Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-09',
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    day_name: 'Friday',
    category: 'National Holiday',
    company: 'Ambizcon Health - India',
    description: 'Mahatma Gandhi Birthday National Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-10',
    name: 'Ayudha Pooja / Saraswathi Pooja',
    date: '2026-10-20',
    day_name: 'Tuesday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Navaratri & Ayudha Pooja Common Festival Leave',
    is_paid: true,
  },
  {
    id: 'FEST-2026-11',
    name: 'Vijaya Dashami / Dussehra',
    date: '2026-10-21',
    day_name: 'Wednesday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Dussehra Festival Common Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-12',
    name: 'Deepavali / Diwali',
    date: '2026-11-08',
    day_name: 'Sunday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Festival of Lights Common Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-13',
    name: 'Diwali Observed Holiday',
    date: '2026-11-09',
    day_name: 'Monday',
    category: 'Festival Leave',
    company: 'Ambizcon Health - India',
    description: 'Compensatory Common Festival Leave for Deepavali',
    is_paid: true,
  },
  // Australia Branch (Ambizcon - Brisbane QLD)
  {
    id: 'FEST-2026-14',
    name: 'Australia Day',
    date: '2026-01-26',
    day_name: 'Monday',
    category: 'National Holiday',
    company: 'Ambizcon',
    description: 'Australian National Public Holiday (Brisbane HQ)',
    is_paid: true,
  },
  {
    id: 'FEST-2026-15',
    name: 'Good Friday',
    date: '2026-04-03',
    day_name: 'Friday',
    category: 'National Holiday',
    company: 'Both Branches',
    description: 'Good Friday Statutory Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-16',
    name: 'Easter Monday',
    date: '2026-04-06',
    day_name: 'Monday',
    category: 'National Holiday',
    company: 'Ambizcon',
    description: 'Easter Monday Public Holiday (Australia)',
    is_paid: true,
  },
  {
    id: 'FEST-2026-17',
    name: 'ANZAC Day',
    date: '2026-04-25',
    day_name: 'Saturday',
    category: 'National Holiday',
    company: 'Ambizcon',
    description: 'ANZAC National Remembrance Day',
    is_paid: true,
  },
  {
    id: 'FEST-2026-18',
    name: 'Labour Day (Queensland)',
    date: '2026-05-04',
    day_name: 'Monday',
    category: 'Regional / State Holiday',
    company: 'Ambizcon',
    description: 'Queensland Statutory Labour Day Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-19',
    name: 'Royal Queensland Show (Ekka) Day',
    date: '2026-08-12',
    day_name: 'Wednesday',
    category: 'Regional / State Holiday',
    company: 'Ambizcon',
    description: 'Brisbane CBD People’s Day Holiday',
    is_paid: true,
  },
  {
    id: 'FEST-2026-20',
    name: "King's Birthday (Queensland)",
    date: '2026-10-05',
    day_name: 'Monday',
    category: 'National Holiday',
    company: 'Ambizcon',
    description: "King's Birthday Public Holiday (QLD)",
    is_paid: true,
  },
  // Year-end Both Branches
  {
    id: 'FEST-2026-21',
    name: 'Christmas Day',
    date: '2026-12-25',
    day_name: 'Friday',
    category: 'Festival Leave',
    company: 'Both Branches',
    description: 'Christmas Common Festival Leave',
    is_paid: true,
  },
  {
    id: 'FEST-2026-22',
    name: 'Boxing Day',
    date: '2026-12-26',
    day_name: 'Saturday',
    category: 'National Holiday',
    company: 'Ambizcon',
    description: 'Boxing Day Public Holiday (Australia)',
    is_paid: true,
  },
];

const FESTIVAL_STORAGE_KEY = 'ambizcon_festival_leaves_v1';
const BALANCES_STORAGE_KEY = 'ambizcon_employee_leave_balances_v1';

export function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return 'Monday';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 'Monday';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long' });
}

export async function fetchFestivalLeaves(): Promise<FestivalLeaveItem[]> {
  try {
    const { data, error } = await supabase
      .from('festival_leaves')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped: FestivalLeaveItem[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        day_name: row.day_name || getDayNameFromDate(row.date),
        category: (row.category || 'Festival Leave') as FestivalCategory,
        company: (row.company || 'Ambizcon Health - India') as FestivalBranchScope,
        description: row.description || '',
        is_paid: row.is_paid ?? true,
      }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(FESTIVAL_STORAGE_KEY, JSON.stringify(mapped));
      }
      return mapped;
    }

    // Seed initial defaults into Supabase if empty
    if (!error && (!data || data.length === 0)) {
      await supabase.from('festival_leaves').upsert(DEFAULT_FESTIVAL_LEAVES, { onConflict: 'id' });
    }
  } catch (e) {
    // Fallback to localStorage or defaults
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(FESTIVAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    localStorage.setItem(FESTIVAL_STORAGE_KEY, JSON.stringify(DEFAULT_FESTIVAL_LEAVES));
  }
  return DEFAULT_FESTIVAL_LEAVES;
}

export async function addFestivalLeave(
  payload: Omit<FestivalLeaveItem, 'id' | 'day_name'> & { id?: string; day_name?: string }
): Promise<FestivalLeaveItem> {
  const newItem: FestivalLeaveItem = {
    id: payload.id || `FEST-${Date.now()}`,
    name: payload.name.trim(),
    date: payload.date,
    day_name: payload.day_name || getDayNameFromDate(payload.date),
    category: payload.category || 'Festival Leave',
    company: payload.company || 'Ambizcon Health - India',
    description: payload.description?.trim() || 'Common Festival Leave',
    is_paid: payload.is_paid ?? true,
  };

  try {
    await supabase.from('festival_leaves').upsert(newItem, { onConflict: 'id' });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const current = await fetchFestivalLeaves();
    const exists = current.some((item) => item.id === newItem.id);
    const updated = exists
      ? current.map((item) => (item.id === newItem.id ? newItem : item))
      : [...current, newItem].sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(FESTIVAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ambizcon_festival_leaves_updated'));
  }

  return newItem;
}

export async function updateFestivalLeave(
  id: string,
  updates: Partial<Omit<FestivalLeaveItem, 'id'>>
): Promise<FestivalLeaveItem | null> {
  const nextDayName = updates.date ? getDayNameFromDate(updates.date) : updates.day_name;
  const patchData = {
    ...updates,
    ...(nextDayName ? { day_name: nextDayName } : {}),
  };

  try {
    await supabase.from('festival_leaves').update(patchData).eq('id', id);
  } catch (e) {}

  const current = await fetchFestivalLeaves();
  let updatedItem: FestivalLeaveItem | null = null;
  const nextList = current
    .map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...patchData };
        return updatedItem;
      }
      return item;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (typeof window !== 'undefined') {
    localStorage.setItem(FESTIVAL_STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent('ambizcon_festival_leaves_updated'));
  }
  return updatedItem;
}

export async function deleteFestivalLeave(id: string): Promise<boolean> {
  try {
    await supabase.from('festival_leaves').delete().eq('id', id);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(FESTIVAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed: FestivalLeaveItem[] = JSON.parse(cached);
        const filtered = parsed.filter((i) => i.id !== id);
        localStorage.setItem(FESTIVAL_STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ambizcon_festival_leaves_updated'));
  }
  return true;
}

export function getDefaultEmployeeBalances(usersList: any[] = SEED_USERS): EmployeeLeaveBalance[] {
  return usersList.map((u) => ({
    user_email: u.email,
    user_name: u.name,
    team: u.team || 'Development',
    company: u.company || 'Ambizcon Health - India',
    casual_total: 12,
    casual_used: 0,
    sick_total: 10,
    sick_used: 0,
    earned_total: 15,
    earned_used: 0,
    permissions_used: u.permissionCount || 0,
  }));
}

export async function fetchEmployeeLeaveBalances(usersList: any[] = SEED_USERS): Promise<EmployeeLeaveBalance[]> {
  const defaults = getDefaultEmployeeBalances(usersList);

  try {
    const { data, error } = await supabase.from('employee_leave_balances').select('*');
    if (!error && data && data.length > 0) {
      const byEmail = new Map<string, any>();
      data.forEach((row: any) => byEmail.set((row.user_email || '').toLowerCase(), row));

      const merged: EmployeeLeaveBalance[] = defaults.map((def) => {
        const dbRow = byEmail.get(def.user_email.toLowerCase());
        if (!dbRow) return def;
        return {
          user_email: def.user_email,
          user_name: dbRow.user_name || def.user_name,
          team: dbRow.team || def.team,
          company: dbRow.company || def.company,
          casual_total: Number(dbRow.casual_total ?? 12),
          casual_used: Number(dbRow.casual_used ?? 0),
          sick_total: Number(dbRow.sick_total ?? 10),
          sick_used: Number(dbRow.sick_used ?? 0),
          earned_total: Number(dbRow.earned_total ?? 15),
          earned_used: Number(dbRow.earned_used ?? 0),
          permissions_used: Number(dbRow.permissions_used ?? def.permissions_used ?? 0),
          updated_at: dbRow.updated_at,
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }

    if (!error && (!data || data.length === 0)) {
      await supabase.from('employee_leave_balances').upsert(defaults, { onConflict: 'user_email' });
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(BALANCES_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(defaults));
  }
  return defaults;
}

export async function updateEmployeeLeaveBalance(
  updated: EmployeeLeaveBalance
): Promise<EmployeeLeaveBalance> {
  const rowToSave = {
    ...updated,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('employee_leave_balances').upsert(rowToSave, { onConflict: 'user_email' });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const current = await fetchEmployeeLeaveBalances();
    const nextList = current.map((b) =>
      b.user_email.toLowerCase() === updated.user_email.toLowerCase() ? rowToSave : b
    );
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent('ambizcon_leave_balances_updated'));
  }

  return rowToSave;
}

export async function bulkUpdateCommonLeavePolicy(
  casualTotal: number,
  sickTotal: number,
  earnedTotal: number,
  branchScope: 'All' | 'Ambizcon Health - India' | 'Ambizcon',
  usersList: any[] = SEED_USERS
): Promise<EmployeeLeaveBalance[]> {
  const current = await fetchEmployeeLeaveBalances(usersList);
  const nowIso = new Date().toISOString();

  const updatedList = current.map((b) => {
    if (branchScope !== 'All' && b.company !== branchScope) {
      return b;
    }
    return {
      ...b,
      casual_total: casualTotal,
      sick_total: sickTotal,
      earned_total: earnedTotal,
      updated_at: nowIso,
    };
  });

  try {
    await supabase.from('employee_leave_balances').upsert(updatedList, { onConflict: 'user_email' });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('ambizcon_leave_balances_updated'));
  }

  return updatedList;
}
