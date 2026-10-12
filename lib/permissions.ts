import { Task, User } from '@/types';

/**
 * Checks whether a user has permission to edit a specific task or reminder.
 * Rule:
 * - Admin (Super Admin / Admin) can edit ANY task or reminder.
 * - TL (Team Lead) and Member (Team Member / Reception Staff) can ONLY edit tasks and reminders they created themselves.
 */
export function canEditTaskOrReminder(
  task: Task | null | undefined,
  user: User | null | undefined
): boolean {
  if (!task || !user) return false;

  // 1. Super Admin or Admin can edit anything
  const isAdmin = user.role === 'Super Admin' || user.role === 'Admin';
  if (isAdmin) return true;

  // 2. Creator ID / email match
  const rawCreatedBy = task.createdBy as any;
  const creatorId =
    (typeof rawCreatedBy === 'object' && rawCreatedBy !== null ? rawCreatedBy._id : rawCreatedBy) ||
    task.createdByUser?._id;

  if (
    creatorId &&
    (String(creatorId) === String(user._id) ||
      String(creatorId) === String(user.email) ||
      (user._id && String(creatorId).toLowerCase() === String(user._id).toLowerCase()))
  ) {
    return true;
  }

  // 3. Creator Name fallback match (for seed/mock data consistency)
  if (task.createdByUser?.name && user.name) {
    if (task.createdByUser.name.trim().toLowerCase() === user.name.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to get the human-readable creator display name
 */
export function getTaskCreatorName(task: Task | null | undefined): string {
  if (!task) return 'Unknown Creator';
  return task.createdByUser?.name || 'Task Creator';
}
