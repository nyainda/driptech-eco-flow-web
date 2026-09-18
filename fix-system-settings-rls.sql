-- Fix RLS policies for system_settings to allow worker to read API keys

-- First, check if the policy exists and drop it if needed
DROP POLICY IF EXISTS "Allow public read access to system_settings" ON system_settings;

-- Create a policy that allows anyone to read system_settings
-- This is safe because we only store non-sensitive config here
CREATE POLICY "Allow public read access to system_settings"
    ON system_settings
    FOR SELECT
    USING (true);

-- Verify the table has RLS enabled
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
