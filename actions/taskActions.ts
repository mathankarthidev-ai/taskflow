'use server';

import { createTask, getTasks, getTaskById, updateTaskStatus, updateTask, assignTask, deleteTask, TaskFilterOptions } from '@/services/taskService';
import { Task, TaskPriority, TaskStatus, TeamName, UserRole } from '@/types';
import { revalidatePath } from 'next/cache';

export async function fetchTasksAction(options: TaskFilterOptions = {}) {
  return await getTasks(options);
}

export async function createTaskAction(data: {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  team: TeamName;
  assignedTo?: string;
  createdBy: string;
  raisedBy?: string;
  incoming?: boolean;
  dueDate: string;
  labels: string[];
  clientName?: string;
  doctorName?: string;
  specialist?: string;
  reminderSettings?: any;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  attachments?: { name: string; url: string; type: string }[];
  links?: { title?: string; url: string }[];
}) {
  const task = await createTask(data);
  revalidatePath('/dashboard');
  revalidatePath('/kanban');
  revalidatePath('/incoming');
  revalidatePath('/reminders');
  return task;
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const task = await updateTaskStatus(taskId, status);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return task;
}

export async function updateTaskAction(
  taskId: string,
  updates: Partial<Task>,
  requestingUserId: string,
  requestingUserRole: UserRole,
  requestingUserName?: string
) {
  const existing = await getTaskById(taskId);
  if (!existing) {
    throw new Error('Task not found');
  }

  // Permission Rule:
  // Admin can edit anything.
  // TL or Member can edit ONLY their own created tasks and reminders.
  const isAdmin = requestingUserRole === 'Super Admin' || requestingUserRole === 'Admin';
  const isCreator =
    String(existing.createdBy) === String(requestingUserId) ||
    (existing.createdByUser && String(existing.createdByUser._id) === String(requestingUserId)) ||
    (requestingUserName && existing.createdByUser?.name?.toLowerCase() === requestingUserName.toLowerCase());

  if (!isAdmin && !isCreator) {
    throw new Error('Access Denied: Only Admin or the creator can edit this task/reminder.');
  }

  const updated = await updateTask(taskId, updates);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return updated;
}

export async function assignTaskAction(taskId: string, assignedToUserId: string) {
  const task = await assignTask(taskId, assignedToUserId);
  revalidatePath('/incoming');
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return task;
}

export async function deleteTaskAction(taskId: string) {
  const success = await deleteTask(taskId);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return success;
}

export async function logTaskTimeAction(
  taskId: string,
  updates: Pick<Task, 'actualHours' | 'extraHours' | 'timeEntries' | 'history'>
) {
  const updated = await updateTask(taskId, updates);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return updated;
}

export async function updateTaskReviewWorkflowAction(
  taskId: string,
  updates: Partial<Task>
) {
  const updated = await updateTask(taskId, updates);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  revalidatePath('/reminders');
  return updated;
}


