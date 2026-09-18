-- Migration: Fix Critical RLS Policies
-- Date: 2026-01-19
-- Description: Locks down permissive policies on analytics and communication tables.

-- 1. Ensure is_admin() is robust (Update if exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND (
        -- Check app_metadata (secure)
        raw_app_meta_data->>'role' = 'admin' 
        OR 
        -- Check user_metadata (legacy, less secure but keeps compat)
        raw_user_meta_data->>'role' = 'admin'
        OR
        -- Hardcoded Domain Security as fallback
        email LIKE '%@driptech.com'
    )
  );
END;
$$;

-- =================================================================
-- VISITOR TRACKING TABLES (visitor_sessions, page_views, product_interactions)
-- =================================================================

DO $$
BEGIN
    -- Check if visitor_sessions exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visitor_sessions') THEN
        -- Drop existing insecure policies
        DROP POLICY IF EXISTS "Allow all operations on visitor_sessions" ON visitor_sessions;
        
        -- Policy: visitor_sessions
        -- Allow Public Insert (Tracking)
        DROP POLICY IF EXISTS "Public can insert visitor_sessions" ON visitor_sessions;
        CREATE POLICY "Public can insert visitor_sessions" ON visitor_sessions
            FOR INSERT WITH CHECK (true);

        -- Allow Admin Select/Update/Delete
        DROP POLICY IF EXISTS "Admins can view visitor_sessions" ON visitor_sessions;
        CREATE POLICY "Admins can view visitor_sessions" ON visitor_sessions
            FOR SELECT USING (is_admin());

        DROP POLICY IF EXISTS "Admins can update visitor_sessions" ON visitor_sessions;
        CREATE POLICY "Admins can update visitor_sessions" ON visitor_sessions
            FOR UPDATE USING (is_admin());

        DROP POLICY IF EXISTS "Admins can delete visitor_sessions" ON visitor_sessions;
        CREATE POLICY "Admins can delete visitor_sessions" ON visitor_sessions
            FOR DELETE USING (is_admin());
    END IF;

    -- Check if page_views exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'page_views') THEN
        DROP POLICY IF EXISTS "Allow all operations on page_views" ON page_views;
        
        DROP POLICY IF EXISTS "Public can insert page_views" ON page_views;
        CREATE POLICY "Public can insert page_views" ON page_views
            FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Admins can view page_views" ON page_views;
        CREATE POLICY "Admins can view page_views" ON page_views
            FOR SELECT USING (is_admin());

        DROP POLICY IF EXISTS "Admins can delete page_views" ON page_views;
        CREATE POLICY "Admins can delete page_views" ON page_views
            FOR DELETE USING (is_admin());
    END IF;

    -- Check if product_interactions exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_interactions') THEN
        DROP POLICY IF EXISTS "Allow all operations on product_interactions" ON product_interactions;

        DROP POLICY IF EXISTS "Public can insert product_interactions" ON product_interactions;
        CREATE POLICY "Public can insert product_interactions" ON product_interactions
            FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Admins can view product_interactions" ON product_interactions;
        CREATE POLICY "Admins can view product_interactions" ON product_interactions
            FOR SELECT USING (is_admin());

        DROP POLICY IF EXISTS "Admins can delete product_interactions" ON product_interactions;
        CREATE POLICY "Admins can delete product_interactions" ON product_interactions
            FOR DELETE USING (is_admin());
    END IF;
END $$;


-- =================================================================
-- WHATSAPP TABLES (Strictly Admin Only)
-- =================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_messages') THEN
        -- Drop existing authenticated policies
        DROP POLICY IF EXISTS "Admins can view all whatsapp messages" ON whatsapp_messages;
        DROP POLICY IF EXISTS "Admins can insert whatsapp messages" ON whatsapp_messages;
        DROP POLICY IF EXISTS "Admins can update whatsapp messages" ON whatsapp_messages;
        DROP POLICY IF EXISTS "Admins can delete whatsapp messages" ON whatsapp_messages;

        -- Create New Strict Policies using is_admin()
        DROP POLICY IF EXISTS "Strict Admin view messages" ON whatsapp_messages;
        CREATE POLICY "Strict Admin view messages" ON whatsapp_messages
            FOR SELECT USING (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin insert messages" ON whatsapp_messages;
        CREATE POLICY "Strict Admin insert messages" ON whatsapp_messages
            FOR INSERT WITH CHECK (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin update messages" ON whatsapp_messages;
        CREATE POLICY "Strict Admin update messages" ON whatsapp_messages
            FOR UPDATE USING (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin delete messages" ON whatsapp_messages;
        CREATE POLICY "Strict Admin delete messages" ON whatsapp_messages
            FOR DELETE USING (is_admin());
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_conversations') THEN
        DROP POLICY IF EXISTS "Admins can view all conversations" ON whatsapp_conversations;
        DROP POLICY IF EXISTS "Admins can insert conversations" ON whatsapp_conversations;
        DROP POLICY IF EXISTS "Admins can update conversations" ON whatsapp_conversations;
        DROP POLICY IF EXISTS "Admins can delete conversations" ON whatsapp_conversations;

        DROP POLICY IF EXISTS "Strict Admin view conversations" ON whatsapp_conversations;
        CREATE POLICY "Strict Admin view conversations" ON whatsapp_conversations
            FOR SELECT USING (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin insert conversations" ON whatsapp_conversations;
        CREATE POLICY "Strict Admin insert conversations" ON whatsapp_conversations
            FOR INSERT WITH CHECK (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin update conversations" ON whatsapp_conversations;
        CREATE POLICY "Strict Admin update conversations" ON whatsapp_conversations
            FOR UPDATE USING (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin delete conversations" ON whatsapp_conversations;
        CREATE POLICY "Strict Admin delete conversations" ON whatsapp_conversations
            FOR DELETE USING (is_admin());
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_config') THEN
        DROP POLICY IF EXISTS "Admins can view whatsapp config" ON whatsapp_config;
        DROP POLICY IF EXISTS "Admins can insert whatsapp config" ON whatsapp_config;
        DROP POLICY IF EXISTS "Admins can update whatsapp config" ON whatsapp_config;

        DROP POLICY IF EXISTS "Strict Admin view config" ON whatsapp_config;
        CREATE POLICY "Strict Admin view config" ON whatsapp_config
            FOR SELECT USING (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin insert config" ON whatsapp_config;
        CREATE POLICY "Strict Admin insert config" ON whatsapp_config
            FOR INSERT WITH CHECK (is_admin());
            
        DROP POLICY IF EXISTS "Strict Admin update config" ON whatsapp_config;
        CREATE POLICY "Strict Admin update config" ON whatsapp_config
            FOR UPDATE USING (is_admin());
    END IF;
END $$;


-- =================================================================
-- NEWSLETTER TABLE
-- =================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers') THEN
        -- Drop existing public select
        DROP POLICY IF EXISTS "Allow public to read own subscriber status" ON newsletter_subscribers;

        -- Add restricted select
        DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscribers;
        CREATE POLICY "Admins can view subscribers" ON newsletter_subscribers
            FOR SELECT USING (is_admin());
    END IF;
END $$;
