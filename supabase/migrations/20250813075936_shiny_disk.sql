/*
  # Fix Real-time Functionality

  1. Security Updates
    - Fix RLS policies to allow proper real-time access
    - Enable real-time on tables
    - Add proper policies for anonymous users

  2. Real-time Configuration
    - Enable real-time replication on both tables
    - Fix policy permissions for real-time subscriptions
*/

-- Enable real-time on tables
ALTER PUBLICATION supabase_realtime ADD TABLE counter_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE counters;

-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Allow access with valid key" ON counter_groups;
DROP POLICY IF EXISTS "Allow access with valid group" ON counters;

-- Counter groups policies
CREATE POLICY "Enable read access for all users" ON counter_groups
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON counter_groups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON counter_groups
  FOR UPDATE USING (true);

-- Counters policies  
CREATE POLICY "Enable all access for counters" ON counters
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON counter_groups TO anon, authenticated;
GRANT ALL ON counters TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;