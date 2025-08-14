/*
  # Add Thumbnail URL Support to Counters

  1. Schema Update
    - Add thumbnail_url column to counters table
    - Allow NULL values for optional thumbnails
    - Add index for performance

  2. Real-time Configuration
    - Update real-time publication to include new column
    - Ensure real-time subscriptions include thumbnail_url
*/

-- Add thumbnail_url column to counters table
ALTER TABLE counters 
ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT NULL;

-- Create index for performance on thumbnail_url lookups
CREATE INDEX IF NOT EXISTS idx_counters_thumbnail_url ON counters(thumbnail_url) 
WHERE thumbnail_url IS NOT NULL;

-- Update real-time publication to include new column
-- This is automatically handled by Supabase for new columns
-- No manual changes needed to publication

-- Update the Counter interface in the application
-- This will be handled in the TypeScript code
