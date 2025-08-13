import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in .env');
}

// This is the global, unscoped client.
// It's useful for RPC calls that are SECURITY DEFINER and don't rely on RLS headers.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This factory creates a Supabase client that is "scoped" with the necessary
// headers for your Row Level Security policies. Use this for any queries
// that need to be authorized based on the group's access key.
export const createScopedSupabaseClient = (
  groupName: string,
  accessKey: string
): SupabaseClient => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-group-name': groupName,
        'x-access-key': accessKey,
      },
    },
  });
};