'use server';

import { createTask, getTasks, updateTaskStatus, assignTask, deleteTask, TaskFilterOptions } from '@/services/taskService';
import { TaskPriority, TaskStatus, TeamName } from '@/types';
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
  attachments?: { name: string; url: string; type: string }[];
}) {
  const task = await createTask(data);
  revalidatePath('/dashboard');
  revalidatePath('/kanban');
  revalidatePath('/incoming');
  return task;
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const task = await updateTaskStatus(taskId, status);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  return task;
}

export async function assignTaskAction(taskId: string, assignedToUserId: string) {
  const task = await assignTask(taskId, assignedToUserId);
  revalidatePath('/incoming');
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  return task;
}

export async function deleteTaskAction(taskId: string) {
  const success = await deleteTask(taskId);
  revalidatePath('/kanban');
  revalidatePath('/dashboard');
  return success;
}
