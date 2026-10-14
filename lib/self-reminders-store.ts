import { supabase } from './supabase';

export type SelfReminderRepeat =
  | 'Once'
  | 'Daily'
  | 'Weekly'
  | 'Weekdays (Mon–Fri)'
  | 'Monthly'
  | 'Yearly'
  | 'Custom Days';

export interface SelfReminder {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  note: string;
  reminder_date: string; // YYYY-MM-DD
  day_name: string; // Monday, Tuesday, etc. or Every Day
  reminder_time: string; // e.g. "09:30 AM" or "14:00"
  repeat_type: SelfReminderRepeat;
  custom_days?: string; // e.g. "Mon, Wed, Fri"
  is_completed: boolean;
  is_active: boolean;
  created_at?: string;
}

const STORAGE_PREFIX = 'ambizcon_self_reminders_v2_';

function purgeLegacySelfReminders() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ambizcon_self_reminders_') && !k.startsWith('ambizcon_self_reminders_v2_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

export function getDayOfWeekFromDate(dateStr: string): string {
  if (!dateStr) return 'Monday';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 'Monday';
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatTime12Hour(timeVal: string): string {
  if (!timeVal) return '09:30 AM';
  if (timeVal.toUpperCase().includes('AM') || timeVal.toUpperCase().includes('PM')) {
    return timeVal;
  }
  const [hStr, mStr] = timeVal.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeVal;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${(mStr || '00').padStart(2, '0')} ${period}`;
}

export function to24HourTime(time12: string): string {
  if (!time12) return '09:30';
  if (!time12.toUpperCase().includes('AM') && !time12.toUpperCase().includes('PM')) {
    return time12.slice(0, 5);
  }
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '09:30';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

function getDefaultSelfReminders(): SelfReminder[] {
  return [];
}

export async function fetchSelfReminders(
  userId: string,
  userEmail: string,
  userName: string
): Promise<SelfReminder[]> {
  if (!userEmail) return [];
  purgeLegacySelfReminders();
  const emailLower = userEmail.toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${emailLower}`;

  try {
    const { data, error } = await supabase
      .from('self_reminders')
      .select('*')
      .eq('user_email', emailLower)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped: SelfReminder[] = data.map((row: any) => ({
        id: row.id,
        user_id: row.user_id || userId,
        user_email: row.user_email || emailLower,
        user_name: row.user_name || userName,
        title: row.title,
        note: row.note || '',
        reminder_date: row.reminder_date,
        day_name: row.day_name || getDayOfWeekFromDate(row.reminder_date),
        reminder_time: row.reminder_time || '09:30 AM',
        repeat_type: (row.repeat_type || 'Daily') as SelfReminderRepeat,
        custom_days: row.custom_days || '',
        is_completed: Boolean(row.is_completed),
        is_active: row.is_active !== false,
        created_at: row.created_at,
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(mapped));
      }
      return mapped;
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  }

  return [];
}

export function getCachedActiveSelfReminderCount(userEmail?: string): number {
  if (typeof window === 'undefined' || !userEmail) return 0;
  const cached = localStorage.getItem(`${STORAGE_PREFIX}${userEmail.toLowerCase()}`);
  if (!cached) return 0;
  try {
    const list: SelfReminder[] = JSON.parse(cached);
    return list.filter((r) => !r.is_completed && r.is_active).length;
  } catch (e) {
    return 0;
  }
}

export async function createSelfReminder(
  payload: Omit<SelfReminder, 'id' | 'created_at'>
): Promise<SelfReminder> {
  const emailLower = payload.user_email.toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${emailLower}`;
  const newItem: SelfReminder = {
    ...payload,
    id: `SR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_email: emailLower,
    reminder_time: formatTime12Hour(payload.reminder_time),
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from('self_reminders').upsert(newItem, { onConflict: 'id' });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const current = await fetchSelfReminders(payload.user_id, emailLower, payload.user_name);
    const exists = current.some((i) => i.id === newItem.id);
    const updated = exists ? current : [newItem, ...current];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ambizcon_self_reminders_updated'));
  }

  return newItem;
}

export async function updateSelfReminder(
  id: string,
  userEmail: string,
  updates: Partial<Omit<SelfReminder, 'id'>>
): Promise<SelfReminder | null> {
  const emailLower = userEmail.toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${emailLower}`;
  const formattedUpdates = {
    ...updates,
    ...(updates.reminder_time ? { reminder_time: formatTime12Hour(updates.reminder_time) } : {}),
  };

  try {
    await supabase.from('self_reminders').update(formattedUpdates).eq('id', id);
  } catch (e) {}

  let updatedItem: SelfReminder | null = null;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const list: SelfReminder[] = JSON.parse(cached);
        const nextList = list.map((item) => {
          if (item.id === id) {
            updatedItem = { ...item, ...formattedUpdates };
            return updatedItem;
          }
          return item;
        });
        localStorage.setItem(storageKey, JSON.stringify(nextList));
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ambizcon_self_reminders_updated'));
  }

  return updatedItem;
}

export async function deleteSelfReminder(id: string, userEmail: string): Promise<boolean> {
  const emailLower = userEmail.toLowerCase();
  const storageKey = `${STORAGE_PREFIX}${emailLower}`;

  try {
    await supabase.from('self_reminders').delete().eq('id', id);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const list: SelfReminder[] = JSON.parse(cached);
        localStorage.setItem(storageKey, JSON.stringify(list.filter((i) => i.id !== id)));
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ambizcon_self_reminders_updated'));
  }
  return true;
}
