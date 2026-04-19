import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in .env (VITE_ prefixes required)');
    // En desarrollo, esto ayudará a debuguear rápidamente
    if (import.meta.env.DEV) {
       console.warn('VITE_SUPABASE_URL:', supabaseUrl);
    }
  }

  supabaseInstance = createSupabaseClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseInstance;
}
