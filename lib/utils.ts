import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskPriority, TaskStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTimeAgo(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function getPriorityBadgeColor(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-600/20 text-red-600 dark:text-red-400 border-red-500/40 font-bold animate-pulse';
    case 'Critical':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    case 'High':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'Medium':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'Low':
    default:
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
  }
}

export function getStatusBadgeColor(status: TaskStatus): string {
  switch (status) {
    case 'Done':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'Review':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case 'In Progress':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'Support':
      return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    case 'Backlog':
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    case 'Todo':
    default:
      return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
  }
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatTimeIST(dateInput: string | Date | number = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return (
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST'
  );
}

export function formatTimeAEST(dateInput: string | Date | number = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return (
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Australia/Brisbane',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' AEST'
  );
}

export function formatSessionDateIST(dateInput: string | Date | number = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Today';
  return `Today (${d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })})`;
}

export function sanitizeClockOutTime(
  clockOut?: string | null,
  isAest: boolean = false,
  isAutoClosed: boolean = false
): string {
  if (isAutoClosed || (clockOut && clockOut.toLowerCase().includes('auto'))) {
    return isAest ? '08:00 pm AEST' : '08:00 pm IST';
  }
  if (!clockOut || clockOut === '—') return '—';
  const str = String(clockOut).trim();
  if (str.includes('T') || (!str.toLowerCase().includes('m') && !isNaN(Date.parse(str)))) {
    return isAest ? formatTimeAEST(str) : formatTimeIST(str);
  }
  const cleaned = str.replace(/\s*\([^)]*\)/g, '').trim();
  return cleaned || str;
}

const SEED_EMPLOYEE_ID_MAP: Record<string, string> = {
  'anirudh@ambizcon.com': 'APN 001',
  'mathan@ambizcon.com': 'APN 002',
  'aravind@ambizcon.com': 'APN 003',
  'kenneth@ambizcon.com': 'APN 004',
  'deva@ambizcon.com': 'APN 005',
  'thanikaivel@ambizcon.com': 'APN 006',
  'naraine@ambizcon.com': 'APN 007',
  'mathanmk@ambizcon.com': 'APN 008',
  'mathi.p@ambizcon.com': 'APN 009',
  'kiruthikashri@ambizcon.com': 'APN 010',
  'siddesh@ambizcon.com': 'APN 011',
  'sathish@ambizcon.com': 'APN 012',
  'kavish@ambizcon.com': 'APN 013',
  'kasthuri@ambizcon.com': 'APN 014',
  'ahamed@ambizcon.com': 'APN 015',
  'abdul@ambizcon.com': 'APN 016',
  'adriana@ambizcon.com': 'APN 017',
};

/**
 * Returns the standardized auto-generated employee number formatted as "APN 001", "APN 002", etc.
 */
export function getEmployeeNumber(
  user?: { employeeNumber?: string; email?: string; name?: string; _id?: string } | null,
  fallbackIndex?: number
): string {
  if (user?.employeeNumber && user.employeeNumber.trim()) {
    return user.employeeNumber.trim();
  }
  const emailKey = (user?.email || '').toLowerCase().trim();
  if (emailKey && SEED_EMPLOYEE_ID_MAP[emailKey]) {
    return SEED_EMPLOYEE_ID_MAP[emailKey];
  }
  const nameKey = (user?.name || '').toLowerCase().trim();
  for (const [em, code] of Object.entries(SEED_EMPLOYEE_ID_MAP)) {
    const prefix = em.split('@')[0].replace('.', '');
    if (nameKey.replace(/\s+/g, '').toLowerCase().includes(prefix)) {
      return code;
    }
  }
  if (user?._id) {
    const match = user._id.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > 0) {
        return `APN ${String(num).padStart(3, '0')}`;
      }
    }
  }
  if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
    return `APN ${String(fallbackIndex + 1).padStart(3, '0')}`;
  }
  return 'APN 001';
}

