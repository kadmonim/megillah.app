import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = import.meta.env.PUBLIC_SUPABASE_URL || '';
    const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase URL and key must be configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}
