import { supabase } from './supabase';
import { Task, User } from '@/types';
import { SEED_USERS } from './seed-data';

export type WorkBlockColor = 'blue' | 'green' | 'orange' | 'purple' | 'teal';
export type WorkLogCategory = 'completed' | 'in_progress' | 'review' | 'urgent' | 'upcoming';

export interface WorkLogItem {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  team: string;
  company: string;
  work_date: string; // YYYY-MM-DD
  task_id?: string;
  task_title: string;
  start_time: string; // HH:mm (24h e.g. "09:00", "17:00")
  end_time: string; // HH:mm (24h e.g. "10:30", "18:30")
  duration_minutes: number;
  color: WorkBlockColor;
  category?: WorkLogCategory;
  is_urgent?: boolean;
  is_upcoming?: boolean;
  is_auto_in_progress?: boolean;
  is_extra_hours?: boolean;
  created_at?: string;
}

export function getWorkLogCategory(item: WorkLogItem): WorkLogCategory {
  if (item.category) return item.category;
  const title = (item.task_title || '').toLowerCase();
  if (item.is_urgent || title.includes('[urgent]') || title.includes('urgent') || title.includes('hotfix') || title.includes('qa') || title.includes('merge conflict')) {
    return 'urgent';
  }
  if (item.is_upcoming || title.includes('[upcoming]') || title.includes('retro') || title.includes('upcoming') || title.includes('prep')) {
    return 'upcoming';
  }
  if (item.color === 'orange' || title.includes('review') || title.includes('pr #')) {
    return 'review';
  }
  if (item.color === 'blue' || item.is_auto_in_progress || title.includes('in progress') || title.includes('widget') || title.includes('validation')) {
    return 'in_progress';
  }
  return 'completed';
}

export const REFERENCE_DAILY_TASKS = [
  {
    title: 'Daily standup & sprint planning',
    duration_minutes: 30,
    start_time: '09:00',
    end_time: '09:30',
    category: 'completed' as WorkLogCategory,
    color: 'green' as WorkBlockColor,
  },
  {
    title: 'Fix login API token bug (#142)',
    duration_minutes: 80,
    start_time: '09:30',
    end_time: '10:50',
    category: 'completed' as WorkLogCategory,
    color: 'green' as WorkBlockColor,
  },
  {
    title: 'Quick call with QA',
    duration_minutes: 20,
    start_time: '10:50',
    end_time: '11:10',
    category: 'urgent' as WorkLogCategory,
    color: 'purple' as WorkBlockColor,
    is_urgent: true,
  },
  {
    title: 'Welcome banner redesign',
    duration_minutes: 80,
    start_time: '11:10',
    end_time: '12:30',
    category: 'completed' as WorkLogCategory,
    color: 'green' as WorkBlockColor,
  },
  {
    title: 'Urgent: prod hotfix review',
    duration_minutes: 30,
    start_time: '12:30',
    end_time: '13:00',
    category: 'urgent' as WorkLogCategory,
    color: 'purple' as WorkBlockColor,
    is_urgent: true,
  },
  {
    title: 'Clock-in / live shift widget',
    duration_minutes: 80,
    start_time: '13:00',
    end_time: '14:20',
    category: 'in_progress' as WorkLogCategory,
    color: 'blue' as WorkBlockColor,
  },
  {
    title: 'Helped teammate with merge conflict',
    duration_minutes: 20,
    start_time: '14:20',
    end_time: '14:40',
    category: 'urgent' as WorkLogCategory,
    color: 'purple' as WorkBlockColor,
    is_urgent: true,
  },
  {
    title: 'Create Task form validation',
    duration_minutes: 80,
    start_time: '14:40',
    end_time: '16:00',
    category: 'in_progress' as WorkLogCategory,
    color: 'blue' as WorkBlockColor,
  },
  {
    title: 'Code review — PR #88',
    duration_minutes: 30,
    start_time: '16:00',
    end_time: '16:30',
    category: 'review' as WorkLogCategory,
    color: 'orange' as WorkBlockColor,
  },
  {
    title: 'Sprint retro prep',
    duration_minutes: 30,
    start_time: '16:30',
    end_time: '17:00',
    category: 'upcoming' as WorkLogCategory,
    color: 'green' as WorkBlockColor,
    is_upcoming: true,
  },
];

