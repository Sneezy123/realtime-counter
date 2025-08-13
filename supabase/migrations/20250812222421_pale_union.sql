/*
  # Real-Time Counter Groups Schema

  1. New Tables
    - `counter_groups`
      - `id` (uuid, primary key)
      - `name` (text, group name from URL)
      - `access_key_hash` (text, hashed access key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `counters`  
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to counter_groups)
      - `name` (text, counter display name)
      - `description` (text, counter description)
      - `value` (integer, current counter value)
      - `increment_step` (integer, step for increment, default 1)
      - `decrement_step` (integer, step for decrement, default 1)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access based on valid access keys
    - Create indexes for performance

  3. Functions
    - Function to validate access keys and return group data
    - Function to create new groups with secure keys
*/

-- Create counter_groups table
CREATE TABLE IF NOT EXISTS counter_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  access_key_hash text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create counters table
CREATE TABLE IF NOT EXISTS counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES counter_groups(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Counter',
  description text DEFAULT '',
  value integer DEFAULT 0,
  increment_step integer DEFAULT 1,
  decrement_step integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_counter_groups_access_key_hash ON counter_groups(access_key_hash);
CREATE INDEX IF NOT EXISTS idx_counters_group_id ON counters(group_id);
CREATE INDEX IF NOT EXISTS idx_counter_groups_name ON counter_groups(name);

-- Enable RLS
ALTER TABLE counter_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Create function to hash access keys (using built-in digest function)
CREATE OR REPLACE FUNCTION hash_access_key(access_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(access_key, 'sha256'), 'hex');
$$;

-- Create function to validate access and get group
CREATE OR REPLACE FUNCTION validate_access_key(group_name text, access_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  group_id uuid;
  key_hash text;
BEGIN
  key_hash := hash_access_key(access_key);
  
  SELECT id INTO group_id
  FROM counter_groups
  WHERE name = group_name AND access_key_hash = key_hash;
  
  RETURN group_id;
END;
$$;

-- Create function to create or get group
CREATE OR REPLACE FUNCTION create_or_get_group(group_name text, access_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  group_id uuid;
  key_hash text;
BEGIN
  key_hash := hash_access_key(access_key);
  
  -- Try to find existing group
  SELECT id INTO group_id
  FROM counter_groups
  WHERE name = group_name AND access_key_hash = key_hash;
  
  -- If not found, create new group
  IF group_id IS NULL THEN
    INSERT INTO counter_groups (name, access_key_hash)
    VALUES (group_name, key_hash)
    RETURNING id INTO group_id;
  END IF;
  
  RETURN group_id;
END;
$$;

-- Helper function to get the group_id from a custom request header
-- In your client, you would need to set this header for requests.
-- See Supabase docs for passing custom data for RLS.
CREATE OR REPLACE FUNCTION get_group_id_by_key(group_name text, access_key text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM counter_groups WHERE name = group_name AND access_key_hash = hash_access_key(access_key)
$$;

-- RLS Policies for counter_groups
CREATE POLICY "Allow access with valid key" ON counter_groups
  FOR ALL
  TO anon, authenticated
  USING (id = get_group_id_by_key(current_setting('request.headers', true)::json->>'x-group-name', current_setting('request.headers', true)::json->>'x-access-key'));

-- RLS Policies for counters
CREATE POLICY "Allow access with valid group" ON counters
  FOR ALL
  TO anon, authenticated
  USING (group_id = get_group_id_by_key(current_setting('request.headers', true)::json->>'x-group-name', current_setting('request.headers', true)::json->>'x-access-key'));

-- Update function to set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_counter_groups_updated_at BEFORE UPDATE ON counter_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();