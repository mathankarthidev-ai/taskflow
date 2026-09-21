'use server';

import { getUserByEmail, getAllUsers, updateUserRole, createUser, deleteUser } from '@/services/authService';
import { UserRole, TeamName, CompanyBranch } from '@/types';
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
}) {
  const newUser = await createUser(data);
  revalidatePath('/users');
  return newUser;
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
