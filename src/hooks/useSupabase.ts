import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CounterGroup {
  id: string;
  name: string;
  access_key_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Counter {
  id: string;
  group_id: string;
  name: string;
  description: string;
  value: number;
  increment_step: number;
  decrement_step: number;
  created_at: string;
  updated_at: string;
}