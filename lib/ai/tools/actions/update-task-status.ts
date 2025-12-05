import { updateTask, getTaskById } from '@/modules/task/controller';
import { UpdateTaskStatusParams } from '../types';

const STATUS_NAMES: Record<string, string> = {
  open: 'Открыта',
  in_progress: 'В работе',
  completed: 'Выполнена',
  cancelled: 'Отменена',
};

export async function updateTaskStatus(params: UpdateTaskStatusParams) {
  const { taskId, status } = params;

  // Get current task
  const currentTask = await getTaskById(taskId);
  if (!currentTask) {
    return {
      success: false,
      error: 'Задача не найдена',
    };
  }

  const oldStatus = currentTask.status;

  // Update status
  const updatedTask = await updateTask(taskId, { status });

  if (!updatedTask) {
    return {
      success: false,
      error: 'Не удалось обновить статус задачи',
    };
  }

  return {
    success: true,
    message: `Статус задачи "${updatedTask.title}" изменен с "${STATUS_NAMES[oldStatus]}" на "${STATUS_NAMES[status]}"`,
    task: {
      id: updatedTask.id,
      title: updatedTask.title,
      previousStatus: oldStatus,
      newStatus: status,
      completedAt: updatedTask.completedAt,
    },
  };
}
