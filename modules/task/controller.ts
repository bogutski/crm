import mongoose from 'mongoose';
import Task, { ITask, ILinkedEntity } from './model';
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskResponse,
  TasksListResponse,
  TaskFilters,
  TaskPriority,
  TaskAssignee,
  LinkedEntityResponse,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
// Import models for populate
import '@/modules/dictionary/model';
import '@/modules/contact/model';
import '@/modules/project/model';

function toPriorityResponse(priority: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; properties?: { color?: string } } | undefined): TaskPriority | null {
  if (!priority) return null;

  if (priority instanceof mongoose.Types.ObjectId) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = priority as any;
  if (!p._id || !p.name) return null;

  return {
    id: p._id.toString(),
    name: p.name,
    color: p.properties?.color,
  };
}

function toAssigneeResponse(assignee: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string } | undefined): TaskAssignee | null {
  if (!assignee) return null;

  if (assignee instanceof mongoose.Types.ObjectId) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = assignee as any;
  if (!a._id) return null;

  return {
    id: a._id.toString(),
    name: a.name || '',
    email: a.email || '',
  };
}

function toLinkedEntityResponse(
  linkedTo: ILinkedEntity | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  populatedEntity: any
): LinkedEntityResponse | null {
  if (!linkedTo) return null;

  let name = '';
  if (populatedEntity) {
    name = populatedEntity.name || '';
  }

  return {
    entityType: linkedTo.entityType,
    entityId: linkedTo.entityId.toString(),
    name,
  };
}

function toTaskResponse(task: ITask, populatedLinkedEntity?: unknown): TaskResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = task as any;
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: toPriorityResponse(t.priorityId),
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    assignee: toAssigneeResponse(t.assigneeId),
    linkedTo: toLinkedEntityResponse(task.linkedTo, populatedLinkedEntity),
    ownerId: task.ownerId.toString(),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function populateLinkedEntity(task: ITask): Promise<unknown> {
  if (!task.linkedTo) return null;

  const { entityType, entityId } = task.linkedTo;

  if (entityType === 'contact') {
    const Contact = mongoose.models.Contact;
    if (Contact) {
      return Contact.findById(entityId).select('_id name').lean();
    }
  } else if (entityType === 'project') {
    const Project = mongoose.models.Project;
    if (Project) {
      return Project.findById(entityId).select('_id name').lean();
    }
  }

  return null;
}

export async function getTasks(filters: TaskFilters): Promise<TasksListResponse> {
  await dbConnect();

  const {
    search,
    status,
    priorityId,
    assigneeId,
    ownerId,
    entityType,
    entityId,
    dueDateFrom,
    dueDateTo,
    overdue,
    page = 1,
    limit = 30,
  } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (priorityId) {
    query.priorityId = priorityId;
  }

  if (assigneeId) {
    query.assigneeId = assigneeId;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  // Filter by linked entity
  if (entityType && entityId) {
    query['linkedTo.entityType'] = entityType;
    query['linkedTo.entityId'] = entityId;
  } else if (entityType) {
    query['linkedTo.entityType'] = entityType;
  }

  if (dueDateFrom || dueDateTo) {
    query.dueDate = {};
    if (dueDateFrom) {
      (query.dueDate as Record<string, unknown>).$gte = new Date(dueDateFrom);
    }
    if (dueDateTo) {
      (query.dueDate as Record<string, unknown>).$lte = new Date(dueDateTo);
    }
  }

  if (overdue) {
    query.dueDate = { ...((query.dueDate as object) || {}), $lt: new Date() };
    query.status = { $nin: ['completed', 'cancelled'] };
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('priorityId', '_id name properties')
      .populate('assigneeId', '_id name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(query),
  ]);

  // Populate linked entities manually
  const tasksWithLinked = await Promise.all(
    tasks.map(async (task) => {
      const linkedEntity = await populateLinkedEntity(task);
      return toTaskResponse(task, linkedEntity);
    })
  );

  return {
    tasks: tasksWithLinked,
    total,
    page,
    limit,
  };
}

export async function getTaskById(id: string): Promise<TaskResponse | null> {
  await dbConnect();

  const task = await Task.findById(id)
    .populate('priorityId', '_id name properties')
    .populate('assigneeId', '_id name email');

  if (!task) return null;

  const linkedEntity = await populateLinkedEntity(task);
  return toTaskResponse(task, linkedEntity);
}

export async function createTask(data: CreateTaskDTO): Promise<TaskResponse> {
  await dbConnect();

  const taskData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    status: data.status || 'open',
    priorityId: data.priorityId || undefined,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    assigneeId: data.assigneeId || undefined,
    ownerId: data.ownerId,
  };

  if (data.linkedTo) {
    taskData.linkedTo = {
      entityType: data.linkedTo.entityType,
      entityId: new mongoose.Types.ObjectId(data.linkedTo.entityId),
    };
  }

  const task = await Task.create(taskData);

  await task.populate('priorityId', '_id name properties');
  await task.populate('assigneeId', '_id name email');

  const linkedEntity = await populateLinkedEntity(task);
  return toTaskResponse(task, linkedEntity);
}

