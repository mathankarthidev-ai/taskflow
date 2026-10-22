import { User, UserRole, TeamName, CompanyBranch, WorkMode } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { resolveEffectiveCompany } from '@/lib/company-filter';
import { getEmployeeNumber } from '@/lib/utils';

const EMAIL_ALIASES: Record<string, string> = {
  'krithikashri@ambizcon.com': 'kiruthikashri@ambizcon.com',
  'kiruthikashri@ambizcon.com': 'krithikashri@ambizcon.com',
  'mathi@ambizcon.com': 'mathi.p@ambizcon.com',
  'mathi.p@ambizcon.com': 'mathi@ambizcon.com',
};

function mapRowToUser(row: any): User {
  const resolvedCompany = resolveEffectiveCompany({
    email: row.email,
    name: row.name,
    role: row.role,
    company: row.company,
  });

  return {
    _id: String(row.id),
    employeeNumber: row.employee_number || getEmployeeNumber({ ...row, _id: String(row.id) }),
    name: row.name,
    email: row.email,
    role: row.role,
    team: row.team,
    company: resolvedCompany,
    avatar: row.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(row.name || 'User')}`,
    birthday: row.birthday,
    dob: row.dob,
    workMode: row.work_mode || 'Work From Office',
    skills: Array.isArray(row.skills) ? row.skills : [],
    permissionCount: row.permission_count || 0,
    hasResetPassword: Boolean(row.has_reset_password),
    phone: row.phone,
    emergencyContact: row.emergency_contact,
    address: row.address,
    bankAccount: row.bank_account,
    taxId: row.tax_id,
    bloodGroup: row.blood_group,
    education: Array.isArray(row.education) ? row.education : [],
    experience: Array.isArray(row.experience) ? row.experience : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normEmail = email.toLowerCase().trim();
  const alias = EMAIL_ALIASES[normEmail];
  const queryEmails = alias ? [normEmail, alias] : [normEmail];

  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select('*')
      .in('email', queryEmails)
      .limit(1);

    if (!error && rows && rows.length > 0) {
      const row = rows[0];
      if (
        row.email.toLowerCase() !== normEmail &&
        (normEmail === 'kiruthikashri@ambizcon.com' || normEmail === 'mathi.p@ambizcon.com')
      ) {
        await supabase.from('users').update({ email: normEmail }).eq('id', row.id);
        row.email = normEmail;
      }
      return mapRowToUser(row);
    }
  } catch (e) {
    console.error('Error fetching user from Supabase:', e);
  }

  // Fallback to seed users & auto-upsert into Supabase
  const seedUser = mockStore.users.find(
    (u) => u.email.toLowerCase() === normEmail || (alias && u.email.toLowerCase() === alias)
  );

  if (seedUser) {
    try {
      await supabase.from('users').upsert(
        {
          id: seedUser._id,
          name: seedUser.name,
          email: seedUser.email.toLowerCase(),
          role: seedUser.role,
          team: seedUser.team,
          company: resolveEffectiveCompany(seedUser),
          avatar: seedUser.avatar,
          birthday: seedUser.birthday,
          dob: seedUser.dob,
          work_mode: seedUser.workMode || 'Work From Office',
          skills: seedUser.skills || [],
        },
        { onConflict: 'email' }
      );
    } catch (_) {}
  }

  return seedUser || null;
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && rows && rows.length > 0) {
      const dbUsers: User[] = rows.map(mapRowToUser);

      // Sync any custom avatars from Supabase into in-memory mockStore.users & tasks
      for (const dbU of dbUsers) {
        const memU = mockStore.users.find(
          (mu) =>
            mu._id === dbU._id ||
            mu.email.toLowerCase() === dbU.email.toLowerCase()
        );
        if (memU && dbU.avatar) {
          memU.avatar = dbU.avatar;
        }
      }

      // Ensure all seed users exist in Supabase
      for (const seed of mockStore.users) {
        const exists = dbUsers.some(
          (u) =>
            u.email.toLowerCase() === seed.email.toLowerCase() ||
            (EMAIL_ALIASES[seed.email.toLowerCase()] &&
              u.email.toLowerCase() === EMAIL_ALIASES[seed.email.toLowerCase()])
        );
        if (!exists) {
          dbUsers.push(seed);
          supabase
            .from('users')
            .upsert(
              {
                id: seed._id,
                name: seed.name,
                email: seed.email.toLowerCase(),
                role: seed.role,
                team: seed.team,
                company: seed.company,
                avatar: seed.avatar,
                birthday: seed.birthday,
                dob: seed.dob,
                work_mode: seed.workMode || 'Work From Office',
                skills: seed.skills || [],
              },
              { onConflict: 'email' }
            )
            .then(() => {});
        }
      }

      return dbUsers;
    }
  } catch (e) {
    console.error('Error fetching users from Supabase:', e);
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
  const newId = `usr_${Date.now()}`;
  const avatar = input.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.name)}`;
  const company = input.company || 'Ambizcon Health - India';
  const birthday = input.birthday || '';
  const dob = input.dob || '';
  const workMode = input.workMode || 'Work From Office';
  const nowIso = new Date().toISOString();

  const newUser: User = {
    _id: newId,
    employeeNumber: getEmployeeNumber({ name: input.name, email: input.email, _id: newId }, mockStore.users.length),
    name: input.name,
    email: input.email.toLowerCase().trim(),
    role: input.role,
    team: input.team,
    company,
    avatar,
    birthday,
    dob,
    workMode,
    createdAt: nowIso,
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: newId,
          employee_number: newUser.employeeNumber,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          team: newUser.team,
          company: newUser.company,
          avatar: newUser.avatar,
          birthday: newUser.birthday,
          dob: newUser.dob,
          work_mode: newUser.workMode,
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'email' }
      )
      .select('*')
      .single();

    if (!error && data) {
      const mapped = mapRowToUser(data);
      mockStore.users.unshift(mapped);
      return mapped;
    }
  } catch (e) {
    console.error('Error creating user in Supabase:', e);
  }

  mockStore.users.unshift(newUser);
  return newUser;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (!error && data) {
      const u = mockStore.users.find((user) => user._id === userId);
      if (u) u.role = role;
      return mapRowToUser(data);
    }
  } catch (e) {
    console.error('Error updating user role in Supabase:', e);
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
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase().trim();
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.team !== undefined) dbUpdates.team = updates.team;
  if (updates.company !== undefined) dbUpdates.company = updates.company;
  if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
  if (updates.dob !== undefined) dbUpdates.dob = updates.dob;
  if (updates.workMode !== undefined) dbUpdates.work_mode = updates.workMode;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;

  try {
    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*')
      .single();

    if (!error && data) {
      const u = mockStore.users.find((user) => user._id === userId);
      if (u) Object.assign(u, updates);
      return mapRowToUser(data);
    }
  } catch (e) {
    console.error('Error updating user in Supabase:', e);
  }

  const u = mockStore.users.find(
    (user) => user._id === userId || user.email.toLowerCase() === updates.email?.toLowerCase()
  );
  if (u) {
    if (updates.name) u.name = updates.name;
    if (updates.email) u.email = updates.email.toLowerCase();
    if (updates.role) u.role = updates.role;
    if (updates.team) u.team = updates.team;
    if (updates.company) u.company = updates.company;
    if (updates.birthday) u.birthday = updates.birthday;
    if (updates.dob) u.dob = updates.dob;
    if (updates.workMode) u.workMode = updates.workMode;
    if (updates.avatar) u.avatar = updates.avatar;
    return { ...u };
  }
  return null;
}

