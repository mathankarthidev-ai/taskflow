import { User, UserRole, TeamName, CompanyBranch, WorkMode } from '@/types';
import { connectDB } from '@/lib/db';
import { User as UserModel } from '@/models/User';
import { mockStore } from '@/lib/mock-store';

const EMAIL_ALIASES: Record<string, string> = {
  'krithikashri@ambizcon.com': 'kiruthikashri@ambizcon.com',
  'kiruthikashri@ambizcon.com': 'krithikashri@ambizcon.com',
  'mathi@ambizcon.com': 'mathi.p@ambizcon.com',
  'mathi.p@ambizcon.com': 'mathi@ambizcon.com',
};

export async function getUserByEmail(email: string): Promise<User | null> {
  const normEmail = email.toLowerCase().trim();
  const alias = EMAIL_ALIASES[normEmail];
  const queryEmails = alias ? [normEmail, alias] : [normEmail];

  const db = await connectDB();

  if (db) {
    try {
      let doc = await UserModel.findOne({ email: { $in: queryEmails } }).lean();
      if (doc) {
        // If doc had old alias in DB, update it to primary normEmail
        if (
          doc.email.toLowerCase() !== normEmail &&
          (normEmail === 'kiruthikashri@ambizcon.com' || normEmail === 'mathi.p@ambizcon.com')
        ) {
          await UserModel.findByIdAndUpdate(doc._id, { email: normEmail });
          doc.email = normEmail;
        }
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

  // Fallback to mock store (checks primary and alias)
  let user = mockStore.users.find(
    (u) => u.email.toLowerCase() === normEmail || (alias && u.email.toLowerCase() === alias)
  );

  // If found in mock store but DB didn't have it, auto-insert into DB
  if (user && db) {
    try {
      const created = await UserModel.create({
        name: user.name,
        email: user.email.toLowerCase(),
        role: user.role,
        team: user.team,
        company: user.company || 'Ambizcon Health - India',
        avatar: user.avatar,
        birthday: user.birthday,
        dob: user.dob,
        workMode: user.workMode || 'Work From Office',
      });
      user._id = created._id.toString();
    } catch (e) {
      // ignore duplicate
    }
  }

  return user || null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await connectDB();

  if (db) {
    try {
      const docs = await UserModel.find().sort({ createdAt: -1 }).lean();
      if (docs.length > 0) {
        const dbUsers: User[] = docs.map((doc) => ({
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

        // Merge any seed users that might not yet be in MongoDB (e.g. Adriana Ruju)
        for (const seed of mockStore.users) {
          const exists = dbUsers.some(
            (u) =>
              u.email.toLowerCase() === seed.email.toLowerCase() ||
              (EMAIL_ALIASES[seed.email.toLowerCase()] &&
                u.email.toLowerCase() === EMAIL_ALIASES[seed.email.toLowerCase()])
          );
          if (!exists) {
            dbUsers.push(seed);
            UserModel.create({
              name: seed.name,
              email: seed.email.toLowerCase(),
              role: seed.role,
              team: seed.team,
              company: seed.company,
              avatar: seed.avatar,
              birthday: seed.birthday,
              dob: seed.dob,
              workMode: seed.workMode,
            }).catch(() => {});
          }
        }

        return dbUsers;
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
  birthday?: string;
  dob?: string;
  workMode?: WorkMode;
}): Promise<User> {
  const db = await connectDB();
  const avatar = input.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`;
  const company = input.company || 'Ambizcon Health - India';
  const birthday = input.birthday || '14 Oct';
  const dob = input.dob || '14 Oct';
  const workMode = input.workMode || 'Work From Office';

  if (db) {
    try {
      const doc = await UserModel.create({
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        team: input.team,
        company,
        avatar,
        birthday,
        dob,
        workMode,
      });

      return {
        _id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        role: doc.role,
        team: doc.team,
        company: (doc as any).company || company,
        avatar: doc.avatar,
        birthday,
        dob,
        workMode,
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
    birthday,
    dob,
    workMode,
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

export async function updateUserProfile(
  userId: string,
  profileData: {
    name?: string;
    avatar?: string;
    phone?: string;
    emergencyContact?: string;
    address?: string;
    bloodGroup?: string;
    birthday?: string;
    dob?: string;
    workMode?: WorkMode;
    education?: any[];
    experience?: any[];
    skills?: string[];
  }
): Promise<User | null> {
  const db = await connectDB();

  // Non-sensitive fields only (Strict Whitelist)
  const allowedUpdates: Record<string, any> = {};
  if (profileData.name !== undefined) allowedUpdates.name = profileData.name;
  if (profileData.avatar !== undefined) allowedUpdates.avatar = profileData.avatar;
  if (profileData.phone !== undefined) allowedUpdates.phone = profileData.phone;
  if (profileData.emergencyContact !== undefined) allowedUpdates.emergencyContact = profileData.emergencyContact;
  if (profileData.address !== undefined) allowedUpdates.address = profileData.address;
  if (profileData.bloodGroup !== undefined) allowedUpdates.bloodGroup = profileData.bloodGroup;
  if (profileData.birthday !== undefined) allowedUpdates.birthday = profileData.birthday;
  if (profileData.dob !== undefined) allowedUpdates.dob = profileData.dob;
  if (profileData.workMode !== undefined) allowedUpdates.workMode = profileData.workMode;
  if (profileData.education !== undefined) allowedUpdates.education = profileData.education;
  if (profileData.experience !== undefined) allowedUpdates.experience = profileData.experience;
  if (profileData.skills !== undefined) allowedUpdates.skills = profileData.skills;

  if (db) {
    try {
      const doc = await UserModel.findByIdAndUpdate(userId, allowedUpdates, { new: true }).lean();
      if (doc) {
        return {
          _id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          team: doc.team,
          company: (doc as any).company,
          avatar: doc.avatar,
          birthday: (doc as any).birthday,
          dob: (doc as any).dob,
          workMode: (doc as any).workMode,
          phone: (doc as any).phone,
          emergencyContact: (doc as any).emergencyContact,
          address: (doc as any).address,
          bloodGroup: (doc as any).bloodGroup,
          education: (doc as any).education,
          experience: (doc as any).experience,
          skills: (doc as any).skills,
          createdAt: doc.createdAt?.toISOString(),
        };
      }
    } catch (e) {
      console.error('Error updating user profile in DB:', e);
    }
  }

  const u = mockStore.users.find((user) => user._id === userId);
  if (u) {
    Object.assign(u, allowedUpdates);
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
