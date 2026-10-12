import { AppRole } from '@/types/database';

// Role hierarchy rank (higher number = greater administrative authority)
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  guest: 0,
  customer: 10,
  business_owner: 20,
  sales_agent: 30,
  sales_manager: 40,
  moderator: 50,
  admin: 60,
  superadmin: 100,
};

export function hasMinimumRole(userRole: AppRole | undefined, requiredRole: AppRole): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

export function isAdmin(userRole: AppRole | undefined): boolean {
  return userRole === 'admin' || userRole === 'superadmin';
}

export function isModerator(userRole: AppRole | undefined): boolean {
  return userRole === 'moderator' || isAdmin(userRole);
}

export function isSalesUser(userRole: AppRole | undefined): boolean {
  return (
    userRole === 'sales_agent' ||
    userRole === 'sales_manager' ||
    isAdmin(userRole)
  );
}

export function isBusinessOwner(userRole: AppRole | undefined): boolean {
  return (
    userRole === 'business_owner' ||
    isAdmin(userRole)
  );
}

export interface UserAuthContext {
  userId: string;
  email: string;
  role: AppRole;
  managedBusinessIds: string[];
}

export function canManageBusiness(
  auth: UserAuthContext,
  businessId: string,
  businessOwnerId?: string
): boolean {
  if (isAdmin(auth.role)) return true;
  if (auth.managedBusinessIds.includes(businessId)) return true;
  if (businessOwnerId && auth.userId === businessOwnerId) return true;
  return false;
}
