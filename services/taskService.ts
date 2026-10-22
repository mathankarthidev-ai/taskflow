import { Task, TaskPriority, TaskStatus, TeamName, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { getAllUsers } from './authService';

export interface TaskFilterOptions {
  team?: TeamName;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  createdBy?: string;
  incoming?: boolean;
  search?: string;
}

function mapTaskToRow(task: Task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    team: task.team,
    client_name: task.clientName || null,
    client_id: task.clientId || null,
    doctor_name: task.doctorName || null,
    specialist: task.specialist || null,
    project_id: task.projectId || null,
    project_name: task.projectName || null,
    task_type_id: task.taskTypeId || null,
    task_type_name: task.taskTypeName || null,
    client_approved: task.clientApproved ?? true,
    approval_token: task.approvalToken || null,
    approval_expires_at: task.approvalExpiresAt || null,
    assigned_to: task.assignedTo || null,
    created_by: task.createdBy || null,
    raised_by: task.raisedBy || null,
    incoming: Boolean(task.incoming),
    approval_status: task.approvalStatus || 'approved',
    approved_by: task.approvedBy || null,
    assigned_reviewer_id: task.assignedReviewerId || null,
    assigned_reviewer_name: task.assignedReviewerName || null,
    review_status: task.reviewStatus || 'none',
    review_note: task.reviewNote || null,
    start_date: task.startDate || null,
    due_date: task.dueDate || new Date().toISOString(),
    estimated_hours: task.estimatedHours ?? 0,
    actual_hours: task.actualHours ?? 0,
    time_entries: task.timeEntries || [],
    progress_pct: task.progressPct ?? 0,
    subtasks: task.subtasks || [],
    dependencies: task.dependencies || [],
    is_recurring: Boolean(task.isRecurring),
    recurring_frequency: task.recurringFrequency || null,
    reminder_settings: task.reminderSettings || null,
    labels: task.labels || [],
    attachments: [
      ...(Array.isArray(task.attachments) ? task.attachments.filter((a: any) => a?.type !== 'link') : []),
      ...(Array.isArray(task.links)
        ? task.links.map((l) => ({
            name: l.title || l.url,
            url: l.url,
            type: 'link',
          }))
        : []),
    ],
    comments_count: task.commentsCount ?? 0,
    history: task.history || [],
    created_at: task.createdAt || new Date().toISOString(),
    updated_at: task.updatedAt || new Date().toISOString(),
  };
}