export function generateReferenceWorkLogs(workDate: string, user: { _id?: string; id?: string; email?: string; name?: string; team?: string; company?: string }): WorkLogItem[] {
  const userId = user._id || (user as any).id || 'user_thanikaivel_06';
  const userEmail = (user.email || 'thanikaivel@ambizcon.com').toLowerCase();
  const userName = user.name || 'Thanikaivel Arumugam';
  const userTeam = user.team || 'Development';
  const userCompany = user.company || 'Ambizcon Health - India';

  return REFERENCE_DAILY_TASKS.map((t, idx) => ({
    id: `WL-REF-${workDate}-${userEmail}-${idx + 1}`,
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    team: userTeam,
    company: userCompany,
    work_date: workDate,
    task_title: t.title,
    start_time: t.start_time,
    end_time: t.end_time,
    duration_minutes: t.duration_minutes,
    color: t.color,
    category: t.category,
    is_urgent: Boolean(t.is_urgent),
    is_upcoming: Boolean(t.is_upcoming),
    created_at: new Date().toISOString(),
  }));
}

const STORAGE_KEY_PREFIX = 'ambizcon_work_logs_v2_';

function purgeLegacyWorkLogs() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('ambizcon_work_logs_') && !k.startsWith('ambizcon_work_logs_v2_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}
const COLOR_ROTATION: WorkBlockColor[] = ['blue', 'green', 'orange', 'purple', 'teal'];

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  return (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function isWorkLogExtraHours(item: WorkLogItem): boolean {
  if (item.is_extra_hours) return true;
  if ((item.task_title || '').toLowerCase().includes('[extra hr]')) return true;
  const startMins = parseTimeToMinutes(item.start_time);
  const endMins = parseTimeToMinutes(item.end_time);
  return startMins >= 17 * 60 || endMins > 17 * 60 || startMins < 9 * 60;
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 55, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDurationHrs(durationMins: number): string {
  const safe = Math.max(0, durationMins);
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${String(m).padStart(2, '0')} hrs`;
}

function toDbWorkLogRow(item: WorkLogItem) {
  return {
    id: item.id,
    user_id: item.user_id,
    user_email: item.user_email,
    user_name: item.user_name,
    team: item.team,
    company: item.company,
    work_date: item.work_date,
    task_id: item.task_id || '',
    task_title: item.task_title,
    start_time: item.start_time,
    end_time: item.end_time,
    duration_minutes: item.duration_minutes,
    color: item.color,
    is_auto_in_progress: Boolean(item.is_auto_in_progress),
    created_at: item.created_at || new Date().toISOString(),
  };
}

export async function fetchWorkLogsForDate(workDate: string): Promise<WorkLogItem[]> {
  purgeLegacyWorkLogs();
  const storageKey = `${STORAGE_KEY_PREFIX}${workDate}`;

  try {
    const { data, error } = await supabase
      .from('work_logs')
      .select('*')
      .eq('work_date', workDate)
      .order('start_time', { ascending: true });

    if (!error && data) {
      let mapped: WorkLogItem[] = data.map((row: any) => {
        const startMins = parseTimeToMinutes(row.start_time);
        const endMins = parseTimeToMinutes(row.end_time);
        const isExtra =
          Boolean(row.is_extra_hours) ||
          String(row.task_title || '').toLowerCase().includes('[extra hr]') ||
          startMins >= 17 * 60 ||
          endMins > 17 * 60 ||
          startMins < 9 * 60;
        return {
          id: row.id,
          user_id: row.user_id,
          user_email: row.user_email,
          user_name: row.user_name,
          team: row.team || 'Development',
          company: row.company || 'Ambizcon Health - India',
          work_date: row.work_date,
          task_id: row.task_id || '',
          task_title: row.task_title,
          start_time: row.start_time,
          end_time: row.end_time,
          duration_minutes: Number(row.duration_minutes || 60),
          color: (row.color || 'blue') as WorkBlockColor,
          category: (row.category as WorkLogCategory) || undefined,
          is_urgent: Boolean(row.is_urgent),
          is_upcoming: Boolean(row.is_upcoming),
          is_auto_in_progress: Boolean(row.is_auto_in_progress),
          is_extra_hours: isExtra,
          created_at: row.created_at,
        };
      });

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
        let list: WorkLogItem[] = JSON.parse(cached);
        return list;
      } catch (e) {}
    }
  }

  return [];
}

export async function saveWorkLogItem(
  item: WorkLogItem,
  requestingUser?: { id?: string; email?: string; role?: string }
): Promise<WorkLogItem> {
  // Security Check: Insecure Direct Object Reference (IDOR) Ownership Protection
  if (requestingUser) {
    const reqEmail = String(requestingUser.email || '').toLowerCase();
    const reqId = String(requestingUser.id || '').toLowerCase();
    const isPrivileged =
      requestingUser.role === 'Super Admin' ||
      requestingUser.role === 'Admin' ||
      requestingUser.role === 'Team Lead';
    const isOwner =
      (item.user_email && String(item.user_email).toLowerCase() === reqEmail) ||
      (item.user_id && String(item.user_id).toLowerCase() === reqId);

    if (!isPrivileged && reqEmail && !isOwner) {
      throw new Error('Unauthorized (IDOR Protection): You can only create or edit your own work logs.');
    }
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${item.work_date}`;

  try {
    await supabase.from('work_logs').upsert(toDbWorkLogRow(item), { onConflict: 'id' });
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const current = await fetchWorkLogsForDate(item.work_date);
    const exists = current.some((x) => x.id === item.id);
    const nextList = exists
      ? current.map((x) => (x.id === item.id ? item : x))
      : [...current, item].sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
    localStorage.setItem(storageKey, JSON.stringify(nextList));
    window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
  }

  return item;
}

const DISMISSED_AUTO_KEY = 'ambizcon_dismissed_auto_work_logs';

function getDismissedAutoIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_AUTO_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (_) {
    return new Set();
  }
}

export async function deleteWorkLogItem(
  id: string,
  workDate: string,
  requestingUser?: { id?: string; email?: string; role?: string }
): Promise<boolean> {
  // Security Check: Insecure Direct Object Reference (IDOR) Ownership Protection
  if (requestingUser) {
    const isPrivileged =
      requestingUser.role === 'Super Admin' ||
      requestingUser.role === 'Admin' ||
      requestingUser.role === 'Team Lead';
    if (!isPrivileged) {
      const current = await fetchWorkLogsForDate(workDate);
      const target = current.find((x) => x.id === id);
      const reqEmail = String(requestingUser.email || '').toLowerCase();
      const reqId = String(requestingUser.id || '').toLowerCase();
      const isOwner =
        (target?.user_email && String(target.user_email).toLowerCase() === reqEmail) ||
        (target?.user_id && String(target.user_id).toLowerCase() === reqId);
      if (target && !isOwner) {
        throw new Error('Unauthorized (IDOR Protection): You cannot delete another employee\'s work log.');
      }
    }
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${workDate}`;

  try {
    await supabase.from('work_logs').delete().eq('id', id);
  } catch (e) {}

  if (typeof window !== 'undefined') {
    if (id.startsWith('WL-AUTO-')) {
      const dismissed = getDismissedAutoIds();
      dismissed.add(id);
      localStorage.setItem(DISMISSED_AUTO_KEY, JSON.stringify(Array.from(dismissed)));
    }
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const list: WorkLogItem[] = JSON.parse(cached);
        localStorage.setItem(
          storageKey,
          JSON.stringify(list.filter((x) => x.id !== id))
        );
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
  }
  return true;
}

/**
 * Automatically syncs any task with status === 'In Progress' into today's work_logs
 * for the assigned user if not already present.
 */
export async function syncInProgressTasksToWorkLogs(
  tasks: Task[],
  workDate: string,
  usersList: User[] = SEED_USERS as any
): Promise<WorkLogItem[]> {
  const existingLogs = await fetchWorkLogsForDate(workDate);
  const inProgressTasks = (tasks || []).filter((t) => t && t.status === 'In Progress');

  if (inProgressTasks.length === 0) {
    return existingLogs;
  }

  const dismissedAuto = getDismissedAutoIds();

  const defaultSlotWindows = [
    { start: '09:00', end: '10:30', duration: 90, color: 'blue' as WorkBlockColor },
    { start: '11:00', end: '12:00', duration: 60, color: 'green' as WorkBlockColor },
    { start: '13:00', end: '15:30', duration: 150, color: 'orange' as WorkBlockColor },
    { start: '15:30', end: '17:00', duration: 90, color: 'purple' as WorkBlockColor },
  ];

  const newItemsToInsert: WorkLogItem[] = [];

  for (const task of inProgressTasks) {
    // Find assigned user
    const assignedUser =
      (usersList || []).find(
        (u) =>
          u &&
          (u._id === task.assignedTo ||
            (u.email || '').toLowerCase() === (task.assignedTo || '').toLowerCase() ||
            (u.name || '').toLowerCase() === (task.assignedTo || '').toLowerCase())
      ) || (usersList || [])[0];

    if (!assignedUser || !assignedUser.email) continue;

    const deterministicId = `WL-AUTO-${workDate}-${task._id}`;
    if (dismissedAuto.has(deterministicId)) continue;

    const assignedEmailLower = String(assignedUser.email || '').toLowerCase();
    const taskTitleLower = String(task.title || '').toLowerCase();

    const alreadyLogged =
      existingLogs.some(
        (l) =>
          l &&
          (l.id === deterministicId ||
            (String(l.user_email || '').toLowerCase() === assignedEmailLower &&
              (l.task_id === task._id || String(l.task_title || '').toLowerCase() === taskTitleLower)))
      ) ||
      newItemsToInsert.some((l) => l.id === deterministicId);

    if (alreadyLogged) continue;

    // Count how many blocks this user already has today to pick the next non-overlapping slot
    const userBlocksCount =
      existingLogs.filter((l) => l && String(l.user_email || '').toLowerCase() === assignedEmailLower).length +
      newItemsToInsert.filter((l) => l && String(l.user_email || '').toLowerCase() === assignedEmailLower).length;

    const slotPreset = defaultSlotWindows[userBlocksCount % defaultSlotWindows.length];
    const color = COLOR_ROTATION[userBlocksCount % COLOR_ROTATION.length];

    const autoItem: WorkLogItem = {
      id: deterministicId,
      user_id: assignedUser._id,
      user_email: assignedEmailLower,
      user_name: assignedUser.name || '',
      team: assignedUser.team || task.team || 'Development',
      company: assignedUser.company || (task as any).company || 'Ambizcon Health - India',
      work_date: workDate,
      task_id: task._id,
      task_title: task.title || 'Untitled Task',
      start_time: slotPreset.start,
      end_time: slotPreset.end,
      duration_minutes: slotPreset.duration,
      color,
      is_auto_in_progress: true,
      created_at: new Date().toISOString(),
    };

    newItemsToInsert.push(autoItem);
  }

  if (newItemsToInsert.length > 0) {
    try {
      await supabase.from('work_logs').upsert(newItemsToInsert, { onConflict: 'id' });
    } catch (e) {}

    const combined = [...existingLogs, ...newItemsToInsert].sort((a, b) =>
      String(a.start_time || '').localeCompare(String(b.start_time || ''))
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${workDate}`, JSON.stringify(combined));
    }
    return combined;
  }

  return existingLogs;
}

