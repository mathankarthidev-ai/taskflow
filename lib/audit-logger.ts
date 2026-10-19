/**
 * Central Security Audit Logger
 * Logs security-sensitive system and user events (logins, privilege actions, claim edits, attendance scans)
 * with timestamp, actor identity, and network IP.
 */

import { supabase } from '@/lib/supabase';

export interface AuditLogEntry {
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'QR_CLOCK_IN'
    | 'QR_CLOCK_OUT'
    | 'QR_REPLAY_ATTEMPT'
    | 'REIMBURSEMENT_SUBMIT'
    | 'REIMBURSEMENT_EDIT'
    | 'REIMBURSEMENT_APPROVE'
    | 'REIMBURSEMENT_REJECT'
    | 'TASK_STATUS_CHANGE'
    | 'TASK_APPROVE'
    | 'ROLE_CHANGE_ATTEMPT'
    | 'IDOR_BLOCKED';
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'WARNING' | 'BLOCKED';
  details?: Record<string, any>;
}

// In-memory fallback ring-buffer for fast query and resilience if database is temporarily offline
const localAuditBuffer: (AuditLogEntry & { id: string; timestamp: string })[] = [];
const MAX_LOCAL_LOGS = 500;

export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  const logId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const record = {
    id: logId,
    event_type: entry.eventType,
    actor_id: entry.actorId || null,
    actor_email: entry.actorEmail || null,
    actor_role: entry.actorRole || null,
    target_id: entry.targetId || null,
    target_type: entry.targetType || null,
    ip_address: entry.ipAddress || null,
    status: entry.status,
    metadata: entry.details || {},
    created_at: timestamp,
  };

  // 1. Maintain in-memory audit trail
  localAuditBuffer.unshift({
    id: logId,
    timestamp,
    ...entry,
  });
  if (localAuditBuffer.length > MAX_LOCAL_LOGS) {
    localAuditBuffer.pop();
  }

  // 2. Persist to Supabase activity_logs table
  try {
    const { error } = await supabase.from('activity_logs').insert(record);
    if (error) {
      // If table does not yet exist or fails, record is preserved in local buffer
      console.warn('Audit logger Supabase insert notice:', error.message);
    }
  } catch (err) {
    console.warn('Audit logger exception caught:', err);
  }
}

export function getRecentSecurityLogs(limit = 50) {
  return localAuditBuffer.slice(0, limit);
}
