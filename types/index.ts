export type UserRole = 'Team Member' | 'Team Lead' | 'Super Admin';
export type TeamName = 'Creative' | 'Marketing' | 'Development';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Support' | 'Done';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  avatar: string;
  createdAt?: string;
}

export interface Team {
  _id: string;
  name: TeamName;
  code: string;
  description: string;
  leadId?: string;
  lead?: User;
  membersCount?: number;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: string;
  user?: User;
  message: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size?: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  team: TeamName;
  assignedTo?: string; // User ID
  assignedUser?: User;
  createdBy: string; // User ID
  createdByUser?: User;
  raisedBy?: string; // User ID or Team Name
  raisedByUser?: User;
  incoming: boolean;
  dueDate: string;
  labels: string[];
  attachments?: TaskAttachment[];
  commentsCount?: number;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: 'assigned' | 'updated' | 'comment' | 'status_change' | 'incoming';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DateRangeFilter {
  range: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingReviewTasks: number;
  overdueTasks: number;
  avgCompletionHours: number;
  incomingQueueCount: number;
}
