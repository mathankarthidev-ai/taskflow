import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl =
  rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
    ? rawUrl
    : 'https://ekdrfcopnnuaargnusav.supabase.co';

const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAnonKey =
  rawKey && rawKey !== '[SENSITIVE]' && rawKey.length > 10
    ? rawKey
    : 'sb_publishable_PYvpiX5aQwMfO7IV2Ut-ww_Tlmaz6CW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

