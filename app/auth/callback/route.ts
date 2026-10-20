import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserByEmail } from '@/services/authService';
import { isUserInCompany } from '@/lib/company-filter';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const branch = searchParams.get('branch') || 'Ambizcon Health - India';

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const email = (data.user.email || '').toLowerCase().trim();

        // 1. Strict Domain Restriction: Must end with @ambizcon.com
        if (!email.endsWith('@ambizcon.com')) {
          await supabase.auth.signOut().catch(() => {});
          return NextResponse.redirect(`${origin}/login?error=domain_restricted`);
        }

        // 2. Fetch employee profile from Ambizcon directory
        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
          await supabase.auth.signOut().catch(() => {});
          return NextResponse.redirect(`${origin}/login?error=not_registered`);
        }

        // 3. Strict Branch Isolation: Check if user belongs to the selected company branch
        const isSuperAdmin = existingUser.role === 'Super Admin' || existingUser.role === 'Admin';
        const belongsToBranch = isUserInCompany(existingUser, branch);

        if (!belongsToBranch && !isSuperAdmin) {
          await supabase.auth.signOut().catch(() => {});
          const regBranch = existingUser.company || 'Ambizcon Health - India';
          return NextResponse.redirect(
            `${origin}/login?error=branch_mismatch&registered=${encodeURIComponent(regBranch)}&selected=${encodeURIComponent(branch)}`
          );
        }

        // 4. Successful Google Login: Set cookie and redirect to dashboard
        const response = NextResponse.redirect(`${origin}/dashboard`);
        const safeCookieAvatar =
          existingUser.avatar && existingUser.avatar.startsWith('data:image/')
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(existingUser.name)}`
            : existingUser.avatar;

        const cookieUser = {
          ...existingUser,
          avatar: safeCookieAvatar,
        };

        response.cookies.set('taskflow_user', encodeURIComponent(JSON.stringify(cookieUser)), {
          path: '/',
          maxAge: 864000,
          sameSite: 'lax',
        });

        return response;
      }
    } catch (e) {
      console.error('Error exchanging OAuth code for session:', e);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
