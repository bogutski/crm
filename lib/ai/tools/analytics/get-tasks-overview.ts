import { getTasks, getTaskStatusCounts } from '@/modules/task/controller';
import { GetTasksOverviewParams } from '../types';

export async function getTasksOverview(params: GetTasksOverviewParams) {
  const { status, assigneeId, limit } = params;

  // Get status counts
  const counts = await getTaskStatusCounts({
    assigneeId,
  });

  // Build filters based on status
  const filters: Parameters<typeof getTasks>[0] = {
    page: 1,
    limit,
    assigneeId,
  };

  if (status === 'overdue') {
    filters.overdue = true;
  } else if (status !== 'all') {
    filters.status = status;
  }

  const result = await getTasks(filters);

  // Get overdue count separately
  const overdueResult = await getTasks({
    overdue: true,
    page: 1,
    limit: 1,
  });

  return {
    success: true,
    summary: {
      total: counts.all,
      open: counts.open,
      inProgress: counts.in_progress,
      completed: counts.completed,
      cancelled: counts.cancelled,
      overdue: overdueResult.total,
    },
    tasks: result.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority?.name,
      priorityColor: task.priority?.color,
      dueDate: task.dueDate,
      isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && !['completed', 'cancelled'].includes(task.status),
      assignee: task.assignee?.name,
      linkedTo: task.linkedTo ? {
        type: task.linkedTo.entityType,
        name: task.linkedTo.name,
      } : null,
    })),
  };
}
