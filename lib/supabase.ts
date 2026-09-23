import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekdrfcopnnuaargnusav.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_PYvpiX5aQwMfO7IV2Ut-ww_Tlmaz6CW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
