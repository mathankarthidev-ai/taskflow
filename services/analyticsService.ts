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

  // Real average completion hours
  let avgCompletionHours = 0;
  const doneTasks = tasks.filter((t) => t.status === 'Done');
  if (doneTasks.length > 0) {
    let totalDurHours = 0;
    doneTasks.forEach((t) => {
      const startMs = new Date(t.createdAt || t.dueDate || Date.now()).getTime();
      const endMs = new Date(t.updatedAt || t.createdAt || Date.now()).getTime();
      const dur = Math.max(0, (endMs - startMs) / 3600000);
      totalDurHours += dur;
    });
    avgCompletionHours = +(totalDurHours / doneTasks.length).toFixed(1);
  }

  const summary: AnalyticsSummary = {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingReviewTasks,
    overdueTasks,
    avgCompletionHours,
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

  // Real Monthly Trend Data (Last 6 months calculated strictly from database)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend: { month: string; completed: number; created: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${y}-${m}`;
    const label = monthNames[d.getMonth()];

    const createdCount = tasks.filter((t) => {
      const cDate = (t.createdAt || '').slice(0, 7);
      return cDate === monthKey;
    }).length;

    const completedCount = tasks.filter((t) => {
      if (t.status !== 'Done') return false;
      const uDate = (t.updatedAt || t.createdAt || '').slice(0, 7);
      return uDate === monthKey;
    }).length;

    monthlyTrend.push({
      month: label,
      created: createdCount,
      completed: completedCount,
    });
  }

  return {
    summary,
    statusData,
    priorityData,
    teamProductivity,
    monthlyTrend,
  };
}
