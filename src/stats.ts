import { Task, TaskPriority, TaskStatus } from "./types.ts";

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  completionRate: number;
  recentActivity: number; // tasks created in last 7 days
  topTags: Array<{ tag: string; count: number }>;
}

export function calculateStats(tasks: Task[]): TaskStats {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: TaskStats = {
    total: tasks.length,
    byStatus: { todo: 0, "in-progress": 0, done: 0 },
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    overdue: 0,
    completionRate: 0,
    recentActivity: 0,
    topTags: [],
  };

  // Calculate status and priority distributions
  const tagCounts: Record<string, number> = {};

  tasks.forEach((task) => {
    // Status count
    stats.byStatus[task.status]++;

    // Priority count
    stats.byPriority[task.priority]++;

    // Overdue check
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (dueDate < now && task.status !== "done") {
        stats.overdue++;
      }
    }

    // Recent activity
    const createdAt = new Date(task.createdAt);
    if (createdAt >= sevenDaysAgo) {
      stats.recentActivity++;
    }

    // Tag counts
    if (task.tags) {
      task.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Calculate completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round(
      (stats.byStatus.done / stats.total) * 100,
    );
  }

  // Calculate top tags
  stats.topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
}
