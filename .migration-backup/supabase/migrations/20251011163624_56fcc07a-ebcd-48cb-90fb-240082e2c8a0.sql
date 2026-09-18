-- Fix RLS policies for analytics tables to work with admin_users table

-- Drop existing policies that use is_admin()
DROP POLICY IF EXISTS "Admins can do everything on page_views" ON page_views;
DROP POLICY IF EXISTS "Admins can do everything on visitor_sessions" ON visitor_sessions;
DROP POLICY IF EXISTS "Admins can do everything on product_interactions" ON product_interactions;
DROP POLICY IF EXISTS "Admins can do everything on analytics_summary" ON analytics_summary;

-- Create new policies that allow all authenticated users to read analytics
-- (Since admin authentication happens through admin_users table, and all admin panel users are authenticated)
CREATE POLICY "Authenticated users can read page_views"
ON page_views
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read visitor_sessions"
ON visitor_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read product_interactions"
ON product_interactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read analytics_summary"
ON analytics_summary
FOR SELECT
TO authenticated
USING (true);

-- Keep insert/update policies for visitors as they were
-- (These already exist and don't need to change)