export async function updateUserProfile(
  userId: string,
  profileData: {
    email?: string;
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
  const nowIso = new Date().toISOString();
  const memMatch = mockStore.users.find(
    (user) =>
      user._id === userId ||
      (profileData.email && user.email.toLowerCase() === profileData.email.toLowerCase().trim()) ||
      (profileData.name && user.name.toLowerCase() === profileData.name.toLowerCase().trim())
  );
  const resolvedEmail = (profileData.email || memMatch?.email || '').toLowerCase().trim();

  // 1. Update in-memory mockStore.users & tasks immediately
  if (memMatch) {
    const { email: _ignoreEmail, ...restProfile } = profileData;
    Object.assign(memMatch, restProfile);
    if (profileData.avatar !== undefined) {
      for (const t of mockStore.tasks) {
        if (
          t.assignedTo === memMatch._id ||
          t.assignedUser?._id === memMatch._id ||
          t.assignedUser?.email?.toLowerCase() === memMatch.email.toLowerCase()
        ) {
          if (t.assignedUser) t.assignedUser.avatar = profileData.avatar;
        }
        if (
          t.createdBy === memMatch._id ||
          t.createdByUser?._id === memMatch._id ||
          t.createdByUser?.email?.toLowerCase() === memMatch.email.toLowerCase()
        ) {
          if (t.createdByUser) t.createdByUser.avatar = profileData.avatar;
        }
      }
    }
  }

  // 2. First perform a dedicated, guaranteed avatar update in Supabase (by id and/or email)
  // so optional columns (education/experience) can never block avatar persistence
  let latestRow: any = null;
  if (profileData.avatar !== undefined) {
    try {
      const { data: byIdRows } = await supabase
        .from('users')
        .update({ avatar: profileData.avatar, updated_at: nowIso })
        .eq('id', userId)
        .select('*');

      if (byIdRows && byIdRows.length > 0) {
        latestRow = byIdRows[0];
      } else if (resolvedEmail) {
        const { data: byEmailRows } = await supabase
          .from('users')
          .update({ avatar: profileData.avatar, updated_at: nowIso })
          .ilike('email', resolvedEmail)
          .select('*');

        if (byEmailRows && byEmailRows.length > 0) {
          latestRow = byEmailRows[0];
        } else if (memMatch) {
          const { data: upserted } = await supabase
            .from('users')
            .upsert(
              {
                id: memMatch._id,
                name: profileData.name || memMatch.name,
                email: memMatch.email.toLowerCase(),
                role: memMatch.role,
                team: memMatch.team,
                company: memMatch.company,
                avatar: profileData.avatar,
                birthday: profileData.birthday || memMatch.birthday,
                dob: profileData.dob || memMatch.dob,
                work_mode: profileData.workMode || memMatch.workMode || 'Work From Office',
                skills: profileData.skills || memMatch.skills || [],
                updated_at: nowIso,
              },
              { onConflict: 'email' }
            )
            .select('*')
            .single();
          if (upserted) latestRow = upserted;
        }
      }
    } catch (e) {
      console.error('Error persisting user avatar in Supabase:', e);
    }
  }

  // 3. Also attempt full profile field update
  const dbUpdates: Record<string, any> = { updated_at: nowIso };
  if (profileData.name !== undefined) dbUpdates.name = profileData.name;
  if (profileData.avatar !== undefined) dbUpdates.avatar = profileData.avatar;
  if (profileData.phone !== undefined) dbUpdates.phone = profileData.phone;
  if (profileData.emergencyContact !== undefined) dbUpdates.emergency_contact = profileData.emergencyContact;
  if (profileData.address !== undefined) dbUpdates.address = profileData.address;
  if (profileData.bloodGroup !== undefined) dbUpdates.blood_group = profileData.bloodGroup;
  if (profileData.birthday !== undefined) dbUpdates.birthday = profileData.birthday;
  if (profileData.dob !== undefined) dbUpdates.dob = profileData.dob;
  if (profileData.workMode !== undefined) dbUpdates.work_mode = profileData.workMode;
  if (profileData.education !== undefined) dbUpdates.education = profileData.education;
  if (profileData.experience !== undefined) dbUpdates.experience = profileData.experience;
  if (profileData.skills !== undefined) dbUpdates.skills = profileData.skills;

  try {
    let query = supabase.from('users').update(dbUpdates);
    if (latestRow?.id) {
      query = query.eq('id', latestRow.id);
    } else if (resolvedEmail) {
      query = query.ilike('email', resolvedEmail);
    } else {
      query = query.eq('id', userId);
    }
    const { data, error } = await query.select('*').single();

    if (!error && data) {
      return mapRowToUser(data);
    }
  } catch (_) {
    // Optional profile columns may not exist in DB schema; avatar was already persisted in step 2
  }

  if (latestRow) {
    return mapRowToUser(latestRow);
  }

  if (memMatch) {
    return { ...memMatch };
  }
  return null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) {
      const index = mockStore.users.findIndex((u) => u._id === userId);
      if (index !== -1) mockStore.users.splice(index, 1);
      return true;
    }
  } catch (e) {
    console.error('Error deleting user in Supabase:', e);
  }

  const index = mockStore.users.findIndex((u) => u._id === userId);
  if (index !== -1) {
    mockStore.users.splice(index, 1);
    return true;
  }
  return false;
}
