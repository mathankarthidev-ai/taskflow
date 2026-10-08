'use server';

import { getUserByEmail, getAllUsers, updateUserRole, updateUser, updateUserProfile, createUser, deleteUser } from '@/services/authService';
import { UserRole, TeamName, CompanyBranch, WorkMode, EducationRecord, ExperienceRecord } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getUserByEmailAction(email: string) {
  return await getUserByEmail(email);
}

export async function fetchAllUsersAction() {
  return await getAllUsers();
}

export async function createUserAction(data: {
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  company?: CompanyBranch;
  avatar?: string;
  birthday?: string;
  dob?: string;
  workMode?: WorkMode;
}) {
  const newUser = await createUser(data);
  revalidatePath('/users');
  return newUser;
}

export async function updateUserAction(
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
) {
  const updated = await updateUser(userId, updates);
  revalidatePath('/users');
  return updated;
}

export async function updateUserProfileSectionAction(
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
    education?: EducationRecord[];
    experience?: ExperienceRecord[];
    skills?: string[];
  }
) {
  const updated = await updateUserProfile(userId, profileData);
  revalidatePath('/profile');
  revalidatePath('/users');
  return updated;
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  const updated = await updateUserRole(userId, role);
  revalidatePath('/users');
  return updated;
}

export async function deleteUserAction(userId: string) {
  const success = await deleteUser(userId);
  revalidatePath('/users');
  return success;
}
