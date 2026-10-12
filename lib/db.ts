import { supabase } from '@/lib/supabase';

/**
 * 100% Unified Supabase PostgreSQL Database Connection
 * Returns the active Supabase client instance.
 */
export async function connectDB() {
  return supabase;
}

export { supabase };
