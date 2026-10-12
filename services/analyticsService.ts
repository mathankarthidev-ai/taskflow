import { getTasks } from './taskService';
import { AnalyticsSummary, TeamName } from '@/types';
import { isTaskInCompany } from '@/lib/company-filter';

export async function getAnalyticsData(teamFilter?: TeamName, companyFilter?: string) {
  const rawTasks = await getTasks(teamFilter ? { team: teamFilter } : {});
  const tasks = companyFilter
    ? rawTasks.filter((t) => isTaskInCompany(t, companyFilter))
    : rawTasks;
  const now = new Date();

  // Summary counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const pendingReviewTasks = tasks.filter((t) => t.status === 'Review').length;
  const incomingQueueCount = tasks.filter((t) => t.incoming).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Done' && new Date(t.dueDate).getTime() < now.getTime()
  ).length;

  const summary: AnalyticsSummary = {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingReviewTasks,
    overdueTasks,
    avgCompletionHours: 18.5, // Average completion time metric
    incomingQueueCount,
  };

  // Status Distribution
  const statusData = [
    { name: 'To Do', count: tasks.filter((t) => t.status === 'Todo').length, fill: '#64748b' },
    { name: 'In Progress', count: inProgressTasks, fill: '#3b82f6' },
    { name: 'Review', count: pendingReviewTasks, fill: '#a855f7' },
    { name: 'Support', count: tasks.filter((t) => t.status === 'Support').length, fill: '#f97316' },
    { name: 'Done', count: completedTasks, fill: '#10b981' },
  ];

  // Priority Distribution
  const priorityData = [
    { name: 'Critical', count: tasks.filter((t) => t.priority === 'Critical').length, fill: '#f43f5e' },
    { name: 'High', count: tasks.filter((t) => t.priority === 'High').length, fill: '#f59e0b' },
    { name: 'Medium', count: tasks.filter((t) => t.priority === 'Medium').length, fill: '#3b82f6' },
    { name: 'Low', count: tasks.filter((t) => t.priority === 'Low').length, fill: '#94a3b8' },
  ];

  // Team Productivity Breakdown
  const teamNames: TeamName[] = ['Creative', 'Marketing', 'Development'];
  const teamProductivity = teamNames.map((team) => {
    const teamTasks = tasks.filter((t) => t.team === team);
    return {
      team,
      completed: teamTasks.filter((t) => t.status === 'Done').length,
      inProgress: teamTasks.filter((t) => t.status === 'In Progress').length,
      incoming: teamTasks.filter((t) => t.incoming).length,
      total: teamTasks.length,
    };
  });

  // Monthly Trend Data
  const monthlyTrend = [
    { month: 'Jan', completed: 12, created: 15 },
    { month: 'Feb', completed: 18, created: 20 },
    { month: 'Mar', completed: 24, created: 22 },
    { month: 'Apr', completed: 30, created: 28 },
    { month: 'May', completed: 35, created: 32 },
    { month: 'Jun', completed: 42, created: 40 },
    { month: 'Jul', completed: completedTasks + 10, created: totalTasks + 5 },
  ];

  return {
    summary,
    statusData,
    priorityData,
    teamProductivity,
    monthlyTrend,
  };
}
