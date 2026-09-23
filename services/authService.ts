import { User, UserRole, TeamName, CompanyBranch, WorkMode } from '@/types';
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
          company: (doc as any).company || 'Ambizcon Health - India',
          avatar: doc.avatar,
          birthday: (doc as any).birthday,
          dob: (doc as any).dob,
          workMode: (doc as any).workMode || 'Work From Office',
          permissionCount: (doc as any).permissionCount || 0,
          phone: (doc as any).phone,
          emergencyContact: (doc as any).emergencyContact,
          address: (doc as any).address,
          bankAccount: (doc as any).bankAccount,
          taxId: (doc as any).taxId,
          bloodGroup: (doc as any).bloodGroup,
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
          company: (doc as any).company || 'Ambizcon Health - India',
          avatar: doc.avatar,
          birthday: (doc as any).birthday,
          dob: (doc as any).dob,
          workMode: (doc as any).workMode || 'Work From Office',
          permissionCount: (doc as any).permissionCount || 0,
          phone: (doc as any).phone,
          emergencyContact: (doc as any).emergencyContact,
          address: (doc as any).address,
          bankAccount: (doc as any).bankAccount,
          taxId: (doc as any).taxId,
          bloodGroup: (doc as any).bloodGroup,
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
  company?: CompanyBranch;
  avatar?: string;
}): Promise<User> {
  const db = await connectDB();
  const avatar = input.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`;
  const company = input.company || 'Ambizcon Health - India';

  if (db) {
    try {
      const doc = await UserModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        team: input.team,
        company,
        avatar,
      });

      return {
        _id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        team: doc.team,
        company: (doc as any).company || company,
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
    company,
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

export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    role?: UserRole;
    team?: TeamName;
    company?: CompanyBranch;
    birthday?: string;
    dob?: string;
    workMode?: WorkMode;
    avatar?: string;
  }
): Promise<User | null> {
  const db = await connectDB();

  if (db) {
    try {
      const doc = await UserModel.findByIdAndUpdate(userId, updates, { new: true }).lean();
      if (doc) {
        return {
          _id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          team: doc.team,
          company: (doc as any).company || updates.company || 'Ambizcon Health - India',
          avatar: doc.avatar,
          birthday: (doc as any).birthday || updates.birthday,
          dob: (doc as any).dob || updates.dob,
          createdAt: doc.createdAt?.toISOString(),
        };
      }
    } catch (e) {
      console.error('Error updating user in DB:', e);
    }
  }

  const u = mockStore.users.find((user) => user._id === userId || user.email.toLowerCase() === updates.email?.toLowerCase());
  if (u) {
    if (updates.name) u.name = updates.name;
    if (updates.email) u.email = updates.email.toLowerCase();
    if (updates.role) u.role = updates.role;
    if (updates.team) u.team = updates.team;
    if (updates.company) u.company = updates.company;
    if (updates.birthday) u.birthday = updates.birthday;
    if (updates.dob) u.dob = updates.dob;
    if (updates.workMode) (u as any).workMode = updates.workMode;
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
