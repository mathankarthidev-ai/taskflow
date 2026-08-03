import { User, UserRole, TeamName } from '@/types';
import { connectDB } from '@/lib/db';
import { User as UserModel } from '@/models/User';
import { mockStore } from '@/lib/mock-store';

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await connectDB();

  if (db) {
    try {
      const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
      if (doc) {
        return {
          _id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          team: doc.team,
          avatar: doc.avatar,
          createdAt: doc.createdAt?.toISOString(),
        };
      }
    } catch (e) {
      console.error('Error fetching user from DB:', e);
    }
  }

  // Fallback to mock store
  const user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return user || null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await connectDB();

  if (db) {
    try {
      const docs = await UserModel.find().sort({ createdAt: -1 }).lean();
      if (docs.length > 0) {
        return docs.map((doc) => ({
          _id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          team: doc.team,
          avatar: doc.avatar,
          createdAt: doc.createdAt?.toISOString(),
        }));
      }
    } catch (e) {
      console.error('Error fetching users from DB:', e);
    }
  }

  return mockStore.users;
}

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  avatar?: string;
}): Promise<User> {
  const db = await connectDB();
  const avatar = input.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`;

  if (db) {
    try {
      const doc = await UserModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        team: input.team,
        avatar,
      });

      return {
        _id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        team: doc.team,
        avatar: doc.avatar,
        createdAt: doc.createdAt.toISOString(),
      };
    } catch (e) {
      console.error('Error creating user in DB:', e);
    }
  }

  const newUser: User = {
    _id: `usr_${Date.now()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    team: input.team,
    avatar,
    createdAt: new Date().toISOString(),
  };

  mockStore.users.unshift(newUser);
  return newUser;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User | null> {
  const db = await connectDB();

  if (db) {
    try {
      const doc = await UserModel.findByIdAndUpdate(userId, { role }, { new: true }).lean();
      if (doc) {
        return {
          _id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          team: doc.team,
          avatar: doc.avatar,
        };
      }
    } catch (e) {
      console.error('Error updating user role:', e);
    }
  }

  const u = mockStore.users.find((user) => user._id === userId);
  if (u) {
    u.role = role;
    return { ...u };
  }
  return null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = await connectDB();

  if (db) {
    try {
      await UserModel.findByIdAndDelete(userId);
      return true;
    } catch (e) {
      console.error('Error deleting user in DB:', e);
    }
  }

  const index = mockStore.users.findIndex((u) => u._id === userId);
  if (index !== -1) {
    mockStore.users.splice(index, 1);
    return true;
  }
  return false;
}
