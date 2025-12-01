import type { Adapter, AdapterUser, AdapterAccount, AdapterSession } from 'next-auth/adapters';
import { connectToDatabase } from '@/lib/mongodb';
import User from './model';
import Account from './account.model';
import Session from './session.model';
import mongoose from 'mongoose';

export function MongooseAdapter(): Adapter {
  return {
    async createUser(data) {
      await connectToDatabase();
      const user = await User.create({
        email: data.email,
        name: data.name || data.email.split('@')[0],
        image: data.image || undefined,
      });
      return toAdapterUser(user);
    },

    async getUser(id) {
      await connectToDatabase();
      const user = await User.findById(id);
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      await connectToDatabase();
      const user = await User.findOne({ email });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      await connectToDatabase();
      const account = await Account.findOne({ provider, providerAccountId });
      if (!account) return null;
      const user = await User.findById(account.userId);
      return user ? toAdapterUser(user) : null;
    },

    async updateUser(data) {
      await connectToDatabase();
      const user = await User.findByIdAndUpdate(
        data.id,
        {
          name: data.name,
          email: data.email,
          image: data.image,
        },
        { new: true }
      );
      if (!user) throw new Error('User not found');
      return toAdapterUser(user);
    },

    async deleteUser(id) {
      await connectToDatabase();
      await Promise.all([
        User.findByIdAndDelete(id),
        Account.deleteMany({ userId: id }),
        Session.deleteMany({ userId: id }),
      ]);
    },

    async linkAccount(data) {
      await connectToDatabase();
      await Account.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state as string | undefined,
      });
      return data as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await connectToDatabase();
      await Account.findOneAndDelete({ provider, providerAccountId });
    },

    async createSession(data) {
      await connectToDatabase();
      const session = await Session.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        sessionToken: data.sessionToken,
        expires: data.expires,
      });
      return toAdapterSession(session);
    },

    async getSessionAndUser(sessionToken) {
      await connectToDatabase();
      const session = await Session.findOne({ sessionToken });
      if (!session) return null;
      const user = await User.findById(session.userId);
      if (!user) return null;
      return {
        session: toAdapterSession(session),
        user: toAdapterUser(user),
      };
    },

    async updateSession(data) {
      await connectToDatabase();
      const session = await Session.findOneAndUpdate(
        { sessionToken: data.sessionToken },
        { expires: data.expires },
        { new: true }
      );
      return session ? toAdapterSession(session) : null;
    },

    async deleteSession(sessionToken) {
      await connectToDatabase();
      await Session.findOneAndDelete({ sessionToken });
    },
  };
}

function toAdapterUser(user: InstanceType<typeof User>): AdapterUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image || null,
    emailVerified: null,
  };
}

function toAdapterSession(session: InstanceType<typeof Session>): AdapterSession {
  return {
    sessionToken: session.sessionToken,
    userId: session.userId.toString(),
    expires: session.expires,
  };
}