export async function updateTask(
  id: string,
  data: UpdateTaskDTO
): Promise<TaskResponse | null> {
  await dbConnect();

  const updateData: Record<string, unknown> = {};
  const unsetFields: Record<string, 1> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Auto-set completedAt when completing
    if (data.status === 'completed') {
      updateData.completedAt = new Date();
    } else {
      unsetFields.completedAt = 1;
    }
  }

  // Handle nullable fields
  if (data.description === null) {
    unsetFields.description = 1;
  } else if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.priorityId === null) {
    unsetFields.priorityId = 1;
  } else if (data.priorityId !== undefined) {
    updateData.priorityId = data.priorityId;
  }

  if (data.dueDate === null) {
    unsetFields.dueDate = 1;
  } else if (data.dueDate !== undefined) {
    updateData.dueDate = new Date(data.dueDate);
  }

  if (data.assigneeId === null) {
    unsetFields.assigneeId = 1;
  } else if (data.assigneeId !== undefined) {
    updateData.assigneeId = data.assigneeId;
  }

  if (data.linkedTo === null) {
    unsetFields.linkedTo = 1;
  } else if (data.linkedTo !== undefined) {
    updateData.linkedTo = {
      entityType: data.linkedTo.entityType,
      entityId: new mongoose.Types.ObjectId(data.linkedTo.entityId),
    };
  }

  const updateQuery: Record<string, unknown> = {};
  if (Object.keys(updateData).length > 0) {
    updateQuery.$set = updateData;
  }
  if (Object.keys(unsetFields).length > 0) {
    updateQuery.$unset = unsetFields;
  }

  if (Object.keys(updateQuery).length === 0) {
    // Nothing to update
    const task = await Task.findById(id)
      .populate('priorityId', '_id name properties')
      .populate('assigneeId', '_id name email');
    if (!task) return null;
    const linkedEntity = await populateLinkedEntity(task);
    return toTaskResponse(task, linkedEntity);
  }

  const task = await Task.findByIdAndUpdate(id, updateQuery, { new: true })
    .populate('priorityId', '_id name properties')
    .populate('assigneeId', '_id name email');

  if (!task) return null;

  const linkedEntity = await populateLinkedEntity(task);
  return toTaskResponse(task, linkedEntity);
}

export async function deleteTask(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Task.findByIdAndDelete(id);
  return !!result;
}

export async function getTasksByEntity(
  entityType: 'contact' | 'project',
  entityId: string
): Promise<TaskResponse[]> {
  await dbConnect();

  const tasks = await Task.find({
    'linkedTo.entityType': entityType,
    'linkedTo.entityId': entityId,
  })
    .populate('priorityId', '_id name properties')
    .populate('assigneeId', '_id name email')
    .sort({ dueDate: 1, createdAt: -1 });

  const tasksWithLinked = await Promise.all(
    tasks.map(async (task) => {
      const linkedEntity = await populateLinkedEntity(task);
      return toTaskResponse(task, linkedEntity);
    })
  );

  return tasksWithLinked;
}

export async function getTasksByOwner(ownerId: string): Promise<TaskResponse[]> {
  await dbConnect();

  const tasks = await Task.find({ ownerId })
    .populate('priorityId', '_id name properties')
    .populate('assigneeId', '_id name email')
    .sort({ dueDate: 1, createdAt: -1 });

  const tasksWithLinked = await Promise.all(
    tasks.map(async (task) => {
      const linkedEntity = await populateLinkedEntity(task);
      return toTaskResponse(task, linkedEntity);
    })
  );

  return tasksWithLinked;
}