function mapRowToTask(row: any, allUsers: User[]): Task {
  const assignedUser = row.assigned_to ? allUsers.find((u) => u._id === row.assigned_to) : undefined;
  const createdByUser = row.created_by ? allUsers.find((u) => u._id === row.created_by) : undefined;
  const raisedByUser = row.raised_by ? allUsers.find((u) => u._id === row.raised_by) : undefined;

  return {
    _id: String(row.id),
    title: row.title,
    description: row.description || '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    team: row.team as TeamName,
    clientName: row.client_name || undefined,
    clientId: row.client_id || undefined,
    doctorName: row.doctor_name || undefined,
    specialist: row.specialist || undefined,
    projectId: row.project_id || undefined,
    projectName: row.project_name || undefined,
    taskTypeId: row.task_type_id || undefined,
    taskTypeName: row.task_type_name || undefined,
    clientApproved: row.client_approved ?? true,
    approvalToken: row.approval_token || undefined,
    approvalExpiresAt: row.approval_expires_at || undefined,
    assignedTo: row.assigned_to || undefined,
    assignedUser,
    createdBy: row.created_by || '',
    createdByUser,
    raisedBy: row.raised_by || undefined,
    raisedByUser,
    incoming: Boolean(row.incoming),
    approvalStatus: row.approval_status || 'approved',
    approvedBy: row.approved_by || undefined,
    assignedReviewerId: row.assigned_reviewer_id || undefined,
    assignedReviewerName: row.assigned_reviewer_name || undefined,
    reviewStatus: row.review_status || 'none',
    reviewNote: row.review_note || undefined,
    startDate: row.start_date || undefined,
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : new Date().toISOString(),
    estimatedHours: Number(row.estimated_hours || 0),
    actualHours: Number(row.actual_hours || 0),
    extraHours: Array.isArray(row.time_entries)
      ? row.time_entries.reduce((sum: number, te: any) => sum + (te?.isExtraHours ? Number(te.hoursLogged || 0) : 0), 0)
      : 0,
    timeEntries: Array.isArray(row.time_entries) ? row.time_entries : [],
    progressPct: Number(row.progress_pct || 0),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
    isRecurring: Boolean(row.is_recurring),
    recurringFrequency: row.recurring_frequency || undefined,
    reminderSettings: row.reminder_settings || undefined,
    labels: Array.isArray(row.labels) ? row.labels : [],
    attachments: Array.isArray(row.attachments) ? row.attachments.filter((a: any) => a?.type !== 'link') : [],
    links: Array.isArray(row.links)
      ? row.links
      : Array.isArray(row.attachments)
      ? row.attachments
          .filter((a: any) => a?.type === 'link')
          .map((a: any) => ({ title: a.name || a.url, url: a.url }))
      : [],
    commentsCount: Number(row.comments_count || 0),
    history: Array.isArray(row.history) ? row.history : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getTasks(options: TaskFilterOptions = {}): Promise<Task[]> {
  const allUsers = await getAllUsers();

  try {
    const { data: rows, error } = await supabase
      .from('tasks')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && rows) {
      let taskList: Task[] = rows.map((r) => mapRowToTask(r, allUsers));

      if (options.team) {
        taskList = taskList.filter((t) => t.team === options.team);
      }
      if (options.status) {
        taskList = taskList.filter((t) => t.status === options.status);
      }
      if (options.priority) {
        taskList = taskList.filter((t) => t.priority === options.priority);
      }
      if (options.assignedTo) {
        taskList = taskList.filter((t) => t.assignedTo === options.assignedTo);
      }
      if (options.createdBy) {
        taskList = taskList.filter((t) => t.createdBy === options.createdBy);
      }
      if (options.incoming !== undefined) {
        taskList = taskList.filter((t) => t.incoming === options.incoming);
      }
      if (options.search) {
        const term = options.search.toLowerCase();
        taskList = taskList.filter(
          (t) =>
            t.title.toLowerCase().includes(term) ||
            t.description.toLowerCase().includes(term) ||
            t.labels.some((l) => l.toLowerCase().includes(term))
        );
      }

      return taskList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  } catch (e) {
    console.error('Error fetching tasks from Supabase:', e);
  }

  // Fallback to mockStore
  let filtered = [...mockStore.tasks];
  if (options.team) filtered = filtered.filter((t) => t.team === options.team);
  if (options.status) filtered = filtered.filter((t) => t.status === options.status);
  if (options.priority) filtered = filtered.filter((t) => t.priority === options.priority);
  if (options.assignedTo) filtered = filtered.filter((t) => t.assignedTo === options.assignedTo);
  if (options.createdBy) filtered = filtered.filter((t) => t.createdBy === options.createdBy);
  if (options.incoming !== undefined) filtered = filtered.filter((t) => t.incoming === options.incoming);
  if (options.search) {
    const term = options.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.labels.some((l) => l.toLowerCase().includes(term))
    );
  }

  return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const allUsers = await getAllUsers();

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!error && data) {
      return mapRowToTask(data, allUsers);
    }
  } catch (e) {
    console.error('Error fetching task by ID from Supabase:', e);
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  return task || null;
}

export async function createTask(input: {
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
  attachments?: { name: string; url: string; type: string }[];
}): Promise<Task> {
  const allUsers = await getAllUsers();
  const creatorUser = allUsers.find((u) => u._id === input.createdBy || u.email === input.createdBy);
  const assignedUser = input.assignedTo ? allUsers.find((u) => u._id === input.assignedTo) : undefined;
  const raisedByUser = input.raisedBy ? allUsers.find((u) => u._id === input.raisedBy) : undefined;
  const isIncoming = input.incoming ?? (input.raisedBy ? true : false);
  const nowIso = new Date().toISOString();

  const newTask: Task = {
    _id: `task_${Date.now()}`,
    title: input.title,
    description: input.description,
    priority: input.priority,
    status: input.status,
    team: input.team,
    clientName: input.clientName || 'Coomera Town Medical Center',
    doctorName: input.doctorName,
    specialist: input.specialist,
    reminderSettings: input.reminderSettings,
    assignedTo: assignedUser?._id || input.assignedTo,
    assignedUser,
    createdBy: creatorUser?._id || input.createdBy,
    createdByUser: creatorUser,
    raisedBy: raisedByUser?._id || input.raisedBy,
    raisedByUser,
    incoming: isIncoming,
    dueDate: input.dueDate,
    labels: input.labels || [],
    attachments: input.attachments || [],
    commentsCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const row = mapTaskToRow(newTask);
    const { data, error } = await supabase
      .from('tasks')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error && data) {
      const mapped = mapRowToTask(data, allUsers);
      mockStore.tasks.unshift(mapped);
      return mapped;
    }
  } catch (e) {
    console.error('Error creating task in Supabase:', e);
  }

  mockStore.tasks.unshift(newTask);
  return newTask;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
  const nowIso = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status, updated_at: nowIso })
      .eq('id', taskId)
      .select('*')
      .single();

    if (!error && data) {
      const task = mockStore.tasks.find((t) => t._id === taskId);
      if (task) {
        task.status = status;
        task.updatedAt = nowIso;
      }
      const allUsers = await getAllUsers();
      return mapRowToTask(data, allUsers);
    }
  } catch (e) {
    console.error('Error updating task status in Supabase:', e);
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = nowIso;
    return { ...task };
  }
  return null;
}

