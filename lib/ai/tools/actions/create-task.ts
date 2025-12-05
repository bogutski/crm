import { createTask as createTaskController } from '@/modules/task/controller';
import { CreateTaskParams } from '../types';

export async function createTask(params: CreateTaskParams, userId: string) {
  const { title, description, dueDate, priorityId, assigneeId, linkedEntityType, linkedEntityId } = params;

  const taskData: Parameters<typeof createTaskController>[0] = {
    title,
    description,
    dueDate,
    priorityId,
    assigneeId,
    ownerId: userId,
  };

  if (linkedEntityType && linkedEntityId) {
    taskData.linkedTo = {
      entityType: linkedEntityType,
      entityId: linkedEntityId,
    };
  }

  const task = await createTaskController(taskData);

  return {
    success: true,
    message: `Задача "${task.title}" успешно создана`,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority?.name,
      dueDate: task.dueDate,
      assignee: task.assignee?.name,
      linkedTo: task.linkedTo ? {
        type: task.linkedTo.entityType,
        name: task.linkedTo.name,
      } : null,
    },
  };
}
