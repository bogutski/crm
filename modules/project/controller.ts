import mongoose from 'mongoose';
import Project, { IProject } from './model';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectResponse,
  ProjectsListResponse,
  ProjectFilters,
  ProjectOwner,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';
import { safeEmitWebhookEvent } from '@/lib/events';

function toOwnerResponse(owner: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string } | undefined): ProjectOwner | null {
  if (!owner) return null;

  if (owner instanceof mongoose.Types.ObjectId) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = owner as any;
  if (!o._id) return null;

  return {
    id: o._id.toString(),
    name: o.name || '',
    email: o.email || '',
  };
}

function toProjectResponse(project: IProject): ProjectResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any;
  return {
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    status: project.status,
    deadline: project.deadline,
    owner: toOwnerResponse(p.ownerId),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function getProjects(filters: ProjectFilters): Promise<ProjectsListResponse> {
  await dbConnect();

  const { search, status, ownerId, deadlineFrom, deadlineTo, page = 1, limit = 30 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (ownerId) {
    query.ownerId = ownerId;
  }

  if (deadlineFrom || deadlineTo) {
    query.deadline = {};
    if (deadlineFrom) {
      (query.deadline as Record<string, unknown>).$gte = new Date(deadlineFrom);
    }
    if (deadlineTo) {
      (query.deadline as Record<string, unknown>).$lte = new Date(deadlineTo);
    }
  }

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('ownerId', '_id name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(query),
  ]);

  return {
    projects: projects.map(toProjectResponse),
    total,
    page,
    limit,
  };
}

export async function getProjectById(id: string): Promise<ProjectResponse | null> {
  await dbConnect();

  const project = await Project.findById(id)
    .populate('ownerId', '_id name email');

  if (!project) return null;

  return toProjectResponse(project);
}

export async function createProject(data: CreateProjectDTO): Promise<ProjectResponse> {
  await dbConnect();

  const project = await Project.create({
    name: data.name,
    description: data.description,
    status: data.status || 'active',
    deadline: data.deadline ? new Date(data.deadline) : undefined,
    ownerId: data.ownerId,
  });

  await project.populate('ownerId', '_id name email');

  const response = toProjectResponse(project);

  // Emit webhook event
  safeEmitWebhookEvent('project', 'created', response);

  return response;
}

export async function updateProject(
  id: string,
  data: UpdateProjectDTO
): Promise<ProjectResponse | null> {
  await dbConnect();

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.status !== undefined) updateData.status = data.status;

  // Handle nullable fields
  if (data.description === null) {
    await Project.findByIdAndUpdate(id, { $unset: { description: 1 } });
  } else if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.deadline === null) {
    await Project.findByIdAndUpdate(id, { $unset: { deadline: 1 } });
  } else if (data.deadline !== undefined) {
    updateData.deadline = new Date(data.deadline);
  }

  const project = await Project.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate('ownerId', '_id name email');

  if (!project) return null;

  const response = toProjectResponse(project);

  // Emit webhook event
  safeEmitWebhookEvent('project', 'updated', response);

  return response;
}

export async function deleteProject(id: string): Promise<boolean> {
  await dbConnect();

  const result = await Project.findByIdAndDelete(id);

  if (result) {
    // Emit webhook event
    safeEmitWebhookEvent('project', 'deleted', { id });
  }

  return !!result;
}

export async function getProjectsByOwner(ownerId: string): Promise<ProjectResponse[]> {
  await dbConnect();

  const projects = await Project.find({ ownerId })
    .populate('ownerId', '_id name email')
    .sort({ createdAt: -1 });

  return projects.map(toProjectResponse);
}