export async function assignTask(taskId: string, assignedToUserId: string): Promise<Task | null> {
  const allUsers = await getAllUsers();
  const assignedUser = allUsers.find((u) => u._id === assignedToUserId);
  const nowIso = new Date().toISOString();

  const dbPayload: Record<string, any> = {
    assigned_to: assignedUser?._id || assignedToUserId,
    incoming: false,
    updated_at: nowIso,
  };
  if (assignedUser?.team && assignedUser.role !== 'Super Admin') {
    dbPayload.team = assignedUser.team;
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(dbPayload)
      .eq('id', taskId)
      .select('*')
      .single();

    if (!error && data) {
      const task = mockStore.tasks.find((t) => t._id === taskId);
      if (task) {
        task.assignedTo = assignedUser?._id || assignedToUserId;
        task.assignedUser = assignedUser;
        if (assignedUser?.team && assignedUser.role !== 'Super Admin') {
          task.team = assignedUser.team;
        }
        task.incoming = false;
        task.updatedAt = nowIso;
      }
      return mapRowToTask(data, allUsers);
    }
  } catch (e) {
    console.error('Error assigning task in Supabase:', e);
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.assignedTo = assignedUser?._id || assignedToUserId;
    task.assignedUser = assignedUser;
    if (assignedUser?.team && assignedUser.role !== 'Super Admin') {
      task.team = assignedUser.team;
    }
    task.incoming = false;
    task.updatedAt = nowIso;
    return { ...task };
  }
  return null;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      const index = mockStore.tasks.findIndex((t) => t._id === taskId);
      if (index !== -1) mockStore.tasks.splice(index, 1);
      return true;
    }
  } catch (e) {
    console.error('Error deleting task in Supabase:', e);
  }

  const index = mockStore.tasks.findIndex((t) => t._id === taskId);
  if (index !== -1) {
    mockStore.tasks.splice(index, 1);
    return true;
  }
  return false;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  const allUsers = await getAllUsers();
  const nowIso = new Date().toISOString();

  let assignedUser: User | undefined;
  if (updates.assignedTo) {
    assignedUser = allUsers.find((u) => u._id === updates.assignedTo);
  }

  const dbUpdates: Record<string, any> = { updated_at: nowIso };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.team !== undefined) dbUpdates.team = updates.team;
  if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
  if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
  if (updates.doctorName !== undefined) dbUpdates.doctor_name = updates.doctorName;
  if (updates.specialist !== undefined) dbUpdates.specialist = updates.specialist;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = assignedUser?._id || updates.assignedTo;
  if (updates.incoming !== undefined) dbUpdates.incoming = updates.incoming;
  if (updates.approvalStatus !== undefined) dbUpdates.approval_status = updates.approvalStatus;
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;
  if (updates.assignedReviewerId !== undefined) dbUpdates.assigned_reviewer_id = updates.assignedReviewerId;
  if (updates.assignedReviewerName !== undefined) dbUpdates.assigned_reviewer_name = updates.assignedReviewerName;
  if (updates.reviewStatus !== undefined) dbUpdates.review_status = updates.reviewStatus;
  if (updates.reviewNote !== undefined) dbUpdates.review_note = updates.reviewNote;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.estimatedHours !== undefined) dbUpdates.estimated_hours = updates.estimatedHours;
  if (updates.actualHours !== undefined) dbUpdates.actual_hours = updates.actualHours;
  if (updates.timeEntries !== undefined) dbUpdates.time_entries = updates.timeEntries;
  if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;
  if (updates.reminderSettings !== undefined) dbUpdates.reminder_settings = updates.reminderSettings;
  if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
  if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
  if (updates.commentsCount !== undefined) dbUpdates.comments_count = updates.commentsCount;
  if (updates.history !== undefined) dbUpdates.history = updates.history;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select('*')
      .single();

    if (!error && data) {
      const task = mockStore.tasks.find((t) => t._id === taskId);
      if (task) {
        Object.assign(task, updates);
        if (assignedUser) {
          task.assignedTo = assignedUser._id;
          task.assignedUser = assignedUser;
        }
        task.updatedAt = nowIso;
      }
      return mapRowToTask(data, allUsers);
    }
  } catch (e) {
    console.error('Error updating task in Supabase:', e);
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    Object.assign(task, updates);
    if (assignedUser) {
      task.assignedTo = assignedUser._id;
      task.assignedUser = assignedUser;
    }
    task.updatedAt = nowIso;
    return { ...task };
  }
  return null;
}
