-- Migration: Add group profile picture and display name functionality
-- This migration adds columns for profile image URL and display name to counter_groups table

-- Add new columns to counter_groups table
ALTER TABLE counter_groups 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create index for display name lookups
CREATE INDEX IF NOT EXISTS idx_counter_groups_display_name ON counter_groups(display_name);

-- Update existing records to set display_name equal to name
UPDATE counter_groups 
SET display_name = name 
WHERE display_name IS NULL;

-- Add comments for new columns
COMMENT ON COLUMN counter_groups.display_name IS 'Human-readable display name for the group (can be different from URL name)';
COMMENT ON COLUMN counter_groups.profile_image_url IS 'URL for the group profile picture';
