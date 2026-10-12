import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekdrfcopnnuaargnusav.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PYvpiX5aQwMfO7IV2Ut-ww_Tlmaz6CW';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Default singleton browser client
export const supabase = createClient();
