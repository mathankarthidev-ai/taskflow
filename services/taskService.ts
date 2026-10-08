import { Task, TaskPriority, TaskStatus, TeamName } from '@/types';
import { connectDB } from '@/lib/db';
import { Task as TaskModel } from '@/models/Task';
import { User as UserModel } from '@/models/User';
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

export async function getTasks(options: TaskFilterOptions = {}): Promise<Task[]> {
  const db = await connectDB();

  if (db) {
    try {
      // Build Mongoose query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {};

      if (options.team) query.team = options.team;
      if (options.status) query.status = options.status;
      if (options.priority) query.priority = options.priority;
      if (options.assignedTo) query.assignedTo = options.assignedTo;
      if (options.createdBy) query.createdBy = options.createdBy;
      if (options.incoming !== undefined) query.incoming = options.incoming;
      if (options.search) {
        query.$or = [
          { title: { $regex: options.search, $options: 'i' } },
          { description: { $regex: options.search, $options: 'i' } },
          { labels: { $regex: options.search, $options: 'i' } },
        ];
      }

      const docs = await TaskModel.find(query)
        .populate('assignedTo')
        .populate('createdBy')
        .populate('raisedBy')
        .sort({ updatedAt: -1 })
        .lean();

      if (docs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return docs.map((doc: any) => ({
          _id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          status: doc.status,
          priority: doc.priority,
          team: doc.team,
          assignedTo: doc.assignedTo?._id?.toString(),
          assignedUser: doc.assignedTo ? {
            _id: doc.assignedTo._id.toString(),
            name: doc.assignedTo.name,
            email: doc.assignedTo.email,
            role: doc.assignedTo.role,
            team: doc.assignedTo.team,
            avatar: doc.assignedTo.avatar,
          } : undefined,
          createdBy: doc.createdBy?._id?.toString() || '',
          createdByUser: doc.createdBy ? {
            _id: doc.createdBy._id.toString(),
            name: doc.createdBy.name,
            email: doc.createdBy.email,
            role: doc.createdBy.role,
            team: doc.createdBy.team,
            avatar: doc.createdBy.avatar,
          } : undefined,
          raisedBy: doc.raisedBy?._id?.toString(),
          raisedByUser: doc.raisedBy ? {
            _id: doc.raisedBy._id.toString(),
            name: doc.raisedBy.name,
            email: doc.raisedBy.email,
            role: doc.raisedBy.role,
            team: doc.raisedBy.team,
            avatar: doc.raisedBy.avatar,
          } : undefined,
          incoming: doc.incoming,
          dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : new Date().toISOString(),
          labels: doc.labels || [],
          attachments: doc.attachments || [],
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        }));
      }

      const totalCount = await TaskModel.countDocuments();
      if (totalCount > 0) {
        return [];
      }
    } catch (e) {
      console.error('Error fetching tasks from DB:', e);
    }
  }

  // Fallback to mockStore
  let filtered = [...mockStore.tasks];

  if (options.team) {
    filtered = filtered.filter((t) => t.team === options.team);
  }
  if (options.status) {
    filtered = filtered.filter((t) => t.status === options.status);
  }
  if (options.priority) {
    filtered = filtered.filter((t) => t.priority === options.priority);
  }
  if (options.assignedTo) {
    filtered = filtered.filter((t) => t.assignedTo === options.assignedTo);
  }
  if (options.createdBy) {
    filtered = filtered.filter((t) => t.createdBy === options.createdBy);
  }
  if (options.incoming !== undefined) {
    filtered = filtered.filter((t) => t.incoming === options.incoming);
  }
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
  const db = await connectDB();

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = await TaskModel.findById(taskId)
        .populate('assignedTo')
        .populate('createdBy')
        .populate('raisedBy')
        .lean();

      if (doc) {
        return {
          _id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          status: doc.status,
          priority: doc.priority,
          team: doc.team,
          assignedTo: doc.assignedTo?._id?.toString(),
          assignedUser: doc.assignedTo ? {
            _id: doc.assignedTo._id.toString(),
            name: doc.assignedTo.name,
            email: doc.assignedTo.email,
            role: doc.assignedTo.role,
            team: doc.assignedTo.team,
            avatar: doc.assignedTo.avatar,
          } : undefined,
          createdBy: doc.createdBy?._id?.toString() || '',
          createdByUser: doc.createdBy ? {
            _id: doc.createdBy._id.toString(),
            name: doc.createdBy.name,
            email: doc.createdBy.email,
            role: doc.createdBy.role,
            team: doc.createdBy.team,
            avatar: doc.createdBy.avatar,
          } : undefined,
          raisedBy: doc.raisedBy?._id?.toString(),
          raisedByUser: doc.raisedBy ? {
            _id: doc.raisedBy._id.toString(),
            name: doc.raisedBy.name,
            email: doc.raisedBy.email,
            role: doc.raisedBy.role,
            team: doc.raisedBy.team,
            avatar: doc.raisedBy.avatar,
          } : undefined,
          incoming: doc.incoming,
          dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString() : new Date().toISOString(),
          labels: doc.labels || [],
          attachments: doc.attachments || [],
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('Error fetching task by ID from DB:', e);
    }
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
  const db = await connectDB();
  const allUsers = await getAllUsers();
  const creatorUser = allUsers.find((u) => u._id === input.createdBy || u.email === input.createdBy);
  const assignedUser = input.assignedTo ? allUsers.find((u) => u._id === input.assignedTo) : undefined;
  const raisedByUser = input.raisedBy ? allUsers.find((u) => u._id === input.raisedBy) : undefined;

  const isIncoming = input.incoming ?? (input.raisedBy ? true : false);

  if (db) {
    try {
      const createdDoc = await TaskModel.create({
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        team: input.team,
        assignedTo: assignedUser?._id,
        createdBy: creatorUser?._id,
        raisedBy: raisedByUser?._id,
        incoming: isIncoming,
        dueDate: new Date(input.dueDate),
        labels: input.labels,
        attachments: input.attachments || [],
      });

      return {
        _id: createdDoc._id.toString(),
        title: createdDoc.title,
        description: createdDoc.description,
        status: createdDoc.status,
        priority: createdDoc.priority,
        team: createdDoc.team,
        clientName: input.clientName,
        doctorName: input.doctorName,
        specialist: input.specialist,
        reminderSettings: input.reminderSettings,
        assignedTo: assignedUser?._id,
        assignedUser,
        createdBy: creatorUser?._id || '',
        createdByUser: creatorUser,
        raisedBy: raisedByUser?._id,
        raisedByUser,
        incoming: isIncoming,
        dueDate: createdDoc.dueDate.toISOString(),
        labels: createdDoc.labels,
        attachments: createdDoc.attachments,
        createdAt: createdDoc.createdAt.toISOString(),
        updatedAt: createdDoc.updatedAt.toISOString(),
      };
    } catch (e) {
      console.error('Error creating task in DB:', e);
    }
  }

  // Fallback to mockStore
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
    assignedTo: assignedUser?._id,
    assignedUser,
    createdBy: creatorUser?._id || input.createdBy,
    createdByUser: creatorUser,
    raisedBy: raisedByUser?._id,
    raisedByUser,
    incoming: isIncoming,
    dueDate: input.dueDate,
    labels: input.labels,
    attachments: input.attachments || [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStore.tasks.unshift(newTask);
  return newTask;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
  const db = await connectDB();

  if (db) {
    try {
      const doc = await TaskModel.findByIdAndUpdate(
        taskId,
        { status, updatedAt: new Date() },
        { new: true }
      )
        .populate('assignedTo')
        .populate('createdBy')
        .lean();

      if (doc) {
        return getTaskById(taskId);
      }
    } catch (e) {
      console.error('Error updating task status in DB:', e);
    }
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    return { ...task };
  }
  return null;
}

export async function assignTask(taskId: string, assignedToUserId: string): Promise<Task | null> {
  const db = await connectDB();
  const allUsers = await getAllUsers();
  const assignedUser = allUsers.find((u) => u._id === assignedToUserId);

  if (db) {
    try {
      await TaskModel.findByIdAndUpdate(
        taskId,
        {
          assignedTo: assignedUser?._id,
          incoming: false, // Clearing incoming state once assigned by team lead
          updatedAt: new Date(),
        }
      );
      return getTaskById(taskId);
    } catch (e) {
      console.error('Error assigning task in DB:', e);
    }
  }

  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.assignedTo = assignedUser?._id;
    task.assignedUser = assignedUser;
    task.incoming = false;
    task.updatedAt = new Date().toISOString();
    return { ...task };
  }
  return null;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const db = await connectDB();

  if (db) {
    try {
      await TaskModel.findByIdAndDelete(taskId);
      return true;
    } catch (e) {
      console.error('Error deleting task in DB:', e);
    }
  }

  const index = mockStore.tasks.findIndex((t) => t._id === taskId);
  if (index !== -1) {
    mockStore.tasks.splice(index, 1);
    return true;
  }
  return false;
}
