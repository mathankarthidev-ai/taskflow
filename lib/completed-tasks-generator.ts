import { Task, TaskPriority, TeamName, User } from '@/types';

export type CompletedPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Clean slate: no fake completed tasks are generated.
 * Returns only genuine completed tasks from database if provided.
 */
export function generateMemberCompletedTasks(
  _user: User,
  _period: CompletedPeriod = 'yearly'
): Task[] {
  return [];
}

/**
 * Clean slate: returns empty array, only genuine completed tasks from database will be shown.
 */
export function generateAllMembersCompletedTasks(
  _users: User[],
  _period: CompletedPeriod = 'daily'
): Task[] {
  return [];
}