/**
 * Resets/clears any sample demo reference schedule for a specific user,
 * restores their real assigned/in-progress workspace tasks, and prevents auto-reinjecting demo tasks.
 */
export async function resetUserReferenceSchedule(
  workDate: string,
  userEmail: string,
  tasks: Task[] = [],
  usersList: User[] = SEED_USERS as any
): Promise<WorkLogItem[]> {
  const targetEmail = userEmail.toLowerCase();
  const storageKey = `${STORAGE_KEY_PREFIX}${workDate}`;

  // Record that user deliberately cleared/reset reference schedule for this date
  if (typeof window !== 'undefined') {
    localStorage.setItem(`ambizcon_ref_schedule_cleared_${targetEmail}_${workDate}`, 'true');
  }

  // Delete from Supabase if stored
  try {
    await supabase
      .from('work_logs')
      .delete()
      .eq('work_date', workDate)
      .eq('user_email', targetEmail)
      .like('id', 'WL-REF-%');
  } catch (e) {}

  // Remove reference logs from localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const list: WorkLogItem[] = JSON.parse(cached);
        const filtered = list.filter(
          (l) =>
            !(
              (l.user_email || '').toLowerCase() === targetEmail &&
              (l.id.startsWith('WL-REF-') || l.id.includes('-REF-'))
            )
        );
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      } catch (e) {}
    }
  }

  // Re-sync with actual workspace tasks
  const synced = await syncInProgressTasksToWorkLogs(tasks, workDate, usersList);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ambizcon_work_logs_updated'));
  }
  return synced;
}
