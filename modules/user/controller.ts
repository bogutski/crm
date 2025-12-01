import bcrypt from 'bcryptjs';
import User, { IUser } from './model';
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponse,
  UsersListResponse,
  UserFilters,
} from './types';
import { connectToDatabase as dbConnect } from '@/lib/mongodb';

function toUserResponse(user: IUser): UserResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
    roles: user.roles,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUsers(filters: UserFilters): Promise<UsersListResponse> {
  await dbConnect();

  const { search, role, isActive, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.roles = role;
  }

  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map(toUserResponse),
    total,
    page,
    limit,
  };
}

export async function getUserById(id: string): Promise<UserResponse | null> {
  await dbConnect();

  const user = await User.findById(id);
  if (!user) return null;

  return toUserResponse(user);
}

export async function getUserByEmail(email: string): Promise<UserResponse | null> {
  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  return toUserResponse(user);
}

export async function createUser(data: CreateUserDTO): Promise<UserResponse> {
  await dbConnect();

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  let passwordHash: string | undefined;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const user = await User.create({
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash,
    roles: data.roles || ['user'],
    googleId: data.googleId,
    image: data.image,
  });

  return toUserResponse(user);
}

export async function updateUser(
  id: string,
  data: UpdateUserDTO
): Promise<UserResponse | null> {
  await dbConnect();

  if (data.email) {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    data.email = data.email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!user) return null;

  return toUserResponse(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  await dbConnect();

  const result = await User.findByIdAndDelete(id);
  return !!result;
}

export async function updateLastLogin(id: string): Promise<void> {
  await dbConnect();

  await User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<UserResponse | null> {
  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return toUserResponse(user);
}
