import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AppRole, Profile } from '@/types/database';
import { UserAuthContext } from './roles';

export interface CurrentUserSession {
  user: {
    id: string;
    email: string;
  };
  profile: Profile | null;
  role: AppRole;
  managedBusinessIds: string[];
}

export async function getCurrentUserSession(): Promise<CurrentUserSession | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 2. Fetch primary role (default to 'customer' if not assigned)
    const { data: roleRecord } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const role: AppRole = (roleRecord?.role as AppRole) || 'customer';

    // 3. Fetch businesses managed by this user
    const { data: memberships } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const managedBusinessIds = (memberships || []).map((m: { business_id: string }) => m.business_id);

    return {
      user: {
        id: user.id,
        email: user.email || '',
      },
      profile: profile || null,
      role,
      managedBusinessIds,
    };
  } catch (error) {
    console.error('Error fetching current user session:', error);
    return null;
  }
}

export async function requireAuth(): Promise<CurrentUserSession> {
  const session = await getCurrentUserSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<CurrentUserSession> {
  const session = await requireAuth();
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    throw new Error('Forbidden: Admin access required');
  }
  return session;
}
